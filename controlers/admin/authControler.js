import {
    clearAdminSessionCookie,
    createAdminSession,
    destroySession
} from "../../utils/sessionUtils.js";

const USERNAME = "Manu";
const PASSWORD = "1234";

/* ---------------- ADMIN LOGIN PAGE ---------------- */

export const getAdminLogin = (req, res) => {
    try {
        if (req.session.admin) {
            return res.redirect("/admin/dashboard");
        }

        return res.render("admin/login", {
            title: "admin login",
            cssFile: "adminlogin.css",
            jsFile: "adminlogin.js",
            useBootstrap: true
        });

    } catch (error) {
        console.log("getAdminLogin error:", error);

        return res
            .status(500)
            .send("Internal Server Error");
    }
};

/* ---------------- ADMIN LOGIN POST ---------------- */

export const postAdminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render("admin/login", {
                title: "admin login",
                cssFile: "adminlogin.css",
                jsFile: "adminlogin.js",
                useBootstrap: true,
                error: "Username and password required"
            });
        }

        if (
            username === USERNAME &&
            password === PASSWORD
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
            "admin/auth/login",
            {
                title: "admin login",
                cssFile: "adminlogin.css",
                jsFile: "adminlogin.js",
                useBootstrap: true,
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

/* ---------------- LOGOUT ---------------- */

export const postAdminLogout =
async (req, res) => {
    try {
        await destroySession(req);

        clearAdminSessionCookie(res);

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
            .send("Logout failed");
    }
};