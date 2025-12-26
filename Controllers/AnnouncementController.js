const connectToDB = require('../db')
const sql = require('mssql/msnodesqlv8')



exports.CreateAnnouncement = async(req,res)=>{
   
    try{
       const db = await connectToDB();
       const {title, content} = req.body;
       const author_role = req.userInfo.role;
       // const params

       const allowedRoles = ['admin', 'Doctor', 'TA', 'super_admin'];

       if (!allowedRoles.includes(author_role)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            }

    const author_id = req.userInfo.userId;

    if(author_id){
        const q =  `insert into Announcement (staff_id, ann_title , ann_content) values (@staff_id , @ann_title ,@ann_content )`;
        const request = await db.request()
        request.input("staff_id" , sql.Int, author_id);
        request.input("ann_title", sql.VarChar, title);
        request.input("ann_content", sql.VarChar, content);
        
        
        await request.query(q);

    return res.status(201).json({success:true, message:`${title} annoucement has been added successfully`})

    }else{
    return res.status(403).json({success:false, message:`Unauthorized`})
    }



    }
    catch(err){
        console.log(err)
        res.status(500).json({success:false, message:"error while creating new announcement !!"})
    }

}


exports.EditAnnouncement = async(req,res)=>{
   
    try{
       const db = await connectToDB();
       const {title, content} = req.body;
       const {ann_id} = req.params

       const author_role = req.userInfo.role;

       const allowedRoles = ['admin', 'Doctor', 'TA', 'super_admin'];

       if (!allowedRoles.includes(author_role)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            }
        const getAnnQ = `select * from Announcement where ann_id=@ann_id;`;
        const s_request = await db.request()
        s_request.input('ann_id',sql.Int, ann_id)
        const result = await s_request.query(getAnnQ);
        console.log(result.recordset[0])
   
       //return 

    const author_id = req.userInfo.userId;

    if(author_id == result.recordset[0].staff_id ){
        const q =  `update Announcement set ann_title = @ann_title  , ann_content = @ann_content  where ann_id = @ann_id  and staff_id = @staff_id`;
        const request = await db.request()
        request.input("staff_id", sql.Int, author_id );
        request.input("ann_id", sql.Int, ann_id );
        request.input("ann_title", sql.VarChar, title );
        request.input("ann_content", sql.VarChar, content);
        
        
        await request.query(q);

    return res.status(201).json({success:true, message:`${title} annoucement has been updated successfully`})

    }else{
    return res.status(403).json({success:false, message:`Unauthorized. U are not the author of this announcement`})
    }


    }
    catch(err){
        console.log(err)
        res.status(500).json({success:false, message:"error while updating new announcement !!"})
    }

}


exports.RemoveAnnouncement = async(req,res)=>{
   
    try{
       const db = await connectToDB();
       const {ann_id} = req.params

       const author_role = req.userInfo.role;

       const allowedRoles = ['admin', 'Doctor', 'TA', 'super_admin'];

       if (!allowedRoles.includes(author_role)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            }
        const getAnnQ = `select * from Announcement where ann_id=@ann_id;`;
        const s_request = await db.request()
        s_request.input('ann_id',sql.Int, ann_id)
        const result = await s_request.query(getAnnQ);
        console.log(result.recordset[0])
   

    const author_id = req.userInfo.userId;

    if(author_id == result.recordset[0].staff_id ){
        const q =  `delete Announcement  where ann_id = @ann_id and staff_id = @staff_id`;
        const request = await db.request()
        request.input("staff_id", sql.Int, author_id );
        request.input("ann_id", sql.Int, ann_id );        
        
        await request.query(q);

    return res.status(200).json({success:true, message:` annoucement has been deleted successfully`})

    }else{
    return res.status(403).json({success:false, message:`Unauthorized. U are not the author of this announcement`})
    }


    }
    catch(err){
        console.log(err)
        res.status(500).json({success:fa4lse, message:"error while deleting the announcement !!"})
    }

}