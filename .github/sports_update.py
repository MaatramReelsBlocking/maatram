#!/usr/bin/env python3
"""Weekly refresh of sports-auto.json from RacesIndia (robots.txt allows it).

Reads the Tamil Nadu, Puducherry, Bengaluru and Kochi race lists, opens each
race page and keeps it only if its schema.org SportsEvent data states an exact
date and the page links an https organiser site or official registration page.
Nothing is guessed: missing fields stay empty strings.

Exits 1 (and writes nothing) if no race could be parsed at all, so a layout
change on the source shows up as a failed run instead of an emptied list.
Stdlib only. Run: python3 .github/sports_update.py [path/to/sports-auto.json]
"""
import datetime as dt
import html
import json
import re
import sys
import time
import urllib.request

BASE = "https://www.racesindia.com"
LISTS = ["/races/india/tamil-nadu", "/races/india/puducherry",
         "/races/india/karnataka/bengaluru", "/races/india/kerala/kochi"]
MAX_PAGES = 6          # per list
HORIZON_DAYS = 183     # about 6 months ahead
MAX_EVENTS = 150
UA = "MaatramSportsBot/1.0 (+https://maatram.co.in/sports.html)"

# Must match CITIES in sports.html. Only exact names or same-place aliases.
CITIES = ["Coimbatore", "Chennai", "Madurai", "Tiruchirappalli", "Salem", "Erode",
          "Tirupur", "Vellore", "Thoothukudi", "Tirunelveli", "Thanjavur", "Dindigul",
          "Kanchipuram", "Cuddalore", "Nagercoil", "Hosur", "Karur", "Ooty", "Namakkal",
          "Pollachi", "Sivakasi", "Puducherry", "Bengaluru", "Kochi"]
ALIAS = {"tiruppur": "Tirupur", "trichy": "Tiruchirappalli", "tuticorin": "Thoothukudi",
         "pondicherry": "Puducherry", "pondy": "Puducherry", "bangalore": "Bengaluru",
         "cochin": "Kochi", "ernakulam": "Kochi", "udhagamandalam": "Ooty",
         "kancheepuram": "Kanchipuram", "madras": "Chennai"}
CITY = {c.lower(): c for c in CITIES}
CITY.update(ALIAS)

SKIP = re.compile(r"duathlon|triathlon|aquathlon|swim", re.I)
CYCLE = re.compile(r"cycl|bike|bicycle|\bmtb\b", re.I)
OTHER = re.compile(r"obstacle|devils circuit|orienteering|adventure|trek|hike|hiking", re.I)


def get(path):
    url = path if path.startswith("http") else BASE + path
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # network blip: back off, then give up on this page
            if attempt == 2:
                print("skip", url, e, file=sys.stderr)
                return ""
            time.sleep(3 * (attempt + 1))


def race_links(page_html):
    return re.findall(r'href="(/races/[a-z0-9-]+/\d{4})"', page_html)


def sports_event(page_html):
    for raw in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', page_html, re.S):
        try:
            data = json.loads(raw)
        except ValueError:
            continue
        for node in data.get("@graph", [data]) if isinstance(data, dict) else data:
            if isinstance(node, dict) and "Event" in str(node.get("@type", "")):
                return node
    return None


def https(u):
    u = (u or "").strip()
    return u if u.startswith("https://") and "racesindia.com" not in u else ""


def parse_race(page_html, today):
    ev = sports_event(page_html)
    if not ev:
        return None
    date = str(ev.get("startDate", ""))[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        return None
    d = dt.date.fromisoformat(date)
    if d < today or (d - today).days > HORIZON_DAYS:
        return None
    if "Cancelled" in str(ev.get("eventStatus", "")) or "Postponed" in str(ev.get("eventStatus", "")):
        return None
    title = html.unescape(str(ev.get("name", ""))).strip()
    if not title or SKIP.search(title):
        return None
    loc = ev.get("location") or {}
    loc = loc[0] if isinstance(loc, list) and loc else loc
    loc = loc if isinstance(loc, dict) else {}
    addr = loc.get("address") if isinstance(loc.get("address"), dict) else {}
    city = CITY.get(str(addr.get("addressLocality", "")).strip().lower())
    if not city:
        return None
    org = ev.get("organizer") or {}
    org = org[0] if isinstance(org, list) and org else org
    m = re.search(r'<a[^>]+href="(https://[^"]+)"[^>]*>\s*Register officially', page_html)
    url = https(org.get("url") if isinstance(org, dict) else "") or https(m.group(1) if m else "")
    if not url:
        return None
    venue = html.unescape(str(loc.get("name", ""))).strip() if isinstance(loc, dict) else ""
    return {"title": title, "sport": "Cycling" if CYCLE.search(title) else "Other" if OTHER.search(title) else "Running",
            "city": city, "date": date, "venue": venue,
            "org": html.unescape(str(org.get("name", ""))).strip() if isinstance(org, dict) else "",
            "url": url}


def key(e):
    return e["date"] + "|" + e["city"] + "|" + re.sub(r"[^a-z0-9]", "", e["title"].lower())[:12]


def merge(old, new, today):
    out = {}
    for e in old:  # keep entries still upcoming (incl. ones added by hand)
        if e.get("date", "") >= today.isoformat():
            out[key(e)] = e
    for e in new:  # fresh data wins for the same race
        out[key(e)] = e
    return sorted(out.values(), key=lambda e: (e["date"], e["title"]))[:MAX_EVENTS]


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "sports-auto.json"
    ist = dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).date()
    links = []
    for base in LISTS:
        for page in range(1, MAX_PAGES + 1):
            body = get(base + ("" if page == 1 else "?page=%d" % page))
            found = race_links(body)
            links += found
            if not found or 'page=%d"' % (page + 1) not in body:
                break
            time.sleep(1)
    links = list(dict.fromkeys(links))
    print("race pages:", len(links))

    new, parsed = [], 0
    for link in links:
        body = get(link)
        time.sleep(1)  # be polite to the source
        if sports_event(body):
            parsed += 1
        e = parse_race(body, ist)
        if e:
            new.append(e)
    print("parsed:", parsed, "kept:", len(new))
    if not parsed:
        sys.exit("No race data parsed: source layout may have changed. Nothing written.")

    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    events = merge(doc.get("events", []), new, ist)
    if events == doc.get("events"):
        print("no change")
        return
    doc["events"] = events
    doc["updated"] = ist.isoformat()
    doc["note"] = ("Found automatically from public race listings (RacesIndia). Each entry links to "
                   "the organiser or its official registration page. Refreshed weekly; past events are removed.")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("written:", len(events), "events")


if __name__ == "__main__":
    main()
