import dotenv from 'dotenv';
import { exec, spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as turf from '@turf/turf';
import { Point, Feature } from 'geojson';

import * as luxon from 'luxon';
import * as modeller from 'wise_js_api';
// import fetch from 'node-fetch';
import readWxService from './read_weather_file';

// Load environment variables
dotenv.config();

const DEBUG: boolean = process.env.DEBUG === 'true';

// Type definitions
type TimezoneObject = {
    luxon: string;
    wise: number;
    name: string;
};

type DatasetPath = {
    path: string;
    bbox: string;
    lut: string;
    prj: string;
    elevation: string;
    fuels: string;
};

type WeatherRecord = {
    temp: string;
    rh: string;
    wd: string;
    ws: string;
    precip: string;
    localDate: string;
    localHour: string;
};

type Weather = {
    firstDateLocal: string;
    lastDateLocal: string;
    records: WeatherRecord[];
};

type CFFDRS = {
    cffdrs: {
        ffmc: number | null;
        dmc: number | null;
        dc: number | null;
        rn24?: number;
    };
};

interface EasyPublicModelResult {
    model: any;
    inputs: {
        fireID: string;
        lat: number;
        lon: number;
        fireGeom: any;
        datasetPath: DatasetPath;
        weather: Weather;
        cffdrs: CFFDRS;
    };
}

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

if (DEBUG) console.log('serverConfig', serverConfig);

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
const getCentroidFromGeom = (polygon: any): Feature<Point> => {
    return turf.centroid(polygon);
};

// Function to get elevation by latitude and longitude
const getElevationByLatLon = async (latitude: number, longitude: number): Promise<number> => {
    const elevationUrl = `http://geogratis.gc.ca/services/elevation/cdem/altitude?lat=${latitude}&lon=${longitude}`;
    try {
        const response = await fetch(elevationUrl, {
            method: 'GET',
            headers: { 'user-agent': 'vscode-restclient' },
        });
        const data = await response.json();
        return data.altitude;
    } catch (err) {
        console.error('Error fetching elevation:', err);
        throw err;
    }
};

// Function to build the fire model
const fireModel = async (
    timezoneObject: TimezoneObject,
    fireID: string,
    lat: number,
    lon: number,
    ele: number,
    fireGeom: any,
    modelDataset: DatasetPath,
    weather: Weather,
    cffdrs: CFFDRS,
    jobInfo: string
): Promise<any> => {
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
const easyPublicModel = async (liveFire: any, jobInfo: string): Promise<EasyPublicModelResult> => {
    checkConstants();

    const fireID = liveFire.properties.datasetName;
    const datasetPath: DatasetPath = {
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

    const weather = await readWxService.readWxByFireID(fireID, lat, lon);

    const model = await fireModel(timezoneObject, fireID, lat, lon, ele, fireGeom, datasetPath, weather, cffdrsObject, jobInfo);

    return {
        model,
        inputs: { fireID, lat, lon, fireGeom, datasetPath, weather, cffdrs: cffdrsObject },
    };
};

// Export the model function
export default { easyPublicModel };