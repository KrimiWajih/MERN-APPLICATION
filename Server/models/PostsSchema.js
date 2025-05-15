const mongoose = require("mongoose");
const PostsSchema = mongoose.Schema({
userID :{type : mongoose.Schema.Types.ObjectId , ref : "Users" , required : true},
content : {type : String,default :""},
media : [{type : String}], 
type : {type : String , default : "original" ,enum : ["original","repost","quote"]},
likesCount :{type : Number , default : 0},
listUsers : [{type : mongoose.Schema.Types.ObjectId , ref : "Users"}],
originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
},{ timestamps: true })

const Collection = mongoose.model("Posts" , PostsSchema)
module.exports= Collection;