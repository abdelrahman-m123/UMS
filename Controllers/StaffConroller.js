const connectToDB = require('../db')
const sql = require('mssql/msnodesqlv8')


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



exports.getSingleStaff = async(req,res)=>{
    try{
    const db = await connectToDB();

    //const result = await db.request().query(`select s.staff_id, s.staff_name, s.role, s.phone ,
      //   s.contact_info, s.profile_link, s.office_hours , sc.course_id , c.course_name , c.credit_hours from Staff s join StaffCourse sc 
        // on s.staff_id = sc.staff_id join Course c on sc.course_id = c.course_id ;`)


    const { staff_id } = req.params;


    
    const q = `SELECT 
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
                    )  AS courses
                FROM Staff s where staff_id = @staff_id`;

    const request = await db.request();
    request.input('staff_id',sql.Int, staff_id)
    const result = await request.query(q);


    res.status(201).json({success:true, message:`Staff ${result.recordset[0].staff_name} Info`, result : result.recordset[0]})

    }catch(err){
        console.log(err);
        res.status(500).json({success:false, message:"error while getting staff info"})
    }    

}


exports.editStaff = async (req, res) => {
    if(req.userInfo.role != 'admin')
    {
        return res.status(404).json({sucess:false, message:"Unauthorized, You have to be admin to assign courses"})
    }
    try {
        const db = await connectToDB();
        const {staff_id} = req.params;
        const {staff_name, role, phone, contact_info, profile_link, office_hours,rating,numberOfResearchPapers,specialization,remoteWork } = req.body;

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



        const attrResult = await db.request().query(`
    SELECT attribute_id, attribute_name
    FROM StaffAttributes
    WHERE attribute_name IN (
        'rating',
        'numberOfResearchPapers',
        'specialization',
        'remoteWork'
    )
`);

const attributes = {};
attrResult.recordset.forEach(a => {
    attributes[a.attribute_name] = a.attribute_id;
});

const eavData = [
    { name: 'rating', value: rating, column: 'value_int', type: sql.Int },
    { name: 'numberOfResearchPapers', value: numberOfResearchPapers, column: 'value_int', type: sql.Int },
    { name: 'specialization', value: specialization, column: 'value_string', type: sql.VarChar },
    { name: 'remoteWork', value: remoteWork, column: 'value_boolean', type: sql.Bit }
];

for (const attr of eavData) {
    if (attr.value === undefined) continue;

    const request = db.request();
    request.input('staff_id', sql.Int, staff_id);
    request.input('attribute_id', sql.Int, attributes[attr.name]);
    request.input('val', attr.type, attr.value);

    await request.query(`
        IF EXISTS (
            SELECT 1 FROM StaffAttributeValues
            WHERE staff_id = @staff_id AND attribute_id = @attribute_id
        )
            UPDATE StaffAttributeValues
            SET ${attr.column} = @val
            WHERE staff_id = @staff_id AND attribute_id = @attribute_id
        ELSE
            INSERT INTO StaffAttributeValues (staff_id, attribute_id, ${attr.column})
            VALUES (@staff_id, @attribute_id, @val)
    `);
}




        return res.status(200).json({ success: true, message: "Staff information updated successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Error while updating staff information" });
    }
}

exports.editStaffGet = (req, res) => {
    res.render('editStaffPage');
}

exports.RemoveStaff = async (req,res)=>{
   try{
    const db = await connectToDB();
    const {staff_id} = req.params;
    if(req.userInfo.role != 'admin' && req.userInfo.role != 'super_admin'){
        return res.status(403).json({success:false, message:`Unuathorized `})
    }

    const delrequest = await db.request();
    const q = `delete from Staff where staff_id = @staff_id`;
    delrequest.input('staff_id', sql.Int, staff_id)
    await delrequest.query(q);

    return res.status(200).json({ success: true, message: "staff deleted successfuly " });


   }catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Error while deleting staff " });
    }


}