const validateEnv = () => {
    const required = [
        "MONGODB_URI",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "REDIS_URL",
        "PORT",
        "NODE_ENV"
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error("\n❌ Missing required environment variables:");
        missing.forEach(key => console.error(`   - ${key}`));
        console.error("\nAdd them to your .env file and restart.\n");
        process.exit(1); // kill the process immediately — don't start the server
    }

    // warn about weak secrets in production
    if (process.env.NODE_ENV === "production") {
        const weakSecrets = ["JWT_SECRET", "JWT_REFRESH_SECRET"].filter(
            key => process.env[key].length < 32
        );
        if (weakSecrets.length > 0) {
            console.warn("\n⚠️  Weak secrets detected in production:");
            weakSecrets.forEach(key => console.warn(`   - ${key} should be at least 32 characters`));
            console.warn("");
        }
    }

    console.log("✅ Environment variables validated");
};

module.exports = validateEnv;