"""Puukkosuo fen through the seasons: Petra's 2024 drone surveys resampled onto the fen inset grid of the Oulanka table.

Writes oulanka/fen-<key>.webp (RGBA, 2048 px wide, same extent as the inset) and oulanka/fen-surveys.json
with the survey details taken from the Agisoft processing reports.

usage: python3 tools/build_fen_seasons.py <folder with the survey files>
"""
import sys, os, json
import numpy as np, rasterio
from rasterio.warp import reproject, Resampling
from rasterio.transform import from_bounds
from scipy import ndimage as ndi
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'oulanka')
SRC = sys.argv[1]
CE, CN, R = 603390.8, 7363068.5, 1850.0
meta = json.load(open(os.path.join(OUT, 'oulanka.json')))
(x0, z0), (x1, z1) = meta['fen']['bounds']
L, T, Rr, B = CE + x0 * R, CN - z0 * R, CE + x1 * R, CN - z1 * R          # inset extent in ETRS-TM35FIN
W = 2048; H = int(round(W * (T - B) / (Rr - L)))
DST = from_bounds(L, B, Rr, T, W, H)

SURVEYS = [  # from the Agisoft reports (Petra, Puukkosuo 2024)
    dict(key='mar', date='2024-03-20', season='Winter', label='20 Mar 2024', file='240320_MS_RGB_Orthomosaic_5cm.tif',
         images=351, alt_m=67, gsd_cm=1.62, area_km2=0.119, gcp=1, gcp_err_cm=0.73, product='Orthomosaic 5 cm'),
    dict(key='may', date='2024-05-14', season='Snowmelt', label='14 May 2024', file='240514_MS_Orthomosaic_0_05.tif',
         images=430, alt_m=62.6, gsd_cm=1.53, area_km2=0.0911, gcp=3, gcp_err_cm=4.01, product='Orthomosaic 5 cm'),
    dict(key='jul', date='2024-07-24', season='Summer', label='24 Jul 2024', file='240724_Orthomosaic_5cm.tif',
         images=423, alt_m=62.7, gsd_cm=1.52, area_km2=0.0863, gcp=3, gcp_err_cm=3.63, product='Orthomosaic 5 cm'),
    dict(key='sep', date='2024-09-25', season='Autumn', label='25 Sep 2024', file='240925_Orthomosaic_10cm.jpg', ref='240925_DEM_10cm.tif',
         images=420, alt_m=59.0, gsd_cm=1.52, area_km2=0.0832, gcp=3, gcp_err_cm=2.55, product='Orthomosaic 10 cm'),
]

def read_survey(s):
    p = os.path.join(SRC, s['file'])
    if s.get('ref'):                                   # JPG without georeference: same grid as the DEM of the same flight
        ref = rasterio.open(os.path.join(SRC, s['ref']))
        im = Image.open(p).convert('RGB')
        assert abs(im.width / im.height - ref.width / ref.height) < .002, 'orthomosaic and DEM extents differ'
        a = np.asarray(im).transpose(2, 0, 1)
        tr = from_bounds(*ref.bounds, im.width, im.height)
        return a, tr
    r = rasterio.open(p)
    return r.read([1, 2, 3]), r.transform

def background(a, snow):
    if not snow:                                       # no snow: every near-white or near-black pixel is a gap in the survey
        rgb = a.astype(np.int16); return (rgb.min(0) > 238) | (rgb.max(0) < 8)
    return _flood(a)

def _flood(a):
    """Empty pixels around the survey (white or black), found by flood fill from the image border,
    so snow inside the fen is never mistaken for background."""
    rgb = a.astype(np.int16); lo = rgb.max(0) < 8; hi = rgb.min(0) > 247
    bg = np.zeros(lo.shape, bool)
    for m in (lo, hi):
        lab, _ = ndi.label(m); edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
        bg |= np.isin(lab, edge)
    return bg

out = []
for s in SURVEYS:
    a, tr = read_survey(s)
    valid = (~_flood(a)).astype(np.uint8) * 255
    dst = np.zeros((3, H, W), np.uint8); dv = np.zeros((H, W), np.uint8)
    for b in range(3): reproject(a[b], dst[b], src_transform=tr, src_crs='EPSG:3067', dst_transform=DST, dst_crs='EPSG:3067', resampling=Resampling.average)
    reproject(valid, dv, src_transform=tr, src_crs='EPSG:3067', dst_transform=DST, dst_crs='EPSG:3067', resampling=Resampling.average)
    v = ndi.binary_erosion(ndi.binary_fill_holes(dv > 200), iterations=3)
    vb = v.copy(); vb[:2, :] = vb[-2:, :] = False; vb[:, :2] = vb[:, -2:] = False   # also soft where the survey runs past the inset
    alpha = np.clip(ndi.distance_transform_edt(vb) / 40, 0, 1)       # soft edge, about 8 m
    rgb = dst.transpose(1, 2, 0).astype(np.float32) / 255
    if s['season'] not in ('Winter', 'Snowmelt'):     # gaps in summer/autumn surveys are white: fill them from the colours around
        gap = (rgb.min(2) > .9)[..., None]; good = (~gap).astype(np.float32)
        num = np.stack([ndi.gaussian_filter(rgb[..., c] * good[..., 0], 5) for c in range(3)], 2); den = ndi.gaussian_filter(good[..., 0], 5)[..., None]
        rgb = np.where(gap, num / np.maximum(den, 1e-3), rgb)
        edge_gap = ndi.gaussian_filter(gap[..., 0].astype(np.float32), 3)
        alpha = alpha * np.clip(1 - (den[..., 0] < .15) * 1.0, 0, 1)
    rgb = np.power(rgb, .9); g = rgb.mean(2, keepdims=True); rgb = np.clip(g + (rgb - g) * 1.1, 0, 1)
    Image.fromarray(np.dstack([(rgb * 255).astype(np.uint8), (alpha * 255).astype(np.uint8)]), 'RGBA').save(os.path.join(OUT, f"fen-{s['key']}.webp"), quality=84, method=5)
    print(s['key'], 'coverage of inset', round(float(v.mean()), 2))
    out.append({k: v for k, v in s.items() if k not in ('file', 'ref')})

json.dump({'by': 'Petra Korhonen, drone surveys of Puukkosuo fen', 'camera': 'DJI Mavic 3 Multispectral (M3M)', 'software': 'Agisoft Metashape',
           'dtm': {'date': '2024-05-31', 'res_cm': 10, 'note': 'Ground model filtered from the SfM surface model; less accurate than LiDAR.'},
           'surveys': out}, open(os.path.join(OUT, 'fen-surveys.json'), 'w'), ensure_ascii=False, indent=1)
