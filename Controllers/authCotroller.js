const StuModel = require('../models/Student')
const StaffModel = require('../models/Staff')
const CourseModel = require('../models/Course')
const connectToDB = require('../db')
const {signupSchema} = require('../middlewares/validator');
const transport = require('../middlewares/sendMail')
const {doHash,doPassValidation,hmacProcess} = require("../utils/hashing");
const jwt_secret_key = process.env.jwt_secret_key || "elfeel";
const jwt = require('jsonwebtoken');
const { json } = require('body-parser');


exports.add_user = async (req,res)=>{
//    user_adder_role = req.userInfo.role;
//    console.log(user_adder_role)
   if (true){
   
   const db = await connectToDB();
   const {username,email,password,role} = req.body;

   const {error,value} = signupSchema.validate({email,password});
   const hashedPassword = await doHash(password,12);
   if(error){
   return res.status(401).json({success:false, message:"error in validating signing up",error:error.details[0].message});
   }
  
   const result = await db.request().query(`SELECT * FROM Student WHERE stu_email = '${email}'`);
    
   if (result.recordset.length !== 0 ) {
        return res.status(401).json({ message:'user already exists' });
    }
   else{
   if(role == 'student'){
   q = `insert into Student (stu_name,stu_email,password) values('${username}', '${email}', '${hashedPassword}');`;
        await db.request().query(q);

   }else if (role =='TA' || role == 'Doctor' || role == 'admin'){
    q = `insert into Staff  (role, staff_name,staff_email,password) values ('${role}','${username}', '${email}', '${hashedPassword}')`;
        await db.request().query(q);
   }

   return res.status(200).json({"success":true})
}
   }
else{
    return res.status(401).json({"success":false,message: "Un authorized , U have to be super admin"});
}

}


exports.student_signup = async (req,res)=>{
	const db = await connectToDB();
    const {username,email,password} = req.body;
     
    console.log(req.body)

		const {error,value} = signupSchema.validate({email,password});
		if(error){
		return res.status(401).json({success:false, message:"error in validating signing up",error:error.details[0].message});
	    }

    const student = await db.request().query(`SELECT * FROM Student WHERE stu_email = '${email}'`);
    
    if (result.recordset.length !== 0 ) {
        return res.status(401).json({ message:'user already exists' });
      }
	 else{

		// hash the password
		const hashedPassword = await doHash(password,12);
		//console.log(password);
		//console.log(hashedPassword)
        const addNewUserQ = `insert into Student (stu_name,stu_email,password)
        values('${username}','${email}','${hashedPassword}');
        `;
        await db.request().query(addNewUserQ);

		return res.status(200).json({succuss:true,message:"done signing up"})
	 }

}

exports.signup_get = (req,res)=>{
	//res.json({message:"hiiiiiiiiiiiii"});
     res.render('signup')
}


exports.login = async (req,res)=>{
    try{
       const db = await connectToDB();
       const {email,password} = req.body;

       const student = await db.request()
       .query(`SELECT * FROM Student WHERE stu_email = '${email}'`);

       const staff = await db.request().query(`SELECT * FROM Staff WHERE staff_email = '${email}'`)


       if ((student.recordset.length === 0) && (staff.recordset.length === 0)) {
        return res.status(404).json({ message: 'User not found' });
      }else if (student.recordset.length !== 0){
        
      }
      

       const isStudent = (student.recordset.length !== 0) ? true : false;
       const result = isStudent? student: staff;
       const realpass = result.recordset[0].password;
       //const isValid = await bcrypt.compare(password,realpass);
       const isValid = await doPassValidation(password,realpass)

       if(isValid){
            accessToken = jwt.sign({
            userId : isStudent? result.recordset[0].stu_id: result.recordset[0].staff_id,
            username :isStudent? result.recordset[0].stu_name: result.recordset[0].staff_name ,
            role : result.recordset[0].role,
            isVerified:1//result.recordset[0].isVerified
        },jwt_secret_key,{
            expiresIn : '6h'
        });

        res.cookie('authorization', `Bearer ${accessToken}`, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 60 * 60 * 1000
        });

        return res.status(201).json(
            {
                "success":"true",
                "message":"loggged in successfuly",
                accessToken
            }                       
        ); 
       }
       return res.status(401).json({message:"invalid password","success":"false"});

    }catch(e){
        console.log("error",e);
        res.status(401).json({message:"error occured","success":"false"});
    }
}

exports.login_get = (req,res)=>{
    res.render('signin')
}

exports.sendCode = async (req, res) => {
    console.log("######################################################");

    const db = await connectToDB();
    const { email } = req.body;
    console.log(email)
    const result = await db.request()
        .input('email', email)
        .query('SELECT * FROM Student WHERE stu_email = @email;');

    if (result.recordset.length === 0) {
        res.status(401).json({ success: false, message: 'Email is not registered' });
    } else if (result.recordset[0].isVerified == false) {

        const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // 6 digit code
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        let info = await transport.sendMail({
            from: 'UMS@ASU.com',
            to: email,
            subject: "Verification Code",
            html: `<h1>${code}</h1>`
        });
        console.log(info);

        await db.request()
            .input('code', code)
            .input('expiresAt', expiresAt)
            .input('email', email)
            .query('UPDATE Student SET verifyAccCode = @code, verifyAccCodeExpiresAt = @expiresAt WHERE stu_email = @email;');

        res.status(201).json({ success: true, message: 'OTP sent' });
    }
}


exports.verifyCode = async (req,res)=>{

    const db = await connectToDB();
    const {email,OTP} = req.body;
    const result = await db.request().query(`select * from Student where stu_email='${email}';`)
    const expiresAt = new Date(result.recordset[0].verifyAccCodeExpiresAt);

    const now = new Date(Date.now());
    console.log(email,OTP)

    if(result.recordset.length===0){
        console.log("f")
        res.status(401).json({success:false ,message:'email not found '})
    }else if ( (now > expiresAt)){
        console.log("f2")

        res.status(401).json({success:false ,message:'OTP expired'})
    }
    else if (result.recordset[0].isVerified === null || result.recordset[0].isVerified === false  ){
        console.log('not done verified1')

        if(result.recordset[0].verifyAccCode === OTP){
            await db.request().query(`update Student set isVerified=1,verifyAccCode=null ;`);
            console.log('done verified')
            res.status(201).json({success:true ,message:'email verified successfuly '})
        
        }else{
            console.log('not done verified')

        res.status(401).json({success:false ,message:'incorrect OTP'})
        }
    }else{
console.log(now,expiresAt)

    }
}



exports.verifyCodePage = async (req,res)=>{
  res.render('verifyAcc');
}

exports.add_users = async (req, res) => {
    // const user_adder_role = req.userInfo.role;
    // console.log(user_adder_role);
    
    // Authorization check - modify this condition as needed
    if (true) { // Replace with your actual authorization logic
        const db = await connectToDB();
        const { users } = req.body; // Expect array of users

        // Check if users is an array
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ success: false, message: "users must be a non-empty array" });
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < users.length; i++) {
            const { username, email, password, role } = users[i];

            // Validate each user
            const { error } = signupSchema.validate({ email, password });
            if (error) {
                errors.push({ 
                    index: i, 
                    email: email || 'unknown', 
                    message: "error in validating sign up: " + error.details[0].message 
                });
                continue;
            }

            try {
                // Check if user already exists in Student table
                const studentCheck = await db.request()
                    .query(`SELECT * FROM Student WHERE stu_email = '${email}'`);
                
                // Check if user already exists in Staff table  
                const staffCheck = await db.request()
                    .query(`SELECT * FROM Staff WHERE staff_email = '${email}'`);

                if (studentCheck.recordset.length !== 0 || staffCheck.recordset.length !== 0) {
                    errors.push({ 
                        index: i, 
                        email, 
                        message: 'user already exists' 
                    });
                    continue;
                }

                const hashedPassword = await doHash(password, 12);

                if (role === 'student') {
                    const q = `INSERT INTO Student (stu_name, stu_email, password) VALUES ('${username}', '${email}', '${hashedPassword}')`;
                    await db.request().query(q);
                    
                } else if (role === 'TA' || role === 'Doctor' || role === 'admin') {
                    const q = `INSERT INTO Staff (role, staff_name, staff_email, password) VALUES ('${role}', '${username}', '${email}', '${hashedPassword}')`;
                    await db.request().query(q);
                    
                } else {
                    errors.push({ 
                        index: i, 
                        email, 
                        message: 'invalid role' 
                    });
                    continue;
                }

                results.push({ 
                    index: i, 
                    email, 
                    username, 
                    message: 'added successfully' 
                });

            } catch (err) {
                console.error(`Error adding user ${email}:`, err);
                errors.push({ 
                    index: i, 
                    email, 
                    message: 'database error: ' + err.message 
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Processed ${users.length} users. Added: ${results.length}, Failed: ${errors.length}`,
            added: results,
            failed: errors
        });

    } else {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized, You have to be super admin" 
        });
    }
};



exports.getAllStaff = async (req, res) => {
    try {
        console.log("here")
        const db = await connectToDB();
        const search = req.query.search || "";
        const role = req.query.role || "";
        console.log(req.query);

        let q = `SELECT staff_id, role, staff_name, staff_email, phone, contact_info, office_hours FROM Staff WHERE 1=1`;
        const request = db.request();

        // Add role filter if provided
        if (role && role.trim() !== '') {
            q += ` AND role = '${role}'`;
        }

        // Add email/name search if provided
        if (search && search.trim() !== '') {
            q += ` AND (staff_email LIKE'%${search}%' OR staff_name LIKE '%${search}%')`;
        }

        // Add ordering
        q += ` ORDER BY staff_name`;

        const result = await request.query(q);
        return res.status(200).json({ success: true, message: "Staff retrieved", staff: result.recordset });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error retrieving staff" });
    }
}
exports.editStaff = async (req, res) => {
    try {
        const db = await connectToDB();
        const { staff_id, staff_name, role, phone, contact_info, profile_link, office_hours } = req.body;

        // Check if staff exists
        const staffCheck = await db.request().query(`SELECT * FROM Staff WHERE staff_id = ${staff_id};`);
        if (staffCheck.recordset.length <= 0) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        // Validate required fields
        if (!staff_name || !role) {
            return res.status(400).json({ success: false, message: "Staff name and role are required" });
        }

        // Validate role
        const validRoles = ['TA', 'Doctor', 'admin', 'super_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role. Must be TA, Doctor, admin, or super_admin" });
        }

        // Build the update query dynamically based on provided fields
        let updateFields = [];

        if (staff_name) {
            updateFields.push(`staff_name = '${staff_name}'`);
        }
        
        if (role) {
            updateFields.push(`role = '${role}'`);
        }
        
        if (phone !== undefined) {
            updateFields.push(`phone = '${phone}'`);
        }
        
        if (contact_info !== undefined) {
            updateFields.push(`contact_info = '${contact_info}'`);
        }
        
        if (profile_link !== undefined) {
            updateFields.push(`profile_link = '${profile_link}'`);
        }
        
        if (office_hours !== undefined) {
            updateFields.push(`office_hours = '${office_hours}'`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const q = `UPDATE Staff SET ${updateFields.join(', ')} WHERE staff_id = ${staff_id}`;

        await db.request().query(q);

        return res.status(200).json({ success: true, message: "Staff information updated successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Error while updating staff information" });
    }
}

exports.editStaffGet = (req, res) => {
    res.render('editStaffPage');
}