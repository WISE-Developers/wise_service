"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abstract = void 0;
const abstract = {
    name: '24 Hour Model',
    filename: 'matchDrop24h',
    description: 'This is a 24 hour model run, using a single ignition point and a single weather stream at the ignitin location.',
    inputs: ['point-ignition', 'weather', 'modelStart', 'fireName']
};
exports.abstract = abstract;
