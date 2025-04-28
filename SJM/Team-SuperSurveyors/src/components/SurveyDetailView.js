import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  ThemeProvider,
  createTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Question from './Question/Question';

import { db, collection, getDocs } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Use the same theme as your SurveyView component
const theme = createTheme({
  // ... (copy the theme configuration from your SurveyView component)
});

const SurveyDetailView = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const surveyDoc = await getDoc(doc(db, 'surveys', surveyId));
        console.log("Survey data:", surveyDoc.data());  // Check structure here

        if (surveyDoc.exists()) {
          const surveyData = { id: surveyDoc.id, ...surveyDoc.data() };
          console.log("Fetched survey data:", surveyData); // Debugging statement
          setSurvey(surveyData);
        } else {
          setError('Survey not found');
        }
      } catch (err) {
        setError('Error fetching survey');
        console.error('Error fetching survey:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (error || !survey) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography color="error" align="center">
            {error || 'Survey not found'}
          </Typography>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ mb: 4 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'primary.main'
            }}
          >
            {survey.title}
          </Typography>

          {survey.tags && survey.tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {survey.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    mr: 1,
                    mb: 1,
                    bgcolor: 'grey.100',
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 2
          }}
        >
          {/* Media Gallery */}
          {(survey.images || survey.videos || survey.audios) && (
            <div>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Media Gallery
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {survey.images && survey.images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Uploaded ${index}`}
                    style={{ width: "300px", height: "auto", margin: "10px" }}
                  />
                ))}
                {survey.videos && survey.videos.map((url, index) => (
                  <Box key={index} sx={{ width: "300px", height: "auto", margin: "10px" }}>
                    <video controls style={{ width: "100%", height: "auto" }}>
                      <source src={`${url}?timestamp=${new Date().getTime()}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
                ))}
                {survey.audios && survey.audios.map((url, index) => (
                  <Box key={index} sx={{ width: "300px", height: "auto", margin: "10px" }}>
                    <audio controls style={{ width: "100%" }}>
                      <source src={url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </Box>
                ))}
              </Box>
            </div>
          )}

          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 3
            }}
          >
            Questions
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}>
            {survey.questions.map((question, index) => (
              <Box
                key={index}
                sx={{
                  p: 3,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.100'
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  Question {index + 1}
                </Typography>
                <Question
                  question={question}
                  disabled={true}
                  onAnswerChange={() => { }}
                />
              </Box>
            ))}
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default SurveyDetailView;
