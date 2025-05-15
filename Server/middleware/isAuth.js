const jwt = require("jsonwebtoken");
const Users = require("../models/UsersSchema")
const secretkey = process.env.secret_jwt;
exports.isauth = async (req,res,next)=>{
try {
   const token = req.cookies.token
    const verify = jwt.verify(token , secretkey);
   const user= await Users.findById(verify.id) 
    if(user){
            req.user =user;
            next();
        }else{

         res.status(400).send({ Msg: "Not authorized. Only admin can post a job" });
        }  
} catch (error) {
    res.status(400).send({ Msg: "failed to verify " ,error });
}
}