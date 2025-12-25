const connectToDB = require('../db')


async function createStudentTable() {
    
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Student' AND xtype='U')
      create table Student (

      stu_id int primary key identity(100,1),
      role varchar(20) CHECK (role = 'student') DEFAULT 'student',

      stu_name varchar(30),
      stu_email varchar(30) UNIQUE,

      password varchar(64),
      verifyAccCode varchar(6),
      isVerified bit default 0,
      verifyAccCodeExpiresAt DATETIME
      );
    `;
    await db.request().query(q);   
}

async function createStudentAttributesTable() {
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StudentAttributes' AND xtype='U')
    CREATE TABLE StudentAttributes (

      attribute_id INT PRIMARY KEY identity(1,1),
      attribute_name VARCHAR(50) NOT NULL UNIQUE,
      data_type VARCHAR(20) CHECK (data_type in ('string' , 'integer'  , 'decimal' , 'boolean'))
      );

    `;
    await db.request().query(q);
}


async function createStudentAttributeValuesTable() {
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StudentAttributeValues' AND xtype='U')
    CREATE TABLE StudentAttributeValues (

        stu_id INT,
        attribute_id INT,

        value_string VARCHAR(255) NULL,
        value_int INT NULL ,
        value_decimal DECIMAL(10,2) NULL,
        value_boolean BIT NULL,

        PRIMARY KEY (stu_id, attribute_id),
        FOREIGN KEY (stu_id) REFERENCES Student(stu_id),
        FOREIGN KEY (attribute_id) REFERENCES StudentAttributes(attribute_id)
    );
    `;
    await db.request().query(q);
}

module.exports = {createStudentTable,createStudentAttributesTable,createStudentAttributeValuesTable};