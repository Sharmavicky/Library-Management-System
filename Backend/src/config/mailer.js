const nodemailer = require("nodemailer");

const getTransporter = () => nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,  // your gmail address
        pass: process.env.EMAIL_PASS,  // gmail app password (not your real password)
    },
});

const sendOTPEmail = async (toEmail, otp) => {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
        from:    `"ReadMatrix" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: "Your ReadMatrix verification code",
        html: `
            <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
                <h2 style="color:#4f46e5;margin-bottom:8px">ReadMatrix</h2>
                <p style="color:#374151;margin-bottom:24px">
                    Use the code below to verify your account.
                    It expires in <strong>10 minutes</strong>.
                </p>
                <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center">
                    <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#111827">
                        ${otp}
                    </span>
                </div>
                <p style="color:#9ca3af;font-size:12px;margin-top:24px">
                    If you didn't request this, ignore this email.
                </p>
            </div>
        `,
    });

    // check for invalid email and other errors
    if (info.rejected && info.rejected.length > 0) {
        const error = new Error(`Failed to send OTP email to ${toEmail}`);
        error.code = "EMAIL_SEND_FAILURE";
        throw error;
    }

    return info;
};

const sendReminderEmail = async (toEmail, username, daysLeft, dueDate) => {
    const transporter = getTransporter();
    await transporter.sendMail({
        from:    `"ReadMatrix" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `Reminder: Your book is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        html: `
            <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
                <h2 style="color:#4f46e5">ReadMatrix</h2>
                <p>Hi <strong>${username}</strong>,</p>
                <p>This is a reminder that a book you borrowed is due in
                   <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>
                   on <strong>${new Date(dueDate).toDateString()}</strong>.
                </p>
                <p>Please return it on time to avoid a fine of <strong>₹5/day</strong>.</p>
                <p style="color:#9ca3af;font-size:12px;margin-top:24px">
                    — ReadMatrix Team
                </p>
            </div>
        `,
    });
};

module.exports = { sendOTPEmail, sendReminderEmail };