"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
//import './passportConfig';
const routes_1 = require("./routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const VIEWS_FOLDER = process.env.WISE_GUI_VIEWS_FOLDER || 'VIEWS_FOLDER_ERROR';
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, VIEWS_FOLDER));
console.log(path_1.default.join(__dirname, '../../public'));
// app.use(
//   session({
//     secret: 'your-secret-key',
//     resave: false,
//     saveUninitialized: true,
//   })
// );
// app.use(passport.initialize());
// app.use(passport.session());
app.use('/', routes_1.router);
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
