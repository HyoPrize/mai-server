import express from "express";
import promiseConnection from "../db/db2.js";
import { IPlace, SearchInfo, PlaceInfo, PlaceIdInfo } from "../types.js";
import geolib from "geolib";
import path from "path";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("place provider");
});

router.get("/search", async (req, res) => {
    const searchInfo: SearchInfo = req.query;

    const placeQuery = `SELECT * FROM places WHERE place_keyword = '${searchInfo.keyword}'`;
    const [places, fields] = await promiseConnection.query<IPlace[]>(placeQuery);

    const centerPoint = { latitude: Number(searchInfo.lat as number), longitude: Number(searchInfo.lon as number) };
    res.json({
        placeIdList: places
            .filter((place) =>
                geolib.isPointWithinRadius(
                    { latitude: place.place_y, longitude: place.place_x },
                    centerPoint,
                    searchInfo.distance as number
                )
            )
            .map((place) => place.place_id),
    });
});

router.post("/query", async (req, res) => {
    const placeIdInfo: PlaceIdInfo = req.body;

    if (placeIdInfo.placeIdList.length > 0) {
        const placeQuery = `SELECT * FROM places WHERE place_id in (${placeIdInfo.placeIdList.toString()})`;
        const [places, fields] = await promiseConnection.query<IPlace[]>(placeQuery);

        if (places.length > 0) {
            res.json({
                isFound: true,
                placeInfoList: places.map((place) => {
                    return {
                        placeId: place.place_id,
                        placeName: place.place_name,
                        placeAddress: place.place_address,
                        placeX: place.place_x,
                        placeY: place.place_y,
                        placeKeyword: place.place_keyword,
                        placeReviews: place.place_reviews.split("|"),
                        placeTokens: place.place_tokens.split("|").map((token) => JSON.parse(token)),
                        placeHashtags: place.place_hashtags.split(" ")[0].split("|"),
                        placeHashtagCounts: place.place_hashtags.split(" ")[1].split("|"),
                    };
                }),
            });
        } else {
            res.json({
                isFound: false,
                placeInfoList: null,
            });
        }
    } else {
        res.json({
            isFound: false,
            placeInfoList: null,
        });
    }
});

router.get("/tag-cloud", async (req, res) => {
    const placeInfo: PlaceInfo = req.query;
    const placeId = placeInfo.placeId as number;
    if (placeId > -1) {
        res.setHeader("Content-Type", "image/png");
        res.sendFile(path.join(process.env.DIR_PATH as string, `/tagClouds/${placeId}.png`));
    }
});

router.get("/image", async (req, res) => {
    const placeInfo: PlaceInfo = req.query;
    const placeId = placeInfo.placeId as number;
    if (placeId > -1) {
        res.setHeader("Content-Type", "image/png");
        res.sendFile(path.join(process.env.DIR_PATH as string, `/images/${placeId}.png`));
    }
});

export default router;
