// netlify/functions/send-otp.js
// Twilio OTP sender — runs on Netlify serverless, never exposed to browser

const twilio = require("twilio");

exports.handler = async function (event, context) {

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // CORS headers — allow your GitHub Pages domain only
  const headers = {
    "Access-Control-Allow-Origin": "https://anuragbontha2507-cyber.github.io",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight CORS OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body);
    const { phone, otp } = body;

    // Validate inputs
    if (!phone || !otp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Phone number and OTP are required." }),
      };
    }

    // Validate 10-digit Indian mobile number
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid Indian mobile number." }),
      };
    }

    // Validate OTP is exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid OTP format." }),
      };
    }

    // Read Twilio credentials from environment variables (NEVER hardcode)
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Missing Twilio environment variables.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error." }),
      };
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Send SMS
    const message = await client.messages.create({
      body: `Your Primecircuit OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
      from: fromNumber,
      to: "+91" + phone,
    });

    console.log("SMS sent. SID:", message.sid);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully via SMS." 
      }),
    };

  } catch (error) {
    console.error("Twilio error:", error);

    // Return Twilio-specific error codes to frontend
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || "Failed to send OTP.",
        code: error.code || null
      }),
    };
  }
};
