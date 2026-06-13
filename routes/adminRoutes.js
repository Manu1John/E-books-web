import express from 'express'
const router = express.Router()
import adminControler from '../controlers/adminControler.js'
import {isAuthenticated,disableCache,markAdminAuthPage} from '../middleware/authMiddleware.js'



router.use(markAdminAuthPage)

router.get("/login",markAdminAuthPage,disableCache,adminControler.getAdminLogin)
router.post("/login",adminControler.postAdminLogin)
router.get("/dashboard",disableCache,isAuthenticated,adminControler.getDashboard)
router.post("/logout",isAuthenticated,adminControler.postAdminLogout)
router.patch("/block-user/:id",disableCache,isAuthenticated,adminControler.blockUser)
router.patch("/unblock-user/:id",disableCache,isAuthenticated,adminControler.unblockUser)

export default router
