const connectToDB = require('../db')
const sql = require('mssql')


exports.addQuiz = async(req ,res)=>{
    if(req.userInfo.role != 'admin' && req.userInfo.role != 'Doctor' && req.userInfo.role != 'TA')
    {
        return res.status(401).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to edit courses"})
    }
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
    if(req.userInfo.role != 'admin' && req.userInfo.role != 'Doctor' && req.userInfo.role != 'TA')
    {
        return res.status(401).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to edit courses"})
    }
    console.log("###")
    const course_id = req.params.course_id;

    try {
        const db = await connectToDB();
        const request = db.request();
                        
        request.input('course_id', sql.Int, course_id);

        const result = await request.query(`
            SELECT q.quiz_id, q.quiz_title, q.google_form_url , gq.quiz_grade, gq.stu_id, s.stu_email, s.stu_name
            FROM Quiz q join GradeQuiz gq on q.quiz_id = gq.quiz_id join Student s on s.stu_id = gq.stu_id
            WHERE course_id = @course_id;
        `);
        console.log(result.recordset);
        console.log("im here");

        res.send(result.recordset);
    }catch(err){
        console.log(err);
        res.status(500).send("Error adding quiz");
    }
}

exports.getCourseQuiz = async(req,res)=>{
    if(req.userInfo.role != 'admin' && req.userInfo.role != 'Doctor' && req.userInfo.role != 'TA' && req.userInfo.role != 'student')
    {
        return res.status(401).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to edit courses"})
    }
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
    if(req.userInfo.role != 'admin' && req.userInfo.role != 'Doctor' && req.userInfo.role != 'TA')
    {
        return res.status(401).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to edit courses"})
    }
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




exports.publishQuizWithSchedule = async (req, res) => {
  try {
    const db = await connectToDB();
    const { quiz_id } = req.params;
    const { open_date, close_date, is_visible } = req.body;



    const quizCheck = await db.request()
      .input('quiz_id', sql.Int, quiz_id)
      .query(`SELECT quiz_id FROM Quiz WHERE quiz_id = @quiz_id`);

    if (quizCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }



    const attributes = {
      open_date,
      close_date,
      is_visible
    };

    for (const [attrName, attrValue] of Object.entries(attributes)) {
      if (attrValue === undefined || attrValue === null) continue;



      const attrRes = await db.request()
        .input('attribute_name', sql.VarChar, attrName)
        .query(`
          SELECT attribute_id, data_type
          FROM QuizAttribute
          WHERE attribute_name = @attribute_name
        `);

      if (attrRes.recordset.length === 0) continue;

      const { attribute_id, data_type } = attrRes.recordset[0];



      const values = {
        value_int: null,
        value_decimal: null,
        value_string: null,
        value_boolean: null,
        value_datetime: null
      };



      switch (data_type) {
        case 'integer':
          values.value_int = attrValue;
          break;
        case 'decimal':
          values.value_decimal = attrValue;
          break;
        case 'boolean':
          values.value_boolean = attrValue;
          break;
        case 'datetime':
          values.value_datetime = attrValue;
          break;
        default:
          values.value_string = attrValue;
      }



      const r = db.request();
      r.input('quiz_id', sql.Int, quiz_id);
      r.input('stu_id', sql.Int, 0);
      r.input('attribute_id', sql.Int, attribute_id);

      r.input('value_int', sql.Int, values.value_int);
      r.input('value_decimal', sql.Decimal(10, 2), values.value_decimal);
      r.input('value_string', sql.VarChar, values.value_string);
      r.input('value_boolean', sql.Bit, values.value_boolean);
      r.input('value_datetime', sql.DateTime, values.value_datetime);

      await r.query(`
        IF EXISTS (
          SELECT 1 FROM QuizAttributeValue
          WHERE quiz_id = @quiz_id
            AND stu_id = @stu_id
            AND attribute_id = @attribute_id
        )
        UPDATE QuizAttributeValue
        SET
          value_int = @value_int,
          value_decimal = @value_decimal,
          value_string = @value_string,
          value_boolean = @value_boolean,
          value_datetime = @value_datetime
        WHERE quiz_id = @quiz_id
          AND stu_id = @stu_id
          AND attribute_id = @attribute_id
        ELSE
        INSERT INTO QuizAttributeValue
        (
          quiz_id, stu_id, attribute_id,
          value_int, value_decimal, value_string,
          value_boolean, value_datetime
        )
        VALUES
        (
          @quiz_id, @stu_id, @attribute_id,
          @value_int, @value_decimal, @value_string,
          @value_boolean, @value_datetime
        )
      `);
    }

    return res.status(200).json({
      success: true,
      message: 'Quiz published successfully',
      schedule: {
        open_date,
        close_date,
        is_visible
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Error publishing quiz'
    });
  }
};


exports.getCalenderQuizes = async(req,res)=>{

    try{
        const db = await connectToDB();
        const stu_id = req.userInfo.userId;

        const stu_check = await db.request();
        const stu_result = await stu_check.input('stu_id',sql.Int, stu_id)
        .query(`select stu_name from Student where stu_id= @stu_id;`);

        if(stu_result.recordset.length == 0){
            return res.status(404).json({success:false, message:"student not found !!"})
        }

        const request = await db.request();
        const result = await request.input('stu_id', sql.Int , stu_id)
        .query(`select c.course_name,q.quiz_id, q.quiz_title, q.google_form_url from RegisteredCourses rc 
            join Course c on c.course_id = rc.course_id 
            join Quiz q on q.course_id = rc.course_id where stu_id=@stu_id ;`);
        
        console.log(result.recordset)
        return res.status(200).json({success:true, result:result.recordset})



     }catch(err){
        console.log(err)
        return res.status(500).json({success:false, message:"error while getting your quizes calender"})
    }

}