
const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'books.db')
let db = null

// Initialize database
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    await db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL
      )
    `)

    // Automatically insert sample books
    const existingBooks = await db.get(
      'SELECT COUNT(*) AS count FROM books'
    )

    if (existingBooks.count === 0) {
      const sampleBooks = [
        ['Harry Potter', 'J K Rowling', 450],
        ['The Alchemist', 'Paulo Coelho', 300],
        ['Wings of Fire', 'APJ Abdul Kalam', 250],
        ['Atomic Habits', 'James Clear', 399],
        ['The Jungle Book', 'Rudyard Kipling', 200],
        ['Rich Dad Poor Dad', 'Robert Kiyosaki', 350],
      ]

      for (const book of sampleBooks) {
        await db.run(
          `INSERT INTO books (title, author, price)
           VALUES (?, ?, ?)`,
          book
        )
      }

      console.log('Sample books added successfully')
    }

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Database Error: ${error.message}`)
  }
}

initializeDBAndServer()

const allowedColumns = ['id', 'title', 'author', 'price']

// Home route - avoids Cannot GET /
app.get('/', (request, response) => {
  response.send(`
    <h1>Welcome to Book Management API</h1>
    <h2>Lab 3 - REST API</h2>
    <p>Your server is running successfully!</p>
    <a href="/books">Click here to view all books</a>
  `)
})

// GET all books with search, sorting and filtering
app.get('/books', async (request, response) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0',
      min_price,
      max_price,
    } = request.query

    if (
      !allowedColumns.includes(order_by) ||
      !['ASC', 'DESC'].includes(order.toUpperCase())
    ) {
      return response.status(400).json({
        message: 'Invalid sorting parameters',
      })
    }

    const pageLimit = Number(limit)
    const pageOffset = Number(offset)

    if (
      !Number.isInteger(pageLimit) ||
      !Number.isInteger(pageOffset) ||
      pageLimit < 1 ||
      pageOffset < 0
    ) {
      return response.status(400).json({
        message: 'Invalid limit or offset',
      })
    }

    const minPrice =
      min_price === undefined ? null : Number(min_price)

    const maxPrice =
      max_price === undefined ? null : Number(max_price)

    if (
      (min_price !== undefined &&
        (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (max_price !== undefined &&
        (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== null &&
        maxPrice !== null &&
        minPrice > maxPrice)
    ) {
      return response.status(400).json({
        message: 'Invalid price range',
      })
    }

    let query = 'SELECT * FROM books WHERE title LIKE ?'
    const values = [`%${search_q}%`]

    if (minPrice !== null && maxPrice !== null) {
      query += ' AND price BETWEEN ? AND ?'
      values.push(minPrice, maxPrice)
    } else if (minPrice !== null) {
      query += ' AND price >= ?'
      values.push(minPrice)
    } else if (maxPrice !== null) {
      query += ' AND price <= ?'
      values.push(maxPrice)
    }

    query += ` ORDER BY ${order_by} ${order.toUpperCase()} LIMIT ? OFFSET ?`
    values.push(pageLimit, pageOffset)

    const books = await db.all(query, values)

    response.status(200).json(books)
  } catch (error) {
    response.status(500).json({
      message: 'Unable to get books',
    })
  }
})

// GET book by ID
app.get('/books/:id', async (request, response) => {
  try {
    const {id} = request.params

    if (!/^[1-9]\d*$/.test(id)) {
      return response.status(400).json({
        message: 'Invalid book ID',
      })
    }

    const book = await db.get(
      'SELECT * FROM books WHERE id = ?',
      [id]
    )

    if (!book) {
      return response.status(404).json({
        message: 'Book not found',
      })
    }

    response.status(200).json(book)
  } catch (error) {
    response.status(500).json({
      message: 'Unable to get book',
    })
  }
})

// Validate book details
const validateBook = (body = {}) => {
  const {title, author, price} = body

  if (
    typeof title !== 'string' ||
    title.trim() === '' ||
    typeof author !== 'string' ||
    author.trim() === ''
  ) {
    return 'Title and author are required'
  }

  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return 'Price must be a valid non-negative number'
  }

  return null
}

// POST - Add a new book
app.post('/books', async (request, response) => {
  try {
    const errorMessage = validateBook(request.body || {})

    if (errorMessage) {
      return response.status(400).json({
        message: errorMessage,
      })
    }

    const {title, author, price} = request.body

    const result = await db.run(
      `INSERT INTO books (title, author, price)
       VALUES (?, ?, ?)`,
      [title.trim(), author.trim(), price]
    )

    response.status(201).json({
      message: 'Book added successfully',
      bookId: result.lastID,
    })
  } catch (error) {
    response.status(500).json({
      message: 'Unable to add book',
    })
  }
})

// PUT - Update book
app.put('/books/:id', async (request, response) => {
  try {
    const {id} = request.params

    if (!/^[1-9]\d*$/.test(id)) {
      return response.status(400).json({
        message: 'Invalid book ID',
      })
    }

    const errorMessage = validateBook(request.body || {})

    if (errorMessage) {
      return response.status(400).json({
        message: errorMessage,
      })
    }

    const {title, author, price} = request.body

    const result = await db.run(
      `UPDATE books
       SET title = ?, author = ?, price = ?
       WHERE id = ?`,
      [title.trim(), author.trim(), price, id]
    )

    if (result.changes === 0) {
      return response.status(404).json({
        message: 'Book not found',
      })
    }

    response.status(200).json({
      message: 'Book updated successfully',
    })
  } catch (error) {
    response.status(500).json({
      message: 'Unable to update book',
    })
  }
})

// DELETE - Delete book
app.delete('/books/:id', async (request, response) => {
  try {
    const {id} = request.params

    if (!/^[1-9]\d*$/.test(id)) {
      return response.status(400).json({
        message: 'Invalid book ID',
      })
    }

    const result = await db.run(
      'DELETE FROM books WHERE id = ?',
      [id]
    )

    if (result.changes === 0) {
      return response.status(404).json({
        message: 'Book not found',
      })
    }

    response.status(200).json({
      message: 'Book deleted successfully',
    })
  } catch (error) {
    response.status(500).json({
      message: 'Unable to delete book',
    })
  }
})

module.exports = app
