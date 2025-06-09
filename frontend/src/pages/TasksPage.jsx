// frontend/src/pages/TasksPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, where, orderBy, Timestamp
} from 'firebase/firestore';

// --- TaskForm Component (COPIED VERBATIM from your DashboardPage.jsx's inline definition) ---
// This ensures the modal is identical to the one on DashboardPage.
// It's defined locally within this file to adhere to "no changes to other files" if this page needs
// a specific version slightly different from a potentially shared one, OR if you haven't
// yet created a shared one based on DashboardPage's internal form.
// Ideally, this would be a shared import.
const TaskForm = ({ onSubmit, onCancel, projectsList = [], usersList = [], initialData = null, submitButtonText = "Create Task" }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [projectId, setProjectId] = useState(initialData?.projectId || '');
    const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || '');
    const [dueDate, setDueDate] = useState(initialData?.dueDate?.seconds ? new Date(initialData.dueDate.seconds * 1000).toISOString().split('T')[0] : '');
    const [status, setStatus] = useState(initialData?.status || 'To Do');
    const [description, setDescription] = useState(initialData?.description || ''); 
    const [priority, setPriority] = useState(initialData?.priority || 'Medium');
    const [formSpecificError, setFormSpecificError] = useState('');

    useEffect(() => {
        setTitle(initialData?.title || '');
        setProjectId(initialData?.projectId || '');
        setAssigneeId(initialData?.assigneeId || '');
        setDueDate(initialData?.dueDate?.seconds ? new Date(initialData.dueDate.seconds * 1000).toISOString().split('T')[0] : '');
        setStatus(initialData?.status || 'To Do');
        setDescription(initialData?.description || '');
        setPriority(initialData?.priority || 'Medium');
        setFormSpecificError('');
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormSpecificError('');
        if (!title.trim()) { setFormSpecificError("Task title is required."); return; }
        
        const selectedProject = projectsList.find(p => p.id === projectId);
        const projectName = selectedProject ? selectedProject.name : '';
        const selectedAssignee = usersList.find(u => u.uid === assigneeId);
        const assigneeName = selectedAssignee ? (selectedAssignee.displayName || selectedAssignee.email) : '';

        const formData = {
            title: title.trim(),
            description: description.trim(),
            projectId: projectId || null, 
            projectName: projectName,
            assigneeId: assigneeId || null,
            assigneeName: assigneeName,
            dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
            status: status,
            priority: priority,
        };
        onSubmit(formData);
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
    const labelStyle = "block text-sm font-medium text-gray-700";
    const primaryButtonStyle = "py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
    const secondaryButtonStyle = "px-6 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-white rounded-xl shadow-2xl w-full max-w-lg space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">{initialData?.id ? "Edit Task" : "New Task"}</h2>
                    <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {formSpecificError && <p className="text-red-600 bg-red-50 p-3 rounded text-sm border border-red-200">{formSpecificError}</p>}
                
                <div><label htmlFor="tasksPage-modal-task-title" className={labelStyle}>Task Title <span className="text-red-500">*</span></label><input id="tasksPage-modal-task-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputStyle} /></div>
                <div><label htmlFor="tasksPage-modal-taskDescription" className={labelStyle}>Description</label><textarea id="tasksPage-modal-taskDescription" value={description} onChange={e => setDescription(e.target.value)} rows="3" className={inputStyle}></textarea></div>
                <div><label htmlFor="tasksPage-modal-task-project" className={labelStyle}>Project</label><select id="tasksPage-modal-task-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputStyle}><option value="">Select a Project</option>{projectsList.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))}</select></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="tasksPage-modal-task-duedate" className={labelStyle}>Due Date</label><input id="tasksPage-modal-task-duedate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputStyle} /></div>
                    <div><label htmlFor="tasksPage-modal-task-status" className={labelStyle}>Status</label><select id="tasksPage-modal-task-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputStyle}><option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Pending">Pending</option><option value="Done">Done</option><option value="Blocked">Blocked</option></select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label htmlFor="tasksPage-modal-taskPriority" className={labelStyle}>Priority</label><select id="tasksPage-modal-taskPriority" value={priority} onChange={e => setPriority(e.target.value)} className={inputStyle}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                     <div><label htmlFor="tasksPage-modal-task-assignee" className={labelStyle}>Assign To</label><select id="tasksPage-modal-task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputStyle}><option value="">Unassigned</option>{usersList.map(user => (<option key={user.uid} value={user.uid}>{user.displayName || user.email}</option>))}</select></div>
                </div>
                <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 mt-6">
                    <button type="button" onClick={onCancel} className={secondaryButtonStyle}>Cancel</button>
                    <button type="submit" className={primaryButtonStyle}>{submitButtonText}</button>
                </div>
            </form>
        </div>
    );
};
// --- End TaskForm ---

// --- TaskListItem to match the new UI (input_file_0.png) ---
const TaskListItem = ({ task, onEdit, onDelete, onToggleComplete, projects = [], users = [] }) => {
    // ... (TaskListItem code from previous correct response - VERBATIM) ...
    const assigneeName = useMemo(() => users.find(u => u.uid === task.assigneeId)?.displayName || users.find(u => u.uid === task.assigneeId)?.email || "Unassigned", [users, task.assigneeId]);
    const isChecked = task.status === "Completed" || task.status === "Done";

    return (
        <tr className={`hover:bg-gray-50 transition-colors duration-150 ${isChecked ? 'bg-gray-50 opacity-70' : ''}`}>
            <td className="px-4 py-3 whitespace-nowrap w-auto"> 
                <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3 flex-shrink-0" checked={isChecked} onChange={() => onToggleComplete(task.id, task.status)}/>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <div className={`text-sm font-medium ${isChecked ? 'text-gray-500 line-through' : 'text-gray-900'}`} title={task.title}> {task.title || "Untitled Task"}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 w-24 text-center"> 
                 <button onClick={() => onEdit(task)} className="text-gray-400 hover:text-indigo-600 mr-2 p-1 rounded-full hover:bg-indigo-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onDelete(task.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.priority || "N/A"}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"> {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</td>
            <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2.5 py-1 inline-flex text-xs leading-tight font-semibold rounded-full ${ isChecked ? "bg-green-100 text-green-700" : task.status === "In Progress" ? "bg-blue-100 text-blue-700" : task.status === "Pending" ? "bg-yellow-100 text-yellow-700" : task.status === "Blocked" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700" }`}> {task.status || "N/A"} </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate" title={assigneeName}>{assigneeName}</td>
        </tr>
    );
};
// --- End TaskListItem ---

const uiFilterTabs = [ /* ... uiFilterTabs definition VERBATIM ... */ 
    { name: "All Tasks", status: null, styles: "text-indigo-700 bg-indigo-100" },
    { name: "In Progress", status: "In Progress", styles: "text-gray-600 hover:bg-gray-200" },
    { name: "Completed", status: "Completed", styles: "text-gray-600 hover:bg-gray-200" },
];

export default function TasksPage() {
    // ... (All state and functions VERBATIM from the previous "NO SHORTCUTS (Corrected for input_file_0.png)" response) ...
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [projectsForForm, setProjectsForForm] = useState([]);
    const [usersForForm, setUsersForForm] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormDropdownDataLoading, setIsFormDropdownDataLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeFilterName, setActiveFilterName] = useState(uiFilterTabs[0].name);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);

    useEffect(() => { 
        if (!currentUser) { setIsFormDropdownDataLoading(false); return; }
        const fetchRelatedData = async () => {
            setIsFormDropdownDataLoading(true); 
            try {
                const projectsQuery = query(collection(db, "projects"), where("creatorId", "==", currentUser.uid), orderBy("name", "asc"));
                const projectsSnapshot = await getDocs(projectsQuery);
                setProjectsForForm(projectsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
                const usersQuery = query(collection(db, "users"), orderBy("displayName", "asc")); 
                const usersSnapshot = await getDocs(usersQuery);
                setUsersForForm(usersSnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() })));
            } catch (err) { setError("Failed to load project/user data for forms.");
            } finally { setIsFormDropdownDataLoading(false); }
        };
        fetchRelatedData();
    }, [currentUser]);

    const fetchTasks = useCallback(async () => { 
        if (!currentUser) { setTasks([]); setIsLoading(false); return; }
        const currentFilterObject = uiFilterTabs.find(tab => tab.name === activeFilterName);
        const statusToQuery = currentFilterObject ? currentFilterObject.status : null;
        setIsLoading(true);
        try {
            let q;
            const baseQueryConditions = [ collection(db, "tasks"), where("creatorId", "==", currentUser.uid),];
            if (statusToQuery) {
                q = query(...baseQueryConditions, where("status", "==", statusToQuery), orderBy("createdAt", "desc"));
            } else {
                q = query(...baseQueryConditions, orderBy("createdAt", "desc"));
            }
            const querySnapshot = await getDocs(q);
            setTasks(querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
        } catch (err) { setError(err.message.includes("requires an index") ? "DB query needs index." : "Failed to fetch tasks.");
        } finally { setIsLoading(false); }
    }, [currentUser, activeFilterName]); 

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const handleSaveTask = async (taskDataFromForm) => { 
        if (!currentUser) { setError("Auth required."); return; }
        setError(''); setIsSubmittingTask(true); 
        const dataToSave = { ...taskDataFromForm, updatedAt: Timestamp.now(),};
        try {
            if (editingTask?.id) { await updateDoc(doc(db, "tasks", editingTask.id), dataToSave);
            } else { await addDoc(collection(db, "tasks"), { ...dataToSave, creatorId: currentUser.uid, createdAt: Timestamp.now(), isCompleted: taskDataFromForm.status === "Completed" || taskDataFromForm.status === "Done", }); }
            setShowForm(false); setEditingTask(null); await fetchTasks(); 
        } catch (err) { setError(`Save failed: ${err.message}`);
        } finally { setIsSubmittingTask(false); }
    };
    const handleDeleteTask = async (taskId) => { 
        if (!window.confirm("Delete task?")) return;
        setError(''); try { await deleteDoc(doc(db, "tasks", taskId)); await fetchTasks();
        } catch (err) { setError(`Delete failed: ${err.message}`);}
    };
    const handleToggleComplete = async (taskId, currentStatus) => { 
        const newStatus = (currentStatus === "Completed" || currentStatus === "Done") ? "To Do" : "Done"; 
        setError(''); try { await updateDoc(doc(db, "tasks", taskId), { status: newStatus, isCompleted: newStatus === "Done" || newStatus === "Completed", updatedAt: Timestamp.now(),}); await fetchTasks();
        } catch (err) { setError(`Update failed: ${err.message}`);}
    };
    const handleEditTask = (task) => { if (isFormDropdownDataLoading) { alert("Loading..."); return; } setEditingTask(task); setShowForm(true); setError(''); };
    const handleAddNewTask = () => { if (isFormDropdownDataLoading) { alert("Loading..."); return; } setEditingTask(null); setShowForm(true); setError(''); };
    const handleFormCancel = () => { setShowForm(false); setEditingTask(null); setError(''); };
    const displayedTasks = useMemo(() => tasks, [tasks]);

    return (
        // ***** NO <Layout> TAG HERE - Assumes App.jsx provides it *****
        <div className="p-6 bg-slate-100 min-h-full"> {/* Matching background of input_file_0 */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Tasks Dashboard</h1>
                {!showForm && (
                    <button
                        onClick={handleAddNewTask}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150"
                    >
                        + New Task
                    </button>
                )}
            </div>

            {!showForm && (
                <div className="mb-6">
                    <div className="flex space-x-1 border border-gray-300 p-1 rounded-lg bg-gray-200 w-max">
                        {uiFilterTabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveFilterName(tab.name)}
                                className={`px-5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap focus:outline-none
                                    ${activeFilterName === tab.name
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-300'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm shadow">{error}</div>}

            {showForm && (
                <TaskForm // The copied TaskForm (modal) defined at the top of THIS file
                    onSubmit={handleSaveTask}
                    initialData={editingTask}
                    onCancel={handleFormCancel}
                    projectsList={projectsForForm}
                    usersList={usersForForm}
                    submitButtonText={editingTask?.id ? (isSubmittingTask ? "Updating..." : "Update Task") : (isSubmittingTask ? "Creating..." : "Create Task")}
                />
            )}

            {/* ... Rest of the rendering logic (isLoading, task table, etc.) VERBATIM ... */}
            {isLoading && <div className="text-center py-10 text-gray-600"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-3"></div>Loading tasks...</div>}
            {!isLoading && !showForm && displayedTasks.length === 0 && !error && ( <div className="text-center py-12"> <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg> <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3> <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p> </div>)}
            {!isLoading && !showForm && displayedTasks.length > 0 && ( <div className="bg-white shadow-md rounded-lg overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200"> <thead className="bg-gray-50"> <tr> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 text-center">Actions</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned to</th> </tr> </thead> <tbody className="bg-white divide-y divide-gray-200"> {displayedTasks.map(task => ( <TaskListItem key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} onToggleComplete={handleToggleComplete} projects={projectsForForm} users={usersForForm} /> ))} </tbody> </table> </div>)}
            {!showForm && ( <div className="flex justify-end mt-8"> <button className="bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 px-4 rounded-md border border-gray-300 shadow-sm transition duration-150"> View Archived </button> </div>)}
        </div>
        // ***** NO CLOSING </Layout> TAG HERE *****
    );
}