require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Email user:", process.env.EMAIL_USER);
console.log("Email pass:", process.env.EMAIL_PASS ? "loaded" : "Not set");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

transporter.verify((err, success) => {
    if (err) {
        console.error("Error setting up email transporter:", err);
    } else {
        console.log("Email transporter is ready to send messages");
    }
})