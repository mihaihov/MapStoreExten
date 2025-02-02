import React, { useRef, useState } from "react";
import './Component.css'
import Session from "./Session";
import { useEffect } from "react";
import DragZone from "@mapstore/components/import/dragZone/DragZone";
import FileUploadDialog from "./FileUploadDialog";
import { update } from "@mapstore/actions/geostory";


const Extension = ({ currentSession, dialogueState, changeZoomLevel, addLayer, clearLayers, entireMap, changeMapView }) => {


    useEffect(() => {
        if (dialogueState) {
            var toolbar = document.getElementById("navigationBar-container");
            toolbar.style.marginRight = "500px"
        } else {
            var toolbar = document.getElementById("navigationBar-container");
            toolbar.style.marginRight = "0px"
        }
    }, [dialogueState]);

    const [selectedSessions, setSelectedSessions] = useState([]);
    const handleCheckboxChange = (session) => {
        setSelectedSessions(prevSelected => {
            if (prevSelected.some(s => s.sessionName === session.sessionName)) {
                // If already selected, remove it
                return prevSelected.filter(s => s.sessionName !== session.sessionName);
            } else {
                // Otherwise, add the full session object
                return [...prevSelected, session];
            }
        });
    };
    
    
    const getSelectedSessions = () => {
        // Filter sessions that are checked
        const selected = currentItems.filter(session => selectedSessions[session.sessionName]);
        console.log("Selected Sessions:", selected);
    };

    const scrollContainerRef = useRef(null);
    const dragSession = useRef(0);
    const draggedOverSession = useRef(0);
    const handleSort = () => {
        const sessionClone = [...localStorageSessions];
        const temp = sessionClone[dragSession.current];
        sessionClone[dragSession.current] = sessionClone[draggedOverSession.current];
        sessionClone[draggedOverSession.current] = temp;
        setLocalStorageSession(sessionClone);

    }

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!scrollContainerRef.current) return;

        const { top, bottom, height } = scrollContainerRef.current.getBoundingClientRect();
        const scrollTreshold = 50;
        const scrollStep = 5;
        if (e.clientY < top + scrollTreshold) {
            scrollContainerRef.current.scrollBy({ top: -scrollStep, behavior: "smooth" });
        } else if (e.clientY > bottom - scrollTreshold) {
            scrollContainerRef.current.scrollBy({ top: scrollStep, behavior: "smooth" });
        }
    }

    const getAllSessionsFromLocalStorage = () => {
        return JSON.parse(localStorage.getItem("sessions"));
    }

    const myMapData = currentSession;
    const [sessionName, setSessionName] = useState('');
    const [localStorageSessions, setLocalStorageSession] = useState(getAllSessionsFromLocalStorage());
    //paginator
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(3); // Default 5 items per page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const [currentItems, setCurrentItems] = useState([]);

    useEffect(() => {
        setCurrentItems(itemsPerPage === "NONE"
        ? localStorageSessions // Show all items when NONE is selected
        : localStorageSessions.slice(startIndex, startIndex + itemsPerPage))
    },[localStorageSessions, itemsPerPage, currentPage])

    useEffect(() => {
        // Update localStorage whenever sessions change
        localStorage.setItem("sessions", JSON.stringify(localStorageSessions));
    }, [localStorageSessions]);


    const totalPages = itemsPerPage === "NONE" ? 1 : Math.ceil(localStorageSessions.length / itemsPerPage);

    const handleItemsPerPageChange = (e) => {
        const value = e.target.value === "NONE" ? "NONE" : parseInt(e.target.value, 10);
        setItemsPerPage(value);
        setCurrentPage(1); // Reset to the first page when changing items per page
    };

    const handleInputChange = (e) => {
        setSessionName(e.target.value)
    }

    const handlePageClick = (event, pageNumber) => {
        event.preventDefault();
        setCurrentPage(pageNumber);
    }

    const exportCurrentSession = () => {

        const json = JSON.stringify(myMapData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "data.json"; // File name
        link.click();

        URL.revokeObjectURL(url);
    };

const removeSession = (s) => {
    // Get the existing sessions from localStorage
    const storedSessions = JSON.parse(localStorage.getItem("sessions")) || [];

    // Filter out the session with the given sessionName
    const updatedSessions = storedSessions.filter(session => session.sessionName !== s.sessionName);

    // Save the updated array back to localStorage
    localStorage.setItem("sessions", JSON.stringify(updatedSessions));
    setLocalStorageSession(updatedSessions);
};


    const saveSessionToLocalStorage = (e) => {
        e.preventDefault();
        const dataToSave = { ...currentSession, sessionName: sessionName };
        setLocalStorageSession(prev => [dataToSave,...prev])
    }

    const toolbar = document.querySelector('.mapToolbar');

    const exportMultipleSessions = () => {
        if(!selectedSessions)     return;

        const json = JSON.stringify(selectedSessions, null, 2); 
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "multipleSessions"+".json";
        link.click();

        URL.revokeObjectURL(url);
    }

    const [isDialogOpen, setDialogOpen] = useState(false);
    const [uploadedData, setUploadedData] = useState(null);
    const fileInputRef = useRef(null);

    const handleButtonClick = () => {
        fileInputRef.current.click(); // Opens the file picker
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // const jsonData = JSON.parse(e.target.result);
                    // onFileSelect(jsonData); // Send parsed JSON data
                    addSessionsToLocalStorage(JSON.parse(e.target.result));
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

    const addSessionsToLocalStorage = (sessions) => {
        // Get the existing sessions from localStorage
        let storedSessions = JSON.parse(localStorage.getItem("sessions")) || [];
    
        // Create a Set to track existing session names for fast lookup
        const existingNames = new Set(storedSessions.map(session => session.sessionName));
    
        // Helper function to generate a unique session name
        const getUniqueSessionName = (name) => {
            if (!existingNames.has(name)) {
                existingNames.add(name);
                return name;
            }
            let count = 1;
            let newName = `${name}_${count}`;
            while (existingNames.has(newName)) {
                count++;
                newName = `${name}_${count}`;
            }
            existingNames.add(newName);
            return newName;
        };
    
        // Add each session to the storedSessions array with a unique name if necessary
        const updatedSessions = [...storedSessions, ...sessions.map(session => ({
            ...session,
            sessionName: getUniqueSessionName(session.sessionName)
        }))];
    
        // Save the updated array back to localStorage
        localStorage.setItem("sessions", JSON.stringify(updatedSessions));
        setLocalStorageSession(updatedSessions);
    };
    
    
    

    const handleFileSelect = (jsonData) => {
        setUploadedData(jsonData); // Store the parsed JSON data
        setDialogOpen(false); // Close the dialog
        console.log("Uploaded JSON:", jsonData);
    };

    const updateSessionName = (oldName, newName) => {
        setLocalStorageSession((prevSessions) => {
            return prevSessions.map((session) => {
                if (session.sessionName === oldName) {
                    return { ...session, sessionName: newName };  // Update immutably
                }
                return session;
            });
        });
    };

    return (
        (dialogueState && <div className="map-store-panel">
            <span class="glyphicon glyphicon-save glyphicon globalSaveIcon" onClick = {() => {exportMultipleSessions()}}></span>
            <h3 class="extensionHeadline">Save current map settings</h3>
            <form onSubmit={saveSessionToLocalStorage} className="formStyle">
                <input placeholder="Enter session name" type="text" name="name" onChange={handleInputChange} class="inputName" />
                <button type="submit" className="saveSessionButton">
                    <span class="glyphicon glyphicon-cloud-download imageButton"></span>
                    Save session to browser
                </button>
            </form>
            <div className={`mainSessionContainer`}>
                {currentItems.map((item, index) => (
                    <div draggable onDragStart = {() => {dragSession.current = index}}
                                    onDragEnter = {() => {draggedOverSession.current = index}}
                                    onDragEnd = {() => handleSort()}
                                    onDragOver={(e) => {handleDragOver(e)}}
                                    ref={scrollContainerRef}>
                        <Session
                            checked={selectedSessions.some(s => s.sessionName === item.sessionName)}
                            onCheckChange={ () => handleCheckboxChange(item)}
                            key={index}
                            session={item}
                            changeZoomLevel={changeZoomLevel}
                            addLayer={addLayer}
                            changeMapView={changeMapView}
                            clearLayers={clearLayers}
                            entireMap={entireMap}
                            removeSession={removeSession}
                            updateSessionName = {updateSessionName}
                        />
                    </div>
                ))}
            </div>
            <button className="loadSessionFromFileButton" onClick={handleButtonClick}>
                <span class="glyphicon glyphicon-upload imageButton"></span>
                Load session from file
            </button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".json"
                onChange={handleFileChange}
            />


            {uploadedData && <pre>{JSON.stringify(uploadedData, null, 2)}</pre>}

            {/* //paginator */}
            <div class="paginatorContainer">
                <div className="pagination-settings">
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange} class="dropDownPaginator">
                        <option value="3">3</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="NONE">NONE</option>
                    </select>
                    {itemsPerPage !== "NONE" && (
                        <nav aria-label="Pagination">
                            <ul className="pagination">
                                <li className="page-item">
                                    <span className="page-link" onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}>
                                        <span aria-hidden="true">&laquo;</span>
                                        <span className="sr-only">Previous</span>
                                    </span>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <li className={`page-item ${page === currentPage ? "active" : "inactive"}`} key={page}>
                                        <span onClick={() => setCurrentPage(page)} className="page-link">
                                            {page}
                                        </span>
                                    </li>
                                ))}
                                <li className="page-item">
                                    <span className="page-link" onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}>
                                        <span aria-hidden="true">&raquo;</span>
                                        <span className="sr-only">Next</span>
                                    </span>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            </div>



        </div>
        ));
}

export default Extension;
