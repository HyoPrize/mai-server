import express, { response } from "express";
import { createHash } from "crypto";

import connection from "../db/db.js";
import promiseConnection from "../db/db2.js";
import { IUser, IFavorite, IHistory, SignUpInfo, LoginInfo, PlaceInfo, IPlace, ValidMailInfo } from "../types.js";
import jwk, { UserJwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";
import path from "path";
import ejs from "ejs";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("user server");
});

router.post("/valid-mail", async (req, res) => {
    const validMailInfo = req.body as ValidMailInfo;
    let authNum = Math.random().toString().slice(2, 8);
    let emailTemplete;

    ejs.renderFile(path.resolve("public/resources/mail.ejs"), { authCode: authNum }, function (err, data) {
        if (err) {
            console.log(err);
        }
        emailTemplete = data;
    });

    let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAILER_ID,
            pass: process.env.MAILER_PASSWORD,
        },
    });

    let mailOptions = await transporter.sendMail({
        from: `IAM.tukorea`,
        to: validMailInfo.email,
        subject: "[IAM] MAI 서비스 회원가입을 위한 인증코드를 입력해주세요.",
        html: emailTemplete,
    });

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
        console.log("Finish sending email : " + info.response);
        res.send(authNum);
        transporter.close();
    });
});

router.post("/register", async (req, res) => {
    const signUpInfo: SignUpInfo = req.body;

    const userQuery = `SELECT * FROM USERS WHERE user_id="${signUpInfo.userId}" or user_email="${signUpInfo.userEmail}"`;
    const [result, fields] = await promiseConnection.query<IUser[]>(userQuery);

    if (result.length > 0) {
        res.json({
            isSuccess: false,
            message: "아이디 혹은 이메일이 중복됩니다.",
        });
        return;
    }

    const salt = Math.round(new Date().valueOf() * Math.random()) + "";
    const hashPassword = createHash("sha512")
        .update(signUpInfo.userPassword + salt)
        .digest("hex");

    const userInsertQuery = `INSERT INTO USERS(user_id, user_email, user_password, user_salt) VALUES("${signUpInfo.userId}", "${signUpInfo.userEmail}", "${hashPassword}", "${salt}")`;
    connection.query(userInsertQuery, (error, rows) => {
        if (error) {
            console.log(error);
            res.json({
                isSuccess: false,
                message: "서버 오류",
            });
        } else {
            res.json({
                isSuccess: true,
                message: "회원가입이 완료되었습니다.",
            });
        }
    });
});

router.post("/login", async (req, res) => {
    const loginInfo: LoginInfo = req.body;

    const query = `SELECT * FROM users WHERE user_id = "${loginInfo.userId}"`;
    const [result, fields] = await promiseConnection.query<IUser[]>(query);
    if (result.length > 0) {
        const hashPassword = createHash("sha512")
            .update(loginInfo.userPassword + result[0].user_salt)
            .digest("hex");

        if (result[0].user_password === hashPassword) {
            const newJwk = jwk.sign(
                { userId: result[0].user_id, userEmail: result[0].user_email },
                process.env.JWT_SECRET_KEY as string,
                {
                    expiresIn: "1h",
                    algorithm: "HS256",
                }
            );
            res.json({
                isSuccess: true,
                userId: result[0].user_id,
                userEmail: result[0].user_email,
                token: newJwk,
                message: "로그인이 완료되었습니다.",
            });
        } else {
            res.json({
                isSuccess: false,
                message: "'아이디' 혹은 '비밀번호'가 일치하지 않습니다.",
            });
        }
    } else {
        res.json({
            isSuccess: false,
            message: "'아이디' 혹은 '비밀번호'가 일치하지 않습니다.",
        });
    }
});

router.get("/check", (req, res) => {
    const token = req.headers.authorization as string;
    jwk.verify(token, process.env.JWT_SECRET_KEY as string, (error, decode) => {
        if (error) {
            console.log(error);
            res.json({ isLogin: false });
        } else {
            const userJwtPayload = decode as UserJwtPayload;
            res.json({
                isLogin: true,
                userInfo: { userId: userJwtPayload.userId, userEmail: userJwtPayload.userEmail },
            });
        }
    });
});

router.get("/favorites", async (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const userJwtPayload = decode as UserJwtPayload;

            const userQuery = `SELECT * FROM users WHERE user_id = "${userJwtPayload.userId}"`;
            const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

            if (users.length > 0) {
                const favoriteQuery = `SELECT * FROM favorites WHERE user_no = "${users[0].user_no}"`;
                const [favorites, fields] = await promiseConnection.query<IFavorite[]>(favoriteQuery);

                res.json({
                    favorites: favorites.map((favorite) => {
                        return {
                            placeId: favorite.place_id,
                            placeName: favorite.favorite_name,
                            placeAddress: favorite.favorite_address,
                            placeHashtags: favorite.favorite_hashtags.split("|"),
                        };
                    }),
                });
            } else {
                res.sendStatus(401);
            }
        }
    });
});

router.post("/favorites/add", (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const userJwtPayload = decode as UserJwtPayload;

            const userQuery = `SELECT * FROM users WHERE user_id = "${userJwtPayload.userId}"`;
            const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

            if (users.length > 0) {
                const placeInfo: PlaceInfo = req.body;
                const placeQuery = `SELECT * FROM places WHERE place_id = ${placeInfo.placeId}`;
                const [places, placeFields] = await promiseConnection.query<IPlace[]>(placeQuery);

                if (places.length > 0) {
                    const distinctQuery = `SELECT * FROM favorites WHERE user_no = ${users[0].user_no} and place_id = ${placeInfo.placeId}`;
                    const [favorites, favoriteFields] = await promiseConnection.query<IFavorite[]>(distinctQuery);
                    if (favorites.length === 0) {
                        const favoriteAddQuery = `INSERT INTO favorites(user_no, place_id, favorite_name, favorite_address, favorite_hashtags) VALUES("${users[0].user_no}","${placeInfo.placeId}","${places[0].place_name}","${places[0].place_address}","${places[0].place_hashtags}");`;
                        connection.query(favoriteAddQuery, (error, rows) => {
                            if (error) {
                                console.log(error);
                                res.sendStatus(401);
                            } else {
                                res.sendStatus(200);
                            }
                        });
                    } else {
                        res.sendStatus(401);
                    }
                } else {
                    res.sendStatus(401);
                }
            } else {
                res.sendStatus(401);
            }
        }
    });
});

router.post("/favorites/delete", (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const userJwtPayload = decode as UserJwtPayload;

            const userQuery = `SELECT * FROM users WHERE user_id = "${userJwtPayload.userId}"`;
            const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

            if (users.length > 0) {
                const placeInfo: PlaceInfo = req.body;
                const favoriteDeleteQuery = `DELETE FROM favorites WHERE user_no = ${users[0].user_no} and place_id = ${placeInfo.placeId}`;
                connection.query(favoriteDeleteQuery, (error, rows) => {
                    if (error) {
                        console.log(error);
                        res.sendStatus(401);
                    } else {
                        res.sendStatus(200);
                    }
                });
            } else {
                res.sendStatus(401);
            }
        }
    });
});

router.get("/histories", async (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const userJwtPayload = decode as UserJwtPayload;

            const userQuery = `SELECT * FROM users WHERE user_id = "${userJwtPayload.userId}"`;
            const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

            if (users.length > 0) {
                const historyQuery = `SELECT * FROM histories WHERE user_no = "${users[0].user_no}"`;
                const [histories, fields] = await promiseConnection.query<IHistory[]>(historyQuery);

                res.json({
                    histories: histories.map((history) => {
                        return {
                            placeId: history.place_id,
                            placeName: history.history_name,
                            placeHashtags: history.history_hashtags.split(","),
                        };
                    }),
                });
            } else {
                res.sendStatus(401);
            }
        }
    });
});

export default router;
