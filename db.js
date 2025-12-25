const sql = require('mssql/msnodesqlv8');

const config = {
  user: 'ums_user',
  password: 'ums1234',
  server: 'localhost\\SQLEXPRESS',
  database: 'University_Management_System_DB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function connectToDB() {
    try {
        const pool = await sql.connect(config);
        console.log('✅ MSSQL Connected');
        return pool;
    } catch (err) {
        console.error('❌ DB Connection Error:', err.message || err);
        throw err;
    }
}

module.exports = connectToDB;
