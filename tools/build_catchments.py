"""Supersite boundaries (shapefiles from Elisabeth Carter) to one light GeoJSON for the catchment view.
usage: python3 tools/build_catchments.py tools/src/supersites
"""
import sys, os, glob, json
import geopandas as gpd
from shapely.geometry import mapping
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'data', 'catchments.geojson')
SRC = sys.argv[1]
INFO = {  # folder keyword -> id, name, kind, hub table
    'Oulankajoki': ('oulanka', 'Oulankajoki', 'Catchment', 'oulanka'),
    'Tenojoki': ('tana', 'Tenojoki (Tana)', 'Catchment', 'tana'),
    'Kemijoki': ('kemijoki', 'Kemijoki', 'Catchment · includes Pallas and Sodankylä', 'kemijoki'),
    'Oulu': ('osp', 'Oulu region', 'Supersite region', 'osp'),
    'Patam': ('kokkola', 'Patamäki, Kokkola', 'Groundwater study area', 'kokkola'),
    'Archipelago': ('archipelago', 'Archipelago Sea', 'Catchment', 'archipelago'),
    'Vantaanjoki': ('vantaanjoki', 'Vantaanjoki', 'Catchment', 'vantaanjoki'),
}
feats = []
for f in sorted(glob.glob(os.path.join(SRC, '**', '*.shp'), recursive=True)):
    key = next(k for k in INFO if k.lower() in f.lower())
    sid, name, kind, table = INFO[key]
    g = gpd.read_file(f)
    if g.crs is None: g = g.set_crs(3067)
    g = g.to_crs(3067); geom = g.union_all() if hasattr(g, 'union_all') else g.unary_union
    area = geom.area / 1e6
    tol = 60 if area < 3000 else 250 if area < 20000 else 500
    simp = geom.simplify(tol, preserve_topology=True)
    ll = gpd.GeoSeries([simp], crs=3067).to_crs(4326).iloc[0]
    def rnd(o):
        if isinstance(o, (list, tuple)):
            if o and isinstance(o[0], float): return [round(o[0], 4), round(o[1], 4)]
            return [rnd(x) for x in o]
        return o
    gm = mapping(ll); gm = {'type': gm['type'], 'coordinates': rnd(gm['coordinates'])}
    feats.append({'type': 'Feature', 'properties': {'id': sid, 'name': name, 'kind': kind, 'table': table, 'area_km2': round(area, 1)}, 'geometry': gm})
    print(f'{sid:12s} {area:9.1f} km²  tol {tol} m')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({'type': 'FeatureCollection', 'source': 'DIWA supersite boundaries (E. Carter)', 'features': feats}, open(OUT, 'w'), separators=(',', ':'))
print(os.path.getsize(OUT) // 1024, 'KB')
