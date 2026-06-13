import express from "express";
import otpControler from "../../controlers/user/otpControler";
import {
    disableCache,
    markAuthFlowPage,
    redirectLoggedInUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/verify-otp",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    otpControler.getVerifyOtp
);

router.post(
    "/verify-otp",
    disableCache,
    redirectLoggedInUser,
    otpControler.verifyOtp
);

router.post(
    "/resend-otp",
    disableCache,
    redirectLoggedInUser,
    otpControler.resendOtp
);

router.get(
    "/verify-forgot-otp",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    userController.getForgotOtpPage
);

router.post(
    "/verify-forgot-otp",
    redirectLoggedInUser,
    userController.verifyForgotOtp
);

router.post("/resend-forgot-otp", disableCache, redirectLoggedInUser, userController.resendForgotOtp);

export default router;