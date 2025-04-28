import React, { useState } from 'react';
import { FaEdit, FaTimes } from 'react-icons/fa'; // Import edit and cancel icons
import Question from './Question'; // Import the base Question component

const EditableQuestion = ({ question, onAnswerChange, disabled, onTitleChange, id, onOptionChange, onTypeChange }) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(question.text);
    const [originalTitle, setOriginalTitle] = useState(question.text);
    const [editedOptions, setEditedOptions] = useState(question.options);
    const [editedType, setEditedType] = useState(question.type);

    const handleTitleClick = () => {
        setOriginalTitle(editedTitle); // Store the original title
        setIsEditingTitle(true);
    };

    const handleTitleChange = (e) => {
        setEditedTitle(e.target.value);
    };

    const handleTitleBlur = (e) => {
        //prevent the onBlur event from firing when clicking on the cancel button
        if (e && e.relatedTarget && e.relatedTarget.id === 'cancelEdit') {
            return;
        }
        setIsEditingTitle(false);
        onTitleChange(id, editedTitle);
    };

    const handleCancelEdit = (e) => {
        setIsEditingTitle(false);
        setEditedTitle(originalTitle); // Revert to original title text
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleTitleBlur();
        }
    }

    const handleOptionChange = (index, value) => {
        const newOptions = [...editedOptions];
        newOptions[index] = value;
        setEditedOptions(newOptions);
        onOptionChange(id, newOptions);
    };

    const handleTypeChange = (e) => {
        if (e.target.value === 'text') {
            setEditedOptions([]);
        }

        onOptionChange(id, []);
        setEditedType(e.target.value);
        onTypeChange(id, e.target.value);
    };

    const addOption = () => {
        setEditedOptions([...editedOptions, '']);
    }


    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
                {isEditingTitle ? (
                    <>
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={handleTitleChange}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleKeyPress}

                            autoFocus
                            style={{
                                width: '100%',
                                padding: '8px',
                            }}
                        />
                        <button
                            onClick={handleCancelEdit}
                            id='cancelEdit'
                            style={{
                                marginLeft: 8,
                                cursor: 'pointer',
                                color: 'red', // Customize color for better visibility
                                fontSize: 'larger',
                                border: 'none',
                                background: 'none',
                                padding: '0px',
                            }}
                        >
                            <FaTimes />
                        </button>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }}>
                        <p className="p-2" onClick={handleTitleClick} style={{ margin: 0, flexGrow: 1 }}>
                            {editedTitle}
                        </p>
                        <button onClick={handleTitleClick} style={{ color: ' black', border: 'none', background: 'none' }}>
                            <FaEdit size={16} />
                        </button>
                    </div>
                )}
            </div>


            <Question
                question={question}
                onAnswerChange={onAnswerChange}
                disabled={disabled}
                showTitle={false}
            />
        </div>
    );
};

export default EditableQuestion;
