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
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractModelDataFromJob = extractModelDataFromJob;
const turf = __importStar(require("@turf/turf"));
// import luxon
const pgaLuxon = __importStar(require("luxon"));
const checkDates = (FGMJObject) => {
    const debugTemporal = false;
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let results = [];
        // d1 < d2 // is d1 before d2?
        debugTemporal && console.log("Model Temporal Analysis:");
        console.time("Model Temporal Analysis - Complete:");
        let lxModelExecTime = yield pgaLuxon.DateTime.fromISO(FGMJObject.project.projectStartTime.time); //.setZone("America/Yellowknife")
        debugTemporal && console.log("Model Execution time", `(${FGMJObject.project.projectStartTime.timezone})`, FGMJObject.project.projectStartTime.time);
        results.push(`Model Execution time: ${FGMJObject.project.projectStartTime.time}`);
        debugTemporal && console.log(`(${lxModelExecTime.zoneName})`, lxModelExecTime.toLocaleString(pgaLuxon.DateTime.DATETIME_FULL));
        results.push(`Model Execution time: ${lxModelExecTime.toLocaleString(pgaLuxon.DateTime.DATETIME_FULL)}`);
        let scnStartTime = yield FGMJObject.project.scenarios.scenarios[0].scenario.startTime.time;
        let lxScnStart = yield pgaLuxon.DateTime.fromISO(scnStartTime);
        let scnEndTime = yield FGMJObject.project.scenarios.scenarios[0].scenario.endTime.time;
        let lxScnEnd = yield pgaLuxon.DateTime.fromISO(scnEndTime);
        const scnDurHours = yield lxScnEnd.diff(lxScnStart, ["hours"]).toObject().hours;
        for (const [index, ign] of FGMJObject.project.ignitions.ignitions.entries()) {
            // add some luxon objects for temporal analysis
            let ignTime = yield ign.ignition.startTime.time;
            let lxIgnTime = yield pgaLuxon.DateTime.fromISO(ignTime);
            let timeBetweenStartAndIgn = yield lxIgnTime.diff(lxScnStart, ["hours"]).toObject().hours;
            let timeBetweenIgnAndEnd = yield lxScnEnd.diff(lxIgnTime, ["hours"]).toObject().hours;
            // is ignition time after scenario start
            let ignIsAfterStart = (yield lxIgnTime) > lxScnStart;
            // is ignition time before scenario end
            let ignIsBeforeEdn = (yield lxIgnTime) < lxScnEnd;
            let ignIsSameAsStart = (yield lxIgnTime.toMillis()) === lxScnStart.toMillis();
            debugTemporal && console.log("How long is the scenario in hours?", scnDurHours);
            results.push(`Scenario length in hours: ${scnDurHours}`);
            debugTemporal && console.log("is ignition time after scenario start?", ignIsAfterStart);
            results.push(`Ignition time after scenario start: ${ignIsAfterStart}`);
            debugTemporal && console.log("is ignition time same as scenario start?", ignIsSameAsStart);
            results.push(`Ignition time same as scenario start: ${ignIsSameAsStart}`);
            debugTemporal && console.log("is ignition time before the scenario end?", ignIsBeforeEdn);
            results.push(`Ignition time before scenario end: ${ignIsBeforeEdn}`);
            debugTemporal && console.log("timeBetweenStartAndIgn", timeBetweenStartAndIgn);
            results.push(`Time between scenario start and ignition: ${timeBetweenStartAndIgn}`);
            debugTemporal && console.log("timeBetweenIgnAndEnd", timeBetweenIgnAndEnd);
            results.push(`Time between ignition and scenario end: ${timeBetweenIgnAndEnd}`);
            if (ignTime == scnStartTime)
                debugTemporal && console.log("");
            debugTemporal && console.log("IGNITION", index, ignTime);
            results.push(`Ignition ${index} time: ${ignTime}`);
            debugTemporal && console.log("SCENARIO START", scnStartTime);
            results.push(`Scenario start time: ${scnStartTime}`);
            debugTemporal && console.log("SCENARIO END", scnEndTime);
            results.push(`Scenario end time: ${scnEndTime}`);
        }
        // is scenario start after first date in stream
        // is scenario end before last date in stream
        console.timeEnd("Model Temporal Analysis - Complete:");
        resolve(results);
    }));
};
function extractModelDataFromJob(model) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const extractedData = {
            scenarios: [],
            ignitions: [],
            burnConditions: [],
            fuelTypes: [],
            temporalAnalysis: []
        };
        extractedData.temporalAnalysis.push(yield checkDates(model));
        // checkDates(model).then((results) => {
        // console.log('temporalAnalysis results', results);
        //     extractedData.temporalAnalysis.push(results)
        // })
        const project = (_a = model.project) !== null && _a !== void 0 ? _a : {}; // Reference the project object
        // Extract scenario names and durations
        if ((_b = project.scenarios) === null || _b === void 0 ? void 0 : _b.scenarios) {
            extractedData.scenarios = project.scenarios.scenarios.map((scenario) => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                const name = (_a = scenario === null || scenario === void 0 ? void 0 : scenario.name) !== null && _a !== void 0 ? _a : "Unknown Scenario";
                const comments = (_b = scenario === null || scenario === void 0 ? void 0 : scenario.comments) !== null && _b !== void 0 ? _b : "";
                const startTimeString = (_e = (_d = (_c = scenario === null || scenario === void 0 ? void 0 : scenario.scenario) === null || _c === void 0 ? void 0 : _c.startTime) === null || _d === void 0 ? void 0 : _d.time) !== null && _e !== void 0 ? _e : "";
                const endTimeString = (_h = (_g = (_f = scenario === null || scenario === void 0 ? void 0 : scenario.scenario) === null || _f === void 0 ? void 0 : _f.endTime) === null || _g === void 0 ? void 0 : _g.time) !== null && _h !== void 0 ? _h : "";
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
        }
        else {
            console.warn("Scenarios data is missing");
        }
        // Extract number and types of ignitions, with lat/long or polygon centroid
        if ((_c = project.ignitions) === null || _c === void 0 ? void 0 : _c.ignitions) {
            extractedData.ignitions = project.ignitions.ignitions.map((ignition) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
                const name = (_a = ignition === null || ignition === void 0 ? void 0 : ignition.name) !== null && _a !== void 0 ? _a : "Unnamed Ignition";
                const ignitionType = (_f = (_e = (_d = (_c = (_b = ignition === null || ignition === void 0 ? void 0 : ignition.ignition) === null || _b === void 0 ? void 0 : _b.ignitions) === null || _c === void 0 ? void 0 : _c.ignitions) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.polyType) !== null && _f !== void 0 ? _f : "Unknown???";
                let location = {
                    type: "Point",
                    coordinates: [0, 0]
                };
                if (ignitionType === 'POINT') {
                    //const point = ignition?.ignition?.ignitions?.[0]?.polygon?.polygon?.points?.[0];
                    const point = (_o = (_m = (_l = (_k = (_j = (_h = (_g = ignition === null || ignition === void 0 ? void 0 : ignition.ignition) === null || _g === void 0 ? void 0 : _g.ignitions) === null || _h === void 0 ? void 0 : _h.ignitions) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.polygon) === null || _l === void 0 ? void 0 : _l.polygon) === null || _m === void 0 ? void 0 : _m.points) === null || _o === void 0 ? void 0 : _o[0];
                    console.log('point', point);
                    location = {
                        type: 'Point',
                        coordinates: [(_q = (_p = point === null || point === void 0 ? void 0 : point.x) === null || _p === void 0 ? void 0 : _p.value) !== null && _q !== void 0 ? _q : 0, (_s = (_r = point === null || point === void 0 ? void 0 : point.y) === null || _r === void 0 ? void 0 : _r.value) !== null && _s !== void 0 ? _s : 0]
                    };
                }
                else if (ignitionType === 'POLYGON') {
                    const points = (_z = (_y = (_x = (_w = (_v = (_u = (_t = ignition === null || ignition === void 0 ? void 0 : ignition.ignition) === null || _t === void 0 ? void 0 : _t.ignitions) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.polygon) === null || _w === void 0 ? void 0 : _w.polygon) === null || _x === void 0 ? void 0 : _x.points) === null || _y === void 0 ? void 0 : _y.map((p) => {
                        var _a, _b, _c, _d;
                        return [
                            (_b = (_a = p === null || p === void 0 ? void 0 : p.x) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0,
                            (_d = (_c = p === null || p === void 0 ? void 0 : p.y) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0
                        ];
                    })) !== null && _z !== void 0 ? _z : [];
                    if (points.length > 0) {
                        const polygon = turf.polygon([points]);
                        const centroid = turf.centroid(polygon);
                        location = {
                            type: 'Point',
                            coordinates: centroid.geometry.coordinates
                        };
                    }
                }
                return {
                    name,
                    type: ignitionType,
                    location
                };
            });
        }
        else {
            console.warn("Ignitions data is missing");
        }
        // Extract burn conditions and the dates they were applied
        if ((_d = project.scenarios) === null || _d === void 0 ? void 0 : _d.scenarios) {
            extractedData.burnConditions = project.scenarios.scenarios.map((scenario) => {
                var _a, _b, _c, _d;
                const scenarioName = (_a = scenario === null || scenario === void 0 ? void 0 : scenario.name) !== null && _a !== void 0 ? _a : "Unnamed Scenario";
                //  console.log( '🔥 scenario.temporalConditions', scenario.temporalConditions);   
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
            });
        }
        else {
            console.warn("Burn conditions data is missing");
        }
        // Extract list of fuel types used
        if ((_e = project.fuelCollection) === null || _e === void 0 ? void 0 : _e.fuels) {
            extractedData.fuelTypes = project.fuelCollection.fuels.map((fuelModel) => {
                var _a, _b;
                return ({
                    name: (_a = fuelModel === null || fuelModel === void 0 ? void 0 : fuelModel.name) !== null && _a !== void 0 ? _a : "Unnamed Fuel",
                    type: (_b = fuelModel === null || fuelModel === void 0 ? void 0 : fuelModel.default) !== null && _b !== void 0 ? _b : "Unknown"
                });
            });
        }
        else {
            console.warn("Fuel models data is missing in fuelCollection");
        }
        return extractedData;
    });
}
let targetPath = './sample_data/jobs/job_20240917144823903/job.fgmj';
//now read the path in as utf8 text.
let fire_model_data_json = require('fs').readFileSync(targetPath, 'utf8');
let fire_model_data = JSON.parse(fire_model_data_json);
extractModelDataFromJob(fire_model_data)
    .then((meaningfulData) => {
    console.log(meaningfulData);
});
