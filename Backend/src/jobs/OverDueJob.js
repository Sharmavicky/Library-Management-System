const cron = require("node-cron");
const Fine = require("../../Models/modelExporter").Fine;
const Issue = require("../../Models/modelExporter").Issue;
const User = require("../../Models/modelExporter").User;

const FINE_PER_DAY = 5; // fine per day

// helper function to calculate daysOverDue from a dueDate
const calculateDaysOverDue = (dueDate, now = new Date()) => {
    return Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
};

// Mark overdue issues
const markOverDueIssues = async (now) => {
    const result = await Issue.updateMany({
        returned: false,
        status: "issued",
        dueDate: { $lt: now }
    }, {
        $set: { status: "overdue" }
    })

    return result.modifiedCount;
}

// create missing fines for overdue issues
const createMissingFines = async (now) => {
    // find all overdue issues that don't have a fine
    const overdueIssues = await Issue.fine({
        returned: false,
        status: "overdue",
    }).select("_id member dueDate");

    if (overdueIssues.length === 0) return 0;

    // find which one already have a fine
    const existingFineIssueIds = await Fine.distinct("issue", {
        issue: { $in: overdueIssues.map(issue => issue._id) }
    })

    // filter to issued issues that are overdue and don't have a fine
    const issueWithNoFine = overdueIssues.filter(issue => !existingFineIssueIds.some(id => id.equals(issue._id)));

    if (issueWithNoFine.length === 0) return 0;

    // create fines for the remaining issues
    const finesToCreate = issueWithNoFine.map(issue => {
        const daysOverDue = calculateDaysOverDue(issue.dueDate, now);
        return {
            issue: issue._id,
            member: issue.member,
            daysOverDue,
            ratePerDay: FINE_PER_DAY,
            totalAmount: daysOverDue * FINE_PER_DAY,
            paidAmount: 0,
            status: "pending",
            lastCalculatedAt: now
        }
    })

    await Fine.insertMany(finesToCreate);
    return finesToCreate.length;
}


// recalculate fines on all open (pending/partial) fines
const recalculateOpenFines = async (now) => {
    const openFines = await Fine.find({
        status: { $in: ["pending", "partial"] }
    }).populate("issue", "dueDate");

    if (openFines.length === 0) return 0;

    // bulk write operations to update fines
    const bulkOps = [];

    for (const fine of openFines) {
        if (!fine.issue?.dueDate) continue; // skip if issue or dueDate is missing

        // calculate new daysOverDue and totalAmount
        const daysOverDue = calculateDaysOverDue(fine.issue.dueDate, now);
        const newTotalAmount = daysOverdue * FINE_PER_DAY;

        // only update if there's a change in daysOverDue or totalAmount
        if (newTotalAmount === fine.totalAmount) continue;

        bulkOps.push({
            updateOne: {
                filter: { _id: fine._id },
                update: {
                    $set: {
                        daysOverDue,
                        totalAmount: newTotalAmount,
                        lastCalculatedAt: now
                    }
                }
            }
        })

        updatedCount++;
    }

    // execute bulk update if there are any fines to update
    if (bulkOps.length > 0) {
        await Fine.bulkWrite(bulkOps);
    }

    return updatedCount;
}


// Log a summary so you can see what happened in your server logs
const logSummary = (results, durationMs) => {
    const ts = new Date().toISOString();
    console.log(`
╔══════════════════════════════════════════════╗
║           OVERDUE CRON JOB REPORT            ║
╠══════════════════════════════════════════════╣
║  Ran at        : ${ts.slice(0, 19).replace("T", " ")}       ║
║  Duration      : ${String(durationMs + "ms").padEnd(27)}║
║  Newly overdue : ${String(results.newlyOverdue).padEnd(27)}║
║  Fines created : ${String(results.finesCreated).padEnd(27)}║
║  Fines updated : ${String(results.finesUpdated).padEnd(27)}║
╚══════════════════════════════════════════════╝`
    );
};

// Main function to run the overdue job
const runOverDueJob = async () => {
    const startTime = Date.now();
    const now = new Date();

    try {
        const newlyOverdue = await markOverDueIssues(now);
        const finesCreated = await createMissingFines(now);
        const finesUpdated = await recalculateOpenFines(now);

        logSummary({ newlyOverdue, finesCreated, finesUpdated }, Date.now() - startTime);
    } catch (err) {
        console.error(`[OVERDUE JOB ERROR] ${new Date().toISOString()}:`, err.message);
    }
}

// SCHEDULE
// "0 0 * * *" = every day at midnight (server local time)
// Change to "0 2 * * *" for 2 AM if you want off-peak execution
const startOverdueCron = () => {
    cron.schedule("0 0 * * *", runOverDueJob, {
        scheduled: true,
        timezone:  "Asia/Kolkata"       // server timezone
    });
 
    console.log("Overdue cron job scheduled — runs daily at midnight IST");
};

module.exports = {
    startOverdueCron,
    runOverDueJob,
}