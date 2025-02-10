import React, { useRef, useState } from "react";
import '../../../assets/style.css'
import Session from "./Session";
import { useEffect } from "react";
import Message from "@mapstore/components/I18N/Message";
import { getMessageById } from "@mapstore/utils/LocaleUtils";

const SaveSessionToLocalStorageExtension = ({ currentSession, dialogueState, changeZoomLevel, addLayer, clearLayers, entireMap, changeMapView, closeDialogue }) => {
    //adds/remove offset to the toolbar when extension is enabled.
    useEffect(() => {
        const toolbar = document.getElementById("navigationBar-container");
        
        if (toolbar) {
            const currentMarginRight = parseInt(window.getComputedStyle(toolbar).right, 10) || 0;
            
            if (dialogueState) {
                if (currentMarginRight != 500) {
                    toolbar.style.right = "500px";
                }
            } else {
                toolbar.style.right = "0px";
            }
        }
    }, [dialogueState, entireMap.maplayout.layout.right]);
    

    // DRAG & DROP FUNCTIONALITY START
    const [dragSession, setDragSession] = useState(null);
    const [draggedOverSession, setDraggedOverSession] = useState(null);
    const handleSort = (e) => {
        e.preventDefault();

        const sessionClone = [...localStorageSessions];
        const temp = sessionClone[dragSession];
        sessionClone[dragSession] = sessionClone[draggedOverSession];
        sessionClone[draggedOverSession] = temp;
        setLocalStorageSession(sessionClone);

        setDragSession(null);
        setDraggedOverSession(null);
    }

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();

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
    const totalPages = itemsPerPage === getMessageById(entireMap.locale.messages, "extension.all") ? 1 : Math.ceil((localStorageSessions?.length || 0) / itemsPerPage);

    useEffect(() => {
        
        setCurrentItems(itemsPerPage === getMessageById(entireMap.locale.messages, "extension.all")
        ? localStorageSessions // Show all items when All is selected
        : localStorageSessions?.slice(startIndex, startIndex + itemsPerPage)) || []
    },[localStorageSessions, itemsPerPage, currentPage])

    const handleItemsPerPageChange = (e) => {
        const value = e.target.value === getMessageById(entireMap.locale.messages, "extension.all") ? getMessageById(entireMap.locale.messages, "extension.all") : parseInt(e.target.value, 10);
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
        const dataToSave = { ...currentSession, sessionName: getUniqueSessionName(sessionName, localStorageSessions.map(session => session.sessionName)) };
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
                    console.error(getMessageById(entireMap.locale.messages, "extension.invalidJsonError"), error);
                    alert(getMessageById(entireMap.locale.messages, "extension.invalidJsonError"));
                }
            };
            reader.readAsText(file);
        } else {
            alert(getMessageById(entireMap.locale.messages, "extension.selectValidJsonError"));
        }
    };

    // Helper function to generate a unique session name
    const getUniqueSessionName = (name, nameList) => {
        let storedSessions = nameList || [];
        const existingNames = new Set(storedSessions);

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
            <div className="ms-header ms-primary bg-primary" style={{width: '100%'}}>
                <div class="headerStyle">
                    <div className="square-button bg-primary" style={{ display: 'flex' }}>
                        <span class="glyphicon glyphicon-folder-open"></span>
                    </div>
                    <h4><span class = "pluginTitle">Manage sessions in local storage</span></h4>
                    <button type="button" class="square-button ms-close btn btn-primary closeDialogueButton" title={getMessageById(entireMap.locale.messages, "extension.closeDialogue")}>
                        <span class="glyphicon glyphicon-1-close" onClick={() => { closeDialogue() }}></span>
                    </button>
                </div>
            </div>

            <h4 class="extensionHeadline">
                <Message msgId="extension.title" />
            </h4>
            <form onSubmit={saveSessionToLocalStorage} className="formStyle form-group">
                <input placeholder={getMessageById(entireMap.locale.messages,"extension.saveToLocalStorage")} type="text" name="name" onChange={handleInputChange} class="inputName form-control" />
                <button type="submit" className="saveSessionButton btn-primary square-button btn">
                    <span class="glyphicon glyphicon-cloud-download" style={{marginRight: '6px'}}></span>
                    <Message msgId="extension.saveToLocalStorage" />
                </button>
            </form>
            <div style={{display: 'flex', flexDirection: 'row', width: '100%', paddingLeft: '10px', paddingRight: '10px'}}>
                <button class="btn" title={getMessageById(entireMap.locale.messages, "extension.exportMultipleSessions")} style={{paddingTop: '0px', paddingBottom: '0px', visibility: selectedSessions.length >= 2 ? 'visible' : 'hidden', fontSize:'30px', backgroundColor: 'transparent', border: 'none' }}  onClick={() => { exportMultipleSessions() }}>
                    <span class="glyphicon glyphicon-save glyphicon"> </span>
                </button>
            </div>

            <div className={`mainSessionContainer`}>
                {currentItems?.map((item, index) => (
                    <div draggable key={item.sessionName} onDragStart = {(e) => {setDragSession(index);     e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", index);}}
                                    onDragEnter = {() => {setDraggedOverSession(index);}}
                                    onDragEnd = {(e) => handleSort(e)}
                                    onDragOver={(e) => handleDragOver(e)}
                                   >
                        <Session
                            checked={selectedSessions.some(s => s.sessionName === item.sessionName)}
                            onCheckChange={ () => handleCheckboxChange(item)}
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
                <span class="glyphicon glyphicon-upload"></span>
                <Message msgId="extension.loadSessionFromFile"/>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".json"
                onChange={handleFileChange}
            />


            {uploadedData && <pre>{JSON.stringify(uploadedData, null, 2)}</pre>}


            {/* renderPagination = () => {
        if (this.props.result && !this.props.isNewServiceAdded) {
                let total = this.props.result.numberOfRecordsMatched;
            let returned = this.props.result.numberOfRecordsReturned;
            let start = this.props.searchOptions.startPosition;
            // let next = this.props.result.nextRecord;
            let pageSize = this.props.pageSize;
            let page = Math.floor(start / pageSize);
            let pageN = Math.ceil(total / pageSize);
            return (<div className="catalog-pagination"><Pagination
                prev next first last ellipsis boundaryLinks
                bsSize="small"
                items={pageN}
                maxButtons={5}
                activePage={page + 1}
                onSelect={this.handlePage} />
                <div className="push-right">
                    <Message msgId="catalog.pageInfo" msgParams={{ start, end: start + returned - 1, total }} />
                </div>
            </div>);
        }
            return null;
    }; */}
            {/* //paginator */}
            <div class="paginatorContainer">
                <div className="pagination-settings">
                    {localStorageSessions?.length > 0 && (<select value={itemsPerPage} onChange={handleItemsPerPageChange} class="dropDownPaginator">
                        <option value="3">3</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value={getMessageById(entireMap.locale.messages, "extension.all")}>{getMessageById(entireMap.locale.messages, "extension.all")}</option>
                    </select>)}
                    {itemsPerPage !== getMessageById(entireMap.locale.messages, "extension.all") && (
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
                                        <span onClick={() => {setCurrentPage(page);}} className="page-link">
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
