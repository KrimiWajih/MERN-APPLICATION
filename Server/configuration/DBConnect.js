const mongoose = require("mongoose")
const dotenv =require("dotenv")
dotenv.config()
const database = process.env.MONGO_URL

exports.connectDB =async ()=>{
    try {
       await mongoose.connect(database)
        console.log('Mongo URI on Render:', process.env.PORT);
        console.log("Connected to Database")
    } catch (error) {
        console.log('Mongo URI on Render:', process.env.MONGO_URI);
        console.log("Failed to Connect to Database")
    }
}
