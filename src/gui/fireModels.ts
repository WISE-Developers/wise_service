// function to enumerate the files in the ../fireModels foilder
// and return a list of the files

import fs from 'fs';
import path from 'path';

export function getFireModels() {
  const fireModelsPath = path.join(__dirname, '..', 'fireModels');
    let meta:any[] = []
  const files = fs.readdirSync(fireModelsPath);
  // now dynaically import the abstract object from each file
    // and return a list of the objects, keyed by the filename
    
    for (const file of files) {
        const fireModel = require(path.join(fireModelsPath, file));
        const abstract = fireModel.abstract;
        
        meta.push( abstract);
    }





  return meta;
}
