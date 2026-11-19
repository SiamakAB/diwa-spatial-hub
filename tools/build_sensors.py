"""DIWA sensor network for the Spatial Hub.

Reads the DIWA critical-zone sensor template (CZ_sensor_template.xlsx), keeps only sensors marked
'1. Open data' or '2. Public data', groups sensors that stand at the same place into stations and writes:
  oulanka/sensors.json   stations inside the Oulanka table (table coordinates) + Oulankajoki catchment stations
  data/sensors-all.json  all public stations of all supersites (lat/lon) for the catchment overview
Private and confidential sensors are never written.  Contact persons are not published.

usage: python3 tools/build_sensors.py CZ_sensor_template.xlsx
"""
import sys, os, json, re
import pandas as pd
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
SRC = sys.argv[1]
SHEETS = ['Oulankajoki', 'Kemijoki', 'Oulu_region', 'Tenojoki', 'Vantaanjoki', 'Patamaki_Kokkola', 'Turku_region']
SUPERSITE = {'Oulankajoki': 'oulanka', 'Kemijoki': 'kemijoki', 'Oulu_region': 'osp', 'Tenojoki': 'tana', 'Vantaanjoki': 'vantaanjoki',
             'Patamaki_Kokkola': 'kokkola', 'Turku_region': 'archipelago'}
CE, CN, R = 603390.8, 7363068.5, 1850.0          # Oulanka table centre and radius (same as build_oulanka.py)
to_ll = Transformer.from_crs(3067, 4326, always_xy=True)

def cat_of(s):
    s = str(s)
    m = re.match(r'\s*(\d)', s); k = int(m.group(1)) if m else 7
    return {1: 'atmosphere', 2: 'vegetation', 3: 'soil', 4: 'groundwater', 5: 'surface', 6: 'remote', 7: 'other'}.get(k, 'other')

def clean(v):
    if v is None or (isinstance(v, float) and v != v): return ''
    s = str(v).strip()
    if s.lower() in ('nan', 'none', '-'): return ''
    return re.sub(r'\s+', ' ', s)

def date_of(v):
    s = clean(v)
    if not s: return ''
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', s)
    if m and int(m.group(2)) <= 12: return f'{m.group(1)}-{m.group(2)}'
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', s)
    if m: return f'{m.group(3)}-{int(m.group(2)):02d}'
    m = re.search(r'(\d{4})', s)
    return m.group(1) if m else ''

NAME = {'soil': 'Soil sensor', 'groundwater': 'Groundwater well', 'surface': 'Surface water station', 'atmosphere': 'Atmosphere station',
        'vegetation': 'Vegetation station', 'remote': 'Remote sensing', 'other': 'Monitoring point'}

def stations_for(sheet):
    d = pd.read_excel(SRC, sheet, header=3)
    d = d[d['Supersite_name'].notna()]
    d = d[d['Data_confidentiality'].astype(str).str.match(r'^\s*[12]\.')]
    out = []
    for _, r in d.iterrows():
        try:
            x = float(str(r['X_ETRS']).replace(' ', '').replace(',', '.')); y = float(str(r['Y_ETRS']).replace(' ', '').replace(',', '.'))
        except ValueError:
            continue
        if x > y: x, y = y, x                                   # one row has easting and northing swapped
        if not (50000 < x < 800000 and 6600000 < y < 7800000): continue
        out.append(dict(x=x, y=y, z=clean(r.get('Z_N2000')), site=clean(r['Supersite_name']), label=clean(r['Label']),
                        producer=clean(r['Producer']), model=clean(r['Model']), cat=cat_of(r['Observation_category']),
                        type=re.sub(r'^[a-z]\.\s*', '', clean(r['Observation_type'])), params=clean(r['Parameters_Measured']).replace('_', ' '),
                        units=clean(r['Parameter_Units']), res=clean(r['Temporal_Resolution']), start=date_of(r['Start_Date']),
                        end=date_of(r['End_Date']), fmt=clean(r['Current_Format']), note=clean(r['Observation_description']),
                        level='Open data' if str(r['Data_confidentiality']).strip().startswith('1') else 'Public data'))
    # group sensors within 6 m of each other into one station
    st = []
    for s in out:
        for g in st:
            if abs(g['x'] - s['x']) < 6 and abs(g['y'] - s['y']) < 6: g['sensors'].append(s); break
        else: st.append({'x': s['x'], 'y': s['y'], 'sensors': [s]})
    res = []
    for i, g in enumerate(st):
        cats = [s['cat'] for s in g['sensors']]; main = max(set(cats), key=cats.count)
        labels = [s['label'] for s in g['sensors'] if s['label']]
        lon, lat = to_ll.transform(g['x'], g['y'])
        prods = ' '.join(s['producer'] for s in g['sensors']).lower()
        name = NAME[main] if len(set(cats)) == 1 else 'Monitoring station'
        if 'licor' in prods or 'li-cor' in prods: name = 'Eddy covariance station'
        elif 'trios' in prods or 'ponsel' in prods: name = 'Water quality station'
        if len(set(cats)) == 1 and labels and len(g['sensors']) == 1 and name == NAME[main]: name += f' {labels[0]}'
        z = next((s['z'] for s in g['sensors'] if s['z']), '')
        place = ''
        if sheet == 'Oulankajoki':
            for pn, (pe, pnn, pr) in {'Puukkosuo fen': (603150, 7363900, 260), 'Oulankajoki river': (601824, 7363692, 120)}.items():
                if (g['x'] - pe) ** 2 + (g['y'] - pnn) ** 2 < pr * pr: place = pn
        res.append({'place': place, 'id': f"{SUPERSITE[sheet]}-{i + 1:03d}", 'name': name, 'site': g['sensors'][0]['site'], 'cat': main, 'cats': sorted(set(cats)),
                    'E': round(g['x'], 1), 'N': round(g['y'], 1), 'lat': round(lat, 6), 'lon': round(lon, 6), 'z': z,
                    'sensors': [{k: v for k, v in s.items() if k not in ('x', 'y', 'z', 'site') and v} for s in g['sensors']]})
    return res

ALL = {}
for sh in SHEETS:
    ALL[SUPERSITE[sh]] = stations_for(sh)
    n = sum(len(s['sensors']) for s in ALL[SUPERSITE[sh]])
    print(f'{sh:18s} {len(ALL[SUPERSITE[sh]]):3d} public stations, {n:3d} sensors')

# Oulanka: table coordinates for the stations inside the circle
oul = []
for s in ALL['oulanka']:
    dx, dy = s['E'] - CE, s['N'] - CN
    s2 = dict(s); s2['inTable'] = (dx * dx + dy * dy) ** .5 < R * .97
    if s2['inTable']: s2['at'] = [round(dx / R, 5), round(-dy / R, 5)]
    oul.append(s2)
os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
meta = {'source': 'DIWA critical-zone sensor template', 'rule': 'Only sensors marked Open data or Public data are shown.'}
json.dump({**meta, 'stations': oul}, open(os.path.join(ROOT, 'oulanka', 'sensors.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump({**meta, 'supersites': ALL}, open(os.path.join(ROOT, 'data', 'sensors-all.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('oulanka table stations:', sum(s['inTable'] for s in oul), 'of', len(oul))
