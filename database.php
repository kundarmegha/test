<?php
$servername = "localhost";
$username = "username";
$password = "password";

// Creating a connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Creating a database named newDB
$sql = "CREATE DATABASE newDB";
if ($conn->query($sql) === TRUE) {
  echo "Database created successfully with the name newDB";
}
else {
  echo "Error creating database: " . $conn->error;
}

// closing connection
$conn->close();
?>
