
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'bookStore.db')

const createDatabase = async () => {
  try {
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

    const insertBookQuery = `
      INSERT OR IGNORE INTO book
      (id, title, author, price, pages)
      VALUES (?, ?, ?, ?, ?);
    `

    const books = [
  [1, 'The Great Gatsby', 'F Scott Fitzgerald', 350, 180],
  [2, 'Pride and Prejudice', 'Jane Austen', 280, 250],
  [3, 'The Jungle Book', 'Rudyard Kipling', 220, 190],
  [4, 'The Fault in Our Stars', 'John Green', 400, 300],
  [5, 'The Book Thief', 'Markus Zusak', 450, 400],
  [6, 'A Brief History of Time', 'Stephen Hawking', 500, 256],
  [7, 'The Secret Garden', 'Frances Hodgson Burnett', 260, 240],
  [8, 'Little Women', 'Louisa May Alcott', 320, 350],
]

    for (const book of books) {
      await db.run(insertBookQuery, book)
    }

    const result = await db.all('SELECT * FROM book')

    console.log('Database and table created successfully')
    console.log(result)

    await db.close()
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }
}

createDatabase()
