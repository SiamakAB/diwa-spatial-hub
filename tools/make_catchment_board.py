"""Blueprint image for the DIWA Catchments board in the hall.
Finland and its neighbours (Natural Earth 1:10m via world-atlas), the supersite boundaries (data/catchments.geojson)
and the public sensor stations (data/sensors-all.json), drawn in ETRS-TM35FIN in the colours of the supersite board.
Writes assets/catchments-blueprint.webp and prints the label anchors (fractions of the image) for src/app.js.

usage: python3 tools/make_catchment_board.py <path to world-atlas/countries-10m.json>
"""
import sys, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pyproj import Transformer
from shapely.geometry import shape, Polygon, MultiPolygon, mapping
from shapely.ops import transform as stransform

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
X0, X1, Y0, Y1 = 40000, 760000, 6590000, 7800000            # map extent in ETRS-TM35FIN
S = 2                                                         # supersampling
H = 1159 * S; W = int(round(H * (X1 - X0) / (Y1 - Y0)))
tr = Transformer.from_crs(4326, 3067, always_xy=True)
px = lambda x, y: ((x - X0) / (X1 - X0) * W, (Y1 - y) / (Y1 - Y0) * H)

# --- topojson (world-atlas) decoding
topo = json.load(open(sys.argv[1])); t = topo['transform']; arcs = []
for a in topo['arcs']:
    x = y = 0; pts = []
    for dx, dy in a: x += dx; y += dy; pts.append((x * t['scale'][0] + t['translate'][0], y * t['scale'][1] + t['translate'][1]))
    arcs.append(pts)
def ring(idx):
    out = []
    for i in idx:
        p = arcs[i] if i >= 0 else arcs[~i][::-1]
        out += p[1:] if out else p
    return out
def poly(p):
    rs = [ring(r) for r in p]; rs = [r for r in rs if len(r) >= 4]
    return Polygon(rs[0], rs[1:]) if rs else None
def geom(g):
    ps = [g['arcs']] if g['type'] == 'Polygon' else g['arcs']
    return MultiPolygon([q for q in (poly(p) for p in ps) if q is not None])
WANT = {'Finland', 'Sweden', 'Norway', 'Russia', 'Estonia'}
countries = {g['properties']['name']: geom(g) for g in topo['objects']['countries']['geometries'] if g['properties']['name'] in WANT}
proj = lambda g: stransform(lambda x, y, z=None: tr.transform(x, y), g)

img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
def fill(g, col, outline=None, width=1):
    polys = [g] if g.geom_type == 'Polygon' else [q for q in getattr(g, 'geoms', []) if q.geom_type == 'Polygon']
    for p in polys:
        if p.is_empty: continue
        d.polygon([px(*c) for c in p.exterior.coords], fill=col)
        for r in p.interiors: d.polygon([px(*c) for c in r.coords], fill=(0, 0, 0, 0))
        if outline: d.line([px(*c) for c in p.exterior.coords], fill=outline, width=width, joint='curve')
from shapely.geometry import box
view = box(-10, 52, 45, 75)                                  # only the part of the neighbours near Finland
for n in ['Sweden', 'Norway', 'Russia', 'Estonia']:
    if n in countries: fill(proj(countries[n].buffer(0).intersection(view)), (16, 56, 108, 255))
# neighbours fade out towards the image edges, so the board shows no hard rectangle
yy, xx = np.mgrid[0:H, 0:W]; e = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(np.float32)
fade = np.clip(e / (70 * S), 0, 1) ** 1.5
a = np.asarray(img).copy(); a[..., 3] = (a[..., 3] * fade).astype(np.uint8); img = Image.fromarray(a, 'RGBA'); d = ImageDraw.Draw(img)
fin = proj(countries['Finland'])
if fin.geom_type == 'MultiPolygon': fin = MultiPolygon([p for p in fin.geoms])
fill(fin, (24, 82, 140, 255))
# Finland's edge in yellow, like the supersite board
edge = Image.new('L', (W, H), 0); ed = ImageDraw.Draw(edge)
for p in ([fin] if fin.geom_type == 'Polygon' else fin.geoms):
    ed.line([px(*c) for c in p.exterior.coords], fill=255, width=3 * S, joint='curve')
img.paste((255, 214, 90, 255), (0, 0), edge)

# supersite boundaries
geo = json.load(open(os.path.join(ROOT, 'data', 'catchments.geojson')))
anchors = {}
for f in geo['features']:
    g = proj(shape(f['geometry'])); sid = f['properties']['id']
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    for p in polys: ld.polygon([px(*c) for c in p.exterior.coords], fill=(95, 212, 255, 46))
    for p in polys: ld.line([px(*c) for c in p.exterior.coords] + [px(*p.exterior.coords[0])], fill=(127, 216, 255, 255), width=2 * S, joint='curve')
    img = Image.alpha_composite(img, lay)
    rp = g.representative_point(); ax, ay = px(rp.x, rp.y); anchors[sid] = [round(ax / W, 4), round(ay / H, 4)]
d = ImageDraw.Draw(img)
# public sensor stations
CAT = {'soil': (52, 211, 153), 'surface': (56, 189, 248), 'groundwater': (167, 139, 250), 'atmosphere': (250, 204, 21), 'vegetation': (134, 239, 172), 'remote': (241, 245, 249), 'other': (148, 163, 184)}
sens = json.load(open(os.path.join(ROOT, 'data', 'sensors-all.json')))['supersites']
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
for sid, lst in sens.items():
    for st in lst:
        x, y = px(st['E'], st['N']); c = CAT.get(st['cat'], CAT['other']); r = 3.2 * S
        gd.ellipse([x - r * 2.2, y - r * 2.2, x + r * 2.2, y + r * 2.2], fill=c + (70,))
        d.ellipse([x - r, y - r, x + r, y + r], fill=c + (255,), outline=(6, 22, 46, 255), width=S)
img = Image.alpha_composite(glow.filter(ImageFilter.GaussianBlur(3 * S)), img)
# Oulanka 3D table footprint
ox, oy = px(603390.8, 7363068.5); rr = 1850 / (X1 - X0) * W + 5 * S
ImageDraw.Draw(img).ellipse([ox - rr, oy - rr, ox + rr, oy + rr], outline=(255, 214, 90, 255), width=2 * S)
img = img.resize((W // S, H // S), Image.LANCZOS)
img.save(os.path.join(ROOT, 'assets', 'catchments-blueprint.webp'), quality=92)
print('size', img.size, 'aspect', round(img.size[0] / img.size[1], 4))
print('CATCH_PINS =', json.dumps(anchors))
print('OUL_TABLE_PIN =', [round(ox / W, 4), round(oy / H, 4)])
