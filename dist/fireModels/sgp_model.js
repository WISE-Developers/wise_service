"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abstract = void 0;
const abstract = {
    name: 'SGP Model',
    filename: 'sgp_model',
    description: 'This is a Standardized Growth Potential model which is ' +
        'a 24 hour model run, using a single ignition point and a single weather stream ' +
        'at the ignitin location. The single forcast is then altered using the ' +
        '+5temp -5RH as the worst case and -5temp and +5RH as best case. A scenario ' +
        'is output for each case',
    inputs: ['ignition', 'weather', 'modelStart', 'fireName']
};
exports.abstract = abstract;
