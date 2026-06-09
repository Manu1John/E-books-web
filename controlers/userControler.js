import User from "../models/User.js";
import Address from "../models/address.js";
import bcrypt from "bcrypt";
import AuthService from "../services/authService.js";

const getuserIndex = (req, res) => {
    if (req.session.user) {
        return res.redirect("/home");
    }
    return res.render("user/index");
};

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

// SIGNUP WITH GOOGLE
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

// LOGIN WITH FACEBOOK
const facebookAuthCallback = async (req, res) => {
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
                console.error("Facebook session save error:", err);
                return res.redirect("/login");
            }
            return res.redirect("/home");
        });

    } catch (error) {
        console.error("Facebook callback error:", error);
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
const postUserSignup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

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

        const existingUser = await AuthService.checkExistingUser(normalizedEmail);
        if (existingUser) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Email already exists", success: null, isSignup: true
            });
        }

        const hashedPassword = await AuthService.hashUserPassword(password);
        const otp = AuthService.generateOtp();

        req.session.userData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword 
        };

        req.session.userOtp = otp;
        req.session.otpExpires = Date.now() + 2 * 60 * 1000; 

        req.session.save(async (err) => {
            if (err) {
                return res.render("user/loginAndSignup", {
                    title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                    error: "Session error", success: null, isSignup: true
                });
            }

            try {
                // FIXED: Direct call via our AuthService instance
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

        req.session.destroy((err) => {
            if (err) console.error("Session destroy error:", err);
        });

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

// POST LOGIN
const postUserLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Invalid Email or Password", success: null, isSignup: false
            });
        }

        if (user.isBlocked) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Your account has been blocked by an admin", success: null, isSignup: false
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Invalid Email or Password", success: null, isSignup: false
            });
        }

        req.session.user = {
            id: user._id,
            email: user.email
        };

        req.session.save((err) => {
            if (err) {
                console.error(err);
                return res.render("user/loginAndSignup", {
                    title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                    error: "Session Error", success: null, isSignup: false
                });
            }
            return res.redirect("/home");
        });

    } catch (error) {
        console.error(error);
        return res.render("user/loginAndSignup", {
            title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
            error: "Login Failed", success: null, isSignup: false
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

const getUserProfile = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect("/");
        }

        // get full user data from database
        const user = await User.findById(
            req.session.user.id
        );

        return res.render(
            "user/userProfile",
            {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile:"userProfile.js",
                user
            }
        );

    } catch (error) {

        console.log(error);

        return res.redirect("/");
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

// 1. Show the "Enter your email" page
const getForgotPassword = (req, res) => {
    return res.render("user/forgotPassword", {
        title: "Forgot Password",
        cssFile: "loginAndSignup.css",
        error: null,
        success:null
    });
};

// POST FORGOT PASSWORD
const postForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.render("user/forgotPassword", {
                title: "Forgot Password",
                cssFile: "loginAndSignup.css",
                error: "Email not found",
                success:null

            });
        }

        // FIXED: Unified implementation through AuthService
        const otp = AuthService.generateOtp();

        req.session.forgotEmail = user.email;
        req.session.forgotOtp = otp;
        req.session.forgotOtpExpires = Date.now() + 2 * 60 * 1000;

        // FIXED: Routing email distribution logic through the modern service layer
        await AuthService.sendPasswordResetOtp(user.email, otp);

        return res.redirect("/verify-forgot-otp");

    } catch (error) {
        console.error(error);
        return res.redirect("/forgot-password");
    }
};

// GET FORGOT OTP PAGE
const getForgotOtpPage = (req, res) => {
    if (!req.session.forgotOtp) {
        return res.redirect("/forgot-password");
    }

    return res.render("user/verifyForgotOtp", {
        title: "Verify OTP",
        cssFile: "verifyOtp.css",
        jsFile: "verifyOtp.js",
        error: null,
        success: null
    });
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

// GET RESET PASSWORD
const getResetPassword = (req, res) => {
    if (!req.session.otpVerified) {
        return res.redirect("/forgot-password");
    }

    return res.render("user/resetPassword", {
        title: "Reset Password",
        cssFile: "loginAndSignup.css",
        error: null
    });
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

// POST RESET PASSWORD
const postResetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render("user/resetPassword", {
                title: "Reset Password",
                cssFile: "loginAndSignup.css",
                error: "Passwords do not match"
            });
        }

        const email = req.session.forgotEmail;
        const user = await User.findOne({ email });

        if (!user) {
            return res.redirect("/forgot-password");
        }

        // FIXED: Leveraging the AuthService hashing mechanism 
        const hashedPassword = await AuthService.hashUserPassword(password);

        user.password = hashedPassword;
        await user.save();

        // Clear password reset session data cleanly
        delete req.session.forgotEmail;
        delete req.session.forgotOtp;
        delete req.session.forgotOtpExpires;
        delete req.session.otpVerified;

        return res.redirect("/login");

    } catch (error) {
        console.error(error);
        return res.redirect("/forgot-password");
    }
};

const updateUserProfile =
async (req, res) => {

    try {

        const userId =
        req.session.user.id;

        const {
            firstName,
            lastName,
            phone
        } = req.body;

        const updateData = {

            firstName,
            lastName,
            phone
        };

        // image upload
        if (req.file) {

            updateData.profileImage =
                "/uploads/" +
                req.file.filename;
        }

        await User.findByIdAndUpdate(
            userId,
            updateData
        );

        return res.redirect(
            "/user-profile"
        );

    } catch (error) {

        console.log(error);

        return res.redirect(
            "/user-profile"
        );
    }
};

// ADDRESS PAGE
const getAddressPage = async (req, res) => {

    try {

        const userId =
            req.session.user.id;
            

        const addresses =
            await Address.find({
                userId
            });

        res.render(
            "user/address",
            {
                title:
                    "Saved Address",

                cssFile:
                    "address.css",

                user:
                    req.session.user,

                addresses
            }
        );

    } catch (error) {

        console.log(error);

        res.redirect(
            "/user-profile"
        );
    }
};

const getAddAddressPage =
(req, res) => {

    return res.render(
        "user/addAddress",
        {
            title:
            "Add Address",

            cssFile:
            "addAddress.css",

            user:
            req.session.user
        }
    );
};

// ADD ADDRESS
const addAddress = async (req, res) => {
    try {

        const userId = req.session.user.id;

        const {
            fullName,
            phone,
            house,
            area,
            landmark,
            city,
            state,
            pincode,
            addressType
        } = req.body;

        await Address.create({
            userId,

            fullName,

            phone,

            addressLine: `${house}, ${area}`,

            landmark,

            city,

            state,

            pincode,

            addressType
        });

        return res.redirect("/address");

    } catch (error) {

        console.log("ADD ADDRESS ERROR:", error);

        return res.redirect("/add-address");
    }
};

// GET EDIT ADDRESS PAGE
const getEditAddress = async (req, res) => {
    try {

        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.redirect("/address");
        }

        return res.render("user/editAddress", {
            title: "Edit Address",
            cssFile: "addAddress.css",
            address
        });

    } catch (error) {

        console.log(error);
        return res.redirect("/address");
    }
};


// UPDATE ADDRESS
const updateAddress = async (req, res) => {
    try {

        const {
            fullName,
            phone,
            house,
            area,
            landmark,
            city,
            state,
            pincode,
            addressType
        } = req.body;

        await Address.findByIdAndUpdate(
            req.params.id,
            {
                fullName,
                phone,
                addressLine: `${house}, ${area}`,
                landmark,
                city,
                state,
                pincode,
                addressType
            }
        );

        return res.redirect("/address");

    } catch (error) {

        console.log(error);
        return res.redirect("/address");
    }
};




// DELETE ADDRESS
const deleteAddress =
async (req, res) => {

    try {

        await Address.findByIdAndDelete(
            req.params.id
        );

        res.redirect(
            "/address"
        );

    } catch (error) {

        console.log(error);

        res.redirect(
            "/address"
        );
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
    googleAuthCallback,
    facebookAuthCallback,

    // FORGOT PASSWORD
    getForgotPassword,
    postForgotPassword,
    getForgotOtpPage,
    verifyForgotOtp,
    getResetPassword,
    resendForgotOtp,
    postResetPassword,

    // USER PROFILE
    getUserProfile,
    updateUserProfile,

    // ADDRESS
    getAddressPage,
    getAddAddressPage,
    addAddress,
    updateAddress,
    deleteAddress,
    getEditAddress
};