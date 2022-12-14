import express from "express";
import promiseConnection from "../db/db2.js";
import { IPlace, SearchQuery, PlaceQuery, PlaceIdBody, PlaceIndexBody } from "../types.js";
import geolib from "geolib";
import path from "path";
import fs from "fs";
import { DATA_PATH } from "../env.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("place provider");
});

router.get("/search", async (req, res) => {
    const searchQuery: SearchQuery = req.query;

    const placeQuery = `SELECT * FROM places WHERE place_keyword = '${searchQuery.keyword}'`;
    const [places, fields] = await promiseConnection.query<IPlace[]>(placeQuery);

    const centerPoint = { latitude: Number(searchQuery.lat as number), longitude: Number(searchQuery.lon as number) };
    res.json({
        placeIdList: places
            .filter((place) =>
                geolib.isPointWithinRadius(
                    { latitude: place.place_y, longitude: place.place_x },
                    centerPoint,
                    searchQuery.distance as number
                )
            )
            .map((place) => place.place_id),
    });
});

router.post("/query", async (req, res) => {
    const placeIdBody: PlaceIdBody = req.body;

    if (placeIdBody.placeIdList.length > 0) {
        const placeQuery = `SELECT * FROM places WHERE place_id in (${placeIdBody.placeIdList.toString()}) and place_keyword = '${
            placeIdBody.placeKeyword
        }'`;
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
    const placeQuery: PlaceQuery = req.query;
    const placeId = placeQuery.placeId as number;
    if (placeId > -1) {
        res.setHeader("Content-Type", "image/png");
        const imgPath = path.join(DATA_PATH, `images/tagClouds/${placeId}.png`);
        if (fs.existsSync(imgPath)) {
            res.sendFile(imgPath);
        } else {
            res.sendFile(path.join(DATA_PATH, `images/places/mai_logo.png`));
        }
    }
});

router.get("/image", async (req, res) => {
    const placeQuery: PlaceQuery = req.query;
    const placeId = placeQuery.placeId as number;
    if (placeId > -1) {
        res.setHeader("Content-Type", "image/png");
        const imgPath = path.join(DATA_PATH, `images/places/${placeId}.png`);
        if (fs.existsSync(imgPath)) {
            res.sendFile(imgPath);
        } else {
            res.sendFile(path.join(DATA_PATH, `images/places/mai_logo.png`));
        }
    }
});

export default router;
