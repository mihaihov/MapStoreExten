import React from 'react'
import './Component.css'

const Session = ({session, entireMap, checked, onCheckChange, addLayer, changeMapView, removeSession}) => {

    const compareMapToSession = (sessionLayers, entireMapLayers) =>  {
        console.log("sessions");
        console.log(session);
        //If map the same as session being loaded, only load annotations (if not already exists),the visibility and opacity according to session's layers.
        //else, change zoom and extent and annotations (if not alread existing.)
        console.log("INSIDE PARENT");
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

    const extractAnnotation = (layers, annotations) => {
            if (!layers || !Array.isArray(layers) || !annotations?.featureId) {
                return [];
            }
        
            const featureId = annotations.featureId.split(/[-_]/).slice(1).join("-");
        
            return layers.filter(layer => layer.id.endsWith(featureId) && layer.id.startsWith("annotation"));     
    }

    const extractLayers = (layers, anno) => {
        if (!layers || !Array.isArray(layers)) {
            return [];
        }
    
        const annotations = extractAnnotation(layers, anno);
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
    

    const isAnnotation = (layer) => {
        return typeof layer?.id === "string" && layer.id.startsWith("annotation:");
    }

    const ApplySessionToMap = () => {
        console.log(entireMap);
        console.log(session);
        if(compareMapToSession(extractLayers(session.layers, session.annotations), extractLayers(entireMap.layers.flat, entireMap.annotations))){
        //If map the same as session being loaded, only load annotations (if not already exists),the visibility and opacity according to session's layers.
        //else, change zoom and extent and annotations (if not alread existing.)

            //adjusts the opacity and visibility for common layers
            for (let i = 0; i < session.layers.length; i++) {
                const mapLayer = doesLayerExistOnCurrentMap(session.layers[i], entireMap.layers.flat);
                if (mapLayer) {
                    entireMap.layers.flat[i].opacity = session.layers[i].opacity || 1;
                    entireMap.layers.flat[i].visibility = session.layers[i].visibility;
                }
            }
            console.log(entireMap.layers.flat);
            console.log(session.layers);

            // adds all annotations that do not exist.
            const sessionAnnotations = extractAnnotation(session.layers, session.annotations);
            const annotationsToLoad = [];
            for (let i = 0; i < sessionAnnotations.length; i++) {
                if (!doesLayerExistOnCurrentMap(sessionAnnotations[i], entireMap.layers.flat)) {
                    annotationsToLoad.push(sessionAnnotations[i]);
                }
            }
            loadLayers(annotationsToLoad);
            changeMapView(session.center, session.zoom)
            console.log(entireMap.layers.flat);
            
        }
        else
        {
            // map and the current session are not the same.
            // change the extemt and zoom. 
            // add annotation if not already existing (based on annotation id)
            const sessionAnnotations = extractAnnotation(session.layers, session.annotations);
            const annotationsToLoad = [];
            for(let i = 0; i<sessionAnnotations.length;i++)
            {
                if(!doesLayerExistOnCurrentMap(sessionAnnotations[i], entireMap.layers.flat[i])) {
                    annotationsToLoad.push(sessionAnnotations[i])
                }
            }
            loadLayers(annotationsToLoad);
            changeMapView(session.center, session.zoom)

        }
    }


    const exportSelectedSession = () => {

        const json = JSON.stringify(session, null, 2); 
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = session.sessionName+".json";
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div class="sessionContainer">
            <input
                type="checkbox"
                checked={checked}
                onChange={onCheckChange}
                style = {{marginLeft: "4px"}}
            />
            <h1 class="title">{session.sessionName.replace("localstorageSession_","")}</h1>
            <div class="button-container">
                <button className="icon-button" onClick = {() => {ApplySessionToMap()}}><span class="glyphicon glyphicon-saved"></span></button>
                <button className="icon-button" onClick = {() => {setIsEditingName(!isEditingName)}}><span class="glyphicon glyphicon-edit"></span></button>

                <button className="icon-button" onClick={() => {exportSelectedSession()}}><span class="glyphicon glyphicon-save"></span></button>
                <button className="icon-button" onClick={()=> {removeSession(session)}}><span class="glyphicon glyphicon-remove"></span></button>
            </div>
        </div>
    )
}

export default Session