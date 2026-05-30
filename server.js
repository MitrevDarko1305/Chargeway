import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import indexRouter from './routes/index.js';
import carsRouter from './routes/cars.js';
import chargersRouter from './routes/chargers.js';
import cookieParser from 'cookie-parser';
import { translations } from './translations.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  const lang = req.cookies.lang || 'en';
  res.locals.lang = lang;
  res.locals.t = translations[lang] || translations['en'];
  res.locals.appName = "Chargeway";
  res.locals.navLinks = lang === 'de' ? [
    { label: 'Startseite', url: '/', icon: 'home' },
    { label: 'Autos', url: '/cars', icon: 'car' },
    { label: 'Ladestationen', url: '/chargers', icon: 'zap' },
    { label: 'Über uns', url: '/about', icon: 'info' },
  ] : [
    { label: 'Home', url: '/', icon: 'home' },
    { label: 'Cars', url: '/cars', icon: 'car' },
    { label: 'Chargers', url: '/chargers', icon: 'zap' },
    { label: 'About', url: '/about', icon: 'info' },
  ];
  res.locals.currentPath = req.path;
  next();
});

app.use('/', indexRouter);
app.use('/cars', carsRouter);
app.use('/chargers', chargersRouter);

app.listen(PORT, () => {
  console.log(`Chargeway running on http://localhost:${PORT}`);
});