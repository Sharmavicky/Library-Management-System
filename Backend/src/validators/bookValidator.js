const { z } = require("zod");

const updateBookSchema = z.object({
    title:      z.string().min(1).optional(),
    author:     z.string().min(1).optional(),
    summary:    z.string().optional(),
    coverImage: z.string().url("Must be a valid URL").optional(),
}).strict();  // .strict() rejects any extra fields not in schema

module.exports = { updateBookSchema };