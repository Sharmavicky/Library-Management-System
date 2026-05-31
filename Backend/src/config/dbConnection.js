const mongoose = require("mongoose");

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB:", mongoose.connection.name);
    } catch (err) {
        console.error("Error connecting to database:", err);
    }
};

module.exports = dbConnection;