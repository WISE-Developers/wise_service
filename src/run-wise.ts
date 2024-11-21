export = {}
const models = {};
// load dotenv
require('dotenv').config()
const fs = require('fs')
const path = require('path')

const getFireList = () => {
    return new Promise(async (resolve, reject) => {
      const sourceDataFolder = process.env.CONTAINER_DATASET_PATH
        console.log("Executing getFireList() async");
        let fireList = []
        let fh=console.log("Reading fires from ", sourceDataFolder);
        const folders = fs.readdirSync(sourceDataFolder).filter(file => {
            return fs.statSync(path.join(sourceDataFolder, file)).isDirectory();
        });

  
        for (const folder of folders) {
            console.log("Reading folder:", folder);
            let fire = JSON.parse(fs.readFileSync(`${sourceDataFolder}/${folder}/fire.json`, 'utf8'))
            
            fireList[folder] = fire


        }
        
        resolve(fireList)
    })
}


       





(async function () {
   const {easyPublicModel} = require("./simpleModeller")
    const currentYear = new Date().getFullYear();

     console.clear();

    console.log("Starting Public Modelling");
    console.time("Sequential Modelling Complete.")
    var fireList: any = await getFireList();
    console.log("fireList", fireList);

    var currentModel, totalToModel = (Object.keys(fireList).length)
    console.log("Total fires to model:", totalToModel);

    // now model the fires
    currentModel = 1
    
    console.log(`Modelling ${totalToModel} fires Sequentially`)
   
    for (const key in fireList) {
        if (fireList.hasOwnProperty(key)) {
          const liveFire = fireList[key];
          console.log("liveFire", liveFire);
          const liveFireId = await key
           liveFire.properties.datasetName = await liveFireId
        //   liveFire.properties.number = await liveFireId
          await console.log("=====================================================");
          await console.log(`Preparing Model Inputs for ${liveFireId} (${currentModel} of ${totalToModel})`);
          models[liveFireId] = await easyPublicModel(liveFire, `${liveFireId} (${currentModel} of ${totalToModel})`)
          await console.log(`COMPLETE: ${liveFireId} (${currentModel} of ${totalToModel})`);
          currentModel++
        }
      }


    console.timeEnd(" Modelling Complete.")
    console.log("models", models);
    process.exit()
})();