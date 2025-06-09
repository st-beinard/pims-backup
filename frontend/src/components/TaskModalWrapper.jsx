// frontend/src/components/TaskModalWrapper.jsx
import React from 'react';

// Simple inline SVG for the Close Icon (X) - you can replace with Heroicons if you use them
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TaskModalWrapper = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            {/* This is the modal shell structure from your DashboardPage.jsx's TaskForm */}
            <div className="p-6 sm:p-8 bg-white rounded-xl shadow-2xl w-full max-w-lg space-y-6">
                <div className="flex justify-between items-center mb-0"> {/* Adjusted mb if title is inside children */}
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        aria-label="Close modal"
                    >
                        <CloseIcon />
                    </button>
                </div>
                {/* The children prop will be your actual TaskForm component */}
                {children}
            </div>
        </div>
    );
};

export default TaskModalWrapper;