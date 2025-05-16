// frontend/src/components/events/CalendarView.jsx
import React from 'react';

const CalendarView = ({ currentDate, onDateClick, events = [] }) => {
    const [month, year] = [currentDate.getMonth(), currentDate.getFullYear()];

    const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay(); // 0=Sun, 1=Mon,...

    const monthDays = daysInMonth(month, year);
    const firstDay = firstDayOfMonth(month, year);

    const dayHeaders = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    const calendarGrid = [];

    // Fill blanks for the first week
    for (let i = 0; i < firstDay; i++) {
        calendarGrid.push(<div key={`blank-start-${i}`} className="border p-2 h-24 text-gray-400 bg-gray-50"></div>);
    }

    // Fill days of the month
    for (let day = 1; day <= monthDays; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Filter events for the current day
        const dayEvents = events.filter(event =>
            event.startDate && // Ensure startDate exists and is a Firestore Timestamp
            typeof event.startDate.seconds === 'number' && // Check if it's a valid Timestamp structure
            new Date(event.startDate.seconds * 1000).toISOString().split('T')[0] === dateString
        );

        calendarGrid.push(
            <div
                key={day}
                onClick={() => onDateClick(date)}
                className="border p-2 h-24 cursor-pointer hover:bg-indigo-50 transition-colors flex flex-col"
            >
                <div className="font-semibold text-right text-sm text-gray-700">{day}</div>
                {/* Display event indicators */}
                <div className="mt-1 space-y-0.5 overflow-hidden flex-grow">
                    {dayEvents.slice(0, 2).map(event => ( // Show max 2 event indicators
                        <div key={event.id} className="text-xs bg-blue-500 text-white rounded px-1 py-0.5 truncate" title={event.name}>
                            {event.name}
                        </div>
                    ))}
                    {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                            +{dayEvents.length - 2} more
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Fill blanks for the last week (to make it a full grid)
    const totalCellsFilled = firstDay + monthDays; // Blanks at start + actual days
    const remainingCells = (7 - (totalCellsFilled % 7)) % 7; // Ensure full rows
    for (let i = 0; i < remainingCells; i++) {
        calendarGrid.push(<div key={`blank-end-${i}`} className="border p-2 h-24 text-gray-400 bg-gray-50"></div>);
    }

    return (
        <div className="bg-white p-2 sm:p-4 rounded-lg shadow"> {/* Adjusted padding */}
            <div className="grid grid-cols-7 gap-px"> {/* gap-px makes borders look connected */}
                {dayHeaders.map(header => (
                    <div key={header} className="text-center font-medium p-2 text-xs sm:text-sm text-gray-600">
                        {header}
                    </div>
                ))}
                {calendarGrid}
            </div>
        </div>
    );
};

export default CalendarView;