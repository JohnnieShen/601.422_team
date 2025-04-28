import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  ThemeProvider,
  createTheme,
  styled
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const theme = createTheme({
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          padding: 4,
          width: '400px'
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '6px 16px',
          borderRadius: 8,
        },
      },
    },
  },
});

const DialogTitleStyled = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  paddingLeft: theme.spacing(3),
  '& .MuiIconButton-root': {
    marginRight: -theme.spacing(1),
  },
}));

const DeleteConfirmationDialog = ({ show, onHide, survey, onSurveyDelete }) => {
    const [loading, setLoading] = useState(false);

    const handleDeleteConfirm = async () => {
        if (survey) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, 'surveys', survey.id));
                onSurveyDelete(survey.id);
                onHide();
            } catch (error) {
                console.error('Error deleting survey:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Dialog 
                open={show} 
                onClose={onHide}
                PaperProps={{
                    sx: {
                        margin: 2,
                    }
                }}
            >
                <DialogTitleStyled>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        Confirm Deletion
                    </Typography>
                    <IconButton onClick={onHide} size="small" disabled={loading}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitleStyled>

                <DialogContent sx={{ px: 3, py: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Are you sure you want to delete the survey "{survey?.title}"? 
                        <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 500, color: 'error.main' }}>
                            This action cannot be undone.
                        </Box>
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={onHide}
                        disabled={loading}
                        sx={{
                            color: 'text.secondary',
                            borderColor: 'grey.300',
                            '&:hover': {
                                borderColor: 'grey.400',
                                backgroundColor: 'grey.50'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteConfirm}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                        sx={{
                            bgcolor: 'error.main',
                            '&:hover': {
                                bgcolor: 'error.dark'
                            }
                        }}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
};

export default DeleteConfirmationDialog;