// frontend/src/pages/admin/AdminPanelPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import { db } from '../../firebaseConfig';      // Adjust path as needed
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- Placeholder UserListItem (ensure this is defined correctly) ---
const UserListItem = ({ user, onEditRole, onDeleteUser }) => {
    // ... (Your UserListItem JSX and logic)
    return (
        <div className="flex items-center justify-between p-3 border-b hover:bg-gray-50">
            <div>
                <p className="text-sm font-medium text-gray-900">{user.displayName || user.email}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full font-semibold
                    ${user.role === 'Super_Admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'Facilitator' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'Event_Coordinator' ? 'bg-teal-100 text-teal-700' :
                    'bg-gray-100 text-gray-700'}`}
                >
                    {user.role || 'No Role'}
                </span>
                <button onClick={() => onEditRole(user)} className="text-xs py-1 px-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-800 rounded">Edit Role</button>
                <button onClick={() => onDeleteUser(user.uid, user.displayName || user.email)} className="text-xs py-1 px-2 bg-red-500 hover:bg-red-600 text-white rounded">Delete</button>
            </div>
        </div>
    );
};
// --- End UserListItem ---

// --- Placeholder RoleEditForm (ensure this is defined correctly) ---
const RoleEditForm = ({ userToEdit, onSaveRole, onCancel, isSaving }) => {
    const [newRole, setNewRole] = useState(userToEdit?.role || 'Team_Member');
    const availableRoles = ["Team_Member", "Facilitator", "Event_Coordinator", "Admin", "Super_Admin"];

    if (!userToEdit) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSaveRole(userToEdit.uid, newRole);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-xl w-full max-w-md space-y-4">
                <h3 className="text-lg font-semibold">Edit Role for {userToEdit.displayName || userToEdit.email}</h3>
                <div>
                    <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                        id="role-select"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-3 pt-3">
                    <button type="button" onClick={onCancel} className="btn-secondary-outline text-sm">Cancel</button>
                    <button type="submit" disabled={isSaving} className="btn-primary text-sm">
                        {isSaving ? "Saving..." : "Save Role"}
                    </button>
                </div>
            </form>
        </div>
    );
};
// --- End RoleEditForm ---


// ***** THIS IS THE KEY CHANGE: Add 'export default' here *****
export default function AdminPanelPage() {
    const { currentUser, userData: adminUserData } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUserRole, setEditingUserRole] = useState(null);
    const [isSavingRole, setIsSavingRole] = useState(false);

    // --- fetchAllUsers function (from previous correct AdminPanelPage version) ---
    const fetchAllUsers = React.useCallback(async () => { // Added useCallback
        if (!currentUser) { setIsLoading(false); return; } // Check currentUser before proceeding
        setIsLoading(true);
        setError('');
        try {
            const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc")); // or orderBy("displayName")
            const querySnapshot = await getDocs(usersQuery);
            setUsersList(querySnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() })));
        } catch (err) {
            console.error("AdminPanelPage: Error fetching users:", err);
            setError("Failed to fetch users. Check permissions or Firestore rules for listing users.");
            if (err.code === 'permission-denied') setError("Permission denied to list users. Ensure Admins have read access to the 'users' collection.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]); // Added currentUser as dependency

    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]); // useEffect depends on the memoized fetchAllUsers

    // --- handleOpenEditRoleModal function (from previous correct AdminPanelPage version) ---
    const handleOpenEditRoleModal = (user) => {
        if (adminUserData?.role === 'Admin' && user.role === 'Super_Admin') {
            alert("Admins cannot edit the role of a Super Admin.");
            return;
        }
        setEditingUserRole(user);
    };

    // --- handleSaveUserRole function (from previous correct AdminPanelPage version) ---
    const handleSaveUserRole = async (userIdToUpdate, newRole) => {
        if (adminUserData?.role === 'Admin' && newRole === 'Super_Admin') {
            alert("Admins cannot assign the Super Admin role.");
            return;
        }
        setIsSavingRole(true); setError('');
        try {
            const userDocRef = doc(db, "users", userIdToUpdate);
            await updateDoc(userDocRef, { role: newRole });
            setEditingUserRole(null);
            fetchAllUsers();
            alert("User role updated successfully!");
        } catch (err) {
            console.error("AdminPanelPage: Error updating user role:", err);
            setError("Failed to update user role.");
        } finally {
            setIsSavingRole(false);
        }
    };

    // --- handleDeleteUser function (from previous correct AdminPanelPage version) ---
    const handleDeleteUser = async (userIdToDelete, userName) => {
        if (currentUser?.uid === userIdToDelete) {
            alert("You cannot delete your own account.");
            return;
        }
        const userToDeleteData = usersList.find(u => u.uid === userIdToDelete);
        if (adminUserData?.role === 'Admin' && userToDeleteData?.role === 'Super_Admin') {
            alert("Admins cannot delete Super Admin accounts.");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete user: ${userName || userIdToDelete}? This only removes Firestore record.`)) return;
        setIsLoading(true); setError('');
        try {
            await deleteDoc(doc(db, "users", userIdToDelete));
            fetchAllUsers();
            alert(`User ${userName || userIdToDelete} document deleted from Firestore.`);
        } catch (err) {
            console.error("AdminPanelPage: Error deleting user document:", err);
            setError("Failed to delete user document.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Admin Panel - User Management</h2>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">{error}</div>}
            {editingUserRole && (
                <RoleEditForm
                    userToEdit={editingUserRole}
                    onSaveRole={handleSaveUserRole}
                    onCancel={() => setEditingUserRole(null)}
                    isSaving={isSavingRole}
                />
            )}
            {isLoading && <div className="text-center py-10">Loading users...</div>}
            {!isLoading && !error && usersList.length === 0 && (
                <p className="text-center text-gray-500">No users found.</p>
            )}
            {!isLoading && !error && usersList.length > 0 && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {usersList.map(user => (
                            <UserListItem
                                key={user.uid}
                                user={user}
                                onEditRole={handleOpenEditRoleModal}
                                onDeleteUser={handleDeleteUser}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}