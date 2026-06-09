import passport from "passport";
import express from "express";

import upload from "../config/multer.js";
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
//USER PROFILE
router.get("/user-profile",authenticatedUser,disableCache,userController.getUserProfile);

// LOGOUT
router.post("/logout",disableCache,userController.postUserLogout);

// ================= GOOGLE AUTH =================

// Start Google Login
router.get("/auth/google",disableCache,passport.authenticate("google", {scope: ["profile", "email"],prompt: "select_account"}));

// Google Callback
router.get("/auth/google/callback",disableCache,passport.authenticate("google", {failureRedirect: "/login",session: false}),userController.googleAuthCallback);


// --- FACEBOOK AUTHENTICATION ROUTES ---


// 1. Trigger Facebook Login screen
router.get("/auth/facebook", disableCache, passport.authenticate("facebook", {
    scope: ["email"],
    authType: "reauthenticate" // 🔥 THIS is the magic word that forces a new login!
}));

// 2. Handle the incoming redirect back from Facebook
router.get("/auth/facebook/callback", 
    passport.authenticate("facebook", { failureRedirect: "/", session: false }), 
    userController.facebookAuthCallback
);

// ================= FORGOT PASSWORD =================

// Forgot password page
router.get(
    "/forgot-password",

    disableCache,

    userController
        .getForgotPassword
);


// Send OTP
router.post(
    "/forgot-password",

    userController
        .postForgotPassword
);


// Verify forgot OTP page
router.get(
    "/verify-forgot-otp",

    disableCache,

    userController
        .getForgotOtpPage
);


// Verify OTP
router.post(
    "/verify-forgot-otp",

    userController
        .verifyForgotOtp
);


// Reset password page
router.get(
    "/reset-password",

    disableCache,

    userController
        .getResetPassword
);


// Save new password
router.post(
    "/reset-password",

    userController
        .postResetPassword
);

// Resend Forgot Password OTP
router.post("/resend-forgot-otp", disableCache, userController.resendForgotOtp);
router.post("/update-profile",upload.single("profileImage"),userController.updateUserProfile);

export default router;