import React, { useEffect, useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Stack,
  CircularProgress,
  Slide
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { updateUserProfile } from '../services/userService';
import { UploadWidget } from '../services/uploadService';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(2),
    maxWidth: 500
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 500,
}));

const EditUserProfileDialog = ({ 
  show, 
  onHide, 
  userId, 
  displayName, 
  photoURL, 
  onDisplayNameChange, 
  onPhotoURLChange, 
  onSave 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await updateUserProfile(userId, displayName, photoURL);
      onSave(updatedUser.displayName, updatedUser.photoURL);
      onHide();
    } catch (error) {
      console.error("Error updating user profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter' && !isLoading) {
        event.preventDefault();
        handleSaveChanges();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [show, displayName, photoURL, isLoading]);

  const handleUpload = (url) => {
    onPhotoURLChange(url);
  };

  return (
    <StyledDialog
      open={show}
      onClose={onHide}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
    >
      <StyledDialogTitle>
        <Typography variant="h6" component="div">
          Edit Profile
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onHide}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          {/* Profile Preview */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar
              src={photoURL}
              alt={displayName}
              sx={{
                width: 100,
                height: 100,
                border: '4px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {!photoURL && <AccountCircleIcon sx={{ width: 60, height: 60 }} />}
            </Avatar>
          </Box>

          {/* Display Name Input */}
          <TextField
            fullWidth
            label="Display Name"
            variant="outlined"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Profile Photo
            </Typography>
          </Divider>

          {/* Upload Widget */}
          <Box sx={{ width: '100%' }}>
            <UploadWidget onUpload={handleUpload} />
          </Box>

          {/* Error Message */}
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <StyledButton
          variant="outlined"
          onClick={onHide}
          disabled={isLoading}
        >
          Cancel
        </StyledButton>
        <StyledButton
          variant="contained"
          onClick={handleSaveChanges}
          disabled={isLoading}
          startIcon={isLoading && <CircularProgress size={20} />}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default EditUserProfileDialog;