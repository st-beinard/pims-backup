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
    limit // Ensure limit is imported
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// --- IMPORT your reusable and event-specific components ---
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CalendarView from '../components/events/CalendarView';
import EventListItem from '../components/events/EventListItem';
import EventForm from '../components/events/EventForm';
// --- End imports ---


export default function EventsPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [eventsForCalendar, setEventsForCalendar] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const currentMonthStart = useMemo(() => {
        const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
        return Timestamp.fromDate(date);
    }, [currentMonthDate]);

    const currentMonthEnd = useMemo(() => {
        const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0, 23, 59, 59);
        return Timestamp.fromDate(date);
    }, [currentMonthDate]);

    const fetchEvents = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        setError('');
        try {
            const calendarQuery = query(
                collection(db, "events"),
                where("creatorId", "==", currentUser.uid),
                where("startDate", ">=", currentMonthStart),
                where("startDate", "<=", currentMonthEnd)
            );
            const calendarSnapshot = await getDocs(calendarQuery);
            const calendarData = calendarSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setEventsForCalendar(calendarData);

            const now = Timestamp.now();
            const upcomingQuery = query(
                collection(db, "events"),
                where("creatorId", "==", currentUser.uid),
                where("startDate", ">=", now),
                orderBy("startDate", "asc"),
                limit(5) // Make sure limit is imported from firebase/firestore
            );
            const upcomingSnapshot = await getDocs(upcomingQuery);
            const upcomingData = upcomingSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setUpcomingEvents(upcomingData);

        } catch (err) {
            console.error("Error fetching events: ", err);
            setError("Failed to fetch events. Check Firestore rules or query.");
            if (err.message.includes("requires an index")) {
                setError("Database query for events requires an index. Check the Firestore console error message for a link to create it.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchEvents();
        } else {
            setIsLoading(false);
        }
    }, [currentUser, currentMonthDate]);

    const handleSaveEvent = async (eventData) => {
        if (!currentUser) { setError("Not authenticated."); return; }
        setIsLoading(true);
        try {
            if (editingEvent?.id) {
                await updateDoc(doc(db, "events", editingEvent.id), { ...eventData, updatedAt: Timestamp.now() });
            } else {
                await addDoc(collection(db, "events"), {
                    ...eventData,
                    creatorId: currentUser.uid,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    status: eventData.status || "Upcoming",
                });
            }
            setShowEventForm(false);
            setEditingEvent(null);
            fetchEvents();
        } catch (err) {
            console.error("Error saving event:", err);
            setError("Failed to save event.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        setIsLoading(true);
        try {
            await deleteDoc(doc(db, "events", eventId));
            fetchEvents();
        } catch (err) {
            console.error("Error deleting event:", err);
            setError("Failed to delete event.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    const handleToday = () => {
        setCurrentMonthDate(new Date());
    };

    const handleDateClick = (date) => {
        setShowEventForm(true);
        setEditingEvent({ startDate: Timestamp.fromDate(date) });
    };

    const handleEditEventClick = (eventToEdit) => {
        setEditingEvent(eventToEdit);
        setShowEventForm(true);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar pageTitle="Events Dashboard" />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2">
                        <div className="w-full sm:w-1/2 lg:w-1/3">
                            <input
                                type="text"
                                placeholder="Search Events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3 mt-2 sm:mt-0">
                            <button
                                onClick={() => { setShowEventForm(true); setEditingEvent(null); setError(''); }}
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
                        <div className="bg-white p-2 sm:p-4 rounded-lg shadow mb-6">
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <button
                                    onClick={handlePrevMonth}
                                    className="px-3 py-1.5 border rounded-md hover:bg-gray-100 text-sm text-gray-700"
                                >
                                    {'< Prev'} {/* Alternative: Unicode character ‹ */}
                                </button>
                                <button
                                    onClick={handleToday}
                                    className="px-3 py-1.5 border rounded-md hover:bg-gray-100 text-indigo-600 font-semibold text-sm"
                                >
                                    Today
                                </button>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center">
                                    {currentMonthDate.toLocaleString('default', { month: 'long' })} {currentMonthDate.getFullYear()}
                                </h3>
                                <button
                                    onClick={handleNextMonth}
                                    className="px-3 py-1.5 border rounded-md hover:bg-gray-100 text-sm text-gray-700"
                                >
                                    {'Next >'} {/* Alternative: Unicode character › */}
                                </button>
                            </div>
                            <CalendarView currentDate={currentMonthDate} onDateClick={handleDateClick} events={eventsForCalendar} />
                        </div>
                    )}

                    {!showEventForm && (
                        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
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
                            ) : !isLoading && !error ? (
                                <p className="text-gray-500 text-sm">No upcoming events found.</p>
                            ) : null}
                        </div>
                    )}

                    {!showEventForm && (
                        <div className="flex justify-end mt-6">
                            <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition duration-150">
                                View Archived
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}