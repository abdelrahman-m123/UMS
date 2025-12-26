const express = require('express')
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const connectToDB = require('./db');

const StudentTable = require('./models/Student.js')
const StaffTable = require('./models/Staff.js')
const CourseTable = require('./models/Course.js')
const QuizTable = require('./models/Quiz.js')
const AnnouncementTable = require('./models/Announcement.js')




const { authMiddleWare } = require('./middlewares/auth-middleware.js');


// routes : 
const authrouter = require('./routes/authRoutes');
const courserouter = require('./routes/courseRoute.js');
const quizrouter = require('./routes/quizRoute.js');
const staffrouter = require('./routes/staffRoute.js');
const announcementsrouter = require('./routes/announcementRoute.js');




const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


const PORT = process.env.PORT || 3001 ;
(async () => {
  try {
    const db = await connectToDB();
    await StudentTable.createStudentTable();
    await StaffTable.createStaffTable();
    await StaffTable.createStaffCoursesTable();
    await StaffTable.createStaffAttributesTable();
    await StaffTable.createStaffAttributeValuesTable();



    await CourseTable.createCourseTable();
    await CourseTable.registerCourseTable();
    await CourseTable.CourseContentTable();

    await QuizTable.createQuizTable();
    await QuizTable.createGradeQuizTable();

    await AnnouncementTable.createAnnouncementTable();





  } catch (err) {
    console.error(' Could not start server due to DB error',err);
  }
})();


app.use('/api/auth',authrouter)
app.use('/course_management',courserouter)
app.use('/course_management/quizzes',quizrouter)
app.use('/Staff_management', staffrouter)
app.use('/announcemnts', announcementsrouter)



app.get('/home',authMiddleWare,(req,res)=>{
  username = req.userInfo.username
  res.render('home',{username})
})

app.listen(PORT,()=>{
    console.log("listening on port ",PORT);
})