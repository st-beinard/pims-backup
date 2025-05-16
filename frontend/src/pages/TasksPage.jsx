// frontend/src/pages/TasksPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, where, orderBy, Timestamp, limit
} from 'firebase/firestore';

// --- Import Reusable Components ---
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import TaskForm from '../components/tasks/TaskForm';         // Assuming TaskForm is in src/components/tasks/
import TaskListItem from '../components/tasks/TaskListItem'; // Assuming TaskListItem is in src/components/tasks/

// Filter tab options
const filterTabs = [
    { name: "All Tasks", status: null }, // null means no status filter
    { name: "In Progress", status: "In Progress" },
    { name: "Pending", status: "Pending" }, // Added Pending from image
    { name: "Completed", status: "Completed" }, // Or "Done" if that's your status
];

export default function TasksPage() {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeFilter, setActiveFilter] = useState(filterTabs[0].status); // Default to "All Tasks"

    // Fetch Projects and Users (same as before)
    useEffect(() => {
        if (!currentUser) return;
        const fetchRelatedData = async () => {
            // ... (your existing fetchRelatedData logic to get projects and users)
            setIsLoading(true);
            try {
                const projectsQuery = query(collection(db, "projects"), where("creatorId", "==", currentUser.uid), orderBy("name", "asc"));
                const projectsSnapshot = await getDocs(projectsQuery);
                setProjects(projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const usersQuery = query(collection(db, "users"), orderBy("displayName", "asc"));
                const usersSnapshot = await getDocs(usersQuery);
                setUsers(usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching related data for tasks page:", err);
                setError("Failed to load necessary data (projects/users).");
            }
            // setIsLoading(false) will be handled by fetchTasks or if no user
        };
        fetchRelatedData();
    }, [currentUser]);

    // Fetch Tasks with Filtering
    const fetchTasks = async () => {
        if (!currentUser) {
            setIsLoading(false); // Stop loading if no user
            setTasks([]); // Clear tasks if no user
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            let q;
            if (activeFilter) { // If a specific status filter is active
                q = query(
                    collection(db, "tasks"),
                    where("creatorId", "==", currentUser.uid), // Or assigneeId based on your logic
                    where("status", "==", activeFilter),
                    orderBy("createdAt", "desc")
                );
            } else { // "All Tasks" - no status filter
                q = query(
                    collection(db, "tasks"),
                    where("creatorId", "==", currentUser.uid), // Or assigneeId
                    orderBy("createdAt", "desc")
                );
            }
            const querySnapshot = await getDocs(q);
            setTasks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching tasks: ", err);
            setError(prevError => prevError || "Failed to fetch tasks.");
            if (err.message.includes("requires an index")) {
                let indexFields = `creatorId (ASC), createdAt (DESC)`;
                if (activeFilter) {
                    indexFields = `creatorId (ASC), status (ASC), createdAt (DESC)`;
                }
                setError(`Database query requires an index (${indexFields}). Check Firestore console.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [currentUser, activeFilter]); // Refetch tasks when user or filter changes

    const handleSaveTask = async (taskData) => { /* ... (same as before) ... */ 
        if (!currentUser) { setError("Not authenticated."); return; }
        setIsLoading(true);
        try {
            if (editingTask) {
                await updateDoc(doc(db, "tasks", editingTask.id), { ...taskData, updatedAt: Timestamp.now() });
                setEditingTask(null);
            } else {
                await addDoc(collection(db, "tasks"), { ...taskData, creatorId: currentUser.uid, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
            }
            setShowForm(false);
            fetchTasks(); 
        } catch (err) { console.error("Error saving task: ", err); setError("Failed to save task."); }
        finally { setIsLoading(false); }
    };
    const handleDeleteTask = async (taskId) => { /* ... (same as before) ... */ 
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        setIsLoading(true);
        try { await deleteDoc(doc(db, "tasks", taskId)); fetchTasks(); }
        catch (err) { console.error("Error deleting task: ", err); setError("Failed to delete task."); }
        finally { setIsLoading(false); }
    };
    const handleStatusChange = async (taskId, newStatus) => { /* ... (same as before, or remove if checkbox is primary) ... */ 
        setIsLoading(true);
        try {
            await updateDoc(doc(db, "tasks", taskId), { status: newStatus, updatedAt: Timestamp.now() });
            fetchTasks(); // Refetch to ensure correct filtering and sorting
        } catch (err) { console.error("Error updating task status:", err); setError("Failed to update task status."); }
        finally { setIsLoading(false); }
    };
    
    // NEW: Toggle task completion status
    const handleToggleComplete = async (taskId, isCompleted) => {
        const newStatus = isCompleted ? "Completed" : "To Do"; // Or "In Progress" if preferred
        setIsLoading(true); // Can be refined to only affect the specific row
        try {
            await updateDoc(doc(db, "tasks", taskId), {
                status: newStatus,
                updatedAt: Timestamp.now(),
            });
            // Optimistic update:
            // setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? {...t, status: newStatus} : t));
            // For simplicity and to ensure filters work correctly, refetch:
            fetchTasks();
        } catch (err) {
            console.error("Error toggling task completion:", err);
            setError("Failed to update task.");
        } finally {
            setIsLoading(false);
        }
    };


    const handleEditTask = (task) => { setEditingTask(task); setShowForm(true); };
    const handleAddNewTask = () => { setEditingTask(null); setShowForm(true); setError(''); };
    const handleFormCancel = () => { setShowForm(false); setEditingTask(null); setError(''); };

    const filteredTasks = useMemo(() => {
        // This client-side filtering is redundant if Firestore query handles it,
        // but can be useful for more complex client-side only filters later or if Firestore query is broad.
        // For now, Firestore query with 'activeFilter' handles it.
        return tasks;
    }, [tasks, activeFilter]);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar pageTitle="Tasks Dashboard" /> {/* Changed title */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
                        <div className="flex space-x-1 border border-gray-300 p-0.5 rounded-lg bg-gray-200">
                            {filterTabs.map((tab) => (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveFilter(tab.status)}
                                    className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors
                                        ${activeFilter === tab.status
                                            ? 'bg-white text-indigo-700 shadow'
                                            : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                        {!showForm && (
                             <button onClick={handleAddNewTask} className="btn-primary text-sm whitespace-nowrap self-start sm:self-center">
                                + New Task
                            </button>
                        )}
                    </div>

                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                    {showForm && (
                        <TaskForm
                            onSubmit={handleSaveTask}
                            initialData={editingTask}
                            onCancel={handleFormCancel}
                            projectsList={projects}
                            usersList={users}
                            submitButtonText={editingTask ? "Update Task" : "Create Task"}
                        />
                    )}

                    {isLoading && <p className="text-gray-600 text-center py-10">Loading tasks...</p>}

                    {!isLoading && !showForm && filteredTasks.length === 0 && !error && (
                        <p className="text-gray-500 text-center py-10">No tasks found for the current filter. Click "+ New Task" to add one.</p>
                    )}

                    {!isLoading && !showForm && filteredTasks.length > 0 && (
                        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Task</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th> {/* For Description/Project or empty */}
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTasks.map(task => (
                                        <TaskListItem
                                            key={task.id}
                                            task={task}
                                            onEdit={handleEditTask}
                                            onDelete={handleDeleteTask}
                                            onStatusChange={handleStatusChange} // Pass this if using dropdown in item
                                            onToggleComplete={handleToggleComplete} // Pass this for checkbox
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                     {!showForm && (
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