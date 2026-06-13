import express from "express";
import upload from "../../config/multer.js";
import userController from "../../controlers/userControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/user-profile",
    authenticatedUser,
    userController.getUserProfile
);

router.put(
    "/update-profile",
    authenticatedUser,
    upload.single("profileImage"),
    userController.updateUserProfile
);

router.patch(
    "/change-password",
    authenticatedUser,
    userController.changePassword
);

router.post(
    "/send-email-otp",
    authenticatedUser,
    userController.sendEmailOtp
);

router.patch(
    "/verify-email-otp",
    authenticatedUser,
    userController.verifyEmailOtp
);

export default router;