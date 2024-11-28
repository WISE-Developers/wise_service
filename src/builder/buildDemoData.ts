import dotenv from 'dotenv';
import * as path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';

// load dotenv
dotenv.config();

let dataSetPath = `${process.env.WISE_INTERNAL_DATA_FOLDER}/${process.env.WISE_DATASET_FOLDER}`;
// lets make sure that this path exists

if (!fs.existsSync(dataSetPath)) {
    console.error(`The folder ${dataSetPath} does not exist. Please check your .env file.`);
    process.exit(1);
}
else {
    console.log(`The folder ${dataSetPath} exists.`);
}


// cat ./sample_data/wise_demo_data_part-* > ./wise_demo_data.zip


async function concatenateFiles(inputDir: string, outputFile: string, filePattern: RegExp) {
    console.log(`Concatenating files matching ${filePattern} in ${inputDir} into ${outputFile}...`);
    try {
        // Get all files matching the pattern
        const files = fs.readdirSync(inputDir)
            .filter(file => filePattern.test(file)) // Test each file name with the regex
            .sort(); // Ensure files are concatenated in the correct order

        // Create a writable stream for the output file
        const outputStream = fs.createWriteStream(outputFile);

        for (const file of files) {
            const filePath = path.join(inputDir, file);
            console.log(`Appending ${filePath}...`);

            // Create a readable stream for each file
            const inputStream = fs.createReadStream(filePath);

            // Pipe the input stream into the output stream
            await new Promise<void>((resolve, reject) => {
                inputStream.pipe(outputStream, { end: false });
                inputStream.on('end', resolve);
                inputStream.on('error', reject);
            });
        }

        // Close the output stream
        outputStream.end();
        console.log(`All files concatenated into ${outputFile}`);
    } catch (error) {
        console.error('Error concatenating files:', error);
    }
}

// Example usage
const inputDirectory = './sample_data';
const outputZip = dataSetPath + '/wise_demo_data.zip';
const fileRegex = /^wise_demo_data_part-/; // Matches files starting with 'wise_demo_data_part-'



// now we have the outputZip file of the demo data, we need to unzip it in its place.


async function unzipFile(zipFile: string, outputDir: string) {
    try {
        console.log(`Unzipping ${zipFile}...  to ${outputDir}`);

        // Create a readable stream for the zip file
        const readStream = fs.createReadStream(zipFile);

        // Unzip the file to the output directory
        await readStream.pipe(unzipper.Extract({ path: outputDir }));

        console.log(`Unzipped ${zipFile} to ${outputDir}`);
    } catch (error) {
        console.error('Error unzipping file:', error);
    }
}

concatenateFiles(inputDirectory, outputZip, fileRegex);

unzipFile(outputZip, dataSetPath);