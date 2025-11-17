const connectToDB = require('../db')

async function createStaffTable() {
    
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Staff' AND xtype='U')
      create table Staff (
      staff_id int primary key identity(1,1),
      role varchar(20) CHECK (role IN ('TA','Doctor','admin', 'super_admin')),
      staff_name varchar(30),
      staff_email varchar(30) UNIQUE,
      password varchar(64)
      );
    `;
    await db.request().query(q);   
}

module.exports = createStaffTable;