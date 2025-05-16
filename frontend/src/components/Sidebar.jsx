// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink, Link } from 'react-router-dom';

// Updated navItems array
const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/events", label: "Events", icon: "📅" },
    { to: "/tasks", label: "Tasks", icon: "✔️" }, // Tasks link is active
    { to: "/projects", label: "Projects", icon: "📁" }, // Projects link commented out for now
    // Or, if you want a disabled-looking placeholder for Projects:
    // { to: "#", label: "Projects (Soon)", icon: "📁", disabled: true }, 
    { to: "/attendance", label: "Attendance", icon: "👥" },
];

const SidebarItem = ({ to, label, icon, disabled = false }) => ( // Added disabled prop
    <li>
        <NavLink
            to={disabled ? "#" : to} // If disabled, NavLink goes to "#" (no navigation)
            // Apply active styles using the isActive prop provided by NavLink
            // Also apply disabled styles
            className={({ isActive }) =>
                `flex items-center p-2 space-x-3 rounded-md transition-colors text-sm font-medium
                ${disabled 
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100' // Disabled style
                    : isActive
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm' // Active link style
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900' // Inactive link style
                }`
            }
            // Prevent click if disabled (though NavLink to "#" also does this)
            onClick={(e) => { if (disabled) e.preventDefault(); }} 
            aria-disabled={disabled}
        >
            {icon && <span className="text-lg w-6 text-center">{icon}</span>}
            <span>{label}</span>
        </NavLink>
    </li>
);

const Sidebar = () => {
    return (
        <div className="w-60 h-screen bg-white p-4 border-r border-gray-200 flex-shrink-0 shadow-lg flex flex-col">
            <div className="mb-8 text-center py-2">
                <Link to="/dashboard" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                    P.I.M.S
                </Link>
            </div>

            <nav className="flex-grow">
                <ul className="space-y-1.5">
                    {navItems.map((item) => (
                        <SidebarItem 
                            key={item.label} // Using label as key if 'to' can be '#'
                            to={item.to} 
                            label={item.label} 
                            icon={item.icon}
                            disabled={item.disabled} // Pass disabled prop
                        />
                    ))}
                    {/* Manually add Projects link if you prefer not to modify navItems array directly now */}
                     
                </ul>
            </nav>

            <div className="mt-auto pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Your App</p>
            </div>
        </div>
    );
};

export default Sidebar;