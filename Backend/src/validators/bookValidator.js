const { z } = require("zod");

const updateBookSchema = z.object({
    title:      z.string().min(1).optional(),
    author:     z.string().min(1).optional(),
    summary:    z.string().optional(),
    coverImage: z.string().url("Must be a valid URL").optional(),
    totalCopies: z.number().int().positive().optional()
}).strict();  // .strict() rejects any extra fields not in schema

const addBookSchema = z.object({
    title:       z.string().min(1, "Title is required!!"),
    author:      z.string().min(1, "Author is required!!"),
    isbn:        z.string().optional(),
    summary:     z.string().optional(),
    coverImage:  z.string().url("Must be a valid URL").optional(),
    bookshelves: z.array(z.string()).optional(),
    totalCopies: z.number()
                  .int("Must be a whole number!!")
                  .positive("Must be at least 1!!")
                  .default(1),
}).strict();

module.exports = { updateBookSchema, addBookSchema };