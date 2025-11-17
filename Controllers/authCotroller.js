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
   user_adder_role = req.userInfo.role;
   console.log(user_adder_role)
   if (user_adder_role === 'super_admin'){
   
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

    const result = await db.request().query(`SELECT * FROM Student WHERE stu_email = '${email}'`);
    
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


exports.student_login = async (req,res)=>{
    try{
       const db = await connectToDB();
       const {email,password} = req.body;

       const result = await db.request()
       .query(`SELECT * FROM Student WHERE stu_email = '${email}'`);


       if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }

       const realpass = result.recordset[0].password;
       //const isValid = await bcrypt.compare(password,realpass);
       const isValid = await doPassValidation(password,realpass)

       if(isValid){

            accessToken = jwt.sign({
            userId : result.recordset[0].stu_id,
            username :result.recordset[0].stu_name,
            role : result.recordset[0].role,
            isVerified:result.recordset[0].isVerified
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
