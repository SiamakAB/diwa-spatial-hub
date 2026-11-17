"""Build the DIWA library index for the hub's Knowledge panel.

Usage:  python3 build_knowledge.py <folder with PDFs / Excel / CSV / text files> [output, default ../knowledge/index.json]

Only text excerpts go into the index (about 900 characters per passage), never the files themselves.
Publish an index only for papers you are allowed to share (open-access articles, your own data).
"""
import json, os, re, sys, csv
from pypdf import PdfReader
import openpyxl

src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'knowledge', 'index.json')
docs, chunks = [], []

def add_text(di, page, txt):
    txt = re.sub(r'\s+', ' ', txt or '').strip()
    for i in range(0, len(txt), 900):
        t = txt[max(0, i - 120): i + 900].strip()
        if len(t) > 80: chunks.append({'d': di, 'p': page, 't': t})

def sheet_chunks(name, rows):
    rows = [r for r in rows if any(v not in (None, '') for v in r)]
    if not rows: return []
    head = [str(h) if h is not None else f'col {i+1}' for i, h in enumerate(rows[0])]; body = rows[1:]; res = []
    stats = []
    for i, h in enumerate(head):
        v = [r[i] for r in body if i < len(r) and isinstance(r[i], (int, float)) and not isinstance(r[i], bool)]
        stats.append(f'{h}: {len(v)} values, min {min(v):.2f}, max {max(v):.2f}, mean {sum(v)/len(v):.2f}' if v else f'{h}: {len(set(r[i] for r in body if i < len(r) and r[i] is not None))} distinct entries')
    res.append(f'Sheet "{name}" with {len(body)} rows and columns {", ".join(head)}. ' + '; '.join(stats) + '.')
    for i in range(0, len(body), 25):
        part = body[i:i + 25]
        res.append(f'Sheet "{name}" rows {i+1}–{i+len(part)}: ' + ' | '.join(', '.join(f'{head[k]}={str(r[k])[:40]}' for k in range(min(len(head), len(r))) if r[k] is not None) for r in part))
    return res

for root, _, files in os.walk(src):
    for f in sorted(files):
        p = os.path.join(root, f); ext = f.lower().rsplit('.', 1)[-1]
        try:
            if ext == 'pdf':
                rd = PdfReader(p); info = rd.metadata or {}
                pages = [(pg.extract_text() or '') for pg in rd.pages[:60]]
                first = ' '.join(pages[:1])[:3000]; year = (re.search(r'\b(19[89]\d|20[0-3]\d)\b', first) or [None, ''])[1]
                title = info.get('/Title') if info.get('/Title') and len(str(info.get('/Title'))) > 8 else re.sub(r'[_-]+', ' ', f.rsplit('.', 1)[0])
                di = len(docs); docs.append({'title': str(title), 'authors': str(info.get('/Author') or ''), 'year': year, 'file': f, 'kind': 'paper'})
                for k, t in enumerate(pages): add_text(di, k + 1, t)
            elif ext in ('xlsx', 'xlsm'):
                wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
                di = len(docs); docs.append({'title': re.sub(r'[_-]+', ' ', f.rsplit('.', 1)[0]), 'authors': '', 'year': '', 'file': f, 'kind': 'table'})
                for ws in wb.worksheets:
                    for t in sheet_chunks(ws.title, [list(r) for r in ws.iter_rows(values_only=True)]): chunks.append({'d': di, 'p': ws.title, 't': t})
            elif ext == 'csv':
                rows = list(csv.reader(open(p, encoding='utf-8', errors='replace')))
                rows = [[float(v) if re.fullmatch(r'-?\d+(\.\d+)?', v or '') else v for v in r] for r in rows]
                di = len(docs); docs.append({'title': re.sub(r'[_-]+', ' ', f.rsplit('.', 1)[0]), 'authors': '', 'year': '', 'file': f, 'kind': 'table'})
                for t in sheet_chunks(f, rows): chunks.append({'d': di, 'p': f, 't': t})
            elif ext in ('txt', 'md'):
                di = len(docs); docs.append({'title': f.rsplit('.', 1)[0], 'authors': '', 'year': '', 'file': f, 'kind': 'text'}); add_text(di, 1, open(p, encoding='utf-8', errors='replace').read())
            else: continue
            print('ok ', f)
        except Exception as e: print('skip', f, e)

os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
json.dump({'docs': docs, 'chunks': chunks}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(docs)} documents, {len(chunks)} passages -> {out}')
