const PORT = 3300;
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config()

const app = express();
app.use(express.json());
app.use(cors());

mongoose
    .connect(
      process.env.MONGODB_CONNECT_URL
    )

require('./routes').Api(app)
require('./routes').Admin(app)

require('./scripts/index.js')();

const server = app.listen(3300, () => console.log("server is alive"));
