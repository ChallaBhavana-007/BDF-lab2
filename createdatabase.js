
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'bookStore.db')

const createDatabase = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY,
      title TEXT,
      author TEXT,
      price INTEGER,
      pages INTEGER
    );
  `)

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['Wings of Fire', 'APJ Abdul Kalam', 250, 180])

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['Harry Potter', 'J K Rowling', 500, 350])

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['The Alchemist', 'Paulo Coelho', 300, 200])

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['Atomic Habits', 'James Clear', 450, 320])

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 250])

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['The Hobbit', 'J R R Tolkien', 400, 310])

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['Ikigai', 'Hector Garcia', 280, 190])

  await db.run(`
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?)
  `, ['Think and Grow Rich', 'Napoleon Hill', 320, 280])

  console.log('Database and table created successfully')

  const books = await db.all('SELECT * FROM book')
  console.log(books)

  await db.close()
}

createDatabase()
