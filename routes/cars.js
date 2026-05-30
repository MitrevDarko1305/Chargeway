import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const [carsResult, statsResult] = await Promise.all([
    pool.query(`SELECT DISTINCT ON (make, model) * FROM cars WHERE image_url IS NOT NULL ORDER BY make, model, year DESC LIMIT 24`),
    pool.query(`SELECT COUNT(*) as total, COUNT(DISTINCT make) as brands FROM cars`)
  ]);
  res.render('cars', { 
    vehicles: carsResult.rows,
    totalCars: statsResult.rows[0].total,
    totalBrands: statsResult.rows[0].brands,
  });
});

router.get('/api/search', async (req, res) => {
  const { q, style, fuel, price, offset = 0 } = req.query;
  
  let where = ['image_url IS NOT NULL'];
  let params = [];
  let i = 1;

  if (q) { where.push(`(make ILIKE $${i} OR model ILIKE $${i})`); params.push(`%${q}%`); i++; }

  params.push(parseInt(offset));

  const result = await pool.query(
    `SELECT DISTINCT ON (make, model) * FROM cars 
     WHERE ${where.join(' AND ')}
     ORDER BY make, model, year DESC
     LIMIT 24 OFFSET $${i}`,
    params
  );
  res.json(result.rows);
});

export default router;