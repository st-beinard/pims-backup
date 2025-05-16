// frontend/src/components/events/EventForm.jsx
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

const EventForm = ({ onSubmit, initialData, onCancel, submitButtonText = "Save Event" }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    // Store dates as YYYY-MM-DDTHH:mm for datetime-local input
    const [startDateStr, setStartDateStr] = useState('');
    const [endDateStr, setEndDateStr] = useState('');
    const [venue, setVenue] = useState('');
    const [status, setStatus] = useState('Upcoming'); // Default status
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            // Convert Firestore Timestamps to YYYY-MM-DDTHH:mm strings for input fields
            if (initialData.startDate && initialData.startDate.seconds) {
                const sd = new Date(initialData.startDate.seconds * 1000);
                // Adjust for timezone offset to display correctly in datetime-local
                const timezoneOffset = sd.getTimezoneOffset() * 60000; // offset in milliseconds
                const localStartDate = new Date(sd.getTime() - timezoneOffset);
                setStartDateStr(localStartDate.toISOString().slice(0, 16));
            } else {
                setStartDateStr('');
            }
            if (initialData.endDate && initialData.endDate.seconds) {
                 const ed = new Date(initialData.endDate.seconds * 1000);
                 const timezoneOffset = ed.getTimezoneOffset() * 60000;
                 const localEndDate = new Date(ed.getTime() - timezoneOffset);
                setEndDateStr(localEndDate.toISOString().slice(0, 16));
            } else {
                setEndDateStr('');
            }
            setVenue(initialData.venue || '');
            setStatus(initialData.status || 'Upcoming');
        } else {
            // Reset form for new entry
            setName('');
            setDescription('');
            setStartDateStr('');
            setEndDateStr('');
            setVenue('');
            setStatus('Upcoming');
        }
    }, [initialData]); // Re-populate form when initialData changes

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Event name is required.");
            return;
        }
        if (!startDateStr) {
            setError("Start date and time are required.");
            return;
        }
        setError('');

        const eventData = {
            name: name.trim(),
            description: description.trim(),
            startDate: Timestamp.fromDate(new Date(startDateStr)), // Convert string back to Firestore Timestamp
            endDate: endDateStr ? Timestamp.fromDate(new Date(endDateStr)) : null,
            venue: venue.trim(),
            status,
        };
        await onSubmit(eventData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-1">
                {initialData?.id ? 'Edit Event' : 'Create New Event'}
            </h3>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-3 text-sm" role="alert">{error}</div>}

            <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Event Name</label>
                <input type="text" id="eventName" value={name} onChange={e => setName(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
            </div>

            <div>
                <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="eventDescription" value={description} onChange={e => setDescription(e.target.value)} rows="3"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="eventStartDate" className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                    <input type="datetime-local" id="eventStartDate" value={startDateStr} onChange={e => setStartDateStr(e.target.value)}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                </div>
                <div>
                    <label htmlFor="eventEndDate" className="block text-sm font-medium text-gray-700">End Date & Time</label>
                    <input type="datetime-local" id="eventEndDate" value={endDateStr} onChange={e => setEndDateStr(e.target.value)}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>

            <div>
                <label htmlFor="eventVenue" className="block text-sm font-medium text-gray-700">Venue</label>
                <input type="text" id="eventVenue" value={venue} onChange={e => setVenue(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>

            <div>
                <label htmlFor="eventStatus" className="block text-sm font-medium text-gray-700">Status</label>
                <select id="eventStatus" value={status} onChange={(e) => setStatus(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                    <option value="Pending">Pending</option> {/* Added Pending status */}
                </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Cancel
                </button>
                <button type="submit"
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    {submitButtonText}
                </button>
            </div>
        </form>
    );
};

export default EventForm;