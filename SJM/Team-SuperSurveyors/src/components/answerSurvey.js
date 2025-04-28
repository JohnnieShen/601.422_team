import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, runTransaction, setDoc, deleteDoc, collection, query, where, getDocs, documentId, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import Question from './Question/Question';
import { getRandomSurvey } from '../services/surveyService';
import { getAuth } from 'firebase/auth';
import { PriorityQueue } from '@datastructures-js/priority-queue';
import {
    Container,
    Typography,
    Box,
    Button,
    Alert,
    Snackbar,
    Paper,
    Stack,
    Fade,
    CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { generateTagsForSurvey, updateUserTags } from './taggingService';
import { Create, Share } from '@mui/icons-material';
import CreateAndSharing from './createAndSharing';
import { 
    initializeApp,
    getFirestore,aAQ
  } from '../firebase';

const Survey = () => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [surveyTitle, setSurveyTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [surveyId, setSurveyId] = useState(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [showFailure, setShowFailure] = useState(false);
    const [failureTxt, setFailureTxt] = useState('');
    const pqRef = useRef(new PriorityQueue((s1, s2) => (s1[0] > s2[0] ? 1 : s1[0] === s2[0] ? 0 : -1)));
    const { surveyId: paramSurveyId } = useParams();
    const [alreadyAnswered, setAlreadyAnswered] = useState(false);
    const [lock, setLock] = useState(false);

    // [1] Add states for videos and audios
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [audios, setAudios] = useState([]);
    const j = useRef(false);

    const navigate = useNavigate();

    const auth = getAuth();
    const getUserId = useCallback(() => {
        const user = auth.currentUser;
        if (user) {
            return user.uid;
        } else {
            throw new Error('User not logged in');
        }
    }, [auth.currentUser]);

    const fetchIncompleteSurvey = async () => {
        try {
            const userId = getUserId();
            const q = query(
                collection(db, 'incompleteAnswers'),
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    surveyId: doc.data().surveyId,
                    answers: doc.data().answers,
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching incomplete survey:', error);
            return null;
        }
    };

    const fetchSurveyBasedOnTag = async () => {

        pqRef.current.clear();

        try {
            const userId = getUserId();
            const userInfo = query(
                collection(db, 'users'),
                where(documentId(), '==', userId)
            );
            const userInfoSnapshot = await getDocs(userInfo);
            let userOwnedSurveys = [];
            let userTags = [];
            let userAnsweredSurveys = new Set();
            userInfoSnapshot.forEach((child) => {
                userOwnedSurveys = child.data().surveys;
                if (child.data().tags) {
                    userTags = child.data().tags;
                }
                if (child.data().answeredSurveys) {
                    userAnsweredSurveys = new Set(child.data().answeredSurveys);
                }
            });

            let surveyInfo = userOwnedSurveys.length > 0 ?
                query(collection(db, 'surveys'), where(documentId(), 'not-in', userOwnedSurveys)) :
                query(collection(db, 'surveys'));

            const allSurveysSnapshot = await getDocs(surveyInfo);
            let count = 0;
            allSurveysSnapshot.forEach((child) => {
                if (userAnsweredSurveys.has(child.id)) {
                    return;
                }

                let survey = child.data();
                let commonTags = 0;

                if (survey.tags) {
                    for (let i = 0; i < survey.tags.length; i++) {
                        if (userTags.includes(survey.tags[i])) {
                            commonTags += 1;
                        }
                    }
                }
                let score = commonTags;
                pqRef.current.enqueue([score, { id: child.id, ...survey }]);
                count++;
            });
            return pqRef.current;
        } catch (error) {
            console.error('Error fetching tagged survey recommendation:', error);
        }
    };
    const fetchSurveyById = async (surveyId) => {
        try {
            const docRef = doc(db, 'surveys', surveyId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const surveyData = { id: docSnap.id, ...docSnap.data() };
                const userID = getUserId();
                const userRef = doc(db, 'users',userID)
                const userSnap = await getDoc(userRef)

                if (userSnap.exists()){
                    const userData = userSnap.data();
                    const answeredSurveys = userData.answeredSurveys || [];
                    if (answeredSurveys.includes(surveyId)) {
                        setAlreadyAnswered(true);
                        setLoading(false);
                        return;
                    }
                }
                setSurveyId(surveyData.id);
                setSurveyTitle(surveyData.title);

                // [2] Populate images, videos, and audios from Firestore data
                setQuestions(surveyData.questions.map((question, index) => ({ ...question, id: index.toString() })));
                setImages(surveyData.images || []);
                setVideos(surveyData.videos || []);
                setAudios(surveyData.audios || []);

                setQuestions(
                    surveyData.questions.map((question, index) => ({
                        ...question,
                        id: index.toString(),
                    }))
                );
                setLoading(false);
            } else {
                console.error('Survey not found');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching survey:', error);
            setLoading(false);
        }
    };

    const fetchSurveys = async (ignoreIncompleteSurvey = false) => {
        const pq = pqRef.current;
        setQuestions([]);
        setLoading(true);
        setSubmissionSuccess(false);
        let surveyData;

        if (!ignoreIncompleteSurvey) {
            const incompleteSurvey = await fetchIncompleteSurvey();

            if (incompleteSurvey) {
                const docRef = doc(db, 'surveys', incompleteSurvey.surveyId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    surveyData = { id: docSnap.id, ...docSnap.data() };
                    setAnswers(incompleteSurvey.answers);
                } else {
                    if (pq.isEmpty()) {
                        setAnswers({});
                        surveyData = await getRandomSurvey();
                    } else {
                        setAnswers({});
                        surveyData = pq.dequeue()[1];
                    }
                }
            } else {
                if (pq.isEmpty()) {
                    setAnswers({});
                    surveyData = await getRandomSurvey();
                } else {
                    setAnswers({});

                    surveyData = pq.dequeue()[1];
                }
            }
        } else {
            if (pq.isEmpty()) {
                setAnswers({});
                surveyData = await getRandomSurvey();
            }
            else {
                setAnswers({});
                surveyData = pq.dequeue()[1];
            }
        }
        if (surveyData == null) {
            return;
        }

        setSurveyId(surveyData.id);
        setSurveyTitle(surveyData.title);
        setImages(surveyData.images || []);

        setQuestions(
            surveyData.questions.map((question, index) => ({
                ...question,
                id: index.toString(),
            }))
        );

        setLoading(false);
    };

    const handleAnswerChange = (questionId, value) => {
        if (Array.isArray(value)) {
            value = value.map((val) => val);
        }

        setAnswers((prevAnswers) => {
            const newAnswers = {
                ...prevAnswers,
                [questionId]: value,
            };

            saveIncompleteAnswers(newAnswers);

            return newAnswers;
        });
    };

    const saveIncompleteAnswers = async (currentAnswers) => {
        try {
            const userId = getUserId();
            const docRef = doc(db, 'incompleteAnswers', `${surveyId}_${userId}`);
            await setDoc(docRef, {
                surveyId: surveyId,
                userId: userId,
                answers: currentAnswers,
                lastUpdated: new Date(),
            });
        } catch (error) {
            console.error('Error saving incomplete answers:', error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const answeredQuestions = Object.values(answers);
        if (answeredQuestions.length < questions.length) {
            setFailureTxt('Please complete all questions before submitting');
            setShowFailure(true);
            return;
        }

        const minAnswerLength = 3;
        for (let i = 0; i < questions.length; i++) {
            if (questions[i].type === 'text' && answeredQuestions[i].length < minAnswerLength) {
                setFailureTxt(`Please answer question ${i + 1} with at least ${minAnswerLength} characters`);
                setShowFailure(true);
                return;
            }
        }

        try {
            const userId = getUserId();
            // Generate tags based on the title and questions of the current question
            const surveyQuestions = questions.map(q => q.text);
            const tags = await generateTagsForSurvey(surveyTitle, surveyQuestions);

            if (tags.length > 0) {
                console.log('Generated Tag:', tags[0]);
                await updateUserTags(userId, tags[0]);
            }


            const surveyResultsRef = doc(db, 'surveyResults', surveyId);
            await updateDoc(surveyResultsRef, { responseCount: increment(1) });

            const promises = Object.entries(answers).map(
                async ([questionId, answer]) => {
                    const questionRef = doc(
                        db,
                        'surveyResults',
                        surveyId,
                        'questions',
                        questionId
                    );

                    await runTransaction(db, async (transaction) => {
                        const questionDoc = await transaction.get(questionRef);
                        let currentResponses = [];
                        if (questionDoc.exists()) {
                            currentResponses = questionDoc.data().responses || [];
                        }

                        let newResponses;
                        if (Array.isArray(answer)) {
                            newResponses = currentResponses.concat(answer);
                        } else {
                            newResponses = currentResponses.concat([answer]);
                        }

                        transaction.update(questionRef, {
                            responses: newResponses,
                        });
                    });
                }
            );

            await Promise.all(promises);
            await completeSurvey(getUserId, surveyId);
            setSubmissionSuccess(true);
        } catch (error) {
            console.error('Error submitting responses:', error);
            setFailureTxt('There was an error submitting your responses');
            setShowFailure(true);
        }
    };

    useEffect(() => {
        if (j.current) return;
        j.current = true;
        if (paramSurveyId) {
            fetchSurveyById(paramSurveyId);
        } else {
            fetchSurveyBasedOnTag().then(() => {
                fetchSurveys();
            });
        }
    }
        , []);

    useEffect(() => {
      if (alreadyAnswered) {
        const timer = setTimeout(() => {
          window.location.href = '/#/trending';
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [alreadyAnswered]);

    if (loading) {
        return (
            <Container sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <CircularProgress size={60} thickness={4} />
            </Container>
        );
    }

    if (alreadyAnswered) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    You have already answered this survey and cannot answer it again. You will be redirected shortly.
                </Alert>
            </Container>
        );
    }
    if (submissionSuccess) {

        return (

            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 2
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        Your response has been submitted successfully!
                    </Typography>
                    <Stack spacing={2}>
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={fetchSurveys}
                            sx={{
                                py: 1.5,
                                bgcolor: 'grey.900',
                                '&:hover': { bgcolor: 'grey.800' }
                            }}
                        >
                            Answer a new survey
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/view')}
                            sx={{ py: 1.5 }}
                        >
                            Go back to your surveys
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        );
    }
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                        completeSurvey(getUserId, surveyId, true);
                        fetchSurveys(true);
                    }}
                    fullWidth
                    sx={{
                        py: 1.5,
                        mb: 4,
                        borderRadius: 2
                    }}
                >
                    Not interested? Answer a different survey
                </Button>
            </Box>

            <Paper
                elevation={0}
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 4,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 2
                }}
            >
                <Typography
                    variant="h4"
                    align="center"
                    gutterBottom
                    sx={{
                        mb: 4,
                        fontWeight: 700,
                        color: 'grey.900'
                    }}
                >
                    {surveyTitle}
                </Typography>

                {/* Image Gallery */}
                {images.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Image Gallery
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {images.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`Survey Image ${index}`}
                                    style={{ width: '200px', height: 'auto', margin: '10px' }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Video Gallery - New Section */}
                {videos.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Video Gallery
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {videos.map((url, index) => (
                                <video key={index} src={url} controls style={{ width: '300px', height: 'auto', margin: '10px' }} />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Audio Gallery - New Section */}
                {audios.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Audio Gallery
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {audios.map((url, index) => (
                                <audio key={index} src={url} controls style={{ margin: '10px' }} />
                            ))}
                        </Box>
                    </Box>
                )}



                <Stack spacing={4}>
                    {questions.map((question) => (
                        <Question
                            key={question.id}
                            question={question}
                            onAnswerChange={handleAnswerChange}
                            value={answers[question.id] || ''}
                        />
                    ))}

                    <Button
                        type="submit"
                        variant="contained"
                        endIcon={<SendIcon />}
                        sx={{
                            py: 2,
                            mt: 2,
                            bgcolor: 'grey.900',
                            '&:hover': { bgcolor: 'grey.800' }
                        }}
                    >
                        Submit Answers
                    </Button>
                </Stack>
            </Paper>

            <Snackbar
                open={showFailure}
                autoHideDuration={4000}
                onClose={() => setShowFailure(false)}
                TransitionComponent={Fade}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="error"
                    variant="filled"
                    onClose={() => setShowFailure(false)}
                    sx={{ width: '100%' }}
                >
                    {failureTxt}
                </Alert>
            </Snackbar>
        </Container>
    );
};

async function completeSurvey(getUserId, surveyId, skip = false) {
    const userId = getUserId();
    await deleteDoc(doc(db, 'incompleteAnswers', `${surveyId}_${userId}`));

    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        let answeredSurveys = [];
        if (userDoc.exists()) {
            answeredSurveys = userDoc.data().answeredSurveys || [];
        }

        answeredSurveys.push(surveyId);
        const coins = skip ? userDoc.data().coins : userDoc.data().coins + 1;

        transaction.update(userRef, {
            answeredSurveys: answeredSurveys,
            coins: coins
        });
    });
}

export default Survey;
