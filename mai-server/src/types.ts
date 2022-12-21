import { JwtPayload } from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

export interface IUser extends RowDataPacket {
    user_no: number;
    user_id: string;
    user_email: string;
    user_password: string;
    user_signup_date: string;
    user_salt: string;
}

export interface IFavorite extends RowDataPacket {
    favorite_no: number;
    user_no: number;
    place_id: number;
    place_keyword: string;
    favorite_name: string;
    favorite_address: string;
    favorite_hashtags: string;
}

export interface IHistory extends RowDataPacket {
    history_no: number;
    user_no: number;
    place_id: number;
    place_keyword: string;
    history_name: string;
    history_hashtags: string;
}

export interface IPlace extends RowDataPacket {
    place_no: number;
    place_id: number;
    place_name: string;
    place_address: string;
    place_x: string;
    place_y: string;
    place_keyword: string;
    place_reviews: string;
    place_tokens: string;
    place_hashtags: string;
}

export interface IShare extends RowDataPacket {
    place_id: number;
    place_keyword: string;
    favorite_count: number;
}

export type MailBody = {
    email: string;
    id?: string;
};

export type ChangePasswordBody = {
    email: string;
    password: string;
};

export type SignUpBody = {
    userId: string;
    userEmail: string;
    userPassword: string;
};

export type LoginBody = {
    userId: string;
    userPassword: string;
};

export type SearchQuery = {
    keyword?: string;
    lat?: number;
    lon?: number;
    distance?: number;
};

export type PlaceBody = {
    placeId: number;
};

export type PlaceIndexBody = {
    placeId: number;
    placeKeyword: string;
};

export type PlaceQuery = {
    placeId?: number;
};

export type PlaceIdBody = {
    placeIdList: number[];
    placeKeyword: string;
};

export type ShareLengthQuery = {
    length?: number;
};

export type ImageQuery = {
    userNo?: string;
};

declare module "jsonwebtoken" {
    export interface UserJwtPayload extends JwtPayload {
        userNo: number;
        userId: string;
        userEmail: string;
    }
}
