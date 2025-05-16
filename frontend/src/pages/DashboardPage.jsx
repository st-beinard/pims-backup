// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom'; // Keep Navigate for the fallback
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";

// --- IMPORT your new reusable components ---
import Sidebar from '../components/Sidebar'; // Adjust path if your components folder is different
import Topbar from '../components/Topbar';   // Adjust path

// --- Child Components specific to Dashboard (QuickActionButton, TaskItem, EventItem) ---
// You can keep these defined here OR move them to src/components/dashboard/
// and import them for better organization if they become complex.

const QuickActionButton = ({ title, icon, onClick }) => ( // Added onClick prop
     <button
        onClick={onClick}
        className="bg-white p-4 rounded-lg shadow hover:shadow-md flex flex-col items-center justify-center text-center transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
    >
        <span className="text-2xl mb-2">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{title}</span>
    </button>
);

const TaskItem = ({ task }) => (
     <div className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
        <div className="flex items-center min-w-0"> {/* Added min-w-0 for better truncation */}
            <input type="checkbox" className="mr-3 h-4 w-4 flex-shrink-0 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500" defaultChecked={task.isCompleted ?? false} />
            <span className="truncate text-sm text-gray-800">{task.title || 'Untitled Task'}</span>
        </div>
        <span className="text-xs text-gray-500 text-right flex-shrink-0 ml-2 whitespace-nowrap"> {/* Added whitespace-nowrap */}
            Due {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
        </span>
    </div>
);

const EventItem = ({ event }) => (
    <div className="p-3 border-b last:border-b-0 hover:bg-gray-50">
        <div className="flex justify-between items-center mb-1">
             <span className="font-medium text-sm text-gray-800 truncate">{event.name || 'Untitled Event'}</span>
            <span className="text-xs text-gray-500 text-right flex-shrink-0 ml-2 whitespace-nowrap">
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
// --- End Dashboard-specific Child Components ---

export default function DashboardPage() {
  // AuthContext will provide currentUser, userData. Logout is handled by Topbar.
  const { currentUser } = useAuth();
  // Removed: useNavigate as it's not directly used for logout here anymore

  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Removed: handleLogout function, as Topbar will handle it internally

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      console.log("Dashboard: No current user found yet.");
      return;
    }

    console.log("Dashboard: Current user found, fetching data...", currentUser.uid);
    setLoading(true);
    setError('');

    const fetchData = async () => {
      try {
        const tasksQuery = query(
            collection(db, "tasks"),
            // where("assigneeId", "==", currentUser.uid), // Filter by user if applicable
            where("isCompleted", "==", false),
            orderBy("dueDate", "asc"),
            limit(3)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentTasks(tasksData);
        console.log("Dashboard tasks fetched:", tasksData);

        const now = Timestamp.now();
        const eventsQuery = query(
            collection(db, "events"),
            // where("creatorId", "==", currentUser.uid), // Filter by user if applicable
            where("startDate", ">=", now),
            orderBy("startDate", "asc"),
            limit(3)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUpcomingEvents(eventsData);
        console.log("Dashboard events fetched:", eventsData);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (err.code === 'permission-denied') {
             setError("Permission denied. Check Firestore rules.");
        } else if (err.message.includes("requires an index")) {
             setError("Database query requires an index. Check the Firestore console error message for a link to create it.");
        } else {
             setError("Failed to load dashboard data. Check console for details.");
        }
      } finally {
        setLoading(false);
        console.log("Dashboard data fetching finished.");
      }
    };

    fetchData();
  }, [currentUser]);

  if (!currentUser && !loading) {
      console.log("Dashboard: Rendering Navigate to /login (no user, not loading).");
      return <Navigate to="/login" replace />;
  }
  // You might want a more specific loading state if currentUser is briefly null from context
  // if (loading && !currentUser) return <div className="flex justify-center items-center h-screen">Authenticating...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* --- Use the imported Sidebar --- */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- Use the imported Topbar, passing the page title --- */}
        {/* Topbar will get user, userData, logout from AuthContext directly */}
        <Topbar pageTitle="Dashboard Overview" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
             {/* Main page title can be removed if Topbar shows it, or kept for section emphasis */}
             {/* <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2> */}

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {/* Add onClick handlers to navigate or open modals */}
                <QuickActionButton title="New Event" icon="➕" onClick={() => console.log("New Event Clicked")} />
                <QuickActionButton title="Add Task" icon="✔️" onClick={() => console.log("Add Task Clicked")} />
                <QuickActionButton title="New Project" icon="📁" onClick={() => console.log("New Project Clicked")} />
                <QuickActionButton title="Team" icon="👥" onClick={() => console.log("Team Clicked")} />
            </div>

            {loading && <div className="text-center p-4 text-gray-600">Loading dashboard data...</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            {!loading && (
                 <div className="space-y-6">
                     <div className="bg-white p-4 rounded-lg shadow">
                         <h3 className="text-lg font-semibold mb-3 text-gray-700">Recent Tasks</h3>
                         {!error && recentTasks.length > 0 ? (
                            <div>{recentTasks.map(task => <TaskItem key={task.id} task={task} />)}</div>
                         ) : !error ? (
                            <p className="text-gray-500 text-sm">No incomplete tasks found.</p>
                         ) : null }
                     </div>

                     <div className="bg-white p-4 rounded-lg shadow">
                         <h3 className="text-lg font-semibold mb-3 text-gray-700">Upcoming Events</h3>
                          {!error && upcomingEvents.length > 0 ? (
                            <div>{upcomingEvents.map(event => <EventItem key={event.id} event={event} />)}</div>
                         ) : !error ? (
                            <p className="text-gray-500 text-sm">No upcoming events found.</p>
                         ) : null }
                     </div>

                     <div className="flex justify-end mt-4">
                         <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded transition duration-150">
                            View Archived
                         </button>
                     </div>
                </div>
             )}
        </main>
      </div>
    </div>
  );
}