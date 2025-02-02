import React from "react";

const FileUploadDialog = ({ isOpen, onClose, onFileSelect }) => {
    if (!isOpen) return null; // Don't render if dialog is closed

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    onFileSelect(jsonData); // Pass parsed JSON data
                } catch (error) {
                    console.error("Invalid JSON file", error);
                    alert("Invalid JSON file.");
                }
            };
            reader.readAsText(file);
        } else {
            alert("Please select a valid JSON file.");
        }
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog">
                <h2>Select a JSON file</h2>
                <input type="file" accept=".json" onChange={handleFileChange} />
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default FileUploadDialog;
