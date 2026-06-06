import dotenv from "dotenv";
import SibApiV3Sdk from "sib-api-v3-sdk";

// 1. Force environment variables to load immediately
dotenv.config();

// 2. Validate that the key actually exists
const apiKeyStr = process.env.BREVO_API_KEY;

if (!apiKeyStr) {
    console.error("🚨 CRITICAL ERROR: BREVO_API_KEY is missing from your .env file!");
    process.exit(1); // Stop the server immediately if there's no key
}

// 3. Initialize the SDK Client
const client = SibApiV3Sdk.ApiClient.instance;

// 4. Inject the verified key
client.authentications["api-key"].apiKey = apiKeyStr;

// 5. Create and export the email instance
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export default emailApi;