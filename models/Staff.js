const connectToDB = require('../db')

async function createStaffTable() {
    
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Staff' AND xtype='U')
      create table Staff (


      staff_id int primary key identity(1,1),
      role varchar(20) CHECK (role IN ('TA','Doctor','admin', 'super_admin')),
      staff_name varchar(30),
      phone varchar(11),
      contact_info varchar(50),
      profile_link varchar(255),
      office_hours datetime,

      staff_email varchar(30) UNIQUE,
      password varchar(64)
      );
    `;
    await db.request().query(q);   
}




async function createStaffAttributesTable() {
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StaffAttributes' AND xtype='U')
    CREATE TABLE StaffAttributes (

      attribute_id INT PRIMARY KEY identity(1,1),
      attribute_name VARCHAR(50) NOT NULL UNIQUE,
      data_type VARCHAR(20) CHECK (data_type in ('string' , 'integer'  , 'decimal' , 'boolean'))
      );

    IF NOT EXISTS (SELECT 1 FROM StaffAttributes WHERE attribute_name = 'rating')
    INSERT INTO StaffAttributes (attribute_name, data_type)
      VALUES ('rating', 'integer');

    IF NOT EXISTS (SELECT 1 FROM StaffAttributes WHERE attribute_name = 'numberOfResearchPapers')  
    INSERT INTO StaffAttributes (attribute_name, data_type)
      VALUES ('numberOfResearchPapers', 'integer');
    
    IF NOT EXISTS (SELECT 1 FROM StaffAttributes WHERE attribute_name = 'specialization')  
    INSERT INTO StaffAttributes (attribute_name, data_type)
    VALUES ('specialization', 'string');

    IF NOT EXISTS (SELECT 1 FROM StaffAttributes WHERE attribute_name = 'remoteWork')
    INSERT INTO StaffAttributes (attribute_name, data_type)
    VALUES ('remoteWork', 'boolean');
  
    `;
    await db.request().query(q);

}


async function createStaffAttributeValuesTable() {
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StaffAttributeValues' AND xtype='U')
    CREATE TABLE StaffAttributeValues (

        staff_id INT,
        attribute_id INT,

        value_string VARCHAR(255) NULL,
        value_int INT NULL ,
        value_decimal DECIMAL(10,2) NULL,
        value_boolean BIT NULL,

        PRIMARY KEY (staff_id, attribute_id),
        FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) on delete cascade,
        FOREIGN KEY (attribute_id) REFERENCES StaffAttributes(attribute_id) on delete cascade
    );
    `;
    await db.request().query(q);
}





async function createStaffCoursesTable() {
    
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StaffCourse' AND xtype='U')
      create table StaffCourse (


      staff_id int not null,
      course_id int not null,


      CONSTRAINT PK_staffCourse PRIMARY KEY (staff_id, course_id),

      CONSTRAINT FK_staffCourse_Course 
            FOREIGN KEY (course_id) REFERENCES Course(course_id)
            ON DELETE CASCADE,

      CONSTRAINT FK_staffCourse_Staff 
            FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
            ON DELETE CASCADE
      );
    `;
    await db.request().query(q);   
}


module.exports = { createStaffTable , createStaffCoursesTable,createStaffAttributesTable,createStaffAttributeValuesTable};