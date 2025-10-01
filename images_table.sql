-- CREATE DATABASE image_app;
-- USE image_app;


-- CREATE TABLE IF NOT EXISTS images (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   prompt TEXT,
--   filename VARCHAR(255)
-- );


-- CREATE TABLE images (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     url VARCHAR(255) NOT NULL,
--     prompt TEXT
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );



CREATE DATABASE IF NOT EXISTS image_app;
USE image_app;

CREATE TABLE IF NOT EXISTS images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prompt TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL
);

