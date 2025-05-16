// frontend/src/components/tasks/TaskForm.jsx
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';

const TaskForm = ({ onSubmit, initialData, onCancel, projectsList = [], usersList = [], submitButtonText = "Save Task" }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');
    const [dueDate, setDueDate] = useState(''); // Stored as 'YYYY-MM-DD' for input
    const [status, setStatus] = useState('To Do');
    const [priority, setPriority] = useState('Medium');
    const [assigneeId, setAssigneeId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setProjectId(initialData.projectId || '');
            // Convert Firestore Timestamp to 'YYYY-MM-DD' for <input type="date">
            setDueDate(initialData.dueDate?.seconds ? new Date(initialData.dueDate.seconds * 1000).toISOString().split('T')[0] : '');
            setStatus(initialData.status || 'To Do');
            setPriority(initialData.priority || 'Medium');
            setAssigneeId(initialData.assigneeId || '');
        } else {
            // Reset form for new entry
            setTitle('');
            setDescription('');
            setProjectId('');
            setDueDate('');
            setStatus('To Do');
            setPriority('Medium');
            setAssigneeId('');
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Task title is required.");
            return;
        }
        if (!projectId) {
            setError("Please select a project for this task.");
            return;
        }
        setError('');

        // Find project name for denormalization (optional but good for display)
        const selectedProject = projectsList.find(p => p.id === projectId);
        const projectName = selectedProject ? selectedProject.name : '';

        // Find assignee name for denormalization
        const selectedAssignee = usersList.find(u => u.uid === assigneeId);
        const assigneeName = selectedAssignee ? (selectedAssignee.displayName || selectedAssignee.email) : '';

        const taskData = {
            title: title.trim(),
            description: description.trim(),
            projectId,
            projectName, // Denormalized project name
            dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null, // Convert back to Timestamp
            status,
            priority,
            assigneeId: assigneeId || null, // Store null if no assignee
            assigneeName: assigneeName || null, // Denormalized assignee name
        };
        await onSubmit(taskData); // This will call handleSaveTask in TasksPage.jsx
    };

    // Define some common styles here or use global styles/Tailwind's @apply
    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const labelStyle = "block text-sm font-medium text-gray-700";
    const primaryButtonStyle = "py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
    const secondaryButtonStyle = "py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";


    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
                {initialData?.id ? 'Edit Task' : 'Create New Task'}
            </h3>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm" role="alert">{error}</div>}

            <div>
                <label htmlFor="taskTitle" className={labelStyle}>Title</label>
                <input type="text" id="taskTitle" value={title} onChange={e => setTitle(e.target.value)}
                       className={inputStyle} required />
            </div>

            <div>
                <label htmlFor="taskDescription" className={labelStyle}>Description</label>
                <textarea id="taskDescription" value={description} onChange={e => setDescription(e.target.value)} rows="3"
                          className={inputStyle}></textarea>
            </div>

            <div>
                <label htmlFor="taskProject" className={labelStyle}>Project</label>
                <select id="taskProject" value={projectId} onChange={e => setProjectId(e.target.value)} className={inputStyle} required>
                    <option value="">Select a Project</option>
                    {projectsList.length > 0 ? (
                        projectsList.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))
                    ) : (
                        <option disabled>No projects available</option>
                    )}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="taskDueDate" className={labelStyle}>Due Date</label>
                    <input type="date" id="taskDueDate" value={dueDate} onChange={e => setDueDate(e.target.value)}
                           className={inputStyle} />
                </div>
                <div>
                    <label htmlFor="taskStatus" className={labelStyle}>Status</label>
                    <select id="taskStatus" value={status} onChange={e => setStatus(e.target.value)} className={inputStyle}>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Done">Done</option>
                        <option value="Blocked">Blocked</option>
                    </select>
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="taskPriority" className={labelStyle}>Priority</label>
                    <select id="taskPriority" value={priority} onChange={e => setPriority(e.target.value)} className={inputStyle}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="taskAssignee" className={labelStyle}>Assign To</label>
                    <select id="taskAssignee" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={inputStyle}>
                        <option value="">Unassigned</option>
                         {usersList.length > 0 ? (
                            usersList.map(user => (
                                <option key={user.uid} value={user.uid}>{user.displayName || user.email}</option>
                            ))
                        ) : (
                            <option disabled>No users available to assign</option>
                        )}
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className={secondaryButtonStyle}>
                    Cancel
                </button>
                <button type="submit" className={primaryButtonStyle}>
                    {submitButtonText}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;