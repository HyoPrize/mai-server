import json

# places 데이터 json column->string 수정 및 리뷰 없는 데이터 삭제
def valid_json_for_crawling_data(input, output):
    with open(input, 'r', encoding="utf-8") as json_file:
        with open(output, "w", encoding="utf-8") as output_file:
            output_data = []
            json_data = json.load(json_file)
            for place in json_data:
                if len(place['placeReviews']) > 0:
                    new_palce_reviews = []
                    for review in place['placeReviews']:
                        if len(review['token']) > 0:
                            review['review'] = review['review'].replace("'", "")
                            review['review'] = review['review'].replace("|", "")
                            new_palce_reviews.append(review)
                    place['placeReviews'] = new_palce_reviews
                    place['placeName'] = place['placeName'].replace("'", "")
                    if len(place['placeReviews']) > 0:
                        output_data.append(place)
            output_file.write(json.dumps(output_data, ensure_ascii=False, indent=4))

# json->쿼리문 변환
def json_to_query(input, output):
    with open(input, "r", encoding="utf-8") as json_file:
        with open(output, "w", encoding="utf-8") as output_file:
            json_data = json.load(json_file)
            
            query = "INSERT INTO places (place_id, place_name, place_address, place_x, place_y, place_keyword, place_reviews, place_tokens) VALUES {};".format(
                ','.join(list(map(lambda place: "\n({}, '{}', '{}', {}, {}, '{}', '{}', '{}')".format(
                    place["no"], 
                    place["placeName"], 
                    place["placeAddress"], 
                    place["placeX"], 
                    place["placeY"], 
                    place["placeKeyword"], 
                    '|'.join(list(map(lambda placeReview: placeReview["review"], place["placeReviews"]))), 
                    '|'.join(list(map(lambda placeReview: "[" + ','.join(map(str, placeReview["token"])) + "]", place["placeReviews"])))
                ), json_data))))
            output_file.write(query)
            
def add_place_hashtags(input, output):
    with open(input, "r", encoding="utf-8") as json_file:
        with open(output, "w", encoding="utf-8") as output_file:
            json_data = json.load(json_file)
            for place in json_data:
                if len(place["placeWordCount"].keys()) > 0:
                    hashtags = '|'.join(list(place["placeWordCount"].keys())[:5])
                    hashtags = hashtags if  '|' in hashtags else hashtags + "|" + hashtags # 최소 3개가 되도록
                    hashtags += ' ' + '|'.join(map(str, list(place["placeWordCount"].values())[:5])) # 공백을 구분자로 개수 추가
                    query = "UPDATE places SET place_hashtags = '{}|{}' WHERE place_id = {} and place_keyword = '{}';\n".format(place["placeKeyword"], hashtags, place["no"], place["placeKeyword"])
                    output_file.write(query)
            
if __name__ == '__main__':
    valid_json_for_crawling_data("./output_맛집.json", "./맛집_1.json")
    valid_json_for_crawling_data("./output_치킨.json", "./치킨_1.json")
    valid_json_for_crawling_data("./output_카페.json", "./카페_1.json")
    json_to_query("./맛집_1.json", "./맛집_2.txt")
    json_to_query("./치킨_1.json", "./치킨_2.txt")
    json_to_query("./카페_1.json", "./카페_2.txt")
    add_place_hashtags("./맛집_1.json", "./맛집_3.txt")
    add_place_hashtags("./치킨_1.json", "./치킨_3.txt")
    add_place_hashtags("./카페_1.json", "./카페_3.txt")