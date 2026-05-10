const { z } = require("zod");

// PATCH /:fineId/pay
const payFineSchema = z.object({
    amount: z.number({ 
        required_error:  "Payment amount is required!!",
        invalid_type_error: "Amount must be a number!!"
    })
    .positive("Amount must be greater than 0!!")
    .finite("Amount must be a valid number!!")
});

// PATCH /:fineId/waive
const waiveFineSchema = z.object({
    reason: z.string({
        required_error: "Reason is required to waive a fine!!"
    })
    .min(5, "Reason must be at least 5 characters!!")
    .max(300, "Reason must be at most 300 characters!!")
    .trim()
});

module.exports = { payFineSchema, waiveFineSchema };