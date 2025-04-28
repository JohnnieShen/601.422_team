import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Box,
  Dialog,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Share } from '@mui/icons-material';
import Question from './Question/Question';
import DeleteConfirmationDialog from './DeleteDialog.js';
import EditQuestionsDialog from './EditQuestionsDialog.js';
import { getCurrentUser } from '../services/userService.js';
import { getUserSurveys, updateSurvey } from '../services/surveyService.js';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { shareSurvey } from './createAndSharing.js';

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
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      lighter: '#ffebee'
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          boxShadow: 'none',
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
          borderRadius: 6,
        },
      },
    },
  },
});

const SurveyView = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const navigate = useNavigate();
  const [originalSurvey, setOriginalSurvey] = useState(null);
  const [orginialQuestions, setOriginalQuestions] = useState([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuSurvey, setMenuSurvey] = useState(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      let surveysData = await getUserSurveys();
      setSurveys(surveysData);
      setLoading(false);
    };

    fetchSurveys();
  }, [navigate]);

  const handleMenuOpen = (event, survey) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuSurvey(survey);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuSurvey(null);
  };

  const openDeleteDialog = (survey) => {
    setSelectedSurvey(survey);
    setShowDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDialog(false);
    setSelectedSurvey(null);
  };

  const handleEditClick = (survey) => {
    setSelectedSurvey(survey);
    setOriginalSurvey(survey);
    var questions = [];
    survey.questions.forEach(question => {
      var newQuestion = { ...question };
      questions.push(newQuestion);
    });
    setOriginalQuestions(questions);
    setShowEditDialog(true);
  };

  const handleSaveChanges = async (surveyId) => {
    setSurveys(surveys.map(survey => survey.id === surveyId ? survey : survey));
    var updatedSurvey = null;
    for (let i = 0; i < surveys.length; i++) {
      if (surveys[i].id === surveyId) {
        updatedSurvey = surveys[i];
        break;
      }
    }
    if (updatedSurvey) {
      await updateSurvey(surveyId, updatedSurvey);
    }
    setShowEditDialog(false);
  };

  const surveyTitleChange = (newTitle) => {
    setSurveys(surveys.map(survey => survey.id === selectedSurvey.id ? { ...survey, title: newTitle } : survey));
  };

  const handleSurveyDelete = (surveyId) => {
    setSurveys(surveys.filter((survey) => survey.id !== surveyId));
  };

  const surveyTagChange = (newTags) => {
    setSurveys(surveys.map(survey => survey.id === selectedSurvey.id ? { ...survey, tags: newTags } : survey));
  };

  const openAnswerDialog = (survey) => {
    navigate(`/survey-results/${survey.id}`);
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedSurvey(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            textAlign: 'center',
            mb: 4,
            fontWeight: 700,
            color: 'primary.main'
          }}
        >
          Your Surveys
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {!surveys || surveys.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  No surveys available.
                </Typography>
              </Grid>
            ) : (
              surveys.map((survey) => (
                <Grid item xs={12} sm={6} md={4} key={survey.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography
                          variant="h6"
                          component={Link}
                          to={`/survey-view/${survey.id}`}
                          sx={{
                            fontWeight: 600,
                            flex: 1,
                            mr: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                              color: 'primary.light',
                              textDecoration: 'underline',
                            },
                            cursor: 'pointer'
                          }}
                        >
                          {survey.title}
                        </Typography>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, survey)}
                          size="small"
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'primary.main',
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        {survey.tags && survey.tags.length > 0 ? (
                          survey.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              sx={{
                                mr: 1,
                                mb: 1,
                                bgcolor: 'grey.100',
                                '&:hover': { bgcolor: 'grey.200' }
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No tags available.
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: 'italic' }}
                        >
                          Click title to view {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            sx: {
              mt: 0.5,
              boxShadow: 'rgb(145 158 171 / 24%) 0px 0px 2px 0px, rgb(145 158 171 / 24%) 0px 20px 40px -4px',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
                borderRadius: 1,
                mx: 0.5,
              },
            },
          }}
        >
          <MenuItem onClick={() => {
            handleEditClick(menuSurvey);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            openAnswerDialog(menuSurvey);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <BarChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Results</ListItemText>
          </MenuItem>
          {/* Create sharing link*/}
          <MenuItem onClick={() => {
            shareSurvey(menuSurvey.id);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>


          <MenuItem
            onClick={() => {
              openDeleteDialog(menuSurvey);
              handleMenuClose();
            }}
            sx={{
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.lighter',
              }
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {selectedSurvey && (
          <EditQuestionsDialog
            show={showEditDialog}
            onHide={() => {
              for (let i = 0; i < surveys.length; i++) {
                if (surveys[i].id === selectedSurvey.id) {
                  surveys[i] = originalSurvey;
                  surveys[i].questions = orginialQuestions;
                  break;
                }
              }
              setSelectedSurvey(null);
              setShowEditDialog(false);
            }}
            survey={selectedSurvey}
            onQuestionsChange={(updatedQuestions) => {
              setSelectedSurvey({ ...selectedSurvey, questions: updatedQuestions });
            }}
            handleSaveChanges={handleSaveChanges}
            onTitleChange={surveyTitleChange}
            onTagChange={surveyTagChange}
          />
        )}

        <DeleteConfirmationDialog
          show={showDialog}
          onHide={closeDeleteDialog}
          survey={selectedSurvey}
          onSurveyDelete={handleSurveyDelete}
        />

        <Dialog
          open={showResponseModal}
          onClose={closeResponseModal}
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxWidth: 'sm',
              width: '100%'
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Survey Responses
            </Typography>
            {responses.length === 0 ? (
              <Typography color="text.secondary">
                No responses available.
              </Typography>
            ) : (
              <Box component="ul" sx={{ pl: 2 }}>
                {responses.map((response, index) => (
                  <Typography component="li" key={index}>
                    {response}
                  </Typography>
                ))}
              </Box>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={closeResponseModal}>
                Close
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
};

export default SurveyView;