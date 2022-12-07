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
    favorite_name: string;
    favorite_address: string;
    favorite_hashtags: string;
}

export interface IHistory extends RowDataPacket {
    history_no: number;
    user_no: number;
    place_id: number;
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
    favorite_count: number;
}

export type ValidMailInfo = {
    email: string;
};

export type SignUpInfo = {
    userId: string;
    userEmail: string;
    userPassword: string;
};

export type LoginInfo = {
    userId: string;
    userPassword: string;
};

export type SearchInfo = {
    keyword?: string;
    lat?: number;
    lon?: number;
    distance?: number;
};

export type PlaceInfo = {
    placeId?: number;
};

export type PlaceIdInfo = {
    placeIdList: number[];
};

export type ShareLengthInfo = {
    length?: number;
};

declare module "jsonwebtoken" {
    export interface UserJwtPayload extends JwtPayload {
        userId: string;
        userEmail: string;
    }
}
