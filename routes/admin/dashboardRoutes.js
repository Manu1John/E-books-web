import express from "express";
import {getDashboard} from "../../controlers/admin/dashboardController.js";
import {
    disableCache,
    isAuthenticated
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/dashboard",
    disableCache,
    isAuthenticated,
    getDashboard
);

export default router;