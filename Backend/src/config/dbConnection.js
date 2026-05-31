const mongoose = require("mongoose");

// function to connect to the database
const dbConnection = async () => {
    try {
        mongoose.connect(process.env.MONGO_URI).then(() => {
            console.log("Connected to DB:", mongoose.connection.name); // logs DB name
        });
    } catch (err) {
        console.error("Error connecting to database: ", err);
    }
}

// export the db connection function
module.exports = dbConnection;