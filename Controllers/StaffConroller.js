const connectToDB = require('../db')



exports.AllStaffInfo = async(req,res)=>{
    try{
    const db = await connectToDB();

    //const result = await db.request().query(`select s.staff_id, s.staff_name, s.role, s.phone ,
      //   s.contact_info, s.profile_link, s.office_hours , sc.course_id , c.course_name , c.credit_hours from Staff s join StaffCourse sc 
        // on s.staff_id = sc.staff_id join Course c on sc.course_id = c.course_id ;`)

    const result = await db.request().query(`SELECT 
                    s.staff_id,
                    s.staff_name,
                    s.role,
                    s.phone,
                    s.contact_info,
                    s.profile_link,
                    s.office_hours,
                    (
                        SELECT 
                            c.course_id,
                            c.course_name,
                            c.credit_hours
                        FROM StaffCourse sc
                        JOIN Course c ON sc.course_id = c.course_id
                        WHERE sc.staff_id = s.staff_id
                        FOR JSON PATH
                    ) AS courses
                FROM Staff s`);

        res.status(201).json({success:true, message:"Staff Info", result : result.recordset})

    }catch(err){
        console.log(err);
        res.status(500).json({success:false, message:"error while getting staff info"})
    }    

}

