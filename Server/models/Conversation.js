const mongoose = require("mongoose")
const ConversationSchema = new mongoose.Schema({
    participants : {type: [{
        type : mongoose.Schema.Types.ObjectId , ref : "Users"
    }]},
    lastmessage : {type : mongoose.Schema.Types.ObjectId ,ref : "Messages"}
})

ConversationSchema.index({participants : 1})  //appoint participants as index
const Collection = mongoose.model("Conversations",ConversationSchema)
module.exports = Collection