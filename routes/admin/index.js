import express from 'express'
import adminAuthRoutes from './adminAuthRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'
import userManagementRoutes from './userManagementRoutes.js'

const router = express.Router()

router.use(adminAuthRoutes)
router.use(dashboardRoutes)
router.use(userManagementRoutes)

export default router