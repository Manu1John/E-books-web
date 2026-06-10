import express from 'express'
const router = express.Router()
import adminControler from '../controlers/adminControler.js'
import {isAuthenticated,disableCache} from '../middleware/authMiddleware.js'

const markAdminAuthPage = (req, res, next) => {
    if (
        req.method === "GET" &&
        req.path === "/login"
    ) {
        res.locals.authFlowGuard = true;
        res.locals.noStorePage = true;
    }

    next();
}

router.use(markAdminAuthPage)

router.get("/login",disableCache,adminControler.getAdminLogin)
router.post("/login",adminControler.postAdminLogin)
router.get("/dashboard",disableCache,isAuthenticated,adminControler.getDashboard)
router.post("/logout",isAuthenticated,adminControler.postAdminLogout)
router.get("/block-user/:id",disableCache,isAuthenticated,adminControler.blockUser)
router.get("/unblock-user/:id",disableCache,isAuthenticated,adminControler.unblockUser)

export default router
