import express from "express";
import userController from "../../controlers/userControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/address",
    authenticatedUser,
    userController.getAddressPage
);

router.get(
    "/add-address",
    authenticatedUser,
    userController.getAddAddressPage
);

router.post(
    "/add-address",
    authenticatedUser,
    userController.addAddress
);

router.get(
    "/edit-address/:id",
    authenticatedUser,
    userController.getEditAddress
);

router.put(
    "/edit-address/:id",
    authenticatedUser,
    userController.updateAddress
);

router.delete(
    "/delete-address/:id",
    authenticatedUser,
    userController.deleteAddress
);

export default router;