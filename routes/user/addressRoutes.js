import express from "express";
import addressControler from "../../controlers/user/addressControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/address",
    authenticatedUser,
    addressControler.getAddressPage
);

router.get(
    "/add-address",
    authenticatedUser,
    addressControler.getAddAddressPage
);

router.post(
    "/add-address",
    authenticatedUser,
    addressControler.addAddress
);

router.get(
    "/edit-address/:id",
    authenticatedUser,
    addressControler.getEditAddress
);

router.put(
    "/edit-address/:id",
    authenticatedUser,
    addressControler.updateAddress
);

router.delete(
    "/delete-address/:id",
    authenticatedUser,
    addressControler.deleteAddress
);

export default router;