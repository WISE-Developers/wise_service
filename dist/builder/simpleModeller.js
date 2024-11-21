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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs-extra"));
const turf = __importStar(require("@turf/turf"));
const luxon = __importStar(require("luxon"));
const modeller = __importStar(require("wise_js_api"));
// import fetch from 'node-fetch';
const read_weather_file_1 = __importDefault(require("./read_weather_file"));
// Load environment variables
dotenv_1.default.config();
const DEBUG = process.env.DEBUG === 'true';
// Environment variable setup
const DISPLAY_INTERVAL = process.env.PERIMETER_DISPLAY_INTERVAL_HOURS || '6';
const BUILDER_HOST = process.env.WISE_BUILDER_HOST || '';
const BUILDER_PORT = Number(process.env.WISE_BUILDER_PORT) || 0;
const PROJECT_JOBS_FOLDER = process.env.WISE_PROJECT_JOBS_FOLDER || '';
const CONTAINER_WISE_BIN_PATH = process.env.CONTAINER_WISE_BIN_PATH || '';
const CONTAINER_DATASET_PATH = process.env.CONTAINER_DATASET_PATH || '';
const CONTAINER_DATASET_BBOXFILE = process.env.CONTAINER_DATASET_BBOXFILE || '';
const CONTAINER_DATASET_LUTFILE = process.env.CONTAINER_DATASET_LUTFILE || '';
const CONTAINER_DATASET_PROJFILE = process.env.CONTAINER_DATASET_PROJFILE || '';
const CONTAINER_DATASET_ELEVATION_RASTER = process.env.CONTAINER_DATASET_ELEVATION_RASTER || '';
const CONTAINER_DATASET_FUEL_RASTER = process.env.CONTAINER_DATASET_FUEL_RASTER || '';
// Initialize server configuration
const serverConfig = new modeller.defaults.ServerConfiguration();
serverConfig.mqttAddress = process.env.WISE_BUILDER_MQTT_HOST || '';
serverConfig.mqttPort = Number(process.env.WISE_BUILDER_MQTT_PORT) || 0;
serverConfig.mqttTopic = process.env.WISE_BUILDER_MQTT_TOPIC || '';
serverConfig.mqttUsername = process.env.WISE_BUILDER_MQTT_USER || '';
serverConfig.mqttPassword = process.env.WISE_BUILDER_MQTT_PASS || '';
if (DEBUG)
    console.log('serverConfig', serverConfig);
// Ensure all constants are defined
function checkConstants() {
    const constants = [
        'DISPLAY_INTERVAL',
        'BUILDER_HOST',
        'BUILDER_PORT',
        'PROJECT_JOBS_FOLDER',
        'CONTAINER_WISE_BIN_PATH',
        'CONTAINER_DATASET_PATH',
        'CONTAINER_DATASET_BBOXFILE',
        'CONTAINER_DATASET_LUTFILE',
        'CONTAINER_DATASET_PROJFILE',
        'CONTAINER_DATASET_ELEVATION_RASTER',
        'CONTAINER_DATASET_FUEL_RASTER',
    ];
    for (const constant of constants) {
        if (!process.env[constant]) {
            console.error(`ERROR: Missing Constant!!!!! ${constant} is not set!`);
            process.exit(1);
        }
    }
}
// Function to get centroid from geometry
const getCentroidFromGeom = (polygon) => {
    return turf.centroid(polygon);
};
// Function to get elevation by latitude and longitude
const getElevationByLatLon = async (latitude, longitude) => {
    const elevationUrl = `http://geogratis.gc.ca/services/elevation/cdem/altitude?lat=${latitude}&lon=${longitude}`;
    try {
        const response = await fetch(elevationUrl, {
            method: 'GET',
            headers: { 'user-agent': 'vscode-restclient' },
        });
        const data = await response.json();
        return data.altitude;
    }
    catch (err) {
        console.error('Error fetching elevation:', err);
        throw err;
    }
};
// Function to build the fire model
const fireModel = async (timezoneObject, fireID, lat, lon, ele, fireGeom, modelDataset, weather, cffdrs, jobInfo) => {
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
// Main function to run the easy public model
const easyPublicModel = async (liveFire, jobInfo) => {
    checkConstants();
    const fireID = liveFire.properties.datasetName;
    const datasetPath = {
        path: `${CONTAINER_DATASET_PATH}/${fireID}/`,
        bbox: CONTAINER_DATASET_BBOXFILE,
        lut: CONTAINER_DATASET_LUTFILE,
        prj: CONTAINER_DATASET_PROJFILE,
        elevation: CONTAINER_DATASET_ELEVATION_RASTER,
        fuels: CONTAINER_DATASET_FUEL_RASTER,
    };
    const ignitionObject = turf.feature(await fs.readJSON(datasetPath.path + 'fire.json'));
    const timezoneObject = await fs.readJSON(datasetPath.path + 'timezone.json');
    const cffdrsObject = await fs.readJSON(datasetPath.path + 'cffdrs.json');
    const fireGeom = ignitionObject.geometry;
    const centroid = getCentroidFromGeom(fireGeom);
    const lat = centroid.geometry.coordinates[1];
    const lon = centroid.geometry.coordinates[0];
    const ele = await getElevationByLatLon(lat, lon);
    const weather = await read_weather_file_1.default.readWxByFireID(fireID, lat, lon);
    const model = await fireModel(timezoneObject, fireID, lat, lon, ele, fireGeom, datasetPath, weather, cffdrsObject, jobInfo);
    return {
        model,
        inputs: { fireID, lat, lon, fireGeom, datasetPath, weather, cffdrs: cffdrsObject },
    };
};
// Export the model function
exports.default = { easyPublicModel };
