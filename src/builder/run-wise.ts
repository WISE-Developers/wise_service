import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

interface FireProperties {
    datasetName?: string;
    [key: string]: any;
}

interface Fire {
    properties: FireProperties;
    [key: string]: any;
}

interface FireList {
    [folder: string]: Fire;
}

const models: { [key: string]: any } = {};

// Function to get the fire list
const getFireList = async (): Promise<FireList> => {
    const sourceDataFolder = process.env.CONTAINER_DATASET_PATH;

    if (!sourceDataFolder) {
        throw new Error('CONTAINER_DATASET_PATH is not defined in the environment variables.');
    }

    console.log("Executing getFireList() async");
    const fireList: FireList = {};

    console.log("Reading fires from ", sourceDataFolder);
    const folders = fs.readdirSync(sourceDataFolder).filter(file =>
        fs.statSync(path.join(sourceDataFolder, file)).isDirectory()
    );

    for (const folder of folders) {
        console.log("Reading folder:", folder);
        const fireData = fs.readFileSync(`${sourceDataFolder}/${folder}/fire.json`, 'utf8');
        fireList[folder] = JSON.parse(fireData);
    }

    return fireList;
};

// Main function
(async function () {
    //const { easyPublicModel } = await import('./simpleModeller');
    const simpleModeller = await import('./simpleModeller');
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
            models[key] = await easyPublicModel(
                liveFire,
                `${key} (${currentModel} of ${totalToModel})`
            );
            console.log(`COMPLETE: ${key} (${currentModel} of ${totalToModel})`);
            currentModel++;
        }
    }

    console.timeEnd("Sequential Modelling Complete.");
    console.log("models", models);
    process.exit();
})();