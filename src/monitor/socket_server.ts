import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import * as turf from '@turf/turf';
import path from "path";
import {extractModelDataFromJob} from "./jobAnalyzer";
//require('dotenv').config()
// load .env
import dotenv from 'dotenv';
dotenv.config();

import { promises as fs } from 'fs';

import { ExifTool, Tags } from 'exiftool-vendored';

interface ParsedStatus {
    // Define the properties of parsedStatus here
    status: string;
    code: number;
    // Add other properties as needed
}



interface ModelData {
    scenarios: Array<{
        name: string;
        comments: string;
        startTime: string;
        endTime: string;
        durationInDays: number;
    }>;
    ignitions: Array<{
        name: string;
        type: string;
        location: {
            type: 'Point' | 'Polygon';
            coordinates: [number, number] | [number, number][];
        };
    }>;
    burnConditions: Array<{
        scenarioName: string;
        burnConditions: Array<{
            date: string;
            minRh: number;
            maxWs: number;
            minFwi: number;
            minIsi: number;
        }>;
    }>;
    fuelTypes: Array<{
        name: string;
        type: string;
    }>;
}


function extractModelData(model: any): ModelData {
    const extractedData: ModelData = {
        scenarios: [],
        ignitions: [],
        burnConditions: [],
        fuelTypes: []
    };

    // Extract scenario names and durations
    extractedData.scenarios = model.scenarios?.scenarios?.map((scenario: any) => {
        const name = scenario?.name ?? "Unknown Scenario";
        const comments = scenario?.comments ?? "";
        const startTime = new Date(scenario?.scenario?.startTime?.time ?? "");
        const endTime = new Date(scenario?.scenario?.endTime?.time ?? "");
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24); // Duration in days

        return {
            name,
            comments,
            startTime: scenario?.scenario?.startTime?.time ?? "N/A",
            endTime: scenario?.scenario?.endTime?.time ?? "N/A",
            durationInDays: isNaN(duration) ? 0 : duration
        };
    }) ?? [];

    // Extract number and types of ignitions, with lat/long or polygon centroid
    extractedData.ignitions = model.ignitions?.ignitions?.map((ignition: any) => {
        const name = ignition?.name ?? "Unnamed Ignition";
        const ignitionType = ignition?.ignition?.ignitions?.[0]?.polyType ?? "Unknown";

        let location: { type: 'Point' | 'Polygon'; coordinates: [number, number] | [number, number][] } = {
            type: "Point",
            coordinates: [0, 0]
        };
        
        if (ignitionType === 'POINT') {
            const point = ignition?.ignition?.ignitions?.[0]?.polygon?.polygon?.points?.[0];
            location = {
                type: 'Point',
                coordinates: [point?.x?.value ?? 0, point?.y?.value ?? 0]
            };
        } else if (ignitionType === 'POLYGON') {
            const points = ignition?.ignition?.ignitions?.[0]?.polygon?.polygon?.points?.map((p: any) => [
                p?.x?.value ?? 0,
                p?.y?.value ?? 0
            ]) ?? [];
            const polygon = turf.polygon([points]);
            const centroid = turf.centroid(polygon);
            location = {
                type: 'Point',
                coordinates: centroid.geometry.coordinates as [number, number]
            };
        }

        return {
            name,
            type: ignitionType,
            location
        };
    }) ?? [];

    // Extract burn conditions and the dates they were applied
    extractedData.burnConditions = model.scenarios?.scenarios?.map((scenario: any) => {
        const scenarioName = scenario?.name ?? "Unnamed Scenario";
        const burnConditions = scenario?.temporalConditions?.daily?.map((condition: any) => ({
            date: condition?.localStartTime?.time ?? "N/A",
            minRh: condition?.minRh?.value ?? 0,
            maxWs: condition?.maxWs?.value ?? 0,
            minFwi: condition?.minFwi?.value ?? 0,
            minIsi: condition?.minIsi?.value ?? 0
        })) ?? [];

        return {
            scenarioName,
            burnConditions
        };
    }) ?? [];

    // Extract list of fuel types used
    extractedData.fuelTypes = model.fuelModels?.fuelModels?.map((fuelModel: any) => ({
        name: fuelModel?.name ?? "Unnamed Fuel",
        type: fuelModel?.default ?? "Unknown"
    })) ?? [];

    return extractedData;
}





interface GeoTiffTags extends Tags {
    ModelTiePoint?: number[];
    Projection?: string;
    Compression?: string;
    PixelScale?: string;
    GTCitation?: string;
    GDALMetadata?: string;
    // Add any other properties you need
}

async function readGeoTiffMetadata(filePath: string): Promise<any> {
    const exiftool = new ExifTool();
    try {
        const metadata = await exiftool.read<GeoTiffTags>(filePath);
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
    } catch (error) {
        console.error('Error reading metadata:', error);
        throw error;
    } finally {
        await exiftool.end();
    }
}







async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// async function readFileAsync(filePath: string): Promise<string> {
//     const fileContent = await fs.readFile(filePath, 'utf-8');
//     return fileContent;
// }

async function getJobDirectories(): Promise<string[]> {
    const files = await fs.readdir(WISE_RESULTS_PATH);

    const jobDirs = await Promise.all(
        files.map(async (file) => {
            const fullPath = path.join(WISE_RESULTS_PATH, file);
            const stats = await fs.stat(fullPath);
            return stats.isDirectory() && file.startsWith("job_") ? file : null;
        })
    );

    // Filter out any null values
    return jobDirs.filter((dir) => dir !== null) as string[];
}







const WISE_RESULTS_SOCKETS_WEB_PORT = process.env.WISE_RESULTS_SOCKETS_WEB_PORT
const WISE_RESULTS_PATH = process.env.WISE_EXTERNAL_DATA_FOLDER + "/" + process.env.WISE_PROJECT_JOBS_FOLDER
const PORT = WISE_RESULTS_SOCKETS_WEB_PORT;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
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
app.use(express.static(path.join(__dirname, "public")));
//app.use(express.static(path.join(__dirname, "sample_data")));
// Handle socket connection and events
io.on("connection", async (socket) => {
    console.log("Client connected:", socket.id);

    // Emit data to the client (could be file content or server results)
    let resultsData = await scanForResults()
    console.log("Results data being sent to the browser: ", resultsData);
    socket.emit("server_data", { message: "Welcome! Here is your data.", runs: resultsData });

    // Listen for client requests
    socket.on("request_update", async () => {
        // Send updated data (e.g., contents of a directory or file)
        let currentDateTimeString = new Date().toLocaleString();
        let resultsData = await scanForResults()
        socket.emit("update_data", { data: resultsData, ts: currentDateTimeString });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.clear();
    let currentDateTimeString = new Date().toLocaleString();
    console.log(currentDateTimeString + ":")
    console.log(`Server is running on http://localhost:${PORT}`);
});

// function decipherStatus(parsedStatus:any) {
//     const statusType = {
//       0: "Submitted",
//       1: "Started",
//       2: "Scenario Started",
//       3: "Scenario Completed",
//       4: "Scenario Failed",
//       5: "Complete",
//       6: "Failed",
//       7: "Error",
//       8: "Information",
//       9: "Shutdown Requested"
//     };
//     let foundCodes: number[] =  []
//     let scenarioArray: any[] = []
//     let statusArray = parsedStatus.entries.map((entry:any) => {
//       const time = entry.status.time;
//       const statusCode = entry.status.status;
//       const data = entry.status.data;
//       const statusText = statusType[statusCode] || "Unknown Status";
//       foundCodes.push(statusCode)
//       console.log('🔥 statusCode:', statusCode);
//       if (statusCode === '2' || statusCode === 2) {
//         console.log('👍 Scenario Found:', data);
//         let scenarioName = data;
//         scenarioArray.push(scenarioName);
//       }
//       return `${time} ${statusText} ${data}`;

//     });

//     return {foundCodes, statusArray, scenarioArray}
//   }
function decipherStatus(parsedStatus: any) {
    const statusType: { [key: number]: string } = {
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

    let foundCodes: number[] = [];
    let scenarioArray: any[] = [];
    let statusArray = parsedStatus.entries.map((entry: any) => {
        const time = entry.status.time;
        const statusCode: keyof typeof statusType = entry.status.status;
        const data = entry.status.data;
        const statusText = statusType[statusCode] || "Unknown Status";
        foundCodes.push(statusCode);
        console.log('🔥 statusCode:', statusCode);
        if (statusCode === 2) {
            console.log('👍 Scenario Found:', data);
            let scenarioName = data;
            scenarioArray.push(scenarioName);
        }
        return `${time} ${statusText} ${data}`;
    });

    return { foundCodes, statusArray, scenarioArray };
}

async function getAllJobMetaData(jobDir:string) {
    let jobPath = path.join(WISE_RESULTS_PATH, jobDir);
    // if there us a job.fgmj file, read it as JSON into an object
    let jobFgmjPath = path.join(jobPath, "job.fgmj");
    let jobFgmj = await fileExists(jobFgmjPath) ? JSON.parse(await fs.readFile(jobFgmjPath, 'utf-8')) : null;
    
    let jobAnalysis = (jobFgmj !== null) ? await extractModelDataFromJob(jobFgmj): null;
    
    
    // if there is status.json file, read it as JSON into an object
    let statusJsonPath = path.join(jobPath, "status.json");
    let statusJson = await fileExists(statusJsonPath) ? JSON.parse(await fs.readFile(statusJsonPath, 'utf-8')) : null;
    // if there is validation.json file, read it as JSON into an object
    let validationJsonPath = path.join(jobPath, "validation.json");
    let validationJson = await fileExists(validationJsonPath) ? JSON.parse(await fs.readFile(validationJsonPath, 'utf-8')) : null;
    // lets get some information about the job inputs. those files are found in the Inputs sub folder.
    // there should be a dataset.prj file.
    let datasetPrjPath = path.join(jobPath, "Inputs/dataset.prj");
    let datasetPrj = await fileExists(datasetPrjPath) ? await fs.readFile(datasetPrjPath, 'utf-8') : null;
    // there should be an elevation.tif
    let elevationTifPath = path.join(jobPath, "Inputs/elevation.tif");
    let elevationTif = await fileExists(elevationTifPath) ? await readGeoTiffMetadata(elevationTifPath) : null;
    // there should be a fuels.tif
    let fuelsTifPath = path.join(jobPath, "Inputs/fuels.tif");
    let fuelsTif = await fileExists(fuelsTifPath) ? await readGeoTiffMetadata(fuelsTifPath) : null;
    // there should be a spotwx_forecast.txt
    let spotwxForecastPath = path.join(jobPath, "Inputs/spotwx_forecast.txt");
    let spotwxForecast = await fileExists(spotwxForecastPath) ? await fs.readFile(spotwxForecastPath, 'utf-8') : null;

    // now we should collect the output data paths here too.
    // there should be a WorstCaseModelScenario.json
    let worstCaseModelScenarioJsonPath = path.join(jobPath, "Outputs/WorstCaseModelScenario.json");
    let worstCaseModelScenarioJson = await fileExists(worstCaseModelScenarioJsonPath) ? worstCaseModelScenarioJsonPath : null;

    // there should be a WorstCaseModelScenario.kml
    let worstCaseModelScenarioKmlPath = path.join(jobPath, "Outputs/WorstCaseModelScenario.kml");
    let worstCaseModelScenarioKml = await fileExists(worstCaseModelScenarioKmlPath) ? worstCaseModelScenarioKmlPath : null;

    // there should be a worstCaseSummary.txt this we will load as text
    let worstCaseSummaryTxtPath = path.join(jobPath, "Outputs/worstCaseSummary.txt");
    let worstCaseSummaryTxt = await fileExists(worstCaseSummaryTxtPath) ? await fs.readFile(worstCaseSummaryTxtPath, 'utf-8') : null;


   // status
   let status = 'unknown';
   let statusMessage:string[] = [];
   let scenarios:any[] = [];
   let statusData
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
       
            status = (status == 'unknown')? 'complete': status;
        }



        console.log("statusData: ", statusData);
    }   




    // now we will deal with the fgmjfile

    
    const meaningfulData = (jobFgmj !== null ) ? extractModelData(jobFgmj): null;
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


}

function scanForResults() {
    return new Promise((resolve, reject) => {


        // we will scan the WISE_RESULTS_PATH folder for jobs with outputs.
        console.log("Scanning for results in: ", WISE_RESULTS_PATH);

        getJobDirectories()
        .then(async (jobDirs) => {
          console.log('Job directories:', jobDirs);
      
          // Map job directories to metadata objects and wait for all promises to resolve
          let resultsData = await Promise.all(jobDirs.map(async (jobDir) => {
            let jobPath = path.join(WISE_RESULTS_PATH, jobDir);
            let metaDataObject = await getAllJobMetaData(jobDir);
            console.log("Job metadata: ", metaDataObject);
            return metaDataObject;
          }));
      
          console.log("Results data: ", resultsData);
          resolve(resultsData);
        })
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