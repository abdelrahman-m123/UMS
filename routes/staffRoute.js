const express = require('express')
const StaffConroller = require('../Controllers/StaffConroller')
const middleware = require('../middlewares/auth-middleware')
const route = express.Router()


route.get('/getStaffInfo',middleware.authMiddleWare, StaffConroller.AllStaffInfo)
route.get('/getStaff/:staff_id',middleware.authMiddleWare, StaffConroller.getSingleStaff)
route.put('/editStaff/:staff_id',middleware.authMiddleWare, StaffConroller.editStaff)

route.delete('/deleteStaff/:staff_id',middleware.authMiddleWare, StaffConroller.RemoveStaff)

route.post('/addStudentInfo/:stu_id',middleware.authMiddleWare, StaffConroller.addStuInfo);

module.exports = route;