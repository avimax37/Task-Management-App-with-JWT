const jwt = require("jsonwebtoken");
require("dotenv").config();

function tokenGenerator(id, username) {
  const payload = { id, username };
  return jwt.sign(payload, process.env.JWTSECRET, { expiresIn: "1hr" });
}

module.exports = tokenGenerator;
