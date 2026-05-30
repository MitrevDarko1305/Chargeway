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