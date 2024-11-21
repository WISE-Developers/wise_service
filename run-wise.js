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
const models = {};
// load dotenv
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const getFireList = () => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const sourceDataFolder = process.env.CONTAINER_DATASET_PATH;
        console.log("Executing getFireList() async");
        let fireList = [];
        let fh = console.log("Reading fires from ", sourceDataFolder);
        const folders = fs.readdirSync(sourceDataFolder).filter(file => {
            return fs.statSync(path.join(sourceDataFolder, file)).isDirectory();
        });
        for (const folder of folders) {
            console.log("Reading folder:", folder);
            let fire = JSON.parse(fs.readFileSync(`${sourceDataFolder}/${folder}/fire.json`, 'utf8'));
            fireList[folder] = fire;
        }
        resolve(fireList);
    }));
};
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        const { easyPublicModel } = require("./simpleModeller");
        const currentYear = new Date().getFullYear();
        console.clear();
        console.log("Starting Public Modelling");
        console.time("Sequential Modelling Complete.");
        var fireList = yield getFireList();
        console.log("fireList", fireList);
        var currentModel, totalToModel = (Object.keys(fireList).length);
        console.log("Total fires to model:", totalToModel);
        // now model the fires
        currentModel = 1;
        console.log(`Modelling ${totalToModel} fires Sequentially`);
        for (const key in fireList) {
            if (fireList.hasOwnProperty(key)) {
                const liveFire = fireList[key];
                console.log("liveFire", liveFire);
                const liveFireId = yield key;
                liveFire.properties.datasetName = yield liveFireId;
                //   liveFire.properties.number = await liveFireId
                yield console.log("=====================================================");
                yield console.log(`Preparing Model Inputs for ${liveFireId} (${currentModel} of ${totalToModel})`);
                models[liveFireId] = yield easyPublicModel(liveFire, `${liveFireId} (${currentModel} of ${totalToModel})`);
                yield console.log(`COMPLETE: ${liveFireId} (${currentModel} of ${totalToModel})`);
                currentModel++;
            }
        }
        console.timeEnd(" Modelling Complete.");
        console.log("models", models);
        process.exit();
    });
})();
module.exports = {};
