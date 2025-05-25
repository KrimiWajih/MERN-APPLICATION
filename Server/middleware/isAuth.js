const jwt = require("jsonwebtoken");
const Users = require("../models/UsersSchema")
const secretkey = process.env.SECRET_JWT;
exports.isauth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log('Token received:', token);
    if (!token) {
      return res.status(401).send({ Msg: 'No token provided' });
    }
    const verify = jwt.verify(token, secretkey);
    console.log('Verified token:', verify);
    const user = await Users.findById(verify.id);
    if (!user) {
      return res.status(404).send({ Msg: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in isauth:', error.message);
    res.status(401).send({ Msg: 'Failed to verify token', error: error.message });
  }
};
