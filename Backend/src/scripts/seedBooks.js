const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose     = require("mongoose");
const axios        = require("axios");
const Book         = require("../../Models/book-model");
const dbConnection = require("../config/dbConnection");

const GUTENBERG_API = "https://gutendex.com/books";
const TARGET_TOTAL  = 500;

// ─── Transform raw Gutenberg book → your schema ──────────────────────────────
const transformBook = (raw) => {
    const formats = raw.formats || {};

    return {
        title: raw.title,

        // "Austen, Jane" → "Jane Austen", multiple authors joined by comma
        author: (raw.authors || [])
            .map(a => {
                const parts = a.name.split(", ");
                return parts.length === 2 ? `${parts[1]} ${parts[0]}` : a.name;
            })
            .join(", "),

        summary:  (raw.summaries || [])[0] || null,   // first summary only
        coverImage: formats["image/jpeg"] || null,
        bookshelves: raw.bookshelves || [],

        plainTextUrl: formats["text/plain; charset=utf-8"] || formats["text/plain; charset=us-ascii"] || null,

        totalCopies:     5,
        availableCopies: 5,
    };
};

// ─── Main Seed Function ───────────────────────────────────────────────────────
const seedBooks = async () => {
    await dbConnection();
    console.log("📚 Seeding started!\n");

    let imported = 0;
    let skipped  = 0;   // already exists in DB
    let failed   = 0;   // no plainTextUrl
    let page     = 1;   // Gutenberg pages start at 1, not 0

    while (imported < TARGET_TOTAL) {
        console.log(`Fetching page ${page}...`);

        try {
            //axios returns response.data, destructure properly
            const { data } = await axios.get(GUTENBERG_API, {
                params: {
                    page,
                    languages: "en",
                    copyright: "false",
                    mime_type: "text/html",
                },
                timeout: 10000,
            });

            for (const raw of data.results) {
                if (imported >= TARGET_TOTAL) break;

                const transformed = transformBook(raw);

                // check plainTextUrl not readUrl
                if (!transformed.plainTextUrl) {
                    failed++;
                    continue;
                }

                // upsert by title since gutenbergId isn't in schema
                const result = await Book.updateOne(
                    { title: transformed.title },
                    { $setOnInsert: transformed },
                    { upsert: true }
                );

                result.upsertedCount ? imported++ : skipped++;
            }

            console.log(
                `Page ${page} done — ` +
                `imported: ${imported}, skipped: ${skipped}, no-url: ${failed}`
            );

            // stop early if Gutenberg has no more pages
            if (!data.next) {
                console.log("\n⚠️  Ran out of pages before reaching 500.");
                break;
            }

            page++;

            // polite delay — don't hammer Gutenberg's server
            await new Promise(r => setTimeout(r, 300));

        } catch (err) {
            console.error(`❌ Error on page ${page}:`, err.message);
            page++;   // skip bad page, keep going
        }
    }

    console.log(`\n🎉 Seed complete!`);
    console.log(`   Imported : ${imported}`);
    console.log(`   Skipped  : ${skipped} (already in DB)`);
    console.log(`   Rejected : ${failed}  (no plain text URL)`);

    await mongoose.connection.close();
    console.log("   DB connection closed.");
};

seedBooks().catch(console.error);