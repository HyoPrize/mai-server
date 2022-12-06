import mysql from "mysql";

const connection = mysql.createConnection({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "maimai",
    database: "mai-db",
});

export default connection;
