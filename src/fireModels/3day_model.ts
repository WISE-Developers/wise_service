import * as modeller from 'wise_js_api';
import * as luxon from 'luxon';
// Type definitions
type TimezoneObject = {
    luxon: string;
    wise: number;
    name: string;
};

type DatasetPath = {
    path: string;
    bbox: string;
    lut: string;
    prj: string;
    elevation: string;
    fuels: string;
};

type WeatherRecord = {
    temp: string;
    rh: string;
    wd: string;
    ws: string;
    precip: string;
    localDate: string;
    localHour: string;
};

type Weather = {
    firstDateLocal: string;
    lastDateLocal: string;
    records: WeatherRecord[];
};

type CFFDRS = {
    cffdrs: {
        ffmc: number | null;
        dmc: number | null;
        dc: number | null;
        rn24?: number;
    };
}; 
const abstract = {
    name: '3 Day Model',
    filename: '3day_model',
    description: 'This is a 3 day model run, using a single ignition geometry and a single weather stream at the ignitioin location.',
    inputs: ['ignition', 'weather', 'modelStart' , 'fireName']

}

const threeDayModel = async (
    timezoneObject: TimezoneObject,
    fireID: string,
    lat: number,
    lon: number,
    ele: number,
    fireGeom: any,
    modelDataset: DatasetPath,
    weather: Weather,
    cffdrs: CFFDRS,
    jobInfo: string
): Promise<any> => {
    console.log('Executing the public model:', { fireID, lat, lon, ele, fireGeom, modelDataset, weather, cffdrs, jobInfo });

    // Set timezone
    luxon.Settings.defaultZone = timezoneObject.luxon;

    // Initialize WISE model
    const prom = new modeller.wise.WISE();

    // Configure model inputs
    prom.setProjectionFile(modelDataset.path + modelDataset.prj);
    prom.setElevationFile(modelDataset.path + modelDataset.elevation);
    prom.setFuelmapFile(modelDataset.path + modelDataset.fuels);
    prom.setLutFile(modelDataset.path + modelDataset.lut);
    prom.setTimezoneByValue(timezoneObject.wise);

    // Add weather data and additional configurations...

    // Check and return the model
    if (!prom.isValid()) {
        throw new Error('Model is not valid');
    }

    return prom;
};



export {abstract, threeDayModel as model}