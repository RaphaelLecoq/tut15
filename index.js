const { Pool } = require("pg");
const dotenv = require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2
});

pool.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err.message);
    } else {
        console.log("Successful connection to the database");
    }
});

const setupDatabase = async () => {
  try {
      console.log("Setting up the database...");
      
      const sql_create = `
          CREATE TABLE IF NOT EXISTS Books (
              Book_ID SERIAL PRIMARY KEY,
              Title VARCHAR(100) NOT NULL,
              Author VARCHAR(100) NOT NULL,
              Comments TEXT
          );
      `;
      await pool.query(sql_create);
      console.log("Table 'Books' created successfully.");

      const sql_insert = `
          INSERT INTO Books (Book_ID, Title, Author, Comments) VALUES
              (1, 'Mrs. Bridge', 'Evan S. Connell', 'First in the series'),
              (2, 'Mr. Bridge', 'Evan S. Connell', 'Second in the series'),
              (3, 'L''ingénue libertine', 'Colette', 'Minne + Les égarements de Minne')
          ON CONFLICT DO NOTHING;
      `;
      await pool.query(sql_insert);
      console.log("Initial books data seeded successfully.");
  } catch (err) {
      console.error("Error setting up the database:", err.message);
  }
};

setupDatabase();

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Server configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false })); // <--- middleware configuration

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/data", (req, res) => {
    const test = {
        title: "Test",
        items: ["one", "two", "three"]
    };
    res.render("data", { model: test });
});

app.get("/books", (req, res) => {
    const sql = "SELECT * FROM Books ORDER BY Title";
    pool.query(sql, [], (err, result) => {
        if (err) {
            console.error("Error fetching books:", err.message);
            res.status(500).send("Internal Server Error");
        } else {
            res.render("books", { model: result.rows });
        }
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started (http://localhost:${port}/)`);
});

// GET /edit/5
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Books WHERE Book_ID = $1";
  pool.query(sql, [id], (err, result) => {
    // if (err) ...
    res.render("edit", { model: result.rows[0] });
  });
});

// POST /edit/5
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const book = [req.body.title, req.body.author, req.body.comments, id];
  const sql = "UPDATE Books SET Title = $1, Author = $2, Comments = $3 WHERE (Book_ID = $4)";
  pool.query(sql, book, (err, result) => {
    // if (err) ...
    res.redirect("/books");
  });
});

// GET /create
app.get("/create", (req, res) => {
  res.render("create", { model: {} });
});

// GET /create
app.get("/create", (req, res) => {
  const book = {
    Author: "Victor Hugo"
  }
  res.render("create", { model: book });
});

// POST /create
app.post("/create", (req, res) => {
  const sql = "INSERT INTO Books (Title, Author, Comments) VALUES ($1, $2, $3)";
  const book = [req.body.title, req.body.author, req.body.comments];
  pool.query(sql, book, (err, result) => {
    // if (err) ...
    res.redirect("/books");
  });
});

// GET /delete/5
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Books WHERE Book_ID = $1";
  pool.query(sql, [id], (err, result) => {
    // if (err) ...
    res.render("delete", { model: result.rows[0] });
  });
});

// POST /delete/5
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM Books WHERE Book_ID = $1";
  pool.query(sql, [id], (err, result) => {
    // if (err) ...
    res.redirect("/books");
  });
});
