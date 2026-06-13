import express from "express";
import userController from "../../controlers/userControler.js";
import {
    disableCache,
    markAuthFlowPage,
    redirectLoggedInUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/forgot-password",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    userController.getForgotPassword
);

router.post(
    "/forgot-password",
    redirectLoggedInUser,
    userController.postForgotPassword
);



router.get(
    "/reset-password",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    userController.getResetPassword
);

router.patch(
    "/reset-password",
    redirectLoggedInUser,
    userController.postResetPassword
);

export default router;