const express = require('express')

const annoucementController = require('../Controllers/AnnouncementController')
const authMiddleWare = require('../middlewares/auth-middleware')


const router = express.Router()

router.post('/createAnnouncement/:course_id', authMiddleWare.authMiddleWare, annoucementController.CreateAnnouncement)
router.put('/editAnnouncement/:ann_id', authMiddleWare.authMiddleWare, annoucementController.EditAnnouncement)
router.delete('/removeAnnouncement/:ann_id', authMiddleWare.authMiddleWare, annoucementController.RemoveAnnouncement)
router.get('/getCourseAnnouncement/:course_id', authMiddleWare.authMiddleWare, annoucementController.getCourseAnnouncements)

router.post('/addComment/:ann_id',authMiddleWare.authMiddleWare, annoucementController.addCommentToAnnouncement)
router.put('/editComment/:ann_id/:comment_id', authMiddleWare.authMiddleWare, annoucementController.EditAnnouncementComment)
router.delete('/removeComment/:ann_id/:comment_id', authMiddleWare.authMiddleWare, annoucementController.RemoveAnnouncementComment)




module.exports = router