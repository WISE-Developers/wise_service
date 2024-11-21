import * as turf from '@turf/turf';
// import luxon
import * as pgaLuxon from 'luxon';



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

    temporalAnalysis: any
}

const checkDates = (FGMJObject) => {
    const debugTemporal = false
    return new Promise(async (resolve, reject) => {
        let results = []
        // d1 < d2 // is d1 before d2?
        debugTemporal && console.log("Model Temporal Analysis:");
        console.time("Model Temporal Analysis - Complete:");
        let lxModelExecTime = await pgaLuxon.DateTime.fromISO(FGMJObject.project.projectStartTime.time) //.setZone("America/Yellowknife")




        debugTemporal && console.log("Model Execution time",
            `(${FGMJObject.project.projectStartTime.timezone})`,
            FGMJObject.project.projectStartTime.time)
        results.push(`Model Execution time: ${FGMJObject.project.projectStartTime.time}`)
        debugTemporal && console.log(
            `(${lxModelExecTime.zoneName})`,
            lxModelExecTime.toLocaleString(pgaLuxon.DateTime.DATETIME_FULL)
        )
        results.push(`Model Execution time: ${lxModelExecTime.toLocaleString(pgaLuxon.DateTime.DATETIME_FULL)}`)

        let scnStartTime = await FGMJObject.project.scenarios.scenarios[0].scenario.startTime.time
        let lxScnStart = await pgaLuxon.DateTime.fromISO(scnStartTime)
        let scnEndTime = await FGMJObject.project.scenarios.scenarios[0].scenario.endTime.time
        let lxScnEnd = await pgaLuxon.DateTime.fromISO(scnEndTime)
        const scnDurHours = await lxScnEnd.diff(lxScnStart, ["hours"]).toObject().hours


        for (const [index, ign] of FGMJObject.project.ignitions.ignitions.entries()) {
            // add some luxon objects for temporal analysis
            let ignTime = await ign.ignition.startTime.time
            let lxIgnTime = await pgaLuxon.DateTime.fromISO(ignTime)
            let timeBetweenStartAndIgn = await lxIgnTime.diff(lxScnStart, ["hours"]).toObject().hours
            let timeBetweenIgnAndEnd = await lxScnEnd.diff(lxIgnTime, ["hours"]).toObject().hours
            // is ignition time after scenario start
            let ignIsAfterStart = await lxIgnTime > lxScnStart
            // is ignition time before scenario end
            let ignIsBeforeEdn = await lxIgnTime < lxScnEnd
            let ignIsSameAsStart = await lxIgnTime.toMillis() === lxScnStart.toMillis()




            debugTemporal && console.log("How long is the scenario in hours?", scnDurHours)
            results.push(`Scenario length in hours: ${scnDurHours}`)
            debugTemporal && console.log("is ignition time after scenario start?", ignIsAfterStart);
            results.push(`Ignition time after scenario start: ${ignIsAfterStart}`)
            debugTemporal && console.log("is ignition time same as scenario start?", ignIsSameAsStart);
            results.push(`Ignition time same as scenario start: ${ignIsSameAsStart}`)
            debugTemporal && console.log("is ignition time before the scenario end?", ignIsBeforeEdn);
            results.push(`Ignition time before scenario end: ${ignIsBeforeEdn}`)



            debugTemporal && console.log("timeBetweenStartAndIgn", timeBetweenStartAndIgn);
            results.push(`Time between scenario start and ignition: ${timeBetweenStartAndIgn}`)
            debugTemporal && console.log("timeBetweenIgnAndEnd", timeBetweenIgnAndEnd);
            results.push(`Time between ignition and scenario end: ${timeBetweenIgnAndEnd}`)
            if (ignTime == scnStartTime) debugTemporal && console.log("");
            debugTemporal && console.log("IGNITION", index, ignTime)
            results.push(`Ignition ${index} time: ${ignTime}`)
            debugTemporal && console.log("SCENARIO START", scnStartTime)
            results.push(`Scenario start time: ${scnStartTime}`)
            debugTemporal && console.log("SCENARIO END", scnEndTime)
            results.push(`Scenario end time: ${scnEndTime}`)
        }


        // is scenario start after first date in stream
        // is scenario end before last date in stream
        console.timeEnd("Model Temporal Analysis - Complete:");

        resolve(results)
    });

}
export async function extractModelDataFromJob(model: any): Promise<ModelData> {
    const extractedData: ModelData = {
        scenarios: [],
        ignitions: [],
        burnConditions: [],
        fuelTypes: [],
        temporalAnalysis: []
    };



    extractedData.temporalAnalysis.push(await checkDates(model))
    // checkDates(model).then((results) => {
    // console.log('temporalAnalysis results', results);


    //     extractedData.temporalAnalysis.push(results)
    // })
    const project = model.project ?? {}; // Reference the project object

    // Extract scenario names and durations
    if (project.scenarios?.scenarios) {
        extractedData.scenarios = project.scenarios.scenarios.map((scenario: any) => {
            const name = scenario?.name ?? "Unknown Scenario";
            const comments = scenario?.comments ?? "";
            const startTimeString = scenario?.scenario?.startTime?.time ?? "";
            const endTimeString = scenario?.scenario?.endTime?.time ?? "";
            const startTime = new Date(startTimeString);
            const endTime = new Date(endTimeString);
            const duration = startTime && endTime ? (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24) : 0;

            return {
                name,
                comments,
                startTime: startTimeString || "N/A",
                endTime: endTimeString || "N/A",
                durationInDays: isNaN(duration) ? 0 : duration
            };
        });
    } else {
        console.warn("Scenarios data is missing");
    }

    // Extract number and types of ignitions, with lat/long or polygon centroid
    if (project.ignitions?.ignitions) {
        extractedData.ignitions = project.ignitions.ignitions.map((ignition: any) => {
            const name = ignition?.name ?? "Unnamed Ignition";
            const ignitionType = ignition?.ignition?.ignitions?.ignitions?.[0]?.polyType ?? "Unknown???";

            let location: { type: 'Point' | 'Polygon'; coordinates: [number, number] | [number, number][] } = {
                type: "Point",
                coordinates: [0, 0]
            };

            if (ignitionType === 'POINT') {
                //const point = ignition?.ignition?.ignitions?.[0]?.polygon?.polygon?.points?.[0];
                const point = ignition?.ignition?.ignitions?.ignitions?.[0]?.polygon?.polygon?.points?.[0];
                console.log('point', point);
                location = {
                    type: 'Point',
                    coordinates: [point?.x?.value ?? 0, point?.y?.value ?? 0]
                };
            } else if (ignitionType === 'POLYGON') {
                const points = ignition?.ignition?.ignitions?.[0]?.polygon?.polygon?.points?.map((p: any) => [
                    p?.x?.value ?? 0,
                    p?.y?.value ?? 0
                ]) ?? [];
                if (points.length > 0) {
                    const polygon = turf.polygon([points]);
                    const centroid = turf.centroid(polygon);
                    location = {
                        type: 'Point',
                        coordinates: centroid.geometry.coordinates as [number, number]
                    };
                }
            }

            return {
                name,
                type: ignitionType,
                location
            };
        });
    } else {
        console.warn("Ignitions data is missing");
    }

    // Extract burn conditions and the dates they were applied
    if (project.scenarios?.scenarios) {
        extractedData.burnConditions = project.scenarios.scenarios.map((scenario: any) => {
            const scenarioName = scenario?.name ?? "Unnamed Scenario";

            //  console.log( '🔥 scenario.temporalConditions', scenario.temporalConditions);   

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
        });
    } else {
        console.warn("Burn conditions data is missing");
    }

    // Extract list of fuel types used
    if (project.fuelCollection?.fuels) {
        extractedData.fuelTypes = project.fuelCollection.fuels.map((fuelModel: any) => ({
            name: fuelModel?.name ?? "Unnamed Fuel",
            type: fuelModel?.default ?? "Unknown"
        }));
    } else {
        console.warn("Fuel models data is missing in fuelCollection");
    }

    return extractedData;
}


let targetPath = './sample_data/jobs/job_20240917144823903/job.fgmj'

//now read the path in as utf8 text.
let fire_model_data_json = require('fs').readFileSync(targetPath, 'utf8');
let fire_model_data = JSON.parse(fire_model_data_json);







extractModelDataFromJob(fire_model_data)
    .then((meaningfulData) => {
        console.log(meaningfulData)
    })