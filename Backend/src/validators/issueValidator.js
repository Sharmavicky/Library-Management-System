const { z } = require("zod");

const objectIdSchema = z.string()
    .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID format");

// POST /api/issues — issue a book
const issueBookSchema = z.object({
    bookId: objectIdSchema,
    userId: objectIdSchema,
});

module.exports = { issueBookSchema };