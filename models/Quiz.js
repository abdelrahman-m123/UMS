const connectToDB = require('../db')

async function createQuizTable() {
    
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Quiz' AND xtype='U')
    CREATE TABLE Quiz (
        quiz_id INT IDENTITY(1,1) PRIMARY KEY,
        course_id INT NOT NULL,
        quiz_title NVARCHAR(100),
        google_form_url NVARCHAR(500),
        max_grade int not null constraint df_quiz_maxGrade default 10 check (max_grade > 0),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (course_id) REFERENCES Course(course_id)
    );`;
    await db.request().query(q);   
}



async function createQuizAttributeTable() {
  const db = await connectToDB();

  const q = `
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QuizAttribute' AND xtype='U')
  CREATE TABLE QuizAttribute (


    attribute_id INT IDENTITY(1,1) PRIMARY KEY,
    attribute_name VARCHAR(50) UNIQUE NOT NULL,
    data_type VARCHAR(20)
      CHECK (data_type IN ('string','integer','decimal','boolean','datetime'))

  );

  IF NOT EXISTS (SELECT 1 FROM QuizAttribute WHERE attribute_name = 'open_date')
    INSERT INTO QuizAttribute VALUES ('open_date','datetime');

  IF NOT EXISTS (SELECT 1 FROM QuizAttribute WHERE attribute_name = 'close_date')
    INSERT INTO QuizAttribute VALUES ('close_date','datetime');
  
   IF NOT EXISTS (SELECT 1 FROM QuizAttribute WHERE attribute_name = 'accuracy_rate')
    INSERT INTO QuizAttribute VALUES ('accuracy_rate','decimal');   

   IF NOT EXISTS (SELECT 1 FROM QuizAttribute WHERE attribute_name = 'questions_answered')
    INSERT INTO QuizAttribute VALUES ('questions_answered','integer');

   IF NOT EXISTS (SELECT 1 FROM QuizAttribute WHERE attribute_name = 'is_visible')
    INSERT INTO QuizAttribute VALUES ('is_visible','boolean');
     
  `;

  await db.request().query(q);
}



async function createQuizAttributeValueTable() {
  const db = await connectToDB();

  const q = `
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QuizAttributeValue' AND xtype='U')
  CREATE TABLE QuizAttributeValue (

    quiz_id INT NOT NULL,
    stu_id INT NOT NULL,
    attribute_id INT NOT NULL,

    value_int INT NULL,
    value_decimal DECIMAL(10,2) NULL,
    value_string VARCHAR(255) NULL,
    value_boolean BIT NULL,
    value_datetime DATETIME NULL,

    PRIMARY KEY (quiz_id, stu_id, attribute_id),

    FOREIGN KEY (quiz_id) REFERENCES Quiz(quiz_id),
    FOREIGN KEY (attribute_id) REFERENCES QuizAttribute(attribute_id)
  );
  `;
  await db.request().query(q);
}


async function createGradeQuizTable() {
    
    const db = await connectToDB();

    const q = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GradeQuiz' AND xtype='U')
    CREATE TABLE GradeQuiz (

        quiz_id INT NOT NULL,
        stu_id INT NOT NULL,
        quiz_grade INT ,

        CONSTRAINT PK_GradeQuiz PRIMARY KEY (quiz_id, stu_id),

        CONSTRAINT FK_GradeQuiz_Quiz 
            FOREIGN KEY (quiz_id) REFERENCES Quiz(quiz_id),

        CONSTRAINT FK_GradeQuiz_Student 
            FOREIGN KEY (stu_id) REFERENCES Student(stu_id)
    );`;
    await db.request().query(q);   
} 



module.exports = {createQuizTable , createQuizAttributeTable , createGradeQuizTable ,createQuizAttributeValueTable};