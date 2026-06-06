import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import connectDB from './config/db.js';

// 🚨 console.log(process.env.BREVO_API_KEY) has been REMOVED for security.
// 🧹 Unused middleware imports were removed from here.

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static files
app.use(express.static(path.join(__dirname, 'public')));

// views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// initalize DB
connectDB();

// session
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'mySecretKey',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hour
            httpOnly: true,
            secure: false, // Set to true if deploying with HTTPS
            sameSite: "lax"
        }
    })
);

// routes
app.use('/admin', adminRoutes);
app.use("/", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started! http://localhost:${PORT}`);
});