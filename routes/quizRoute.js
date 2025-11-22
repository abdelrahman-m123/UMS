const express = require('express')
const QuizzesController = require('../Controllers/QuizzesController')
const middleware = require('../middlewares/auth-middleware')
const route = express.Router()


route.post('/addQuiz',QuizzesController.addQuiz)
route.get('/addQuiz',middleware.authMiddleWare,QuizzesController.addQuizGet)

route.get('/getCourseQuiz/:course_id',QuizzesController.getCourseQuiz)
route.get('/getQuizGrades/:course_id',QuizzesController.getQuizGrade)

route.post('/gradeQuiz',QuizzesController.gradeQuiz)
route.get('/gradeQuiz',QuizzesController.gradeQuizGet)



module.exports = route;