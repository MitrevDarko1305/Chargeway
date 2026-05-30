import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  user:     'darkomitrev',
  host:     'localhost',
  database: 'postgres',
  password: '',
  port:     5432,
});

// Add image_url column if it doesn't exist
await pool.query(`
  ALTER TABLE cars ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)
`);

// Get all distinct make + model combos
const { rows } = await pool.query(`
  SELECT DISTINCT make, model FROM cars Where image_url IS NULL
`);

console.log(`Fetching images for ${rows.length} car models...`);

for (const car of rows) {
  try {
    const query = `${car.make} ${car.model} car`;
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
    });

    const photo = response.data.results[0];
    if (photo) {
      await pool.query(
        `UPDATE cars SET image_url = $1 WHERE make = $2 AND model = $3`,
        [photo.urls.regular, car.make, car.model]
      );
      console.log(`✓ ${car.make} ${car.model}`);
    } else {
      console.log(`✗ No image found for ${car.make} ${car.model}`);
    }

    // Wait 300ms between requests to respect rate limits
    await new Promise(r => setTimeout(r, 300));

  } catch (err) {
    console.error(`Error fetching ${car.make} ${car.model}:`, err.message);
  }
}

console.log('Done!');
pool.end();