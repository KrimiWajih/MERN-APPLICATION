const mongoose = require("mongoose");
const UsersSchema = new mongoose.Schema({
    name : {type : String ,required :true},
    email : {type : String , required : true , unique : true , index:true},
    username : {type :String , required : true , unique : true,index : true},
   password :{type : String , required : true},
   status :{type : String  , default :"unverified" , enum : ["verified" ,"unverified"]},
   bio :{type : String , default : ""},
   location :{type : String , default : ""},
   profilepic : {type : String , default :"https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740"},
   coverpic :{type:String , default :"https://flowbite.com/docs/images/examples/image-3@2x.jpg"},
   followers :[{type : mongoose.Schema.Types.ObjectId , ref : "Users"}],
   following : [{type : mongoose.Schema.Types.ObjectId , ref : "Users"}],
   bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Posts" }],
  listFriends :[{type : mongoose.Schema.Types.ObjectId , ref : "Users"}]
}, {timestamps: true})
const Collection = mongoose.model("Users",UsersSchema);
module.exports = Collection;