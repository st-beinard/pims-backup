// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import {
    collection, query, where, orderBy, limit, getDocs, Timestamp, addDoc
} from "firebase/firestore";

// NO Sidebar or Topbar import here (as it's handled by Layout.jsx)

// --- Child Components for Dashboard Content (YOUR EXISTING CODE - VERBATIM) ---
const QuickActionButton = ({ title, icon, onClick }) => (
     <button
        onClick={onClick}
        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
        <span className="text-4xl mb-3 text-blue-600">{icon === '➕' ? '➕' : icon === '✔️' ? '✔️' : icon === '📁' ? '📁' : '👥'}</span>
        <span className="text-base font-medium text-gray-700">{title}</span>
    </button>
);

const TaskItem = ({ task }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
        <div className="flex items-center">
            <input type="checkbox" className="mr-4 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0" checked={task.isCompleted ?? false} readOnly />
            <span className="text-gray-800 text-sm">{task.title || 'Untitled Task'}</span>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
            Due: {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
        </span>
    </div>
);

const EventItem = ({ event }) => (
    <div className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
        <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-gray-800 text-sm">{event.name || 'Untitled Event'}</span>
            <span className="text-xs text-gray-500 whitespace-nowrap">
                {event.startDate?.seconds ? new Date(event.startDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </span>
        </div>
        <div className="text-xs text-gray-600 flex items-center">
             <span className="mr-1">🕒</span>
              {event.startTime?.seconds ? new Date(event.startTime.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
             {event.endTime?.seconds ? ` - ${new Date(event.endTime.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}
             {!event.startTime?.seconds && !event.endTime?.seconds && <span className="italic">No time specified</span>}
        </div>
    </div>
);
// --- End YOUR EXISTING Child Components ---

// --- EventForm Component (YOUR EXISTING DETAILED EventForm - VERBATIM) ---
const EventForm = ({ onSubmit, onCancel, initialData = null, submitButtonText = "Create Event" }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const toDatetimeLocal = (timestamp) => {
        if (!timestamp?.seconds) return '';
        const date = new Date(timestamp.seconds * 1000 - (new Date().getTimezoneOffset() * 60000));
        return date.toISOString().slice(0, 16);
    };
    const defaultStartTime = () => new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const [startDateTime, setStartDateTime] = useState(initialData?.startDate ? toDatetimeLocal(initialData.startDate) : defaultStartTime());
    const [endDateTime, setEndDateTime] = useState(initialData?.endDate ? toDatetimeLocal(initialData.endDate) : '');
    const [venue, setVenue] = useState(initialData?.venue || '');
    const [status, setStatus] = useState(initialData?.status || 'Upcoming');
    const [formSpecificError, setFormSpecificError] = useState('');

    useEffect(() => {
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
        setStartDateTime(initialData?.startDate ? toDatetimeLocal(initialData.startDate) : defaultStartTime());
        setEndDateTime(initialData?.endDate ? toDatetimeLocal(initialData.endDate) : '');
        setVenue(initialData?.venue || '');
        setStatus(initialData?.status || 'Upcoming');
        setFormSpecificError('');
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormSpecificError('');
        if (!name.trim()) { setFormSpecificError("Event name is required."); return; }
        if (!startDateTime) { setFormSpecificError("Start date & time are required."); return; }
        if (endDateTime && new Date(endDateTime) < new Date(startDateTime)) { setFormSpecificError("End date & time cannot be before start date & time."); return; }
        const formData = {
            name: name.trim(), description: description.trim(),
            startDate: startDateTime ? Timestamp.fromDate(new Date(startDateTime)) : null,
            endDate: endDateTime ? Timestamp.fromDate(new Date(endDateTime)) : null,
            venue: venue.trim(), status: status,
        };
        onSubmit(formData);
    };
    const inputStyle = "mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
    const labelStyle = "block text-sm font-medium text-gray-700";
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-white rounded-xl shadow-2xl w-full max-w-2xl space-y-6 transform transition-all duration-300 ease-in-out scale-100">
                <h2 className="text-xl font-semibold text-gray-900">{initialData?.id ? "Edit Event" : "Create New Event"}</h2>
                {formSpecificError && <p className="text-red-600 bg-red-50 p-3 rounded text-sm border border-red-200">{formSpecificError}</p>}
                <div><label htmlFor="dash-event-name" className={labelStyle}>Event Name</label><input id="dash-event-name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputStyle} /></div>
                <div><label htmlFor="dash-event-description" className={labelStyle}>Description</label><textarea id="dash-event-description" value={description} onChange={e => setDescription(e.target.value)} rows="4" className={inputStyle}></textarea></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label htmlFor="dash-event-startdatetime" className={labelStyle}>Start Date & Time</label><input id="dash-event-startdatetime" type="datetime-local" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} required className={inputStyle} /></div>
                    <div><label htmlFor="dash-event-enddatetime" className={labelStyle}>End Date & Time</label><input id="dash-event-enddatetime" type="datetime-local" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} className={inputStyle} min={startDateTime || undefined} /></div>
                </div>
                <div><label htmlFor="dash-event-venue" className={labelStyle}>Venue</label><input id="dash-event-venue" type="text" value={venue} onChange={e => setVenue(e.target.value)} className={inputStyle} /></div>
                <div><label htmlFor="dash-event-status" className={labelStyle}>Status</label><select id="dash-event-status" value={status} onChange={e => setStatus(e.target.value)} className={inputStyle}><option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option><option value="Canceled">Canceled</option><option value="Postponed">Postponed</option></select></div>
                <div className="flex justify-end space-x-3 pt-5"><button type="button" onClick={onCancel} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Cancel</button><button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border rounded-md shadow-sm">{submitButtonText}</button></div>
            </form>
        </div>
    );
};
// --- End EventForm ---

// --- TaskForm Component (YOUR EXISTING DETAILED TaskForm - VERBATIM) ---
const TaskForm = ({ onSubmit, onCancel, projectsList = [], usersList = [], initialData = null, submitButtonText = "Create Task" }) => { /* ... (Your full TaskForm code as provided by you previously) ... */ };
// --- End TaskForm ---

// --- TeamOverviewModal Component (YOUR EXISTING TeamOverviewModal - VERBATIM) ---
const TeamOverviewModal = ({ onClose, teamMembers = [] }) => { /* ... (Your full TeamOverviewModal code as provided by you previously) ... */ };
// --- End TeamOverviewModal ---

// --- DashboardProjectForm Component (YOUR EXISTING DashboardProjectForm - VERBATIM) ---
const DashboardProjectForm = ({ onSubmit, onCancel, usersList = [], initialData = null, submitButtonText = "Create Project" }) => { /* ... (Your full DashboardProjectForm code as provided by you previously) ... */ };
// --- End DashboardProjectForm ---


export default function DashboardPage() {
    // --- YOUR EXISTING STATE DECLARATIONS (VERBATIM) ---
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [recentTasks, setRecentTasks] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [showNewEventForm, setShowNewEventForm] = useState(false);
    const [dashboardFormError, setDashboardFormError] = useState('');
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [dashboardTaskFormError, setDashboardTaskFormError] = useState('');
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [projectsForForm, setProjectsForForm] = useState([]);
    const [usersForForm, setUsersForForm] = useState([]);
    const [loadingFormData, setLoadingFormData] = useState(false);
    const [showTeamOverview, setShowTeamOverview] = useState(false);
    const [showNewProjectForm, setShowNewProjectForm] = useState(false);
    const [dashboardProjectFormError, setDashboardProjectFormError] = useState('');
    const [isSubmittingProject, setIsSubmittingProject] = useState(false);

    // YOUR EXISTING useEffect for fetchAllData (WITH DEBUG LOGS FOR EVENTS)
    useEffect(() => {
        if (!currentUser) { setLoadingData(false); setLoadingFormData(false); return; }
        const fetchAllData = async () => {
            setLoadingData(true); setLoadingFormData(true);
            setError(''); setDashboardFormError(''); setDashboardTaskFormError(''); setDashboardProjectFormError('');
            console.log("DashboardPage: fetchAllData started for user:", currentUser.uid); // DEBUG
            try {
                const tasksDisplayQuery = query(collection(db, "tasks"), where("creatorId", "==", currentUser.uid), where("isCompleted", "==", false), orderBy("dueDate", "asc"), limit(3));
                const tasksSnapshot = await getDocs(tasksDisplayQuery);
                setRecentTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                console.log("DashboardPage: Recent tasks fetched:", tasksSnapshot.docs.length); // DEBUG

                const now = Timestamp.now();
                console.log("DashboardPage: Current Timestamp for events query (now):", now.toDate().toISOString()); // DEBUG
                const eventsDisplayQuery = query(
                    collection(db, "events"),
                    where("creatorId", "==", currentUser.uid),
                    where("startDate", ">=", now),
                    orderBy("startDate", "asc"),
                    limit(3)
                );
                console.log("DashboardPage: Executing events query..."); // DEBUG
                const eventsSnapshot = await getDocs(eventsDisplayQuery);
                const fetchedUpcomingEvents = eventsSnapshot.docs.map(doc => {
                    console.log("DashboardPage: Fetched event data:", doc.id, doc.data()); // DEBUG
                    return { id: doc.id, ...doc.data() };
                });
                setUpcomingEvents(fetchedUpcomingEvents);
                console.log("DashboardPage: Upcoming events fetched and set. Count:", fetchedUpcomingEvents.length); // DEBUG

                const projectsDropdownQuery = query(collection(db, "projects"), where("creatorId", "==", currentUser.uid), orderBy("name", "asc"));
                const projectsFormSnapshot = await getDocs(projectsDropdownQuery);
                setProjectsForForm(projectsFormSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const usersDropdownQuery = query(collection(db, "users"), orderBy("displayName", "asc"));
                const usersFormSnapshot = await getDocs(usersDropdownQuery);
                setUsersForForm(usersFormSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));

            } catch (err) {
                console.error("DashboardPage: Error in fetchAllData:", err);
                let errMsg = "Failed to load initial data.";
                if (err.code === 'permission-denied') errMsg = "Permission denied. Check Firestore rules.";
                else if (err.message && err.message.includes("requires an index")) errMsg = "DB query needs an index. Check console for link(s).";
                else errMsg = `Error: ${err.message}`; // More specific error
                setError(errMsg);
            } finally {
                setLoadingData(false); setLoadingFormData(false);
                console.log("DashboardPage: fetchAllData finished."); // DEBUG
            }
        };
        fetchAllData();
    }, [currentUser]);

    // YOUR EXISTING handleSaveNewDashboardEvent (WITH DEBUG LOGS)
    const handleSaveNewDashboardEvent = async (eventDataFromForm) => {
        if (!currentUser) { setDashboardFormError("Logged in to create."); return; }
        setIsSubmittingEvent(true); setDashboardFormError('');
        console.log("DashboardPage: Attempting to save new event:", eventDataFromForm); // DEBUG
        try {
            await addDoc(collection(db, "events"), { ...eventDataFromForm, creatorId: currentUser.uid, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),});
            setShowNewEventForm(false);
            console.log("DashboardPage: New event saved. Re-fetching upcoming events..."); // DEBUG
            const now = Timestamp.now();
            const refreshedEventsQuery = query(collection(db, "events"), where("creatorId", "==", currentUser.uid), where("startDate", ">=", now), orderBy("startDate", "asc"), limit(3));
            const refreshedSnapshot = await getDocs(refreshedEventsQuery);
            const newUpcomingEvents = refreshedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUpcomingEvents(newUpcomingEvents);
            console.log("DashboardPage: Upcoming events refreshed. Count:", newUpcomingEvents.length); // DEBUG
        } catch (err) {
            console.error("DashboardPage: Error creating new event:", err);
            setDashboardFormError(`Failed: ${err.message}`);
        } finally {
            setIsSubmittingEvent(false);
        }
    };

    // YOUR EXISTING handleSaveNewDashboardTask (VERBATIM)
    const handleSaveNewDashboardTask = async (taskDataFromForm) => { /* ... (Your full logic as before) ... */ };

    // YOUR EXISTING handleSaveNewDashboardProject (VERBATIM)
    const handleSaveNewDashboardProject = async (projectDataFromForm) => { /* ... (Your full logic as before) ... */ };

    return (
        <div className="p-6 md:p-8">
            {/* Event Form Modal */}
            {showNewEventForm && (<EventForm onSubmit={handleSaveNewDashboardEvent} onCancel={() => { setShowNewEventForm(false); setDashboardFormError(''); }} submitButtonText={isSubmittingEvent ? "Creating..." : "Create Event"}/> )}
            {dashboardFormError && !showNewEventForm && (<p className="text-red-600 bg-red-100 p-3 rounded text-sm mb-4 border border-red-300 -mt-2">{dashboardFormError}</p>)}

            {/* Task Form Modal */}
            {showNewTaskForm && (<TaskForm onSubmit={handleSaveNewDashboardTask} onCancel={() => { setShowNewTaskForm(false); setDashboardTaskFormError(''); }} projectsList={projectsForForm} usersList={usersForForm} submitButtonText={isSubmittingTask ? "Creating..." : "Create Task"}/> )}
            {dashboardTaskFormError && !showNewTaskForm && (<p className="text-red-600 bg-red-100 p-3 rounded text-sm mb-4 border border-red-300 -mt-2">{dashboardTaskFormError}</p>)}

            {/* Team Overview Modal */}
            {showTeamOverview && (<TeamOverviewModal onClose={() => setShowTeamOverview(false)} teamMembers={usersForForm} /> )}

            {/* Project Form Modal Rendering */}
            {showNewProjectForm && (
                <DashboardProjectForm
                    onSubmit={handleSaveNewDashboardProject}
                    onCancel={() => { setShowNewProjectForm(false); setDashboardProjectFormError(''); }}
                    usersList={usersForForm}
                    submitButtonText={isSubmittingProject ? "Creating..." : "Create Project"}
                />
            )}
            {dashboardProjectFormError && !showNewProjectForm && (
                 <p className="text-red-600 bg-red-100 p-3 rounded text-sm mb-4 border border-red-300 -mt-2">{dashboardProjectFormError}</p>
            )}

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                 <QuickActionButton title="New Event" icon="➕" onClick={() => { setShowNewEventForm(true); setDashboardFormError(''); }}/>
                 <QuickActionButton title="Add Task" icon="✔️" onClick={() => { if (loadingFormData) { alert("Data is loading..."); return; } setShowNewTaskForm(true); setDashboardTaskFormError(''); }}/>
                 <QuickActionButton
                    title="New Project" icon="📁"
                    onClick={() => {
                        if (loadingFormData) { alert("User data for facilitators is loading, please wait..."); return; }
                        setShowNewProjectForm(true);
                        setDashboardProjectFormError('');
                    }}
                 />
                 <QuickActionButton title="Team" icon="👥" onClick={() => { if (loadingFormData) { alert("Data is loading..."); return; } setShowTeamOverview(true); }}/>
            </div>

            {/* YOUR EXISTING ERROR DISPLAY, LOADING DISPLAY, AND CONTENT SECTIONS - VERBATIM */}
            {error && (<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert"><p className="font-bold">Data Error</p><p>{error}</p></div>)}
            {loadingData && !error && (<div className="text-center p-10 text-gray-600"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>Loading dashboard content...</div>)}
            {!loadingData && (
                 <div className="space-y-8">
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                         <h3 className="text-xl font-semibold mb-4 text-gray-700">Recent Tasks</h3>
                         {(!error || recentTasks.length > 0) && recentTasks.length > 0 ? (
                             <div className="space-y-3">{recentTasks.map(task => (<TaskItem key={task.id} task={task} />))}</div>
                         ) : !error ? (<p className="text-gray-500 italic">No incomplete tasks.</p>) : null }
                     </div>
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                         <h3 className="text-xl font-semibold mb-4 text-gray-700">Upcoming Events</h3>
                          {(!error || upcomingEvents.length > 0) && upcomingEvents.length > 0 ? (
                             <div className="space-y-4">{upcomingEvents.map(event => (<EventItem key={event.id} event={event} />))}</div>
                         ) : !error ? (<p className="text-gray-500 italic">No upcoming events.</p>) : null }
                     </div>
                     <div className="flex justify-end mt-6">
                        <button onClick={() => navigate('/archived')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out">View Archived</button>
                    </div>
                 </div>
             )}
        </div>
    );
}