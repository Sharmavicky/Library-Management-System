require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const dbConnection = require("./src/config/dbConnection");
const { redisClient, connectRedis } = require("./src/config/redis");
const authRoutes = require("./src/routes/authRoutes");
const bookRoutes = require("./src/routes/bookRoutes");
const issueRoutes = require("./src/routes/issueRoute");

const app = express();

// middleware to parse JSON requests
app.use(express.json());

// allow cross-origin requests
app.use(cors());

// configure session middleware with Redis store
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
    name: "lib.sid",
}));

// landing page route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the Library Management System"
    });
});

// auth routes
app.use("/api/auth", authRoutes);

// book routes
app.use("/api/books", bookRoutes);

// issue routes
app.use("/api/issues", issueRoutes);

// Connect to Redis and DB first, then start the server
const startServer = async () => {
    await connectRedis();   // must be ready before sessions are used
    dbConnection();

    app.listen(process.env.PORT, () => {
        console.log(`Server is up and running on http://localhost:${process.env.PORT}`);
    });
};

startServer();