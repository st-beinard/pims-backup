// frontend/src/pages/TasksPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext'; // For currentUser
import { db } from '../firebaseConfig';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, where, orderBy, Timestamp, limit // limit is used in other pages, good to keep consistent if planning to use
} from 'firebase/firestore';

// --- Import REUSABLE task-specific components (ASSUMING THEY EXIST) ---
// If these are not yet created, you will see errors.
// For now, I'll assume they are simple placeholders or you will create them.

// Example Placeholder if you don't have TaskForm yet:
const TaskForm = ({ onSubmit, initialData, onCancel, projectsList, usersList, submitButtonText }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title: e.target.taskTitle.value /* ... more fields ... */ }); }} className="border p-4 mb-4 bg-white shadow-md rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{initialData?.id ? "Edit Task" : "New Task"}</h3>
        <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Task Title:</label>
            <input type="text" id="taskTitle" name="taskTitle" defaultValue={initialData?.title || ''} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        {/* Add more form fields: description, projectId, assigneeId, dueDate, priority, status etc. */}
        {/* Example Select for Project */}
        <div className="mt-2">
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project:</label>
            <select id="projectId" name="projectId" defaultValue={initialData?.projectId || ""} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">None</option>
                {projectsList?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
         {/* Example Select for Assignee */}
        <div className="mt-2">
            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assign To:</label>
            <select id="assigneeId" name="assigneeId" defaultValue={initialData?.assigneeId || ""} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">Unassigned</option>
                {usersList?.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
            </select>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm">{submitButtonText || "Save Task"}</button>
        </div>
    </form>
);

// Example Placeholder if you don't have TaskListItem yet:
const TaskListItem = ({ task, onEdit, onDelete, onToggleComplete }) => (
    <tr>
        <td className="px-4 py-3 whitespace-nowrap w-2/5">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                    checked={task.status === "Completed"}
                    onChange={(e) => onToggleComplete(task.id, e.target.checked)}
                />
                <div className="text-sm font-medium text-gray-900 truncate">{task.title || "Untitled Task"}</div>
            </div>
            {/* <div className="text-xs text-gray-500 mt-1 truncate">{task.description || "No description"}</div> */}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{/* Project Name or empty */}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
            <button onClick={() => onEdit(task)} className="text-indigo-600 hover:text-indigo-900 mr-2 text-xs">Edit</button>
            <button onClick={() => onDelete(task.id)} className="text-red-600 hover:text-red-900 text-xs">Delete</button>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{task.priority || "N/A"}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
            {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : "N/A"}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                task.status === "Completed" ? "bg-green-100 text-green-800" :
                task.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                task.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
            }`}>
                {task.status || "N/A"}
            </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{task.assigneeName || "Unassigned"}</td>
    </tr>
);
// --- End placeholder/imported components ---


// NO Sidebar or Topbar import here, they come from Layout.jsx

// Filter tab options
const filterTabs = [
    { name: "All Tasks", status: null },
    { name: "In Progress", status: "In Progress" },
    { name: "Pending", status: "Pending" },
    { name: "Completed", status: "Completed" },
];

export default function TasksPage() {
    const { currentUser } = useAuth(); // userData and logout are not directly used here for Topbar

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]); // For TaskForm dropdown
    const [users, setUsers] = useState([]);       // For TaskForm dropdown

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeFilter, setActiveFilter] = useState(filterTabs[0].status);

    // Fetch Projects and Users (for dropdowns in TaskForm)
    useEffect(() => {
        if (!currentUser) return;
        const fetchRelatedData = async () => {
            setIsLoading(true); 
            setError('');
            try {
                const projectsQuery = query(collection(db, "projects"), where("creatorId", "==", currentUser.uid), orderBy("name", "asc"));
                const projectsSnapshot = await getDocs(projectsQuery);
                setProjects(projectsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
                console.log("TasksPage: Projects fetched for form");

                const usersQuery = query(collection(db, "users"), orderBy("displayName", "asc")); 
                const usersSnapshot = await getDocs(usersQuery);
                setUsers(usersSnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() })));
                console.log("TasksPage: Users fetched for form");

            } catch (err) {
                console.error("TasksPage: Error fetching related data (projects/users):", err);
                setError("Failed to load project/user data for the form.");
            }
        };
        fetchRelatedData();
    }, [currentUser]);

    const fetchTasks = React.useCallback(async () => {
        if (!currentUser) {
            setTasks([]);
            setIsLoading(false);
            return;
        }
        console.log("TasksPage: Fetching tasks with filter:", activeFilter);
        setIsLoading(true); 
        setError(''); 
        try {
            let q;
            const baseQueryConditions = [
                collection(db, "tasks"),
                where("creatorId", "==", currentUser.uid), 
            ];

            if (activeFilter) {
                q = query(...baseQueryConditions, where("status", "==", activeFilter), orderBy("createdAt", "desc"));
            } else {
                q = query(...baseQueryConditions, orderBy("createdAt", "desc"));
            }
            const querySnapshot = await getDocs(q);
            const fetchedTasks = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setTasks(fetchedTasks);
            console.log("TasksPage: Tasks fetched", fetchedTasks);
        } catch (err) {
            console.error("TasksPage: Error fetching tasks: ", err);
            let errorMessage = "Failed to fetch tasks.";
            if (err.message && err.message.includes("requires an index")) {
                errorMessage = "Database query for tasks requires an index. Check Firestore console for link.";
            } else if (err.code === 'permission-denied') {
                errorMessage = "Permission denied for fetching tasks.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false); 
        }
    }, [currentUser, activeFilter]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]); 

    const handleSaveTask = async (taskData) => {
        if (!currentUser) { setError("Action requires authentication."); return; }
        setError('');
        try {
            const dataToSave = {
                ...taskData,
                dueDate: taskData.dueDate instanceof Date ? Timestamp.fromDate(taskData.dueDate) : taskData.dueDate,
                updatedAt: Timestamp.now(),
            };

            if (editingTask?.id) {
                await updateDoc(doc(db, "tasks", editingTask.id), dataToSave);
            } else {
                await addDoc(collection(db, "tasks"), {
                    ...dataToSave,
                    creatorId: currentUser.uid,
                    createdAt: Timestamp.now(),
                    status: taskData.status || "To Do", 
                });
            }
            setShowForm(false);
            setEditingTask(null);
            fetchTasks(); 
        } catch (err) {
            console.error("TasksPage: Error saving task: ", err);
            setError(`Failed to save task: ${err.message}`);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        setError('');
        try {
            await deleteDoc(doc(db, "tasks", taskId));
            fetchTasks(); 
        } catch (err) {
            console.error("TasksPage: Error deleting task: ", err);
            setError(`Failed to delete task: ${err.message}`);
        }
    };

    const handleToggleComplete = async (taskId, currentStatus) => {
        const newStatus = currentStatus === "Completed" ? "To Do" : "Completed";
        setError('');
        try {
            await updateDoc(doc(db, "tasks", taskId), {
                status: newStatus,
                isCompleted: newStatus === "Completed", 
                updatedAt: Timestamp.now(),
            });
            fetchTasks(); 
        } catch (err) {
            console.error("TasksPage: Error toggling task completion:", err);
            setError(`Failed to update task: ${err.message}`);
        }
    };

    const handleEditTask = (task) => { setEditingTask(task); setShowForm(true); setError(''); };
    const handleAddNewTask = () => { setEditingTask(null); setShowForm(true); setError(''); };
    const handleFormCancel = () => { setShowForm(false); setEditingTask(null); setError(''); };

    const displayedTasks = useMemo(() => {
        return tasks;
    }, [tasks]);

    return (
        <div className="p-4 sm:p-6"> {/* Padding for the content area */}
            {/* ***** THIS IS THE ONLY SECTION MODIFIED from your provided code ***** */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
                {/* Filter Tabs on the left - only show if form is not visible */}
                {!showForm && (
                    <div className="flex space-x-1 border border-gray-300 p-0.5 rounded-lg bg-gray-200 self-start sm:self-center w-full sm:w-auto justify-center sm:justify-start">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveFilter(tab.status)}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap
                                    ${activeFilter === tab.status
                                        ? 'bg-white text-indigo-700 shadow'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* This div will effectively be empty if showForm is true, maintaining space for justify-between */}
                {/* Or, if showForm is true, the button below is hidden, and this part might take more space if filters are also hidden. */}
                {/* The h1 is removed as it was empty, if you need a title specific to this page content, add it here. */}
                {/* If showForm is true, we might want to hide filters to give form more space, or keep them. */}
                {/* For now, filters are hidden when form is shown. The button is also hidden. */}
                {/* This structure pushes the button to the right if filters are visible. */}
                <div className="flex-grow hidden sm:block"></div> {/* This helps push the button to the right on larger screens if filters are present */}


                {/* New Task Button on the right - only show if form is not visible */}
                {!showForm && (
                     <button onClick={handleAddNewTask}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm text-sm whitespace-nowrap mt-3 sm:mt-0 self-end sm:self-center"
                    >
                        + New Task
                    </button>
                )}
                {/* If the form is shown, the above button and filter tabs are hidden, so this flex container might behave differently.
                    If you want a title like "New Task" or "Edit Task" when the form is shown, you'd add it here or within the TaskForm itself.
                */}
            </div>
            {/* ***** END MODIFIED SECTION ***** */}


            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm shadow">{error}</div>}

            {showForm && (
                <TaskForm
                    onSubmit={handleSaveTask}
                    initialData={editingTask}
                    onCancel={handleFormCancel}
                    projectsList={projects} 
                    usersList={users}       
                    submitButtonText={editingTask?.id ? "Update Task" : "Create Task"}
                />
            )}

            {isLoading && <div className="text-center py-10 text-gray-600"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div></div>}

            {!isLoading && !showForm && displayedTasks.length === 0 && !error && (
                <p className="text-gray-500 text-center py-10 italic">No tasks found for the current filter. Click "+ New Task" to add one.</p>
            )}

            {!isLoading && !showForm && displayedTasks.length > 0 && (
                <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Task</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayedTasks.map(task => (
                                <TaskListItem
                                    key={task.id}
                                    task={task}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
                                    onToggleComplete={() => handleToggleComplete(task.id, task.status)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
             {!showForm && (
                <div className="flex justify-end mt-6">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition duration-150">
                        View Archived Tasks
                    </button>
                </div>
            )}
        </div>
    );
}