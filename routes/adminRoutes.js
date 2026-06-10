import express from 'express'
const router = express.Router()
import adminControler from '../controlers/adminControler.js'
import {isAuthenticated,disableCache} from '../middleware/authMiddleware.js'

router.get("/login",disableCache,adminControler.getAdminLogin)
router.post("/login",adminControler.postAdminLogin)
router.get("/dashboard",disableCache,isAuthenticated,adminControler.getDashboard)
router.post("/logout",isAuthenticated,adminControler.postAdminLogout)
router.get("/block-user/:id",disableCache,isAuthenticated,adminControler.blockUser)
router.get("/unblock-user/:id",disableCache,isAuthenticated,adminControler.unblockUser)

export default router
