import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import AuthService from "../services/authService.js";
const getuserIndex = (req,res)=>{
    if(req.session.user){
        return res.redirect("/home")
    }
    return res.render("user/index")
}

// GET LOGIN
const getUserLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect("/home");
    }
    return res.render("user/loginAndSignup", {
    title: "Signin",
    cssFile: "loginAndSignup.css",
    jsFile: "signupAuth.js",
    error: null,
    success: null,
    isSignup: false
    });
};

///signup with google

 const googleAuthCallback = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.isBlocked) {
            return res.render("user/loginAndSignup", {
                title: "Signin",
                cssFile: "loginAndSignup.css",
                jsFile: "signupAuth.js",
                error: "Your account has been blocked by an admin",
                success: null,
                isSignup: false
            });
        }

        req.session.user = {
            id: req.user._id,
            email: req.user.email
        };

        req.session.save((err) => {
            if (err) {
                console.error("Google session save error:", err);
                return res.redirect("/login");
            }

            return res.redirect("/home");
        });

    } catch (error) {
        console.error("Google callback error:", error);
        return res.redirect("/login");
    }
};


// GET SIGNUP
const getUserSignup = (req, res) => {
    if (req.session.user) {
        return res.redirect("/home");
    }
    return res.render("user/loginAndSignup", {
    title: "Signup",
    cssFile: "loginAndSignup.css",
    jsFile: "signupAuth.js",
    error: null,
    success: null,
    isSignup: true
    });
};

// POST SIGNUP
export const postUserSignup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

        // 1. Validate Form Inputs
        if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "All fields are required", success: null, isSignup: true
            });
        }

        if (password !== confirmPassword) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Passwords do not match", success: null, isSignup: true
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. SERVICE CALL: Check for existing user
        const existingUser = await AuthService.checkExistingUser(normalizedEmail);
        if (existingUser) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Email already exists", success: null, isSignup: true
            });
        }

        // 3. SERVICE CALL: Hash Password & Generate OTP
        const hashedPassword = await AuthService.hashUserPassword(password);
        const otp = AuthService.generateOtp();

        // 4. Store safe data in session
        req.session.userData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword 
        };

        req.session.userOtp = otp;
        req.session.otpExpires = Date.now() + 2 * 60 * 1000; 

        // 5. Save Session and Send Email
        req.session.save(async (err) => {
            if (err) {
                return res.render("user/loginAndSignup", {
                    title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                    error: "Session error", success: null, isSignup: true
                });
            }

            try {
                // SERVICE CALL: Send Email via Brevo
                await AuthService.sendVerificationEmail(normalizedEmail, otp);
                return res.redirect("/verify-otp");

            } catch (emailErr) {
                console.error("EMAIL ERROR:", emailErr);
                return res.render("user/loginAndSignup", {
                    title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                    error: "OTP email failed. Please try again.", success: null, isSignup: true
                });
            }
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.render("user/loginAndSignup", {
            title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
            error: "An unexpected error occurred", success: null, isSignup: true
        });
    }
};
// GET VERIFY OTP PAGE
const getVerifyOtp = (req, res) => {

    if (!req.session.userOtp || !req.session.userData) {
        return res.redirect("/");
    }

    return res.render("user/verifyOtp", {
        title: "Verify OTP",
        cssFile: "verifyOtp.css",
        jsFile: "verifyOtp.js",
        error: null,
        success: null
    });
};

// VERIFY OTP
const verifyOtp = async (req, res) => {
    try {

        const { otp } = req.body;

        // 1. Validate session existence
        if (!req.session.userOtp || !req.session.userData) {
            return res.redirect("/login");
        }

        // 2. Check OTP expiry
        if (
            !req.session.otpExpires ||
            Date.now() > req.session.otpExpires
        ) {
            return res.render("user/verifyOtp", {
                title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
                error: "OTP has expired. Please resend a new one.",
                success: null
            });
        }

        // 3. Normalize OTP input
        const enteredOtp = String(otp).trim();
        const storedOtp = String(req.session.userOtp).trim();

        // 4. OTP validation
        if (enteredOtp !== storedOtp) {
            return res.render("user/verifyOtp", {
                title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
                error: "Invalid OTP",
                success: null
            });
        }

        // 5. Validate user data
        const userData = req.session.userData;

        if (
            !userData?.email ||
            !userData?.password
        ) {
            return res.redirect("/login");
        }

        // 6. Create user
        await User.create({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password
        });

        // 7. Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error(
                    "Session destroy error:",
                    err
                );
            }
        });

        // 8. Redirect after success
        return res.redirect("/login");

    } catch (err) {

        console.error(
            "OTP VERIFY ERROR:",
            err
        );

        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error:
                "Something went wrong during verification. Try again.",
            success: null
        });
    }
};

// POST LOGIN
const postUserLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render("user/loginAndSignup", {
    title: "Signup",
    cssFile: "loginAndSignup.css",
    jsFile: "signupAuth.js",
    error: "Invalid Email or Password",
    success: null,
    isSignup: false
            });
        }

        if (user.isBlocked) {
            return res.render("user/loginAndSignup", {
    title: "Signup",
    cssFile: "loginAndSignup.css",
    jsFile: "signupAuth.js",
    error: "Your account has been blocked by an admin",
    success: null,
    isSignup: false
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render("user/loginAndSignup", {
    title: "Signup",
    cssFile: "loginAndSignup.css",
    jsFile: "signupAuth.js",
    error: "Invalid Email or Password",
    success: null,
    isSignup: false
            });
        }

        // SESSION CREATE
        req.session.user = {
            id: user._id,
            email: user.email
        };

        req.session.save((err) => {
            if (err) {
                console.error(err);
                return res.render("user/loginAndSignup", {
    title: "Signup",
    cssFile: "loginAndSignup.css",
    jsFile: "signupAuth.js",
    error: "Session Error",
    success: null,
    isSignup: false
                });
            }
            return res.redirect("/home");
        });

    } catch (error) {
        console.error(error);
        return res.render("user/loginAndSignup", {
    title: "Signup",
    cssFile: "loginAndSignup.css",
    jsFile: "signupAuth.js",
    error: "Login Failed",
    success: null,
    isSignup: false
        });
    }
};

// HOME
const getHome = (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    return res.render("user/home", {
    title: "home",
    cssFile: "home.css",
    user: req.session.user
    });
};

// RESEND OTP  
const resendOtp = async (req, res) => {
    try {
        const userData = req.session.userData;

        if (!userData?.email) {
            return res.redirect("/");
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        req.session.userOtp = otp.toString();
        // 🔥 LOGIC FIX: Match the new 2-minute timer
        req.session.otpExpires = Date.now() + 2 * 60 * 1000; 

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await sendOtpEmail(userData.email, otp);

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

// LOGOUT
const postUserLogout = (req, res) => {
    delete req.session.user;
    res.clearCookie("connect.sid");
    return res.redirect("/");
};

export default {
    getuserIndex,
    getUserLogin,
    getUserSignup,
    postUserSignup,
    postUserLogin,
    getHome,
    postUserLogout,
    resendOtp,
    verifyOtp,
    getVerifyOtp,
    googleAuthCallback
};