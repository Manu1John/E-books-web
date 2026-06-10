import User from "../models/User.js";
import {
    clearAdminSessionCookie,
    createAdminSession,
    destroySession
} from "../utils/sessionUtils.js";

const USERNAME = "Manu";
const PASSWORD = "1234";

/* ---------------- ADMIN LOGIN PAGE ---------------- */
const getAdminLogin = (
    req,
    res
) => {

    try {

        if (
            req.session.admin
        ) {

            return res.redirect(
                "/admin/dashboard"
            );
        }

        return res.render(
            "admin/login",
            {
                title:
                    "admin login",
                cssFile:
                    "adminlogin.css",
                jsFile:
                    "adminlogin.js",
                useBootstrap:
                    true
            }
        );

    } catch (error) {

        console.log(
            "getAdminLogin error:",
            error
        );

        return res
            .status(500)
            .send(
                "Internal Server Error"
            );
    }
};

/* ---------------- ADMIN LOGIN POST ---------------- */
const postAdminLogin = async (
    req,
    res
) => {

    try {

        const {
            username,
            password
        } = req.body;

        if (
            !username ||
            !password
        ) {

            return res.render(
                "admin/login",
                {
                    title:
                        "admin login",
                    cssFile:
                        "adminlogin.css",
                    jsFile:
                        "adminlogin.js",
                    useBootstrap:
                        true,
                    error:
                        "Username and password required"
                }
            );
        }

        if (
            username ===
                USERNAME &&
            password ===
                PASSWORD
        ) {

            await createAdminSession(
                req,
                username
            );

            return res.redirect(
                "/admin/dashboard"
            );
        }

        return res.render(
            "admin/login",
            {
                title:
                    "admin login",
                cssFile:
                    "adminlogin.css",
                jsFile:
                    "adminlogin.js",
                useBootstrap:
                    true,
                error:
                    "Invalid username or password"
            }
        );

    } catch (error) {

        console.log(
            "postAdminLogin error:",
            error
        );

        return res
            .status(500)
            .send(
                "Internal Server Error"
            );
    }
};

/* ---------------- DASHBOARD ---------------- */
const getDashboard =
    async (
        req,
        res
    ) => {

    try {

        const page =
            parseInt(
                req.query.page
            ) || 1;

        const search =
            req.query.search ||
            "";

        const limit = 5;

        const skip =
            (page - 1) *
            limit;

        const filter = {
            $or: [
                {
                    firstName:
                    {
                        $regex:
                            search,
                        $options:
                            "i"
                    }
                },
                {
                    lastName:
                    {
                        $regex:
                            search,
                        $options:
                            "i"
                    }
                },
                {
                    email: {
                        $regex:
                            search,
                        $options:
                            "i"
                    }
                }
            ]
        };

        const totalUsers =
            await User.countDocuments(
                filter
            );

        const users =
            await User.find(
                filter
            )
                .sort({
                    updatedAt:
                        -1
                })
                .skip(skip)
                .limit(
                    limit
                );

        const totalPages =
            Math.ceil(
                totalUsers /
                    limit
            );

        return res.render(
            "admin/dashboard",
            {
                title:
                    "admin dashboard",
                cssFile:
                    "dashboard.css",
                jsFile:
                    "dashboard.js",
                users,
                currentPage:
                    page,
                totalPages,
                totalUsers,
                search
            }
        );

    } catch (error) {

        console.log(
            "getDashboard error:",
            error
        );

        return res
            .status(500)
            .send(
                "Something went wrong"
            );
    }
};

/* ---------------- BLOCK USER ---------------- */
const blockUser =
    async (
        req,
        res
    ) => {

    try {

        const userId =
            req.params.id;

        await User.findByIdAndUpdate(
            userId,
            {
                isBlocked:
                    true
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
const unblockUser =
    async (
        req,
        res
    ) => {

    try {

        const userId =
            req.params.id;

        await User.findByIdAndUpdate(
            userId,
            {
                isBlocked:
                    false
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

/* ---------------- LOGOUT ---------------- */
const postAdminLogout =
    async (
        req,
        res
    ) => {

    try {

        await destroySession(
            req
        );

        clearAdminSessionCookie(
            res
        );

        return res.redirect(
            "/admin/login"
        );

    } catch (error) {

        console.log(
            "ADMIN LOGOUT ERROR:",
            error
        );

        return res
            .status(500)
            .send(
                "Logout failed"
            );
    }
};

export default {
    getAdminLogin,
    postAdminLogin,
    getDashboard,
    postAdminLogout,
    blockUser,
    unblockUser
};
