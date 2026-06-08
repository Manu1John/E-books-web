import User from "../models/User.js";
import bcrypt from "bcrypt";
import  sendOtpEmail  from "../config/brevo.js";

class AuthService {
    // Check if the email is already in use
    static async checkExistingUser(email) {
        return await User.findOne({ email });
    }

    // Hash the password
    static async hashUserPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    // Generate a 6-digit OTP
    static generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Trigger the Brevo email
    static async sendVerificationEmail(email, otp) {
        const response = await sendOtpEmail(email, otp);
        if (!response || !response.messageId) {
            throw new Error("Email not delivered by Brevo");
        }
        return response;
    }
}

export default AuthService;