import User from "../../models/User.js";

/* ---------------- BLOCK USER ---------------- */

export const blockUser =
async (req, res) => {
    try {

        const userId =
            req.params.id;

        await User.findByIdAndUpdate(
            userId,
            {
                isBlocked: true
            }
        );

        return res.redirect(
            "/admin/dashboard"
        );

    } catch (error) {

        console.log(
            "BLOCK USER ERROR:",
            error
        );

        return res.redirect(
            "/admin/dashboard"
        );
    }
};

/* ---------------- UNBLOCK USER ---------------- */

export const unblockUser =
async (req, res) => {
    try {

        const userId =
            req.params.id;

        await User.findByIdAndUpdate(
            userId,
            {
                isBlocked: false
            }
        );

        return res.redirect(
            "/admin/dashboard"
        );

    } catch (error) {

        console.log(
            "UNBLOCK USER ERROR:",
            error
        );

        return res.redirect(
            "/admin/dashboard"
        );
    }
};