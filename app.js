
const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'bookStore.db')

let db = null

// Initialize Database and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

// HOME ROUTE
app.get('/', (request, response) => {
  response.send('Welcome to Book Store API')
})

// 1. GET ALL BOOKS
app.get('/books/', async (request, response) => {
  try {
    const getBooksQuery = `
      SELECT * FROM book;
    `

    const books = await db.all(getBooksQuery)

    response.status(200).send(books)
  } catch (error) {
    response.status(500).send('Internal Server Error')
  }
})

// 2. GET ONE BOOK
app.get('/books/:bookId/', async (request, response) => {
  try {
    const {bookId} = request.params

    const getBookQuery = `
      SELECT * FROM book
      WHERE id = ?;
    `

    const book = await db.get(getBookQuery, [bookId])

    if (book === undefined) {
      response.status(404).send('Book Not Found')
    } else {
      response.status(200).send(book)
    }
  } catch (error) {
    response.status(500).send('Internal Server Error')
  }
})

// 3. POST - ADD A NEW BOOK
app.post('/books/', async (request, response) => {
  try {
    const {title, author, price, pages} = request.body

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `

    await db.run(addBookQuery, [
      title,
      author,
      price,
      pages,
    ])

    response.status(201).send('Book Added Successfully')
  } catch (error) {
    response.status(500).send('Internal Server Error')
  }
})

// 4. PUT - UPDATE A BOOK
app.put('/books/:bookId/', async (request, response) => {
  try {
    const {bookId} = request.params
    const {title, author, price, pages} = request.body

    const updateBookQuery = `
      UPDATE book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE id = ?;
    `

    const result = await db.run(updateBookQuery, [
      title,
      author,
      price,
      pages,
      bookId,
    ])

    if (result.changes === 0) {
      response.status(404).send('Book Not Found')
    } else {
      response.status(200).send('Book Updated Successfully')
    }
  } catch (error) {
    response.status(500).send('Internal Server Error')
  }
})

// 5. DELETE - DELETE A BOOK
app.delete('/books/:bookId/', async (request, response) => {
  try {
    const {bookId} = request.params

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `

    const result = await db.run(deleteBookQuery, [bookId])

    if (result.changes === 0) {
      response.status(404).send('Book Not Found')
    } else {
      response.status(200).send('Book Deleted Successfully')
    }
  } catch (error) {
    response.status(500).send('Internal Server Error')
  }
})

// Start the application
initializeDBAndServer()
