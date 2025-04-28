import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InterestsIcon from '@mui/icons-material/Interests';

const Onboarding = () => {
  const { userId } = useParams();
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const minTags = 5;

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsCollection = collection(db, 'tags');
        const tagsSnapshot = await getDocs(tagsCollection);
        const tagsList = tagsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTags(tagsList);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    fetchTags();
  }, []);

  const toggleTagSelection = (tagId) => {
    setSelectedTags((prevSelected) =>
      prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId)
        : [...prevSelected, tagId]
    );
  };

  const handleComplete = async () => {
    if (selectedTags.length >= minTags) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { tags: selectedTags });
        navigate(`/profile`);
      } catch (error) {
        console.error('Error updating user tags:', error);
      }
    }
  };

  const progress = (selectedTags.length / minTags) * 100;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <InterestsIcon 
          sx={{ 
            fontSize: 40, 
            color: 'primary.main',
            mb: 2
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 1
          }}
        >
          Select Your Interests
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}
        >
          Choose at least {minTags} topics that interest you to help us personalize your experience
        </Typography>

        {/* Progress Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            maxWidth: 400,
            mx: 'auto',
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Selected Topics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTags.length} of {minTags} required
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }}
          />
        </Paper>
      </Box>

      {/* Tags Grid */}
      <Grid container spacing={3}>
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tag.id}>
              <Card
                onClick={() => toggleTagSelection(tag.id)}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.2s ease-in-out',
                  border: 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
                elevation={0}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={tag.image}
                  alt={tag.id}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ 
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tag.id}
                  </Typography>
                  {isSelected && (
                    <CheckCircleIcon
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'primary.main'
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Action Button */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleComplete}
          disabled={selectedTags.length < minTags}
          sx={{
            minWidth: 200,
            textTransform: 'none',
            boxShadow: 'none',
            px: 4,
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          {selectedTags.length < minTags
            ? `Select ${minTags - selectedTags.length} more topic${minTags - selectedTags.length !== 1 ? 's' : ''}`
            : 'Complete Selection'}
        </Button>
      </Box>
    </Container>
  );
};

export default Onboarding;