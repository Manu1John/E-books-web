import passport from "passport";
import express from "express";

import upload from "../config/multer.js";
import {
    authenticatedUser,
    disableCache,
} from "../middleware/authMiddleware.js";

import userController from "../controlers/userControler.js";

const router = express.Router();

const authFlowPaths = new Set([
    "/login",
    "/signup-user",
    "/verify-otp",
    "/forgot-password",
    "/verify-forgot-otp",
    "/reset-password"
]);

const markAuthFlowPage = (req, res, next) => {
    if (
        req.method === "GET" &&
        authFlowPaths.has(req.path)
    ) {
        res.locals.authFlowGuard = true;
        res.locals.noStorePage = true;
    }

    next();
};

const redirectLoggedInUser = (req, res, next) => {
    if (req.session?.user) {
        return res.redirect("/home");
    }

    next();
};

router.use(markAuthFlowPage);

//////////////////////////////////
// INDEX
router.get("/", disableCache, userController.getuserIndex);

// LOGIN
router.get("/login", disableCache, redirectLoggedInUser, userController.getUserLogin);
router.post("/login", redirectLoggedInUser, userController.postUserLogin);

// SIGNUP
router.get("/signup-user", disableCache, redirectLoggedInUser, userController.getUserSignup);
router.post("/signup-user", redirectLoggedInUser, userController.postUserSignup);

// OTP
router.get("/verify-otp", disableCache, redirectLoggedInUser, userController.getVerifyOtp);
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
router.get("/forgot-password",disableCache,redirectLoggedInUser,userController.getForgotPassword);
// Send OTP
router.post("/forgot-password",redirectLoggedInUser,userController.postForgotPassword);
// Verify forgot OTP page
router.get("/verify-forgot-otp",disableCache,redirectLoggedInUser,userController.getForgotOtpPage);
// Verify OTP
router.post("/verify-forgot-otp",redirectLoggedInUser,userController.verifyForgotOtp);
// Reset password page
router.get("/reset-password",disableCache,redirectLoggedInUser,userController.getResetPassword);
// Save new password
router.post("/reset-password",redirectLoggedInUser,userController.postResetPassword);
// Resend Forgot Password OTP
router.post("/resend-forgot-otp", disableCache, redirectLoggedInUser, userController.resendForgotOtp);
router.post("/update-profile",authenticatedUser,upload.single("profileImage"),userController.updateUserProfile);
//ADDRESS PAGE
router.get("/address",authenticatedUser,userController.getAddressPage)
router.get("/add-address",authenticatedUser,userController.getAddAddressPage);
// ADD ADDRESS
router.post("/add-address",authenticatedUser,userController.addAddress);
// EDIT ADDRESS
router.get( "/edit-address/:id", authenticatedUser, userController.getEditAddress );
router.post("/edit-address/:id",authenticatedUser,userController.updateAddress);
// DELETE ADDRESS
router.post("/delete-address/:id",authenticatedUser,userController.deleteAddress);
//CHANGE PASSWORD
router.post("/change-password",authenticatedUser,userController.changePassword);
//CHANGE EMAIL
router.post("/send-email-otp",authenticatedUser,userController.sendEmailOtp);
router.post("/verify-email-otp",authenticatedUser,userController.verifyEmailOtp);

export default router;
