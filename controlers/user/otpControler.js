import express from 'express'


// GET VERIFY OTP PAGE
const getVerifyOtp = (req, res, next) => {
    try {
        // Safe check: Using optional chaining (?.) prevents crashes if the session is uninitialized
        if (!req.session?.userOtp || !req.session?.userData) {
            return res.redirect("/");
        }

        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: null
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getVerifyOtp controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};


// VERIFY OTP
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.session.userOtp || !req.session.userData) {
            return res.redirect("/login");
        }

        if (!req.session.otpExpires || Date.now() > req.session.otpExpires) {
            return res.render("user/verifyOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                jsFile: "verifyOtp.js",
                error: "OTP has expired. Please resend a new one.",
                success: null
            });
        }

        const enteredOtp = String(otp).trim();
        const storedOtp = String(req.session.userOtp).trim();

        if (enteredOtp !== storedOtp) {
            return res.render("user/verifyOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                jsFile: "verifyOtp.js",
                error: "Invalid OTP",
                success: null
            });
        }

        const userData = req.session.userData;

        if (!userData?.email || !userData?.password) {
            return res.redirect("/login");
        }

        await User.create({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password
        });

        await cleanupSessionSafely(req, res, "Signup OTP");
        return res.redirect("/login");

    } catch (err) {
        console.error("OTP VERIFY ERROR:", err);
        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: "Something went wrong during verification. Try again.",
            success: null
        });
    }
};
// GET FORGOT OTP PAGE
const getForgotOtpPage = (req, res, next) => {
    try {
        // Safe check: Optional chaining prevents crashes if the session is uninitialized
        if (!req.session?.forgotOtp) {
            return res.redirect("/forgot-password");
        }

        return res.render("user/verifyForgotOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: null
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getForgotOtpPage controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};
// VERIFY FORGOT OTP
const verifyForgotOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.session.forgotOtp) {
            return res.redirect("/forgot-password");
        }

        if (Date.now() > req.session.forgotOtpExpires) {
            return res.render("user/verifyForgotOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                jsFile: "verifyOtp.js",
                error: "OTP expired",
                success: ""
            });
        }

        const enteredOtp = String(otp).trim();
        const storedOtp = String(req.session.forgotOtp).trim();

        if (enteredOtp !== storedOtp) {
            return res.render("user/verifyForgotOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                error: "Invalid OTP",
                success: null
            });
        }

        req.session.otpVerified = true;
        return res.redirect("/reset-password");

    } catch (error) {
        console.error(error);
        return res.redirect("/forgot-password");
    }
};
// RESEND FORGOT PASSWORD OTP  
const resendForgotOtp = async (req, res) => {
    try {
        const email = req.session.forgotEmail;

        if (!email) {
            return res.redirect("/forgot-password");
        }

        // Generate a new OTP using your central AuthService
        const otp = AuthService.generateOtp();

        // Update session with new OTP and extend the 2-minute expiration window
        req.session.forgotOtp = otp;
        req.session.forgotOtpExpires = Date.now() + 2 * 60 * 1000; 

        // Force save session before sending the email to avoid race conditions
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Send the new OTP using your Brevo service
        await AuthService.sendPasswordResetOtp(email, otp);

        return res.render("user/verifyForgotOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: "A fresh OTP has been sent to your email."
        });

    } catch (error) {
        console.error("RESEND FORGOT OTP ERROR:", error);
        return res.render("user/verifyForgotOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: "Failed to resend OTP. Please try again.",
            success: null
        });
    }
};
// RESEND OTP  
const resendOtp = async (req, res) => {
    try {
        const userData = req.session.userData;

        if (!userData?.email) {
            return res.redirect("/");
        }

        // FIXED: Using central generateOtp tool
        const otp = AuthService.generateOtp();

        req.session.userOtp = otp;
        req.session.otpExpires = Date.now() + 2 * 60 * 1000; 

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // FIXED: Passing parameters into the central AuthService flow
        await AuthService.sendVerificationEmail(userData.email, otp);

        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: "A new OTP has been sent to your email."
        });

    } catch (error) {
        console.error("RESEND OTP ERROR:", error?.response?.text || error.message);
        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: "Failed to resend OTP",
            success: null
        });
    }
};




export default {
getVerifyOtp,
verifyOtp,
resendOtp,
getForgotOtpPage,
verifyForgotOtp,
resendForgotOtp
}