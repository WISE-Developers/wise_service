"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = exports.abstract = void 0;
const modeller = __importStar(require("wise_js_api"));
const luxon = __importStar(require("luxon"));
const abstract = {
    name: '3 Day Model',
    filename: '3day_model',
    description: 'This is a 3 day model run, using a single ignition geometry and a single weather stream at the ignitioin location.',
    inputs: ['ignition', 'weather', 'modelStart', 'fireName']
};
exports.abstract = abstract;
const threeDayModel = async (timezoneObject, fireID, lat, lon, ele, fireGeom, modelDataset, weather, cffdrs, jobInfo) => {
    console.log('Executing the public model:', { fireID, lat, lon, ele, fireGeom, modelDataset, weather, cffdrs, jobInfo });
    // Set timezone
    luxon.Settings.defaultZone = timezoneObject.luxon;
    // Initialize WISE model
    const prom = new modeller.wise.WISE();
    // Configure model inputs
    prom.setProjectionFile(modelDataset.path + modelDataset.prj);
    prom.setElevationFile(modelDataset.path + modelDataset.elevation);
    prom.setFuelmapFile(modelDataset.path + modelDataset.fuels);
    prom.setLutFile(modelDataset.path + modelDataset.lut);
    prom.setTimezoneByValue(timezoneObject.wise);
    // Add weather data and additional configurations...
    // Check and return the model
    if (!prom.isValid()) {
        throw new Error('Model is not valid');
    }
    return prom;
};
exports.model = threeDayModel;
