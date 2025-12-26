const connectToDB = require('../db')
const sql = require('mssql/msnodesqlv8')



exports.CreateAnnouncement = async(req,res)=>{
   
    try{
       const db = await connectToDB();
       const {title, content} = req.body;
       const author_role = req.userInfo.role;
       const course_id = req.params.course_id

       const allowedRoles = ['admin', 'Doctor', 'TA', 'super_admin'];

       if (!allowedRoles.includes(author_role)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            }

    const course_req = await db.request();
    course_req.input('course_id',sql.Int, course_id)        
    const course_result = await course_req.query(`select course_name from Course where course_id = @course_id`);
    console.log(course_result)
    if(course_result.recordsets[0] <=0 ){
        return res.status(404).json({
                success: false,
                message: "course id not found "
            });
    }



    const author_id = req.userInfo.userId;

    if(author_id){
        const q =  `insert into Announcement (staff_id,course_id, ann_title , ann_content) values (@staff_id ,@course_id, @ann_title ,@ann_content )`;
        const request = await db.request()
        request.input("staff_id" , sql.Int, author_id);
        request.input("course_id" , sql.Int, course_id);
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

     
    console.log(result.recordset[0])
    if(author_id === result.recordset[0].staff_id ){
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


exports.getCourseAnnouncements = async(req,res)=>{

    try{
        const db = await connectToDB();
        const {course_id} = req.params;

        const request = await db.request()
        const q = `SELECT 
                        s.staff_name,
                        s.staff_email,
                        a.ann_title,
                        a.ann_content,
                        STRING_AGG(c.comment_content, ' | ') AS comments
                        FROM Announcement a
                        JOIN Staff s 
                            ON a.staff_id = s.staff_id
                        LEFT JOIN Comment c
                            ON c.ann_id = a.ann_id
                        GROUP BY 
                            s.staff_name,
                            s.staff_email,
                            a.ann_title,
                            a.ann_content;`;


        request.input('course_id', sql.Int, course_id);
        const result  = await request.query(q);

        return res.status(200).json({success:true, message:`course announcements`, result:result.recordset})

        


    }catch(err){
        console.log(err)
        res.status(500).json({success:fa4lse, message:"error while getting course announcements !!"})
    }

}


///

exports.addCommentToAnnouncement = async(req,res)=>{
   
    try{
       const db = await connectToDB();
       const {content} = req.body;
       const {ann_id} = req.params;

    const ann_req = await db.request();
    ann_req.input('ann_id',sql.Int, ann_id)        
    const ann_result = await ann_req.query(`select  * from Announcement where ann_id = @ann_id`);

    console.log(ann_result)
    if(ann_result.recordsets[0] <=0 ){
        return res.status(404).json({
                success: false,
                message: "Announcement id not found "
            });
    }



    const author_id = req.userInfo.userId;

    if(author_id){
        const q =  `insert into Comment (ann_id,commenter_id, comment_content) values (@ann_id ,@author_id, @comment_content )`;
        const request = await db.request()
        request.input("ann_id" , sql.Int, ann_id);
        request.input("author_id" , sql.Int, author_id);
        request.input("comment_content", sql.VarChar, content);
        
        
        await request.query(q);

    return res.status(201).json({success:true, message:`comment has been added successfully`})

    }else{
    return res.status(403).json({success:false, message:`Unauthorized`})
    }



    }
    catch(err){
        console.log(err)
        res.status(500).json({success:false, message:"error while adding new comment !!"})
    }

}


exports.EditAnnouncementComment = async(req,res)=>{
   
    try{
       const db = await connectToDB();
       const {content} = req.body;
       const {ann_id,comment_id} = req.params
       const author_id = req.userInfo.userId;

        const getCommQ = `select * from Comment where comment_id=@comment_id ;`;
        const s_request = await db.request()
        s_request.input('comment_id',sql.Int, comment_id)
        s_request.input('ann_id',sql.Int, ann_id)
        const result = await s_request.query(getCommQ);
        console.log(result.recordset[0])

     
    if(author_id === result.recordset[0].commenter_id ){
        const q =  `update Comment set comment_content = @comment_content where ann_id = @ann_id  and commenter_id = @commenter_id`;
        const request = await db.request()
        request.input("commenter_id", sql.Int, author_id );
        request.input("ann_id", sql.Int, ann_id );
        request.input("comment_content", sql.VarChar, content);
        
        
        await request.query(q);

    return res.status(201).json({success:true, message:`comment has been updated successfully`})

    }else{
    return res.status(403).json({success:false, message:`Unauthorized. U are not the author of this comment`})
    }


    }
    catch(err){
        console.log(err)
        res.status(500).json({success:false, message:"error while updating the comment !!"})
    }

}


exports.RemoveAnnouncementComment = async(req,res)=>{
   
    try{
       const db = await connectToDB();
       const {ann_id,comment_id} = req.params

  
        const getAnnQ = `select * from Comment where comment_id=@comment_id;`;
        const s_request = await db.request()
        s_request.input('comment_id',sql.Int, comment_id)
        const result = await s_request.query(getAnnQ);
        console.log(result.recordset[0])
   

    const author_id = req.userInfo.userId;

    if(author_id == result.recordset[0].commenter_id ){
        const q =  `delete Comment  where comment_id = @comment_id`;
        const request = await db.request()
        request.input("comment_id", sql.Int, comment_id );        
        
        await request.query(q);

    return res.status(200).json({success:true, message:` comment has been deleted successfully`})

    }else{
    return res.status(403).json({success:false, message:`Unauthorized. U are not the author of this comment`})
    }


    }
    catch(err){
        console.log(err)
        res.status(500).json({success:fa4lse, message:"error while deleting the comment !!"})
    }

}