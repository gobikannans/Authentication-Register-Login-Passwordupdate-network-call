const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

// Register user API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const userQuery = `
        SELECT *
        FROM user
        WHERE 
        username='${username}';`;
  const dbuser = await db.get(userQuery);

  if (dbuser === undefined) {
    const addUserQuery = `
        INSERT INTO
        user  (username, name, password, gender, location) 
        VALUES
        ("${username}",'${name}','${hashedPassword}','${gender}','${location}');`;

    if (password.length > 5) {
      await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login user API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT *
    FROM 
    user
    WHERE 
    username='${username}';`;

  const dbuser = await db.get(selectUserQuery);
  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbuser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// UPDATE password API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUserQuery = `
    SELECT *
    FROM 
    user
    WHERE 
    username='${username}';`;

  const dbuser = await db.get(selectUserQuery);

  const passwordMatched = await bcrypt.compare(oldPassword, dbuser.password);
  if (passwordMatched === true) {
    if (newPassword.length > 5) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `
          UPDATE 
          user
          SET 
          password='${hashedPassword}'
          WHERE 
          username='${username}';`;

      const updatePassword = await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
