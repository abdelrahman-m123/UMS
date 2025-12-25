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
        
        FOREIGN KEY (course_id) REFERENCES Course(course_id)
    );`;
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

module.exports = {createQuizTable , createGradeQuizTable};