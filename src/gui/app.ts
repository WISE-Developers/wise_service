import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import dotenv from 'dotenv';
//import './passportConfig';
import { router } from './routes';

dotenv.config();

const app = express();
const VIEWS_FOLDER = process.env.WISE_GUI_VIEWS_FOLDER || 'VIEWS_FOLDER_ERROR';
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, VIEWS_FOLDER));
console.log(path.join(__dirname, '../../public'));


// app.use(
//   session({
//     secret: 'your-secret-key',
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

app.use('/', router);
app.use(express.static(path.join(__dirname, '../../public')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));