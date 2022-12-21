import express, { response } from "express";
import { createHash } from "crypto";

import connection from "../db/db.js";
import promiseConnection from "../db/db2.js";
import {
    IUser,
    IFavorite,
    IHistory,
    SignUpBody,
    LoginBody,
    PlaceQuery,
    IPlace,
    MailBody,
    ImageQuery,
    ChangePasswordBody,
    PlaceIndexBody,
} from "../types.js";
import jwk, { UserJwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";
import path from "path";
import ejs from "ejs";
import multer, { diskStorage } from "multer";
import fs from "fs";
import jimp from "jimp";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("user server");
});

router.post("/valid-mail", async (req, res) => {
    const mailBody = req.body as MailBody;
    let authNum = Math.random().toString().slice(2, 8);
    let emailTemplete;

    ejs.renderFile(path.resolve("public/resources/valid_mail.ejs"), { authCode: authNum }, function (err, data) {
        if (err) {
            console.log(err);
            res.sendStatus(400);
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
        to: mailBody.email,
        subject: "[IAM] MAI 서비스 회원가입을 위한 인증코드를 입력해주세요.",
        html: emailTemplete,
    });

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            res.sendStatus(400);
        }
        console.log("Finish sending email : " + info.response);
        res.send(authNum);
        transporter.close();
    });
});

router.post("/id-mail", async (req, res) => {
    const mailBody = req.body as MailBody;
    let emailTemplete;

    const userQuery = `SELECT * FROM USERS WHERE user_email="${mailBody.email}"`;
    const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);
    if (users.length > 0) {
        ejs.renderFile(path.resolve("public/resources/id_mail.ejs"), { id: users[0].user_id }, function (err, data) {
            if (err) {
                console.log(err);
                res.sendStatus(400);
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
            to: mailBody.email,
            subject: "[IAM] 회원님의 아이디를 확인해주세요.",
            html: emailTemplete,
        });

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.sendStatus(400);
            }
            console.log("Finish sending email : " + info.response);
            res.sendStatus(200);
            transporter.close();
        });
    } else {
        res.sendStatus(400);
    }
});

router.post("/password-mail", async (req, res) => {
    const mailBody = req.body as MailBody;
    let authNum = Math.random().toString().slice(2, 8);
    let emailTemplete;

    const userQuery = `SELECT * FROM USERS WHERE user_id="${mailBody.id}" and user_email="${mailBody.email}"`;
    const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);
    if (users.length > 0) {
        ejs.renderFile(path.resolve("public/resources/password_mail.ejs"), { authCode: authNum }, function (err, data) {
            if (err) {
                console.log(err);
                res.sendStatus(400);
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
            to: mailBody.email,
            subject: "[IAM] MAI 비밀번호 재설정을 위한 인증코드를 입력해주세요.",
            html: emailTemplete,
        });

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.sendStatus(400);
            }
            console.log("Finish sending email : " + info.response);
            res.send(authNum);
            transporter.close();
        });
    } else {
        res.sendStatus(400);
    }
});

router.post("/change-password", async (req, res) => {
    const changePasswordBody = req.body as ChangePasswordBody;

    const salt = Math.round(new Date().valueOf() * Math.random()) + "";
    const hashPassword = createHash("sha512")
        .update(changePasswordBody.password + salt)
        .digest("hex");
    const userUpdateQuery = `UPDATE users SET user_password = '${hashPassword}', user_salt = '${salt}' WHERE user_email="${changePasswordBody.email}"`;
    connection.query(userUpdateQuery, (error, rows) => {
        if (error) {
            console.log(error);
            res.sendStatus(400);
        } else {
            res.sendStatus(200);
        }
    });
});

router.post("/register", async (req, res) => {
    const signUpBody: SignUpBody = req.body;

    const userQuery = `SELECT * FROM USERS WHERE user_id="${signUpBody.userId}" or user_email="${signUpBody.userEmail}"`;
    const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

    if (users.length > 0) {
        res.json({
            isSuccess: false,
            message: "아이디 혹은 이메일이 중복됩니다.",
        });
        return;
    }

    const salt = Math.round(new Date().valueOf() * Math.random()) + "";
    const hashPassword = createHash("sha512")
        .update(signUpBody.userPassword + salt)
        .digest("hex");

    const userInsertQuery = `INSERT INTO USERS(user_id, user_email, user_password, user_salt) VALUES("${signUpBody.userId}", "${signUpBody.userEmail}", "${hashPassword}", "${salt}")`;
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
    const LoginBody: LoginBody = req.body;

    const query = `SELECT * FROM users WHERE user_id = "${LoginBody.userId}"`;
    const [users, fields] = await promiseConnection.query<IUser[]>(query);
    if (users.length > 0) {
        const hashPassword = createHash("sha512")
            .update(LoginBody.userPassword + users[0].user_salt)
            .digest("hex");

        if (users[0].user_password === hashPassword) {
            const newJwk = jwk.sign(
                { userNo: users[0].user_no, userId: users[0].user_id, userEmail: users[0].user_email },
                process.env.JWT_SECRET_KEY as string,
                {
                    expiresIn: "1h",
                    algorithm: "HS256",
                }
            );
            res.json({
                isSuccess: true,
                userNo: users[0].user_no.toString(),
                userId: users[0].user_id,
                userEmail: users[0].user_email,
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
                userNo: userJwtPayload.userNo.toString(),
                userId: userJwtPayload.userId,
                userEmail: userJwtPayload.userEmail,
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
                            placeKeyword: favorite.place_keyword,
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
                const placeIndexBody: PlaceIndexBody = req.body;
                const placeQuery = `SELECT * FROM places WHERE place_id = ${placeIndexBody.placeId} and place_keyword = '${placeIndexBody.placeKeyword}'`;
                const [places, placeFields] = await promiseConnection.query<IPlace[]>(placeQuery);

                if (places.length > 0) {
                    const distinctQuery = `SELECT * FROM favorites WHERE user_no = ${users[0].user_no} and place_id = ${placeIndexBody.placeId} and place_keyword = '${placeIndexBody.placeKeyword}'`;
                    const [favorites, favoriteFields] = await promiseConnection.query<IFavorite[]>(distinctQuery);
                    if (favorites.length === 0) {
                        const favoriteAddQuery = `INSERT INTO favorites(user_no, place_id, place_keyword, favorite_name, favorite_address, favorite_hashtags) VALUES("${users[0].user_no}","${placeIndexBody.placeId}","${placeIndexBody.placeKeyword}","${places[0].place_name}","${places[0].place_address}","${places[0].place_hashtags}");`;
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
                const placeIndexBody: PlaceIndexBody = req.body;
                const favoriteDeleteQuery = `DELETE FROM favorites WHERE user_no = ${users[0].user_no} and place_id = ${placeIndexBody.placeId} and place_keyword = '${placeIndexBody.placeKeyword}'`;
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
                            placeKeyword: history.place_keyword,
                            placeName: history.history_name,
                            placeHashtags: history.history_hashtags.split("|"),
                        };
                    }),
                });
            } else {
                res.sendStatus(401);
            }
        }
    });
});

router.post("/histories/add", (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const userJwtPayload = decode as UserJwtPayload;

            const userQuery = `SELECT * FROM users WHERE user_id = "${userJwtPayload.userId}"`;
            const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

            if (users.length > 0) {
                const placeIndexBody: PlaceIndexBody = req.body;
                const placeQuery = `SELECT * FROM places WHERE place_id = ${placeIndexBody.placeId} and place_keyword = '${placeIndexBody.placeKeyword}'`;
                const [places, placeFields] = await promiseConnection.query<IPlace[]>(placeQuery);

                if (places.length > 0) {
                    const distinctQuery = `SELECT * FROM histories WHERE user_no = ${users[0].user_no} and place_id = ${placeIndexBody.placeId} and place_keyword = '${placeIndexBody.placeKeyword}'`;
                    const [histories, historyFields] = await promiseConnection.query<IHistory[]>(distinctQuery);

                    // delete for update
                    if (histories.length > 0) {
                        const historyDeleteQuery = `DELETE FROM histories WHERE user_no = ${users[0].user_no} and place_id = ${placeIndexBody.placeId} and place_keyword = '${placeIndexBody.placeKeyword}'`;
                        await promiseConnection.query(historyDeleteQuery);
                    }

                    const historyAddQuery = `INSERT INTO histories(user_no, place_id, place_keyword, history_name, history_hashtags) VALUES("${users[0].user_no}","${placeIndexBody.placeId}","${placeIndexBody.placeKeyword}","${places[0].place_name}","${places[0].place_hashtags}");`;
                    connection.query(historyAddQuery, (error, rows) => {
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
        }
    });
});

router.post("/histories/delete", (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const userJwtPayload = decode as UserJwtPayload;

            const userQuery = `SELECT * FROM users WHERE user_id = "${userJwtPayload.userId}"`;
            const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

            if (users.length > 0) {
                const placeIndexBody: PlaceIndexBody = req.body;
                const historyDeleteQuery = `DELETE FROM histories WHERE user_no = ${users[0].user_no} and place_id = ${placeIndexBody.placeId} and place_keyword = '${placeIndexBody.placeKeyword}'`;
                connection.query(historyDeleteQuery, (error, rows) => {
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

const upload = multer({
    storage: diskStorage({
        destination(req, file, done) {
            done(null, "src/images/users");
        },
        filename(req, file, done) {
            done(null, file.originalname);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (req.file) {
            const imageDest = req.file.destination;
            const basename = path.basename(req.file.originalname, path.extname(req.file.originalname));
            const image = await jimp.read(req.file.path);
            image.resize(256, 256).write(path.join(imageDest, basename + ".jpg"));
            fs.unlinkSync(req.file.path);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(400);
    }
});

router.get("/image", async (req, res) => {
    const imageInfo: ImageQuery = req.query;

    const userQuery = `SELECT * FROM users WHERE user_no = "${imageInfo.userNo}"`;
    const [users, fields] = await promiseConnection.query<IUser[]>(userQuery);

    if (users.length > 0) {
        const imagePath = path.resolve(`src/images/users/${users[0].user_no}.jpg`);
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.sendFile(path.resolve("public/resources/mai_logo.png"));
        }
    } else {
        res.sendFile(path.resolve("public/resources/mai_logo.png"));
    }
});

export default router;
