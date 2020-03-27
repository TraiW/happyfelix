const Pool = require('pg').Pool
const env = process.env.NODE_ENV || 'development';

let connectionString = {
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  host: process.env.DATABASE_URL
};
console.log("=> Environement DB : "+env)
// checking to know the environment and suitable connection string to use
if (env === 'development') {
  connectionString.database = process.env.DB_NAME;
} else {
  connectionString = {
  connectionString: 'postgres://srrqenjxjdmgik:8315ed3b80426a9373770951fe7c6db98f8a47c9706bfc8219c4e3e33507ee4a@ec2-176-34-97-213.eu-west-1.compute.amazonaws.com:5432/d8rkfed7ca598b',
  ssl: true
  };
};
const pool = new Pool(connectionString);

pool.on('connect', () => console.log('connected to db'));

var getUserByPSID = function(psid, callback) {

    pool.query('SELECT * FROM account WHERE user_psid = $1', [psid], function(err, result) {
        if(err)
            return callback(err);
        callback(null, result.rowCount);
    })
}

var createUser = function(name,psid_number, callback) {

    pool.query('INSERT INTO account (username, user_psid) VALUES ($1, $2) returning user_id',
    [name, psid_number], function(err, result) {
        if(err)
            return callback(err);
        callback(results.rows[0].id);
    })
}


module.exports = {
    getUserByPSID,
    createUser,
  }