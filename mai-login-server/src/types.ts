import { RowDataPacket } from "mysql2";

export interface IUsers extends RowDataPacket {
    user_no: number;
    user_id: string;
    user_email: string;
    user_password: string;
    user_signup_date: string;
    user_salt: string;
}

export type SignUpInfo = {
    userId: string;
    userEmail: string;
    userPassword: string;
};

export type LoginInfo = {
    userId: string;
    userPassword: string;
};

declare module "express-session" {
    interface SessionData {
        userId: string;
        userEmail: string;
        is_logined: boolean;
    }
}
