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
                    if len(place['placeReviews']) > 0:
                        output_data.append(place)
            output_file.write(json.dumps(output_data, ensure_ascii=False, indent=4))

# json->쿼리문 변환
def json_to_query(input, output):
    with open(input, "r", encoding="utf-8") as json_file:
        with open(output, "w", encoding="utf-8") as output_file:
            json_data = json.load(json_file)
            query = "INSERT INTO places (place_id, place_name, place_address, place_x, place_y, place_keyword, place_reviews, place_tokens) VALUES {};".format(','.join(list(map(lambda place: "\n({}, '{}', '{}', {}, {}, '{}', '{}', '{}')".format(place["no"], place["placeName"], place["placeAddress"], place["placeX"], place["placeY"], place["placeKeyword"], '|'.join(list(map(lambda placeReview: placeReview["review"], place["placeReviews"]))), '|'.join(list(map(lambda placeReview: "[" + ','.join(map(str, placeReview["token"])) + "]", place["placeReviews"])))), json_data))))
            output_file.write(query)
            
def add_place_hashtags(input, output):
    with open(input, "r", encoding="utf-8") as json_file:
        with open(output, "w", encoding="utf-8") as output_file:
            json_data = json.load(json_file)
            for data in json_data:
                if len(data["word_count"].keys()) > 0:
                    hashtags = '|'.join(list(data["word_count"].keys())[:5])
                    hashtags = hashtags if  '|' in hashtags else hashtags + "|" + hashtags # 최소 3개가 되도록
                    hashtags += ' ' + '|'.join(map(str, list(data["word_count"].values())[:5])) # 공백을 구분자로 개수 추가
                    query = "UPDATE places SET place_hashtags = '카페|{}' WHERE place_id = {};\n".format(hashtags, data["no"])
                    output_file.write(query)
            
    
            
if __name__ == '__main__':
    add_place_hashtags("./mai_word_count.json", "./hashtags.txt")
    #json_to_query("./places.json", "./query.txt")
    #valid_json_for_crawling_data("./test.json", "./places.json")