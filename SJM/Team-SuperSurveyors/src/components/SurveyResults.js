import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Box,
    ThemeProvider,
    CircularProgress,
    Grid2
  } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getSurveyInfo, getSurveyResponses } from '../services/surveyService';
import { theme } from './Survey';
import MultiChoiceAndSelect from './Multi';

ChartJS.register(ArcElement, Tooltip, Legend);

const SurveyResults = () => {
    const { surveyId } = useParams();

    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [surveyName, setSurveyName] = useState("");
    const [surveyQuestions, setSurveyQuestions] = useState([]);

    const navigate = useNavigate();

    let outputType = (type) => {
        if (type === 'checkbox') return "Multi Response";
        else if (type === 'radio') return "Single Select";
        return "Free Response"
    };

    useEffect(() => {
        const fetchResponses = async () => {
            const fetchedResponses = await getSurveyResponses(surveyId);
            setResponses(fetchedResponses);
            setLoading(false);
        };

        const fetchSurveyQuestions = async () => {
            const fetchedSurveyData = await getSurveyInfo(surveyId);
            setSurveyName(fetchedSurveyData.title);
            setSurveyQuestions(fetchedSurveyData.questions);
        };

        fetchResponses();
        fetchSurveyQuestions();
    }, [surveyId]);

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={{textAlign: 'center', 
                            mb: 4,
                            fontWeight: 700,
                            color: 'primary.main'
                        }}
                >
                    Results for {surveyName}
                </Typography>

                {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} thickness={4} />
                </Box>

                ) : (
                <Grid2 container spacing={3}>
                    {!surveyQuestions || !surveyQuestions.length ? (
                    <Grid2>
                        <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            No questions available to show.
                        </Typography>
                    </Grid2>

                    ) : (
                    surveyQuestions.map((question, index) => (
                        <Grid2 key={index} size={12}>
                            <Card sx={{backgroundColor: 'transparent'}}>
                                <CardContent>
                                    <Box sx={{display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                mb: 2
                                            }}
                                    >
                                        <Typography variant="h6" 
                                                    sx={{fontWeight: 600,
                                                            flex: 1,
                                                            mr: 1,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                        >
                                            Question {index + 1} ({outputType(question.type)}): {question.text}
                                        </Typography>
                                    </Box>
                                    
                                    {question.type === 'text' && responses[index].responses.map((response) => (
                                        <Box>
                                            <Typography variant="body">
                                                {response}
                                            </Typography>
                                        </Box>
                                    ))}
                                    
                                    {(question.type === 'radio' || question.type === 'checkbox') && (
                                        <MultiChoiceAndSelect choices={question.options} answers={responses[index].responses} />
                                    )}
                                    
                                </CardContent>
                            </Card>
                        </Grid2>
                    ))
                    )}
                </Grid2>
                )}

                <Box textAlign='center'>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate(-1)}
                        disabled={loading}
                        sx={{
                            my: 2,
                            py: 2,
                            background: 'linear-gradient(45deg, #2c2c2c 30%, #4f4f4f 90%)',
                            boxShadow: '0 3px 5px 2px rgba(44, 44, 44, .3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #4f4f4f 30%, #2c2c2c 90%)',
                            }
                        }}
                    >
                        Back to Surveys
                    </Button>
                </Box>
                
            </Container>
            
        </ThemeProvider>
    );
};

export default SurveyResults;

