const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendReminderEmail = async (toEmail, username, daysLeft, dueDate) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "ReadMatrix <onboarding@resend.dev>", // replace with your domain once verified
            to: toEmail,
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

        if (error) {
            console.error("❌ Resend reminder error:", error);
            return;
        }

        console.log(`✅ Reminder email sent to ${toEmail}, id: ${data.id}`);
    } catch (err) {
        console.error("❌ Resend reminder exception:", err.message);
    }
};

module.exports = { sendReminderEmail };