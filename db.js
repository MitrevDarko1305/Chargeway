import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT,
});

export default pool;

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

