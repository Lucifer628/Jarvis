import ast
import operator
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs
import httpx

from .config import GNEWS_API_KEY

_ALLOWED = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def safe_calculate(expression: str):
    if len(expression) > 120:
        raise ValueError("Expression is too long.")

    tree = ast.parse(expression, mode="eval")

    def evaluate(node):
        if isinstance(node, ast.Expression):
            return evaluate(node.body)

        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return node.value

        if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED:
            left = evaluate(node.left)
            right = evaluate(node.right)

            if isinstance(node.op, ast.Pow) and abs(right) > 8:
                raise ValueError("Exponent is too large.")

            result = _ALLOWED[type(node.op)](left, right)

            if abs(result) > 1e100:
                raise ValueError("Result is too large.")

            return result

        if isinstance(node, ast.UnaryOp) and type(node.op) in _ALLOWED:
            return _ALLOWED[type(node.op)](evaluate(node.operand))

        raise ValueError("Only basic arithmetic is supported.")

    return evaluate(tree)


class SearchParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.results = []
        self.current = None
        self.mode = None
        self.snippet_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()

        if tag == "a" and "result__a" in classes:
            self._save()
            self.current = {
                "title": "",
                "url": attrs.get("href", ""),
                "snippet": ""
            }
            self.mode = "title"

        elif tag == "div" and "result__snippet" in classes:
            if self.current:
                self.mode = "snippet"
                self.snippet_depth = 1

        elif tag == "div" and self.mode == "snippet":
            self.snippet_depth += 1

    def handle_data(self, data):
        if not self.current:
            return

        if self.mode == "title":
            self.current["title"] += data
        elif self.mode == "snippet":
            self.current["snippet"] += data

    def handle_endtag(self, tag):
        if tag == "a" and self.mode == "title":
            self.mode = None

        elif tag == "div" and self.mode == "snippet":
            self.snippet_depth -= 1
            if self.snippet_depth <= 0:
                self.mode = None

    def _save(self):
        if self.current and self.current["title"].strip():
            self.results.append(self.current)
        self.current = None

    def finish(self):
        self._save()
        return self.results


def web_search(query: str, limit: int = 5):
    limit = max(1, min(int(limit), 10))

    with httpx.Client(
        timeout=20,
        follow_redirects=True,
        headers={
            "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
        }
    ) as client:
        response = client.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query}
        )
        response.raise_for_status()

    parser = SearchParser()
    parser.feed(response.text)

    results = parser.finish()
    output = []

    for result in results[:limit]:
        url = result["url"]

        if "duckduckgo.com/l/" in url:
            target = parse_qs(urlparse(url).query).get("uddg", [])
            if target:
                url = target[0]

        output.append({
            "title": result["title"].strip(),
            "url": url,
            "snippet": result["snippet"].strip()
        })

    return output


async def weather_lookup(city: str):
    async with httpx.AsyncClient(timeout=15) as client:
        geo = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            }
        )
        geo.raise_for_status()

        places = geo.json().get("results", [])

        if not places:
            raise ValueError("City not found.")

        place = places[0]

        forecast = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
                "timezone": "auto"
            }
        )
        forecast.raise_for_status()

        return {
            "place": place.get("name"),
            "country": place.get("country"),
            "current": forecast.json().get("current", {})
        }


async def news_lookup(query: str = "technology"):
    if not GNEWS_API_KEY:
        return {
            "configured": False,
            "articles": [],
            "message": "Add GNEWS_API_KEY on the server to enable news."
        }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            "https://gnews.io/api/v4/search",
            params={
                "q": query,
                "lang": "en",
                "max": 5,
                "apikey": GNEWS_API_KEY
            }
        )
        response.raise_for_status()

        data = response.json()

        return {
            "configured": True,
            "articles": [
                {
                    "title": a.get("title"),
                    "url": a.get("url"),
                    "source": (a.get("source") or {}).get("name"),
                    "publishedAt": a.get("publishedAt"),
                    "description": a.get("description")
                }
                for a in data.get("articles", [])
            ]
        }
