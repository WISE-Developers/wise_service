import express from 'express';
import passport from 'passport';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const MAP_START_LATITUDE= process.env.MAP_START_LATITUDE
const MAP_START_LONGITUDE= process.env.MAP_START_LONGITUDE 
const MAP_START_ZOOM= process.env.MAP_START_ZOOM


export const router = express.Router();

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
  router.get('/', (req, res) => {
  // if (!req.isAuthenticated()) {
  //   return res.redirect('/');
  // }
  //res.render('map', { user: req.user });
  res.render('map', {MAP_START_LATITUDE, MAP_START_LONGITUDE, MAP_START_ZOOM });
});

//router.use('/js', express.static(path.join(__dirname, '../../dist/browser')));



// router.get('/logout', (req, res, next) => {
//   req.logout(err => {
//     if (err) return next(err);
//     res.redirect('/');
//   });
//});