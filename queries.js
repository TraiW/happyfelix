const Pool = require('pg').Pool
const env = process.env.NODE_ENV || 'development';

let connectionString = {
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  host: process.env.DATABASE_URL
};
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

const getUsers = (request, response) => {
    pool.query('SELECT * FROM account ORDER BY user_id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  const getUserById = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('SELECT * FROM account WHERE user_id = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  const getUserByPSID = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM account WHERE user_psid = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  const createUser = (request, response) => {
    const { name, psid_number } = request.body
    pool.query('INSERT INTO account (username, user_psid) VALUES ($1, $2) returning user_id', 
    [name, psid_number], 
    (error, results) => {
      if (error) {
        throw error
      }
  
      response.status(201).send(`User added with ID: ${results.rows[0].id}`)
    })
  }
  

  const updateUser = (request, response) => {
    const id = parseInt(request.params.id)
    const { name, psid_number } = request.body
  
    pool.query(
      'UPDATE account SET username = $1, user_psid = $2 WHERE user_id = $3',
      [name, psid_number, id],
      (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).send(`User modified with ID: ${id}`)
      }
    )
  }

  const deleteUser = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('DELETE FROM account WHERE user_id = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User deleted with ID: ${id}`)
    })
  }

  const deleteUserByPSID = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM account WHERE user_psid = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User deleted with psid_number: ${id}`)
    })
  }

  module.exports = {
    getUsers,
    getUserById,
    getUserByPSID,
    createUser,
    deleteUserByPSID,
    updateUser,
    deleteUser,
  }