const connectToDB = require('../db')

async function createCourseTable() {
    
    const db = await connectToDB();


    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Course' AND xtype='U')
      create table Course (
      course_id int primary key VARCHAR(16) PRIMARY KEY,
      course_name varchar(64) unique,
      credit_hours int check (credit_hours in (2,3,4)),
      registered_students int default 0 ,
      max_registered_students int default 200
      );
    `;
    await db.request().query(q);   
}

async function registerCourseTable() {
    
    const db = await connectToDB();


    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RegisteredCourses' AND xtype='U')
      create table RegisteredCourses (
      course_id int not null,
      stu_id int not null,
      status VARCHAR(10) 
      CONSTRAINT CK_Status CHECK (status IN ('accepted', 'rejected', 'pending'))
      DEFAULT 'pending',
      grade varchar(1) default '-' check(grade in ('F','D','C','B','A','-')) 
      CONSTRAINT PK_RegisteredCourses PRIMARY KEY (course_id, stu_id)
      );
    `;
    await db.request().query(q);   
}

async function CourseContentTable() {
    
    const db = await connectToDB();


    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CourseContent' AND xtype='U')
      create table CourseContent (
      content_id int primary key identity(1,1),
      course_id int not null,
      file_name varchar(100),
      file_data varchar(MAX)
      CONSTRAINT FK_CourseContent_Course
        FOREIGN KEY (course_id) REFERENCES Course(course_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
      );
    `;
    await db.request().query(q);   
}

module.exports = {createCourseTable,registerCourseTable,CourseContentTable};