const connectToDB = require('../db')

async function createCourseTable() {
    
    const db = await connectToDB();


    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Course' AND xtype='U')
      create table Course (
      course_id int PRIMARY KEY,
      course_name varchar(64) unique,
      credit_hours int check (credit_hours in (2,3,4)),
      registered_students int default 0 ,
      max_registered_students int default 200
      );
    `;
    await db.request().query(q);   
}

async function createCourseAttributeTable(){
  const db = await connectToDB();

  const q = `    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CourseAttribute' AND xtype='U')
  
     create table CourseAttribute(

      attribute_id int PRIMARY KEY identity(1,1),
      attribute_name VARCHAR(50) NOT NULL UNIQUE,
      data_type VARCHAR(20) CHECK (data_type in ('string' , 'integer' , 'decimal' , 'boolean'))
      


     );
  `;
  await db.request().query(q);
}

async function createCourseAttributeValuesTable(){
  const db = await connectToDB();

  const q = `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CourseAttributeValues' AND xtype='U')
             create table CourseAttributeValues(

               course_id int not null ,
               attribute_id int not null,
               value_string VARCHAR(255) NULL,
               value_int int NULL,
               value_decimal decimal(10,2) NULL,
               value_boolean BIT NULL,

               PRIMARY KEY (course_id , attribute_id),
               FOREIGN KEY (course_id) references Course(course_id),
               FOREIGN KEY (attribute_id) references CourseAttribute(attribute_id)

             )
  `;
  await db.request().query(q);

}




////


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


      grade varchar(1) default '-' check(grade in ('F','D','C','B','A','-')),
      
      
      CONSTRAINT PK_RegisteredCourses PRIMARY KEY (course_id, stu_id),

      CONSTRAINT FK_RegisteredCourses_course FOREIGN KEY (course_id) references Course(course_id),
      constraint FK_RegisteredCourses_student FOREIGN KEY (stu_id) references Student(stu_id)
      );
    `;
    await db.request().query(q);   
}



async function registerCourseAttributTable() {
    
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RegisteredCourseAttribute' AND xtype='U')
     create table RegisteredCourseAttribute(

      attribute_id int PRIMARY KEY identity(1,1),
      attribute_name VARCHAR(50) NOT NULL UNIQUE,
      data_type VARCHAR(20) CHECK (data_type in ('string' , 'integer' , 'decimal' , 'boolean'))
      
     );

        IF NOT EXISTS (SELECT 1 FROM RegisteredCourseAttribute WHERE attribute_name = 'midterm_grade')  
    INSERT INTO RegisteredCourseAttribute (attribute_name, data_type)
      VALUES ('midterm_grade', 'integer');  

    IF NOT EXISTS (SELECT 1 FROM RegisteredCourseAttribute WHERE attribute_name = 'classwork_grade')  
    INSERT INTO RegisteredCourseAttribute (attribute_name, data_type)
      VALUES ('classwork_grade', 'integer');
    
    IF NOT EXISTS (SELECT 1 FROM RegisteredCourseAttribute WHERE attribute_name = 'quizes_grade')  
    INSERT INTO RegisteredCourseAttribute (attribute_name, data_type)
      VALUES ('quizes_grade', 'integer');
  `;
    await db.request().query(q);   

}

async function registerCourseAttributeValuesTable() {
    
    const db = await connectToDB();

    const q = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RegisteredCourseAttributeValue' AND xtype='U')
      create table RegisteredCourseAttributeValue(
        stu_id int not null,
        course_id int not null,
        attribute_id int not null,

        value_string VARCHAR(255) NULL,
        value_int INT NULL,
        value_decimal DECIMAL(10,2) NULL,
        value_boolean BIT NULL,
        
        
        PRIMARY KEY (course_id, stu_id, attribute_id),

        FOREIGN KEY (course_id, stu_id)
          REFERENCES RegisteredCourses(course_id, stu_id), 
          
        
        FOREIGN KEY (attribute_id)
          REFERENCES RegisteredCourseAttribute(attribute_id)
        
         
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
      file_data varchar(MAX),
      CONSTRAINT FK_CourseContent_Course
        FOREIGN KEY (course_id) REFERENCES Course(course_id)
            ON DELETE CASCADE
      );
    `;
    await db.request().query(q);   
}



module.exports = {createCourseTable,createCourseAttributeTable,createCourseAttributeValuesTable,  
                  registerCourseTable,registerCourseAttributTable,registerCourseAttributeValuesTable,
                  CourseContentTable};