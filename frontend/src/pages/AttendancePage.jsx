// frontend/src/pages/AttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs, Timestamp, addDoc, where, getDoc, doc } from 'firebase/firestore'; // <<< Added addDoc, where, getDoc, doc

// --- NEW IMPORT for the scanner modal ---
import QRScannerModal from '../components/attendance/QRScannerModal';
// --- END NEW IMPORT ---

// --- Child Components (SummaryCard, AttendanceRow, Icons - YOUR EXISTING CODE) ---
const UserGroupIcon = () => <span className="text-xl">👥</span>;
const UserRemoveIcon = () => <span className="text-xl">👤<span className="text-red-500">❌</span></span>;
const ClockIcon = () => <span className="text-xl">🕒</span>;
const DocumentReportIcon = () => <span className="text-xl">📄</span>;
const QrCodeIcon = () => <span className="text-xl">📷</span>;

const SummaryCard = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

const AttendanceRow = ({ record }) => (
    <tr className="border-b hover:bg-gray-50 text-sm">
        <td className="py-3 px-4 whitespace-nowrap">{record.memberName || 'N/A'}</td>
        <td className="py-3 px-4 whitespace-nowrap">
            {record.date?.seconds ? new Date(record.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
        </td>
        <td className="py-3 px-4 whitespace-nowrap">
            <span className={`px-2 py-1 text-xs rounded-full ${
                record.status === 'On Time' ? 'bg-green-100 text-green-700' :
                record.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                record.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
                {record.status || 'N/A'}
            </span>
        </td>
        <td className="py-3 px-4 whitespace-nowrap">{record.assignedTo || 'N/A'}</td>
        <td className="py-3 px-4 whitespace-nowrap">
            {record.timeIn?.seconds ? new Date(record.timeIn.seconds * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '---'}
        </td>
        <td className="py-3 px-4 whitespace-nowrap">
            {record.timeOut?.seconds ? new Date(record.timeOut.seconds * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '---'}
        </td>
    </tr>
);
// --- End Child Components ---

export default function AttendancePage() {
    const { currentUser, userData } = useAuth(); // <<< Added userData to get recorder's name/role
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [summaryStats, setSummaryStats] = useState({
        presentToday: 0, absentToday: 0, lateToday: 0, totalAttendeesOverall: 0,
    });
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');

    // --- NEW STATE for scanner ---
    const [showScanner, setShowScanner] = useState(false);
    const [scanStatusMessage, setScanStatusMessage] = useState(''); // To show success/error after a scan
    const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
    // --- End New State ---

    const fetchAttendanceData = React.useCallback(async () => { // Wrapped in useCallback
        if (!currentUser) { setLoadingData(false); return; }
        setLoadingData(true); setError('');
        try {
            // Your existing query to fetch records for the table display
            const recordsQuery = query(collection(db, "attendanceRecords"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(recordsQuery);
            const fetchedRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAttendanceRecords(fetchedRecords);

            // Your existing logic to calculate summary stats
            const todayJsDate = new Date();
            const startOfTodayJsDate = new Date(todayJsDate.getFullYear(), todayJsDate.getMonth(), todayJsDate.getDate(), 0, 0, 0, 0);
            const endOfTodayJsDate = new Date(todayJsDate.getFullYear(), todayJsDate.getMonth(), todayJsDate.getDate(), 23, 59, 59, 999);
            let present = 0, absent = 0, late = 0;
            const todaysRecords = fetchedRecords.filter(record => {
                if (record.date?.seconds) {
                    const recordJsDate = new Date(record.date.seconds * 1000);
                    return recordJsDate >= startOfTodayJsDate && recordJsDate <= endOfTodayJsDate;
                }
                return false;
            });
            todaysRecords.forEach(record => {
                 if (record.status === 'Absent') absent++;
                 else if (record.status === 'Late') { late++; present++; }
                 else if (record.status === 'On Time') present++;
            });
            setSummaryStats({ presentToday: present, absentToday: absent, lateToday: late, totalAttendeesOverall: fetchedRecords.length });
        } catch (err) {
            console.error("AttendancePage: Error fetching data:", err);
            if (err.code === 'permission-denied') setError("Permission denied.");
            else if (err.message && err.message.includes("requires an index")) setError("Database query requires an index.");
            else setError("Failed to load attendance data.");
        }
        finally { setLoadingData(false); }
    }, [currentUser]);

    useEffect(() => {
        fetchAttendanceData();
    }, [fetchAttendanceData]); // fetchAttendanceData is now memoized

    // --- NEW FUNCTION to handle successful scan ---
    const handleScanSuccess = async (scannedUserId) => {
        if (isSubmittingAttendance) return; // Prevent multiple submissions
        setIsSubmittingAttendance(true);
        setScanStatusMessage('Processing...');
        console.log("QR Scan success, User ID:", scannedUserId);

        try {
            // 1. Fetch the user's document to get their name
            const userDocRef = doc(db, "users", scannedUserId);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                throw new Error("User with this QR code does not exist.");
            }
            const scannedUserData = userSnap.data();
            const memberName = scannedUserData.displayName || scannedUserData.email;

            // 2. Create the new attendance record
            const now = Timestamp.now();
            const newRecord = {
                userId: scannedUserId,
                memberName: memberName, // Denormalized for easy display in the table
                date: now,
                timeIn: now,
                timeOut: null,
                status: "On Time", // You can add logic for 'Late' based on event start time
                recordedBy: currentUser.uid, // The user who is scanning
                // assignedTo: 'Some Value' // Add logic for this field if needed
            };

            await addDoc(collection(db, "attendanceRecords"), newRecord);
            setScanStatusMessage(`Success! Attendance recorded for ${memberName}.`);
            
            // 3. Close the scanner and refresh the data after a short delay
            setTimeout(() => {
                setShowScanner(false);
                setScanStatusMessage('');
                fetchAttendanceData(); // Refresh the list
            }, 2000); // Close after 2 seconds

        } catch (err) {
            console.error("AttendancePage: Error recording attendance:", err);
            setScanStatusMessage(`Error: ${err.message}`);
            // Don't close the scanner immediately on error so user can see message
            setTimeout(() => {
                setScanStatusMessage(''); // Clear error after a few seconds
            }, 5000);
        } finally {
            setIsSubmittingAttendance(false);
        }
    };
    // --- End New Function ---


    return (
        <div className="p-6 md:p-8">
            {/* --- NEW: Render QRScannerModal conditionally --- */}
            {showScanner && (
                <QRScannerModal
                    onClose={() => {
                        setShowScanner(false);
                        setScanStatusMessage('');
                    }}
                    onScanSuccess={handleScanSuccess}
                    // onScanError can be passed if you want to handle scanning errors
                />
            )}
            {/* Display a global status message if needed, or rely on modal's internal message */}
            {scanStatusMessage && !showScanner && <p>{scanStatusMessage}</p>}
            {/* --- End QRScannerModal rendering --- */}


            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex-grow">
                    {/* If you want a title here like "Attendance Overview", it would go here */}
                    {/* <h2 className="text-2xl font-semibold text-gray-700">Attendance Overview</h2> */}
                </div>
                <button
                    onClick={() => {
                        setScanStatusMessage(''); // Clear any previous messages
                        setShowScanner(true);     // Open the scanner
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition duration-150 w-full sm:w-auto"
                >
                    <QrCodeIcon />
                    <span>Open Scanner</span>
                </button>
            </div>

            {/* YOUR EXISTING JSX for Summary Cards, Table, and Buttons (VERBATIM) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <SummaryCard title="Present Today" value={summaryStats.presentToday} icon={<UserGroupIcon />} />
                <SummaryCard title="Absent Today" value={summaryStats.absentToday} icon={<UserRemoveIcon />} />
                <SummaryCard title="Late Today" value={summaryStats.lateToday} icon={<ClockIcon />} />
                <SummaryCard title="Total Records" value={summaryStats.totalAttendeesOverall} icon={<UserGroupIcon />} />
            </div>

            {loadingData && <div className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div></div>}
            {error && <div className="bg-red-100 border-red-500 text-red-700 border-l-4 p-4 mb-6" role="alert">{error}</div>}

            {!loadingData && !error && (
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="py-3 px-4">Member</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Assigned to</th>
                                <th className="py-3 px-4">Time In</th>
                                <th className="py-3 px-4">Time Out</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {attendanceRecords.length > 0 ? (
                                attendanceRecords.map(record => <AttendanceRow key={record.id} record={record} />)
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500 italic">
                                        No attendance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {!loadingData && !error && attendanceRecords.length > 0 && (
                 <div className="flex justify-end mt-8">
                    <button
                        onClick={() => alert('Reports functionality here!')}
                        className="bg-slate-700 hover:bg-slate-800 text-white py-2.5 px-5 rounded-lg shadow-md flex items-center space-x-2 transition duration-150"
                    >
                        <DocumentReportIcon />
                        <span>Generate Reports</span>
                    </button>
                </div>
            )}
        </div>
    );
}