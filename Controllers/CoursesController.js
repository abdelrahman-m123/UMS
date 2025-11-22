const connectToDB = require('../db')
const sql = require("mssql/msnodesqlv8");
const multer = require('multer');


exports.addCourse =async (req,res)=>{
    /*if(req.userInfo.role != 'admin' )
    {
        return res.status(404).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to add courses"})
    }*/
    const db = await connectToDB();
    const{course_name, credit_hours } = req.body;

    if(credit_hours !=2 && credit_hours != 3 && credit_hours != 4){
        return res.status(401).json({sucess:false, message:"course credit hours should be 2 or 3 or 4"})
    }
    const q = `insert into Course (course_name, credit_hours) values (@name, @hours)`;

    const request = await db.request();
    request.input("name", sql.VarChar, course_name);
    request.input("hours", sql.Int, credit_hours);
    await request.query(q);

    return res.status(201).json({success:true, message:`${course_name} course added successfully`})
    
}

exports.addCourseGet = (req,res)=>{
    res.render('addCoursePage');
}


exports.removeCourse =async (req,res)=>{
    /*if(req.userInfo.role != 'admin' && req.userInfo.role != 'Doctor')
    {
        return res.status(404).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to remove courses"})
    }*/
    const db = await connectToDB();
    const{course_id } = req.body;

    const q = `delete from Course where course_id = ${course_id};`;
    const x= await db.request().query(q);

    console.log(course_id, x)

    return res.status(201).json({sucess:true, message:`course removed successfully`})
    
}

exports.removeCourseGet = (req,res)=>{
    res.render('removeCoursePage');
}

exports.editCourse = async (req, res) => {
    /*if(req.userInfo.role != 'admin' && req.userInfo.role != 'Doctor')
    {
        return res.status(404).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to edit courses"})
    }*/
    const db = await connectToDB();
    const { course_id, new_course_name, new_credit_hours, new_max_registered_students } = req.body;
    console.log(req)

    // Check if course exists
    const courseCheck = await db.request().query(`SELECT * FROM Course WHERE course_id = ${course_id};`);
    if (courseCheck.recordset.length <= 0) {
        return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Validate credit hours
    if (new_credit_hours && new_credit_hours != 2 && new_credit_hours != 3 && new_credit_hours != 4) {
        return res.status(400).json({ success: false, message: "Course credit hours should be 2, 3, or 4" });
    }

    // Validate max registered students
    if (new_max_registered_students && new_max_registered_students < 0) {
        return res.status(400).json({ success: false, message: "Max registered students cannot be negative" });
    }

    // Build the update query dynamically based on provided fields
    let updateFields = [];

    if (new_course_name) {
        updateFields.push(`course_name = '${new_course_name}'`);
    }
    
    if (new_credit_hours) {
        updateFields.push(`credit_hours = ${new_credit_hours}`);
    }
    
    if (new_max_registered_students !== undefined) {
        updateFields.push(`max_registered_students = ${new_max_registered_students}`);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const q = `UPDATE Course SET ${updateFields.join(', ')} WHERE course_id = ${course_id};`;
    
    try {
        await db.request().query(q);
        return res.status(200).json({ success: true, message: `Course updated successfully` });
    } catch (err) {
        console.log(err);
        // Handle unique constraint violation for course_name
        if (err.message && err.message.includes('unique constraint')) {
            return res.status(400).json({ success: false, message: "Course name already exists" });
        }
        return res.status(500).json({ success: false, message: "Error while updating course" });
    }
}

exports.editCourseGet = (req,res)=>{
    res.render('editCoursePage');
}




exports.getCourse = async (req, res) => {
    const db = await connectToDB();
    const { course_id } = req.query;

    const q = `
        SELECT 
            c.course_id,
            c.course_name,
            c.credit_hours,
            c.registered_students,
            c.max_registered_students,
            s.staff_id,
            s.staff_name,
            s.staff_email,
            s.role as staff_role
        FROM Course c
        LEFT JOIN StaffCourse sc ON c.course_id = sc.course_id
        LEFT JOIN Staff s ON sc.staff_id = s.staff_id
        WHERE c.course_id = @course_id
    `;

    try {
        const request = db.request();
        request.input("course_id", sql.Int, course_id);
        const result = await request.query(q);
        
        if (result.recordset.length > 0) {
            const courseData = {
                course_id: result.recordset[0].course_id,
                course_name: result.recordset[0].course_name,
                credit_hours: result.recordset[0].credit_hours,
                registered_students: result.recordset[0].registered_students,
                max_registered_students: result.recordset[0].max_registered_students,
                assigned_staff: []
            };

            result.recordset.forEach(row => {
                if (row.staff_id) {
                    courseData.assigned_staff.push({
                        staff_id: row.staff_id,
                        staff_name: row.staff_name,
                        staff_email: row.staff_email,
                        staff_role: row.staff_role
                    });
                }
            });

            return res.status(200).json({
                success: true,
                message: `Course info retrieved successfully`,
                course: courseData
            });
        }

        return res.status(404).json({ success: false, message: "Course not found" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error retrieving course information" });
    }
}

exports.CourseGet = (req,res)=>{
    res.render('getCoursePage');
}


exports.getCoursesRegisterationRequests = async(req,res)=>{
    const db = await connectToDB();
    const q = `select * from RegisteredCourses where status='pending';`;
    
    const result = await db.request().query(q);
    return res.status(201).json({success:true, requests: result.recordset[0]});
}



exports.reviewCoursesRegisterationRequests = async (req,res)=>{
    /*if(req.userInfo.role != 'admin' && req.userInfo.role != 'Doctor')
    {
        return res.status(404).json({sucess:false, message:"Unauthorized, You have to be admin or doctor to add courses"})
    }*/
    const db = await connectToDB();
   const {course_id, stu_id , updated_status} = req.body;
   const q = `update RegisteredCourses set status = '${updated_status}' where course_id=${course_id} and stu_id = ${stu_id};`;
   
   await db.request().query(q);
   res.status(201).json({success:true, message: "course request reviewed"});
}



exports.registerCourse = async(req,res)=>{
    const db = await connectToDB();
    // const stu_id = req.userInfo.userId;
    const {course_id, stu_id} = req.body;
    const student = await db.request().query(`select * from Student where stu_id = ${stu_id};`);
    const course = await db.request().query(`select * from Course where course_id = ${course_id};`);

    if(student.recordset.length <= 0 ){
        return res.status(401).json({success:false, message:"student not found"})
    }
    if(course.recordset.length <= 0 ){
        return res.status(201).json({success:false, message:"course not found"})
    }
    const q = `insert into RegisteredCourses(course_id,stu_id) values(${course_id},${stu_id});`;



    await db.request().query(q);
    return res.status(200).json({success:true, message:"Course is registered successfully , waiting for supervisor acceptance "}) 

}




exports.registerCourseGet = (req,res)=>{
    res.render('registerCoursePage');
}

exports.withdrawCourse = async(req,res)=>{
    const db = await connectToDB();
    const stu_id = req.userInfo.userId;
    const {course_id} = req.body;
    const student = await db.request().query(`select * from Student where stu_id = ${stu_id};`);
    const course = await db.request().query(`select * from Course where course_id = ${course_id};`);

    if(student.recordset.length <= 0 ){
        return res.status(401).json({success:false, message:"student not found"})
    }
    if(course.recordset.length <= 0 ){
        return res.status(401).json({success:false, message:"course not found"})
    }
    const q = `delete from RegisteredCourses where course_id = ${course_id} and stu_id = ${stu_id};`;


    await db.request().query(q);
    return res.status(200).json({success:true, message:"Course is withdrew successfully  "}) 

}

exports.withdrawCourseGet = (req,res)=>{
    res.render('withdrawCoursePage');
}





exports.getMyCourses =async (req,res)=>{
    const db = await connectToDB();
    const stu_id = req.query.stu_id;
    console.log(stu_id);
    const result = await db.request().query(`select r.course_id,c.course_name,c.credit_hours from RegisteredCourses r join Course c on r.course_id = c.course_id where stu_id = ${stu_id} and r.status = 'Accepted';`);
    
    if(result.recordset.length >0)
    return res.status(200).json({sucess:true, message:`student courses`, courses : result.recordset})

    return res.status(200).json({sucess:true, message:`you have no accepted Courses`, courses : result.recordset[0]})

}


exports.MyCoursesGet = (req,res)=>{
    res.render('getMyCoursesPage');
}

// exports.getCourse =async (req,res)=>{
//     const db = await connectToDB();
//     const stu_id = req.userInfo.userId;
//     const course_id = req.params.course_id
//     //const result = await db.request().query(`select r.course_id,c.course_name from RegisteredCourses r join Course c on r.Course_id = c.course_id
//         // where stu_id = ${stu_id} and r.status = 'accepted';`);
// const result = await db.request().query(`
//     SELECT 
//         c.course_id,
//         c.course_name,
//         c.credit_hours,
//         cc.file_name,
//         cc.file_data,
//         rc.grade
//     FROM Course c
//     LEFT JOIN CourseContent cc
//         ON c.course_id = cc.course_id
//     LEFT JOIN RegisteredCourses rc
//         ON c.course_id = rc.course_id AND rc.stu_id = ${stu_id}
//     WHERE c.course_id = ${course_id};
//     `);

//     if(result.recordset.length >0)
//     return res.status(200).json({sucess:true, message:`course content`, courses : result.recordset[0]})

//     return res.status(200).json({sucess:true, message:`this course have no content`, courses : result.recordset[0]})

// }


exports.getCourseGet = (req,res)=>{
    res.render('getCoursePage');
}


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadCourseContent  =  async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    try {
        const courseId = req.params.course_id;
        const db = await connectToDB()
        const request = await db.request();
        request.input('course_id', sql.NVarChar, courseId);
        request.input('file_name', sql.NVarChar, req.file.originalname);
        request.input('file_data', sql.VarBinary(sql.MAX), req.file.buffer);
        await request.query(
            'INSERT INTO CourseContent (course_id,file_name, file_data) VALUES (@course_id,@file_name, @file_data)'
        );

        res.send('PDF uploaded successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error uploading PDF');
    }
};

exports.downloadCourseContent = async (req, res) => {
    try {
        const contentId = req.params.content_id;
        const db = await connectToDB();
        const request = await db.request();
        request.input('content_id', sql.Int, contentId);

        const result = await request.query(
            'SELECT file_name, file_data FROM CourseContent WHERE content_id = @content_id'
        );

        if (result.recordset.length === 0) {
            return res.status(404).send('File not found');
        }

        const file = result.recordset[0];
        res.setHeader('Content-Disposition', 'attachment; filename=' + file.file_name);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(file.file_data);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading PDF');
    }
};


exports.gradeCourse = async(req,res)=>{
    try{
    const db = await connectToDB();
    const {stu_id, course_id,grade} = req.body;
    
    await db.request().query(`
        UPDATE RegisteredCourses
        SET grade = '${grade}'
        WHERE stu_id = ${stu_id} AND course_id = ${course_id};
    `);

    res.status(400).send('grade added to the student');
    }
    catch(err){
        console.log(err)
        res.status(400).send('error while grading this student');

    }
}

exports.gradeCourseGet = (req,res)=>{
    res.render('gradeCoursePage');
}

exports.getAllCourses = async (req, res) => {
    try {
        console.log("here")
        const db = await connectToDB();
         const search = req.query.search || "";
        console.log(req.params);
        

        let q = `SELECT course_id, course_name, credit_hours, registered_students, max_registered_students FROM Course`;

        if (search && search.trim() !== '') {
            q += ` WHERE course_name LIKE @search`;
            const request = await db.request();
            request.input("search", sql.VarChar, `%${search}%`);
            const result = await request.query(q);
            return res.status(200).json({ success: true, message: "Courses retrieved", courses: result.recordset });
        }

        const result = await db.request().query(q);
        return res.status(200).json({ success: true, message: "All courses retrieved", courses: result.recordset });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error retrieving courses" });
    }
}

exports.getAllRegisteredCourses = async (req, res) => {
    try {
        const db = await connectToDB();
        const { status, stu_id } = req.query;

        let q = `
            SELECT 
                rc.course_id,
                rc.stu_id,
                rc.status,
                rc.grade,
                c.course_name,
                c.credit_hours,
                c.registered_students,
                c.max_registered_students,
                s.stu_email
            FROM RegisteredCourses rc
            JOIN Course c ON rc.course_id = c.course_id
            JOIN Student s ON rc.stu_id = s.stu_id
        `;

        const request = await db.request();

        // Filter by status if provided
        if (status && status.trim() !== '') {
            q += ` WHERE rc.status = @status`;
            request.input("status", sql.VarChar, status);
        }

        // Filter by student ID if provided
        if (stu_id) {
            if (status && status.trim() !== '') {
                q += ` AND rc.stu_id = @stu_id`;
            } else {
                q += ` WHERE rc.stu_id = @stu_id`;
            }
            request.input("stu_id", sql.Int, stu_id);
        }

        q += ` ORDER BY rc.course_id`;

        const result = await request.query(q);
        
        return res.status(200).json({ 
            success: true, 
            message: "Registered courses retrieved", 
            courses: result.recordset 
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error retrieving registered courses" });
    }
}


exports.assignCourse = async (req, res) => {
    /*if(req.userInfo.role != 'admin')
    {
        return res.status(404).json({sucess:false, message:"Unauthorized, You have to be admin to assign courses"})
    }*/
    const db = await connectToDB();
    const { staff_id, course_id } = req.body;

    // Check if staff exists
    const staffCheck = await db.request().query(`SELECT * FROM Staff WHERE staff_id = ${staff_id};`);
    if (staffCheck.recordset.length <= 0) {
        return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // Check if course exists
    const courseCheck = await db.request().query(`SELECT * FROM Course WHERE course_id = ${course_id};`);
    if (courseCheck.recordset.length <= 0) {
        return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if assignment already exists
    const existingAssignment = await db.request().query(`SELECT * FROM StaffCourse WHERE staff_id = ${staff_id} AND course_id = ${course_id};`);
    if (existingAssignment.recordset.length > 0) {
        return res.status(409).json({ success: false, message: "Course is already assigned to this staff member" });
    }

    const q = `INSERT INTO StaffCourse (staff_id, course_id) VALUES (${staff_id}, ${course_id});`;

    try {
        await db.request().query(q);
        return res.status(201).json({ success: true, message: "Course assigned to staff member successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error assigning course to staff member" });
    }
}

exports.assignCourseGet = (req, res) => {
    res.render('assignCoursePage');
}


exports.unassignCourse = async (req, res) => {
    /*if(req.userInfo.role != 'admin')
    {
        return res.status(404).json({sucess:false, message:"Unauthorized, You have to be admin to unassign courses"})
    }*/
    const db = await connectToDB();
    const { staff_id, course_id } = req.body;

    const q = `DELETE FROM StaffCourse WHERE staff_id = ${staff_id} AND course_id = ${course_id};`;

    try {
        const result = await db.request().query(q);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: "Course assignment not found" });
        }

        return res.status(200).json({ success: true, message: "Course unassigned from staff member successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error unassigning course from staff member" });
    }
}

exports.unassignCourseGet = (req, res) => {
    res.render('unassignCoursePage');
}


exports.getAssignedCourses = async (req, res) => {
    const db = await connectToDB();
    const { staff_id } = req.query;

    // If staff_id is provided, get courses for that specific staff member
    if (staff_id) {
        const q = `
            SELECT 
                sc.staff_id,
                sc.course_id,
                c.course_name,
                c.credit_hours,
                c.registered_students,
                c.max_registered_students,
                s.staff_name,
                s.staff_email
            FROM StaffCourse sc
            JOIN Course c ON sc.course_id = c.course_id
            JOIN Staff s ON sc.staff_id = s.staff_id
            WHERE sc.staff_id = ${staff_id}
        `;

        try {
            const result = await db.request().query(q);
            
            if (result.recordset.length > 0) {
                return res.status(200).json({ 
                    success: true, 
                    message: `Courses assigned to staff member ${staff_id}`, 
                    courses: result.recordset 
                });
            } else {
                return res.status(200).json({ 
                    success: true, 
                    message: `No courses assigned to staff member ${staff_id}`, 
                    courses: [] 
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Error retrieving assigned courses" });
        }
    } else {
        // If no staff_id provided, get all course assignments
        const q = `
            SELECT 
                sc.staff_id,
                sc.course_id,
                c.course_name,
                c.credit_hours,
                c.registered_students,
                c.max_registered_students,
                s.staff_name,
                s.staff_email
            FROM StaffCourse sc
            JOIN Course c ON sc.course_id = c.course_id
            JOIN Staff s ON sc.staff_id = s.staff_id
            ORDER BY sc.staff_id, sc.course_id
        `;

        try {
            const result = await db.request().query(q);
            
            if (result.recordset.length > 0) {
                return res.status(200).json({ 
                    success: true, 
                    message: "All course assignments retrieved", 
                    courses: result.recordset 
                });
            } else {
                return res.status(200).json({ 
                    success: true, 
                    message: "No course assignments found", 
                    courses: [] 
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Error retrieving course assignments" });
        }
    }
}

exports.getAssignedCoursesGet = (req, res) => {
    res.render('getAssignedCoursesPage');
}

exports.getAllRegisteredStudents = async (req, res) => {
    try {
        const db = await connectToDB();
        const { course_id, status } = req.query;

        let q = `
            SELECT 
                rc.course_id,
                rc.stu_id,
                rc.status,
                rc.grade,
                s.stu_name,
                s.stu_email,
                c.course_name
            FROM RegisteredCourses rc
            JOIN Student s ON rc.stu_id = s.stu_id
            JOIN Course c ON rc.course_id = c.course_id
        `;

        const request = db.request();
        const conditions = [];

        // Filter by course_id if provided
        if (course_id) {
            conditions.push(`rc.course_id = @course_id`);
            request.input("course_id", sql.Int, course_id);
        }

        // Filter by status if provided
        if (status && status.trim() !== '') {
            conditions.push(`rc.status = @status`);
            request.input("status", sql.VarChar, status);
        }

        // Add WHERE clause if there are any conditions
        if (conditions.length > 0) {
            q += ` WHERE ${conditions.join(' AND ')}`;
        }

        q += ` ORDER BY rc.course_id, s.stu_name`;

        const result = await request.query(q);
        
        return res.status(200).json({ 
            success: true, 
            message: "Registered students retrieved successfully",
            students: result.recordset 
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false, 
            message: "Error retrieving registered students" 
        });
    }
}