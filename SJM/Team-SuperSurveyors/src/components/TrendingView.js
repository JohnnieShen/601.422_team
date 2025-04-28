import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Box,
    ThemeProvider,
    CircularProgress,
    Grid2
  } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { getTrendingSurveys } from '../services/surveyService';
import { theme } from './Survey';

const TrendingView = () => {
    const [trendingSurveys, setTrendingSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrendingSurveys = async () => {
            let trendingData = await getTrendingSurveys();
            setTrendingSurveys(trendingData);
            setLoading(false);
        };

        fetchTrendingSurveys();
    }, []);

    const openResults = (survey) => {
        navigate(`/survey-results/${survey.id}`);
    };  

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
                Trending Surveys
                </Typography>

                {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} thickness={4} />
                </Box>

                ) : (
                <Grid2 container spacing={3}>
                    {!trendingSurveys || !trendingSurveys.length ? (
                    <Grid2>
                        <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            No trending surveys available to show.
                        </Typography>
                    </Grid2>

                    ) : (
                    trendingSurveys.map((survey, index) => (
                        <Grid2 key={survey.id}
                                size={{xs: (index < 4) ? 12 : 12,
                                        sm: (index < 4) ? 6 : 4
                                    }}
                        >
                            <Card sx={{backgroundColor: (index === 0) ? '#FFD700' : 
                                                        (index === 1) ? 'silver' : 
                                                        (index === 2) ? '#E89C51' : 
                                                        (index === 3) ? '#6f98bd' :
                                                        'transparent'
                                    }}
                            >
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
                                            Top {index + 1}: {survey.title}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        {survey.tags && survey.tags.length > 0 ? (
                                        survey.tags.map((tag, index) => (
                                            <Chip key={index}
                                                    label={tag}
                                                    size="small"
                                                    sx={{mr: 1, 
                                                        mb: 1,
                                                        bgcolor: 'grey.100',
                                                    '   &:hover': { bgcolor: 'grey.200' }
                                                    }}
                                            />
                                        ))) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No tags available.
                                        </Typography>
                                        )}
                                    </Box>

                                    <Button variant="outlined" 
                                            startIcon={<BarChartIcon />}
                                            onClick={() => openResults(survey)}>
                                        View the {survey.responseCount} result{(survey.responseCount !== 1) ? 's' : ''}
                                    </Button>

                                </CardContent>
                            </Card>
                        </Grid2>
                    ))
                    )}
                </Grid2>
                )}
            </Container>
        </ThemeProvider>
        
    );
};

export default TrendingView;