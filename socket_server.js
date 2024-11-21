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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const turf = __importStar(require("@turf/turf"));
const path_1 = __importDefault(require("path"));
const jobAnalyzer_1 = require("./jobAnalyzer");
//require('dotenv').config()
// load .env
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = require("fs");
const exiftool_vendored_1 = require("exiftool-vendored");
function extractModelData(model) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const extractedData = {
        scenarios: [],
        ignitions: [],
        burnConditions: [],
        fuelTypes: []
    };
    // Extract scenario names and durations
    extractedData.scenarios = (_c = (_b = (_a = model.scenarios) === null || _a === void 0 ? void 0 : _a.scenarios) === null || _b === void 0 ? void 0 : _b.map((scenario) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const name = (_a = scenario === null || scenario === void 0 ? void 0 : scenario.name) !== null && _a !== void 0 ? _a : "Unknown Scenario";
        const comments = (_b = scenario === null || scenario === void 0 ? void 0 : scenario.comments) !== null && _b !== void 0 ? _b : "";
        const startTime = new Date((_e = (_d = (_c = scenario === null || scenario === void 0 ? void 0 : scenario.scenario) === null || _c === void 0 ? void 0 : _c.startTime) === null || _d === void 0 ? void 0 : _d.time) !== null && _e !== void 0 ? _e : "");
        const endTime = new Date((_h = (_g = (_f = scenario === null || scenario === void 0 ? void 0 : scenario.scenario) === null || _f === void 0 ? void 0 : _f.endTime) === null || _g === void 0 ? void 0 : _g.time) !== null && _h !== void 0 ? _h : "");
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24); // Duration in days
        return {
            name,
            comments,
            startTime: (_l = (_k = (_j = scenario === null || scenario === void 0 ? void 0 : scenario.scenario) === null || _j === void 0 ? void 0 : _j.startTime) === null || _k === void 0 ? void 0 : _k.time) !== null && _l !== void 0 ? _l : "N/A",
            endTime: (_p = (_o = (_m = scenario === null || scenario === void 0 ? void 0 : scenario.scenario) === null || _m === void 0 ? void 0 : _m.endTime) === null || _o === void 0 ? void 0 : _o.time) !== null && _p !== void 0 ? _p : "N/A",
            durationInDays: isNaN(duration) ? 0 : duration
        };
    })) !== null && _c !== void 0 ? _c : [];
    // Extract number and types of ignitions, with lat/long or polygon centroid
    extractedData.ignitions = (_f = (_e = (_d = model.ignitions) === null || _d === void 0 ? void 0 : _d.ignitions) === null || _e === void 0 ? void 0 : _e.map((ignition) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        const name = (_a = ignition === null || ignition === void 0 ? void 0 : ignition.name) !== null && _a !== void 0 ? _a : "Unnamed Ignition";
        const ignitionType = (_e = (_d = (_c = (_b = ignition === null || ignition === void 0 ? void 0 : ignition.ignition) === null || _b === void 0 ? void 0 : _b.ignitions) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.polyType) !== null && _e !== void 0 ? _e : "Unknown";
        let location = {
            type: "Point",
            coordinates: [0, 0]
        };
        if (ignitionType === 'POINT') {
            const point = (_l = (_k = (_j = (_h = (_g = (_f = ignition === null || ignition === void 0 ? void 0 : ignition.ignition) === null || _f === void 0 ? void 0 : _f.ignitions) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.polygon) === null || _j === void 0 ? void 0 : _j.polygon) === null || _k === void 0 ? void 0 : _k.points) === null || _l === void 0 ? void 0 : _l[0];
            location = {
                type: 'Point',
                coordinates: [(_o = (_m = point === null || point === void 0 ? void 0 : point.x) === null || _m === void 0 ? void 0 : _m.value) !== null && _o !== void 0 ? _o : 0, (_q = (_p = point === null || point === void 0 ? void 0 : point.y) === null || _p === void 0 ? void 0 : _p.value) !== null && _q !== void 0 ? _q : 0]
            };
        }
        else if (ignitionType === 'POLYGON') {
            const points = (_x = (_w = (_v = (_u = (_t = (_s = (_r = ignition === null || ignition === void 0 ? void 0 : ignition.ignition) === null || _r === void 0 ? void 0 : _r.ignitions) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.polygon) === null || _u === void 0 ? void 0 : _u.polygon) === null || _v === void 0 ? void 0 : _v.points) === null || _w === void 0 ? void 0 : _w.map((p) => {
                var _a, _b, _c, _d;
                return [
                    (_b = (_a = p === null || p === void 0 ? void 0 : p.x) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0,
                    (_d = (_c = p === null || p === void 0 ? void 0 : p.y) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0
                ];
            })) !== null && _x !== void 0 ? _x : [];
            const polygon = turf.polygon([points]);
            const centroid = turf.centroid(polygon);
            location = {
                type: 'Point',
                coordinates: centroid.geometry.coordinates
            };
        }
        return {
            name,
            type: ignitionType,
            location
        };
    })) !== null && _f !== void 0 ? _f : [];
    // Extract burn conditions and the dates they were applied
    extractedData.burnConditions = (_j = (_h = (_g = model.scenarios) === null || _g === void 0 ? void 0 : _g.scenarios) === null || _h === void 0 ? void 0 : _h.map((scenario) => {
        var _a, _b, _c, _d;
        const scenarioName = (_a = scenario === null || scenario === void 0 ? void 0 : scenario.name) !== null && _a !== void 0 ? _a : "Unnamed Scenario";
        const burnConditions = (_d = (_c = (_b = scenario === null || scenario === void 0 ? void 0 : scenario.temporalConditions) === null || _b === void 0 ? void 0 : _b.daily) === null || _c === void 0 ? void 0 : _c.map((condition) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return ({
                date: (_b = (_a = condition === null || condition === void 0 ? void 0 : condition.localStartTime) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : "N/A",
                minRh: (_d = (_c = condition === null || condition === void 0 ? void 0 : condition.minRh) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0,
                maxWs: (_f = (_e = condition === null || condition === void 0 ? void 0 : condition.maxWs) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : 0,
                minFwi: (_h = (_g = condition === null || condition === void 0 ? void 0 : condition.minFwi) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : 0,
                minIsi: (_k = (_j = condition === null || condition === void 0 ? void 0 : condition.minIsi) === null || _j === void 0 ? void 0 : _j.value) !== null && _k !== void 0 ? _k : 0
            });
        })) !== null && _d !== void 0 ? _d : [];
        return {
            scenarioName,
            burnConditions
        };
    })) !== null && _j !== void 0 ? _j : [];
    // Extract list of fuel types used
    extractedData.fuelTypes = (_m = (_l = (_k = model.fuelModels) === null || _k === void 0 ? void 0 : _k.fuelModels) === null || _l === void 0 ? void 0 : _l.map((fuelModel) => {
        var _a, _b;
        return ({
            name: (_a = fuelModel === null || fuelModel === void 0 ? void 0 : fuelModel.name) !== null && _a !== void 0 ? _a : "Unnamed Fuel",
            type: (_b = fuelModel === null || fuelModel === void 0 ? void 0 : fuelModel.default) !== null && _b !== void 0 ? _b : "Unknown"
        });
    })) !== null && _m !== void 0 ? _m : [];
    return extractedData;
}
function readGeoTiffMetadata(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const exiftool = new exiftool_vendored_1.ExifTool();
        try {
            const metadata = yield exiftool.read(filePath);
            //  console.log('Metadata:', metadata);
            const width = metadata.ImageWidth;
            const height = metadata.ImageHeight;
            const fileSize = metadata.FileSize;
            const compression = metadata.Compression;
            const modelTiePoint = metadata.ModelTiePoint;
            const pixelScale = metadata.PixelScale;
            const projection = metadata.GTCitation;
            const gdalMetadata = metadata.GDALMetadata;
            // console.log('Width:', width);
            // console.log('Height:', height);
            // console.log('Model Tie Point:', modelTiePoint);
            // console.log('Projection:', projection);
            // console.log('File Size:', fileSize);
            // console.log('Compression:', compression);
            // console.log('Pixel Scale:', pixelScale);
            // console.log('GDAL Metadata:', gdalMetadata);
            return {
                width,
                height,
                modelTiePoint,
                projection,
                fileSize,
                compression,
                pixelScale,
                gdalMetadata,
            };
        }
        catch (error) {
            console.error('Error reading metadata:', error);
            throw error;
        }
        finally {
            yield exiftool.end();
        }
    });
}
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.promises.access(filePath);
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
// async function readFileAsync(filePath: string): Promise<string> {
//     const fileContent = await fs.readFile(filePath, 'utf-8');
//     return fileContent;
// }
function getJobDirectories() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs_1.promises.readdir(WISE_RESULTS_PATH);
        const jobDirs = yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
            const fullPath = path_1.default.join(WISE_RESULTS_PATH, file);
            const stats = yield fs_1.promises.stat(fullPath);
            return stats.isDirectory() && file.startsWith("job_") ? file : null;
        })));
        // Filter out any null values
        return jobDirs.filter((dir) => dir !== null);
    });
}
const WISE_RESULTS_SOCKETS_WEB_PORT = process.env.WISE_RESULTS_SOCKETS_WEB_PORT;
const WISE_RESULTS_PATH = process.env.WISE_RESULTS_PATH;
const PORT = WISE_RESULTS_SOCKETS_WEB_PORT;
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer);
// Call the function where needed
// function readGeoTiffMetadata(filePath: string): Promise<any> {
//     return new Promise(async (resolve, reject) => {
//         // Read the file into a buffer
//         const fileBuffer = await fs.readFile(filePath);
//         // Convert the buffer to an ArrayBuffer and load it
//         const tiff = await fromArrayBuffer(fileBuffer.buffer);
//         const image: GeoTIFFImageType = await tiff.getImage();
//         const width = image.getWidth();
//         const height = image.getHeight();
//         const origin = image.getOrigin();
//         const resolution = image.getResolution();
//         const bbox = image.getBoundingBox();
//         console.log('Width:', width);
//         console.log('Height:', height);
//         console.log('Origin:', origin);
//         console.log('Resolution:', resolution);
//         console.log('Bounding Box:', bbox);
//         resolve({ width, height, origin, resolution, bbox });
//     });
// }
// Serve static files (HTML, JS) from a 'public' directory
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(express_1.default.static(path_1.default.join(__dirname, "sample_data")));
// Handle socket connection and events
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Client connected:", socket.id);
    // Emit data to the client (could be file content or server results)
    let resultsData = yield scanForResults();
    console.log("Results data being sent to the browser: ", resultsData);
    socket.emit("server_data", { message: "Welcome! Here is your data.", runs: resultsData });
    // Listen for client requests
    socket.on("request_update", () => __awaiter(void 0, void 0, void 0, function* () {
        // Send updated data (e.g., contents of a directory or file)
        let currentDateTimeString = new Date().toLocaleString();
        let resultsData = yield scanForResults();
        socket.emit("update_data", { data: resultsData, ts: currentDateTimeString });
    }));
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
}));
httpServer.listen(PORT, () => {
    console.clear();
    let currentDateTimeString = new Date().toLocaleString();
    console.log(currentDateTimeString + ":");
    console.log(`Server is running on http://localhost:${PORT}`);
});
function decipherStatus(parsedStatus) {
    const statusType = {
        0: "Submitted",
        1: "Started",
        2: "Scenario Started",
        3: "Scenario Completed",
        4: "Scenario Failed",
        5: "Complete",
        6: "Failed",
        7: "Error",
        8: "Information",
        9: "Shutdown Requested"
    };
    let foundCodes = [];
    let scenarioArray = [];
    let statusArray = parsedStatus.entries.map(entry => {
        const time = entry.status.time;
        const statusCode = entry.status.status;
        const data = entry.status.data;
        const statusText = statusType[statusCode] || "Unknown Status";
        foundCodes.push(statusCode);
        console.log('🔥 statusCode:', statusCode);
        if (statusCode === '2' || statusCode === 2) {
            console.log('👍 Scenario Found:', data);
            let scenarioName = data;
            scenarioArray.push(scenarioName);
        }
        return `${time} ${statusText} ${data}`;
    });
    return { foundCodes, statusArray, scenarioArray };
}
function getAllJobMetaData(jobDir) {
    return __awaiter(this, void 0, void 0, function* () {
        let jobPath = path_1.default.join(WISE_RESULTS_PATH, jobDir);
        // if there us a job.fgmj file, read it as JSON into an object
        let jobFgmjPath = path_1.default.join(jobPath, "job.fgmj");
        let jobFgmj = (yield fileExists(jobFgmjPath)) ? JSON.parse(yield fs_1.promises.readFile(jobFgmjPath, 'utf-8')) : null;
        let jobAnalysis = (jobFgmj !== null) ? yield (0, jobAnalyzer_1.extractModelDataFromJob)(jobFgmj) : null;
        // if there is status.json file, read it as JSON into an object
        let statusJsonPath = path_1.default.join(jobPath, "status.json");
        let statusJson = (yield fileExists(statusJsonPath)) ? JSON.parse(yield fs_1.promises.readFile(statusJsonPath, 'utf-8')) : null;
        // if there is validation.json file, read it as JSON into an object
        let validationJsonPath = path_1.default.join(jobPath, "validation.json");
        let validationJson = (yield fileExists(validationJsonPath)) ? JSON.parse(yield fs_1.promises.readFile(validationJsonPath, 'utf-8')) : null;
        // lets get some information about the job inputs. those files are found in the Inputs sub folder.
        // there should be a dataset.prj file.
        let datasetPrjPath = path_1.default.join(jobPath, "Inputs/dataset.prj");
        let datasetPrj = (yield fileExists(datasetPrjPath)) ? yield fs_1.promises.readFile(datasetPrjPath, 'utf-8') : null;
        // there should be an elevation.tif
        let elevationTifPath = path_1.default.join(jobPath, "Inputs/elevation.tif");
        let elevationTif = (yield fileExists(elevationTifPath)) ? yield readGeoTiffMetadata(elevationTifPath) : null;
        // there should be a fuels.tif
        let fuelsTifPath = path_1.default.join(jobPath, "Inputs/fuels.tif");
        let fuelsTif = (yield fileExists(fuelsTifPath)) ? yield readGeoTiffMetadata(fuelsTifPath) : null;
        // there should be a spotwx_forecast.txt
        let spotwxForecastPath = path_1.default.join(jobPath, "Inputs/spotwx_forecast.txt");
        let spotwxForecast = (yield fileExists(spotwxForecastPath)) ? yield fs_1.promises.readFile(spotwxForecastPath, 'utf-8') : null;
        // now we should collect the output data paths here too.
        // there should be a WorstCaseModelScenario.json
        let worstCaseModelScenarioJsonPath = path_1.default.join(jobPath, "Outputs/WorstCaseModelScenario.json");
        let worstCaseModelScenarioJson = (yield fileExists(worstCaseModelScenarioJsonPath)) ? worstCaseModelScenarioJsonPath : null;
        // there should be a WorstCaseModelScenario.kml
        let worstCaseModelScenarioKmlPath = path_1.default.join(jobPath, "Outputs/WorstCaseModelScenario.kml");
        let worstCaseModelScenarioKml = (yield fileExists(worstCaseModelScenarioKmlPath)) ? worstCaseModelScenarioKmlPath : null;
        // there should be a worstCaseSummary.txt this we will load as text
        let worstCaseSummaryTxtPath = path_1.default.join(jobPath, "Outputs/worstCaseSummary.txt");
        let worstCaseSummaryTxt = (yield fileExists(worstCaseSummaryTxtPath)) ? yield fs_1.promises.readFile(worstCaseSummaryTxtPath, 'utf-8') : null;
        // status
        let status = 'unknown';
        let statusMessage = [];
        let scenarios = [];
        let statusData;
        if (validationJson === null) {
            status = 'failed';
            statusMessage.push('Validation did not execute - no validation file');
        }
        else if (!validationJson.valid) {
            status = 'failed';
            statusMessage.push('Validation failed');
            statusMessage.push('load_warnings:' + validationJson.load_warnings);
        }
        else if (validationJson.valid) {
            statusMessage.push('Validation Passed');
        }
        // now lets process the status.json file
        if (statusJson === null) {
            status = 'failed';
            statusMessage.push('Status - no status file');
        }
        else {
            const { foundCodes, statusArray, scenarioArray } = decipherStatus(statusJson);
            statusMessage.push(...statusArray);
            scenarios.push(...scenarioArray);
            // lets check for fail codes in the foundCodes array, they are: 4, 6, 7 or 9
            if (foundCodes.includes(4) || foundCodes.includes(6) || foundCodes.includes(7) || foundCodes.includes(9)) {
                status = 'failed';
            }
            else if (foundCodes.includes(5)) {
                status = (status == 'unknown') ? 'complete' : status;
            }
            console.log("statusData: ", statusData);
        }
        // now we will deal with the fgmjfile
        const meaningfulData = (jobFgmj !== null) ? extractModelData(jobFgmj) : null;
        console.log(meaningfulData);
        return {
            jobDir: jobDir,
            jobFgmj: jobFgmj,
            statusJson: statusJson,
            validationJson: validationJson,
            datasetPrj: datasetPrj,
            elevationTif: elevationTif,
            fuelsTif: fuelsTif,
            spotwxForecast: spotwxForecast,
            worstCaseModelScenarioJson: worstCaseModelScenarioJson,
            worstCaseModelScenarioKml: worstCaseModelScenarioKml,
            worstCaseSummaryTxt: worstCaseSummaryTxt,
            status: status,
            statusMessage: statusMessage,
            statusData: statusData,
            scenarios: scenarios,
            meaningfulData: meaningfulData,
            jobAnalysis: jobAnalysis
        };
    });
}
function scanForResults() {
    return new Promise((resolve, reject) => {
        // we will scan the WISE_RESULTS_PATH folder for jobs with outputs.
        console.log("Scanning for results in: ", WISE_RESULTS_PATH);
        getJobDirectories()
            .then((jobDirs) => __awaiter(this, void 0, void 0, function* () {
            console.log('Job directories:', jobDirs);
            // Map job directories to metadata objects and wait for all promises to resolve
            let resultsData = yield Promise.all(jobDirs.map((jobDir) => __awaiter(this, void 0, void 0, function* () {
                let jobPath = path_1.default.join(WISE_RESULTS_PATH, jobDir);
                let metaDataObject = yield getAllJobMetaData(jobDir);
                console.log("Job metadata: ", metaDataObject);
                return metaDataObject;
            })));
            console.log("Results data: ", resultsData);
            resolve(resultsData);
        }))
            .catch(error => {
            console.error("Error fetching job directories:", error);
            reject(error);
        });
        // getJobDirectories()
        //     .then((jobDirs) => {
        //         console.log('Job directories:', jobDirs);
        //         // let jobDirs = files.filter((file) => {
        //         //     return fs.statSync(path.join(WISE_RESULTS_PATH, file)).isDirectory() && file.startsWith("job_");
        //         // });
        //         // for each job directory, check if it has the required files
        //         let resultsData = jobDirs.map(async (jobDir) => {
        //             let jobPath = path.join(WISE_RESULTS_PATH, jobDir);
        //             // let hasWorstCaseModelScenarioJson = await fileExists(path.join(jobPath, "Outputs/WorstCaseModelScenario.json"));
        //             // let hasWorstCaseModelScenarioKml = await fileExists(path.join(jobPath, "Outputs/WorstCaseModelScenario.kml"));
        //             // let hasWorstCaseSummaryTxt = await fileExists(path.join(jobPath, "Outputs/worstCaseSummary.txt"));
        //             let metaDataObject = await getAllJobMetaData(jobDir)
        //             console.log("Job metadata: ", metaDataObject);
        //             return metaDataObject;
        //         });
        //         console.log("Results data: ", resultsData);
        //         resolve(resultsData);
        //     })
        //     .catch((err) => {
        //         console.error("Error reading directory: ", err);
        //         reject(err);
        //     });
    });
}
