import "dotenv/config"; // 🔥 FORCE dotenv to load directly inside this file first!
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

// 🔍 TEMPORARY DEBUG LOGS
console.log("--- PASSPORT CONFIG DEBUG ---");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("------------------------------");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // 🛠️ FIX: Changed from relative path to absolute path matching your port 5000
    callbackURL: "http://localhost:5000/auth/google/callback" 
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        }

        const newUser = await User.create({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName || "",
            email: profile.emails[0].value
        });

        return done(null, newUser);

    } catch (error) {
        console.error("Google Auth Error:", error);
        return done(error, null);
    }
}));

export default passport;