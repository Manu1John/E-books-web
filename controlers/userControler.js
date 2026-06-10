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

// GET LOGIN
const getUserLogin = (req, res) => {
    try {

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

    } catch (error) {

        console.log("GET USER LOGIN ERROR:", error);

        return res.redirect("/");
    }
};

// SIGNUP WITH GOOGLE
const googleAuthCallback = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.isBlocked) {
            await cleanupSessionSafely(req, res, "Google blocked user");
            return res.render("user/loginAndSignup", {
                title: "Signin",
                cssFile: "loginAndSignup.css",
                jsFile: "signupAuth.js",
                error: "Your account has been blocked by an admin",
                success: null,
                isSignup: false
            });
        }

        await createUserSession(req, req.user);
        return res.redirect("/home");

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
            await cleanupSessionSafely(req, res, "Facebook blocked user");
            return res.render("user/loginAndSignup", {
                title: "Signin",
                cssFile: "loginAndSignup.css",
                jsFile: "signupAuth.js",
                error: "Your account has been blocked by an admin",
                success: null,
                isSignup: false
            });
        }

        await createUserSession(req, req.user);
        return res.redirect("/home");

    } catch (error) {
        console.error("Facebook callback error:", error);
        return res.redirect("/login");
    }
};

// GET SIGNUP
const getUserSignup = (req, res, next) => {
    try {
        // Safe check: Ensures req.session exists before looking for 'user'
        if (req.session?.user) {
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
    } catch (error) {
        // Log the actual error for debugging purposes
        console.error("Error in getUserSignup controller:", error);
        
        // Pass the error to Express's central error-handling middleware
        next(error);
    }
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
            await cleanupSessionSafely(req, res, "Blocked user login");
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

        try {
            await createUserSession(req, user);
        } catch (sessionError) {
            console.error("User login session error:", sessionError);
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Session Error", success: null, isSignup: false
            });
        }

        return res.redirect("/home");

    } catch (error) {
        console.error(error);
        return res.render("user/loginAndSignup", {
            title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
            error: "Login Failed", success: null, isSignup: false
        });
    }
};

// HOME
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

//CHANGE PASSWORD IN USER PROFILE

const changePassword = async (req, res) => {
    try {

        const userId = req.session.user.id;

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        // Find user
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
                jsFile:"userProfile.js",
                user,
                error: "Current password is incorrect"
            });
        }

        // Password match check
        if (newPassword !== confirmPassword) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile:"userProfile.js",
                user,
                error: "Passwords do not match"
            });
        }
        // PASSWORD STRENGTH VALIDATION
const passwordRegex =
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

if (!passwordRegex.test(newPassword)) {

    return res.render("user/userProfile", {
        title: "User Profile",
        cssFile: "userProfile.css",
        jsFile: "userProfile.js",
        user,
        error:
        "Password must contain 8+ characters, uppercase, lowercase, number and special character"
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
                jsFile:"userProfile.js",
                user,
                error: "New password cannot be same as old password"
            });
        }

        // Hash password
        const hashedPassword =
            await bcrypt.hash(newPassword, 10);

        // Update password
        await User.findByIdAndUpdate(
            userId,
            {
                password: hashedPassword
            }
        );
        const updatedUser =
    await User.findById(userId);

        return res.render("user/userProfile", {
            title: "User Profile",
            cssFile: "userProfile.css",
            jsFile:"userProfile.js",
            user,
            success: "Password changed successfully"
        });

    } catch (error) {

        console.log(
            "CHANGE PASSWORD ERROR:",
            error
        );

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
