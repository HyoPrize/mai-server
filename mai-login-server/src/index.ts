import express from "express";
import session from "express-session";
import FileStore from "session-file-store";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import users from "./routes/users.js";

dotenv.config();

const app = express();

app.use(
    session({
        secret: "@haAdvanced",
        resave: false,
        saveUninitialized: true,
        store: new (FileStore(session))(),
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/users", users);

app.listen(process.env.PORT, () => {
    console.log(`listen : ${process.env.PORT}`);
});
