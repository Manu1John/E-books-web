
import User from "../models/User.js";
const USERNAME = 'Manu';
const PASSWORD = '1234';

const getAdminLogin = (req, res) => {

    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }

    return res.render('admin/login',{
            title: "admin login",
            cssFile: "adminlogin.css",
            jsFile: "adminlogin.js",
            useBootstrap: true
    })
;
};

const postAdminLogin = (req, res) => {

    const { username, password } = req.body;

    if (username === USERNAME && password === PASSWORD) {

        req.session.admin = username;

        return res.redirect('/admin/dashboard');
    }

    return res.render('admin/login', {
            title: "admin login",
            cssFile: "adminlogin.css",
            jsFile: "adminlogin.js",
            useBootstrap: true,
        error: 'Invalid username or password'
    });
};

const getDashboard = async (
    req,
    res
) => {

    try {

        if (!req.session.admin) {
            return res.redirect(
                "/admin/login"
            );
        }

        // current page
        const page =
            parseInt(req.query.page) || 1;

        // search input
        const search =
            req.query.search || "";

        // users per page
        const limit = 5;

        // skip users
        const skip =
            (page - 1) * limit;

        // search filter
        const filter = {

            email: {
                $regex: search,
                $options: "i"
            }

        };

        // total users
        const totalUsers =
            await User.countDocuments(
                filter
            );

        // get users
        const users =
        await User.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

        // total pages
        const totalPages =
            Math.ceil(
                totalUsers / limit
            );

        return res.render(
            "admin/dashboard",

            {
            title: "admin dashboard",
            cssFile: "dashboard.css",
            jsFile: "dashboard.js",
                users,
                currentPage: page,
                totalPages,
                totalUsers,
                search
            }
        );

    } catch (error) {

        console.log(error);

        res.send(
            "Something went wrong"
        );
    }
};
const postAdminLogout = (req, res) => {

    delete req.session.admin

        res.clearCookie('connect.sid');

        return res.redirect('/admin/login');
    
};

// BLOCK USER
const blockUser = async (req, res) => {

    try {

        const userId = req.params.id;

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

        console.log(error);

        return res.redirect(
            "/admin/dashboard"
        );
    }
};


// UNBLOCK USER
const unblockUser = async (
    req,
    res
) => {

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

        console.log(error);

        return res.redirect(
            "/admin/dashboard"
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