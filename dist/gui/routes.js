"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const fireModels_1 = require("./fireModels");
dotenv_1.default.config();
const MAP_START_LATITUDE = process.env.MAP_START_LATITUDE;
const MAP_START_LONGITUDE = process.env.MAP_START_LONGITUDE;
const MAP_START_ZOOM = process.env.MAP_START_ZOOM;
exports.router = express_1.default.Router();
// router.get('/', (req, res) => {
//   if (req.isAuthenticated()) {
//     return res.redirect('/map');
//   }
//   res.render('index');
// });
// router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
// router.get(
//   '/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     res.redirect('/map');
//   }
// );
//router.get('/map', (req, res) => {
exports.router.get('/', (req, res) => {
    let fireModelsList = (0, fireModels_1.getFireModels)();
    console.log('fireModelsList', fireModelsList);
    let FIRE_MODEL_LIST = fireModelsList; //JSON.stringify(fireModelsList, null, 2)
    // if (!req.isAuthenticated()) {
    //   return res.redirect('/');
    // }
    //res.render('map', { user: req.user });
    res.render('map', { MAP_START_LATITUDE, MAP_START_LONGITUDE, MAP_START_ZOOM, FIRE_MODEL_LIST });
});
//router.use('/js', express.static(path.join(__dirname, '../../dist/browser')));
// router.get('/logout', (req, res, next) => {
//   req.logout(err => {
//     if (err) return next(err);
//     res.redirect('/');
//   });
//});
