/*
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  user:     'darkomitrev',
  host:     'localhost',
  database: 'postgres',
  password: process.env.DB_Password,
  port:     process.env.DB_PORT,
});

export default pool;
*/

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  user:     process.env.DB_USER || 'darkomitrev',
  host:     process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT || 5432,
});

export default pool;



