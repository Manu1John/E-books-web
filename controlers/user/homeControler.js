import express from 'express'



const getuserIndex = (req, res) => {
    try {

        if (req.session.user) {
            return res.redirect("/home");
        }

        return res.render("user/index");

    } catch (error) {

        console.log("GET USER INDEX ERROR:", error);

        return res.redirect("/");
    }
};

const getHome = (req, res, next) => {
    try {
        // Safe check: Optional chaining prevents crashes if the session is uninitialized
        if (!req.session?.user) {
            return res.redirect("/");
        }
        
        return res.render("user/home", {
            title: "home",
            cssFile: "home.css",
            user: req.session.user // Safe to use here because the check above passed
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getHome controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};

export default {
    getuserIndex,
    getHome
}