import passport from "passport";
import express from "express";
import {
    authenticatedUser,
    disableCache,
} from "../middleware/authMiddleware.js";

import userController from "../controlers/userControler.js";

const router = express.Router();


// INDEX
router.get("/", disableCache, userController.getuserIndex);

// LOGIN
router.get("/login", disableCache, userController.getUserLogin);
router.post("/login", userController.postUserLogin);

// SIGNUP
router.get("/signup-user", disableCache, userController.getUserSignup);
router.post("/signup-user", userController.postUserSignup);

// OTP
router.get("/verify-otp", disableCache, userController.getVerifyOtp);
router.post("/verify-otp", disableCache, userController.verifyOtp);
router.post("/resend-otp", disableCache, userController.resendOtp);

// HOME
router.get("/home",authenticatedUser,disableCache,userController.getHome);
// LOGOUT
router.post("/logout",disableCache,userController.postUserLogout);

// ================= GOOGLE AUTH =================

// Start Google Login
router.get("/auth/google",disableCache,passport.authenticate("google", {scope: ["profile", "email"],prompt: "select_account"}));

// Google Callback
router.get("/auth/google/callback",disableCache,passport.authenticate("google", {failureRedirect: "/login",session: false}),userController.googleAuthCallback);

export default router;