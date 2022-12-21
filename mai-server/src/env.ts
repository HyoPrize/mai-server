import dotenv from "dotenv";
import path from "path";
import url from "url";

if (process.env.NODE_ENV === "production") {
    process.env.DATA_PATH = "/data";
} else if (process.env.NODE_ENV === "development") {
    process.env.DATA_PATH = path.resolve(url.fileURLToPath(new URL("..", import.meta.url)), "data");
}

dotenv.config();

export const DATA_PATH = process.env.DATA_PATH || "";
