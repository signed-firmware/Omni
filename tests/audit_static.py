"""Validate every local page, link, fragment, asset and JSON file. No dependencies."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, file):
        super().__init__()
        self.file, self.ids, self.refs, self.issues = file, [], [], []
        self.stack = []
        self.viewport = self.h1 = False
        self.feed(file.read_text(encoding='utf-8'))
        if self.stack:
            self.issues.append('Unclosed elements: ' + ', '.join(self.stack))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        parent = self.stack[-1] if self.stack else None
        if parent in ('ul', 'ol') and tag not in ('li', 'script', 'template'):
            self.issues.append(f'{tag} must be inside a list item, not directly in {parent}')
        if parent == 'p' and tag in ('h1', 'h2', 'h3', 'h4', 'div', 'p', 'section', 'article', 'ul', 'ol'):
            self.issues.append(f'Invalid block {tag} inside paragraph')
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.stack.append(tag)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.h1 = True
        if tag == 'meta' and attrs.get('name') == 'viewport':
            self.viewport = True
        if tag == 'img' and not attrs.get('alt'):
            self.issues.append('Image has no alternative text: ' + attrs.get('src', ''))
        for attr in ('href', 'src', 'data-src', 'poster'):
            if attr in attrs:
                self.refs.append((attrs[attr], tag + ':' + attr))
        for url in re.findall(r'url\([\'"]?(.*?)[\'"]?\)', attrs.get('style', '')):
            self.refs.append((url, 'style'))

    def handle_endtag(self, tag):
        if not self.stack or tag not in self.stack:
            self.issues.append('Unmatched closing element: ' + tag)
            return
        if self.stack[-1] != tag:
            self.issues.append(f'Misnested closing {tag}: open {self.stack[-1]}')
        while self.stack:
            if self.stack.pop() == tag:
                break


def audit():
    pages = {file: Page(file) for file in [ROOT / 'index.html', *sorted((ROOT / 'pages').rglob('*.html'))]}
    issues = []
    for file, page in pages.items():
        for name, count in Counter(page.ids).items():
            if count > 1:
                page.issues.append(f'Duplicate id: {name} ({count})')
        if not page.viewport:
            page.issues.append('Missing mobile viewport')
        if not page.h1:
            page.issues.append('Missing page heading')
        for url, kind in page.refs:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc:
                continue
            if url in ('', '#'):
                page.issues.append(f'Placeholder {kind}: {url!r}')
                continue
            target = (ROOT / unquote(parsed.path).lstrip('/') if parsed.path.startswith('/')
                      else file.parent / unquote(parsed.path)) if parsed.path else file
            target = target.resolve()
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                page.issues.append(f'Missing {kind}: {url}')
            elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
                page.issues.append(f'Missing fragment: {url}')
        issues.extend(f'{file.relative_to(ROOT).as_posix()}: {issue}' for issue in page.issues)
    for file in (ROOT / 'data').rglob('*.json'):
        try:
            json.loads(file.read_text(encoding='utf-8'))
        except ValueError as error:
            issues.append(f'{file.relative_to(ROOT)}: {error}')
    for entry in json.loads((ROOT / 'data/search-index.json').read_text(encoding='utf-8')):
        if not (ROOT / entry['url']).is_file():
            issues.append('Search index missing page: ' + entry['url'])
    print('\n'.join(issues))
    print(f'{len(pages)} pages checked; {len(issues)} issues.')
    return bool(issues)


if __name__ == '__main__':
    sys.exit(audit())
