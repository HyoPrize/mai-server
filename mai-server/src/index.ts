import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import url from "url";

import users from "./routes/users.js";
import places from "./routes/places.js";
import shares from "./routes/shares.js";

process.env.DIR_PATH = url.fileURLToPath(new URL(".", import.meta.url));
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", express.static("public"));

app.use("/users", users);
app.use("/places", places);
app.use("/shares", shares);

app.listen(process.env.PORT, () => {
    console.log(`listen : ${process.env.PORT}`);
});
