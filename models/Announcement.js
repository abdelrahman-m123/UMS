const connectToDB = require('../db')

async function createAnnouncementTable(){

    const db = await connectToDB();

     const q = ` 
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Announcement' AND xtype='U')

        create Table Announcement(
        
        ann_id int primary key identity(1,1),
        staff_id int not null ,
        course_id int not null,

        ann_title varchar(50) not null ,
        ann_content varchar(255) not null ,
        ann_date datetime not null default getdate(),

        constraint FK_Announcement_Staff foreign key (staff_id) references Staff(staff_id)
            on delete cascade,
         
        constraint FK_Announcement_Course foreign key (course_id) references Course(course_id)
          on delete cascade    
        
        )
        ;
    `;
    await db.request().query(q)
}

async function createCommentTable(){
    const db = await connectToDB();
    const q = `if not exists (select * from sysobjects where name='Comment' and xtype='U')
    create table Comment (
    comment_id int primary key identity(1,1),
    ann_id int not null,
    commenter_id int not null,
    comment_content varchar(255),

    constraint FK_Comment_Ann foreign key (ann_id) references Announcement(ann_id) on delete cascade,
    constraint FK_Comment_Stu foreign key (commenter_id) references Student(stu_id) on delete cascade,


    );
    `;
    await db.request().query(q)

}
module.exports = {createAnnouncementTable,createCommentTable}