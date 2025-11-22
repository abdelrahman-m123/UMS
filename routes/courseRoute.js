const express = require('express')
const CourseCountroller = require('../Controllers/CoursesController')
const middleware = require('../middlewares/auth-middleware')
const route = express.Router()
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

route.post("/addCourse",/*middleware.authMiddleWare,*/CourseCountroller.addCourse);
route.get("/addCourse",/*middleware.authMiddleWare,*/CourseCountroller.addCourseGet);

route.post("/removeCourse",/*middleware.authMiddleWare,*/CourseCountroller.removeCourse);
route.get("/removeCourse",/*middleware.authMiddleWare,*/CourseCountroller.removeCourseGet);

route.put("/editCourse",/*middleware.authMiddleWare,*/CourseCountroller.editCourse);
route.get("/editCourse",/*middleware.authMiddleWare,*/CourseCountroller.editCourseGet);

route.get("/getCourse",/*middleware.authMiddleWare,*/CourseCountroller.getCourse);

route.post("/registerCourse",/*middleware.authMiddleWare,*/CourseCountroller.registerCourse);
route.post("/assignCourse",/*middleware.authMiddleWare,*/CourseCountroller.assignCourse);
route.post("/unassignCourse",/*middleware.authMiddleWare,*/CourseCountroller.unassignCourse);
route.get("/assignedCourse",/*middleware.authMiddleWare,*/CourseCountroller.getAssignedCourses);
route.post("/withdrawCourse",middleware.authMiddleWare,CourseCountroller.withdrawCourse);
route.get("/getAllRegistered", CourseCountroller.getAllRegisteredCourses);
route.get("/getAllRegisteredStudents", CourseCountroller.getAllRegisteredStudents);

route.get("/Courses",/*middleware.authMiddleWare,*/CourseCountroller.registerCourseGet);

route.get("/MyCourses",CourseCountroller.getMyCourses);

route.put("/updateCourseRequest",/*middleware.authMiddleWare,*/CourseCountroller.reviewCoursesRegisterationRequests);
route.get("/updateCourseRequest",/*middleware.authMiddleWare,*/CourseCountroller.getCoursesRegisterationRequests);


route.post('/uploadCourse/:course_id',upload.single('pdf'),CourseCountroller.uploadCourseContent)
route.get('/downloadCourse/:content_id', CourseCountroller.downloadCourseContent);

route.get("/Courses/:course_id",middleware.authMiddleWare,CourseCountroller.getCourse);
route.get("/getAllCourses",CourseCountroller.getAllCourses);

route.post("/gradeCourse",middleware.authMiddleWare,CourseCountroller.gradeCourse);
route.get("/gradeCourse",middleware.authMiddleWare,CourseCountroller.gradeCourseGet);

module.exports = route;