// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

// Placeholder Icons - Replace with actual icons from a library
const CalendarIconSvg = () => ( // Using a simple SVG for a more distinct calendar icon
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const DocumentIconSvg = () => ( // Using a simple SVG for a document icon
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const ProjectTabIcon = () => <span className="mr-2">📁</span>; // For Project tab
const EventTabIcon = () => <span className="mr-2">🗓️</span>;   // For Event tab


// --- Reusable Item Components (Defined within this file for self-containment) ---
// You can move these to separate files in src/components/home/ later
const HomeEventItem = ({ event }) => (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex justify-between items-center">
        <div>
            <h4 className="text-md font-semibold text-gray-800">{event.name || "Untitled Event"}</h4>
            {/* Optional: Display event time if available */}
            {event.startTime?.seconds && (
                 <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(event.startTime.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    {event.endTime?.seconds && ` - ${new Date(event.endTime.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                 </p>
            )}
        </div>
        <div className="flex items-center text-sm text-gray-600 space-x-3 sm:space-x-4">
            <div className="flex items-center">
                <CalendarIconSvg />
                <span className="text-xs sm:text-sm">{event.startDate?.seconds ? new Date(event.startDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</span>
            </div>
            {/* The "Main" / "Sinalhan" looks like a venue or tag */}
            {event.venue && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full hidden sm:inline-block whitespace-nowrap">{event.venue}</span>}
            <button onClick={() => alert(`View details for event: ${event.name}`)} className="p-1" title="View Details">
                <DocumentIconSvg />
            </button>
        </div>
    </div>
);

const HomeProjectItem = ({ project }) => (
     <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-center">
            <div>
                <h4 className="text-md font-semibold text-gray-800">{project.name || "Untitled Project"}</h4>
                {project.description && <p className="text-xs text-gray-500 mt-0.5 truncate w-60 sm:w-auto" title={project.description}>{project.description}</p>}
            </div>
            <button onClick={() => alert(`View details for project: ${project.name}`)} className="p-1 text-gray-400 hover:text-indigo-600 self-start" title="View Details">
                <DocumentIconSvg />
            </button>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-600">
            <div className="flex items-center">
                <CalendarIconSvg />
                <span>Due: {project.endDate?.seconds ? new Date(project.endDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</span>
            </div>
            {project.status && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">Status: {project.status}</span>}
            {/* Example of progress bar, using project.progress (0-100) */}
            {typeof project.progress === 'number' && (
                <div className="w-full sm:w-32 mt-2 sm:mt-0">
                    <div className="bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <p className="text-center text-gray-500 mt-0.5">{project.progress}%</p>
                </div>
            )}
        </div>
    </div>
);
// --- End Reusable Item Components ---


export default function HomePage() {
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState('events'); // 'events' or 'projects'
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUpcomingEvents = React.useCallback(async () => {
        if (!currentUser) return;
        console.log("HomePage: Fetching upcoming events...");
        try {
            const now = Timestamp.now();
            const eventsQuery = query(
                collection(db, "events"),
                where("creatorId", "==", currentUser.uid), // Or a more general query if events are public/shared
                where("startDate", ">=", now),
                orderBy("startDate", "asc"),
                limit(5) // Show a few upcoming events
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            const fetchedEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUpcomingEvents(fetchedEvents);
            console.log("HomePage: Upcoming events fetched", fetchedEvents.length);
        } catch (err) {
            console.error("HomePage: Error fetching upcoming events:", err);
            setError(prev => `${prev} Failed to load upcoming events. Index might be required. `);
        }
    }, [currentUser]);

    const fetchRecentProjects = React.useCallback(async () => {
        if (!currentUser) return;
        console.log("HomePage: Fetching recent projects...");
        try {
            const projectsQuery = query(
                collection(db, "projects"),
                where("creatorId", "==", currentUser.uid), // Or based on user membership
                orderBy("createdAt", "desc"), // Show most recently created projects
                limit(5) // Show a few recent projects
            );
            const projectsSnapshot = await getDocs(projectsQuery);
            const fetchedProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentProjects(fetchedProjects);
            console.log("HomePage: Recent projects fetched", fetchedProjects.length);
        } catch (err) {
            console.error("HomePage: Error fetching recent projects:", err);
            setError(prev => `${prev} Failed to load recent projects. Index might be required. `);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);
            setError('');
            const loadData = async () => {
                // Fetch both initially, or just the active tab's data
                // For simplicity, let's fetch both if not too heavy, or just active tab
                if (activeTab === 'events') {
                    await fetchUpcomingEvents();
                } else if (activeTab === 'projects') {
                    await fetchRecentProjects();
                }
                // If you want to load both on initial mount regardless of tab:
                // await Promise.all([fetchUpcomingEvents(), fetchRecentProjects()]);
                setIsLoading(false);
            };
            loadData();
        } else {
            setIsLoading(false);
            setUpcomingEvents([]);
            setRecentProjects([]);
        }
    }, [currentUser, activeTab, fetchUpcomingEvents, fetchRecentProjects]); // Added fetch functions to dependencies

    // Memoize lists to prevent unnecessary re-renders of items
    const eventsToDisplay = useMemo(() => upcomingEvents, [upcomingEvents]);
    const projectsToDisplay = useMemo(() => recentProjects, [recentProjects]);


    return (
        <div className="p-6 md:p-8"> {/* This page's content will be inside Layout's <main> */}
            {/* Tabs */}
            <div className="mb-6 flex border-b border-gray-300">
                <button
                    onClick={() => setActiveTab('events')}
                    className={`flex items-center py-3 px-5 text-sm font-medium focus:outline-none transition-colors duration-150
                        ${activeTab === 'events'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-400'
                        }`}
                >
                    <EventTabIcon /> Events
                </button>
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`flex items-center py-3 px-5 text-sm font-medium focus:outline-none transition-colors duration-150
                        ${activeTab === 'projects'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-400'
                        }`}
                >
                    <ProjectTabIcon /> Projects
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
                    <p className="font-bold">Data Loading Error</p>
                    <p>{error}</p>
                </div>
            )}

            {isLoading && (
                <div className="text-center p-10 text-gray-600">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    Loading...
                </div>
            )}

            {!isLoading && !error && (
                <div className="space-y-6"> {/* Increased spacing between sections */}
                    {activeTab === 'events' && (
                        <section>
                            <h3 className="text-xl font-semibold text-gray-700 mb-4">Upcoming Events</h3>
                            {eventsToDisplay.length > 0 ? (
                                <div className="space-y-3">
                                    {eventsToDisplay.map(event => <HomeEventItem key={event.id} event={event} />)}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic bg-white p-6 rounded-lg shadow text-center">No upcoming events scheduled.</p>
                            )}
                        </section>
                    )}

                    {activeTab === 'projects' && (
                        <section>
                            <h3 className="text-xl font-semibold text-gray-700 mb-4">Active Projects / Overview</h3> {/* Adjusted title to match image */}
                            {/* The image for projects shows a table-like structure */}
                            {/* For simplicity, we'll use a list similar to events for now */}
                            {/* You can build a table component later if needed */}
                            {projectsToDisplay.length > 0 ? (
                                <div className="space-y-3">
                                    {projectsToDisplay.map(project => <HomeProjectItem key={project.id} project={project} />)}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic bg-white p-6 rounded-lg shadow text-center">No recent projects found.</p>
                            )}
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}