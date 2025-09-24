import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "zhaopli",
  password: "ZhaoDb2025!",
  database: "commande_db",
  charset: "utf8mb4",
});
