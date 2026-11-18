#!/usr/bin/env python3
"""
Normalize enriched Google Maps place records into:
1. data/places_sheet.csv (ready for Google Sheets import)
2. data/places_normalized.json (clean JSON seed for PWA / tests)
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

ROOT_DIR = Path(__file__).resolve().parent.parent
ENRICHED_PATH = ROOT_DIR / "data" / "places_enriched.json"
CSV_PATH = ROOT_DIR / "data" / "places_sheet.csv"
NORMALIZED_JSON_PATH = ROOT_DIR / "data" / "places_normalized.json"

DAY_MAP = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat",
    "Sunday": "sun",
}
DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# Curated clean names, unified 5 categories, and concise searchable notes
CURATED_META: dict[int, tuple[str, str, str]] = {
    1: ("木舍沙拉專業店", "健康餐", "平價沙拉、日本balmuda厚片、熱壓吐司、莊園級咖啡"),
    2: ("Mr.body健身舒肥水煮餐盒 中友店", "健康餐", "舒肥水煮餐盒"),
    3: ("糧倉 纖健水煮 台中柳川總店", "健康餐", "水煮健康餐盒"),
    4: ("G本煮藝手作餐盒專賣店", "健康餐", "手作健康餐盒"),
    5: ("里奇 健康餐盒 五義店", "健康餐", "健康餐盒、舒肥雞胸"),
    6: ("順帶好食", "早午餐", "健康早餐、三明治專賣"),
    7: ("約翰煮的 學士店", "健康餐", "紫米飯、舒肥健康餐盒"),
    8: ("漸健健康餐", "健康餐", "健康餐盒、打拋豬、泰式咖哩雞"),
    9: ("镹悅古早味蛋餅", "早午餐", "粉漿古早味蛋餅（售完為止）"),
    10: ("Q飯糰", "早午餐", "傳統飯糰、紫米飯糰"),
    11: ("早到晚到 台中梅亭店", "早午餐", "晚餐宵夜早午餐、吐司蛋餅炒泡麵"),
    12: ("天津小狗子湯包豆漿店", "早午餐", "手工湯包、豆漿、中式早點"),
    13: ("崇德來來羊肉爐", "鍋物熱炒", "蔬果湯頭羊肉爐、熱炒"),
    14: ("育中新村 一中總本舖", "麵食小吃", "牛肉麵、蓋飯、鍋燒麵"),
    15: ("黑皮麻辣乾麵", "麵食小吃", "麻辣乾麵、麻醬麵、麻辣臭豆腐"),
    16: ("龍廚素食", "麵食小吃", "純素無蛋無奶無五辛・台式拉麵、拌飯"),
    17: ("菁姐爆蛋蔥油餅&海苔飯捲", "麵食小吃", "爆蛋蔥油餅、海苔飯捲（每週日休）"),
    18: ("詹擔擔麵", "麵食小吃", "擔擔麵、麻醬麵、滷味小菜（五六日店休）"),
    19: ("陽光現炒館", "鍋物熱炒", "平價現炒、炒飯、熱炒合菜"),
    20: ("飯合燒（燒肉飯專賣）", "便當飯類", "現烤炭香燒肉飯"),
    21: ("吃得巧海苔飯卷 美德店", "便當飯類", "海苔飯卷、外帶輕食"),
    22: ("龍品魚丸永興店", "便當飯類", "排骨飯、雞腿飯、魚丸湯"),
    23: ("一珍軒古早味蛋餅 大德店", "早午餐", "手工粉漿古早味蛋餅"),
    24: ("永盛雞肉飯", "便當飯類", "雞肉飯、滷肉飯、乾麵湯品"),
    25: ("米撰雞腿壩王便當 中國醫店", "便當飯類", "滷雞腿、炸雞腿、蒸鱸魚便當"),
    26: ("柯宅食事", "便當飯類", "平價咖哩、蒸烤餐盒、濃湯貝果（可Line預約）"),
    27: ("肉谷蠻飯売部", "便當飯類", "粒粒分明炒飯、家常台式料理"),
    28: ("郎港式鮮肉包 永興店", "早午餐", "港式鮮肉包、平價銅板點心"),
    29: ("新豐源排骨麵店", "麵食小吃", "排骨麵、排骨飯、古早味麵食"),
    30: ("味鄉排骨", "便當飯類", "炸排骨、炸雞腿、四樣配菜便當"),
    31: ("蕃茄村 台中北區德化店", "早午餐", "早餐、早午餐、漢堡蛋餅"),
    32: ("庄腳早午餐", "早午餐", "酥脆蛋餅、吐司三明治、早午餐"),
    33: ("石蜜園", "便當飯類", "簡餐便當、烏梅汁"),
    34: ("楊記手工包子饅頭", "早午餐", "手工包子饅頭、黑糖麻糬、蔓越莓乳酪"),
    35: ("川島家便當專賣 學士店", "便當飯類", "烤雞腿、烤豬排、清爽便當"),
    36: ("福米記 池上飯包", "便當飯類", "池上飯包、招牌便當"),
    37: ("麥丼", "便當飯類", "丼飯、炒烏龍麵、蒸蛋（不固定店休建議先電洽）"),
    38: ("飯將排骨炒飯", "便當飯類", "排骨蛋炒飯、鮭魚炒飯"),
    39: ("蓋蓋屋", "便當飯類", "蓋飯、無骨雞腿飯、平價學生便當"),
    40: ("丼手丼腳", "便當飯類", "平價丼飯餐盒、唐揚雞丼飯"),
    41: ("中年大叔美味料理", "便當飯類", "原名：中年大叔 家常料理；家常便當、脆皮雞排飯、番茄湯麵"),
    42: ("熊霸便當製所", "便當飯類", "五樣配菜便當、炸雞腿、炸排骨"),
    43: ("鴻興燒臘", "便當飯類", "港式燒臘、烤鴨腿、油雞叉燒"),
    44: ("日日伴飯 咖哩專賣", "便當飯類", "日式/歐式/印度咖哩、炸豬排（公休以IG為主）"),
    45: ("享初海南雞飯", "便當飯類", "海南雞飯、燒肉、打拋豬（附雞湯）"),
    46: ("小野人餐盒製造所", "健康餐", "舒肥雞胸、鮭魚健康餐盒"),
    47: ("丼寶丼飯專賣店 樂花涼麵 永興店", "便當飯類", "炙燒起司丼飯、涼麵"),
    48: ("日式大阪燒一ichi", "麵食小吃", "水湳市場・日式大阪燒、關西炒麵"),
    49: ("健康那件小事 中醫店", "健康餐", "舒肥低卡健康餐盒、蒜香雞、檸檬雞柳"),
}


def clean_spaces(text: str) -> str:
    return re.sub(r"[\u202f\u2009\u00a0\s]+", " ", text).strip()


def to_24h(time_str: str, period: str, is_end: bool = False) -> str:
    h_str, m_str = time_str.split(":")
    h = int(h_str)
    m = int(m_str)
    p = period.upper()
    if p == "AM":
        if h == 12:
            if is_end and m == 0:
                return "24:00"
            h = 0
    elif p == "PM":
        if h != 12:
            h += 12
    return f"{h:02d}:{m:02d}"


def normalize_segment(segment: str) -> str:
    seg = clean_spaces(segment)
    # Split on en-dash or hyphen
    parts = re.split(r"\s*[–—-]\s*", seg)
    if len(parts) != 2:
        raise ValueError(f"Unexpected segment format: {segment!r}")

    start_raw, end_raw = parts[0].strip(), parts[1].strip()
    m_end = re.match(r"^(\d{1,2}:\d{2})\s*(AM|PM)$", end_raw, re.IGNORECASE)
    if not m_end:
        raise ValueError(f"Unexpected end time: {end_raw!r}")
    end_time, end_period = m_end.group(1), m_end.group(2).upper()

    m_start = re.match(r"^(\d{1,2}:\d{2})(?:\s*(AM|PM))?$", start_raw, re.IGNORECASE)
    if not m_start:
        raise ValueError(f"Unexpected start time: {start_raw!r}")
    start_time = m_start.group(1)
    start_period = m_start.group(2).upper() if m_start.group(2) else end_period

    # Handle case like "11:00 - 1:30 PM" where start omits period and start_hour > end_hour (crossing noon)
    if not m_start.group(2) and end_period == "PM":
        sh = int(start_time.split(":")[0])
        eh = int(end_time.split(":")[0])
        if eh != 12 and sh > eh and sh >= 7 and sh <= 11:
            start_period = "AM"

    s_24 = to_24h(start_time, start_period, is_end=False)
    e_24 = to_24h(end_time, end_period, is_end=True)
    return f"{s_24}-{e_24}"


def normalize_hours(weekday_text: list[str] | None) -> dict[str, str]:
    hours = {d: "" for d in DAY_ORDER}
    if not weekday_text:
        return hours

    for line in weekday_text:
        cleaned = clean_spaces(line)
        if ":" not in cleaned:
            continue
        day_name, rest = cleaned.split(":", 1)
        day_key = DAY_MAP.get(day_name.strip())
        if not day_key:
            continue
        val = rest.strip()
        if not val:
            hours[day_key] = ""
        elif val.lower() == "closed":
            hours[day_key] = "休"
        elif val.lower() == "open 24 hours":
            hours[day_key] = "00:00-24:00"
        else:
            segs = [normalize_segment(s) for s in val.split(",") if s.strip()]
            hours[day_key] = ",".join(segs)
    return hours


def clean_maps_url(uri: str | None, name: str, place_id: str) -> str:
    if uri:
        parsed = urlparse(uri)
        qs = parse_qs(parsed.query)
        if "cid" in qs and qs["cid"]:
            return f"https://maps.google.com/?cid={qs['cid'][0]}"
        return uri
    return f"https://www.google.com/maps/search/?api=1&query={quote(name)}&query_place_id={quote(place_id)}"


def main() -> None:
    data = json.loads(ENRICHED_PATH.read_text(encoding="utf-8"))
    rows_csv: list[list[str]] = []
    normalized_places: list[dict] = []

    with_coords = 0
    with_hours = 0

    for item in data["places"]:
        idx = int(item["index"])
        if idx not in CURATED_META:
            raise KeyError(f"Missing curated metadata for index {idx}")

        name, category, note = CURATED_META[idx]
        pid = f"p{idx:02d}"
        lat = item["location"]["lat"]
        lng = item["location"]["lng"]
        if lat is not None and lng is not None:
            with_coords += 1

        hours = normalize_hours(item.get("weekday_text"))
        if any(v for v in hours.values()):
            with_hours += 1

        maps_url = clean_maps_url(item.get("google_maps_uri"), name, item["place_id"])
        rating = item.get("rating")
        reviews = item.get("total_ratings")

        rows_csv.append([
            pid,
            name,
            category,
            "" if rating is None else str(rating),
            "" if reviews is None else str(reviews),
            f"{lat:.7f}" if lat is not None else "",
            f"{lng:.7f}" if lng is not None else "",
            hours["mon"],
            hours["tue"],
            hours["wed"],
            hours["thu"],
            hours["fri"],
            hours["sat"],
            hours["sun"],
            maps_url,
            note,
            "TRUE",
        ])

        normalized_places.append({
            "id": pid,
            "name": name,
            "category": category,
            "rating": rating,
            "reviews": reviews,
            "lat": round(lat, 7) if lat is not None else None,
            "lng": round(lng, 7) if lng is not None else None,
            "hours": hours,
            "maps_url": maps_url,
            "note": note,
            "enabled": True,
        })

    headers = [
        "id", "name", "category", "rating", "reviews", "lat", "lng",
        "mon", "tue", "wed", "thu", "fri", "sat", "sun",
        "maps_url", "note", "enabled",
    ]

    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows_csv)

    NORMALIZED_JSON_PATH.write_text(
        json.dumps({"total": len(normalized_places), "places": normalized_places}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Normalized {len(normalized_places)} places.")
    print(f"Coords coverage: {with_coords}/{len(normalized_places)}")
    print(f"Hours coverage:  {with_hours}/{len(normalized_places)}")
    print(f"Wrote CSV:  {CSV_PATH}")
    print(f"Wrote JSON: {NORMALIZED_JSON_PATH}")


if __name__ == "__main__":
    main()
