import express from "express"
import productControler from '../../controlers/admin/productControler.js'
import {
    disableCache,
    isAuthenticated
} from "../../middleware/authMiddleware.js";
import upload from "../../config/multer.js";
const router = express.Router();

router.get("/products",disableCache,isAuthenticated,productControler.getProductDashboard)
router.get("/add-product",disableCache,isAuthenticated,productControler.getaddProductPage)
router.post("/add-product",upload.array("images",5),disableCache,isAuthenticated,productControler.postAddProductPage)

export default router