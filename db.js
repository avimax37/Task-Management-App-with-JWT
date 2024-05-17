const Pool = require("pg").Pool;
require("dotenv").config();

const dbconfig = `postgresql://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBHOST}:${process.env.DBPORT}/${process.env.DBNAME}`;

const pool = new Pool({ connectionString: dbconfig });

module.exports = pool;
