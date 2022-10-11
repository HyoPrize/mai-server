import mysql2 from "mysql2";

const pool = mysql2.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "maimai",
    database: "mai-db",
});
const promiseConnection = pool.promise();

export default promiseConnection;
