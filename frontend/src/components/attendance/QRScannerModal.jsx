// frontend/src/components/attendance/QRScannerModal.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< Added useRef
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScannerModal = ({ onClose, onScanSuccess, onScanError }) => {
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null); // <<< Ref to hold the scanner instance

    useEffect(() => {
        // Only initialize the scanner if it hasn't been initialized yet
        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    qrbox: { width: 250, height: 250 },
                    fps: 10,
                    rememberLastUsedCamera: true,
                },
                false // verbose
            );

            const handleSuccess = (decodedText, decodedResult) => {
                // Check if scanner is still active to prevent errors
                if (scanner.getState() === 2) { // 2 = SCANNING
                    scanner.clear().catch(err => console.error("Error clearing scanner on success:", err));
                }
                setScanResult(decodedText);
                onScanSuccess(decodedText);
            };

            const handleError = (errorMessage) => { /* console.warn(errorMessage); */ };

            // Start scanning
            scanner.render(handleSuccess, handleError);
            scannerRef.current = scanner; // <<< Store the instance in the ref
        }

        // Cleanup function for when the component unmounts
        return () => {
            if (scannerRef.current && scannerRef.current.getState() === 2) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner on unmount.", error);
                });
                scannerRef.current = null; // Clear ref on unmount
            }
        };
    }, []); // Empty dependency still ensures this runs only on mount/unmount

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Scan QR Code</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                <div className="p-4">
                    {/* The div where the scanner will be rendered */}
                    <div id="qr-reader" className="w-full">
                        {/* CSS will be used to hide the library's stop button */}
                        <style>
                            {`
                                #qr-reader__dashboard_section_csr {
                                    display: none; /* Hides the camera selection and stop button section */
                                }
                                #qr-reader__dashboard_section_swaplink {
                                    display: none; /* Hides the "scan an image file" link */
                                }
                            `}
                        </style>
                    </div>

                    {/* Show a message during processing, before the full success message in AttendancePage */}
                    {scanResult && (
                        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded text-center">
                            <p className="font-semibold">Processing Scan...</p>
                            <p className="text-xs break-all">Data: {scanResult}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;