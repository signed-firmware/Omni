"""Read-only reachability check; HTTP status alone does not validate article accuracy."""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import re

ROOT = Path(__file__).resolve().parents[1]
urls = {'https://' + (ROOT / 'CNAME').read_text().strip() + '/'}

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value.startswith(('http://', 'https://')):
                urls.add(value.split('#')[0])

for file in [ROOT / 'index.html', *(ROOT / 'pages').rglob('*.html')]:
    Links().feed(file.read_text(encoding='utf-8'))
urls.update(re.findall(r"https://[^'\"]+", (ROOT / 'css/style.css').read_text(encoding='utf-8').splitlines()[0]))

def check(url):
    try:
        with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15) as response:
            response.read(1024)
            return f'{response.status} {url}'
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        return f'UNVERIFIED {url}: {error}'

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=6) as executor:
        for result in executor.map(check, sorted(urls)):
            print(result)
