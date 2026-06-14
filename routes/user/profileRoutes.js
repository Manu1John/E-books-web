import express from "express";
import upload from "../../config/multer.js";
import profileControler from "../../controlers/user/profileControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/user-profile",
    authenticatedUser,
    profileControler.getUserProfile
);

router.put(
    "/update-profile",
    authenticatedUser,
    upload.single("profileImage"),
    profileControler.updateUserProfile
);




export default router;