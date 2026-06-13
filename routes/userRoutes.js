import passport from "passport";
import express from "express";

import upload from "../config/multer.js";
import {
    authenticatedUser,
    disableCache,
    markAuthFlowPage,
    redirectLoggedInUser
} from "../middleware/authMiddleware.js";

import userController from "../controlers/userControler.js";

const router = express.Router();

//////////////////////////////////ROUTES///////////////////////////////////
// INDEX
router.get("/", disableCache, userController.getuserIndex);

// LOGIN
router.get("/login", markAuthFlowPage,disableCache, redirectLoggedInUser, userController.getUserLogin);
router.post("/login", redirectLoggedInUser, userController.postUserLogin);

// SIGNUP
router.get("/signup-user",markAuthFlowPage, disableCache, redirectLoggedInUser, userController.getUserSignup);
router.post("/signup-user", redirectLoggedInUser, userController.postUserSignup);

// OTP
router.get("/verify-otp", markAuthFlowPage,disableCache, redirectLoggedInUser, userController.getVerifyOtp);
router.post("/verify-otp", disableCache, redirectLoggedInUser, userController.verifyOtp);
router.post("/resend-otp", disableCache, redirectLoggedInUser, userController.resendOtp);

// HOME
router.get("/home",authenticatedUser,disableCache,userController.getHome);
//USER PROFILE
router.get("/user-profile",authenticatedUser,disableCache,userController.getUserProfile);

// LOGOUT
router.post("/logout",disableCache,userController.postUserLogout);

// ================= GOOGLE AUTH =================

// Start Google Login
router.get("/auth/google",disableCache,redirectLoggedInUser,passport.authenticate("google", {scope: ["profile", "email"],prompt: "select_account"}));

// Google Callback
router.get("/auth/google/callback",disableCache,passport.authenticate("google", {failureRedirect: "/login",session: false}),userController.googleAuthCallback);


// --- FACEBOOK AUTHENTICATION ROUTES ---


// 1. Trigger Facebook Login screen
router.get("/auth/facebook", disableCache, redirectLoggedInUser, passport.authenticate("facebook", {
    scope: ["email"],
    authType: "reauthenticate"
}));

// 2. Handle the incoming redirect back from Facebook
router.get("/auth/facebook/callback", 
    passport.authenticate("facebook", { failureRedirect: "/", session: false }), 
    userController.facebookAuthCallback
);

// ================= FORGOT PASSWORD =================

// Forgot password page
router.get("/forgot-password",markAuthFlowPage,disableCache,redirectLoggedInUser,userController.getForgotPassword);
// Send OTP
router.post("/forgot-password",redirectLoggedInUser,userController.postForgotPassword);
// Verify forgot OTP page
router.get("/verify-forgot-otp",markAuthFlowPage,disableCache,redirectLoggedInUser,userController.getForgotOtpPage);
// Verify OTP
router.post("/verify-forgot-otp",redirectLoggedInUser,userController.verifyForgotOtp);
// Reset password page
router.get("/reset-password",markAuthFlowPage,disableCache,redirectLoggedInUser,userController.getResetPassword);
// Save new password
router.patch("/reset-password",redirectLoggedInUser,userController.postResetPassword);
// Resend Forgot Password OTP
router.post("/resend-forgot-otp", disableCache, redirectLoggedInUser, userController.resendForgotOtp);
router.put("/update-profile",authenticatedUser,upload.single("profileImage"),userController.updateUserProfile);
//ADDRESS PAGE
router.get("/address",authenticatedUser,userController.getAddressPage)
router.get("/add-address",authenticatedUser,userController.getAddAddressPage);
// ADD ADDRESS
router.post("/add-address",authenticatedUser,userController.addAddress);
// EDIT ADDRESS
router.get( "/edit-address/:id", authenticatedUser, userController.getEditAddress );
router.put("/edit-address/:id",authenticatedUser,userController.updateAddress);
// DELETE ADDRESS
router.delete("/delete-address/:id",authenticatedUser,userController.deleteAddress);
//CHANGE PASSWORD
router.patch("/change-password",authenticatedUser,userController.changePassword);
//CHANGE EMAIL
router.post("/send-email-otp",authenticatedUser,userController.sendEmailOtp);
router.patch("/verify-email-otp",authenticatedUser,userController.verifyEmailOtp);

export default router;
