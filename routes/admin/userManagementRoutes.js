import express from "express"
import {blockUser,unblockUser} from "../../controlers/admin/userManagementController.js";
import {
    disableCache,
    isAuthenticated
} from "../../middleware/authMiddleware.js";

const router = express.Router();
router.patch(
    "/block-user/:id",
    disableCache,
    isAuthenticated,
    blockUser
);

router.patch(
    "/unblock-user/:id",
    disableCache,
    isAuthenticated,
    unblockUser
);

export default router;