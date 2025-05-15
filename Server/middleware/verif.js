const {body , validationResult} = require("express-validator");
exports.signupvalidation = [
    body("email" , "The email you enterd is invalid").isEmail(),
    body("password", "This password is not Strong").isStrongPassword({
        minLength : 8,
        minLowercase :1,
        minUppercase :1,
        minNumbers : 1,
    })
]

exports.validation = (req,res,next)=>{
    const errors = validationResult(req);
    if(errors.isEmpty()){
        next();
    }else{
        res.status(400).send({Msg : errors.array().map(el => el.msg)});
    }
}