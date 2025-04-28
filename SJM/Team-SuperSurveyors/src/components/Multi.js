import React from 'react';
import {
    Card,
    CardContent,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MultiChoiceAndSelect = ({ choices, answers }) => {

    // Count the answers
    const counts = choices.map(choice =>
        answers.filter(answer => answer === choice).length
    );

    // Chart data
    const data = {
        labels: choices,
        datasets: [
            {
                label: 'Responses',
                data: counts,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Chart options
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                ticks: {
                    callback: function (value) {
                        return Number.isInteger(value) ? value : null; // Only display integer values
                    },
                    stepSize: 1, // Increment between ticks
                },
                beginAtZero: true // Optional: Starts y-axis at 0
            }
        },
    };

    return (
        <Card sx={{ maxWidth: 600, margin: '20px auto' }}>
            <CardContent>
                <Bar data={data} options={options} />
            </CardContent>
        </Card>
    );
};

export default MultiChoiceAndSelect;