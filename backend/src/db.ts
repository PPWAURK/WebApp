import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "zhao",
  password: "ZhaoDb2025!",
  database: "commande_db",
  charset: "utf8mb4",
});
