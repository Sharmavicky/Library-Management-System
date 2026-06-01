require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Email user:", process.env.EMAIL_USER);
console.log("Email pass:", process.env.EMAIL_PASS ? "loaded" : "Not set");

const transporter = nodemailer.createTransport({
    host: "74.125.133.108", // smtp.gmail.com resolves to multiple IPs, using direct IP to avoid DNS issues
    port: 465,
    secure: true,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
      tls: {
        servername: "smtp.gmail.com"  // ← still validates SSL cert against gmail
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

transporter.verify((err, success) => {
    if (err) {
        console.error("Error setting up email transporter:", err);
    } else {
        console.log("Email transporter is ready to send messages");
    }
})