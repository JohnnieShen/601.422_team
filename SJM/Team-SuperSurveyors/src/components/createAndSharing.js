// createAndSharing.js
import React from 'react';
import { Button, Box } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';

const CreateAndSharing = ({ surveyId }) => {


    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mt: 2,
            }}
        >
            <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={shareSurvey}
                sx={{
                    py: 1.5,
                    bgcolor: 'grey.900',
                    '&:hover': { bgcolor: 'grey.800' },
                }}
            >
                Share Survey
            </Button>
        </Box>
    );
};
export function shareSurvey(surveyId) {
    const surveyLink = `${window.location.origin}${window.location.pathname}#/answer/${surveyId}`;

    if (navigator.share) {
        // Use the Web Share API if available
        navigator.share({
            title: 'Survey Invitation',
            text: 'Please take this survey!',
            url: surveyLink,
        })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback: Copy the link to the clipboard
        navigator.clipboard.writeText(surveyLink).then(() => {
            alert('Link copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    }
}

export default CreateAndSharing;
