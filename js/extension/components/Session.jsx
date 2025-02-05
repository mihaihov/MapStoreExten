import React, { useEffect } from 'react'
import { useState } from 'react'
import '../../../assets/style.css'

const Session = ({session, entireMap, checked, onCheckChange, addLayer, changeMapView, removeSession, updateSessionName}) => {

    const compareMapToSession = (sessionLayers, entireMapLayers) =>  {
        //If map the same as session being loaded, only load annotations (if not already exists),the visibility 
        //and opacity according to session's layers. else, change zoom and extent and annotations (if not alread existing.)
        if (!sessionLayers || !Array.isArray(sessionLayers)) {
            return false;
        }
    
        if (!entireMapLayers || !Array.isArray(entireMapLayers)) {
            return false;
        }
    
        const sessionLayerIds = new Set(
            sessionLayers.map(layer => layer.id.split("__")[0])
        );
        const entireMapLayerIds = new Set(
            entireMapLayers.map(flat => flat.id.split("__")[0])
        );
        
        for (let id of sessionLayerIds) {
            if (!entireMapLayerIds.has(id)) {
                return false;
            }
        }
        
        return true;        
    }

    const[isEditingName, setIsEditingName] = useState(false);

    const extractAnnotation = (layers) => {
            if (!layers || !Array.isArray(layers)) {
                return [];
            }
        
            //const featureId = annotations.featureId.split(/[-_]/).slice(1).join("-");
        
            return layers.filter(layer => layer.id.startsWith("annotation"));     
    }

    const extractLayers = (layers, anno) => {
        if (!layers || !Array.isArray(layers)) {
            return [];
        }
    
        const annotations = extractAnnotation(layers);
        const annotationIds = new Set(annotations.map(layer => layer.id));
    
        return layers.filter(layer => !annotationIds.has(layer.id));
    }

    const loadLayers = (layers) => {
        if(layers.length < 1)   return;
        for(let i = 0; i< layers.length; i++){
            addLayer(layers[i]);
        }
    }

    //returns the object if exists, otherwise returns false
    const doesLayerExistOnCurrentMap = (layer, entireMapLayers) => {
        if (!layer || typeof layer.id === "undefined") return false;
        if (!entireMap || !Array.isArray(entireMapLayers)) return false;
    
        const layerIdTrimmed = layer.id.split("__")[0];
    
        return entireMapLayers.flat().find(existingLayer => 
            existingLayer.id.split("__")[0] === layerIdTrimmed
        ) || false;
    };

    const doesGroupExistsOnCurrentMap = (group, sessionGroups) => {
        if (!group || typeof group.id === "undefined") return false;
        if (!entireMap || !Array.isArray(sessionGroups)) return false;
    
        const layerIdTrimmed = group.id;
    
        return sessionGroups.flat().find(existingGroup => 
            existingGroup.id === layerIdTrimmed
        ) || false;
    };
    

    const ApplySessionToMap = () => {
        const sessionLayers = extractLayers(session.layers, session.annotations);
        const mapLayers = extractLayers(entireMap.layers.flat, entireMap.annotations);
        if(compareMapToSession(sessionLayers, mapLayers)){
        //If map is the same as session being loaded, only load annotations (if not already exists),the visibility and opacity according to session's layers.
        //else, change zoom and extent and annotations (if not alread existing.)

            //adjusts the opacity and visibility for common layers
            for (let i = 0; i < session.layers.length; i++) {
                const mapLayer = doesLayerExistOnCurrentMap(session.layers[i], entireMap.layers.flat);
                if (mapLayer) {
                    entireMap.layers.flat[i].opacity = session.layers[i].opacity || 1;
                    entireMap.layers.flat[i].visibility = session.layers[i].visibility;
                }
            }           
        }

        //activate/deactivate groups.
        if(entireMap.layers.groups.length >= 1)
        {
            for (let i = 0; i< entireMap.layers.groups[0].nodes.length  ; i++)
                {
                    const mapGroup = doesGroupExistsOnCurrentMap(entireMap.layers.groups[0].nodes[i], session.groups);
                    if(mapGroup)
                    {
                        entireMap.layers.groups[0].nodes[i].visibility = mapGroup.visibility;
                    }
                }
        }
        // adds all annotations that do not exist.
        const sessionAnnotations = extractAnnotation(session.layers);
        const annotationsToLoad = [];
        for (let i = 0; i < sessionAnnotations.length; i++) {
            if (!doesLayerExistOnCurrentMap(sessionAnnotations[i], entireMap.layers.flat)) {
                const { group, ...newObject } = sessionAnnotations[i];
                annotationsToLoad.push(newObject);
            }
        }
        loadLayers(annotationsToLoad);
        

        //enable groups. adjust groups visibility.

        changeMapView(session.center, session.zoom) 
    }


    const exportSelectedSession = () => {

        const json = JSON.stringify([session], null, 2); 
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = session.sessionName+".json";
        link.click();

        URL.revokeObjectURL(url);
    };

    const [newName, setNewName] = useState(session.sessionName);

    const handleRenameSubmit = (event) => {
        event.preventDefault();

        const action = event.nativeEvent.submitter.name;

        if (action === "ok") {
            updateSessionName(session.sessionName, newName)
        }

        setIsEditingName(!isEditingName);
    }

    return (
        <div class="sessionContainer">
                <input style={{marginLeft: "4px", display: isEditingName ? 'none' : 'inline-flex'}}
                    type="checkbox"
                    checked={checked}
                    onChange={onCheckChange}
                />
                <h1 class="title" style={{display: isEditingName ? 'none' : 'inline-flex'}}>{session.sessionName.replace("localstorageSession_","")}</h1>
                <div class="button-container" style={{display: isEditingName ? 'none' : 'inline-flex'}}>
                    <button className="icon-button" onClick = {() => {ApplySessionToMap()}}><span class="glyphicon glyphicon-saved"></span></button>
                    <button className="icon-button" onClick = {() => {setIsEditingName(!isEditingName)}}><span class="glyphicon glyphicon-edit"></span></button>
                    <button className="icon-button" onClick={() => {exportSelectedSession()}}><span class="glyphicon glyphicon-save"></span></button>
                    <button className="icon-button" onClick={()=> {removeSession(session)}}><span class="glyphicon glyphicon-remove"></span></button>
                </div>
            { isEditingName && (
                <form onSubmit={handleRenameSubmit} className="renameSessionForm" disabled={true}>
                    <input placeholder={session.sessionName} type="text" name="name" class="renameSession" onChange={(e) => {setNewName(e.target.value)}}/>
                    <button name="ok" type="submit" class="renameSessionOk">
                        <span class="glyphicon glyphicon-ok"></span>
                    </button>
                    <button name="cancel" type="submit" class="renameSessionOk">
                        <span class="glyphicon glyphicon-remove"></span>
                    </button>
                </form>
            )}
        </div>
    )
}

export default Session