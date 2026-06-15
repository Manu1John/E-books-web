import express from "express"
import categoryControler from '../../controlers/admin/categoryControler.js'
import {
    disableCache,
    isAuthenticated
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/category",disableCache,isAuthenticated,categoryControler.getCategoryDashboard)
router.get("/add-category",disableCache,isAuthenticated,categoryControler.getAddCategory)
router.post("/add-category",categoryControler.addCategory)
export default router