import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  ThemeProvider,
  createTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { getCurrentUser } from '../services/userService'; // Removed logoutUser import
import EditUserProfileDialog from './EditUserProfileDialog';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2c2c2c',
      light: '#4f4f4f',
    },
    secondary: {
      main: '#757575',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c2c2c',
      secondary: '#757575',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

const UserView = () => {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editPhotoURL, setEditPhotoURL] = useState('');
    const [showTagDialog, setShowTagDialog] = useState(false);
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const navigate = useNavigate();

    // Keep all existing useEffects and handlers
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = getCurrentUser();
                if (currentUser) {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser(userData);
                        setSelectedTags(userData.tags || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const tagsCollection = collection(db, 'tags');
                const tagsSnapshot = await getDocs(tagsCollection);
                const tagsList = tagsSnapshot.docs.map((doc) => doc.id);
                setAvailableTags(tagsList);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchTags();
    }, []);

    // Keep all existing handlers
    const handleEditProfile = () => {
        if (!user) return;
        setEditDisplayName(user.displayName || '');
        setEditPhotoURL(user.photoURL || '');
        setShowEditDialog(true);
    };

    const handleSaveChanges = (updatedDisplayName, updatedPhotoURL) => {
        setUser((prevUser) => ({
            ...prevUser,
            displayName: updatedDisplayName,
            photoURL: updatedPhotoURL,
        }));
        setShowEditDialog(false);
    };

    // Removed handleLogout function

    const toggleTagSelection = (tag) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleSaveTags = async () => {
        if (!user) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { tags: selectedTags });
            setUser((prevUser) => ({ ...prevUser, tags: selectedTags }));
            setShowTagDialog(false);
        } catch (error) {
            console.error('Error updating tags:', error);
        }
    };

    if (loadingUser) {
        return (
            <ThemeProvider theme={theme}>
                <Container sx={{ 
                    height: '100vh', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress size={40} />
                        <Typography sx={{ mt: 2 }}>Loading profile...</Typography>
                    </Box>
                </Container>
            </ThemeProvider>
        );
    }

    if (!user) {
        return (
            <ThemeProvider theme={theme}>
                <Container sx={{ 
                    height: '100vh', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    <Typography variant="h4">No user available.</Typography>
                </Container>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="md" sx={{ py: 5 }}>
                <Paper 
                    elevation={0}
                    sx={{ 
                        border: '1px solid',
                        borderColor: 'grey.200',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ 
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                    }}>
                        <Box sx={{ 
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            display: 'flex',
                            gap: 1
                        }}>
                            <IconButton onClick={handleEditProfile} aria-label="edit profile">
                                <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => setShowTagDialog(true)} aria-label="edit tags">
                                <LocalOfferIcon />
                            </IconButton>
                        </Box>

                        <Avatar
                            src={user.photoURL || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'}
                            alt={user.displayName}
                            sx={{ 
                                width: 120,
                                height: 120,
                                mb: 2,
                                border: 4,
                                borderColor: 'white',
                                boxShadow: '0 0 20px rgba(0,0,0,0.1)'
                            }}
                        />

                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {user.displayName || 'No Display Name'}
                        </Typography>

                        <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                            {user.email}
                        </Typography>
                        <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                            UID: {user.uid}
                        </Typography>

                        <Box sx={{ mb: 4, width: '100%', textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                Interest Tags
                            </Typography>
                            <Box sx={{ 
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                justifyContent: 'center'
                            }}>
                                {user.tags && user.tags.length > 0 ? (
                                    user.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            sx={{
                                                bgcolor: 'grey.100',
                                                '&:hover': { bgcolor: 'grey.200' }
                                            }}
                                        />
                                    ))
                                ) : (
                                    <Typography color="text.secondary">
                                        No tags selected
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Removed Sign Out Button */}
                        {/* 
                        <Button
                            variant="contained"
                            color="error"
                            fullWidth
                            onClick={handleLogout}
                            startIcon={<LogoutIcon />}
                            sx={{ maxWidth: 400 }}
                        >
                            Sign Out
                        </Button>
                        */}
                    </Box>
                </Paper>

                <EditUserProfileDialog
                    show={showEditDialog}
                    onHide={() => setShowEditDialog(false)}
                    userId={user?.uid}
                    displayName={editDisplayName}
                    photoURL={editPhotoURL}
                    onDisplayNameChange={setEditDisplayName}
                    onPhotoURLChange={setEditPhotoURL}
                    onSave={handleSaveChanges}
                />

                <Dialog
                    open={showTagDialog}
                    onClose={() => setShowTagDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Edit Tags</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={1} sx={{ pt: 1 }}>
                            {availableTags.map((tag) => (
                                <Grid item xs={6} sm={4} key={tag}>
                                    <Button
                                        variant={selectedTags.includes(tag) ? "contained" : "outlined"}
                                        fullWidth
                                        onClick={() => toggleTagSelection(tag)}
                                        sx={{ 
                                            borderRadius: 2,
                                            py: 1
                                        }}
                                    >
                                        {tag}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button onClick={() => setShowTagDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="contained"
                            onClick={handleSaveTags}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </ThemeProvider>
    );
};

export default UserView;
