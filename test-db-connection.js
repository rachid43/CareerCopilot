import pkg from 'pg';
const { Pool } = pkg;

async function testConnection() {
  console.log('Connection URL format check:');
  const url = process.env.DATABASE_URL;
  console.log('URL contains pooler:', url.includes('pooler'));
  console.log('URL contains port 6543:', url.includes('6543'));
  console.log('URL contains sslmode=require:', url.includes('sslmode=require'));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✓ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('✓ Database version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});