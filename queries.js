const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  const getUserById = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  const getUserByPSID = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM users WHERE psid_number = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  const createUser = (request, response) => {
    const { name, psid_number } = request.body
    pool.query('INSERT INTO users (name, psid_number) VALUES ($1, $2) returning id', 
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
      'UPDATE users SET name = $1, psid_number = $2 WHERE id = $3',
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
  
    pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User deleted with ID: ${id}`)
    })
  }

  const deleteUserByPSID = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM users WHERE psid_number = $1', [id], (error, results) => {
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