const express = require('express')
const QuizzesController = require('../Controllers/QuizzesController')
const middleware = require('../middlewares/auth-middleware')
const route = express.Router()


route.post('/addQuiz',middleware.authMiddleWare,QuizzesController.addQuiz)
route.get('/addQuiz',middleware.authMiddleWare,QuizzesController.addQuizGet)

route.get('/getCourseQuiz/:course_id',middleware.authMiddleWare, QuizzesController.getCourseQuiz)
route.get('/getQuizGrades/:course_id',middleware.authMiddleWare,QuizzesController.getQuizGrade)

route.post('/gradeQuiz',middleware.authMiddleWare,QuizzesController.gradeQuiz)
route.get('/gradeQuiz',QuizzesController.gradeQuizGet)

route.post('/publishQuiz/:quiz_id',middleware.authMiddleWare, QuizzesController.publishQuizWithSchedule)
route.get('/myCalender',middleware.authMiddleWare, QuizzesController.getCalenderQuizes)


module.exports = route;