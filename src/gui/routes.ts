import express from 'express';
import passport from 'passport';

export const router = express.Router();

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/map');
  }
  res.render('index');
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/map');
  }
);

router.get('/map', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('map', { user: req.user });
});

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});