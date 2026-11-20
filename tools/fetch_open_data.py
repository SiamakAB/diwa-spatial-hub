#!/usr/bin/env python3
"""Daily copy of open data for the DIWA Spatial Hub (Oulanka).

Fetches the last 12 months of
  - FMI daily weather (air temperature, precipitation, snow depth) from the
    nearest FMI station to Oulanka Research Station, and
  - Syke hydrology (discharge, water level, water temperature) for the Oulankajoki,
and writes them to data/open/oulanka-weather.json and data/open/oulanka-hydro.json
in the same format the hub builds in the browser. The hub uses these files only
when the live request from the browser fails.

Run by .github/workflows/open-data.yml once a day. Standard library only.
"""
import json, math, os, sys, datetime as dt, urllib.request, urllib.parse
import xml.etree.ElementTree as ET

LAT, LON, E0, N0 = 66.3700, 29.3120, 603390.8, 7363068.5
N = 365
SYKE = 'https://rajapinnat.ymparisto.fi/api/Hydrologiarajapinta/1.1/odata/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'open')


def get(url, accept=None):
    req = urllib.request.Request(url, headers={'User-Agent': 'DIWA-Spatial-Hub/1.0', **({'Accept': accept} if accept else {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def window():
    end = dt.date.today() - dt.timedelta(days=1)
    return end - dt.timedelta(days=N - 1), end


def series(m, start, min_days=45):
    a, k, latest = [None] * N, 0, None
    for i in range(N):
        key = (start + dt.timedelta(days=i)).isoformat(); v = m.get(key)
        if v is not None and math.isfinite(v):
            a[i] = v; k += 1; latest = {'v': v, 'date': key}
    if k < min_days:
        return None
    last = -1
    for i in range(N):
        if a[i] is None:
            continue
        if last < 0:
            for j in range(i): a[j] = a[i]
        else:
            for j in range(last + 1, i): a[j] = a[last] + (a[i] - a[last]) * (j - last) / (i - last)
        last = i
    for j in range(last + 1, N): a[j] = a[last]
    return {'data': [round(x, 3) for x in a], 'latest': latest, 'days': k}


def local(tag):
    return tag.rsplit('}', 1)[-1]


def fmi():
    start, end = window()
    base = ('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature'
            '&storedquery_id=fmi::observations::weather::daily::simple'
            f'&latlon={LAT},{LON}&maxlocations=1&parameters=tday,rrday,snow')
    maps = {'tday': {}, 'rrday': {}, 'snow': {}}; pos = None
    s = start
    while s <= end:
        e = min(s + dt.timedelta(days=91), end)
        root = ET.fromstring(get(f'{base}&starttime={s}T00:00:00Z&endtime={e}T00:00:00Z'))
        for el in root.iter():
            if local(el.tag) != 'BsWfsElement':
                continue
            f = {local(c.tag): (c.text or '').strip() for c in el.iter()}
            try: v = float(f.get('ParameterValue', 'nan'))
            except ValueError: continue
            p = f.get('ParameterName')
            if pos is None and f.get('pos'):
                pos = [float(x) for x in f['pos'].split()]
            if p in maps and math.isfinite(v):
                maps[p][f['Time'][:10]] = max(0.0, v) if p in ('rrday', 'snow') else v
        s = e + dt.timedelta(days=1)
    station = 'nearest FMI weather station'
    if pos:
        try:
            root = ET.fromstring(get('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature'
                                     f'&storedquery_id=fmi::ef::stations&bbox={pos[1]-.01},{pos[0]-.01},{pos[1]+.01},{pos[0]+.01}'))
            names = [el for el in root.iter() if local(el.tag) == 'name']
            nm = next((el for el in names if 'name' in (el.get('codeSpace') or '')), names[0] if names else None)
            if nm is not None and nm.text: station = nm.text.strip()
        except Exception as ex:
            print('station name lookup failed:', ex)
    dist = None
    if pos:
        r = math.pi / 180
        dist = round(math.hypot((pos[1] - LON) * r * math.cos((LAT + pos[0]) / 2 * r), (pos[0] - LAT) * r) * 6371, 1)
    out = {'kind': 'weather', 'provider': 'Finnish Meteorological Institute (FMI) open data', 'licence': 'CC BY 4.0',
           'station': station, 'distKm': dist, 'start': start.isoformat(), 'end': end.isoformat(),
           'updated': dt.datetime.utcnow().isoformat() + 'Z',
           'series': {'airT': series(maps['tday'], start), 'precip': series(maps['rrday'], start), 'snow': series(maps['snow'], start, 20)}}
    if not out['series']['airT']:
        raise RuntimeError('FMI returned no temperature data')
    return out


def syke_json(url):
    return json.loads(get(url if url.startswith('http') else SYKE + url, 'application/json'))


def syke():
    start, end = window()
    flt = urllib.parse.quote("substringof('Oulankajoki',Nimi)")
    sites = []
    for p in syke_json(f'Paikka?$filter={flt}&$top=200').get('value', []):
        d = math.hypot((p.get('KoordErTmIta') or 0) - E0, (p.get('KoordErTmPohj') or 0) - N0)
        if d < 80000: sites.append({'id': p['Paikka_Id'], 'name': p.get('Nimi'), 'nro': p.get('Nro'), 'd': d})
    sites = sorted(sites, key=lambda x: x['d'])[:8]
    if not sites:
        raise RuntimeError('No Oulankajoki gauges found')

    def one(ent, scale):
        for st in sites:
            try:
                f = urllib.parse.quote(f"Paikka_Id eq {st['id']} and Aika ge datetime'{start}T00:00:00'")
                url, m, guard = f'{ent}?$filter={f}&$orderby=Aika&$top=1000', {}, 0
                while url and guard < 6:
                    guard += 1; j = syke_json(url)
                    for v in j.get('value', []):
                        if v.get('Arvo') is not None: m[str(v['Aika'])[:10]] = float(v['Arvo']) * scale
                    url = j.get('odata.nextLink')
                s = series(m, start, 30)
                if s:
                    s.update(gauge=st['name'], nro=st['nro'], distKm=round(st['d'] / 1000, 1)); return s
            except Exception as ex:
                print(ent, st['name'], 'failed:', ex)
        return None

    out = {'kind': 'hydro', 'provider': 'Finnish Environment Institute (Syke) hydrology API', 'licence': 'CC BY 4.0',
           'start': start.isoformat(), 'end': end.isoformat(), 'updated': dt.datetime.utcnow().isoformat() + 'Z',
           'series': {'Q': one('Virtaama', 1), 'WL': one('Vedenkorkeus', .01), 'WT': one('LampoPintavesi', 1)}}
    if not out['series']['Q'] and not out['series']['WL']:
        raise RuntimeError('Syke returned no discharge or water level data')
    return out


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); ok = 0
    for name, fn in (('oulanka-weather', fmi), ('oulanka-hydro', syke)):
        try:
            d = fn()
            with open(os.path.join(OUT, name + '.json'), 'w') as f: json.dump(d, f, separators=(',', ':'))
            print(name, 'ok', {k: (v or {}).get('days') for k, v in d['series'].items()}); ok += 1
        except Exception as ex:
            print(name, 'FAILED:', ex)
    sys.exit(0 if ok else 1)
