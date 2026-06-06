import express from "express";
import {
    authenticatedUser,
    disableCache,
} from "../middleware/authMiddleware.js";

// 🚨 Check your folder spelling! (controllers vs controlers)
import userController from "../controlers/userControler.js"; 

const router = express.Router();

// LOGIN PAGE
router.get("/", disableCache, userController.getUserLogin);

// SIGNUP PAGE
router.get("/signup-user", disableCache, userController.getUserSignup);

// SIGNUP POST
router.post("/signup-user", userController.postUserSignup);

// LOGIN POST
router.post("/login", userController.postUserLogin);

// HOME (PROTECTED)
router.get("/home", authenticatedUser, disableCache, userController.getHome);
router.get("/verify-otp",disableCache, userController.getVerifyOtp);



// VERIFY OTP POST
router.post("/verify-otp", disableCache, userController.verifyOtp);

// RESEND OTP (POST ONLY)
router.post("/resend-otp", disableCache, userController.resendOtp);

// LOGOUT
router.post("/logout", disableCache, userController.postUserLogout);

export default router;