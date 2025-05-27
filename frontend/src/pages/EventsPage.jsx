// frontend/src/pages/EventsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit
} from 'firebase/firestore';

// --- IMPORT YOUR REUSABLE event-specific components ---
// Assuming these are correctly placed, e.g., in src/components/events/
import CalendarView from '../components/events/CalendarView';
import EventListItem from '../components/events/EventListItem'; // <<< ENSURE THIS FILE EXISTS or use placeholder
import EventForm from '../components/events/EventForm';       // <<< ENSURE THIS FILE EXISTS or use placeholder
// --- End imports ---

// NO Sidebar or Topbar import here (because Layout.jsx handles them)

export default function EventsPage() {
    const { currentUser } = useAuth();

    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [eventsForCalendar, setEventsForCalendar] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // NO handleLogout here - it's in Layout.jsx

    const currentMonthStart = useMemo(() => {
        const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
        return Timestamp.fromDate(date);
    }, [currentMonthDate]);

    const currentMonthEnd = useMemo(() => {
        const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0, 23, 59, 59);
        return Timestamp.fromDate(date);
    }, [currentMonthDate]);

    const fetchEvents = React.useCallback(async () => {
        if (!currentUser) { setIsLoading(false); return; }
        setIsLoading(true); setError('');
        try {
            const calQ = query(collection(db, "events"), where("creatorId", "==", currentUser.uid), where("startDate", ">=", currentMonthStart), where("startDate", "<=", currentMonthEnd));
            const calSnap = await getDocs(calQ);
            setEventsForCalendar(calSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const upQ = query(collection(db, "events"), where("creatorId", "==", currentUser.uid), where("startDate", ">=", Timestamp.now()), orderBy("startDate", "asc"), limit(5));
            const upSnap = await getDocs(upQ);
            setUpcomingEvents(upSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error("Error fetching events: ", err);
            let errMsg = "Failed to fetch events.";
            if (err.message?.includes("requires an index")) errMsg = "DB query for events needs an index. Check console.";
            else if (err.code === 'permission-denied') errMsg = "Permission denied for events.";
            setError(errMsg);
        } finally { setIsLoading(false); }
    }, [currentUser, currentMonthStart, currentMonthEnd]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleSaveEvent = async (eventDataFromForm) => {
        if (!currentUser) { setError("Not authenticated."); return; }
        setIsLoading(true);
        try {
            const dataToSave = {
                ...eventDataFromForm,
                startDate: eventDataFromForm.startDate instanceof Date ? Timestamp.fromDate(eventDataFromForm.startDate) : eventDataFromForm.startDate,
                endDate: eventDataFromForm.endDate instanceof Date ? Timestamp.fromDate(eventDataFromForm.endDate) : eventDataFromForm.endDate,
                updatedAt: Timestamp.now(),
            };
            if (editingEvent?.id) {
                await updateDoc(doc(db, "events", editingEvent.id), dataToSave);
            } else {
                await addDoc(collection(db, "events"), {
                    ...dataToSave,
                    creatorId: currentUser.uid,
                    createdAt: Timestamp.now(),
                    status: eventDataFromForm.status || "Upcoming",
                });
            }
            setShowEventForm(false); setEditingEvent(null); fetchEvents();
        } catch (err) { console.error("Error saving event:", err); setError("Failed to save event."); }
        finally { setIsLoading(false); }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        setIsLoading(true); try { await deleteDoc(doc(db, "events", eventId)); fetchEvents(); }
        catch (err) { console.error("Error deleting event:", err); setError("Failed to delete event."); }
        finally { setIsLoading(false); }
    };

    const handlePrevMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleToday = () => setCurrentMonthDate(new Date());

    const handleDateClickedFromCalendarView = (dateFromCalendar) => {
        setShowEventForm(true);
        setEditingEvent({ startDate: Timestamp.fromDate(dateFromCalendar) });
        setError('');
    };
    const handleMonthChangeFromCalendarView = (newActiveStartDate) => setCurrentMonthDate(newActiveStartDate);
    const handleEditEventClick = (eventToEdit) => { setEditingEvent(eventToEdit); setShowEventForm(true); setError(''); };
    const handleOpenNewEventForm = () => { setShowEventForm(true); setEditingEvent(null); setError(''); };


    return (
        <div className="p-4 sm:p-6"> {/* Padding for the content area itself */}
            {/* ***** MODIFIED SECTION for Search and Buttons ***** */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
                {/* Left side: Search Input */}
                <div className="w-full sm:w-auto sm:flex-grow md:flex-grow-0 md:w-1/2 lg:w-1/3">
                    <input
                        type="text"
                        placeholder="Search Events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end_or_start_as_needed"> {/* Adjusted for potential full width on mobile */}
                    <button
                        onClick={handleOpenNewEventForm}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 sm:px-4 rounded-md shadow-sm text-sm whitespace-nowrap"
                    >
                        + New Event
                    </button>
                    <button
                        onClick={() => setFilterStatus(filterStatus === "Pending" ? "" : "Pending")}
                        className={`py-2 px-3 sm:px-4 rounded-md shadow-sm text-sm font-medium border whitespace-nowrap ${filterStatus === "Pending"
                                ? "bg-yellow-400 border-yellow-500 text-yellow-800"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        {filterStatus === "Pending" ? "Showing Pending" : "Filter Pending"}
                    </button>
                </div>
            </div>
            {/* ***** END MODIFIED SECTION ***** */}


            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded relative mb-4 text-sm" role="alert">{error}</div>}

            {showEventForm && (
                <EventForm
                    onSubmit={handleSaveEvent}
                    initialData={editingEvent}
                    onCancel={() => { setShowEventForm(false); setEditingEvent(null); setError(''); }}
                    submitButtonText={editingEvent?.id ? "Update Event" : "Create Event"}
                />
            )}

            {!showEventForm && (
                <div className="bg-white p-0 sm:p-0 rounded-lg shadow-lg mb-6">
                    <div className="flex justify-between items-center mb-3 sm:mb-4 p-3 border-b">
                        <button onClick={handlePrevMonth} className="px-3 py-1.5 border rounded-md hover:bg-gray-100 text-sm text-gray-700">{'< Prev'}</button>
                        <button onClick={handleToday} className="px-3 py-1.5 border rounded-md hover:bg-gray-100 text-indigo-600 font-semibold text-sm">Today</button>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center">
                            {currentMonthDate.toLocaleString('default', { month: 'long' })} {currentMonthDate.getFullYear()}
                        </h3>
                        <button onClick={handleNextMonth} className="px-3 py-1.5 border rounded-md hover:bg-gray-100 text-sm text-gray-700">{'Next >'}</button>
                    </div>
                    <CalendarView
                        currentDate={currentMonthDate}
                        onDateClick={handleDateClickedFromCalendarView}
                        events={eventsForCalendar}
                        onMonthChange={handleMonthChangeFromCalendarView}
                    />
                </div>
            )}

            {!showEventForm && (
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Upcoming Events</h3>
                    {isLoading && !upcomingEvents.length && !error ? <p className="text-gray-500 text-sm">Loading upcoming events...</p> : null}
                    {!isLoading && !error && upcomingEvents.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingEvents.map(event => (
                                <EventListItem key={event.id} event={event}
                                    onEdit={handleEditEventClick}
                                    onDelete={handleDeleteEvent} />
                            ))}
                        </div>
                    ) : !isLoading && !error ? (<p className="text-gray-500 text-sm">No upcoming events found.</p>) : null}
                </div>
            )}

            {!showEventForm && (
                <div className="flex justify-end mt-6">
                   <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition duration-150">View Archived</button>
                </div>
            )}
        </div>
    );
}