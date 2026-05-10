require("dotenv").config();
const validateEnv = require("./src/config/validateEnv");
validateEnv(); // validate env variables before anything else

const express        = require("express");
const cors           = require("cors");
const morgan         = require("morgan");
const mongoSanitize  = require("express-mongo-sanitize");
const helmet         = require("helmet");
const session        = require("express-session");
const { RedisStore } = require("connect-redis");

const dbConnection          = require("./src/config/dbConnection");
const { redisClient, connectRedis } = require("./src/config/redis");
const errorHandler          = require("./src/middleware/errorHandler");
const { apiLimiter }        = require("./src/middleware/rateLimiter");
const { startOverdueCron }  = require("./src/jobs/OverDueJob");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── NoSQL injection sanitization ──────────────────────────────────────────────
app.use((req, res, next) => {
    req.body   = mongoSanitize.sanitize(req.body);
    req.params = mongoSanitize.sanitize(req.params);
    next();
});

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Logging — only in development ─────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin:      process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// ── Session with Redis store ──────────────────────────────────────────────────
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        maxAge:   1000 * 60 * 60 * 24  // 24 hours
    },
    name: "lib.sid"
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ── Landing route ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the Library Management System"
    });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",    require("./src/routes/authRoutes"));
app.use("/api/books",   require("./src/routes/bookRoutes"));
app.use("/api/issues",  require("./src/routes/issueRoute"));
app.use("/api/users",   require("./src/routes/userRoutes"));
app.use("/api/fines",   require("./src/routes/fineRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found!!`
    });
});

// ── Global error handler — MUST be last ───────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        await connectRedis();   // Redis first — sessions depend on it
        console.log("✅ Redis connected");

        await dbConnection();   // then MongoDB
        console.log("✅ MongoDB connected");

        startOverdueCron();     // cron needs DB to be ready
        console.log("✅ Overdue cron scheduled");

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
        });
    } catch (err) {
        console.error("❌ Server failed to start:", err.message);
        process.exit(1);
    }
};

startServer();