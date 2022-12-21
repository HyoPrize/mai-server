import express from "express";
import { IPlace, IShare, ShareLengthQuery } from "src/types.js";
import promiseConnection from "../db/db2.js";
import jwk, { UserJwtPayload } from "jsonwebtoken";

const router = express.Router();

router.get("/", async (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const shareLengthQuery: ShareLengthQuery = req.query;

            if (shareLengthQuery.length && shareLengthQuery.length > 0) {
                const shareQuery = `SELECT * FROM (SELECT place_id, place_keyword, count(place_id) as favorite_count FROM favorites GROUP BY place_id) as tb ORDER BY tb.favorite_count DESC LIMIT ${shareLengthQuery.length}`;
                const [shares, shareFields] = await promiseConnection.query<IShare[]>(shareQuery);

                if (shares.length > 0) {
                    const sharedPlaceIds = shares.map((share) => share.place_id);
                    const sharedPlaceKeywords = shares.map((share) => share.place_keyword);
                    const placeQuery = `SELECT * FROM places WHERE place_id in (${sharedPlaceIds.toString()}) and place_keyword in (${
                        "'" + sharedPlaceKeywords.join("','") + "'"
                    })`;
                    const [places, placeFields] = await promiseConnection.query<IPlace[]>(placeQuery);
                    if (places.length === shares.length) {
                        res.json(
                            shares.map((share) => {
                                const sharedPlace = places.filter((place) => place.place_id === share.place_id)[0];
                                return {
                                    placeId: sharedPlace.place_id,
                                    placeKeyword: sharedPlace.place_keyword,
                                    placeName: sharedPlace.place_name,
                                    placeAddress: sharedPlace.place_address,
                                    placeHashtags: sharedPlace.place_hashtags.split(" ")[0].split("|"),
                                    placefavoriteCount: share.favorite_count,
                                };
                            })
                        );
                    } else {
                        res.sendStatus(401);
                    }
                } else {
                    res.json([]);
                }
            } else {
                res.sendStatus(401);
            }
        }
    });
});

export default router;
