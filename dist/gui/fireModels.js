"use strict";
// function to enumerate the files in the ../fireModels foilder
// and return a list of the files
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFireModels = getFireModels;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getFireModels() {
    const fireModelsPath = path_1.default.join(__dirname, '..', 'fireModels');
    let meta = [];
    const files = fs_1.default.readdirSync(fireModelsPath);
    // now dynaically import the abstract object from each file
    // and return a list of the objects, keyed by the filename
    for (const file of files) {
        const fireModel = require(path_1.default.join(fireModelsPath, file));
        const abstract = fireModel.abstract;
        meta.push(abstract);
    }
    return meta;
}
