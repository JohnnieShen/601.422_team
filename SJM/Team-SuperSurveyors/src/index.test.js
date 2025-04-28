import React from 'react';
import App from './App';
// import ReactDOM from 'react-dom/client';

jest.mock('use-bootstrap-tag', () => jest.fn(() => null));
jest.mock('use-bootstrap-tag/dist/use-bootstrap-tag.css', () => ({}));

beforeAll(() => {
    document.body.innerHTML = '<div id="root"></div>';
});


describe('index.js entrypoint', () => {
    it('calls ReactDOM.createRoot on #root and renders <App/> inside <StrictMode>', () => {

        const container = document.getElementById('root');

        const mockRender = jest.fn();
        const mockCreateRoot = jest.fn().mockImplementation(() => {
            return { render: mockRender };
        });

        jest.isolateModules(() => {
            jest.doMock('./App', () => App);
            jest.doMock('react-dom/client', () => ({
                createRoot: mockCreateRoot,
            }));

            require('./index');
        });


        expect(mockCreateRoot).toHaveBeenCalledTimes(1);
        expect(mockCreateRoot).toHaveBeenCalledWith(container);

        expect(mockRender).toHaveBeenCalledTimes(1);

        expect(mockRender.mock.calls.length).toBe(1);
        const rendered = mockRender.mock.calls[0][0];
        expect(rendered).toBeDefined();
        expect(rendered.type).toBe(React.StrictMode);

        expect(rendered.props.children.type).toBe(App);
    });
});