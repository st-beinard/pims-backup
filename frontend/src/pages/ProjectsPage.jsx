// frontend/src/pages/ProjectsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, where, orderBy, Timestamp,getCountFromServer // Import getCountFromServer
} from 'firebase/firestore';

// --- Import Reusable Components ---
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

// --- ProjectForm Component (Can be moved to src/components/projects/ProjectForm.jsx) ---
// This can be similar to the EventForm or TaskForm, adapted for project fields
// For now, a simplified version. We built a more complete one earlier.
const ProjectForm = ({ onSubmit, initialData, onCancel, usersList = [], submitButtonText = "Save Project" }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [startDate, setStartDate] = useState(initialData?.startDate ? new Date(initialData.startDate.seconds * 1000).toISOString().split('T')[0] : '');
    const [endDate, setEndDate] = useState(initialData?.endDate ? new Date(initialData.endDate.seconds * 1000).toISOString().split('T')[0] : '');
    const [status, setStatus] = useState(initialData?.status || 'Active'); // Default based on image
    // Facilitators: Assuming project documents will store an array of facilitator UIDs
    const [facilitatorIds, setFacilitatorIds] = useState(initialData?.facilitatorIds || []);
    const [error, setError] = useState('');

    useEffect(() => {
        // Populate form when initialData changes (for editing)
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
        setStartDate(initialData?.startDate ? new Date(initialData.startDate.seconds * 1000).toISOString().split('T')[0] : '');
        setEndDate(initialData?.endDate ? new Date(initialData.endDate.seconds * 1000).toISOString().split('T')[0] : '');
        setStatus(initialData?.status || 'Active');
        setFacilitatorIds(initialData?.facilitatorIds || []);
    }, [initialData]);
    

    const handleFacilitatorChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFacilitatorIds(selectedOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError("Project name is required."); return; }
        setError('');
        const projectData = {
            name: name.trim(),
            description: description.trim(),
            startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
            endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
            status,
            facilitatorIds, // Array of user UIDs
            // You might add a 'progress' field later, managed by tasks or manual input
        };
        await onSubmit(projectData);
    };
    
    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const labelStyle = "block text-sm font-medium text-gray-700";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 border">
            <h3 className="text-lg font-medium">{initialData?.id ? "Edit Project" : "Create New Project"}</h3>
            {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm">{error}</p>}
            <div>
                <label htmlFor="projectName" className={labelStyle}>Project Name</label>
                <input type="text" id="projectName" value={name} onChange={e => setName(e.target.value)} className={inputStyle} required />
            </div>
            <div>
                <label htmlFor="projectDescription" className={labelStyle}>Description</label>
                <textarea id="projectDescription" value={description} onChange={e => setDescription(e.target.value)} rows="3" className={inputStyle}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="projectStartDate" className={labelStyle}>Start Date</label>
                    <input type="date" id="projectStartDate" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputStyle} />
                </div>
                <div>
                    <label htmlFor="projectEndDate" className={labelStyle}>End Date</label>
                    <input type="date" id="projectEndDate" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputStyle} />
                </div>
            </div>
            <div>
                <label htmlFor="projectStatus" className={labelStyle}>Status</label>
                <select id="projectStatus" value={status} onChange={e => setStatus(e.target.value)} className={inputStyle}>
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option> {/* From image */}
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending Projects">Pending Projects</option> {/* From image, might be a specific type or status */}
                    <option value="Canceled">Canceled</option>
                </select>
            </div>
            <div>
                <label htmlFor="projectFacilitators" className={labelStyle}>Facilitators</label>
                <select id="projectFacilitators" multiple value={facilitatorIds} onChange={handleFacilitatorChange} className={`${inputStyle} h-24`}>
                    {usersList.map(user => (
                        <option key={user.uid} value={user.uid}>{user.displayName || user.email}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="py-2 px-4 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="py-2 px-4 bg-indigo-600 text-white rounded-md text-sm font-medium">{submitButtonText}</button>
            </div>
        </form>
    );
};
// --- End ProjectForm Component ---


// --- ProjectListItem Component (for Table Row - move to src/components/projects/ProjectListItem.jsx) ---
const ProjectListItem = ({ project, facilitatorDetails = {}, onEdit, onDelete }) => {
    const projectStatus = project.status || "N/A";
    const progress = project.progress || 0; // Assuming a 'progress' field (0-100)

    const getStatusColor = (status) => {
        switch (status) {
            case "Active": return "bg-blue-100 text-blue-700";
            case "In Progress": return "bg-blue-100 text-blue-700"; // from image
            case "Planning": return "bg-yellow-100 text-yellow-700"; // from image
            case "On Hold": return "bg-yellow-100 text-yellow-700";
            case "Completed": return "bg-green-100 text-green-700";
            case "Pending Projects": return "bg-purple-100 text-purple-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };
    
    const facilitatorNames = project.facilitatorIds?.map(id => facilitatorDetails[id] || "Loading...").join(', ') || "N/A";

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{project.name || "Untitled Project"}</div>
                <div className="text-xs text-gray-500">{project.day || "N/A"}</div> {/* Assuming a 'day' field */}
            </td>
             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                    <button onClick={() => onEdit(project)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit">✏️</button>
                    <button onClick={() => onDelete(project.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete">🗑️</button>
                    {/* Add other icons from image if needed, e.g., user icon */}
                     <span title={facilitatorNames}>👥</span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{facilitatorNames}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {project.endDate?.seconds ? new Date(project.endDate.seconds * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : "N/A"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{project.week || "N/A"}</td> {/* Assuming 'week' field */}
            <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="flex flex-col items-start">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 ${getStatusColor(projectStatus)}`}>
                        {projectStatus}
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">{progress}%</span>
                </div>
            </td>
        </tr>
    );
};
// --- End ProjectListItem Component ---


// --- SummaryCard Component (for top cards - move to src/components/projects/SummaryCard.jsx) ---
const SummaryCard = ({ title, count, icon, color = "bg-blue-500" }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
        <div className={`p-2 rounded-full ${color} text-white`}>{icon}</div>
        <div>
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="text-2xl font-bold text-gray-800">{count}</div>
        </div>
    </div>
);
// --- End SummaryCard Component ---


export default function ProjectsPage() {
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]); // For facilitator dropdown and display
    const [facilitatorDetails, setFacilitatorDetails] = useState({});


    const [projectCounts, setProjectCounts] = useState({ active: 0, onHold: 0, completed: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All Projects'); // For the dropdown

    // Fetch users (for facilitator dropdown and display)
    useEffect(() => {
        if (!currentUser) return;
        const fetchUsersList = async () => {
            try {
                const usersQuery = query(collection(db, "users"), orderBy("displayName", "asc"));
                const usersSnapshot = await getDocs(usersQuery);
                setUsers(usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            } catch (err) { console.error("Error fetching users:", err); /* Handle error */ }
        };
        fetchUsersList();
    }, [currentUser]);

    // Fetch Projects and Counts
    const fetchProjectsAndCounts = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        setError('');
        try {
            const projectsColl = collection(db, "projects");
            const q = query(
                projectsColl,
                where("creatorId", "==", currentUser.uid), // Or other relevant filters
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);

            // Fetch facilitator details for displayed projects
            if (projectsData.length > 0) {
                const allFacilitatorIds = new Set();
                projectsData.forEach(proj => {
                    if (proj.facilitatorIds && Array.isArray(proj.facilitatorIds)) {
                        proj.facilitatorIds.forEach(id => allFacilitatorIds.add(id));
                    }
                });
                const newFacDetails = { ...facilitatorDetails };
                for (const uid of Array.from(allFacilitatorIds)) {
                    if (!newFacDetails[uid]) {
                        const userDoc = await getDoc(doc(db, "users", uid));
                        if (userDoc.exists()) newFacDetails[uid] = userDoc.data().displayName || userDoc.data().email;
                        else newFacDetails[uid] = "Unknown";
                    }
                }
                setFacilitatorDetails(newFacDetails);
            }


            // Fetch counts for summary cards (this can be demanding if done frequently)
            // Consider Cloud Functions for aggregated counts for better performance
            const activeSnap = await getCountFromServer(query(projectsColl, where("creatorId", "==", currentUser.uid), where("status", "in", ["Active", "In Progress", "Planning"])));
            const onHoldSnap = await getCountFromServer(query(projectsColl, where("creatorId", "==", currentUser.uid), where("status", "==", "On Hold")));
            const completedSnap = await getCountFromServer(query(projectsColl, where("creatorId", "==", currentUser.uid), where("status", "==", "Completed")));
            const pendingSnap = await getCountFromServer(query(projectsColl, where("creatorId", "==", currentUser.uid), where("status", "==", "Pending Projects")));

            setProjectCounts({
                active: activeSnap.data().count,
                onHold: onHoldSnap.data().count,
                completed: completedSnap.data().count,
                pending: pendingSnap.data().count,
            });

        } catch (err) {
            console.error("Error fetching projects: ", err);
            setError("Failed to fetch projects. Check Firestore rules or query.");
            if (err.message.includes("requires an index")) {
                setError("Database query for projects requires an index. Check Firestore console.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectsAndCounts();
    }, [currentUser]);

    const handleSaveProject = async (projectData) => { /* ... (similar to TasksPage, ensure facilitatorIds is saved) ... */ 
        if (!currentUser) { setError("Not authenticated."); return; }
        setIsLoading(true);
        try {
            if (editingProject) {
                await updateDoc(doc(db, "projects", editingProject.id), { ...projectData, updatedAt: Timestamp.now() });
            } else {
                await addDoc(collection(db, "projects"), { ...projectData, creatorId: currentUser.uid, progress: 0, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
            }
            setShowForm(false); setEditingProject(null); fetchProjectsAndCounts();
        } catch (err) { console.error("Error saving project:", err); setError("Failed to save project."); }
        finally { setIsLoading(false); }
    };
    const handleDeleteProject = async (projectId) => { /* ... (similar to TasksPage) ... */
        if (!window.confirm("Delete this project?")) return;
        setIsLoading(true);
        try { await deleteDoc(doc(db, "projects", projectId)); fetchProjectsAndCounts(); }
        catch (err) { console.error("Error deleting project:", err); setError("Failed to delete project."); }
        finally { setIsLoading(false); }
    };

    const handleEditProject = (project) => { setEditingProject(project); setShowForm(true); setError('');};
    const handleAddNewProject = () => { setEditingProject(null); setShowForm(true); setError('');};
    const handleFormCancel = () => { setShowForm(false); setEditingProject(null); setError('');};

    // Client-side filtering based on searchTerm and filterType
    const filteredProjects = useMemo(() => {
        let result = projects;
        if (searchTerm) {
            result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (filterType !== 'All Projects' && filterType !== '') { // Assuming filterType matches a status
            result = result.filter(p => p.status === filterType);
        }
        return result;
    }, [projects, searchTerm, filterType]);


    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar pageTitle="Projects Overview" />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <SummaryCard title="Active" count={projectCounts.active} icon="❤️" color="bg-green-100 text-green-700 border border-green-200" />
                        <SummaryCard title="On Hold" count={projectCounts.onHold} icon="⏸️" color="bg-yellow-100 text-yellow-700 border border-yellow-200" />
                        <SummaryCard title="Completed" count={projectCounts.completed} icon="✔️" color="bg-blue-100 text-blue-700 border border-blue-200" />
                        <SummaryCard title="Pending Projects" count={projectCounts.pending} icon="⏳" color="bg-purple-100 text-purple-700 border border-purple-200" />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <input 
                                type="text" 
                                placeholder="Search Projects..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm w-full sm:w-64"
                            />
                            <select 
                                value={filterType} 
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="All Projects">All Projects</option>
                                <option value="Active">Active</option>
                                <option value="Planning">Planning</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending Projects">Pending Projects</option>
                            </select>
                        </div>
                        {!showForm && (
                             <button onClick={handleAddNewProject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm text-sm whitespace-nowrap w-full sm:w-auto mt-2 sm:mt-0">
                                + New Project
                            </button>
                        )}
                    </div>

                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                    {showForm && (
                        <ProjectForm
                            onSubmit={handleSaveProject}
                            initialData={editingProject}
                            onCancel={handleFormCancel}
                            usersList={users} // Pass users for facilitator selection
                            submitButtonText={editingProject ? "Update Project" : "Create Project"}
                        />
                    )}
                    
                    {isLoading && <p className="text-gray-600 text-center py-10">Loading projects...</p>}

                    {!isLoading && !showForm && filteredProjects.length === 0 && !error && (
                        <p className="text-gray-500 text-center py-10">No projects found. Click "+ New Project" to get started.</p>
                    )}

                    {!isLoading && !showForm && filteredProjects.length > 0 && (
                        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Active Projects</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th> {/* Actions */}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facilitators</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Status/Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProjects.map(project => (
                                        <ProjectListItem
                                            key={project.id}
                                            project={project}
                                            facilitatorDetails={facilitatorDetails}
                                            onEdit={handleEditProject}
                                            onDelete={handleDeleteProject}
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