"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
exports.router = express_1.default.Router();
exports.router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/map');
    }
    res.render('index');
});
exports.router.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile'] }));
exports.router.get('/auth/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/map');
});
exports.router.get('/map', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('map', { user: req.user });
});
exports.router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err)
            return next(err);
        res.redirect('/');
    });
});
