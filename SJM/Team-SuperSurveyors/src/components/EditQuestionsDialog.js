import React, { useEffect } from 'react';
import { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    IconButton,
    Typography,
    styled,
    ThemeProvider,
    createTheme,
    Input
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditableQuestion from './Question/EditableQuestion';
import 'use-bootstrap-tag/dist/use-bootstrap-tag.css';
import UseBootstrapTag from 'use-bootstrap-tag';

const theme = createTheme({
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                    padding: 4,
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
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
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

const EditQuestionsDialog = ({ show, onHide, survey, onQuestionsChange, handleSaveChanges, onTitleChange }) => {
    const [currentTitle, setCurrentTitle] = useState(survey.title);
    const onTagChange = (tags) => {
        survey.tags = tags;
    };
    const tagRef = useRef(null);
    const componentRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            if (tagRef.current) {
                componentRef.current = new UseBootstrapTag(tagRef.current);
            }
        }, 100); // Delay to ensure the tagRef is available
    }, [tagRef.current]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    const handleQuestionChange = (index, newQuestion) => {
        const updatedQuestions = [...survey.questions];
        updatedQuestions[index] = newQuestion;
        onQuestionsChange(updatedQuestions);
    };

    const handleTitleChange = (newTitle) => {
        setCurrentTitle(newTitle);
        onTitleChange(newTitle);
    };

    const questionTitleChange = (index, newTitle) => {
        const updatedQuestions = [...survey.questions];
        updatedQuestions[index].text = newTitle;
        onQuestionsChange(updatedQuestions);
    };

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={show}
                onClose={onHide}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        width: '600px',
                        margin: 2,
                    }
                }}
            >
                <DialogTitleStyled>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        Edit Survey
                    </Typography>
                    <IconButton onClick={onHide} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitleStyled>

                <DialogContent sx={{ px: 3, py: 2 }}>
                    <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                            Title
                        </Typography>
                        <Input
                            fullWidth
                            value={currentTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            variant="outlined"
                            size="small"
                        />
                    </Box>

                    <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                            Tags
                        </Typography>
                        <TextField

                            defaultValue={survey.tags}
                            fullWidth
                            inputRef={tagRef}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter tags"
                            variant="outlined"
                            size="small"
                        />
                    </Box>

                    <Box>
                        {survey.questions.map((question, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <EditableQuestion
                                    disabled={true}
                                    id={index}
                                    question={question}
                                    onQuestionChange={() => { }}
                                    onTitleChange={questionTitleChange}
                                />
                            </Box>
                        ))}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setCurrentTitle(survey.title);
                            onQuestionsChange(survey.questions);
                            onHide();
                        }}
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
                        onClick={() => {
                            onTagChange(componentRef.current.getValues());
                            handleSaveChanges(survey.id);
                        }}
                        sx={{
                            bgcolor: 'primary.main',
                            '&:hover': {
                                bgcolor: 'primary.dark'
                            }
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
};

export default EditQuestionsDialog;