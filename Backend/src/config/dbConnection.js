const mongoose = require("mongoose");

// function to connect to the database
const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to database successfully");
    } catch (err) {
        console.error("Error connecting to database: ", err);
    }
}

// export the db connection function
module.exports = dbConnection;