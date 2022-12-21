import express from "express";
import cors from "cors";

import { DATA_PATH } from "./env.js";
import users from "./routes/users.js";
import places from "./routes/places.js";
import shares from "./routes/shares.js";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/models", express.static(path.join(DATA_PATH, "models")));
app.use("/resources", express.static(path.join(DATA_PATH, "resources")));

app.use("/users", users);
app.use("/places", places);
app.use("/shares", shares);

app.listen(process.env.PORT, () => {
    console.log(`listen : ${process.env.PORT}`);
});
