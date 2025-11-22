const connectToDB = require('../db')
const sql = require('mssql/msnodesqlv8')


exports.addQuiz = async(req ,res)=>{
        try {
    const db = await connectToDB();
    const {course_id, quiz_title, google_form_url } = req.body;
    const request = await db.request();
    request.input('course_id',sql.Int, course_id)
    request.input('quiz_title',sql.NVarChar, quiz_title)
    request.input('google_form_url',sql.NVarChar, google_form_url)

    await request.query(`insert into Quiz (course_id, quiz_title, google_form_url) values (@course_id, @quiz_title, @google_form_url);`)

    res.send({message : "quiz is added successfully"})

        } catch (error) {
        console.log(error);
        res.status(500).send("Error adding quiz");
    }

}
exports.addQuizGet = (req,res)=>{
    res.render('addquizPage')
}

exports.getQuizGrade = async(req,res)=>{
    console.log("###")
    const course_id = req.params.course_id;

    try {
        const db = await connectToDB();
        const request = db.request();
                        
        request.input('course_id', sql.Int, course_id);

        const result = await request.query(`
            SELECT q.quiz_id, q.quiz_title, q.google_form_url , gq.quiz_grade
            FROM Quiz q join gradeQuiz gq on q.quiz_id = gq.quiz_id 
            WHERE course_id = @course_id;
        `);

        res.send(result.recordset);
    }catch(err){
        console.log(err);
        res.status(500).send("Error adding quiz");
    }
}

exports.getCourseQuiz = async(req,res)=>{
    console.log("###")
    const course_id = req.params.course_id;

    try {
        const db = await connectToDB();
        const request = db.request();
                        
        request.input('course_id', sql.Int, course_id);

        const result = await request.query(`
            SELECT quiz_id, quiz_title, google_form_url from Quiz 
            WHERE course_id = @course_id;
        `);

        res.send(result.recordset);
    }catch(err){
        console.log(err);
        res.status(500).send("Error adding quiz");
    }
}

exports.getcourseQuizGet = (req,res)=>{
    res.render('getCoursequizzesPage')
}


exports.gradeQuiz = async(req, res) => {
    try {
        const db = await connectToDB();
        const { quiz_id, stu_id, quiz_grade } = req.body;

        // Log the received data for debugging
        console.log("Received data:", { quiz_id, stu_id, quiz_grade });

        // Validate required fields
        if (!quiz_id || !stu_id || !quiz_grade) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields: quiz_id, stu_id, and quiz_grade are required" 
            });
        }

        const request = db.request();
        request.input('quiz_id', sql.Int, quiz_id);
        request.input('stu_id', sql.Int, stu_id);
        request.input('quiz_grade', sql.NVarChar, quiz_grade);

        // Execute the query
        const result = await request.query(`
            INSERT INTO GradeQuiz(quiz_id, stu_id, quiz_grade) 
            VALUES (@quiz_id, @stu_id, @quiz_grade);
        `);

        console.log("Insert result:", result);

        return res.status(201).json({ 
            success: true, 
            message: "Quiz graded successfully" 
        });

    } catch (error) {
        console.error("Error in gradeQuiz:", error);
        
        // Handle specific SQL errors
        if (error.message && error.message.includes('foreign key constraint')) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid student ID or quiz ID. Please check if both exist." 
            });
        }
        
        if (error.message && error.message.includes('primary key constraint')) {
            return res.status(400).json({ 
                success: false, 
                message: "This student already has a grade for this quiz." 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: "Error in grading quiz",
            error: error.message 
        });
    }
}

exports.gradeQuizGet = (req,res)=>{
    res.render('gradequizPage')
}
