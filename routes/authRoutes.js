const express = require('express')
const authController = require('../Controllers/authCotroller')
const router = express.Router();
//const {identifier,verifyToken,authenticateToken} = require("../middlewares/identification")
//const verifyRole = require('../middlewares/roleMW');
const middleware = require("../middlewares/auth-middleware");


//router.post('/signup',authController.student_signup);
//router.get("/signup",authController.signup_get);

router.post('/addUser'/*,middleware.authMiddleWare  */,authController.add_users);
router.put('/editStaff'/*,middleware.authMiddleWare  */,authController.editStaff);

router.post('/login',authController.login);
router.get("/login",authController.login_get);
router.get("/getAllStaff",authController.getAllStaff);

router.post('/login',authController.login);
router.get("/login",authController.login_get);

router.post('/logout', (req, res) => {
    res.cookie('authorization', '', { expiresIn: new Date(0) })
  return res.redirect('/api/auth/login');
});

router.post('/sendOTP',middleware.authMiddleWare,authController.sendCode);
router.post('/verifyOTP',middleware.authMiddleWare,authController.verifyCode);
router.get('/verifyOTP',middleware.authMiddleWare,authController.verifyCodePage);


module.exports = router;