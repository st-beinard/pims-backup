// frontend/src/components/tasks/TaskListItem.jsx
import React from 'react';

const TaskListItem = ({ task, onEdit, onDelete, onStatusChange, onToggleComplete }) => {
    const statusColors = {
        "To Do": "text-gray-500 bg-gray-100",
        "In Progress": "text-blue-700 bg-blue-100",
        "Pending": "text-yellow-700 bg-yellow-100", // Added Pending
        "Completed": "text-green-700 bg-green-100",
        "Done": "text-green-700 bg-green-100", // Alias for Completed
        "Blocked": "text-red-700 bg-red-100",
        "Not Started": "text-gray-500 bg-gray-100", // Alias for To Do
    };
    const priorityColors = {
        "Low": "text-green-600",
        "Medium": "text-yellow-600",
        "High": "text-red-600",
    };

    const isTaskCompleted = task.status === "Completed" || task.status === "Done";

    return (
        <tr className={`hover:bg-gray-50 ${isTaskCompleted ? 'opacity-70' : ''}`}>
            <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3" 
                        checked={isTaskCompleted}
                        onChange={() => onToggleComplete(task.id, !isTaskCompleted)}
                    />
                    <span className={`font-medium ${isTaskCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`} title={task.title}>
                        {task.title || "Untitled Task"}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                 {/* Display short description or project name if needed */}
                 {/* <span className="block text-xs">{task.projectName || 'No Project'}</span> */}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(task)} className="text-indigo-600 hover:text-indigo-900" title="Edit Task">
                        ✏️ {/* Edit Icon */}
                    </button>
                    <button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-700" title="Delete Task">
                        🗑️ {/* Delete Icon */}
                    </button>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${priorityColors[task.priority] || 'text-gray-700'}`}>
                {task.priority || "N/A"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}>
                    {task.status || "N/A"}
                </span>
                {/* Alternative: Use the select for status change directly in the table */}
                {/* 
                <select 
                    value={task.status} 
                    onChange={(e) => onStatusChange(task.id, e.target.value)}
                    className={`text-xs p-1 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500 ${statusColors[task.status] || ''}`}
                >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                </select>
                */}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {task.assigneeName || "Unassigned"}
            </td>
        </tr>
    );
};

export default TaskListItem;