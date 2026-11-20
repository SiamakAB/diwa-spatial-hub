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
    mask = [False] * N
    for i in range(N):
        key = (start + dt.timedelta(days=i)).isoformat(); v = m.get(key)
        if v is not None and math.isfinite(v):
            a[i] = v; mask[i] = True; k += 1; latest = {'v': v, 'date': key}
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
    return {'data': [round(x, 3) for x in a], 'latest': latest, 'days': k, 'raw': [1 if v else 0 for v in mask]}


def km(la1, lo1, la2, lo2):
    r = math.pi / 180
    return math.hypot((lo2 - lo1) * r * math.cos((la1 + la2) / 2 * r), (la2 - la1) * r) * 6371


def now():
    return dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def local(tag):
    return tag.rsplit('}', 1)[-1]


def fmi():
    start, end = window()
    # all stations in a box around Oulanka (Salla - Kuusamo airport); the nearest one reporting each value is used
    base = ('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature'
            '&storedquery_id=fmi::observations::weather::daily::simple'
            '&bbox=28.4,65.9,30.2,66.9&parameters=tday,rrday,snow')
    st = {}
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
            p, ps = f.get('ParameterName'), f.get('pos', '')
            if p not in ('tday', 'rrday', 'snow') or not ps or not math.isfinite(v):
                continue
            if ps not in st:
                la, lo = [float(x) for x in ps.split()]
                st[ps] = {'pos': (la, lo), 'd': km(LAT, LON, la, lo), 'tday': {}, 'rrday': {}, 'snow': {}}
            st[ps][p][f['Time'][:10]] = max(0.0, v) if p in ('rrday', 'snow') else v
        s = e + dt.timedelta(days=1)
    lst = sorted(st.values(), key=lambda x: x['d'])
    print('FMI stations in box:', [(round(x['d'], 1), len(x['tday']), len(x['rrday']), len(x['snow'])) for x in lst])

    def pick(p, mn):
        for S in lst:
            ser = series(S[p], start, mn)
            if ser: return ser, S
        return None
    T, P, SN = pick('tday', 45), pick('rrday', 45), pick('snow', 20)
    if not T:
        raise RuntimeError(f'FMI returned no temperature data ({len(lst)} stations)')
    fac = []
    try:
        root = ET.fromstring(get('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature'
                                 '&storedquery_id=fmi::ef::stations&bbox=27.5,65.5,31.0,67.5'))
        for f in root.iter():
            if local(f.tag) != 'EnvironmentalMonitoringFacility': continue
            nm = next((x.text.strip() for x in f.iter() if local(x.tag) == 'name' and (x.get('codeSpace') or '').endswith('/name') and x.text), None)
            ps = next((x.text.split() for x in f.iter() if local(x.tag) == 'pos' and x.text), None)
            if nm and ps and len(ps) > 1: fac.append((nm, float(ps[0]), float(ps[1])))
    except Exception as ex:
        print('station list failed:', ex)
    print('FMI stations listed:', len(fac))

    def name(S):
        la, lo = S['pos']
        best = min(fac, key=lambda f: km(la, lo, f[1], f[2]), default=None)
        return best[0] if best and km(la, lo, best[1], best[2]) < 1.5 else 'FMI weather station'
    def tag(o):
        if not o: return None
        ser, S = o; ser.update(station=name(S), distKm=round(S['d'], 1)); return ser
    airT = tag(T)
    return {'kind': 'weather', 'provider': 'Finnish Meteorological Institute (FMI) open data', 'licence': 'CC BY 4.0',
            'station': airT['station'], 'distKm': airT['distKm'], 'start': start.isoformat(), 'end': end.isoformat(),
            'updated': now(), 'series': {'airT': airT, 'precip': tag(P), 'snow': tag(SN)}}


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
           'start': start.isoformat(), 'end': end.isoformat(), 'updated': now(),
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
