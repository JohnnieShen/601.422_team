// src/components/Question.js
import { React, useState } from 'react';
import { Form } from 'react-bootstrap';


const Question = ({ question, onAnswerChange, value, disabled = false, showTitle = true }) => {
    const [multipleValuesState, setCheckbox] = useState(value);



    const handleChange = (e) => {
        if (question.type === 'checkbox') {
            const { value } = e.target;
            const newValues = multipleValuesState.includes(value)
                ? multipleValuesState.filter((v) => v !== value)
                : [...multipleValuesState, value];
            setCheckbox(newValues);
            onAnswerChange(question.id, newValues);
            return;
        }

        const { value } = e.target;
        onAnswerChange(question.id, value);
    };

    return (
        <div className="mb-3">
            {showTitle && <Form.Label>{question.text}</Form.Label>}
            {question.type === 'text' && (
                <Form.Control
                    id={question.id}
                    type="text"
                    placeholder={disabled ? "Responders will answer with text" : "Your answer"}
                    onChange={handleChange}
                    disabled={disabled}
                    value={value}
                />
            )}
            {question.type === 'radio' && (
                <div>
                    {question.options.map((option, index) => (
                        <Form.Check

                            key={index}
                            type="radio"
                            label={option}
                            name={`formHorizontalRadios-${question.id}`}
                            id={`formHorizontalRadios-${question.id}-${index}`}
                            value={option}
                            onChange={handleChange}
                            disabled={disabled}
                            checked={value === option}
                        />
                    ))}
                </div>
            )}
            {question.type === 'checkbox' && (
                <div>
                    {question.options.map((option, index) => (
                        <Form.Check
                            key={index}
                            type="checkbox"
                            label={option}
                            name={`formHorizontalCheck-${question.id}`}
                            id={`formHorizontalCheck-${question.id}-${index}`}
                            value={option}
                            onChange={handleChange}
                            disabled={disabled}
                            checked={value?.includes(option)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Question;
