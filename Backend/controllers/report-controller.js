const Book = require("../Models/modelExporter").Book;
const User = require("../Models/modelExporter").User;
const Fine = require("../Models/modelExporter").Fine;
const Issue = require("../Models/modelExporter").Issue;

/*
    Get report of all overdue books (Protected route, accessible by admins only)
    GET /api/reports/summary
*/

exports.getSummary = async (req, res, next) => {
    try {
        const [
            totalBooks,
            totalMembers,
            activeIssuances,
            overdueIssuances,
            totalBooksAvailable,
            fineStats,
            recentIssuances,
            topBorrowedBooks
        ] = await Promise.all([

            // total books in catlog
            Book.countDocuments(),

            // total active members (not admin)
            User.countDocuments({ role: "member" }),

            // current issued (not retuned, not overdue)
            Issue.countDocuments({ returned: false, status: "issued" }),

            // currently overdue
            Issue.countDocuments({ returned: false, status: "overdue" }),

            // sum of all availableCopies across all books
            Book.aggregate([
                { $group: { _id: null, total: { $sum: "$availableCopies" } } }
            ]),

            // fine revenue breakdown
            Fine.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRaised: { $sum: "$totalAmount" }, // all fines ever created
                        totalCollected: { $sum: "$paidAmount" }, // all fines paid so far
                        totalOutstanding: { // balance still owed
                            $sum: {
                                $cond: [
                                    { $in: ["$status", ["pending", "partial"]] },
                                    { $subtract: ["$totalAmount", "$paidAmount"] },
                                    0
                                ]
                            }
                        },
                        totalWaived: {
                            $sum: {
                                $cond: [
                                    { $in: ["$status", "waived"] },
                                    "$totalAmount",
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),

            // 5 most recent issues for the dashboard table
            Issue.find()
                .populate("book", "author title coverImage")
                .populate("member", "username email")
                .sort({ createdAt: -1 })
                .limit(5),

            // top 5 most borrowed books of all times
            Issue.aggregate([
                { $group: { _id: null, totalIssued: { $sum: 1 } } },
                { $sort: { totalIssued: -1 } },
                { $limit: 5 },
                { $lookup: {
                    from : "book", 
                    localField: "_id",
                    foreignField: "_id",
                    as: "book"
                }},
                { $unwind: "$book" },
                { $project: {
                    _id: 0,
                    totalIssued: 1,
                    "book.title": 1,
                    "book.author": 1,
                    "book.coverImage": 1,
                }},
            ])
        ]);

        // pull fine stats out of aggregate result
        const fines = fineStats[0] ?? {
            totalRaised:      0,
            totalCollected:   0,
            totalOutstanding: 0,
            totalWaived:      0
        }

        return res.status(200).json({
            success: true,
            message: "Summary retrieved successfully!!",
            summary: {
                books: {
                    total:     totalBooks,
                    available: totalBooksAvailable[0]?.total ?? 0,
                    issued:    activeIssuances,
                    overdue:   overdueIssuances,
                },
                members: {
                    total: totalMembers,
                },
                fines: {
                    totalRaised:      fines.totalRaised,
                    totalCollected:   fines.totalCollected,
                    totalOutstanding: fines.totalOutstanding,
                    totalWaived:      fines.totalWaived,
                },
                recentIssuances,
                topBorrowedBooks
            }
        });
    } catch (err) {
        next(err);
    }
}