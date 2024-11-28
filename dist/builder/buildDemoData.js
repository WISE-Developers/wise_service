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
const path = __importStar(require("path"));
const fs_1 = __importDefault(require("fs"));
const unzipper_1 = __importDefault(require("unzipper"));
// load dotenv
dotenv_1.default.config();
// make sure that the required environment variables are set
if (!process.env.WISE_INTERNAL_DATA_FOLDER || !process.env.WISE_DATASET_FOLDER) {
    console.error('Please set the WISE_INTERNAL_DATA_FOLDER and WISE_DATASET_FOLDER environment variables in your .env file.');
    process.exit(1);
}
let dataSetPath = `${process.env.WISE_INTERNAL_DATA_FOLDER}/${process.env.WISE_DATASET_FOLDER}`;
// lets make sure that this path exists, if not create it
if (!fs_1.default.existsSync(dataSetPath)) {
    console.error(`The folder ${dataSetPath} does not exist.`);
    console.log(`Creating the folder ${dataSetPath}...`);
    fs_1.default.mkdirSync(dataSetPath, { recursive: true });
    console.log(`The folder ${dataSetPath} has been created.`);
}
else {
    console.log(`The folder ${dataSetPath} exists.`);
}
// cat ./sample_data/wise_demo_data_part-* > ./wise_demo_data.zip
async function concatenateFiles(inputDir, outputFile, filePattern) {
    console.log(`Concatenating files matching ${filePattern} in ${inputDir} into ${outputFile}...`);
    try {
        // Get all files matching the pattern
        const files = fs_1.default.readdirSync(inputDir)
            .filter(file => filePattern.test(file)) // Test each file name with the regex
            .sort(); // Ensure files are concatenated in the correct order
        // Create a writable stream for the output file
        const outputStream = fs_1.default.createWriteStream(outputFile);
        for (const file of files) {
            const filePath = path.join(inputDir, file);
            console.log(`Appending ${filePath}...`);
            // Create a readable stream for each file
            const inputStream = fs_1.default.createReadStream(filePath);
            // Pipe the input stream into the output stream
            await new Promise((resolve, reject) => {
                inputStream.pipe(outputStream, { end: false });
                inputStream.on('end', resolve);
                inputStream.on('error', reject);
            });
        }
        // Close the output stream
        outputStream.end();
        console.log(`All files concatenated into ${outputFile}`);
    }
    catch (error) {
        console.error('Error concatenating files:', error);
    }
}
// Example usage
const inputDirectory = './sample_data';
const outputZip = dataSetPath + '/wise_demo_data.zip';
const fileRegex = /^wise_demo_data_part-/; // Matches files starting with 'wise_demo_data_part-'
// now we have the outputZip file of the demo data, we need to unzip it in its place.
async function unzipFile(zipFile, outputDir) {
    try {
        console.log(`Unzipping ${zipFile}...  to ${outputDir}`);
        // Create a readable stream for the zip file
        const readStream = fs_1.default.createReadStream(zipFile);
        // Unzip the file to the output directory
        await readStream.pipe(unzipper_1.default.Extract({ path: outputDir }));
        console.log(`Unzipped ${zipFile} to ${outputDir}`);
    }
    catch (error) {
        console.error('Error unzipping file:', error);
    }
}
concatenateFiles(inputDirectory, outputZip, fileRegex);
unzipFile(outputZip, dataSetPath);
