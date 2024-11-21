"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
//const fetch = require('node-fetch')
require('dotenv').config();
const sourceDataFolder = process.env.CONTAINER_DATASET_PATH;
const luxon_spotwx = require("luxon");
console.clear();
const { resolve } = require('path');
const { readdir, stat } = require('fs').promises;
const fs = require('fs');
const geoTz = require('geo-tz');
const moment = require('moment-timezone');
const localTz = process.env.TZ;
// async reducer
function reduce(asyncIter, f, init) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, asyncIter_1, asyncIter_1_1;
        var _b, e_1, _c, _d;
        let res = init;
        try {
            for (_a = true, asyncIter_1 = __asyncValues(asyncIter); asyncIter_1_1 = yield asyncIter_1.next(), _b = asyncIter_1_1.done, !_b; _a = true) {
                _d = asyncIter_1_1.value;
                _a = false;
                const x = _d;
                res = f(res, x);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_a && !_b && (_c = asyncIter_1.return)) yield _c.call(asyncIter_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return res;
    });
}
const timeZoneLookup = (lat, lon, unixTime) => {
    var timeZoneInfo = geoTz(lat, lon)[0];
    //console.log(timeZoneInfo)
    var timeZoneOffset = moment(parseInt(unixTime) * 1000).tz(timeZoneInfo).format('Z').split(':')[0];
    var timeZoneAbbrv = moment.tz.zone(timeZoneInfo).abbr(parseInt(unixTime) * 1000);
    var timeZoneDate = moment(parseInt(unixTime) * 1000).tz(timeZoneInfo).format('YYYY-MM-DD HH:mm ZZ');
    return {
        name: timeZoneInfo,
        offset: timeZoneOffset,
        tz: timeZoneAbbrv,
        tzDate: timeZoneDate
    };
};
const timeZoneByLatLon = (lat, lon) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Executing timeZoneByLatLon...', lat, lon);
    let tzObj = yield timeZoneLookup(lat, lon, moment().unix());
    return { 'tzObj': tzObj, 'lat': lat, 'lon': lon };
});
const readWxByFireID = (fire, lat, lon) => __awaiter(void 0, void 0, void 0, function* () {
    let fh0 = console.log("Executing getSpotwxByLatLon...", lat, lon);
    let { tzObj } = yield timeZoneByLatLon(lat, lon);
    //     console.log("tzObj",tzObj);
    //     // pause for 10 seconds
    //     await new Promise(resolve => setTimeout(resolve, 10000));
    let latLonTzObj = { lat, lon };
    // check if this is negative    
    const isNeg = tzObj.offset.includes('-');
    let luxonTzString = (isNeg) ? `UTC${parseInt(tzObj.offset)}` : `UTC+${parseInt(tzObj.offset)}`;
    let fh = latLonTzObj.tz = tzObj.offset;
    console.log("luxonTzString", luxonTzString);
    luxon_spotwx.Settings.defaultZoneName = luxonTzString;
    const forecastType = 'gfs';
    const weatherFile = 'SpotWx_Forecast.csv';
    // read the text file
    let forecastCsv = yield fs.readFileSync(`${sourceDataFolder}/${fire}/` + weatherFile, 'utf8');
    let forecastFinalData = yield processSpotwxLatLonData(forecastCsv, lat, lon, localTz, forecastType);
    // get first and last record of the array
    let firstRecord = forecastFinalData[0];
    console.log('firstRecord', firstRecord);
    //await new Promise(resolve => setTimeout(resolve, 10000));
    let [lastRecord] = forecastFinalData.slice(-1);
    // request dates:
    let zoneCode = luxon_spotwx.DateTime.now().offsetNameShort; //=> 'EDT'
    let zoneString = luxon_spotwx.DateTime.now().offsetNameLong;
    console.log("Current Date time in modelling zone :", luxon_spotwx.DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'), `(${luxonTzString})`); //=> '2014 Aug 06'
    let localRequestDate = luxon_spotwx.DateTime.now().toFormat("YYYY-MM-dd");
    let localRequestYear = luxon_spotwx.DateTime.now().toFormat("YYYY");
    let localRequestMonth = luxon_spotwx.DateTime.now().toFormat("mm");
    let localRequestDay = luxon_spotwx.DateTime.now().toFormat("dd");
    let localRequestHour = luxon_spotwx.DateTime.now().toFormat("HH");
    // console.log('firstRecord', firstRecord)
    // console.log('lastRecord', lastRecord)
    let finalForecast = {
        'lat': lat,
        'lon': lon,
        'forecastType': forecastType,
        'localRequestDate': localRequestDate,
        'localRequestYear': localRequestYear,
        'localRequestMonth': localRequestMonth,
        'localRequestDay': localRequestDay,
        'localRequestHour': localRequestHour,
        'firstDateLocal': `${firstRecord.localDate} ${firstRecord.localHour}`,
        'lastDateLocal': `${lastRecord.localDate} ${lastRecord.localHour}`,
        'forecastHours': forecastFinalData.length,
        'records': forecastFinalData,
    };
    return finalForecast;
});
const processSpotwxLatLonData = (forecastCsv, lat, lon, localTz, forecastType) => __awaiter(void 0, void 0, void 0, function* () {
    let forecastRecordsArr = forecastCsv.trim().split('\n');
    let header = forecastRecordsArr.shift().toLowerCase().split(',');
    let forecastData = yield forecastRecordsArr.map(r => {
        // merge header and record to create a value pair object.
        let recArr = r.split(',');
        let newRecord = header.reduce((acc, item, i) => {
            acc[item] = recArr[i];
            return acc;
        }, {});
        // create a moment object for the record date for manipulation
        let recordDateM = moment(newRecord.hourly, "DD/MM/YYYY").add(newRecord.hour, 'hours');
        let localRecordDateM = recordDateM.clone();
        newRecord.lat = lat;
        newRecord.lon = lon;
        newRecord.forecastType = forecastType;
        newRecord.localRequestDate = moment().format("YYYY-MM-DD");
        newRecord.localRequestHour = moment().format("HH");
        newRecord.localTz = localTz;
        newRecord.unixTime = recordDateM.utc().unix();
        //newRecord.unixTimeHelp = "Decode unixTIme to UTC Date: moment.unix(unixTime).utc().format()"
        newRecord.utcDate = recordDateM.utc().format('YYYY-MM-DD');
        newRecord.utcHour = recordDateM.utc().format('HH');
        newRecord.localDate = localRecordDateM.format('YYYY-MM-DD');
        newRecord.localHour = localRecordDateM.format('HH');
        // rename the hourly property.
        //delete Object.assign(newRecord, { ['localDate']: newRecord['hourly'] })['hourly'];
        delete newRecord.hourly;
        delete newRecord.hour;
        // rename the hour property.
        //delete Object.assign(newRecord, { ['localHour']: newRecord['hour'] })['hour'];
        return newRecord;
    });
    return forecastData;
});
module.exports = {
    readWxByFireID: readWxByFireID
};
