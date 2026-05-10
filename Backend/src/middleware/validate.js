const { ZodError } = require("zod");

// reusable middleware factory — pass any zod schema
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        // format zod errors into clean array of messages
        const errors = result.error.errors.map(err => ({
            field:   err.path.join("."),    // e.g. "email", "password"
            message: err.message            // e.g. "Please enter a valid email"
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed!!",
            errors
        });
    }

    // attach validated + sanitized data to req
    req.body = result.data;
    next();
};

module.exports = validate;