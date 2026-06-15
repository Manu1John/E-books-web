import express from 'express'
import adminAuthRoutes from './adminAuthRoutes.js'
import userManagementRoutes from './userManagementRoutes.js'
import categoryRoutes from './categoryRoutes.js'
const router = express.Router()

router.use(adminAuthRoutes)
router.use(userManagementRoutes)
router.use(categoryRoutes)

export default router