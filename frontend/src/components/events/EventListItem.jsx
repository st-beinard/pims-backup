// frontend/src/components/events/EventListItem.jsx
import React from 'react';

const EventListItem = ({ event, onEdit, onDelete }) => {
    const formatTime = (timestamp) => {
        if (!timestamp || typeof timestamp.seconds !== 'number') return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-3 flex justify-between items-start hover:shadow-md transition-shadow">
            <div className="flex-grow min-w-0 pr-2"> {/* Allow text to truncate */}
                <h4 className="text-md font-semibold text-indigo-700 truncate" title={event.name || "Untitled Event"}>
                    {event.name || "Untitled Event"}
                </h4>
                <p className="text-sm text-gray-600">
                    🕒 {formatTime(event.startDate)}
                    {event.endDate && event.endDate.seconds ? ` - ${formatTime(event.endDate)}` : ''}
                </p>
                <p className="text-sm text-gray-500 truncate" title={event.venue || 'No venue specified'}>
                    📍 {event.venue || 'No venue specified'}
                </p>
            </div>
            <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                <button 
                    onClick={() => onEdit(event)} 
                    className="text-sm text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                    title="Edit Event"
                >
                    ✏️
                </button>
                <button 
                    onClick={() => onDelete(event.id)} 
                    className="text-sm text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                    title="Delete Event"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

export default EventListItem;