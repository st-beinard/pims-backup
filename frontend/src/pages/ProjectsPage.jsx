// frontend/src/pages/ProjectsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext'; // For currentUser
import { db } from '../firebaseConfig';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, where, orderBy, Timestamp, getCountFromServer, getDoc // Ensure getDoc is imported
} from 'firebase/firestore';


// --- ProjectForm Component (Defined within this file) ---
const ProjectForm = ({ onSubmit, initialData, onCancel, usersList = [], submitButtonText = "Save Project" }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('Active');
    const [facilitatorIds, setFacilitatorIds] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
        setStartDate(initialData?.startDate?.seconds ? new Date(initialData.startDate.seconds * 1000).toISOString().split('T')[0] : '');
        setEndDate(initialData?.endDate?.seconds ? new Date(initialData.endDate.seconds * 1000).toISOString().split('T')[0] : '');
        setStatus(initialData?.status || 'Active');
        setFacilitatorIds(initialData?.facilitatorIds || []);
        setError(''); // Clear errors when form data changes
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
            facilitatorIds,
        };
        await onSubmit(projectData);
    };
    
    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const labelStyle = "block text-sm font-medium text-gray-700";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 border">
            <h3 className="text-lg font-medium text-gray-800">{initialData?.id ? "Edit Project" : "Create New Project"}</h3>
            {error && <p className="text-red-600 bg-red-100 p-2 rounded text-sm border border-red-300">{error}</p>}
            <div>
                <label htmlFor="projectName" className={labelStyle}>Project Name <span className="text-red-500">*</span></label>
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
                    <option value="Planning">Planning</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending Projects">Pending Projects</option>
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
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd (Mac) to select multiple.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow-sm">{submitButtonText}</button>
            </div>
        </form>
    );
};
// --- End ProjectForm Component ---


// --- ProjectListItem Component (Defined within this file) ---
const ProjectListItem = ({ project, facilitatorDetails = {}, onEdit, onDelete }) => {
    const projectStatus = project.status || "N/A";
    const progress = project.progress || 0;

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) { // Added toLowerCase for case-insensitivity
            case "active": case "in progress": return "bg-blue-100 text-blue-700";
            case "planning": case "on hold": return "bg-yellow-100 text-yellow-700";
            case "completed": return "bg-green-100 text-green-700";
            case "pending projects": return "bg-purple-100 text-purple-700";
            case "canceled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };
    
    const facilitatorNames = project.facilitatorIds?.map(id => facilitatorDetails[id] || "N/A").join(', ') || "N/A";

    return (
        <tr className="hover:bg-gray-50 transition-colors duration-150">
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{project.name || "Untitled Project"}</div>
                <div className="text-xs text-gray-500">{project.day || ""}</div> {/* Show N/A or empty based on preference */}
            </td>
             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                    <button onClick={() => onEdit(project)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-100" title="Edit">✏️</button>
                    <button onClick={() => onDelete(project.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100" title="Delete">🗑️</button>
                    <span title={`Facilitators: ${facilitatorNames}`} className="p-1 cursor-default">👥</span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate max-w-xs" title={facilitatorNames}>{facilitatorNames}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {project.endDate?.seconds ? new Date(project.endDate.seconds * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : "N/A"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{project.week || ""}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm w-48"> {/* Fixed width for progress bar container */}
                <div className="flex flex-col items-start">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 ${getStatusColor(projectStatus)}`}>
                        {projectStatus}
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">{progress}% Complete</span>
                </div>
            </td>
        </tr>
    );
};
// --- End ProjectListItem Component ---


// --- SummaryCard Component (Defined within this file) ---
const SummaryCard = ({ title, count, icon, iconBgColor = "bg-blue-500", textColor = "text-blue-700", borderColor = "border-blue-200" }) => (
    <div className={`bg-white p-4 rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${borderColor}`}>
        <div className={`p-3 rounded-full ${iconBgColor} text-white shadow`}>{icon}</div>
        <div>
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className={`text-3xl font-bold ${textColor}`}>{count}</div>
        </div>
    </div>
);
// --- End SummaryCard Component ---


export default function ProjectsPage() {
    const { currentUser } = useAuth(); // userData and logout are not directly used here for Topbar
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [facilitatorDetails, setFacilitatorDetails] = useState({});

    const [projectCounts, setProjectCounts] = useState({ active: 0, onHold: 0, completed: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All Projects');

    useEffect(() => {
        if (!currentUser) return;
        const fetchUsersList = async () => {
            try {
                const usersQuery = query(collection(db, "users"), orderBy("displayName", "asc")); // Assuming users have displayName
                const usersSnapshot = await getDocs(usersQuery);
                const usersData = usersSnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
                setUsers(usersData);
                // Pre-populate facilitatorDetails from the fetched users
                const initialFacDetails = {};
                usersData.forEach(u => { initialFacDetails[u.uid] = u.displayName || u.email; });
                setFacilitatorDetails(prev => ({ ...prev, ...initialFacDetails }));
            } catch (err) { console.error("ProjectsPage: Error fetching users:", err); }
        };
        fetchUsersList();
    }, [currentUser]);

    const fetchProjectsAndCounts = React.useCallback(async () => {
        if (!currentUser) { setIsLoading(false); return; }
        console.log("ProjectsPage: Fetching projects and counts for user:", currentUser.uid);
        setIsLoading(true);
        setError('');
        try {
            const projectsColl = collection(db, "projects");
            // Base query for listing projects, might be filtered later by client-side logic or server-side if filterType is applied
            const q = query(
                projectsColl,
                where("creatorId", "==", currentUser.uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const projectsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setProjects(projectsData);
            console.log("ProjectsPage: Projects fetched", projectsData);

            // Fetch facilitator details for the currently displayed projects if not already fetched
            if (projectsData.length > 0) {
                const allFacilitatorIdsInCurrentProjects = new Set();
                projectsData.forEach(proj => {
                    if (proj.facilitatorIds && Array.isArray(proj.facilitatorIds)) {
                        proj.facilitatorIds.forEach(id => {
                            if (!facilitatorDetails[id]) { // Only add if not already in details
                                allFacilitatorIdsInCurrentProjects.add(id);
                            }
                        });
                    }
                });

                if (allFacilitatorIdsInCurrentProjects.size > 0) {
                    const newFacDetails = {};
                    // Simpler: fetch only missing ones. For a large number of unique IDs, consider batching.
                    for (const uid of Array.from(allFacilitatorIdsInCurrentProjects)) {
                        try {
                            const userDoc = await getDoc(doc(db, "users", uid));
                            if (userDoc.exists()) {
                                newFacDetails[uid] = userDoc.data().displayName || userDoc.data().email || "Unknown User";
                            } else {
                                newFacDetails[uid] = "Unknown User";
                            }
                        } catch (userErr) {
                            console.error(`Error fetching facilitator ${uid}:`, userErr);
                            newFacDetails[uid] = "Error Loading";
                        }
                    }
                    setFacilitatorDetails(prev => ({ ...prev, ...newFacDetails }));
                }
            }

            // Fetch counts for summary cards
            const countQuery = (status) => query(projectsColl, where("creatorId", "==", currentUser.uid), where("status", "==", status));
            const activeStatuses = ["Active", "In Progress", "Planning"]; // Define what counts as "Active" for the summary
            const activeQuery = query(projectsColl, where("creatorId", "==", currentUser.uid), where("status", "in", activeStatuses));

            const [activeSnap, onHoldSnap, completedSnap, pendingSnap] = await Promise.all([
                getCountFromServer(activeQuery),
                getCountFromServer(countQuery("On Hold")),
                getCountFromServer(countQuery("Completed")),
                getCountFromServer(countQuery("Pending Projects")),
            ]);

            setProjectCounts({
                active: activeSnap.data().count,
                onHold: onHoldSnap.data().count,
                completed: completedSnap.data().count,
                pending: pendingSnap.data().count,
            });
            console.log("ProjectsPage: Counts fetched");

        } catch (err) {
            console.error("ProjectsPage: Error fetching projects/counts: ", err);
            let errMsg = "Failed to fetch project data.";
            if (err.message && err.message.includes("requires an index")) {
                errMsg = "Database query for projects or counts requires an index. Check Firestore console for links to create them.";
            } else if (err.code === 'permission-denied') {
                errMsg = "Permission denied. Check Firestore rules for 'projects' and 'users' collections.";
            }
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, facilitatorDetails]); // Added facilitatorDetails to re-evaluate if it changes, though fetching logic is complex

    useEffect(() => {
        fetchProjectsAndCounts();
    }, [fetchProjectsAndCounts]); // fetchProjectsAndCounts is memoized

    const handleSaveProject = async (projectData) => {
        if (!currentUser) { setError("Action requires authentication."); return; }
        // setIsLoading(true); // Or a specific submitting state
        setError('');
        try {
            const dataToSave = {
                ...projectData,
                updatedAt: Timestamp.now(),
            };
            if (editingProject?.id) {
                await updateDoc(doc(db, "projects", editingProject.id), dataToSave);
            } else {
                await addDoc(collection(db, "projects"), {
                    ...dataToSave,
                    creatorId: currentUser.uid,
                    progress: projectData.progress || 0, // Default progress
                    createdAt: Timestamp.now(),
                });
            }
            setShowForm(false); setEditingProject(null); fetchProjectsAndCounts(); // Refresh all data
        } catch (err) {
            console.error("ProjectsPage: Error saving project:", err);
            setError(`Failed to save project: ${err.message}`);
        }
        // finally { setIsLoading(false); }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm("Are you sure you want to delete this project and all its associated tasks? This action cannot be undone.")) return;
        // setIsLoading(true);
        setError('');
        try {
            // TODO: Add logic to delete associated tasks if necessary (Cloud Function is best for this)
            await deleteDoc(doc(db, "projects", projectId));
            fetchProjectsAndCounts(); // Refresh all data
        } catch (err) {
            console.error("ProjectsPage: Error deleting project:", err);
            setError(`Failed to delete project: ${err.message}`);
        }
        // finally { setIsLoading(false); }
    };

    const handleEditProject = (project) => { setEditingProject(project); setShowForm(true); setError('');};
    const handleAddNewProject = () => { setEditingProject(null); setShowForm(true); setError('');};
    const handleFormCancel = () => { setShowForm(false); setEditingProject(null); setError('');};

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const searchTermMatch = searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            const filterTypeMatch = (filterType !== 'All Projects' && filterType !== '') ? p.status === filterType : true;
            return searchTermMatch && filterTypeMatch;
        });
    }, [projects, searchTerm, filterType]);

    // NO handleLogout here, it's in Layout.jsx

    // Page content will be rendered inside Layout's <Outlet />
    return (
        <div className="p-4 sm:p-6"> {/* Padding for the content area */}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <SummaryCard title="Active Projects" count={projectCounts.active} icon="🚀" iconBgColor="bg-green-500" textColor="text-green-700" borderColor="border-green-500"/>
                <SummaryCard title="On Hold" count={projectCounts.onHold} icon="⏸️" iconBgColor="bg-yellow-400" textColor="text-yellow-700" borderColor="border-yellow-400"/>
                <SummaryCard title="Completed" count={projectCounts.completed} icon="✔️" iconBgColor="bg-blue-500" textColor="text-blue-700" borderColor="border-blue-500"/>
                <SummaryCard title="Pending Approval" count={projectCounts.pending} icon="⏳" iconBgColor="bg-purple-500" textColor="text-purple-700" borderColor="border-purple-500"/>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3 bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search Projects by Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full sm:w-64"
                    />
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full sm:w-auto"
                    >
                        <option value="All Projects">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Planning">Planning</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending Projects">Pending Projects</option>
                        <option value="Canceled">Canceled</option>
                    </select>
                </div>
                {!showForm && (
                     <button onClick={handleAddNewProject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm text-sm whitespace-nowrap w-full sm:w-auto mt-3 sm:mt-0">
                        + New Project
                    </button>
                )}
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm shadow">{error}</div>}

            {showForm && (
                <ProjectForm
                    onSubmit={handleSaveProject}
                    initialData={editingProject}
                    onCancel={handleFormCancel}
                    usersList={users}
                    submitButtonText={editingProject?.id ? "Update Project" : "Create Project"}
                />
            )}
            
            {isLoading && <div className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div></div>}

            {!isLoading && !showForm && filteredProjects.length === 0 && !error && (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500 italic">No projects found matching your criteria. Click "+ New Project" to get started.</p>
                </div>
            )}

            {!isLoading && !showForm && filteredProjects.length > 0 && (
                <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Project Details</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facilitators</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Status & Progress</th>
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
             {!showForm && ( // "View Archived" button only if not in form mode
                <div className="flex justify-end mt-6">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition duration-150">
                        View Archived Projects
                    </button>
                </div>
            )}
        </div>
    );
}