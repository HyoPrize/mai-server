import express from "express";
import { IPlace, IShare, ShareLengthInfo } from "src/types.js";
import promiseConnection from "../db/db2.js";
import jwk, { UserJwtPayload } from "jsonwebtoken";

const router = express.Router();

router.get("/", async (req, res) => {
    const token = req.headers.authorization as string;

    jwk.verify(token, process.env.JWT_SECRET_KEY as string, async (error, decode) => {
        if (error) {
            res.sendStatus(401);
        } else {
            const { length }: ShareLengthInfo = req.query;

            if (length && length > 0) {
                const shareQuery = `SELECT * FROM (SELECT place_id, count(place_id) as favorite_count FROM favorites GROUP BY place_id) as tb ORDER BY tb.favorite_count DESC LIMIT ${length}`;
                const [shares, shareFields] = await promiseConnection.query<IShare[]>(shareQuery);

                if (shares.length > 0) {
                    const sharePlaceId = shares.map((share) => share.place_id);
                    const placeQuery = `SELECT * FROM places WHERE place_id in (${sharePlaceId.toString()})`;
                    const [places, placeFields] = await promiseConnection.query<IPlace[]>(placeQuery);
                    if (places.length > 0) {
                        res.json(
                            places.map((place) => ({
                                placeId: place.place_id,
                                placeName: place.place_name,
                                placeAddress: place.place_address,
                                placeHashtags: place.place_hashtags.split(" ")[0].split("|"),
                                placefavoriteCount: shares.filter((share) => share.place_id === place.place_id)[0]
                                    .favorite_count,
                            }))
                        );
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

export default router;
