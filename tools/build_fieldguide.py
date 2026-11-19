"""Oulanka Virtual Field Guide: points, sensor stations and topics in one file (fieldguide/guide.json),
plus small photos for the topic cards (fieldguide/img/).

Positions of the 360° points come from the Oulanka table (oulanka/oulanka.json) and are approximate; correct them
and the north direction of each photo in the guide's edit mode (fieldguide/?edit) and save the downloaded file
as fieldguide/points.json, which then overrides these values.

usage: python3 tools/build_fieldguide.py <dem_2m.tif>
"""
import sys, os, json
import numpy as np, rasterio
from pyproj import Transformer
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..'); OUT = os.path.join(ROOT, 'fieldguide')
os.makedirs(OUT, exist_ok=True)
CE, CN, R = 603390.8, 7363068.5, 1850.0
ll = Transformer.from_crs(3067, 4326, always_xy=True)
dem = rasterio.open(sys.argv[1]); band = dem.read(1)
def elev(e, n):
    r, c = dem.index(e, n)
    if 0 <= r < band.shape[0] and 0 <= c < band.shape[1] and band[r, c] > -100: return round(float(band[r, c]), 1)
    return None
meta = json.load(open(os.path.join(ROOT, 'oulanka', 'oulanka.json')))
TITLES = {  # id: (title, subtitle) as in the hub
 'p01': ('Riverside monitoring point', 'River shore below the research station'), 'p15': ('Research station yard', 'Weather instruments and station buildings'),
 'p14': ('Road bridge over the Oulankajoki', 'View along the river'), 'p02': ('Footbridge over the rapids', 'Hiking trail crossing'),
 'p03': ('Rapids and red cliffs', 'White water through the canyon'), 'p08': ('Calm river bend', 'Birch slope in autumn colours'),
 'p11': ('Riverside meadow', 'Open bank at a river bend'), 'p04': ('Pine forest above the river', 'Old pines along the trail'),
 'p05': ('Riverside trail', 'Rope-fenced path above the water'), 'p06': ('Trail stairs to the river', 'River view through the trees'),
 'p07': ('Stairs in old-growth forest', 'Spruce and pine slope'), 'p09': ('Stairs and boardwalk', 'Trail junction in birch forest'),
 'p10': ('Boardwalk through birch forest', 'Elevated trail section'), 'p12': ('Pine heath forest road', 'Dry pine heath'),
 'p13': ('Fen boardwalk', 'Puukkosuo peatland'),
}
pts = []
for pid, (x, z) in sorted(meta['pano'].items()):
    e, n = CE + x * R, CN - z * R; lon, lat = ll.transform(e, n)
    t, s = TITLES[pid]
    pts.append({'id': pid, 'title': t, 'sub': s, 'file': f'../panoramas/oulanka-{pid[1:]}.jpg', 'E': round(e, 1), 'N': round(n, 1),
                'lat': round(lat, 6), 'lon': round(lon, 6), 'elev': elev(e, n), 'north': 0, 'season': 'Autumn', 'date': '2026-09', 'approx': True})
sens = json.load(open(os.path.join(ROOT, 'oulanka', 'sensors.json')))['stations']
stations = []
for s in sens:
    stations.append({k: s[k] for k in ('id', 'name', 'place', 'cat', 'E', 'N', 'lat', 'lon', 'z', 'sensors') if k in s})
    if not stations[-1].get('z'): stations[-1]['z'] = elev(s['E'], s['N'])

def crop(pid, yaw_frac, out, w=1200, h=675):
    im = Image.open(os.path.join(ROOT, 'panoramas', f'oulanka-{pid[1:]}.jpg')).convert('RGB'); W, H = im.size
    cw = int(W * .28); ch = int(cw * h / w); cx = int(W * yaw_frac); cy = int(H * .5)
    strip = Image.new('RGB', (cw, ch)); x0 = cx - cw // 2
    for k in range(cw): pass
    big = Image.new('RGB', (W * 2, H)); big.paste(im, (0, 0)); big.paste(im, (W, 0))
    big.crop((x0 % W, cy - ch // 2, x0 % W + cw, cy + ch // 2)).resize((w, h), Image.LANCZOS).save(os.path.join(OUT, 'topic-' + out), quality=82)
    return 'topic-' + out
fen_img = 'topic-fen.jpg'
_f = Image.open(os.path.join(ROOT, 'oulanka', 'fen-sep.webp')).convert('RGB'); _w, _h = _f.size     # a sharp crop from the middle of the autumn survey
_cw = int(_w * .46); _ch = int(_cw * 9 / 16); _x = int(_w * .30); _y = int(_h * .36)
_f.crop((_x, _y, _x + _cw, _y + _ch)).resize((1200, 675), Image.LANCZOS).save(os.path.join(OUT, fen_img), quality=84)
lab = {l['t']: l['at'] for l in meta['labels']}
def at_label(name):
    x, z = lab[name]; e, n = CE + x * R, CN - z * R; lon, lat = ll.transform(e, n); return round(e, 1), round(n, 1), round(lat, 6), round(lon, 6)
def topic(tid, title, sub, text, E, N, img=None):
    lon, lat = ll.transform(E, N)
    return {'id': tid, 'title': title, 'sub': sub, 'text': text, 'E': round(E, 1), 'N': round(N, 1), 'lat': round(lat, 6), 'lon': round(lon, 6), 'img': img, 'draft': True}
kE, kN, _, _ = at_label('Kiutaköngäs'); sE, sN, _, _ = at_label('Oulanka Research Station')
topics = [
 topic('t-fen', 'Puukkosuo fen', 'An open peatland with year-round monitoring',
  'Puukkosuo is an open fen north of the station. Drone surveys in winter, snowmelt, summer and autumn 2024 show how snow, water and vegetation change through the year, and a line of groundwater wells and an eddy covariance station measure the fen continuously.',
  603150, 7363900, fen_img),
 topic('t-wells', 'Groundwater wells across the fen', 'How high is the water table?',
  'Pressure loggers in the wells record water level and temperature. The readings are corrected with air pressure and converted to water-table depth with manual measurements, so the fen’s wetness can be followed through floods and dry spells.',
  603110, 7363930),
 topic('t-ec', 'Eddy covariance station', 'The fen breathing in and out',
  'Fast sensors measure wind and gas concentrations many times a second. From them the station calculates the exchange of carbon dioxide, methane, water vapour and heat between the fen and the air.',
  603147, 7363925),
 topic('t-soil', 'Wireless soil sensors', 'Moisture and temperature under the forest floor',
  'Buried wireless sensors report soil moisture, temperature and salinity every 20 minutes, showing how the ground freezes, thaws, wets and dries through the seasons.',
  603480, 7363020),
 topic('t-rapids', 'Kiutaköngäs rapids', 'Where the river cuts through bedrock',
  'At Kiutaköngäs the Oulankajoki narrows between rocky cliffs and drops through a chain of rapids. It is one of the best-known sights of Oulanka National Park.',
  kE, kN, crop('p03', .5, 'rapids.jpg')),
 topic('t-river', 'The Oulankajoki', 'A river that flows east',
  'The Oulankajoki flows east across the border into Russia, on towards the White Sea. Snowmelt in spring brings its yearly high water, when the river rises over the low banks and meadows.',
  CE - 60, CN + 40, crop('p14', .5, 'river.jpg')),
 topic('t-station', 'Oulanka Research Station', 'Base for research in the area',
  'The station is the base for field research around Oulanka: accommodation, laboratories and the weather instruments in the yard. Many of the measurements in this guide are serviced from here.',
  sE, sN, crop('p15', .5, 'station.jpg')),
 topic('t-pine', 'Dry pine heath', 'Pine, lichen and dwarf shrubs',
  'On dry, sandy ground, pine grows over a carpet of lichen and dwarf shrubs. Water drains quickly here, unlike on the wet fen nearby.',
  *at_label('Haaralamminkangas')[:2], crop('p12', .5, 'pine.jpg')),
]
json.dump({'site': 'Oulankajoki', 'title': 'Oulanka Virtual Field Guide', 'credit': '360° photos: Siamak Bazzaz, September 2026 · Fen photos: Petra Korhonen, 2024 drone surveys · Sensors: DIWA critical-zone sensor template (public sensors only) · Map: © OpenStreetMap contributors',
           'table': {'E': CE, 'N': CN, 'R': R}, 'points': pts, 'stations': stations}, open(os.path.join(OUT, 'guide.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(pts), 'points', len(stations), 'stations')  # topics removed from the guide (v1.18)
print([(p['id'], p['elev']) for p in pts])
