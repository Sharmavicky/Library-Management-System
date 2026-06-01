const SibApiV3Sdk = require("@getbrevo/brevo");

// set API key on the default client FIRST
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendOTPEmail = async (toEmail, otp) => {
    const email = new SibApiV3Sdk.SendSmtpEmail();

    email.sender = { name: "ReadMatrix", email: process.env.EMAIL_USER };
    email.to = [{ email: toEmail }];
    email.subject = "Your ReadMatrix verification code";
    email.htmlContent = `
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
    `;

    try {
        const result = await apiInstance.sendTransacEmail(email);
        console.log("✅ OTP email sent, messageId:", result.messageId);
        return result;
    } catch (err) {
        console.error("❌ Brevo error:", err.message);
        const error = new Error(`Failed to send OTP email to ${toEmail}`);
        error.code = "EMAIL_SEND_FAILURE";
        throw error;
    }
};

const sendReminderEmail = async (toEmail, username, daysLeft, dueDate) => {
    const email = new SibApiV3Sdk.SendSmtpEmail();

    email.sender = { name: "ReadMatrix", email: process.env.EMAIL_USER };
    email.to = [{ email: toEmail }];
    email.subject = `Reminder: Your book is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
    email.htmlContent = `
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
    `;

    try {
        await apiInstance.sendTransacEmail(email);
    } catch (err) {
        console.error("❌ Brevo reminder error:", err.message);
    }
};

module.exports = { sendOTPEmail, sendReminderEmail };