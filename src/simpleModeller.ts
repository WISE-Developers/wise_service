
/**
 * An example that creates job.fgmj in the jobs folder via WISE Builder.
 */
Object.defineProperty(exports, "__esModule", {
    value: true,
});

const { exec } = require("child_process");
const turf = require('@turf/turf')
const readWxService = require('./read_weather_file.js')
const fs = require("fs-extra");
const path = require("path");
const luxon = require("luxon");
import { spawn } from 'child_process';
require('dotenv').config()

const DEBUG = process.env.DEBUG || false

// create a type definition for timezoneObject
type timezoneObject = {
    luxon: string,
    wise: number,
    name: string
}

/* setup dynamic variables for access these are mapped from ENV vars to constants in code*/

const DISPLAY_INTERVAL = process.env.PERIMETER_DISPLAY_INTERVAL_HOURS
const BUILDER_HOST = process.env.WISE_BUILDER_HOST
const BUILDER_PORT = Number(process.env.WISE_BUILDER_PORT)

const PROJECT_JOBS_FOLDER = process.env.WISE_PROJECT_JOBS_FOLDER
const PROJECT_RAIN_FOLDER = process.env.WISE_INTERNAL_RAIN_FOLDER
const CONTAINER_WISE_BIN_PATH = process.env.CONTAINER_WISE_BIN_PATH

console.log({ PROJECT_JOBS_FOLDER, PROJECT_RAIN_FOLDER, CONTAINER_WISE_BIN_PATH });
/* set up MQTT */

const MQTT_HOST = process.env.WISE_BUILDER_MQTT_HOST
const MQTT_PORT = process.env.WISE_BUILDER_MQTT_PORT
const MQTT_NAMESPACE = process.env.WISE_BUILDER_MQTT_TOPIC


/* define the dataset */
const CONTAINER_DATASET_PATH = process.env.CONTAINER_DATASET_PATH
const CONTAINER_DATASET_BBOXFILE = process.env.CONTAINER_DATASET_BBOXFILE
const CONTAINER_DATASET_LUTFILE = process.env.CONTAINER_DATASET_LUTFILE
const CONTAINER_DATASET_PROJFILE = process.env.CONTAINER_DATASET_PROJFILE
const CONTAINER_DATASET_ELEVATION_RASTER = process.env.CONTAINER_DATASET_ELEVATION_RASTER
const CONTAINER_DATASET_FUEL_RASTER = process.env.CONTAINER_DATASET_FUEL_RASTER


const rainFolder = PROJECT_RAIN_FOLDER;

var remotejobsFolder = PROJECT_JOBS_FOLDER;

// check all these constants and make sure they are set!
function checkConstants() {
    const constants = [
        'DISPLAY_INTERVAL', 'BUILDER_HOST',
        'BUILDER_PORT', 'PROJECT_JOBS_FOLDER', 'PROJECT_RAIN_FOLDER',
        'CONTAINER_WISE_BIN_PATH', 'MQTT_HOST', MQTT_PORT,
        'MQTT_NAMESPACE', 'MQTT_USERNAME', 'MQTT_PASSWD',
        'CONTAINER_DATASET_PATH', 'CONTAINER_DATASET_BBOXFILE',
        'CONTAINER_DATASET_LUTFILE', 'CONTAINER_DATASET_PROJFILE',
        'CONTAINER_DATASET_ELEVATION_RASTER',
        'CONTAINER_DATASET_FUEL_RASTER', 'rainFolder',
        'remotejobsFolder'
    ];

    for (const constant of constants) {
        if (!process.env[constant]) {
            console.error(`ERROR: Missing Constant!!!!! ${constant} is not set!`);
            process.exit(1);
        }
        else {
            console.log(`INFO: ${constant} is set to ${process.env[constant]}`);
        }
    }
}
async function setSummaryOptions(summary) {
    summary.outputs.outputApplication = true;
    summary.outputs.outputFBP = true;
    summary.outputs.outputFBPPatches = true;
    summary.outputs.outputGeoData = true;
    summary.outputs.outputIgnitions = true;
    summary.outputs.outputInputs = true;
    summary.outputs.outputLandscape = true;
    summary.outputs.outputScenario = true;
    summary.outputs.outputScenarioComments = true;
    summary.outputs.outputWxPatches = true;
    summary.outputs.outputWxStreams = true;
    summary.outputs.outputAssetInfo = true;
    summary.outputs.outputWxData = true;

    return
}


import * as modeller from "wise_js_api";
let serverConfig = new modeller.defaults.ServerConfiguration();


serverConfig.mqttAddress = process.env.WISE_BUILDER_MQTT_HOST
serverConfig.mqttPort = Number(process.env.WISE_BUILDER_MQTT_PORT)
serverConfig.mqttTopic = process.env.WISE_BUILDER_MQTT_TOPIC
serverConfig.mqttUsername = process.env.WISE_BUILDER_MQTT_USER
serverConfig.mqttPassword = process.env.WISE_BUILDER_MQTT_PASS





if (DEBUG) console.log("serverConfig", serverConfig);
if (DEBUG) console.log({ BUILDER_HOST, BUILDER_PORT });
//initialize the connection settings for WISE_Builder
modeller.globals.SocketHelper.initialize(BUILDER_HOST, BUILDER_PORT);
var jDefaults
async function setSomeDefaults() {
    //fetch the default settings for some parameters from WISE Builder
    await modeller.globals.WISELogger.getInstance().info("Grabbing the jDefaults.");
    jDefaults = await new modeller.defaults.JobDefaults().getDefaultsPromise();
    await modeller.globals.WISELogger.getInstance().info("We have the jDefaults.");
    // console.log(jDefaults);

    let zoneCache = await modeller.globals.Timezone.getTimezoneNameListPromise();
    for (const zone of zoneCache) {
        console.log(zone.name + " has a reference Id of " + zone.value);
    }
    return jDefaults
}
setSomeDefaults();



//turn on debug messages
modeller.globals.WISELogger.getInstance().setLogLevel(
    modeller.globals.WISELogLevel.VERBOSE //  1 
    // modeller.globals.WISELogLevel.DEBUG // 2
    // modeller.globals.WISELogLevel.INFO // 3
    // modeller.globals.WISELogLevel.WARN // 4
    // modeller.globals.WISELogLevel.NONE // 5

);


const wiseExec = CONTAINER_WISE_BIN_PATH
//set the default MQTT broker to use when listening for WISE events
modeller.client.JobManager.setDefaults({
    host: MQTT_HOST,
    port: Number(MQTT_PORT),
    topic: MQTT_NAMESPACE
});
// a function to shell out, execute a command and return the stdout or error

const shellOut = (cmd) => {
    return new Promise((resolve, reject) => {
        console.log("shellOut", cmd);
        modeller.globals.WISELogger.getInstance().info(`shellOut: ${cmd}`);
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                modeller.globals.WISELogger.getInstance().error(`error: ${error.message}`);
                reject(error)
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                modeller.globals.WISELogger.getInstance().error(`stderr: ${stderr}`);
                reject(stderr)
            }
            console.log(`stdout: ${stdout}`, stdout);
            modeller.globals.WISELogger.getInstance().info(`stdout: ${stdout}`);
            resolve(stdout)
        });
    })
}

const fireModel = (timeZoneObj: timezoneObject, fireID: string, lat: any, lon: any, ele: any, fireGeom: any, modelDataset: any, weather: any, cffdrs: any, jobInfo, ...args) => {
    console.log(`Executing the public model on fire ${fireID}`, args);
    //  console.log('modelDataset',modelDataset);
    luxon.Settings.defaultZoneName = timeZoneObj.luxon
    const remotejobsFolder = process.env.remotejobsFolder
    return new Promise(async (resolve, reject) => {

        var scenarioStartString = await weather.firstDateLocal.split(" ")[0] + "T13:00:00"


        var scenarioEndString =         await luxon.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00").plus({ hours: 72 }).toISODate() + "T13:00:00"
        var scenarioThreeDayEndString = await luxon.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00").plus({ hours: 72 }).toISODate() + "T13:00:00"
        await modeller.globals.WISELogger.getInstance().info("WorstStart: " + scenarioStartString);
        await modeller.globals.WISELogger.getInstance().info("WortEnd: " + scenarioEndString);
        await modeller.globals.WISELogger.getInstance().info("3dayStart: " + scenarioStartString);
        await modeller.globals.WISELogger.getInstance().info("3dayEnd: " + scenarioThreeDayEndString);
        var bcStartDate = await weather.firstDateLocal.split(" ")[0]
        var bcDay1Date = await luxon.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00").plus({ hours: 24 }).toISODate()
        var bcDay2Date = await luxon.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00").plus({ hours: 48 }).toISODate()
        var bcDay3Date = await luxon.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00").plus({ hours: 72 }).toISODate()   
        var bcDay4Date = await luxon.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00").plus({ hours: 96 }).toISODate()


        await modeller.globals.WISELogger.getInstance().info("BurningConditionsStart: " + bcStartDate);
        await modeller.globals.WISELogger.getInstance().info("BurningConditionsDay1: " + bcDay1Date);
        await modeller.globals.WISELogger.getInstance().info("BurningConditionsDay2: " + bcDay2Date);
        await modeller.globals.WISELogger.getInstance().info("BurningConditionsDay3: " + bcDay3Date);        
        await modeller.globals.WISELogger.getInstance().info("BurningConditionDay4End: " + bcDay4Date);


        await modeller.globals.WISELogger.getInstance().info("Building WISE job.");
        //set this to the location of the test files folder.
        // console.log(modeller.wise)
        var prom = await new modeller.wise.WISE();

        var projectionFile = await modelDataset.path + modelDataset.prj
        // console.log('Proj File used:', projectionFile);
        await prom.setProjectionFile(projectionFile);


        await prom.setElevationFile(modelDataset.path + modelDataset.elevation);
        await prom.setFuelmapFile(modelDataset.path + modelDataset.fuels);
        await prom.setLutFile(modelDataset.path + modelDataset.lut);
        await prom.setTimezoneByValue(timeZoneObj.wise); 


        var spotwxWeatherStation = await prom.addWeatherStation(ele, new modeller.globals.LatLon(lat, lon));

        var header = await "HOURLY,HOUR,TEMP,RH,WD,WS,PRECIP"
        var forecastLines = await weather.records.map((r: any) => {
            return `${r.localDate}, ${r.localHour}, ${r.temp}, ${r.rh}, ${r.wd}, ${r.ws}, ${r.precip}`
        })
        await forecastLines.unshift(header)

        // console.log("forecast", forecast)
        var spotwxAttachment = await prom.addAttachment('spotwx_forecast.txt', forecastLines.join('\n'));

        /* This is where we should inject teh CWFIS FWI values IF Nt does not have them. */


        if (cffdrs.cffdrs.ffmc === null || cffdrs.cffdrs.dmc === null || cffdrs.cffdrs.dc === null) {
            await console.log("WARNING: detected a null value in cffdrs:", cffdrs.cffdrs);
            cffdrs.cffdrs.ffmc = 85
            cffdrs.cffdrs.dmc = 6
            cffdrs.cffdrs.dc = 15

            console.log("WARNING: substituting defaults in cffdrs:", cffdrs.cffdrs);

        }
        if (cffdrs.cffdrs.ffmc <= 0 || cffdrs.cffdrs.dmc <= 0 || cffdrs.cffdrs.dc <= 0) {
            await console.log("WARNING: detected an odd (less than zero) value in cffdrs:", cffdrs.cffdrs);
            cffdrs.cffdrs.ffmc = 85
            cffdrs.cffdrs.dmc = 6
            cffdrs.cffdrs.dc = 15

            console.log("WARNING: substituting defaults in cffdrs:", cffdrs.cffdrs);

        }
        var spotwxWeatherStream = await spotwxWeatherStation.addWeatherStream(
            String(spotwxAttachment), 94.0, 17,
            modeller.wise.HFFMCMethod.LAWSON,
            cffdrs.cffdrs.ffmc,
            cffdrs.cffdrs.dmc,
            cffdrs.cffdrs.dc,
            parseFloat(cffdrs.cffdrs.rn24),
            weather.firstDateLocal.split(" ")[0],
            weather.lastDateLocal.split(" ")[0]);

        // scan the dataset path for ingition_*.geoJson
        // if there is one, use it, if not, use the fireGeom

        // let ignitionFiles = await fs.readdirSync(modelDataset.path).filter(file => file.includes('ignition_') && file.includes('.geoJson'))  
        // // if there is an ignition file, use it, if not, use the fireGeom
        // if (ignitionFiles.length > 0) {
        //     // use the first one
        //     var ignitionFilePath = ((ignitionFiles.length = 1)) ? await ignitionFiles[0] : ignitionFiles.filter(file => file.includes('polygon'))[0]
        //     //ignitionFile.data_source
        //     let ignitionFullPath = await modelDataset.path + ignitionFilePath
        //     var ignitionFile 
        //     try {
        //        // console.log("ignitionFullPath", ignitionFullPath);
        //         ignitionFile = await JSON.parse(fs.readFileSync(ignitionFullPath, 'utf8'));     
        //         fireGeom.geometry = await ignitionFile.geometry
        //     } catch (error) {
        //         console.log("Error reading ignition file", error)

        //     }




        // } 





        // now we need to load int eh ignition file


        console.log("fireGeom", fireGeom);

        if (fireGeom.geometry && fireGeom.geometry.type && fireGeom.geometry.type == 'Point') {
            //create the ignition points
            var latLongObj = await new modeller.globals.LatLon(
                lat,
                lon
            );

            // add it to the model

            // create small fuel poly

            // let fuelPoly = await turf.buffer(fireGeom, 300, { units: 'meters' })
            // let coords = await fuelPoly.geometry.coordinates[0].map(pair => {
            //     return new modeller.globals.LatLon(
            //         pair[1],
            //         pair[0]
            //     );
            // })
            var mainIgnition: any = await prom.addPointIgnition(
                latLongObj,
                //luxon.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00"));
                scenarioStartString);


            // var ignitionPatch:any = await prom.addPolygonFuelPatch(
            //     coords, "allFuels", "c-2",  'this is an ignition fuel patch'
            // )
        }
        else if (fireGeom.geometry && fireGeom.geometry.type && fireGeom.geometry.type == 'MultiPolygon') {
            //geometry: { type: 'MultiPolygon', coordinates: [ [Array] ] },
            var ignitionPatch: any = await false
            mainIgnition = []

            fireGeom.geometry.coordinates.forEach(subpolyCoords => {
                let coords = subpolyCoords[0].map(pair => {
                    return new modeller.globals.LatLon(pair[1], pair[0]);
                });


                let ignition = prom.addPolygonIgnition(coords, scenarioStartString);
                mainIgnition.push(ignition)
            })
        }
        else if (fireGeom.geometry && fireGeom.geometry.type && fireGeom.geometry.type == 'Polygon') {



            mainIgnition = prom.addPolygonIgnition(fireGeom.geometry.coordinates, scenarioStartString);
        }
        else {
            //create ignition polygon
            console.log("odd geom:", fireGeom);

            // prom.addPolygonIgnition(

            // )
        }






        // set up the model options here.

        let maxAccTS = modeller.globals.Duration.createTime(0, 2, 0, false); // The maximum time step during acceleration.
        let distRes = 1.0; // The distance resolution.
        let perimRes = 1.0; // The perimeter resolution.
        let minSpreadRos = 0.001 // Minimum Spreading ROS.
        let stopAtGridEnd = false; // Whether to stop the fire spread when the simulated fire reaches the boundary of the grid data.
        let breaching = true; // Whether breaching is turned on or off.
        let dynSpatialT = true; // Whether using the dynamic spatial threshold algorithm is turned on or off.
        let spotting = true; // Whether the spotting model should be activated.
        let purgeND = false; // purge Non Displayable - Whether internal/hidden time steps are retained.
        let useGrowthPctl = false; // Whether the growth percentile value is applied.
        let GrowthPctl = 50.0; // Growth percentile, to apply to specific fuel types.

        // setFbpOptions(terrainEffect: boolean, windEffect: boolean)

        let terrainEffect = true
        let windEffect = true;
        // setFmcOptions(perOverrideVal: number, nodataElev: number, terrain: boolean, accurateLocation: boolean)

        let perOverrideVal = -1 //disabled
        let nodataElev = 0.0
        let fmcTerrain = true
        let fmcAccurateLocation = false

        // setFwiOptions(fwiSpacInterp: boolean, fwiFromSpacWeather: boolean, historyOnEffectedFWI: boolean, burningConditionsOn: boolean, fwiTemporalInterp: boolean)

        let fwiSpacInterp = true
        let fwiFromSpacWeather = true
        let historyOnEffectedFWI = true
        let burningConditionsOn = true
        let fwiTemporalInterp = false

        // create the BEST case scenario
        // let bestScenario = prom.addScenario(
        //     scenarioStartString,
        //     scenarioEndString,
        //     "This is the BEST Case Scenario");

        // // create the BEST case scenario
        let worstScenario = prom.addScenario(
            scenarioStartString,
            scenarioEndString,
            "This is the WORST Case Scenario");

        // //create the three day scenario

        let threeDayScenario = prom.addScenario(
            scenarioStartString,
            scenarioThreeDayEndString,
            "This is the Three Day Scenario");


        threeDayScenario.setName(fireID + " 3 Day Scenario");
        // bestScenario.setName(fireID + " BEST Case Scenario");
        worstScenario.setName(fireID + " WORST Case Scenario");

        threeDayScenario.displayInterval = modeller.globals.Duration.createTime(Number(DISPLAY_INTERVAL), 0, 0, false);
        worstScenario.displayInterval = modeller.globals.Duration.createTime(Number(DISPLAY_INTERVAL), 0, 0, false);

        threeDayScenario.addBurningCondition(bcStartDate, 0, 24, 11, 0.0, 95.0, 0.0);
        threeDayScenario.addBurningCondition(bcDay1Date, 0, 24, 11, 0.0, 95.0, 0.0);
        threeDayScenario.addBurningCondition(bcDay2Date, 0, 24, 11, 0.0, 95.0, 0.0);
        threeDayScenario.addBurningCondition(bcDay3Date, 0, 24, 11, 0.0, 95.0, 0.0);
        threeDayScenario.addBurningCondition(bcDay4Date, 0, 24, 11, 0.0, 95.0, 0.0);







        // worstScenario.addBurningCondition(bcStartDate, 0, 24, 16, 0.0, 95.0, 0.0);
        // worstScenario.addBurningCondition(bcDay1Date, 0, 24, 16, 0.0, 95.0, 0.0);
        // worstScenario.addBurningCondition(bcDay2Date, 0, 24, 16, 0.0, 95.0, 0.0);
        // worstScenario.addBurningCondition(bcDay3Date, 0, 24, 16, 0.0, 95.0, 0.0);
        // worstScenario.addBurningCondition(bcDay4Date, 0, 24, 16, 0.0, 95.0, 0.0);

       
        

        threeDayScenario.setFgmOptions(maxAccTS, distRes, perimRes, minSpreadRos, stopAtGridEnd,
            breaching, dynSpatialT, spotting, purgeND, useGrowthPctl, GrowthPctl);

        worstScenario.setFgmOptions(maxAccTS, distRes, perimRes, minSpreadRos, stopAtGridEnd,
            breaching, dynSpatialT, spotting, purgeND, useGrowthPctl, GrowthPctl);

        threeDayScenario.setFbpOptions(terrainEffect, windEffect);
        
        worstScenario.setFbpOptions(terrainEffect, windEffect);

        threeDayScenario.setFmcOptions(perOverrideVal, nodataElev, fmcTerrain, fmcAccurateLocation);
        
        worstScenario.setFmcOptions(perOverrideVal, nodataElev, fmcTerrain, fmcAccurateLocation);


        threeDayScenario.setFwiOptions(fwiSpacInterp, fwiFromSpacWeather, historyOnEffectedFWI, burningConditionsOn, fwiTemporalInterp);
        
        worstScenario.setFwiOptions(fwiSpacInterp, fwiFromSpacWeather, historyOnEffectedFWI, burningConditionsOn, fwiTemporalInterp);

        if (Array.isArray(mainIgnition)) {
            console.log("adding multiple ignitions");
            for (const subIgnition of mainIgnition) {
                threeDayScenario.addIgnitionReference(subIgnition);
                // bestScenario.addIgnitionReference(subIgnition);
                worstScenario.addIgnitionReference(subIgnition);
            }
        }
        else {
            threeDayScenario.addIgnitionReference(mainIgnition);
            // bestScenario.addIgnitionReference(mainIgnition);
            worstScenario.addIgnitionReference(mainIgnition);

        }



        // create weather patches for best and worst case

        // the Best case lowers the predicted temperatures by 5 degrees and raises the predicted RH by 5% 
        // the worst case raises temperatures by 5 degrees and lowers RH by 5%. 

        // var bestCaseWeatherPatch = await prom.addLandscapeWeatherPatch(
        //     //       "YYYY-MM-DDThh:mm:ss".
        //     //     weather.firstDateLocal.split(" ")[0] + "T13:00:00"

        //     //luxon_1.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T13:00:00"),
        //     scenarioStartString,
        //     modeller.globals.Duration.createTime(13, 0, 0, false),
        //     //"13:00:00",
        //     //luxon_1.DateTime.fromISO(weather.firstDateLocal.split(" ")[0] + "T21:00:00"),
        //     scenarioEndString,
        //     modeller.globals.Duration.createTime(13, 0, 0, false), fireID + " Best Case Patch");
        // //  "13:00:00");
        // bestCaseWeatherPatch.setTemperatureOperation(modeller.wise.WeatherPatchOperation.MINUS, 5);
        // bestCaseWeatherPatch.setRhOperation(modeller.wise.WeatherPatchOperation.PLUS, 5);


        var worstCaseWeatherPatch = prom.addLandscapeWeatherPatch(
            scenarioStartString,
            modeller.globals.Duration.createTime(13, 0, 0, false),
            scenarioEndString,
            modeller.globals.Duration.createTime(13, 0, 0, false), fireID + " Worst Case Patch");
        worstCaseWeatherPatch.setTemperatureOperation(modeller.wise.WeatherPatchOperation.PLUS, 15);
        worstCaseWeatherPatch.setRhOperation(modeller.wise.WeatherPatchOperation.MINUS, 15);



        threeDayScenario.addWeatherStreamReference(spotwxWeatherStream);
        worstScenario.addWeatherStreamReference(spotwxWeatherStream);
     //   worstScenario.addWeatherPatchReference(worstCaseWeatherPatch, 4);



    //   let statsFile3days = prom.addOutputStatsFileToScenario(threeDayScenario, '3dayModelScenarioStats.json')
     //  let statsFileWorst = prom.addOutputStatsFileToScenario(worstScenario, 'worstModelScenarioStats.json')
       // statsFile3days.setWeatherStream(spotwxWeatherStream)
    //    statsFileWorst.setWeatherStream(spotwxWeatherStream)
        // DATE_TIME | ELAPSED_TIME | TIME_STEP_DURATION | TEMPERATURE | DEW_POINT | RELATIVE_HUMIDITY | WIND_SPEED | WIND_DIRECTION | PRECIPITATION | HFFMC | HISI | DMC | DC | HFWI | BUI | FFMC | ISI | FWI | TIMESTEP_AREA | TIMESTEP_BURN_AREA | TOTAL_AREA | TOTAL_BURN_AREA | AREA_GROWTH_RATE | EXTERIOR_PERIMETER | EXTERIOR_PERIMETER_GROWTH_RATE | ACTIVE_PERIMETER | ACTIVE_PERIMETER_GROWTH_RATE | TOTAL_PERIMETER | TOTAL_PERIMETER_GROWTH_RATE | FI_LT_10 | FI_10_500 | FI_500_2000 | FI_2000_4000 | FI_4000_10000 | FI_GT_10000 | ROS_0_1 | ROS_2_4 | ROS_5_8 | ROS_9_14 | ROS_GT_15 | MAX_ROS | MAX_FI | MAX_FL | MAX_CFB | MAX_CFC | MAX_SFC | MAX_TFC | TOTAL_FUEL_CONSUMED | CROWN_FUEL_CONSUMED | SURFACE_FUEL_CONSUMED | NUM_ACTIVE_VERTICES | NUM_VERTICES | CUMULATIVE_VERTICES | CUMULATIVE_ACTIVE_VERTICES | NUM_ACTIVE_FRONTS | NUM_FRONTS | MEMORY_USED_START | MEMORY_USED_END | NUM_TIMESTEPS | NUM_DISPLAY_TIMESTEPS | NUM_EVENT_TIMESTEPS | NUM_CALC_TIMESTEPS | TICKS | PROCESSING_TIME | GROWTH_TIME): GlobalStatistics
        let stats = [
             modeller.globals.GlobalStatistics.DATE_TIME,
             modeller.globals.GlobalStatistics.SCENARIO_NAME,
            // modeller.globals.GlobalStatistics.ELAPSED_TIME,
            // modeller.globals.GlobalStatistics.TIME_STEP_DURATION,
            // modeller.globals.GlobalStatistics.TEMPERATURE,
            // modeller.globals.GlobalStatistics.RELATIVE_HUMIDITY,
            // modeller.globals.GlobalStatistics.WIND_SPEED,
            // modeller.globals.GlobalStatistics.WIND_DIRECTION,
            // modeller.globals.GlobalStatistics.PRECIPITATION,
            // modeller.globals.GlobalStatistics.HFFMC,
            // modeller.globals.GlobalStatistics.HISI,
            // modeller.globals.GlobalStatistics.DMC,
            // modeller.globals.GlobalStatistics.DC,
            // modeller.globals.GlobalStatistics.HFWI,
            // modeller.globals.GlobalStatistics.BUI,
            // modeller.globals.GlobalStatistics.FFMC,
            // modeller.globals.GlobalStatistics.ISI,
            // modeller.globals.GlobalStatistics.FWI,
            // modeller.globals.GlobalStatistics.TIMESTEP_AREA,
            modeller.globals.GlobalStatistics.TIMESTEP_BURN_AREA,
            // modeller.globals.GlobalStatistics.TOTAL_AREA,
             modeller.globals.GlobalStatistics.TOTAL_BURN_AREA,
            // modeller.globals.GlobalStatistics.AREA_GROWTH_RATE,
            // modeller.globals.GlobalStatistics.EXTERIOR_PERIMETER,
            // modeller.globals.GlobalStatistics.EXTERIOR_PERIMETER_GROWTH_RATE,
            // modeller.globals.GlobalStatistics.ACTIVE_PERIMETER,
            // modeller.globals.GlobalStatistics.ACTIVE_PERIMETER_GROWTH_RATE,
            // modeller.globals.GlobalStatistics.TOTAL_PERIMETER,
            // modeller.globals.GlobalStatistics.TOTAL_PERIMETER_GROWTH_RATE,
            // modeller.globals.GlobalStatistics.FI_LT_10,
            // modeller.globals.GlobalStatistics.FI_10_500,
            // modeller.globals.GlobalStatistics.FI_500_2000,
            // modeller.globals.GlobalStatistics.FI_2000_4000,
            // modeller.globals.GlobalStatistics.FI_4000_10000,
            // modeller.globals.GlobalStatistics.FI_GT_10000,
            // modeller.globals.GlobalStatistics.ROS_0_1,
            // modeller.globals.GlobalStatistics.ROS_2_4,
            // modeller.globals.GlobalStatistics.ROS_5_8,
            // modeller.globals.GlobalStatistics.ROS_9_14,
            // modeller.globals.GlobalStatistics.ROS_GT_15,
            // modeller.globals.GlobalStatistics.MAX_ROS,
            // modeller.globals.GlobalStatistics.MAX_FI,
            // modeller.globals.GlobalStatistics.MAX_FL,
            // modeller.globals.GlobalStatistics.MAX_CFB,
            // modeller.globals.GlobalStatistics.MAX_CFC,
            // modeller.globals.GlobalStatistics.MAX_SFC,
            // modeller.globals.GlobalStatistics.MAX_TFC,
            // modeller.globals.GlobalStatistics.TOTAL_FUEL_CONSUMED,
            // modeller.globals.GlobalStatistics.CROWN_FUEL_CONSUMED,
            // modeller.globals.GlobalStatistics.SURFACE_FUEL_CONSUMED,
            // modeller.globals.GlobalStatistics.NUM_ACTIVE_FRONTS,
            // modeller.globals.GlobalStatistics.NUM_FRONTS,
            // modeller.globals.GlobalStatistics.MEMORY_USED_START,
            // modeller.globals.GlobalStatistics.MEMORY_USED_END,
            // modeller.globals.GlobalStatistics.NUM_TIMESTEPS,
            // modeller.globals.GlobalStatistics.NUM_DISPLAY_TIMESTEPS,
            // modeller.globals.GlobalStatistics.NUM_EVENT_TIMESTEPS,
            // modeller.globals.GlobalStatistics.NUM_CALC_TIMESTEPS,
            // modeller.globals.GlobalStatistics.PROCESSING_TIME,
            // modeller.globals.GlobalStatistics.GROWTH_TIME
        ]

    //     stats.forEach((s: any) => {
    //       //let r=  statsFile3days.addColumn(s)
    //       console.log('Stats: adding:',s, statsFile3days.addColumn(s));
    //    //     statsFileWorst.addColumn(s)
    //     })
 
        // prom.timestepSettings.addStatistic(modeller.globals.GlobalStatistics.TOTAL_BURN_AREA);
        // prom.timestepSettings.addStatistic(modeller.globals.GlobalStatistics.DATE_TIME);
        // prom.timestepSettings.addStatistic(modeller.globals.GlobalStatistics.SCENARIO_NAME);


        let threeDayScenarioOutputKml = prom.addOutputVectorFileToScenario(
            modeller.wise.VectorFileType.KML,
            '3dayModelScenario.kml',
            scenarioStartString,
            scenarioThreeDayEndString,
            threeDayScenario);

        threeDayScenarioOutputKml.mergeContact = true;
        threeDayScenarioOutputKml.multPerim = true;
        threeDayScenarioOutputKml.removeIslands = true;
        threeDayScenarioOutputKml.metadata = jDefaults.metadataDefaults;
        threeDayScenarioOutputKml.shouldStream = true;


      


        let worstCaseScenarioOutputKml = prom.addOutputVectorFileToScenario(
            modeller.wise.VectorFileType.KML,
            'WorstCaseModelScenario.kml',
            scenarioStartString,
            scenarioEndString,
            worstScenario);

        worstCaseScenarioOutputKml.mergeContact = true;
        worstCaseScenarioOutputKml.multPerim = true;
        worstCaseScenarioOutputKml.removeIslands = true;
        worstCaseScenarioOutputKml.metadata = jDefaults.metadataDefaults;
        worstCaseScenarioOutputKml.shouldStream = true;


        //allow the file to be streamed to a remote location after it is written (ex. streamOutputToMqtt, streamOutputToGeoServer).

        let threeDayScenarioOutputSummary = prom.addOutputSummaryFileToScenario(threeDayScenario, "threeDaySummary.txt");
        threeDayScenarioOutputSummary.shouldStream = true;
        await setSummaryOptions(threeDayScenarioOutputSummary)

        let worstCaseScenarioOutputSummary = prom.addOutputSummaryFileToScenario(worstScenario, "worstCaseSummary.txt");
        worstCaseScenarioOutputSummary.shouldStream = true;
        await setSummaryOptions(worstCaseScenarioOutputSummary)


        // lets add an experimental JSON output file usnig travis' workaournd:
        //TODO: add a Real JSON output file to the scenario after the bug is fixed.

        let threeDayScenarioOutputJSON = prom.addOutputVectorFileToScenario(
            modeller.wise.VectorFileType.SHP,
            '3dayModelScenario.json',
            scenarioStartString,
            scenarioThreeDayEndString,
            threeDayScenario);

        threeDayScenarioOutputJSON.mergeContact = true;
        threeDayScenarioOutputJSON.multPerim = true;
        threeDayScenarioOutputJSON.removeIslands = true;
        threeDayScenarioOutputJSON.metadata = jDefaults.metadataDefaults;
        threeDayScenarioOutputJSON.shouldStream = true;

        let worstCaseScenarioOutputJSON = prom.addOutputVectorFileToScenario(
            modeller.wise.VectorFileType.SHP,
            'WorstCaseModelScenario.json',
            scenarioStartString,
            scenarioEndString,
            worstScenario);

        worstCaseScenarioOutputJSON.mergeContact = true;
        worstCaseScenarioOutputJSON.multPerim = true;
        worstCaseScenarioOutputJSON.removeIslands = true;
        worstCaseScenarioOutputJSON.metadata = jDefaults.metadataDefaults;
        worstCaseScenarioOutputJSON.shouldStream = true;

        //add a summary file to the scenario




        try {
            prom.isValid()
        } catch (error) {
            console.log(error);
            process.exit();
        }



        if (prom.isValid()) {
            // console.log("Model is valid...");
            modeller.globals.WISELogger.getInstance().info("The Model is VALID.");
            //  console.log(prom.inputs.ignitions);
            //start the job asynchronously
            modeller.globals.WISELogger.getInstance().info("start the job asynchronously.");
            let wrapper = await prom.beginJobPromise();
            //trim the name of the newly started job
            var jobName = wrapper.name.replace(/^\s+|\s+$/g, "");
            // here is where we register the job in the DB.
            // let registration = new PreProcessor(jobName, fireID)
            // console.log("Job Registration", registration);
            modeller.globals.WISELogger.getInstance().info("We have a job number from builder:" + jobName);
            // here we will register the job name and fireid for later correlation.
            //   await registerJob(jobName, fireID)

            //a manager for listening for status messages
            modeller.globals.WISELogger.getInstance().info("create a manager for listening for status messages.");
            let manager = new modeller.client.JobManager(jobName);
            //start the job manager
            modeller.globals.WISELogger.getInstance().info("start the client job manager.");
            await manager.start();
            modeller.globals.WISELogger.getInstance().info("client job manager started., waiting for job to complete...");
            //when the WISE job triggers that it is complete, shut down the listener
            console.log("passing job name to main code");
            // resolve({ model: prom, jobName: jobName })
            if (remotejobsFolder.length == 0) {
                console.log("VAR remotejobsFolder is empty aborting...");
                process.exit(1);
            }
            var fireModel = await { model: prom, jobName: jobName }

            // shell out and run WISE
            var jobFile = await remotejobsFolder + fireModel.jobName + "/job.fgmj"
            var validateFile = await remotejobsFolder + fireModel.jobName + "/validation.json"
            var threeDaySummaryFile = await remotejobsFolder + fireModel.jobName + "/Outputs/threeDaySummary.txt"

            var threeDayKml = await remotejobsFolder + fireModel.jobName + "/Outputs/3dayModelScenario.kml"



            const shellValidateString = await `${wiseExec} --validate ${jobFile}`
            const shellOutAndValidate = (shellValidateString, validateFile) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        let validation = await shellOut(shellValidateString);
                        console.log("validation Process worked", validation);
                        await modeller.globals.WISELogger.getInstance().info(`validation Process: Worked`);
                        // now lets read the validation results and see if validation passed or failed
                        if (fs.existsSync(validateFile)) {
                            console.log("validateFile exists");
                            await modeller.globals.WISELogger.getInstance().info(`validation File: exists`);
                            fs.readFile(validateFile, 'utf8', async (error: Error, bestData: any) => {
                                let dataObj = JSON.parse(bestData);
                                if (error) {
                                    console.log("validate error", error);
                                    await modeller.globals.WISELogger.getInstance().info(`error: ${error.message}`);
                                    resolve(false)
                                }
                                if (dataObj.valid == true) {
                                    // console.log("bestCase:", bestData.toString());
                                    console.log("validation passed");
                                    await modeller.globals.WISELogger.getInstance().info(`validation passed`);
                                    resolve(true)
                                } else {
                                    //TODO: add a validation translator that llooks for issues in hte validation log 
                                    // and job file and produces plain laungage errors.
                                    // console.log("validation failed", dataObj);
                                    await modeller.globals.WISELogger.getInstance().info(`validation failed ${dataObj.load_warnings}`);
                                    resolve(false)
                                }

                            });
                        }


                    } catch (error) {
                        console.log("Validation Process did not work");
                        console.log(error);
                        await modeller.globals.WISELogger.getInstance().info(`Validation Process Broken: ${error.message}`);
                        resolve(false);

                    }

                });
            }

            function shellOutAndModel(modelCommandString, summaryFile, fireID) {
                return new Promise((resolve, reject) => {
                    // before we do the work, we need to double check all configs are set correctly
                    // check the mqtt config for 
                    //   console.log("JobManager:", modeller.client.JobManager)
                    // read the utf8 config.json file into a variable
                    const configFile = remotejobsFolder + '/config.json';
                    const config = fs.readFileSync(configFile, 'utf8');
                    // parse the config file into a JSON object
                    const configObj = JSON.parse(config);
                    // check the configObj for the mqtt config
                    console.log("configObj", configObj);
                    const ct_code = fireID + ' Execution Took'

                    console.time(ct_code);
                    //XXX

                    console.log("----------------------------------------------------------\n",
                        'Starting Model Execution', jobInfo, "\n",
                        '----------------------------------------------------------');
                    console.log("modelCommandString", modelCommandString);
                    const modellingJob = spawn(modelCommandString, { shell: true });
                    modellingJob.on('close', (code) => {
                        console.timeEnd(ct_code);
                        if (code !== 0) {
                            console.error(`${fireID} Model Execution failed with code ${code}`);
                            resolve(false);
                        }
                        console.time('Read Summary File Took');
                        console.log('Starting Read Summary File');
                        // read in the summary utf8 text file
                        //        const secondJob = spawn(secondJobString, { shell: true });
                        try {
                            const summary = fs.readFileSync(summaryFile, 'utf8');
                            console.timeEnd('Read Summary File Took');
                            resolve(true);

                        } catch (error) {
                            console.log('Error reading summary file');
                            console.log(error);
                            console.timeEnd('Read Summary File Took');
                            resolve(false);
                        }


                    });
                    modellingJob.stderr.on('data', (data) => {
                        // this logs out what the model jobs is saying on the command line  
                        let stderr = "stderr: " + data.toString() + "\n"
                        process.stdout.write(stderr);
                        resolve(false);
                    });
                });
            }

            console.log("Validating the FGMJ...");
            try {
                let jobfileValidation = await shellOutAndValidate(shellValidateString, validateFile)
                console.log("Validation complete...");
                if (!jobfileValidation) {
                    console.log("Validation failed...");
                    await modeller.globals.WISELogger.getInstance().info(`Validation failed...`);
                    resolve(false)
                }
                else {
                    modeller.globals.WISELogger.getInstance().info(`Executing WISE Directly, ${fireModel.jobName} `);

                    try {
                        const shellCommandString = await `${wiseExec} ${jobFile}`
                        console.log("shellCommandString", shellCommandString);
                        let mShellRes = await shellOutAndModel(shellCommandString, threeDaySummaryFile, fireID)
                        console.log("Modelling complete...");
                        if (!mShellRes) {
                            console.log("Modelling failed...");
                            await modeller.globals.WISELogger.getInstance().info(`Modelling failed...`);
                            resolve(false)
                        }
                        else {
                            console.log("Modelling passed...");
                            await modeller.globals.WISELogger.getInstance().info(`Modelling passed...`);
                            resolve(mShellRes)
                        }

                    } catch (error) {
                        console.log("Modelling Process did not work");
                        console.log(error);
                        await modeller.globals.WISELogger.getInstance().info(`Modelling Process Broken: ${error.message}`);
                        resolve(false);
                    }




                }


            } catch (error) {
                console.log(error);

                //   process.exit(1);
            }






        } else {
            console.log("Model is NOT valid...");

            if (!prom.inputs.isValid()) {
                console.log("Inputs are not valid");
                console.log("checkValid", JSON.stringify(prom.inputs.checkValid(), null, 4));
                //  console.log(prom.inputs);
            }

            else if (!prom.outputs.isValid()) {
                console.log("Outputs are not valid");
                console.log("checkValid", JSON.stringify(prom.outputs.checkValid(), null, 4));
                console.log(prom.outputs);
            }
            else {
                console.log(prom);
            }
            resolve({ model: prom, jobName: jobName })

        }





    });
}




const getCentriodFromGeom = (polygon) => {
    //  console.log("Incoming geom:", polygon);
    var centroid = turf.centroid(polygon);
    return centroid
}

const getElevationByLatLon = (latitude: any, longitude: any) => {
    console.log("Getting Elevation for", latitude, longitude);
    return new Promise((resolve, reject) => {
        let elevationUrl = `http://geogratis.gc.ca/services/elevation/cdem/altitude?lat=${latitude}&lon=${longitude}`
        fetch(elevationUrl, {
            "method": "GET",
            "headers": {
                "user-agent": "vscode-restclient"
            }
        })
            .then(rawJson => rawJson.json())
            .then(response => {
                console.log("Elevation Response", response);
                resolve(response.altitude)
            })
            .catch(err => {
                console.log("Elevation Error", err);
                console.error(err);
                reject(err)
            });
    });
}

const easyPublicModel = (liveFire, jobInfo) => {
    // check all these constants and make sure they are set!
    function checkConstants() {
        const constants = [
            'DISPLAY_INTERVAL', 'BUILDER_HOST',
            'BUILDER_PORT', 'PROJECT_JOBS_FOLDER', 'PROJECT_RAIN_FOLDER',
            'CONTAINER_WISE_BIN_PATH', 'MQTT_HOST', 'MQTT_PORT',
            'MQTT_NAMESPACE', 
            'CONTAINER_DATASET_PATH', 'CONTAINER_DATASET_BBOXFILE',
            'CONTAINER_DATASET_LUTFILE', 'CONTAINER_DATASET_PROJFILE',
            'CONTAINER_DATASET_ELEVATION_RASTER',
            'CONTAINER_DATASET_FUEL_RASTER', 'rainFolder',
            'remotejobsFolder'
        ];

        for (const constant of constants) {
            if (!process.env[constant]) {
                console.error(`ERROR: Missing Constant!!!!! ${constant} is not set!`);
                process.exit(1);
            }
            else {
                //   console.log(`INFO: ${constant} is set to ${process.env[constant]}`);
            }
        }
    }
    checkConstants();
    console.log("easyPublicModel", liveFire);
    return new Promise(async (resolve, reject) => {
        const fireID = await liveFire.properties.datasetName
        const datasetName = await liveFire.properties.datasetName
        const datasetPath = await {
            path: CONTAINER_DATASET_PATH + "/" + datasetName + "/",
            bbox: CONTAINER_DATASET_BBOXFILE,
            lut: CONTAINER_DATASET_LUTFILE,
            prj: CONTAINER_DATASET_PROJFILE,
            elevation: CONTAINER_DATASET_ELEVATION_RASTER,
            fuels: CONTAINER_DATASET_FUEL_RASTER
        }

        // lets find our igintion file and load it in
        // scan the dataset directory for files that start with ignition_
        console.log('Looking for ignition file', datasetPath.path);
        const ignitionFile = 'fire.json'
        const weatherFile = 'SpotWx_Forecast.csv'
        const rainFile = 'rain.json'
        const timeZoneFile = 'timezone.json'
        const cffdrsFile = 'cffdrs.json'
        const ignitionObjectRaw = await JSON.parse(fs.readFileSync(datasetPath.path + ignitionFile, 'utf8'))
        const ignitionObject = await (ignitionObjectRaw.coordinates) ? turf.feature(ignitionObjectRaw) : ignitionObjectRaw.geometry
        console.log('ignitionObject', ignitionObject);

        const timezoneObject = await JSON.parse(fs.readFileSync(datasetPath.path + timeZoneFile, 'utf8'))
        console.log('timezoneObject', timezoneObject);
        const cffdrsObject = await JSON.parse(fs.readFileSync(datasetPath.path + cffdrsFile, 'utf8'))
        console.log('cffdrsObject', cffdrsObject);
        console.log('liveFire', liveFire);
        liveFire.geometry = (ignitionObject.coordinates) ? await ignitionObject : await ignitionObject.geometry
        console.log("After adding geometry");

        const fireGeom = await liveFire
        console.log(fireGeom);



        if (fireGeom.type && fireGeom.type == 'Point') {
            console.log("we have point");
            var lat = await fireGeom.coordinates[1];
            var lon = await fireGeom.coordinates[0];
            var ignitionType = 'point';
        }
        else if (fireGeom.type && (fireGeom.type == 'Polygon' || fireGeom.type == 'MultiPolygon')) {
            console.log('we have a poly, need a centroid');

            let centroid = await getCentriodFromGeom(fireGeom)
            //  await  console.log("centroid",centroid);
            var lat = centroid.geometry.coordinates[1]
            var lon = centroid.geometry.coordinates[0]
            var ignitionType = 'poly'

        }

        else if (fireGeom.geometry && fireGeom.geometry.type && fireGeom.geometry.type == 'Point') {
            console.log("we have point");
            var lat = await fireGeom.geometry.coordinates[1]
            var lon = await fireGeom.geometry.coordinates[0]
            var ignitionType = 'point'
        }
        else {
            console.log('we have a poly, need a centroid');

            let centroid = await getCentriodFromGeom(fireGeom)
            //  await  console.log("centroid",centroid);
            var lat = centroid.geometry.coordinates[1]
            var lon = centroid.geometry.coordinates[0]
            var ignitionType = 'poly'

        }



        console.log("get elevation for the fire", lat, lon);
        let ele = await getElevationByLatLon(lat, lon) || 100

        //get forecast
        console.log("get weather for the fire");
        let weather = await readWxService.readWxByFireID(fireID, lat, lon)
        //let weather = await JSON.parse(fs.readFileSync(datasetPath.path + weatherFile, 'utf8'))

        // now we need to make sure that the forecast data in here starts before noon, or else we nned to adjust it.
        console.log("weather from spotwx", weather);
        
        // wait 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));
        // weather {
        //     lat: 53.0511,
        //     lon: -118.147,
        //     forecastType: 'gfs',
        //     localRequestDate: 'YYYY-05-30',
        //     localRequestYear: 'YYYY',
        //     localRequestMonth: '49',
        //     localRequestDay: '30',
        //     localRequestHour: '07',
        //     firstDateLocal: '2023-05-30 00',
        //     lastDateLocal: '2023-06-09 00',
        //     forecastHours: 241,
        //     records: [
        //       {
        //         temp: '5.2',
        //         rh: '91',
        //         wd: '037',
        //         ws: '8',
        //         precip: '0.00',
        //         lat: 53.0511,
        //         lon: -118.147,
        //         forecastType: 'gfs',
        //         localRequestDate: '2023-05-30',
        //         localRequestHour: '07',
        //         localTz: 'America/Yellowknife',
        //         unixTime: 1685426400,
        //         utcDate: '2023-05-30',
        //         utcHour: '06',
        //         localDate: '2023-05-30',
        //         localHour: '00'
        //       }]


        let noonCheck = await weather.firstDateLocal.split(" ")[1]
        let dayCheck = await weather.firstDateLocal.split(" ")[0]
        
        let todayString = dayCheck

        if (dayCheck == todayString) {
            console.log("today is the first day of the forecast");

            if (noonCheck > 12) {
                console.log("Starts after 12, adjusting forecast");
                console.log(weather)
                weather = await weather.records.slice(1, 25)
                console.log(weather)
            }
            else {
                console.log("Noon is before 12, no adjustment needed");

            }


        }
        else {
            console.log("fire day is not today");

        }
        // this saves a rain file for tomorrow

        // this reads todays rain file

        let rainObj: any = await JSON.parse(fs.readFileSync(datasetPath.path + rainFile, 'utf8'))
        let rn12: any = rainObj.rain


        const cffdrs: any = cffdrsObject


        cffdrs.cffdrs.rn24 = await rn12
        console.log("FFMC:", `${cffdrs.cffdrs.ffmc} `);
        console.log("DMC:", `${cffdrs.cffdrs.dmc} `);
        console.log("DC:", `${cffdrs.cffdrs.dc} `);
        console.log("rn12:", `${cffdrs.cffdrs.rn24} `);
      
        await console.log("run the model....", { fireID, lat, lon, ele, fireGeom, datasetPath, weather, cffdrs, jobInfo });

        const model = await fireModel(timezoneObject, fireID, lat, lon, ele, fireGeom, datasetPath, weather, cffdrs, jobInfo)
        
        await console.log("model run complete....");


        resolve({
            model: model,

            inputs: {
                fireID, lat, lon, fireGeom, datasetPath, weather, cffdrs
            }
        }
        );
    });
}
export = {
    easyPublicModel: easyPublicModel
}
