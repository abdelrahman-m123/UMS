const sql = require('mssql/msnodesqlv8');


const config = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ABO7EDAR;Database=UMS;Trusted_Connection=Yes;Encrypt=no;TrustServerCertificate=yes;',
  driver: 'msnodesqlv8'
};

async function connectToDB() {
  try {
    let pool = await sql.connect(config);
    console.log('✅ MSSQL Connected');
    return pool;
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    throw err;
  }
}

module.exports = connectToDB;