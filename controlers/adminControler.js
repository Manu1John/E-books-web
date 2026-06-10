import User from "../models/User.js";

const USERNAME = "Manu";
const PASSWORD = "1234";

/* ---------------- ADMIN LOGIN PAGE ---------------- */
const getAdminLogin = (req, res) => {
    try {
        if (req.session?.admin) {
            return res.redirect("/admin/dashboard");
        }

        return res.render("admin/login", {
            title: "admin login",
            cssFile: "adminlogin.css",
            jsFile: "adminlogin.js",
            useBootstrap: true
        });

    } catch (error) {
        console.error("getAdminLogin error:", error);
        return res.status(500).send("Internal Server Error");
    }
};

/* ---------------- ADMIN LOGIN POST ---------------- */
const postAdminLogin = (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).render("admin/login", {
                title: "admin login",
                cssFile: "adminlogin.css",
                jsFile: "adminlogin.js",
                useBootstrap: true,
                error: "Username and password required"
            });
        }

        if (username === USERNAME && password === PASSWORD) {
            req.session.admin = username;
            return res.redirect("/admin/dashboard");
        }

        return res.status(401).render("admin/login", {
            title: "admin login",
            cssFile: "adminlogin.css",
            jsFile: "adminlogin.js",
            useBootstrap: true,
            error: "Invalid username or password"
        });

    } catch (error) {
        console.error("postAdminLogin error:", error);
        return res.status(500).send("Internal Server Error");
    }
};

/* ---------------- DASHBOARD ---------------- */
const getDashboard = async (req, res) => {
    try {
        if (!req.session?.admin) {
            return res.redirect("/admin/login");
        }

        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || "";
        const limit = 5;
        const skip = (page - 1) * limit;

const filter = {
    $or: [
        {
            firstName: {
                $regex: search,
                $options: "i"
            }
        },
        {
            lastName: {
                $regex: search,
                $options: "i"
            }
        },
        {
            email: {
                $regex: search,
                $options: "i"
            }
        }
    ]
};

        const totalUsers = await User.countDocuments(filter);

        const users = await User.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalUsers / limit);

        return res.render("admin/dashboard", {
            title: "admin dashboard",
            cssFile: "dashboard.css",
            jsFile: "dashboard.js",
            users,
            currentPage: page,
            totalPages,
            totalUsers,
            search
        });

    } catch (error) {
        console.error("getDashboard error:", error);
        return res.status(500).send("Something went wrong");
    }
};

/* ---------------- LOGOUT ---------------- */
const postAdminLogout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error:", err);
                return res.status(500).send("Logout failed");
            }

            res.clearCookie("connect.sid");
            return res.redirect("/admin/login");
        });

    } catch (error) {
        console.error("postAdminLogout error:", error);
        return res.status(500).send("Internal Server Error");
    }
};

/* ---------------- BLOCK USER ---------------- */
const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.redirect("/admin/dashboard");
        }

        await User.findByIdAndUpdate(userId, {
            isBlocked: true
        });

        return res.redirect("/admin/dashboard");

    } catch (error) {
        console.error("blockUser error:", error);
        return res.redirect("/admin/dashboard");
    }
};

/* ---------------- UNBLOCK USER ---------------- */
const unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.redirect("/admin/dashboard");
        }

        await User.findByIdAndUpdate(userId, {
            isBlocked: false
        });

        return res.redirect("/admin/dashboard");

    } catch (error) {
        console.error("unblockUser error:", error);
        return res.redirect("/admin/dashboard");
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