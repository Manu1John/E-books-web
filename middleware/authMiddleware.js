import User from "../models/User.js";
// authentication middleware
const isAuthenticated = (req, res, next) => {

    if (req.session.admin) {
        return next();
    }

    return res.redirect('/admin/login');
};

// User Auth Middleware
// USER AUTH
const authenticatedUser =
async (
    req,
    res,
    next
) => {

    try {

        // no session
        if (
            !req.session.user
        ) {
            return res.redirect("/");
        }

        // get fresh user data
        const user =
        await User.findById(
            req.session.user.id
        );

        // user deleted
        if (!user) {

    delete req.session.user;

    return res.redirect("/");
}

        // USER BLOCKED
        if (user.isBlocked) {
                res.clearCookie(
                    "connect.sid"
                );
            delete req.session.user;

                return res.redirect(
                    "/"
                );
        

            return;
        }

        // attach user
        req.user = user;

        next();

    } catch (error) {

        console.log(error);

        return res.redirect("/");
    }
};

// disable browser cache
const disableCache = (
    req,
    res,
    next
) => {

    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );

    res.set(
        "Pragma",
        "no-cache"
    );

    res.set(
        "Expires",
        "0"
    );

    next();
};



export {
    isAuthenticated,
    authenticatedUser,
    disableCache
};

