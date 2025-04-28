import { useEffect, useRef, useState } from 'react';
import { db, addDoc, collection } from '../firebase';
import { 
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  Stack
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Audiotrack as AudioIcon,
  VideoLibrary as VideoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export const UploadWidget = ({ onUpload, label = "Upload Media", showPreview = true }) => {
  const cloudinaryRef = useRef();
  const widgetRef = useRef();
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    widgetRef.current = cloudinaryRef.current.createUploadWidget({
      cloudName: 'dkohfegpk',
      uploadPreset: 'default',
      sources: ['local', 'url'],
      resourceType: 'auto',
      maxFiles: 1,
      styles: {
        palette: {
          window: "#FFFFFF",
          windowBorder: "#90A0B3",
          tabIcon: "#2c2c2c",
          menuIcons: "#5A616A",
          textDark: "#000000",
          textLight: "#FFFFFF",
          link: "#2c2c2c",
          action: "#2c2c2c",
          inactiveTabIcon: "#0E2F5A",
          error: "#F44235",
          inProgress: "#2c2c2c",
          complete: "#20B832",
          sourceBg: "#E4EBF1"
        }
      }
    }, async function (error, result) {
      if (error) {
        console.error('Upload error:', error);
        setIsUploading(false);
        return;
      }

      if (result.event === "upload-started") {
        setIsUploading(true);
      }

      if (result && result.event === "success") {
        const uploadedMediaUrl = result.info.secure_url;
        const uploadedMediaType = result.info.resource_type;

        onUpload(uploadedMediaUrl, uploadedMediaType);
        setMediaUrl(uploadedMediaUrl);
        setMediaType(uploadedMediaType);
        setIsUploading(false);

        try {
          await addDoc(collection(db, "media"), {
            url: uploadedMediaUrl,
            type: uploadedMediaType,
            timestamp: new Date(),
          });
        } catch (e) {
          console.error('Error saving to database:', e);
        }
      }
    });
  }, [onUpload]);

  const handleRemoveMedia = () => {
    setMediaUrl(null);
    setMediaType('');
    onUpload(null, null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: '100%'
      }}
    >
      <Button
        variant="outlined"
        startIcon={<CloudUploadIcon />}
        onClick={() => widgetRef.current.open()}
        disabled={isUploading}
        sx={{
          borderRadius: 2,
          px: 3,
          py: 1,
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': {
            borderColor: 'primary.dark',
            backgroundColor: 'rgba(44, 44, 44, 0.04)'
          }
        }}
      >
        {isUploading ? 'Uploading...' : label}
      </Button>

      {isUploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Uploading...</Typography>
        </Box>
      )}

      {showPreview && mediaUrl && !isUploading && (
        <Card sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {mediaType === 'image' && <ImageIcon />}
                {mediaType === 'video' && <VideoIcon />}
                {mediaType === 'audio' && <AudioIcon />}
                <Typography variant="subtitle1">
                  {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                </Typography>
              </Box>
              <IconButton onClick={handleRemoveMedia} color="error">
                <DeleteIcon />
              </IconButton>
            </Stack>

            {mediaType === 'image' && (
              <CardMedia
                component="img"
                image={mediaUrl}
                alt="Uploaded media"
                sx={{ 
                  width: '100%',
                  height: 200,
                  objectFit: 'contain',
                  borderRadius: 1
                }}
              />
            )}
            {mediaType === 'video' && (
              <Box sx={{ width: '100%' }}>
                <video controls style={{ width: '100%', maxHeight: '200px' }}>
                  <source src={mediaUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Box>
            )}
            {mediaType === 'audio' && (
              <Box sx={{ width: '100%', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <audio controls style={{ width: '100%' }}>
                  <source src={mediaUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};