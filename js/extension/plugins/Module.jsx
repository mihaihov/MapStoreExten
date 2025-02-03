import {connect} from "react-redux";
import { name } from "../../../config";
import SaveSessionToLocalStorageExtension from "../components/Component"
import '../assets/style.css'
import {changeMapView, changeZoomLevel } from "@mapstore/actions/map";
import { addLayer, clearLayers } from "@mapstore/actions/layers";




export default {
    name: name,
    component: connect(state => ({
        currentSession :{
            layers: state.layers.flat,
            annotations: state.annotations,
            projection: state.mapInitialConfig.projection,
            zoom: state.mapInitialConfig.zoom,
            maxExtent: state.mapInitialConfig.maxExtent,
            center: state.mapInitialConfig.center
        }, entireMap: state,
        dialogueState: state.toggleDialogue.dialogueState
    }), {
        changeZoomLevel, addLayer, clearLayers,changeMapView
    })(SaveSessionToLocalStorageExtension),
    reducers: {
        toggleDialogue : (state = {dialogueState: false}, action) => {
            if(action.type === 'TOGGLE_DIALOGUE')
            {
                return {dialogueState : !state.dialogueState}
            }
            else return state
        },
        applySession: (state = {}, action) => {
            if(action.type === 'APPLY_SESSION')
            {
                
            }
            return state;
        }
    },
    containers: {
        Toolbar: {
            name: "SaveSessionToLocalStorageExtension",
            position: 10,
            text: "ABC",
            doNotHide: true,
            action: () => {
                return {
                    type: 'TOGGLE_DIALOGUE',
                }
            },
            priority: 1
        }
    }
};


