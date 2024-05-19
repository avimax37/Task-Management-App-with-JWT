const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    const jwtToken = req.header("authToken");
    if (!jwtToken) {
      return res.status(403).json("Not authorized!");
    }
    const payload = jwt.verify(jwtToken, process.env.JWTSECRET);
    // req.userId = payload.id;
    req.user = payload;
    next();
  } catch (error) {
    console.log(error.message);
    res.status(403).send("Not authorized!");
  }
};
