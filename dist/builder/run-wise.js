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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
const models = {};
// Function to get the fire list
const getFireList = async () => {
    const sourceDataFolder = process.env.CONTAINER_DATASET_PATH;
    if (!sourceDataFolder) {
        throw new Error('CONTAINER_DATASET_PATH is not defined in the environment variables.');
    }
    console.log("Executing getFireList() async");
    const fireList = {};
    console.log("Reading fires from ", sourceDataFolder);
    const folders = fs_1.default.readdirSync(sourceDataFolder).filter(file => fs_1.default.statSync(path_1.default.join(sourceDataFolder, file)).isDirectory());
    for (const folder of folders) {
        console.log("Reading folder:", folder);
        const fireData = fs_1.default.readFileSync(`${sourceDataFolder}/${folder}/fire.json`, 'utf8');
        fireList[folder] = JSON.parse(fireData);
    }
    return fireList;
};
// Main function
(async function () {
    //const { easyPublicModel } = await import('./simpleModeller');
    const simpleModeller = await Promise.resolve().then(() => __importStar(require('./simpleModeller')));
    const { easyPublicModel } = simpleModeller.default;
    const currentYear = new Date().getFullYear();
    console.clear();
    console.log("Starting Public Modelling");
    console.time("Sequential Modelling Complete.");
    const fireList = await getFireList();
    console.log("fireList", fireList);
    const totalToModel = Object.keys(fireList).length;
    console.log("Total fires to model:", totalToModel);
    // Model fires sequentially
    let currentModel = 1;
    console.log(`Modelling ${totalToModel} fires Sequentially`);
    for (const key in fireList) {
        if (Object.prototype.hasOwnProperty.call(fireList, key)) {
            const liveFire = fireList[key];
            console.log("liveFire", liveFire);
            liveFire.properties.datasetName = key;
            console.log("=====================================================");
            console.log(`Preparing Model Inputs for ${key} (${currentModel} of ${totalToModel})`);
            models[key] = await easyPublicModel(liveFire, `${key} (${currentModel} of ${totalToModel})`);
            console.log(`COMPLETE: ${key} (${currentModel} of ${totalToModel})`);
            currentModel++;
        }
    }
    console.timeEnd("Sequential Modelling Complete.");
    console.log("models", models);
    process.exit();
})();
