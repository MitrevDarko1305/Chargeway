import express from 'express';
import axios from 'axios';
import pool from '../db.js';


const router = express.Router();
router.get('/search', async (req, res) => {
  const q = req.query.q?.trim() || '';
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (make, model) * FROM cars 
       WHERE 
       (
         make  ILIKE $1 OR 
         model ILIKE $1 OR
         vehicle_style ILIKE $1 OR
         fuel_type ILIKE $1 OR
         driven_wheels ILIKE $1
       )
       ORDER BY make, model, year DESC
       LIMIT 50`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

router.get('/', async (req, res) => {
  try {
    const [result, statsResult, popularResult, fuelstatsResult] = await Promise.all([
      pool.query(`SELECT DISTINCT ON (make, model) * FROM cars WHERE image_url IS NOT NULL ORDER BY make, model, year DESC LIMIT 15`),
      pool.query(`SELECT COUNT(*) as total, COUNT(DISTINCT make) as brands, COUNT(*) FILTER (WHERE image_url IS NOT NULL) as with_images, MIN(year) as oldest_year FROM cars`),
      pool.query(`
     SELECT DISTINCT ON (make, model) * FROM cars 
     WHERE image_url IS NOT NULL
     AND (
    (make = 'Aston Martin' AND model = 'V12 Vantage') OR
    (make = 'Aston Martin' AND model = 'Vanquish') OR
    (make = 'Audi' AND model = 'R8') OR
    (make = 'Audi' AND model = 'TT RS') OR
    (make = 'Bentley' AND model = 'Continental GT') OR
    (make = 'Bentley' AND model = 'Mulsanne') OR
    (make = 'BMW' AND model = 'M6') OR
    (make = 'BMW' AND model = '1 Series M') OR
    (make = 'Dodge' AND model = 'Magnum') OR
    (make = 'Ferrari' AND model = '612 Scaglietti') OR
    (make = 'Maserati' AND model = 'Coupe') OR
    (make = 'Mercedes-Benz' AND model = 'SLS AMG') OR
    (make = 'Mercedes-Benz' AND model = 'SLR McLaren') OR
    (make = 'Porsche' AND model = 'Macan') OR
    (make = 'Ferrari' AND model = '575M')
   )
    ORDER BY make, model, msrp DESC
   `),
    pool.query(`
    SELECT fuel_type, COUNT(*) as count, 
    ROUND(AVG(msrp)) as avg_price,
    ROUND(AVG(horsepower)) as avg_hp
    FROM cars 
    WHERE fuel_type IS NOT NULL
    GROUP BY fuel_type 
    ORDER BY count DESC
  `)
    ]);
    console.log('Fuel stats:', fuelstatsResult.rows);
    res.render('index', { 
      vehicles: result.rows, 
      stats: statsResult.rows[0],
      popular: popularResult.rows,
      fuelstats:fuelstatsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/about', (req, res) => {
  res.render('about');
});

router.get('/chargers', async (req, res) => {
  const location = req.query.location || 'Berlin';
  res.render('chargers', { location });
});

router.get('/api/chargers', async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const response = await axios.get('https://api.openchargemap.io/v3/poi', {
      params: {
        key: process.env.OCM_API_KEY,
        latitude: lat,
        longitude: lng,
        distance: 10,
        distanceunit: 'km',
        maxresults: 20,
        compact: true,
        verbose: false,
        output: 'json'
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

router.get('/cars/:makemodel', async (req, res) => {
 const [make, ...modelParts] = req.params.makemodel.split('-');
 const model = modelParts.join('-');

 // Add this DB lookup
  const result = await pool.query(
    `SELECT * FROM cars WHERE make ILIKE $1 AND model ILIKE $2 LIMIT 1`,
    [make, model]
  );
  if (result.rows.length === 0) return res.status(404).send('Vehicle not found');
  const vehicle = result.rows[0];

  let relatedModels = [];
  let vehicleTypes  = [];
  let recalls       = [];

  // Each call is wrapped separately — one timeout won't kill the others
  const fetchWithTimeout = (url, timeout = 5000) => {
    return Promise.race([
      axios.get(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
    ]);
  };

  const [modelsResult, typesResult, recallsResult] = await Promise.allSettled([
    fetchWithTimeout(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${vehicle.make}?format=json`),
    fetchWithTimeout(`https://vpic.nhtsa.dot.gov/api/vehicles/getvehicletypesformake/${vehicle.make}?format=json`),
    fetchWithTimeout(`https://api.nhtsa.gov/recalls/recallsByVehicle?make=${vehicle.make}&model=${encodeURIComponent(vehicle.model)}&modelYear=${vehicle.year}`)
  ]);

  if (modelsResult.status === 'fulfilled') {
    relatedModels = modelsResult.value.data.Results.slice(0, 6);
  }
  if (typesResult.status === 'fulfilled') {
    vehicleTypes = typesResult.value.data.Results;
  }
  if (recallsResult.status === 'fulfilled') {
    recalls = recallsResult.value.data.results?.slice(0, 3) || [];
  }

  res.render('car-details', { vehicle, relatedModels, vehicleTypes, recalls });
});


router.get('/lang/:lang', (req, res) => {
  res.cookie('lang', req.params.lang, { maxAge: 900000000 });
  res.redirect(req.headers.referer  || '/');
});

export default router;


 