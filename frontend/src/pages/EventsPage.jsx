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
    limit,
    getDoc // Ensure getDoc is imported if used (e.g., in handleDeleteEvent debug)
} from 'firebase/firestore';

// --- IMPORT YOUR REUSABLE event-specific components ---
import CalendarView from '../components/events/CalendarView';
import EventListItem from '../components/events/EventListItem';
import EventForm from '../components/events/EventForm';
// --- End imports ---

// NO Sidebar or Topbar import here (because Layout.jsx handles them)

export default function EventsPage() {
    const { currentUser } = useAuth();

    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [eventsForCalendar, setEventsForCalendar] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [archivedEvents, setArchivedEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false); // For delete operation
    const [error, setError] = useState('');
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showArchived, setShowArchived] = useState(false);

    const currentMonthStart = useMemo(() => Timestamp.fromDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1)), [currentMonthDate]);
    const currentMonthEnd = useMemo(() => Timestamp.fromDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0, 23, 59, 59)), [currentMonthDate]);

    const fetchEvents = React.useCallback(async (fetchArchived = false) => {
        if (!currentUser) { setIsLoading(false); return; }
        setIsLoading(true); setError('');
        const now = Timestamp.now();
        const todayStart = Timestamp.fromDate(new Date(now.toDate().setHours(0,0,0,0)));

        try {
            if (fetchArchived) {
                console.log("EventsPage: Fetching ARCHIVED events...");
                const archivedQ = query(collection(db, "events"), where("startDate", "<", todayStart), orderBy("startDate", "desc"));
                const archivedSnap = await getDocs(archivedQ);
                setArchivedEvents(archivedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                console.log("EventsPage: Archived events fetched:", archivedSnap.docs.length);
                setEventsForCalendar([]); 
                setUpcomingEvents([]);
            } else {
                console.log("EventsPage: Fetching CURRENT/UPCOMING events...");
                const effectiveCalendarQueryStartDate = new Date(Math.max(currentMonthStart.toDate().getTime(), todayStart.toDate().getTime()));
                const effectiveStartTimestampForCalendar = Timestamp.fromDate(effectiveCalendarQueryStartDate);
                const calQ = query( collection(db, "events"), where("startDate", ">=", effectiveStartTimestampForCalendar), where("startDate", "<=", currentMonthEnd), orderBy("startDate", "asc"));
                const calSnap = await getDocs(calQ);
                setEventsForCalendar(calSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                console.log("EventsPage: Calendar events fetched:", calSnap.docs.length);

                const upQ = query( collection(db, "events"), where("startDate", ">=", todayStart), orderBy("startDate", "asc"), limit(5));
                const upSnap = await getDocs(upQ);
                setUpcomingEvents(upSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                console.log("EventsPage: Upcoming events list fetched:", upSnap.docs.length);
                setArchivedEvents([]);
            }
        } catch (err) {
            console.error("Error fetching events: ", err);
            let errMsg = `Failed to fetch ${fetchArchived ? 'archived' : 'current/upcoming'} events.`;
            if (err.message?.includes("requires an index")) errMsg += " DB query needs an index. Check console.";
            else if (err.code === 'permission-denied') errMsg += " Permission denied.";
            setError(errMsg);
        } finally { setIsLoading(false); }
    }, [currentUser, currentMonthStart, currentMonthEnd]);

    useEffect(() => {
        fetchEvents(showArchived);
    }, [fetchEvents, showArchived, currentMonthDate]);

    const handleSaveEvent = async (eventDataFromForm) => {
        if (!currentUser) { setError("Not authenticated."); return; }
        setIsLoading(true); // Or a specific isSavingEvent state
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
            setShowEventForm(false); setEditingEvent(null); fetchEvents(showArchived);
        } catch (err) { console.error("Error saving event:", err); setError("Failed to save event."); }
        finally { setIsLoading(false); }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        console.log("--- handleDeleteEvent Initiated ---");
        console.log("Event ID to delete:", eventId);
        if (!currentUser) {
            console.error("EventsPage: No currentUser for delete!"); setError("Authentication error."); return;
        }
        console.log("Current User UID:", currentUser.uid);
        // Optional debug fetch:
        // try { const eventDocRef = doc(db, "events", eventId); const eventSnap = await getDoc(eventDocRef);
        // if (eventSnap.exists()) { console.log("Event to delete:", eventSnap.data()); } } catch (e) { console.log("err fetching doc");}
        setIsDeleting(true); setError('');
        try {
            await deleteDoc(doc(db, "events", eventId));
            console.log("EventsPage: deleteDoc successful for event ID:", eventId);
            fetchEvents(showArchived);
        } catch (err) {
            console.error("handleDeleteEvent - Error Deleting:", err); setError(`Failed to delete: ${err.message}`);
        } finally {
            setIsDeleting(false); console.log("--- handleDeleteEvent Finished ---");
        }
    };

    const handlePrevMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleToday = () => { setShowArchived(false); setCurrentMonthDate(new Date()); };
    const handleDateClickedFromCalendarView = (dateFromCalendar) => {
        if (showArchived) { alert("Viewing archived. Switch to current view to add."); return; }
        setShowEventForm(true); setEditingEvent({ startDate: Timestamp.fromDate(dateFromCalendar) }); setError('');
    };
    const handleMonthChangeFromCalendarView = (newActiveStartDate) => { if (!showArchived) { setCurrentMonthDate(newActiveStartDate); } };
    const handleEditEventClick = (eventToEdit) => { setEditingEvent(eventToEdit); setShowEventForm(true); setError(''); };
    const handleOpenNewEventForm = () => { if (showArchived) setShowArchived(false); setShowEventForm(true); setEditingEvent(null); setError(''); };
    
    const toggleArchivedView = () => {
        setShowEventForm(false); 
        setShowArchived(prev => !prev); 
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
                <div className="w-full sm:w-auto sm:flex-grow md:flex-grow-0 md:w-1/2 lg:w-1/3">
                    <input type="text" placeholder="Search Events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-start sm:justify-end">
                    <button onClick={handleOpenNewEventForm} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 sm:px-4 rounded-md shadow-sm text-sm whitespace-nowrap"> + New Event </button>
                    <button onClick={() => setFilterStatus(filterStatus === "Pending" ? "" : "Pending")} className={`py-2 px-3 sm:px-4 rounded-md shadow-sm text-sm font-medium border whitespace-nowrap ${filterStatus === "Pending" ? "bg-yellow-400 border-yellow-500 text-yellow-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
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
                <>
                    {!showArchived && (
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
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">
                            {showArchived ? "Archived Events (Past)" : "Upcoming Events"}
                        </h3>
                        {isLoading && <p className="text-gray-500 text-sm">Loading events...</p>}
                        {!isLoading && !error && (
                            (showArchived ? archivedEvents : upcomingEvents).length > 0 ? (
                                <div className="space-y-3">
                                    {(showArchived ? archivedEvents : upcomingEvents)
                                        .filter(event => event.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(event => (
                                            <EventListItem key={event.id} event={event}
                                                onEdit={handleEditEventClick}
                                                onDelete={handleDeleteEvent} />
                                        ))
                                    }
                                    {(showArchived ? archivedEvents : upcomingEvents).filter(event => event.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && searchTerm && (
                                        <p className="text-gray-500 text-sm">No events match your search in this view.</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    {showArchived ? "No archived events found." : "No upcoming events found."}
                                </p>
                            )
                        )}
                    </div>
                    <div className="flex justify-end mt-6">
                       <button
                            onClick={toggleArchivedView}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition duration-150"
                       >
                           {showArchived ? "View Upcoming Events" : "View Archived Events"}
                       </button>
                    </div>
                </>
            )}
        </div>
    );
}