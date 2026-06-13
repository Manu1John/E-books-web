import User from "../models/User.js";
import Address from "../models/address.js";
import bcrypt from "bcrypt";
import AuthService from "../services/authService.js";
import {
    clearUserSessionCookie,
    createUserSession,
    destroySession
} from "../utils/sessionUtils.js";

const cleanupSessionSafely = async (req, res, context) => {
    try {
        await destroySession(req);
    } catch (error) {
        console.error(`${context} session cleanup error:`, error);
    }

    clearUserSessionCookie(res);
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


// 1. Show the "Enter your email" page
const getForgotPassword = (req, res, next) => {
    try {
        return res.render("user/forgotPassword", {
            title: "Forgot Password",
            cssFile: "loginAndSignup.css",
            error: null,
            success: null
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getForgotPassword controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
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


// GET RESET PASSWORD
const getResetPassword = (req, res, next) => {
    try {
        // Safe check: Optional chaining prevents crashes if the session is uninitialized
        if (!req.session?.otpVerified) {
            return res.redirect("/forgot-password");
        }

        return res.render("user/resetPassword", {
            title: "Reset Password",
            cssFile: "loginAndSignup.css",
            error: null
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getResetPassword controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
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

const getAddAddressPage = (req, res, next) => {
    try {
        return res.render("user/addAddress", {
            title: "Add Address",
            cssFile: "addAddress.css",
            // Safe check: Prevents crashing if req.session is undefined
            user: req.session?.user 
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getAddAddressPage controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
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

const changePassword = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        // Find user document
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect("/user-profile");
        }

        // Current password check
        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "Current password is incorrect"
            });
        }

        // Password match check
        if (newPassword !== confirmPassword) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "Passwords do not match"
            });
        }

        // FIXED: Password regex now matches the exact special characters allowed by your frontend JS
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "Password must contain 8+ characters, uppercase, lowercase, number and special character"
            });
        }

        // Prevent same password
        const samePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (samePassword) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "New password cannot be same as old password"
            });
        }

        // Hash password manually
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // FIXED: Using standard document assignment and .save() to protect schema hooks consistency
        user.password = hashedPassword;
        const updatedUser = await user.save();

        // FIXED: Passing updatedUser instead of the stale user variable
        return res.render("user/userProfile", {
            title: "User Profile",
            cssFile: "userProfile.css",
            jsFile: "userProfile.js",
            user: updatedUser,
            success: "Password changed successfully"
        });

    } catch (error) {
        console.log("CHANGE PASSWORD ERROR:", error);
        return res.redirect("/user-profile");
    }
};

// SEND OTP FOR EMAIL CHANGE
const sendEmailOtp = async (req, res) => {
    try {

        const userId =
            req.session.user.id;

        const { newEmail } =
            req.body;

        const user =
            await User.findById(userId);

        if (!user) {
            return res.redirect(
                "/user-profile"
            );
        }

        // check empty
        if (!newEmail?.trim()) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "Please enter email"
                }
            );
        }

        const normalizedEmail =
            newEmail
                .trim()
                .toLowerCase();

        // prevent same email
        if (
            normalizedEmail ===
            user.email
        ) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "New email cannot be same as current email"
                }
            );
        }

        // check existing user
        const existingUser =
            await User.findOne({
                email:
                    normalizedEmail
            });

        if (existingUser) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "Email already exists"
                }
            );
        }

        // generate OTP
        const otp =
            AuthService.generateOtp();

        // session store
        req.session.emailOtp =
            otp;

        req.session.newEmail =
            normalizedEmail;

        req.session.emailOtpExpire =
            Date.now() +
            2 * 60 * 1000;

        // send OTP
        await AuthService
            .sendVerificationEmail(
                normalizedEmail,
                otp
            );

        return res.render(
            "user/userProfile",
            {
                title:
                    "User Profile",

                cssFile:
                    "userProfile.css",

                jsFile:
                    "userProfile.js",

                user,

                emailSuccess:
                    "OTP sent to your email"
            }
        );

    } catch (error) {

        console.log(
            "SEND EMAIL OTP ERROR:",
            error
        );

        return res.redirect(
            "/user-profile"
        );
    }
};

// VERIFY EMAIL OTP
const verifyEmailOtp =
async (req, res) => {

    try {

        const userId =
            req.session.user.id;

        const { otp } =
            req.body;

        const user =
            await User.findById(
                userId
            );

        if (!user) {

            return res.redirect(
                "/user-profile"
            );
        }

        // expiry check
        if (
            !req.session
                .emailOtpExpire ||

            Date.now() >
            req.session
                .emailOtpExpire
        ) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "OTP expired"
                }
            );
        }

        // OTP check
        if (
            String(otp).trim()
            !==
            String(
                req.session
                    .emailOtp
            ).trim()
        ) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "Invalid OTP"
                }
            );
        }

        // update email
        await User
            .findByIdAndUpdate(
                userId,
                {
                    email:
                        req.session
                            .newEmail
                }
            );

        // update session email
        req.session.user.email =
            req.session
                .newEmail;

        // clear session
        delete req.session.emailOtp;
        delete req.session.newEmail;
        delete req.session
            .emailOtpExpire;

        const updatedUser =
            await User.findById(
                userId
            );

        return res.render(
            "user/userProfile",
            {
                title:
                    "User Profile",

                cssFile:
                    "userProfile.css",

                jsFile:
                    "userProfile.js",

                user:
                    updatedUser,

                emailSuccess:
                    "Email updated successfully"
            }
        );

    } catch (error) {

        console.log(
            "VERIFY EMAIL OTP ERROR:",
            error
        );

        return res.redirect(
            "/user-profile"
        );
    }
};

// LOGOUT
const postUserLogout = async (req, res, next) => {
    try {
        await destroySession(req);
        clearUserSessionCookie(res);
        return res.redirect("/");
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in postUserLogout controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
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
    //CHANGE PASSWORD
    changePassword,
    //CHANGE EMAIL VIA OTP
    sendEmailOtp,
    verifyEmailOtp,
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
