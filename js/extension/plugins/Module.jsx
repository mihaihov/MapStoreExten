import {connect, useDispatch} from "react-redux";
import { createPlugin } from "@mapstore/utils/PluginsUtils";
import { name } from "../../../config";
import ExtensionComponent from "../components/Component"
import '../assets/style.css'
import { getStore } from "@mapstore/utils/StateUtils";
import { dispatchAction } from "@mapstore/actions/notifications";
import { changeMapLimits, changeMapView, changeZoomLevel, panTo, zoomToExtent } from "@mapstore/actions/map";
import { setLayers } from "@mapstore/actions/mapimport";
import { addLayer, clearLayers } from "@mapstore/actions/layers";
import { updateSettingsParams } from "@mapstore/actions/layers";




export default createPlugin (name, {
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
    })(ExtensionComponent),
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
            name: "sampleExtension",
            position: 10,
            text: "INC",
            doNotHide: true,
            action: () => {
                return {
                    type: 'TOGGLE_DIALOGUE',
                }
            },
            priority: 1
        }
    }
});


