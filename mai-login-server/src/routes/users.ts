import express from "express";
import { createHash } from "crypto";

import connection from "../db/db.js";
import promiseConnection from "../db/db2.js";
import { IUsers, SignUpInfo, LoginInfo } from "../types.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("user server");
});

router.post("/register", async (req, res) => {
    const signUpInfo: SignUpInfo = req.body;

    const findQuery = `SELECT * FROM USERS WHERE user_id="${signUpInfo.userId}" or user_email="${signUpInfo.userEmail}"`;
    const [result, fields] = await promiseConnection.query<IUsers[]>(findQuery);

    if (result.length > 0) {
        res.json({
            isSuccess: false,
        });
        return;
    }

    const salt = Math.round(new Date().valueOf() * Math.random()) + "";
    const hashPassword = createHash("sha512")
        .update(signUpInfo.userPassword + salt)
        .digest("hex");

    const insertQuery = `INSERT INTO USERS(user_id, user_email, user_password, user_salt) VALUES("${signUpInfo.userId}", "${signUpInfo.userEmail}", "${hashPassword}", "${salt}")`;
    connection.query(insertQuery, (error, rows) => {
        if (error) {
            console.log(error);
            res.json({
                isSuccess: false,
            });
        } else {
            res.json({
                isSuccess: true,
            });
        }
    });
});

router.post("/login", async (req, res) => {
    const loginInfo: LoginInfo = req.body;

    const query = `SELECT * FROM USERS WHERE user_id = "${loginInfo.userId}"`;
    const [result, fields] = await promiseConnection.query<IUsers[]>(query);

    if (result.length > 0) {
        const hashPassword = createHash("sha512")
            .update(loginInfo.userPassword + result[0].user_salt)
            .digest("hex");

        if (result[0].user_password === hashPassword) {
            req.session.userId = loginInfo.userId;
            req.session.userEmail = result[0].user_email;
            req.session.is_logined = true;
            res.json({
                isSuccess: true,
            });
        } else {
            res.json({
                isSuccess: false,
            });
        }
    } else {
        res.json({
            isSuccess: false,
        });
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log(error);
        }
    }); // 내부 sessions 폴터 캐쉬 삭제
    res.clearCookie("sid");
    res.send("logout");
});

router.get("/check", (req, res) => {
    if (req.session.is_logined) {
        return res.json({ message: "user 있다" });
    } else {
        return res.json({ message: "user 없음" });
    }
});

export default router;
