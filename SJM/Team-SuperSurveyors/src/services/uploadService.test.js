import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UploadWidget } from './uploadService';
import * as firebase from '../firebase';

jest.mock('../firebase', () => ({
  db: {},
  collection: jest.fn().mockReturnValue('mediaCollectionRef'),
  addDoc: jest.fn().mockResolvedValue({ id: 'newDoc' }),
}));

describe('UploadWidget', () => {
  let fakeWidget;

  beforeEach(() => {
    jest.clearAllMocks();
    fakeWidget = { open: jest.fn() };

    Object.defineProperty(window, 'cloudinary', {
      value: {
        createUploadWidget: jest.fn((opts, cb) => {
          return fakeWidget;
        }),
      },
      configurable: true,
    });
  });

  it('renders an upload button and opens the widget on click', async () => {
    const onUpload = jest.fn();
    render(<UploadWidget onUpload={onUpload} />);
    await waitFor(() => expect(window.cloudinary.createUploadWidget).toHaveBeenCalled());

    const button = screen.getByRole('button', { name: /upload media/i });
    fireEvent.click(button);
    expect(fakeWidget.open).toHaveBeenCalled();
  });

  it('shows loading state when upload-started fires', async () => {
    const onUpload = jest.fn();
    render(<UploadWidget onUpload={onUpload} />);
    await waitFor(() => expect(window.cloudinary.createUploadWidget).toHaveBeenCalled());

    // grab the callback that UploadWidget passed into createUploadWidget
    const widgetCallback = window.cloudinary.createUploadWidget.mock.calls[0][1];

    const button = screen.getByRole('button', { name: /upload media/i });
    await act(async () => {
      await widgetCallback(null, { event: 'upload-started' });
    });

    expect(button).toHaveTextContent(/uploading\.\.\./i);
    expect(screen.getAllByText('Uploading...').length).toBeGreaterThan(0);
  });

  it('calls onUpload, writes to Firestore, and shows preview on success', async () => {
    const onUpload = jest.fn();
    render(<UploadWidget onUpload={onUpload} />);
    await waitFor(() => expect(window.cloudinary.createUploadWidget).toHaveBeenCalled());

    const widgetCallback = window.cloudinary.createUploadWidget.mock.calls[0][1];

    await act(async () => {
      // simulate both start and success
      await widgetCallback(null, { event: 'upload-started' });
      await widgetCallback(null, {
        event: 'success',
        info: {
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
          resource_type: 'image',
        },
      });
    });

    // onUpload should have been called
    expect(onUpload).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
      'image'
    );

    // Firestore write
    expect(firebase.collection).toHaveBeenCalledWith(firebase.db, 'media');
    expect(firebase.addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        url: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
        type: 'image',
        timestamp: expect.any(Date),
      })
    );

    // preview card
    const img = await screen.findByRole('img', { name: /uploaded media/i });
    expect(img).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/demo/image/upload/v1/test.jpg'
    );
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('removes preview and calls onUpload(null,null) on delete click', async () => {
    const onUpload = jest.fn();
    render(<UploadWidget onUpload={onUpload} />);
    await waitFor(() => expect(window.cloudinary.createUploadWidget).toHaveBeenCalled());

    const widgetCallback = window.cloudinary.createUploadWidget.mock.calls[0][1];

    await act(async () => {
      await widgetCallback(null, {
        event: 'success',
        info: {
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
          resource_type: 'image',
        },
      });
    });

    // wait for the preview
    await screen.findByRole('img', { name: /uploaded media/i });

    // click delete
    const deleteBtn = screen.getByTestId('DeleteIcon').closest('button');
    fireEvent.click(deleteBtn);

    expect(screen.queryByRole('img')).toBeNull();
    expect(onUpload).toHaveBeenLastCalledWith(null, null);
  });

  it('handles upload error and resets uploading state', async () => {
    const onUpload = jest.fn();
    const errorObj = { message: 'Upload failed' };
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<UploadWidget onUpload={onUpload} />);
    await waitFor(() => expect(window.cloudinary.createUploadWidget).toHaveBeenCalled());

    const widgetCallback = window.cloudinary.createUploadWidget.mock.calls[0][1];

    await act(async () => {
      await widgetCallback(errorObj, null);
    });

    const button = screen.getByRole('button', { name: /upload media/i });
    expect(console.error).toHaveBeenCalledWith('Upload error:', errorObj);
    expect(button).toHaveTextContent(/upload media/i);
    expect(button).not.toBeDisabled();
    expect(onUpload).not.toHaveBeenCalled();

    console.error.mockRestore();
  });

  it('logs an error if Firestore write fails but still shows preview', async () => {
    const onUpload = jest.fn();
    const dbError = new Error('db failure');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    firebase.addDoc.mockRejectedValueOnce(dbError);

    render(<UploadWidget onUpload={onUpload} />);
    await waitFor(() => expect(window.cloudinary.createUploadWidget).toHaveBeenCalled());

    const widgetCallback = window.cloudinary.createUploadWidget.mock.calls[0][1];

    await act(async () => {
      await widgetCallback(null, { event: 'upload-started' });
      await widgetCallback(null, {
        event: 'success',
        info: {
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
          resource_type: 'image',
        },
      });
    });

    expect(onUpload).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
      'image'
    );
    expect(firebase.addDoc).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error saving to database:', dbError);

    const img = await screen.findByRole('img', { name: /uploaded media/i });
    expect(img).toBeInTheDocument();

    console.error.mockRestore();
  });
  it('clears state & calls onUpload(null,null) after deleting a VIDEO preview', async () => {
        const onUpload = jest.fn();
        render(<UploadWidget onUpload={onUpload} />);
        await waitFor(() =>
          expect(window.cloudinary.createUploadWidget).toHaveBeenCalled()
        );
    
        const widgetCb = window.cloudinary.createUploadWidget.mock.calls[0][1];
    
        // add a video preview
        await act(async () => {
          await widgetCb(null, {
            event: 'success',
            info: {
              secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4',
              resource_type: 'video',
            },
          });
        });
    
        // confirm preview is on screen
        await screen.findByText('Video');
    
        // click the dust-bin icon
        const deleteBtn = screen.getByTestId('DeleteIcon').closest('button');
        fireEvent.click(deleteBtn);
    
        // preview should disappear
        await waitFor(() => {
          expect(screen.queryByText('Video')).toBeNull();
        });
    
        // handleRemoveMedia → onUpload(null,null)
        expect(onUpload).toHaveBeenLastCalledWith(null, null);
      });
    
      it('clears state & calls onUpload(null,null) after deleting an AUDIO preview', async () => {
        const onUpload = jest.fn();
        render(<UploadWidget onUpload={onUpload} />);
        await waitFor(() =>
          expect(window.cloudinary.createUploadWidget).toHaveBeenCalled()
        );
    
        const widgetCb = window.cloudinary.createUploadWidget.mock.calls[0][1];
    
        // add an audio preview
        await act(async () => {
          await widgetCb(null, {
            event: 'success',
            info: {
              secure_url: 'https://res.cloudinary.com/demo/audio/upload/v1/track.mp3',
              resource_type: 'audio',
            },
          });
        });
    
        // confirm preview is on screen
        await screen.findByText('Audio');
    
        // click the dust-bin icon
        const deleteBtn = screen.getByTestId('DeleteIcon').closest('button');
        fireEvent.click(deleteBtn);
    
        // preview should disappear
        await waitFor(() => {
          expect(screen.queryByText('Audio')).toBeNull();
        });
    
        expect(onUpload).toHaveBeenLastCalledWith(null, null);
      });
});
