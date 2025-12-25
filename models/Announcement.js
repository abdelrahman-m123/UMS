const connectToDB = require('../db')

async function createAnnouncementTable(){

    const db = await connectToDB();

     const q = ` 
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Announcement' AND xtype='U')

        create Table Announcement(
        
        ann_id int primary key identity(1,1),
        staff_id int not null , 
        
        ann_title varchar(50) not null ,
        ann_content varchar(255) not null ,
        ann_date datetime not null default getdate(),

        constraint FK_Announcement_Staff foreign key (staff_id) references Staff(staff_id)
            on delete cascade

        
        )
        ;
    `;
    await db.request().query(q)
}

module.exports = {createAnnouncementTable}