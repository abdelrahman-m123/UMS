const express = require('express')

const annoucementController = require('../Controllers/AnnouncementController')
const authMiddleWare = require('../middlewares/auth-middleware')


const router = express.Router()

router.post('/createAnnouncement', authMiddleWare.authMiddleWare, annoucementController.CreateAnnouncement)
router.put('/editAnnouncement/:ann_id', authMiddleWare.authMiddleWare, annoucementController.EditAnnouncement)
router.delete('/removeAnnouncement/:ann_id', authMiddleWare.authMiddleWare, annoucementController.RemoveAnnouncement)




module.exports = router