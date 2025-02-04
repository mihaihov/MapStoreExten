import React, { useRef, useState } from "react";
import '../assets/style.css'
import Session from "./Session";
import { useEffect } from "react";
import { mapSelector } from "@mapstore/selectors/map";
import Message from "@mapstore/components/I18N/Message";


const SaveSessionToLocalStorageExtension = ({ currentSession, dialogueState, changeZoomLevel, addLayer, clearLayers, entireMap, changeMapView }) => {


    //adds/remove offset to the toolbar when extension is enabled.
    useEffect(() => {
        const toolbar = document.getElementById("navigationBar-container");
        
        if (toolbar) {
            const currentMarginRight = parseInt(window.getComputedStyle(toolbar).right, 10) || 0;
            
            if (dialogueState) {
                if (currentMarginRight < 500) {
                    toolbar.style.marginRight = "500px";
                }
            } else {
                toolbar.style.marginRight = "0px";
            }
        }
    }, [dialogueState]);
    

    // DRAG & DROP FUNCTIONALITY START
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
    // DRAG & DROP FUNCTIONLITY ENDS

    //LINK WITH LOCAL STORAGE OF BROWSER FUNCTIONALITY STARTS
    const getAllSessionsFromLocalStorage = () => {
        return JSON.parse(localStorage.getItem("sessions"));
    }
    const [localStorageSessions, setLocalStorageSession] = useState(getAllSessionsFromLocalStorage());

    useEffect(() => {
        localStorage.setItem("sessions", JSON.stringify(localStorageSessions));
    }, [localStorageSessions]);
    //LINK WITH LOCAL STORAGE OF BROWSER FUNCTIONALITY ENDS

    //handles the session name input field
    const [sessionName, setSessionName] = useState('');
    const handleInputChange = (e) => {
        setSessionName(e.target.value)
    }
    //PAGINATOR FUNCTIONLITY START
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(3); 
    const startIndex = (currentPage - 1) * itemsPerPage;
    const [currentItems, setCurrentItems] = useState([]);
    const totalPages = itemsPerPage === "NONE" ? 1 : Math.ceil((localStorageSessions?.length || 0) / itemsPerPage);

    useEffect(() => {
        setCurrentItems(itemsPerPage === "NONE"
        ? localStorageSessions // Show all items when NONE is selected
        : localStorageSessions?.slice(startIndex, startIndex + itemsPerPage)) || []
    },[localStorageSessions, itemsPerPage, currentPage])

    const handleItemsPerPageChange = (e) => {
        const value = e.target.value === "NONE" ? "NONE" : parseInt(e.target.value, 10);
        setItemsPerPage(value);
        setCurrentPage(1); // Reset to the first page when changing items per page
    };
    //PAGINATOR FUNCTIONALITY ENDS


    const removeSession = (s) => {
        const storedSessions = JSON.parse(localStorage.getItem("sessions")) || [];
        const updatedSessions = storedSessions.filter(session => session.sessionName !== s.sessionName);
        setLocalStorageSession(updatedSessions);
    };


    const saveSessionToLocalStorage = (e) => {
        e.preventDefault();
        const dataToSave = { ...currentSession, sessionName: getUniqueSessionName(sessionName, localStorageSessions) };
        localStorageSessions?.length > 0 ? setLocalStorageSession(prev => [dataToSave,...prev]) : setLocalStorageSession([dataToSave]);
    }

    //EXPORT MULTIPLE SESSIONS FUNCTIONALITY START
    const [selectedSessions, setSelectedSessions] = useState([]);
    const handleCheckboxChange = (session) => {
        setSelectedSessions(prevSelected => {
            if (prevSelected.some(s => s.sessionName === session.sessionName)) {
                return prevSelected.filter(s => s.sessionName !== session.sessionName);
            } else {
                return [...prevSelected, session];
            }
        });
    };

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
    //EXPORT MULTIPLE SESSIONS FUNCTIONALITY START


    //UPLOAD SESSION(S) FROM LOCAL STORAGE FUNCTIONLITY STARTS
    const [uploadedData, setUploadedData] = useState(null);
    const fileInputRef = useRef(null);

    const handleButtonClick = () => {
        fileInputRef.current.click(); // Opens the file uploader
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
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

    // Helper function to generate a unique session name
    const getUniqueSessionName = (name, nameList) => {
        let storedSessions = nameList || [];
        const existingNames = new Set(storedSessions.map(session => session.sessionName));

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

    const addSessionsToLocalStorage = (sessions) => {
        let storedSessions = localStorageSessions || [];
        const existingNames = new Set(storedSessions.map(session => session.sessionName));
    
        // Add each session to the storedSessions array with a unique name if necessary
        const updatedSessions = [...storedSessions, ...sessions.map(session => ({
            ...session,
            sessionName: getUniqueSessionName(session.sessionName, existingNames)
        }))];
    
        // Save the updated array back to localStorage
        setLocalStorageSession(updatedSessions);
    };
    //UPLOAD SESSION(S) FROM LOCAL STORAGE FUNCTIONLITY ENDS

    //RENAME SESSION FUNCTIONALITY STARTS
    const updateSessionName = (oldName, newName) => {
        setLocalStorageSession((prevSessions) => {
            return prevSessions.map((session) => {
                if (session.sessionName === oldName) {
                    return { ...session, sessionName: newName }; 
                }
                return session;
            });
        });
    };
    //RENAME SESSION FUNCTIONALITY ENDS


    return (
        (dialogueState && <div className="map-store-panel">
            <span style={{visibility: selectedSessions.length >= 2 ? 'visible' : 'hidden'}} 
                class="glyphicon glyphicon-save glyphicon globalSaveIcon" onClick = {() => {exportMultipleSessions()}}></span>
            <h4 class="extensionHeadline">
                <Message msgId="extension.title" />
            </h4>
            <form onSubmit={saveSessionToLocalStorage} className="formStyle">
                <input placeholder="Enter session name" type="text" name="name" onChange={handleInputChange} class="inputName" />
                <button type="submit" className="btn-primary square-button btn" style={{width: '200px', marginTop: '5px', margin: 0, padding: '7px'}}>
                    <span class="glyphicon glyphicon-cloud-download imageButton"></span>
                    <Message msgId="extension.saveToLocalStorage" />
                </button>
            </form>
            <div className={`mainSessionContainer`}>
                {currentItems?.map((item, index) => (
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
                <Message msgId="loadSessionFromFile"/>
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
                    {localStorageSessions?.length > 0 && (<select value={itemsPerPage} onChange={handleItemsPerPageChange} class="dropDownPaginator">
                        <option value="3">3</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="NONE">NONE</option>
                    </select>)}
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

export default SaveSessionToLocalStorageExtension;
