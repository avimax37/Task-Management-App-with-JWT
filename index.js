const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());
const port = process.env.PORT;

app.use("/jwtapi/v1", require("./routes/api"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
