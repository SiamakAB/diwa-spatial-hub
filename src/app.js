import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

/* =====================================================================
   CONFIG — edit these values; nothing else needs to change.
   ===================================================================== */
const CONFIG = {
  // URL of your Cloudflare Worker (see worker.js + README). Leave '' until it exists.
  AI_PROXY_URL: 'https://diwa-hub-ai.siamak-ahmadzadeh.workers.dev',
  AI_MODEL_LABEL: 'AI',
  // Assistant voice: 'auto' = the most natural voice available (human-sounding browser voice, else the proxy's cloud voice),
  // 'cloud' = always the proxy's voice (Workers AI), 'browser' = always the browser's own voice.
  AI_VOICE: 'auto',
  // YouTube live stream shown on the screen in the hall.
  // Real 360° photo used as the landscape outside the hall's windows ('' = procedural sky).
  OUTSIDE_PANORAMA: 'panoramas/oulanka-11.jpg', OUTSIDE_YAW: 0,
  // The three video screens at the back of the hall (YouTube video IDs). They loop muted; click a screen up close for sound.
  SCREENS: [
    { id: 'K6LHjnnxH48', title: 'Live Camera', sub: 'Live stream', start: 0 },
    { id: '04ZnRPu5P1U', title: 'Finnish Flagship: Digital Waters DIWA', sub: 'Video', start: 1, thumb: '%%THUMB_DIWA%%' },
    { id: 'af7jmwSGR9A', title: 'Oulanka Research Station', sub: 'Video', start: 52, thumb: '%%THUMB_OULANKA%%' },
  ],
  LIVE_TITLE: 'Video wall',
  // Slides on the news board (newest first). Source: digitalwaters.fi/news
  NEWS: [
    { date: '12 Nov 2026', tag: 'Open position', title: 'Specialist (grant writer) at the University of Oulu', text: 'The Water, Energy and Environmental Engineering unit is recruiting a grant-writing specialist.', url: 'https://digitalwaters.fi/open-position-specialist-grant-writer-university-of-oulu/' },
    { date: '11 Nov 2026', tag: 'Event', title: 'The DIWA webinar series continues', text: 'The first webinar of the autumn is on Friday 20 November on Teams, with no separate registration.', url: 'https://digitalwaters.fi/diwa-webinaarisarja-jatkuu-diwa-webinar-series-continues/' },
    { date: '10 Nov 2026', tag: 'Call', title: 'TCSMT 2026 postdoctoral fellowships, University of Turku', text: 'The Turku Collegium for Science, Medicine and Technology invites applications for three-year fellowships.', url: 'https://digitalwaters.fi/call-for-postdoctoral-researchers-tcsmt-2026-fellowships-at-the-university-of-turku/' },
    { date: '27 Oct 2026', tag: 'News', title: 'From Science to Impact: DIWA meets leading companies', text: 'Digital Waters took part in a Research Council of Finland event connecting flagships with industry.', url: 'https://digitalwaters.fi/from-science-to-impact-diwa-meets-leading-companies/' },
    { date: '9 Oct 2026', tag: 'Open position', title: 'Researcher in forest biodiversity and catchment hydrology', text: 'The University of Turku is recruiting a project or doctoral researcher for a fixed-term position.', url: 'https://digitalwaters.fi/open-position-project-researcher-doctoral-researcher-in-forest-biodiversity-and-catchment-hydrology/' },
    { date: '3 Sep 2026', tag: 'Open position', title: 'Research Fellow in remote sensing and geospatial computing', text: 'A permanent geography position at the University of Turku focused on remote sensing.', url: 'https://digitalwaters.fi/open-position-university-research-fellow-in-environmental-remote-sensing-and-geospatial-computing-university-of-turku/' },
  ],
  // 360° photos (equirectangular JPG, 2:1) or videos (.mp4) in the "panoramas" folder next to index.html.
  // Pin position on the Oulankajoki table: river: [u, offset] = along the main river (0 = west, 1 = east) and
  // sideways from it, or at: [x, z] in table coordinates (−1…1). yaw = starting view direction in degrees.
  PANORAMAS: [
    { id: 'p01', title: 'Riverside monitoring point',        sub: 'Oulanka Research Station · river shore', file: 'panoramas/oulanka-01.jpg', river: [.44, .07] },
    { id: 'p15', title: 'Research station yard',             sub: 'Weather instruments and station buildings', file: 'panoramas/oulanka-15.jpg', at: [.1, -.06] },
    { id: 'p14', title: 'Road bridge over the Oulankajoki',  sub: 'View along the river', file: 'panoramas/oulanka-14.jpg', river: [.52, 0] },
    { id: 'p02', title: 'Footbridge over the rapids',        sub: 'Hiking trail crossing', file: 'panoramas/oulanka-02.jpg', river: [.7, 0] },
    { id: 'p03', title: 'Rapids and red cliffs',             sub: 'White water through the canyon', file: 'panoramas/oulanka-03.jpg', river: [.76, .08] },
    { id: 'p08', title: 'Calm river bend',                   sub: 'Birch slope in autumn colours', file: 'panoramas/oulanka-08.jpg', river: [.2, .1] },
    { id: 'p11', title: 'Riverside meadow',                  sub: 'Open bank at a river bend', file: 'panoramas/oulanka-11.jpg', river: [.12, -.1] },
    { id: 'p04', title: 'Pine forest above the river',       sub: 'Old pines along the trail', file: 'panoramas/oulanka-04.jpg', river: [.3, -.2] },
    { id: 'p05', title: 'Riverside trail',                   sub: 'Rope-fenced path above the water', file: 'panoramas/oulanka-05.jpg', river: [.36, -.13] },
    { id: 'p06', title: 'Trail stairs to the river',         sub: 'River view through the trees', file: 'panoramas/oulanka-06.jpg', river: [.58, -.11] },
    { id: 'p07', title: 'Stairs in old-growth forest',       sub: 'Spruce and pine slope', file: 'panoramas/oulanka-07.jpg', river: [.62, .17] },
    { id: 'p09', title: 'Stairs and boardwalk',              sub: 'Trail junction in birch forest', file: 'panoramas/oulanka-09.jpg', river: [.86, -.12] },
    { id: 'p10', title: 'Boardwalk through birch forest',    sub: 'Elevated trail section', file: 'panoramas/oulanka-10.jpg', river: [.9, .12] },
    { id: 'p12', title: 'Pine heath forest road',            sub: 'Dry pine heath near the experiment', file: 'panoramas/oulanka-12.jpg', at: [-.68, .38] },
    { id: 'p13', title: 'Fen boardwalk · experiment plots',  sub: 'Peatland with plot markers', file: 'panoramas/oulanka-13.jpg', at: [.58, -.6] },
  ],
};

/* =====================================================================
   Icons
   ===================================================================== */
const ICON = {
  drop: '<path d="M12 3.5s6 6.4 6 10.7a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
  waves: '<path d="M3 9.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  mountain: '<path d="M2.5 19.5 9 8.5l4 6.2 2.2-3.2 6.3 8z"/>',
  tree: '<path d="M12 3 17.5 11h-3.3L18 17H6l3.8-6H6.5z"/><path d="M12 17v4"/>',
  grid: '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>',
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.8V20h13V9.8"/>',
  layers: '<path d="m12 3.5 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  vr: '<rect x="2.5" y="7" width="19" height="10" rx="3.2"/><circle cx="8" cy="12" r="1.7"/><circle cx="16" cy="12" r="1.7"/>',
  live: '<circle cx="12" cy="12" r="2.2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
  pano: '<path d="M3 8.5c5.5-2 12.5-2 18 0v7c-5.5-2-12.5-2-18 0z"/><path d="M8.5 12.5l2.2-2.4 2 2 1.3-1.2 2 1.9"/>',
  ai: '<path d="m12 3 1.9 4.9L19 9.8l-5.1 1.8L12 16.6l-1.9-5L5 9.8l5.1-1.9z"/><path d="m18.5 15 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  snow: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/>',
  sprout: '<path d="M12 21v-8.5"/><path d="M12 12.5c0-4 3-7 8-7 0 5-3 7-8 7z"/><path d="M12 14.5c0-3-2.2-5.2-6.5-5.2 0 3.2 2.2 5.2 6.5 5.2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  leaf: '<path d="M5 19.5C5 11 10.5 5 20 5c0 9.5-6 15-14.5 15"/><path d="m5 19.5 8-8"/>',
  play: '<path d="M7 4.5v15l12-7.5z" style="stroke:none"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.2" style="stroke:none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" style="stroke:none"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  mic: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5"/>',
  speaker: '<path d="M4 9.5v5h3.8L13 18.5v-13L7.8 9.5z"/><path d="M16.2 9.2a4 4 0 0 1 0 5.6M18.8 6.6a7.8 7.8 0 0 1 0 10.8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  story: '<path d="M5 4.5h14v15l-7-4-7 4z"/>',
  sensor: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  river: '<path d="M6 3c4 4-3 7 1 11s9 2 11 7"/>',
  boundary: '<path d="M5 8.5C7 4.5 13 3.5 17 5.5s5 7 2 10-9 5-12 2-4-5-2-9z" stroke-dasharray="2.6 2.6"/>',
  landcover: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.6"/>',
  sparkle: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.2 2.2M15.3 15.3l2.2 2.2M6.5 17.5l2.2-2.2M15.3 8.7l2.2-2.2"/>',
  x: '<path d="M5 5l14 14M19 5 5 19"/>',
  music: '<path d="M9 18V5.5l11-2.2V16"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/>',
  chat: '<path d="M4 5.5h16v10.5H9.5L4 20.5z"/>',
  flood: '<path d="M3 17c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/><path d="M12 3v9M8.5 8.5 12 12l3.5-3.5"/>',
  ice: '<path d="M12 2.8 19.8 7.4v9.2L12 21.2l-7.8-4.6V7.4z"/><path d="M12 7v10M7.7 9.5l8.6 5M16.3 9.5l-8.6 5"/>',
  scen: '<path d="M4 18c2.5-2 5-2 7.5 0s5 2 8.5-1"/><path d="M5 13l4-4 3 3 6-6"/><path d="M14 6h4v4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  sofa: '<path d="M4 11V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V11"/><path d="M3 12.5a1.5 1.5 0 0 1 3 0V14h12v-1.5a1.5 1.5 0 0 1 3 0V18H3z"/><path d="M5 18v1.5M19 18v1.5"/>',
  exit: '<path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.4.2 4 1.8 4.5 4.6"/>',
  cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6-1.2A4.6 4.6 0 0 0 7 18.5z"/>',
  map: '<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  catch: '<path d="M6 4.5c3-1.6 6.2.4 8.6-.6 2.2-.9 4.4.6 4.6 3.2.2 2.6-1.6 3.6-1.2 6 .4 2.6-1.4 5.4-4.6 5.9-3.4.5-5-1.6-7.6-1.4C3.4 17.8 2.6 14.6 3.6 12c.9-2.4-.6-3.6.1-5.4.4-1 1.2-1.6 2.3-2.1z"/><path d="M12 7.5c.4 2.2-1.6 3.2-1.2 5.2.3 1.6 1.8 2.3 2.2 3.8"/><path d="M8.2 10.5c1.3.3 2.1 1.1 2.6 2.2M15.6 9.6c-1.2.5-2.2 1.6-2.6 3"/>',
  book: '<path d="M4 5.5c2.6-1 5.3-1 8 .8 2.7-1.8 5.4-1.8 8-.8v13c-2.6-1-5.3-1-8 .8-2.7-1.8-5.4-1.8-8-.8z"/><path d="M12 6.3v13"/>',
  news: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7 9h10M7 12.5h10M7 16h6"/>',
  pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  eraser: '<path d="M8.5 19.5h11"/><path d="M4.6 14.6 13.8 5.4a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8l-7.6 7.6a2 2 0 0 1-1.4.7H8.4a2 2 0 0 1-1.4-.6l-2.4-2.4a2 2 0 0 1 0-2.9z"/><path d="m9.5 9.5 5 5"/>',
  textT: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
  trash: '<path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5h9l1-12.5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
const svg = (n, a = '') => `<svg viewBox="0 0 24 24" ${a}>${ICON[n]}</svg>`;
/* Design tokens shared by the 2D interface and the 3D objects */
const DS = { r3d: .2, navyA: 'rgba(24,52,92,.94)', navyB: 'rgba(12,30,56,.94)', edge: 'rgba(140,200,255,.5)', iconA: '#7fd0ff', iconB: '#1a6fd8', font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", sans-serif' };
function drawIcon(c, name, x, y, size, color = '#fff', lw = 2) {
  c.save(); c.translate(x - size / 2, y - size / 2); c.scale(size / 24, size / 24); c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const m of ICON[name].matchAll(/d="([^"]+)"/g)) c.stroke(new Path2D(m[1]));
  c.restore();
}
function drawGlassPill(c, x, y, w, h, r) {
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, DS.navyA); g.addColorStop(1, DS.navyB);
  c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  c.strokeStyle = DS.edge; c.lineWidth = 3; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.beginPath(); c.roundRect(x + 4, y + 4, w - 8, h - 8, r - 4); c.stroke();
}
function drawIconBadge(c, name, x, y, r) {
  const g = c.createRadialGradient(x - r * .3, y - r * .4, 2, x, y, r); g.addColorStop(0, DS.iconA); g.addColorStop(1, DS.iconB);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); drawIcon(c, name, x, y, r * 1.1, '#fff', 2.2);
}

/* =====================================================================
   Sites
   ===================================================================== */
const SITES = [
  { id: 'tana', name: 'Tana River', icon: 'drop', type: 'river', pos: [-16.6, -10.4], r: 3.25, seed: 11,
    sub: 'River site · Finland–Norway border',
    text: 'The Tana (Teno) River forms part of the border between Finland and Norway and is known for its wild Atlantic salmon. Table terrain is illustrative.' },
  { id: 'pallas', name: 'Pallas Research Station', icon: 'mountain', type: 'fell', pos: [-6.9, -17.9], r: 3.25, seed: 23,
    sub: 'Research station · Pallas–Yllästunturi',
    text: 'Fell landscape of the Pallas–Yllästunturi area, home to long-term atmospheric and ecosystem monitoring. Table terrain is illustrative.' },
  { id: 'sodankyla', name: 'Sodankylä Research Station', icon: 'tree', type: 'forest', pos: [6.9, -17.9], r: 3.25, seed: 37,
    sub: 'Research station · Central Lapland',
    text: 'Boreal forest and fen landscape of central Lapland, with a long tradition of Arctic research. Table terrain is illustrative.' },
  { id: 'oulanka', name: 'Oulankajoki River', icon: 'waves', type: 'river', pos: [0, -5], r: 5.6, seed: 41, hero: true,
    sub: 'Supersite · Oulanka, Kuusamo',
    text: 'The Oulankajoki flows through Oulanka National Park in Kuusamo, northeastern Finland, past the University of Oulu’s Oulanka Research Station. This table is a real map of the 3.7 km around the station, from the National Land Survey 2 m elevation model and terrain database: the river and Kiutaköngäs rapids, road 8693 and its bridge, the station and visitor centre, trails, and the Puukkosuo fen. It carries the full set of hub layers: public sensor stations at their surveyed positions, drone photos of the Puukkosuo fen through the seasons, weather and hydrology panels, 360° views and a live camera.' },
  { id: 'kemijoki', name: 'Kemijoki River', icon: 'waves', type: 'river', pos: [16.6, -10.4], r: 3.25, seed: 53,
    sub: 'River site · Lapland',
    text: 'Finland’s longest river, flowing from eastern Lapland to the Gulf of Bothnia at Kemi and heavily used for hydropower. Table terrain is illustrative.' },
  { id: 'vantaanjoki', name: 'Vantaanjoki River', icon: 'waves', type: 'river', pos: [16.6, 0.4], r: 3.25, seed: 67,
    sub: 'River site · Uusimaa',
    text: 'River of southern Finland flowing through an agricultural and urban catchment into the Gulf of Finland at Helsinki. Table terrain is illustrative.' },
  { id: 'kokkola', name: 'Kokkola Groundwater Area', icon: 'drop', type: 'groundwater', pos: [-16.6, 0.4], r: 3.25, seed: 79,
    sub: 'Groundwater area · Central Ostrobothnia',
    text: 'Coastal groundwater area with esker formations near the Gulf of Bothnia. Table terrain is illustrative.' },
  { id: 'archipelago', name: 'Archipelago Sea', icon: 'waves', type: 'archipelago', pos: [6.9, 7.9], r: 3.38, seed: 97,
    sub: 'Coastal sea · Southwest Finland',
    text: 'Island-rich sea area between the Gulf of Bothnia and the Gulf of Finland. Table terrain is illustrative.' },
  { id: 'osp', name: 'Oulu Region', code: 'OR', icon: 'grid', type: 'planning', pos: [-6.9, 7.9], r: 3.38, seed: 113,
    sub: 'Regional site · Northern Ostrobothnia',
    text: 'Region around the city of Oulu and the Oulujoki river system on the Gulf of Bothnia. Table terrain is illustrative.' },
];
const SITE = Object.fromEntries(SITES.map(s => [s.id, s]));
const HERO = SITE.oulanka;

/* =====================================================================
   Sensor stations — DIWA critical-zone sensor template, public sensors only
   Filled from oulanka/sensors.json (built by tools/build_sensors.py). Sensors marked private or
   confidential are never written to that file, so they never appear in the hub.
   ===================================================================== */
const GLOBES = [];
const SENSOR_CATS = {
  soil: { label: 'Soil', color: 0x34d399, css: '#34d399' },
  surface: { label: 'Surface water', color: 0x38bdf8, css: '#38bdf8' },
  groundwater: { label: 'Groundwater', color: 0xa78bfa, css: '#a78bfa' },
  atmosphere: { label: 'Atmosphere and weather', color: 0xfacc15, css: '#facc15' },
  vegetation: { label: 'Vegetation', color: 0x86efac, css: '#86efac' },
  remote: { label: 'Cameras and remote sensing', color: 0xf1f5f9, css: '#f1f5f9' },
  other: { label: 'Other', color: 0x94a3b8, css: '#94a3b8' },
};
const sensorFilter = new Set(Object.keys(SENSOR_CATS));
let FEN = null;                           // Petra's 2024 drone surveys of Puukkosuo (oulanka/fen-surveys.json)
const FEN_BY_SEASON = { winter: 'mar', spring: 'may', summer: 'jul', autumn: 'sep' };

/* =====================================================================
   Small utilities
   ===================================================================== */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeNoise(seed) {
  const r = mulberry32(seed), p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => { const g = h & 7, u = g < 4 ? x : y, v = g < 4 ? y : x; return ((g & 1) ? -u : u) + ((g & 2) ? -v : v); };
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  function n2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v) * 0.7;
  }
  function fbm(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); f *= 2.03; a *= .5; } return s; }
  return { n2, fbm };
}
function distToPath(x, z, pts) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    const ex = ax + dx * t - x, ez = az + dz * t - z, d = ex * ex + ez * ez;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
function pathFn(f, a = -1.15, b = 1.15, n = 80) { const out = []; for (let i = 0; i <= n; i++) { const x = lerp(a, b, i / n); out.push([x, f(x)]); } return out; }
function rotatePath(pts, ang) { const c = Math.cos(ang), s = Math.sin(ang); return pts.map(([x, z]) => [x * c - z * s, x * s + z * c]); }

const tweens = new Set();
function tween(dur, onUpdate, ease = easeInOut, onDone) {
  const t = { start: performance.now(), dur, onUpdate, ease, onDone };
  tweens.add(t); return t;
}
function updateTweens(now) {
  for (const t of [...tweens]) {
    const k = clamp((now - t.start) / t.dur, 0, 1);
    t.onUpdate(t.ease(k), k);
    if (k >= 1) { tweens.delete(t); t.onDone && t.onDone(); }
  }
}
let toastTimer;
function toast(msg, ms = 3200) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
async function progress(p, label) { $('#ldBar').style.width = (p * 100) + '%'; $('#ldStep').textContent = label; await nextFrame(); await nextFrame(); }

/* =====================================================================
   Example time series (illustrative, not measured)
   ===================================================================== */
const YEAR = 2025, DAYS = 365;
// REAL: set when FMI/Syke open data replaces the example year (index stays = day of year; each day gets its real year)
const REAL = { on: false, weather: false, hydro: false, endDoy: 364, endYear: YEAR };
const yearOfIdx = i => REAL.on ? (i <= REAL.endDoy ? REAL.endYear : REAL.endYear - 1) : YEAR;
const dateOf = i => new Date(Date.UTC(yearOfIdx(i), 0, 1 + i));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = i => { const d = dateOf(i); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
const seasonOfDay = i => { const m = dateOf(i).getUTCMonth(); return (m <= 2 || m === 11) ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn'; };

function genData() {
  const r = mulberry32(2025);
  const gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const airT = [], precip = [], snow = [], runoff = [];
  let ar = 0, sd = 38;
  for (let i = 0; i < DAYS; i++) {
    ar = .78 * ar + gauss() * 1.5;
    const T = 0.6 - 14.6 * Math.cos(2 * Math.PI * (i - 18) / 365) + ar * 1.6;
    const wet = .42 + .12 * Math.sin(2 * Math.PI * (i - 120) / 365);
    const P = r() < wet ? -Math.log(1 - r()) * (2.0 + 2.0 * Math.max(0, Math.sin(2 * Math.PI * (i - 110) / 365))) : 0;
    let m = 0;
    if (T < 0.4) sd += P * 0.8; else { m = Math.min(sd, 0.5 * T + 0.15 * P); sd -= m; }
    sd *= 0.997;
    airT.push(T); precip.push(P); snow.push(sd);
    runoff.push(m * 1.35 + (T >= 0.4 ? P * 0.55 : 0));
  }
  const smoothArr = (a, w) => a.map((_, i) => { let s = 0, n = 0; for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j < a.length) { s += a[j]; n++; } } return s / n; });
  let S = 0; const raw = [];
  for (let i = 0; i < DAYS; i++) { S += runoff[i]; const out = S / 13; S -= out; raw.push(out); }
  const base = i => i < 125 ? 12 + 5 * (1 - i / 125) : 13 + 3 * smooth(240, 300, i);
  const peak = Math.max(...raw);
  const Q = raw.map((v, i) => base(i) + v / peak * 205);
  const WL = Q.map(q => 0.48 + 0.42 * Math.log(q / 11));
  const sm7 = smoothArr(airT, 4);
  const WT = sm7.map((t, i) => { const ice = (i < 118 || i > 318) ? 1 : 0; return ice ? 0.1 : clamp(t * .85 + 1.6, 0.1, 19.5); });
  const dQ = Q.map((q, i) => i ? Math.max(0, q - Q[i - 1]) : 0);
  const TURB = smoothArr(dQ, 2).map((d, i) => 1.8 + d * 0.55 + Q[i] * 0.025);
  const weekly = Array.from({ length: 52 }, (_, w) => precip.slice(w * 7, w * 7 + 7).reduce((a, b) => a + b, 0));
  // towers
  const rh = sm7.map((t, i) => clamp(84 - 10 * Math.sin(2 * Math.PI * (i - 80) / 365) + gauss() * 4, 45, 100));
  const sw = airT.map((_, i) => { const c = Math.cos(2 * Math.PI * (i - 172) / 365) * .5 + .5; return Math.max(0, 6 + 235 * Math.pow(c, 1.7) * (.45 + .55 * r())); });
  const swS = smoothArr(sw, 1);
  const co2 = airT.map((_, i) => 424 + 6 * Math.cos(2 * Math.PI * (i - 100) / 365) + gauss() * 1.4);
  let pa = 0; const pres = airT.map(() => { pa = .85 * pa + gauss() * 3.2; return 1004 + pa; });
  // soil & snow block
  function soilSeries(depthCm, snowFactor) {
    const rate = depthCm <= 10 ? .22 : depthCm <= 40 ? .07 : .028;
    let s = depthCm <= 10 ? -0.4 : depthCm <= 40 ? 0.6 : 1.8; const out = [];
    for (let i = 0; i < DAYS; i++) {
      const sdE = snow[i] * snowFactor, T = sm7[i];
      let target = T > 0 && sdE < 5 ? T * (depthCm <= 10 ? .75 : depthCm <= 40 ? .55 : .35) + 1 : sdE > 30 ? -0.3 + 0.015 * T : sdE > 10 ? T * .12 : T * .45;
      if (depthCm >= 100) target = target * .5 + 1.4;
      s += (target - s) * rate; out.push(s);
    }
    return out;
  }
  const soil10 = { CTL: soilSeries(10, 1), 'S−': soilSeries(10, .45), 'S+': soilSeries(10, 1.6) };
  const profile = { '−10 cm': soil10.CTL, '−40 cm': soilSeries(40, 1), '−100 cm': soilSeries(100, 1) };
  const snowpack = airT.map((t, i) => snow[i] > 12 ? Math.min(0, lerp(-0.5, sm7[i], 0.25)) : t);
  const vwc = airT.map((t, i) => { const frozen = soil10.CTL[i] < 0 ? .1 : 0; return clamp(.2 - frozen + runoff[i] * .004 + (i > 170 && i < 240 ? -.05 : 0) + gauss() * .004, .06, .42); });
  return { airT, precip, weekly, snow, Q, WL, WT, TURB, rh, sw: swS, co2, pres, soil10, profile, snowpack, vwc, smoothArr };
}
const D = genData();
// cloud cover (0–1), illustrative: from rain, humidity and slow weather systems
D.cloud = (() => { const r = mulberry32(31); let ar = 0; return D.precip.map((p, i) => { ar = .85 * ar + (r() - .5) * .5; const wet = D.smoothArr(D.precip, 2)[i]; return clamp(.32 + wet * .22 + ar * .6 + (D.rh[i] - 80) * .012, 0, 1); }); })();
let PEAK_DAY = D.Q.indexOf(Math.max(...D.Q.slice(60, 200)));
D.wlLo = 0.6; D.wlHi = 2.2;

/* =====================================================================
   Renderer / scene / camera
   ===================================================================== */
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // static scene: shadows are re-rendered only when the sun moves
renderer.xr.enabled = true;
stage.appendChild(renderer.domElement);

const css2d = new CSS2DRenderer(); css2d.setSize(innerWidth, innerHeight); $('#css2d').appendChild(css2d.domElement);
const css3d = new CSS3DRenderer(); css3d.setSize(innerWidth, innerHeight); $('#css3d').appendChild(css3d.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd9e6ef, 140, 560);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 3000);
camera.position.set(0, 16, 62);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.075;
controls.maxPolarAngle = Math.PI * 0.47; controls.minDistance = 0.8; controls.maxDistance = 46;
controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.8; controls.panSpeed = 0.7;
controls.screenSpacePanning = false;
controls.target.set(0, 1.2, -4);
controls.enabled = false;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const HALL = { rx: 42, rz: 34, h: 13.5 };
const HOME_POS = new THREE.Vector3(0, 8.2, 31), HOME_TGT = new THREE.Vector3(0, 1.2, -8);

/* ---------- Procedural textures ---------- */
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8; if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}
function woodTex(vertical) {
  return canvasTex(512, 512, (g, w, h) => {
    const r = mulberry32(vertical ? 5 : 9);
    g.fillStyle = '#c79358'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const p = r() * (vertical ? w : h), th = 1 + r() * 5, a = .05 + r() * .12;
      g.fillStyle = r() < .5 ? `rgba(120,70,30,${a})` : `rgba(255,220,170,${a})`;
      if (vertical) g.fillRect(p, 0, th, h); else g.fillRect(0, p, w, th);
    }
    const grd = vertical ? g.createLinearGradient(0, 0, 0, h) : g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, 'rgba(255,230,190,.10)'); grd.addColorStop(.5, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(110,60,20,.08)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, { repeat: vertical ? [3, 1] : [8, 1] });
}
const marbleTex = canvasTex(1024, 1024, (g, w, h) => {
  const r = mulberry32(3);
  g.fillStyle = '#ebe6dd'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < .5 ? '120,110,100' : '255,255,255'},${r() * .08})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  g.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(140,130,120,${.05 + r() * .07})`; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 260; y += (r() - .5) * 260; g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = 'rgba(120,110,100,.16)'; g.lineWidth = 2;
  for (let k = 0; k <= 4; k++) { const p = k * w / 4; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); }
}, { repeat: [7, 7] });
const glowTex = canvasTex(128, 128, (g, w) => {
  const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.35, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, w);
});
const WOOD_H = woodTex(false), WOOD_V = woodTex(true);
const woodMat = new THREE.MeshStandardMaterial({ map: WOOD_H, color: 0xffffff, roughness: .55, metalness: 0, envMapIntensity: .8 });
const woodMatV = new THREE.MeshStandardMaterial({ map: WOOD_V, color: 0xffffff, roughness: .45, metalness: 0, envMapIntensity: .9 });

/* ---------- Sky + sun ---------- */
const sky = new Sky(); sky.scale.setScalar(4000); scene.add(sky);
sky.material.uniforms.turbidity.value = 3.2; sky.material.uniforms.rayleigh.value = 1.3;
sky.material.uniforms.mieCoefficient.value = 0.004; sky.material.uniforms.mieDirectionalG.value = 0.86;
const sun = new THREE.DirectionalLight(0xfff0d6, 2.4);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 260 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xe3f0ff, 0xb38a5c, 0.75); scene.add(hemi);
const sunDir = new THREE.Vector3();
function setSun(elevDeg, azDeg = 222) {
  sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevDeg), THREE.MathUtils.degToRad(azDeg));
  sky.material.uniforms.sunPosition.value.copy(sunDir);
  sun.position.copy(sunDir).multiplyScalar(120); sun.target.position.set(0, 0, 0);
  renderer.shadowMap.needsUpdate = true;
}
setSun(28);

/* =====================================================================
   Hall
   ===================================================================== */
const hall = new THREE.Group(); scene.add(hall);
const pickables = [];
let floorOverlay, groundMat, forestMesh, reflector;
const HALLREF = { ceil: null, fills: [] };
const nightGlow = { value: 0 };
function glowPatch(m) { m.onBeforeCompile = sh => { sh.uniforms.uNightGlow = nightGlow; sh.fragmentShader = 'uniform float uNightGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * uNightGlow;'); }; m.customProgramCacheKey = () => 'nightglow'; return m; }

function ellipsePts(sx, sz, y, n = 160, mod = null) {
  const pts = [];
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, m = mod ? mod(t) : 1; pts.push(new THREE.Vector3(Math.cos(t) * sx * m, y, Math.sin(t) * sz * m)); }
  return pts;
}
function buildHall() {
  const { rx, rz, h } = HALL;
  // reflective floor + marble overlay
  const fg = new THREE.CircleGeometry(1, 160); fg.scale(rx + 1.2, rz + 1.2, 1);
  reflector = new Reflector(fg, { clipBias: 0.003, textureWidth: Math.min(1400, innerWidth) * renderer.getPixelRatio() * .6, textureHeight: Math.min(900, innerHeight) * renderer.getPixelRatio() * .6, color: 0x3c3c3c });
  reflector.rotation.x = -Math.PI / 2; reflector.position.y = 0.0; hall.add(reflector);
  floorOverlay = new THREE.Mesh(fg.clone(), new THREE.MeshStandardMaterial({ map: marbleTex, transparent: true, opacity: .86, roughness: .38, metalness: 0, envMapIntensity: .6 }));
  floorOverlay.rotation.x = -Math.PI / 2; floorOverlay.position.y = 0.012; floorOverlay.receiveShadow = true; hall.add(floorOverlay);
  // plinth
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .5, 160), new THREE.MeshStandardMaterial({ color: 0xd9d3c8, roughness: .8 }));
  pl.scale.set(rx + 1.8, 1, rz + 1.8); pl.position.y = -0.26; pl.receiveShadow = true; hall.add(pl);
  // glass wall
  const gw = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, h, 160, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xe6f3ff, transparent: true, opacity: .09, roughness: .04, metalness: 0, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2 }));
  gw.scale.set(rx, 1, rz); gw.position.y = h / 2; gw.renderOrder = 2; hall.add(gw);
  // mullions
  const N = 84, mg = new THREE.BoxGeometry(.13, h, .24), mm = new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: .5, metalness: .4 });
  const mullions = new THREE.InstancedMesh(mg, mm, N); const o = new THREE.Object3D();
  for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; o.position.set(Math.cos(t) * rx, h / 2, Math.sin(t) * rz); o.lookAt(0, h / 2, 0); o.updateMatrix(); mullions.setMatrixAt(i, o.matrix); }
  mullions.castShadow = true; hall.add(mullions);
  for (const y of [.12, 3.6, h - .1]) {
    const c = new THREE.CatmullRomCurve3(ellipsePts(rx, rz, y, 120), true);
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 240, y > 1 ? .07 : .14, 6, true), mm); m.castShadow = y > 1; hall.add(m);
  }
  // ceiling with raised oculus
  const ceilMat = HALLREF.ceil = new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: .92, side: THREE.DoubleSide, emissive: 0xfff6ea, emissiveIntensity: .12 });
  const cg = new THREE.RingGeometry(.44, 1, 160, 1); cg.scale(rx + .3, rz + .3, 1);
  const ceil = new THREE.Mesh(cg, ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; hall.add(ceil);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.6, 160, 1, true), ceilMat); cyl.scale.set(rx * .44, 1, rz * .44); cyl.position.y = h + .8; hall.add(cyl);
  const top = new THREE.Mesh(new THREE.CircleGeometry(1, 120), new THREE.MeshBasicMaterial({ color: 0xfff5e6 }));
  top.geometry.scale(rx * .44, rz * .44, 1); top.rotation.x = Math.PI / 2; top.position.y = h + 1.6; hall.add(top); HALLREF.top = top;
  // light lines
  const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.45, 1.2), toneMapped: false });
  const loops = [[.5, 0, .9], [.62, 1.3, .6], [.76, 2.1, .9], [.9, .7, .4]];
  for (const [s, ph, k] of loops) {
    const c = new THREE.CatmullRomCurve3(ellipsePts(rx * s, rz * s, h - .04, 140, t => 1 + .055 * Math.sin(3 * t + ph) * k + .03 * Math.sin(5 * t + ph * 2)), true);
    hall.add(new THREE.Mesh(new THREE.TubeGeometry(c, 300, .055, 6, true), lineMat));
  }
  const ringC = new THREE.CatmullRomCurve3(ellipsePts(rx * .44, rz * .44, h - .2, 120), true);
  const ring = new THREE.Mesh(new THREE.TubeGeometry(ringC, 240, .42, 10, true), woodMat); ring.castShadow = true; hall.add(ring);
  // wooden ribs (tree-like arches)
  const ribs = 12;
  for (let i = 0; i < ribs; i++) {
    const t = i / ribs * Math.PI * 2 + .13;
    if (Math.abs(Math.atan2(Math.sin(t - Math.PI / 2), Math.cos(t - Math.PI / 2))) < .32) continue;
    if (Math.abs(Math.atan2(Math.sin(t + Math.PI / 2), Math.cos(t + Math.PI / 2))) < 1.18) continue; // keep the video wall, map and news clear
    if (Math.abs(Math.atan2(Math.sin(t + .2), Math.cos(t + .2))) < .5) continue;                       // and the DIWA Knowledge panel
    const bx = Math.cos(t), bz = Math.sin(t), P = (s, y, dt = 0) => new THREE.Vector3(Math.cos(t + dt) * rx * s, y, Math.sin(t + dt) * rz * s);
    const main = new THREE.CatmullRomCurve3([P(.965, 0), P(.93, 3.5), P(.82, 8.2), P(.62, h - .5), P(.46, h - .2)]);
    const rib = new THREE.Mesh(new THREE.TubeGeometry(main, 70, .5, 14), woodMat); rib.castShadow = true; hall.add(rib);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.62, .78, .5, 16), woodMat); foot.position.set(bx * rx * .965, .25, bz * rz * .965); hall.add(foot);
    for (const side of [-1, 1]) {
      const br = new THREE.CatmullRomCurve3([P(.9, 5.4), P(.8, 9.4, side * .1), P(.66, h - .35, side * .2), P(.5, h - .2, side * .26)]);
      const b = new THREE.Mesh(new THREE.TubeGeometry(br, 50, .3, 10), woodMat); b.castShadow = true; hall.add(b);
    }
  }
  // interior fill lights
  for (const [x, z] of [[-18, -10], [18, -10], [0, 10], [0, -24]]) { const l = new THREE.PointLight(0xffe2bf, 18, 30, 1.6); l.position.set(x, h - 2.5, z); hall.add(l); HALLREF.fills.push(l); }
}

const OUT_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const OUT_FS = `
  uniform sampler2D map; uniform float uWinter, uSpring, uSummer, uExposure, uNight, uTime; varying vec2 vUv;
  float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nn(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(fract(sin(i) * 43758.5), fract(sin(i + 1.) * 43758.5), f); }
  void main(){
    vec3 c = texture2D(map, vUv).rgb; vec3 c0 = c;
    float l = dot(c, vec3(.299, .587, .114));
    vec3 g = c; g.r = mix(c.r, c.g * .78, .45); g.b = c.b * .95;           // summer: turn autumn yellows green
    c = mix(c, g, uSummer);
    c = mix(c, mix(vec3(l), c, .7) * vec3(.98, 1., .99), uSpring);           // spring: softer, less colour
    vec3 snow = vec3(.93, .95, .98) * (.55 + .5 * l);                        // winter: snow-covered look
    float s = smoothstep(.62, .2, vUv.y) * .78 + .22;                        // more snow on the ground half
    c = mix(c, mix(snow, vec3(l * 1.05), .25), uWinter * s);
    if (uNight > .001) {
      float lum = dot(c0, vec3(.299, .587, .114));
      float sky = smoothstep(.6, .82, lum) * smoothstep(.5, .62, vUv.y);        // bright pixels in the upper half = open sky
      vec3 night = c * vec3(.32, .42, .74) * .2 + vec3(.003, .006, .016);
      night = mix(night, mix(vec3(.006, .014, .04), vec3(.015, .03, .07), smoothstep(1., .55, vUv.y)), sky);
      // northern lights high in the sky, behind the treetops
      float a = vUv.x * 6.28318 * 3., t = uTime * .05, cur = 0.;
      for (int k = 0; k < 3; k++) { float fk = float(k);
        float base = .66 + .05 * nn(a * .9 + t * (1. + fk) + fk * 7.) + .02 * sin(a * 2.3 + uTime * .15 + fk);
        float rays = .55 + .45 * nn(a * 22. + uTime * .6 + fk * 13.);
        cur += smoothstep(base - .01, base + .02, vUv.y) * smoothstep(base + .2, base + .03, vUv.y) * rays * (.6 - fk * .15) * (.5 + .5 * nn(a * 1.7 - t * 2. + fk * 3.)); }
      vec3 ac = mix(vec3(.2, 1., .45), vec3(.12, .85, .7), smoothstep(.2, .6, nn(a * .6 + t))); ac = mix(ac, vec3(.85, .3, .75), smoothstep(.8, .9, vUv.y) * .6);
      night += ac * cur * .9 * sky;
      // twinkling stars in the open sky
      vec2 g = floor(vUv * vec2(2400., 1200.)); float st = step(.9975, hh(g));
      night += vec3(.85, .9, 1.) * st * (.5 + .5 * sin(uTime * (1.5 + hh(g + 3.) * 3.) + hh(g + 7.) * 6.28)) * sky * .9;
      c = mix(c, night, uNight);
    }
    gl_FragColor = vec4(c * uExposure, 1.);
    #include <colorspace_fragment>
  }`;
let outsideMat = null;
function buildOutside() {
  // ground ring that fades into the photo
  const gTex = canvasTex(512, 512, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, w * .3, w / 2, w / 2, w / 2); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); }, { linear: true });
  groundMat = new THREE.MeshStandardMaterial({ color: 0x5d6b3f, roughness: 1, alphaMap: gTex, transparent: true, depthWrite: false });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(78, 64), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -.5; ground.receiveShadow = true; ground.renderOrder = -1; scene.add(ground);
  if (!CONFIG.OUTSIDE_PANORAMA) return;
  new THREE.TextureLoader().load(CONFIG.OUTSIDE_PANORAMA, t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    outsideMat = new THREE.ShaderMaterial({ vertexShader: OUT_VS, fragmentShader: OUT_FS, side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { map: { value: t }, uWinter: { value: 0 }, uSpring: { value: 0 }, uSummer: { value: 0 }, uExposure: { value: 1 }, uNight: { value: state.night ? 1 : 0 }, uTime: { value: 0 } } });
    const sph = new THREE.Mesh(new THREE.SphereGeometry(700, 96, 48), outsideMat);
    sph.position.y = 30; sph.rotation.y = THREE.MathUtils.degToRad(CONFIG.OUTSIDE_YAW); sph.renderOrder = -2; scene.add(sph);
    sky.visible = false; setOutsideSeason(state.season, true); applyLighting(true);
  }, undefined, () => {});
}
function setOutsideSeason(season, instant) {
  if (!outsideMat) return; const u = outsideMat.uniforms, from = [u.uWinter.value, u.uSpring.value, u.uSummer.value];
  const to = [season === 'winter' ? 1 : 0, season === 'spring' ? 1 : 0, season === 'summer' ? 1 : 0];
  tween(instant ? 1 : 1400, e => { u.uWinter.value = lerp(from[0], to[0], e); u.uSpring.value = lerp(from[1], to[1], e); u.uSummer.value = lerp(from[2], to[2], e); });
}
/* ---------- tree kit: spruce, pine and birch built from simple shapes ---------- */
let _kit;
function treeKit() {
  if (_kit) return _kit;
  const cone = (r, h, y) => { const g = new THREE.ConeGeometry(r, h, 7, 1); g.translate(0, y + h / 2, 0); return g; };
  const trunk = (r0, r1, h) => { const g = new THREE.CylinderGeometry(r0, r1, h, 6); g.translate(0, h / 2, 0); return g; };
  const jitter = (g, a, seed) => { const r = mulberry32(seed), p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > .02) { p.setX(i, p.getX(i) * (1 + (r() - .5) * a)); p.setZ(i, p.getZ(i) * (1 + (r() - .5) * a)); } } g.computeVertexNormals(); return g; };
  // unit height 1.0
  const spruce = { crown: mergeGeometries([cone(.2, .38, .14), cone(.16, .34, .34), cone(.12, .3, .52), cone(.075, .26, .7)].map(g => g.toNonIndexed())), trunk: trunk(.012, .02, .3) };
  jitter(spruce.crown, .25, 3);
  const pc = [new THREE.IcosahedronGeometry(.13, 1), new THREE.IcosahedronGeometry(.1, 1), new THREE.IcosahedronGeometry(.08, 1)];
  pc[0].scale(1, .5, 1); pc[0].translate(0, .82, 0); pc[1].scale(1, .55, 1); pc[1].translate(.06, .9, .03); pc[2].scale(1, .6, 1); pc[2].translate(-.05, .76, -.04);
  const pine = { crown: mergeGeometries(pc.map(g => g.toNonIndexed())), trunk: trunk(.012, .02, .8) };
  jitter(pine.crown, .3, 5);
  const bc = new THREE.IcosahedronGeometry(.16, 1); bc.scale(.85, 1.35, .85); bc.translate(0, .6, 0);
  const birch = { crown: jitter(bc.toNonIndexed(), .35, 7), trunk: trunk(.009, .014, .55) };
  const crownMat = new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3f2c, roughness: .9 });
  const birchTrunkMat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: .7 });
  return _kit = { spruce, pine, birch, crownMat, trunkMat, birchTrunkMat };
}

/* =====================================================================
   Tables with miniature terrain
   ===================================================================== */
const PAL = {
  forest: { summer: 0x4b7833, spring: 0x6b7a3c, autumn: 0x86763a, winter: 0xf0f4f7 },
  mire: { summer: 0x9a9550, spring: 0x7a6b46, autumn: 0xb36d3a, winter: 0xf5f7fa },
  open: { summer: 0x9b9a89, spring: 0x8d8977, autumn: 0x9a876a, winter: 0xe8edf2 },
  beach: { summer: 0xc8b98f, spring: 0xb6a47c, autumn: 0xb9a37c, winter: 0xeef2f5 },
  built: { summer: 0xb4b4b0, spring: 0xb4b4b0, autumn: 0xb4b4b0, winter: 0xe6e9ec },
};
const LC = { forest: 0x2f7d32, mire: 0xb58b4c, open: 0xc9c7b8, beach: 0xc9c7b8, built: 0x8f949c };
const WATER = {
  summer: { color: 0x3b8fc6, opacity: .82, rough: .06 }, spring: { color: 0x5c8ea4, opacity: .86, rough: .12 },
  autumn: { color: 0x2b6c98, opacity: .84, rough: .08 }, winter: { color: 0xdfeaf3, opacity: .96, rough: .5 },
};
const CONIFER = { summer: 0x24502a, spring: 0x2c5a2e, autumn: 0x234a26, winter: 0xcfdcd6 };
const PINE = { summer: 0x3d6b33, spring: 0x46733a, autumn: 0x3b6331, winter: 0xd6e0da };
const DECID = { summer: 0x6a9a3a, spring: 0xa6cf6c, autumn: [0xe0a326, 0xd0662a, 0xc9b23a], winter: 0xa39a90 };
const tables = [];
const state = { season: 'summer', landcover: false, layers: { clouds: false, precip: false, sensors: true, rivers: true, catchment: true, landcover: false, pano: true, particles: true, agents: true, places: true } };

function siteShape(site) {
  const N = makeNoise(site.seed), rnd = mulberry32(site.seed * 3 + 1);
  const wl = 0.085, paths = [], zones = [];
  let H;
  const carve = (h, x, z) => {
    for (const p of paths) {
      const d = distToPath(x, z, p.pts);
      h = lerp(h * .55 + .05, h, smooth(p.w, p.w * 6, d));
      h = lerp(wl - .028, h, smooth(p.w * .7, p.w * 2.2, d));
    }
    return h;
  };
  if (site.type === 'river') {
    const ph = rnd() * 6, amp = site.hero ? .25 : .18 + rnd() * .1, ang = rnd() * Math.PI;
    let main = pathFn(x => amp * Math.sin(1.6 * x + ph * .1 + .5) + .06 * Math.sin(4.5 * x + ph));
    if (!site.hero) main = rotatePath(main, ang);
    paths.push({ pts: main, w: site.hero ? .032 : .03, main: true });
    let lakes = [];
    if (site.hero) {
      // Layout traced from the river course around Oulanka Research Station (table centre = station, north = away from the hall entrance)
      const spline = (ctrl, n = 120) => new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z))).getSpacedPoints(n).map(v => [v.x, v.z]);
      paths.length = 0;
      paths.push({ pts: spline([[-1.12, -.42], [-.8, -.3], [-.55, -.02], [-.25, .14], [.02, .2], [.16, .34], [.3, .5], [.52, .52], [.72, .36], [.84, .08], [.9, -.25], [1.0, -.55], [1.1, -.7]]), w: .034, main: true });
      paths.push({ pts: spline([[-.6, -.62], [-.62, -.42], [-.58, -.2], [-.55, -.02]], 40), w: .014 });       // stream from the north-west lake
      paths.push({ pts: spline([[.92, -.25], [.75, -.55], [.62, -.9], [.6, -1.1]], 40), w: .012 });          // northern tributary
      lakes = [{ x: -.58, z: -.72, r: .17, sx: .8, sz: 1.25 }, { x: -.26, z: -.07, r: .06, sx: 1, sz: 1.3 }];
      zones.push({ type: 'mire', x: .58, z: -.48, r: .2 });
    }
    const lakeCut = (h, x, z) => { for (const L of lakes) { const d = Math.hypot((x - L.x) / L.sx, (z - L.z) / L.sz); h = lerp(wl - .03, h, smooth(L.r * .75, L.r * 1.25, d)); } return h; };
    H = (x, z) => lakeCut(carve(.17 + N.fbm(x * 1.7 + 5, z * 1.7, 5) * .34 + .05 * Math.max(0, N.fbm(x * 4, z * 4, 3)), x, z), x, z);
  } else if (site.type === 'fell') {
    paths.push({ pts: rotatePath(pathFn(x => .15 * Math.sin(2 * x) - .55, -1.1, .2, 40), .4), w: .018 });
    H = (x, z) => carve(.13 + N.fbm(x * 1.8, z * 1.8, 5) * .22 + .5 * Math.exp(-((x + .2) ** 2 + (z + .05) ** 2) / .07) + .32 * Math.exp(-((x - .4) ** 2 + (z - .32) ** 2) / .05) - .16 * Math.exp(-((x - .45) ** 2 + (z + .5) ** 2) / .02), x, z);
  } else if (site.type === 'forest') {
    paths.push({ pts: rotatePath(pathFn(x => .2 * Math.sin(2.2 * x + 1)), 1.1), w: .026, main: true });
    zones.push({ type: 'mire', x: -.35, z: .45, r: .3 }, { type: 'mire', x: .4, z: -.4, r: .22 });
    H = (x, z) => { let h = .14 + N.fbm(x * 1.6, z * 1.6, 5) * .17; for (const zn of zones) h = lerp(.105, h, smooth(zn.r * .4, zn.r, Math.hypot(x - zn.x, z - zn.z))); return carve(h, x, z); };
  } else if (site.type === 'groundwater') {
    const esk = [[-.95, -.55], [-.3, -.2], [.2, .1], [.85, .5]];
    zones.push({ type: 'mire', x: .3, z: -.5, r: .25 });
    H = (x, z) => { let h = .12 + N.fbm(x * 1.6, z * 1.6, 4) * .09 + .17 * Math.exp(-((distToPath(x, z, esk) / .1) ** 2)); h -= smooth(.35, .75, z + .12 * N.n2(x * 3, 1)) * .13; h -= .08 * Math.exp(-((x + .4) ** 2 + (z + .55) ** 2) / .012); return h; };
  } else if (site.type === 'archipelago') {
    H = (x, z) => .03 + N.fbm(x * 2.8 + 3, z * 2.8, 5) * .42 + smooth(.25, 1, -x - .2 * z) * .12;
  } else {
    paths.push({ pts: rotatePath(pathFn(x => .16 * Math.sin(2 * x + .4)), -.5), w: .028, main: true });
    zones.push({ type: 'built', x: -.4, z: -.25, r: .28 }, { type: 'built', x: .35, z: .35, r: .24 }, { type: 'built', x: .45, z: -.45, r: .16 });
    H = (x, z) => carve(.15 + N.fbm(x * 1.4, z * 1.4, 4) * .1, x, z);
  }
  const height = (x, z) => { const r = Math.hypot(x, z); return lerp(.055, H(x, z), 1 - smooth(.86, 1, r)); };
  const classify = (x, z, h, slope) => {
    if (h < wl + .012) return 'beach';
    for (const zn of zones) if (Math.hypot(x - zn.x, z - zn.z) < zn.r * (.8 + .3 * N.n2(x * 6, z * 6))) return zn.type;
    if (h > (site.type === 'fell' ? .34 : .44) || slope > 1.25) return 'open';
    if (h < wl + .07 && N.fbm(x * 3 + 11, z * 3 - 7, 3) > .06) return 'mire';
    return 'forest';
  };
  return { N, rnd, wl, paths, zones, height, classify };
}

function buildTable(site) {
  const [px, pz] = site.pos, R = site.r, Rt = R * .925, TOP = 1.1, g = new THREE.Group();
  g.position.set(px, 0, pz); scene.add(g);
  const T = { site, group: g, R, Rt, TOP, hover: 0 };
  // pedestal
  const prof = [[0, 0], [R * .74, 0], [R * .76, .05], [R * .82, .35], [R * .92, .72], [R * 1.03, 1.0], [R * 1.05, 1.06], [R * 1.02, TOP + .02], [Rt, TOP + .02], [Rt, TOP - .1], [0, TOP - .1]].map(([x, y]) => new THREE.Vector2(x, y));
  const ped = new THREE.Mesh(new THREE.LatheGeometry(prof, 120), woodMatV); ped.castShadow = true; ped.receiveShadow = true; g.add(ped);
  ped.userData.site = site.id; pickables.push(ped);
  // floor ring + glow
  const fr = new THREE.Mesh(new THREE.TorusGeometry(R * .8, .025, 8, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.5, 1.35), toneMapped: false }));
  fr.rotation.x = Math.PI / 2; fr.position.y = .03; g.add(fr);
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.4, R * 2.4), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xfff1dc, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending }));
  fg.rotation.x = -Math.PI / 2; fg.position.y = .02; g.add(fg);
  // rim glow + inner wall
  const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.35, .85, 1.6), toneMapped: false, transparent: true, opacity: .95 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(Rt + .01, .028, 8, 200), rimMat); rim.rotation.x = Math.PI / 2; rim.position.y = TOP + .05; g.add(rim);
  T.rimMat = rimMat;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(Rt, Rt, .14, 160, 1, true), new THREE.MeshStandardMaterial({ color: 0x0f2740, roughness: .3, metalness: .2, side: THREE.BackSide }));
  wall.position.y = TOP + .02; g.add(wall);
  T.rim = rim; T.wall = wall; T.fr = fr; T.fg = fg;
  if (site.hero && OUL) buildRealTerrain(T);
  else {
  // terrain
  const shape = siteShape(site); T.shape = shape;
  const rings = site.hero ? 80 : 48, segs = site.hero ? 240 : 150;
  const pos = [], idx = [], meta = [];
  pos.push(0, 0, 0); meta.push({ x: 0, z: 0 });
  for (let i = 1; i <= rings; i++) for (let j = 0; j < segs; j++) { const rr = i / rings, a = j / segs * Math.PI * 2; meta.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr }); pos.push(0, 0, 0); }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + (j + 1) % segs, 1 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + (i - 1) * segs + j, b = 1 + (i - 1) * segs + (j + 1) % segs, c = 1 + i * segs + j, d = 1 + i * segs + (j + 1) % segs;
    idx.push(a, b, d, a, d, c);
  }
  const VS = site.type === 'fell' ? 1.15 : 1;
  meta.forEach((m, k) => { m.h = shape.height(m.x, m.z) * VS; pos[k * 3] = m.x * Rt; pos[k * 3 + 1] = m.h; pos[k * 3 + 2] = m.z * Rt; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  meta.forEach((m, k) => { const ny = nrm.getY(k); m.slope = Math.sqrt(Math.max(0, 1 - ny * ny)) / Math.max(.05, ny) * 3; m.cls = shape.classify(m.x, m.z, m.h, m.slope); m.v = .9 + .2 * shape.N.n2(m.x * 9 + 3, m.z * 9); });
  geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(meta.length * 3), 3));
  const terr = new THREE.Mesh(geo, glowPatch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, flatShading: false })));
  terr.position.y = TOP - .03; terr.receiveShadow = true; terr.castShadow = false; g.add(terr);
  terr.userData.site = site.id; pickables.push(terr);
  T.terr = terr; T.meta = meta; T.colorFrom = new Float32Array(meta.length * 3); T.colorTo = new Float32Array(meta.length * 3);
  T.heightAt = (x, z) => shape.height(x, z) * VS;
  T.local = (x, z, lift = 0) => new THREE.Vector3(x * Rt, TOP - .03 + T.heightAt(x, z) + lift, z * Rt);
  // water
  const wMat = glowPatch(new THREE.MeshStandardMaterial({ color: WATER.summer.color, transparent: true, opacity: .82, roughness: .06, metalness: .15, emissive: 0x06203a, emissiveIntensity: .35, envMapIntensity: 1.4 }));
  const water = new THREE.Mesh(new THREE.CircleGeometry(Rt - .005, 120), wMat); water.rotation.x = -Math.PI / 2;
  T.wlBase = TOP - .03 + shape.wl; water.position.y = T.wlBase; g.add(water); T.water = water; T.wMat = wMat;
  // trees: spruce + pine (conifers) and birch (deciduous), smaller and more natural than v0.1
  const rnd = mulberry32(site.seed * 13), nC = site.hero ? 4200 : 900, nD = site.hero ? 1000 : 240, kit = treeKit();
  const mk = (geo, mat, n) => new THREE.InstancedMesh(geo, mat, n);
  const nS = Math.round(nC * .6), nP = nC - nS;
  const spr = mk(kit.spruce.crown, glowPatch(kit.crownMat.clone()), nS), sprT = mk(kit.spruce.trunk, kit.trunkMat, nS);
  const pin = mk(kit.pine.crown, glowPatch(kit.crownMat.clone()), nP), pinT = mk(kit.pine.trunk, kit.trunkMat, nP);
  const dec = mk(kit.birch.crown, glowPatch(kit.crownMat.clone()), nD), decT = mk(kit.birch.trunk, kit.birchTrunkMat, nD);
  const o = new THREE.Object3D(), col = new THREE.Color();
  const place = (mesh, trunkMesh, n, kind) => {
    let k = 0, guard = 0; mesh.userData.var = [];
    while (k < n && guard++ < n * 40) {
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * .9, x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = T.heightAt(x, z);
      if (h < shape.wl + .02) continue;
      const cls = shape.classify(x, z, h, 0);
      if (cls === 'open' || cls === 'built' || (cls === 'mire' && rnd() > (kind === 'pine' ? .25 : .08)) || cls === 'beach') continue;
      const s = (kind === 'pine' ? .085 : kind === 'birch' ? .07 : .075) * (.65 + rnd() * .7);
      o.position.set(x * Rt, TOP - .03 + h, z * Rt); o.scale.set(s, s * (.9 + rnd() * .35), s); o.rotation.y = rnd() * 6; o.updateMatrix();
      mesh.setMatrixAt(k, o.matrix); trunkMesh.setMatrixAt(k, o.matrix); mesh.setColorAt(k, col.set(0xffffff)); mesh.userData.var.push(rnd()); k++;
    }
    mesh.count = trunkMesh.count = k;
  };
  place(spr, sprT, nS, 'spruce'); place(pin, pinT, nP, 'pine'); place(dec, decT, nD, 'birch');
  [spr, sprT, pin, pinT, dec, decT].forEach(m => { m.castShadow = true; g.add(m); });
  T.con = spr; T.pin = pin; T.dec = dec;
  // buildings / station clusters
  const blds = [];
  if (site.type === 'planning') {
    for (const zn of shape.zones) for (let k = 0; k < 26; k++) { const x = zn.x + (rnd() - .5) * zn.r * 1.5, z = zn.z + (rnd() - .5) * zn.r * 1.5; if (Math.hypot(x, z) > .85 || T.heightAt(x, z) < shape.wl + .02) continue; blds.push([Math.round(x * 18) / 18, Math.round(z * 18) / 18, .02 + rnd() * .09]); }
  } else if (site.type === 'fell' || site.type === 'forest' || site.hero) {
    const [cx, cz] = site.hero ? [.07, .03] : site.type === 'fell' ? [.05, .5] : [.15, .35];
    for (let k = 0; k < 6; k++) blds.push([cx + (rnd() - .5) * .14, cz + (rnd() - .5) * .14, .025 + rnd() * .02]);
  }
  if (blds.length) {
    const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: site.type === 'planning' ? 0xf4f4f2 : 0xa8452d, roughness: .7 }), blds.length);
    blds.forEach(([x, z, hh], k) => { o.position.copy(T.local(x, z, hh / 2)); o.scale.set(.07, hh, .05 + rnd() * .04); o.rotation.y = site.type === 'planning' ? 0 : rnd(); o.updateMatrix(); bm.setMatrixAt(k, o.matrix); });
    bm.castShadow = true; g.add(bm);
  }
  }
  // label plate on the rim, facing the entrance
  const toHome = new THREE.Vector2(-px, 24 - pz).normalize();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .26), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(800, 160, (c, w, h) => {
    drawGlassPill(c, 3, 3, w - 6, h - 6, (h - 6) / 2);
    { const g2 = c.createRadialGradient(68, h / 2 - 18, 2, 80, h / 2, 46); g2.addColorStop(0, DS.iconA); g2.addColorStop(1, DS.iconB); c.fillStyle = g2; c.beginPath(); c.arc(80, h / 2, 46, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = `700 36px ${DS.font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(siteCode(site), 80, h / 2 + 2); }
    c.fillStyle = '#ffffff'; c.font = `620 50px ${DS.font}`; c.textBaseline = 'middle'; c.textAlign = 'left';
    let fs = 50; while (c.measureText(site.name).width > w - 170 && fs > 30) { fs -= 2; c.font = `620 ${fs}px ${DS.font}`; }
    c.fillText(site.name, 146, h / 2 + 2);
  }) }));
  const pr = R * 1.0;
  plate.position.set(toHome.x * pr, .86, toHome.y * pr); plate.lookAt(px + toHome.x * 10, .86 + 3.2, pz + toHome.y * 10);   // rim plate retired in the HUD design
  // particles around ring
  T.particles = makeRingParticles(R, TOP); g.add(T.particles);
  T.snowfall = makeSnowfall(Rt, TOP); g.add(T.snowfall);
  // floating label
  const el = document.createElement('div');
  el.innerHTML = `<div class="lbl" data-site="${site.id}"><div class="ic code">${siteCode(site)}</div><div>${site.name}${site.hero ? '<small>Supersite · interactive</small>' : ''}</div></div>`;
  // hologram name band on the table body, facing the entrance and the far side
  {
    const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 256; const c = cv.getContext('2d');
    c.font = `700 138px ${DS.font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const txt = site.name.toUpperCase(), tw = Math.min(1980, c.measureText(txt).width + 120);
    c.strokeStyle = 'rgba(120,215,255,.85)'; c.lineWidth = 3; c.beginPath(); c.moveTo(1024 - tw / 2, 40); c.lineTo(1024 + tw / 2, 40); c.moveTo(1024 - tw / 2, 216); c.lineTo(1024 + tw / 2, 216); c.stroke();
    c.shadowColor = '#3fc0ff'; c.shadowBlur = 24; c.fillStyle = '#ffffff'; c.fillText(txt, 1024, 132, 1960); c.shadowBlur = 0;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.15, 1.2, 1.3), side: THREE.FrontSide });
    const span = Math.min(3.0, (tw / 2048) * 4.8 / R + .15), h = .5, rTop = R * 1.032 + .012, rBot = R * .94 + .012;
    [0, Math.PI].forEach(off => { const th = Math.atan2(toHome.x, toHome.y) + off;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 64, 1, true, th - span / 2, span), m);
      band.position.y = .98 - h / 2 - .02; band.renderOrder = 2; g.add(band); });
  }
  T.lbl = el.firstElementChild;
  T.lbl.addEventListener('click', e => { e.stopPropagation(); focusSite(site.id); });
  T.view = () => {
    const c = new THREE.Vector3(px, 0, pz), dir = new THREE.Vector3(-px * .35, 0, 30 - pz).normalize();
    const d = site.hero ? R * 2.0 : R * 2.3;
    return { pos: c.clone().add(dir.multiplyScalar(d)).setY(TOP + R * 1.25), tgt: c.clone().setY(TOP + .25) };
  };
  tables.push(T);
  return T;
}

/* =====================================================================
   Oulanka table from real data: NLS elevation model 2 m, terrain database (and orthophoto when available)
   Table frame: x = (E − E0) / R, z = −(N − N0) / R  (north points away from the hall entrance)
   ===================================================================== */
let OUL = null;
const OUL_VE = 1.2;                       // vertical exaggeration of the terrain
const SU = { flood: .64, view: .42, jam: .56, ice: .24 };   // anchors along the river for the scenarios
let JAM_RISE = .028;
async function loadOulanka() {
  if (/[?&]proc\b/.test(location.search)) return;
  try {
    const base = 'oulanka/', ok = r => { if (!r.ok) throw new Error(r.status); return r; };
    const tl = new THREE.TextureLoader(), tex = f => tl.loadAsync(base + f).then(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; });
    const [meta, tb, trb, summer, winter, landcover] = await Promise.all([
      fetch(base + 'oulanka.json').then(ok).then(r => r.json()), fetch(base + 'terrain.bin').then(ok).then(r => r.arrayBuffer()), fetch(base + 'trees.bin').then(ok).then(r => r.arrayBuffer()),
      tex('map-summer.jpg'), tex('map-winter.jpg'), tex('map-landcover.jpg')]);
    const n = meta.grid * meta.grid, u16 = new Uint16Array(tb);
    meta.H = new Float32Array(n); meta.L = new Float32Array(n);
    for (let i = 0; i < n; i++) { meta.H[i] = meta.base + u16[i] / meta.enc; meta.L[i] = meta.base + u16[n + i] / meta.enc; }
    meta.trees = new Float32Array(trb); meta.tex = { summer, winter, landcover };
    if (meta.fen) {
      FEN = await fetch(base + 'fen-surveys.json').then(ok).then(r => r.json()).catch(() => null);
      meta.tex.fenSeason = {};
      if (FEN) await Promise.all(FEN.surveys.map(async S => { meta.tex.fenSeason[S.key] = await tex(`fen-${S.key}.webp`).catch(() => null); }));
      meta.tex.fen = meta.tex.fenSeason.jul || await tex('fen-drone.webp').catch(() => null);
    }
    const sens = await fetch(base + 'sensors.json').then(ok).then(r => r.json()).catch(() => null);
    if (sens) sens.stations.filter(S => S.inTable).forEach(S => GLOBES.push({ ...S, real: true, short: S.name.replace(/ \d{4,}$/, '') }));
    OUL = meta;
    // 360° points move to their places on the real map
    CONFIG.PANORAMAS.forEach(P => { if (meta.pano[P.id]) { P.at = meta.pano[P.id]; delete P.river; } });
    Object.assign(SU, meta.scenU || {});
  } catch (e) { console.warn('Oulanka map data not found · using the illustrative table', e); OUL = null; }
}
let _kitLow;
function treeKitLow() {
  if (_kitLow) return _kitLow; const k = treeKit(), ni = g => g.index ? g.toNonIndexed() : g;
  const cone = (r, h, y) => { const g = new THREE.ConeGeometry(r, h, 5, 1); g.translate(0, y + h / 2, 0); return ni(g); };
  const trunk = (r, h) => { const g = new THREE.CylinderGeometry(r * .7, r, h, 4, 1, true); g.translate(0, h / 2, 0); return g; };
  const spruce = { crown: mergeGeometries([cone(.19, .46, .12), cone(.145, .38, .38), cone(.09, .3, .62)]), trunk: trunk(.018, .26) };
  const a = new THREE.IcosahedronGeometry(.14, 0); a.scale(1, .55, 1); a.translate(0, .84, 0);
  const b = new THREE.IcosahedronGeometry(.1, 0); b.scale(1, .6, 1); b.translate(.05, .94, .02);
  const pine = { crown: mergeGeometries([ni(a), ni(b)]), trunk: trunk(.016, .84) };
  const c = new THREE.IcosahedronGeometry(.16, 0); c.scale(.85, 1.35, .85); c.translate(0, .6, 0);
  const birch = { crown: ni(c), trunk: trunk(.012, .56) };
  [spruce.crown, pine.crown, birch.crown].forEach(g => g.computeVertexNormals());
  return _kitLow = { spruce, pine, birch, crownMat: k.crownMat, trunkMat: k.trunkMat, birchTrunkMat: k.birchTrunkMat };
}
const OUL_STYLE = { station: [0x25282d, 0x1c1e22], red: [0x9a2d20, 0x2d2e31], centre: [0xe6e0d2, 0x6b6f74], cabin: [0x6e4c33, 0x3d4045], yellow: [0xc9b06a, 0x4f7f5a] };
const OUL_SNOW = { winter: 1, spring: .2, summer: 0, autumn: 0 };
const OUL_TINT = { spring: [.93, .95, .86], summer: [1, 1, 1], autumn: [1.12, .96, .74], winter: [1, 1, 1] };
function buildRealTerrain(T) {
  const O = OUL, { Rt, TOP } = T, g = T.group, N = O.grid, R = O.R;
  const VS = OUL_VE * Rt / R, Y0 = TOP - .03, LIFT = .05;
  T.real = true; T.vs = VS; T.wlBase = Y0; T.wlAmp = 1.6 * VS;
  const ym = m => LIFT + (m - O.zmin) * VS;
  const grid = (A, x, z) => {
    const fx = (x + 1) / 2 * (N - 1), fz = (z + 1) / 2 * (N - 1), i = clamp(Math.floor(fx), 0, N - 2), j = clamp(Math.floor(fz), 0, N - 2), u = clamp(fx - i, 0, 1), v = clamp(fz - j, 0, 1), k = j * N + i;
    return lerp(lerp(A[k], A[k + 1], u), lerp(A[k + N], A[k + N + 1], u), v);
  };
  T.ym = ym; T.metresAt = (x, z) => grid(O.H, x, z);
  T.heightAt = (x, z) => ym(grid(O.H, x, z));
  T.levelAt = (x, z) => ym(grid(O.L, x, z));
  T.surfaceAt = (x, z) => Math.max(T.heightAt(x, z), T.levelAt(x, z));
  T.local = (x, z, lift = 0) => new THREE.Vector3(x * Rt, Y0 + T.heightAt(x, z) + lift, z * Rt);
  T.surfY = (x, z) => Y0 + T.surfaceAt(x, z);
  T.shape = { wl: 0, N: makeNoise(41), zones: [], paths: [{ pts: O.centreline, w: .03, main: true }], height: T.heightAt, classify: () => 'forest' };
  // terrain: regular grid clipped to the circle, outer vertices pulled onto the rim
  const NN = N * N, pos = new Float32Array(NN * 3), wpos = new Float32Array(NN * 3), uv = new Float32Array(NN * 2), inside = new Uint8Array(NN), Hm = new Float32Array(NN), Lm = new Float32Array(NN);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i; let x = -1 + 2 * i / (N - 1), z = -1 + 2 * j / (N - 1); const r = Math.hypot(x, z);
    inside[k] = r <= 1 ? 1 : 0; if (r > 1) { x /= r; z /= r; }
    Hm[k] = grid(O.H, x, z); Lm[k] = grid(O.L, x, z);
    pos[k * 3] = wpos[k * 3] = x * Rt; pos[k * 3 + 2] = wpos[k * 3 + 2] = z * Rt;
    pos[k * 3 + 1] = ym(Hm[k]); wpos[k * 3 + 1] = ym(Lm[k]);
    uv[k * 2] = (x + 1) / 2; uv[k * 2 + 1] = (1 - z) / 2;
  }
  const idx = [], widx = [];
  for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
    const a = j * N + i, b = a + 1, c = a + N, d = c + 1;
    if (!(inside[a] | inside[b] | inside[c] | inside[d])) continue;
    idx.push(a, c, b, b, c, d);
    if (Math.max(Lm[a] - Hm[a], Lm[b] - Hm[b], Lm[c] - Hm[c], Lm[d] - Hm[d]) > -7) widx.push(a, c, b, b, c, d);   // could ever be under water
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const U = { uWinter: { value: O.tex.winter }, uLand: { value: O.tex.landcover }, uSnow: { value: 0 }, uLandK: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } };
  const mat = new THREE.MeshStandardMaterial({ map: O.tex.summer, roughness: .93, metalness: 0 });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U); sh.uniforms.uNightGlow = nightGlow;
    sh.fragmentShader = 'uniform sampler2D uWinter;\nuniform sampler2D uLand;\nuniform float uSnow;\nuniform float uLandK;\nuniform float uNightGlow;\nuniform vec3 uTint;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', 'vec3 sumC = texture2D(map, vMapUv).rgb * uTint; vec3 winC = texture2D(uWinter, vMapUv).rgb; vec3 lcC = texture2D(uLand, vMapUv).rgb;\n  diffuseColor.rgb *= mix(mix(sumC, winC, uSnow), lcC, uLandK);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * uNightGlow;');
  };
  mat.customProgramCacheKey = () => 'oulanka-terrain';
  const terr = new THREE.Mesh(geo, mat); terr.position.y = Y0; terr.receiveShadow = true; g.add(terr);
  terr.userData.site = T.site.id; pickables.push(terr); T.terr = terr; T.terrU = U;
  // cut edge of the landscape block
  const SEG = 720, sp = [], sc = [], si = [];
  for (let s = 0; s <= SEG; s++) { const a = s / SEG * Math.PI * 2, x = Math.cos(a), z = Math.sin(a); sp.push(x * Rt, Y0 + T.surfaceAt(x * .999, z * .999), z * Rt, x * Rt, TOP - .025, z * Rt); sc.push(.33, .26, .19, .1, .08, .065); }
  for (let s = 0; s < SEG; s++) { const a = s * 2; si.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
  const skg = new THREE.BufferGeometry(); skg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); skg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); skg.setIndex(si); skg.computeVertexNormals();
  T.skirt = new THREE.Mesh(skg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6, metalness: .3, side: THREE.DoubleSide })); g.add(T.skirt);
  // water: follows the real river and lake levels; raising the mesh floods the low ground
  const wgeo = new THREE.BufferGeometry(); wgeo.setAttribute('position', new THREE.BufferAttribute(wpos, 3)); wgeo.setIndex(widx); wgeo.computeVertexNormals();
  const wMat = glowPatch(new THREE.MeshStandardMaterial({ color: WATER.summer.color, transparent: true, opacity: .85, roughness: .06, metalness: .15, emissive: 0x06203a, emissiveIntensity: .35, envMapIntensity: 1.4 }));
  const water = new THREE.Mesh(wgeo, wMat); water.position.y = Y0; g.add(water); T.water = water; T.wMat = wMat;
  // white water at the rapids (Kiutaköngäs): drifting foam points, riding on the water surface
  const fpos = [], fdir = [], fs = [], fr = mulberry32(31);
  O.rapids.forEach(line => {
    const flip = T.levelAt(...line[0]) < T.levelAt(...line[line.length - 1]) ? -1 : 1;
    for (let s = 0; s < line.length - 1; s++) {
      const [ax, az] = line[s], [bx, bz] = line[s + 1], len = Math.hypot(bx - ax, bz - az) * R, n = Math.ceil(len / 1.6), dx = (bx - ax) * flip, dz = (bz - az) * flip, dl = Math.hypot(dx, dz) || 1;
      for (let q = 0; q < n; q++) for (let w = 0; w < 3; w++) {
        const t = (q + fr()) / n, x = lerp(ax, bx, t) + (fr() - .5) * 14 / R, z = lerp(az, bz, t) + (fr() - .5) * 14 / R;
        fpos.push(x * Rt, T.levelAt(x, z) + .003, z * Rt); fdir.push(dx / dl, 0, dz / dl); fs.push(fr());
      }
    }
  });
  if (fpos.length) {
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3)); fg.setAttribute('aDir', new THREE.Float32BufferAttribute(fdir, 3)); fg.setAttribute('aS', new THREE.Float32BufferAttribute(fs, 1));
    const fm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: 'attribute vec3 aDir; attribute float aS; uniform float uTime; uniform float uPR; varying float vA;\nvoid main(){ float f = fract(uTime * .35 + aS * 7.); vec3 p = position + aDir * (f - .5) * .03; vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = (5. + 5. * fract(aS * 13.)) * uPR * .55 / -mv.z; vA = (.45 + .55 * abs(sin(uTime * 2.3 + aS * 40.))) * sin(f * 3.1416); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(.96, .98, 1.), smoothstep(.5, .1, d) * vA); }' });
    const foam = new THREE.Points(fg, fm); foam.frustumCulled = false; water.add(foam); T.foamMat = fm;
  }
  // trees from the land-cover analysis: spruce, pine, birch
  const kit = treeKitLow(), tr = O.trees, n = tr.length / 4, counts = [0, 0, 0];
  for (let i = 0; i < n; i++) counts[tr[i * 4 + 3]]++;
  const mk = (geo, mat, c) => new THREE.InstancedMesh(geo, mat, Math.max(1, c));
  const M = [[mk(kit.spruce.crown, glowPatch(kit.crownMat.clone()), counts[0]), mk(kit.spruce.trunk, kit.trunkMat, counts[0])],
             [mk(kit.pine.crown, glowPatch(kit.crownMat.clone()), counts[1]), mk(kit.pine.trunk, kit.trunkMat, counts[1])],
             [mk(kit.birch.crown, glowPatch(kit.crownMat.clone()), counts[2]), mk(kit.birch.trunk, kit.birchTrunkMat, counts[2])]];
  const TS = [.06, .07, .052], o = new THREE.Object3D(), white = new THREE.Color(1, 1, 1), rnd = mulberry32(99), K = [0, 0, 0];
  M.forEach(([m]) => m.userData.var = []);
  for (let i = 0; i < n; i++) {
    const x = tr[i * 4], z = tr[i * 4 + 1], s = tr[i * 4 + 2], t = tr[i * 4 + 3], sz = TS[t] * s;
    o.position.set(x * Rt, Y0 + T.heightAt(x, z) - .002, z * Rt); o.scale.set(sz, sz * (.9 + rnd() * .3), sz); o.rotation.y = rnd() * 6; o.updateMatrix();
    const [m, mt] = M[t]; m.setMatrixAt(K[t], o.matrix); mt.setMatrixAt(K[t], o.matrix); m.setColorAt(K[t], white); m.userData.var.push(rnd()); K[t]++;
  }
  M.forEach(([m, mt], t) => { m.count = mt.count = K[t]; m.castShadow = true; g.add(m, mt); });
  T.con = M[0][0]; T.pin = M[1][0]; T.dec = M[2][0];
  // buildings from the terrain database: walls from the real footprints, gable roofs on rectangular ones
  const wallMat = {}, roofMat = {}; T.roofMats = [];
  for (const [k, [w, r]] of Object.entries(OUL_STYLE)) { wallMat[k] = glowPatch(new THREE.MeshStandardMaterial({ color: w, roughness: .85 })); roofMat[k] = new THREE.MeshStandardMaterial({ color: r, roughness: .7, side: THREE.DoubleSide }); roofMat[k].userData.base = r; T.roofMats.push(roofMat[k]); }
  const HB = VS * 1.7; let main = null;
  O.buildings.forEach(B => {
    let lo = 1e9, hi = -1e9; B.pts.forEach(([x, z]) => { const h = T.heightAt(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); });
    const wallH = (hi - lo) + B.floors * 3.3 * HB + .004;
    const eg = new THREE.ExtrudeGeometry(new THREE.Shape(B.pts.map(([x, z]) => new THREE.Vector2(x * Rt, -z * Rt))), { depth: wallH, bevelEnabled: false }); eg.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(eg, [roofMat[B.style], wallMat[B.style]]); m.position.y = Y0 + lo - .003; m.castShadow = m.receiveShadow = true; g.add(m);
    if (B.rect && B.len < 140) {
      const L2 = B.len / R * Rt / 2 * 1.06, W2 = B.wid / R * Rt / 2 * 1.1, hr = Math.min(W2 * .55, .03);
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute([-L2, 0, -W2, L2, 0, -W2, L2, 0, W2, -L2, 0, W2, -L2, hr, 0, L2, hr, 0], 3));
      rg.setIndex([0, 4, 1, 1, 4, 5, 2, 5, 3, 3, 5, 4, 0, 3, 4, 1, 5, 2]); rg.computeVertexNormals();
      const rm = new THREE.Mesh(rg, roofMat[B.style]); rm.position.set(B.c[0] * Rt, Y0 + lo - .003 + wallH, B.c[1] * Rt); rm.rotation.y = -B.ang; rm.castShadow = true; g.add(rm);
    }
    if (B.style === 'station' && (!main || B.area > main.B.area)) main = { B, top: Y0 + lo + wallH };
  });
  // visitor centre: the tall grey A-frame gable over the entrance hall (photos)
  const vc = O.buildings.find(b => b.style === 'centre');
  if (vc) {
    const L2 = 9 / R * Rt, W2 = 8 / R * Rt, H = 13 * HB, hy = Y0 + T.heightAt(...vc.c) - .003;
    const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute([-L2, 0, -W2, L2, 0, -W2, L2, 0, W2, -L2, 0, W2, -L2, H, 0, L2, H, 0], 3));
    ag.setIndex([0, 4, 1, 1, 4, 5, 2, 5, 3, 3, 5, 4, 0, 3, 4, 1, 5, 2]); ag.computeVertexNormals();
    const am = new THREE.Mesh(ag, roofMat.centre); am.position.set(vc.c[0] * Rt, hy, vc.c[1] * Rt); am.rotation.y = -vc.ang + Math.PI / 2; am.castShadow = true; g.add(am);
  }
  // telecom mast beside road 8693 (terrain database, 45 m)
  (O.masts || []).forEach(M => { const h = M.h * HB * .8, m = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0035, h, 4), new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: .6, roughness: .4 })); m.position.set(M.at[0] * Rt, Y0 + T.heightAt(...M.at) + h / 2, M.at[1] * Rt); m.castShadow = true; g.add(m); });
  if (main) { const ch = new THREE.Mesh(new THREE.BoxGeometry(.012, .05, .012), new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: .8 })); ch.position.set(main.B.c[0] * Rt, main.top + .02, main.B.c[1] * Rt); ch.castShadow = true; g.add(ch); }
  // bridges: road 8693 over the river and the footbridges at Kiutaköngäs
  O.bridges.forEach(B => {
    const road = B.kind === 'road', y = Y0 + ym(O.base + B.deck), w = Math.max(B.w / R * Rt, .014);
    const deckM = new THREE.MeshStandardMaterial({ color: road ? 0x55575c : 0x8a5a36, roughness: .8 }), railM = new THREE.MeshStandardMaterial({ color: road ? 0xc9ced3 : 0x7a4b2c, roughness: .5, metalness: road ? .5 : 0 });
    for (let s = 0; s < B.pts.length - 1; s++) {
      const [ax, az] = B.pts[s], [bx, bz] = B.pts[s + 1], dx = (bx - ax) * Rt, dz = (bz - az) * Rt, len = Math.hypot(dx, dz);
      const grp = new THREE.Group(); grp.position.set((ax + bx) / 2 * Rt, y, (az + bz) / 2 * Rt); grp.rotation.y = -Math.atan2(dz, dx);
      grp.add(new THREE.Mesh(new THREE.BoxGeometry(len + .012, .008, w), deckM));
      [-1, 1].forEach(sd => { const r = new THREE.Mesh(new THREE.BoxGeometry(len + .012, .007, .0025), railM); r.position.set(0, .0075, sd * w / 2); grp.add(r); });
      grp.traverse(q => q.castShadow = true); g.add(grp);
    }
  });
  // Puukkosuo drone orthomosaic (5 cm) laid over the fen as a sharper inset
  if (O.fen && O.tex.fen) {
    const [[x0, z0], [x1, z1]] = O.fen.bounds, NX = 64, NZ = Math.round(NX * (z1 - z0) / (x1 - x0)), fp = [], fu = [], fi = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = lerp(x0, x1, i / NX), z = lerp(z0, z1, j / NZ); fp.push(x * Rt, T.heightAt(x, z) + .0012, z * Rt); fu.push(i / NX, 1 - j / NZ); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; fi.push(a, c, b, b, c, d); }
    const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fgeo.setAttribute('uv', new THREE.Float32BufferAttribute(fu, 2)); fgeo.setIndex(fi); fgeo.computeVertexNormals();
    const fm = glowPatch(new THREE.MeshStandardMaterial({ map: O.tex.fen, transparent: true, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    const inset = new THREE.Mesh(fgeo, fm); inset.position.y = Y0; inset.receiveShadow = true; inset.renderOrder = 1; g.add(inset); T.fenMat = fm; T.fenInset = inset;
  }
  // place names (shown when the table is in focus)
  heroLayers.places = new THREE.Group(); g.add(heroLayers.places);
  O.labels.forEach(Lb => {
    const el = document.createElement('div'); el.innerHTML = `<div class="place-tag ${Lb.kind}">${Lb.t}${Lb.sub ? `<small>${Lb.sub}</small>` : ''}</div>`;
    const ob = new CSS2DObject(el), [x, z] = Lb.at; ob.position.set(x * Rt, Y0 + T.surfaceAt(x, z) + (Lb.kind === 'key' ? .2 : .09), z * Rt); ob.visible = false; heroLayers.places.add(ob);
  });
}

let fenKey = null;                // a drone survey picked by hand; null = follow the season
function realSeason(T, season, landcover, instant) {
  const U = T.terrU, from = [U.uSnow.value, U.uLandK.value, U.uTint.value.r, U.uTint.value.g, U.uTint.value.b], tint = OUL_TINT[season];
  const to = [OUL_SNOW[season], landcover ? 1 : 0, ...tint];
  const roofs = T.roofMats.map(m => [m, m.color.clone(), new THREE.Color(m.userData.base).lerp(new THREE.Color(0xf1f4f7), OUL_SNOW[season] * .9)]);
  const fs = OUL.tex.fenSeason || {}, fk = fenKey || FEN_BY_SEASON[season], ft = fs[fk];
  if (T.fenMat && ft && T.fenMat.map !== ft) { T.fenMat.map = ft; T.fenMat.needsUpdate = true; }
  T.fenKey = ft ? fk : 'jul';
  const fc = document.getElementById('fenCard'); if (fc && FEN) fc.outerHTML = fenCardHTML();
  const f0 = T.fenMat ? T.fenMat.opacity : 0, f1 = ft ? (1 - to[1]) : (1 - to[0]) * (1 - to[1]);
  const run = e => { if (T.fenMat) { T.fenMat.opacity = lerp(f0, f1, e); T.fenMat.visible = T.fenMat.opacity > .01; } U.uSnow.value = lerp(from[0], to[0], e); U.uLandK.value = lerp(from[1], to[1], e); U.uTint.value.setRGB(lerp(from[2], to[2], e), lerp(from[3], to[3], e), lerp(from[4], to[4], e)); roofs.forEach(([m, a, b]) => m.color.lerpColors(a, b, e)); };
  if (instant) run(1); else tween(900, run, easeInOut);
  treeColors(T, season, landcover);
}
// height of the water surface (scenario objects ride on it)
function waterYAt(T, x, z) { return T.real ? T.water.position.y + T.levelAt(x / T.Rt, z / T.Rt) : T.water.position.y; }
const riseOf = (T, metres) => T.real ? metres * T.vs : metres / 100;
/* ---------- particle systems ---------- */
const PARTICLE_VS = `
  attribute vec4 aP; uniform float uTime; uniform float uSize; uniform float uPR; varying float vA;
  void main(){
    float s = aP.w;
    float a = aP.x + uTime * (0.04 + 0.07 * fract(s * 7.13)) * (fract(s*3.1) > .5 ? 1. : -1.);
    float r = aP.y + 0.06 * sin(uTime * .7 + s * 12.);
    float h = aP.z + 0.12 * sin(uTime * .8 + s * 31.);
    vec4 mv = modelViewMatrix * vec4(cos(a) * r, h, sin(a) * r, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPR * (0.5 + fract(s * 3.7)) / -mv.z;
    vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.6 + s * 40.));
  }`;
const PARTICLE_FS = `
  uniform vec3 uColor; uniform float uOpacity; varying float vA;
  void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(uColor, a * a * vA * uOpacity); }`;
const particleMats = [];
function makeRingParticles(R, TOP) {
  const n = 260, a = new Float32Array(n * 4), r = mulberry32(Math.floor(R * 1000));
  for (let i = 0; i < n; i++) { a[i * 4] = r() * Math.PI * 2; a[i * 4 + 1] = R * (.92 + r() * .28); a[i * 4 + 2] = TOP - .2 + Math.pow(r(), 1.6) * 1.9; a[i * 4 + 3] = r() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('aP', new THREE.BufferAttribute(a, 4)); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.5, 0), R * 2);
  const m = new THREE.ShaderMaterial({ vertexShader: PARTICLE_VS, fragmentShader: PARTICLE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: 26 }, uPR: { value: renderer.getPixelRatio() }, uColor: { value: new THREE.Color(1.0, .86, .6) }, uOpacity: { value: .85 } } });
  particleMats.push(m);
  return new THREE.Points(g, m);
}
const SNOW_VS = `
  attribute vec4 aP; uniform float uTime; uniform float uPR; varying float vA;
  void main(){
    float s = aP.w; float H = 2.4;
    float y = mod(aP.z - uTime * (0.18 + 0.12 * fract(s * 5.3)), H);
    vec3 p = vec3(aP.x + .04 * sin(uTime * .9 + s * 7.), aP.y + y, position.z + .04 * cos(uTime * .7 + s * 3.));
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 24. * uPR * (0.6 + fract(s * 2.3)) / -mv.z;
    vA = smoothstep(0., .3, y) * smoothstep(H, H - .4, y);
  }`;
const snowMats = [];
function makeSnowfall(Rt, TOP) {
  // positions packed as (x, baseY, phase, seed); z stored in a second attribute via geometry position
  const n = 220, a = new Float32Array(n * 4), p = new Float32Array(n * 3), r = mulberry32(Math.floor(Rt * 777));
  for (let i = 0; i < n; i++) { const ang = r() * 6.283, rr = Math.sqrt(r()) * Rt * .95; a[i * 4] = Math.cos(ang) * rr; a[i * 4 + 1] = TOP; a[i * 4 + 2] = r() * 2.4; a[i * 4 + 3] = r() * 100; p[i * 3 + 2] = Math.sin(ang) * rr; }
  const g = new THREE.BufferGeometry(); g.setAttribute('aP', new THREE.BufferAttribute(a, 4)); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), Rt * 2);
  const m = new THREE.ShaderMaterial({
    vertexShader: SNOW_VS, fragmentShader: PARTICLE_FS,
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uColor: { value: new THREE.Color(1, 1, 1) }, uOpacity: { value: 0 } } });
  snowMats.push(m);
  const pts = new THREE.Points(g, m); pts.visible = false; return pts;
}
let dustMat;
function makeDust() {
  const n = 900, a = new Float32Array(n * 4), r = mulberry32(99);
  for (let i = 0; i < n; i++) { a[i * 4] = r() * 6.283; a[i * 4 + 1] = Math.sqrt(r()) * 37; a[i * 4 + 2] = .5 + r() * 10; a[i * 4 + 3] = r() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('aP', new THREE.BufferAttribute(a, 4)); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 5, 0), 40);
  dustMat = new THREE.ShaderMaterial({ vertexShader: PARTICLE_VS.replace('0.04 + 0.07', '0.003 + 0.006'), fragmentShader: PARTICLE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: 30 }, uPR: { value: renderer.getPixelRatio() }, uColor: { value: new THREE.Color(1, .9, .72) }, uOpacity: { value: .35 } } });
  const pts = new THREE.Points(g, dustMat); pts.scale.set(1.05, 1, .82); scene.add(pts); return pts;
}

/* ---------- seasons ---------- */
function terrainColors(T, season, landcover, out) {
  const c = new THREE.Color(), snowC = new THREE.Color(0xf3f6f9);
  T.meta.forEach((m, k) => {
    if (landcover) c.setHex(m.h < T.shape.wl + .004 ? 0x3a8fc4 : LC[m.cls]);
    else {
      c.setHex(PAL[m.cls][season]);
      if (m.cls === 'open' && season !== 'winter') c.lerp(new THREE.Color(0x7d7c76), clamp(m.slope * .25, 0, .5));
      if (season === 'spring' && (m.h > .3 || T.shape.N.n2(m.x * 7, m.z * 7) > .18)) c.lerp(snowC, .75);
      if (season === 'winter' && m.slope > 1.4) c.lerp(new THREE.Color(0x9aa3ab), .35);
      c.multiplyScalar(m.v);
    }
    out[k * 3] = c.r; out[k * 3 + 1] = c.g; out[k * 3 + 2] = c.b;
  });
}
function treeColors(T, season, landcover) {
  const c = new THREE.Color();
  T.con.userData.var.forEach((v, k) => { landcover ? c.setHex(0x245f27) : c.setHex(CONIFER[season]); c.multiplyScalar(.8 + v * .35); T.con.setColorAt(k, c); });
  T.pin.userData.var.forEach((v, k) => { landcover ? c.setHex(0x2c6a2c) : c.setHex(PINE[season]); c.multiplyScalar(.85 + v * .3); T.pin.setColorAt(k, c); });
  T.pin.instanceColor.needsUpdate = true;
  T.dec.userData.var.forEach((v, k) => { const p = DECID[season]; landcover ? c.setHex(0x3b8a3c) : c.setHex(Array.isArray(p) ? p[Math.floor(v * p.length)] : p); c.multiplyScalar(.85 + v * .3); T.dec.setColorAt(k, c); });
  T.con.instanceColor.needsUpdate = T.dec.instanceColor.needsUpdate = true;
}
let seasonTween, stars;
/* ---------- floating clouds over the tables, following the cloud cover of the timeline day ---------- */
const cloudSets = [];
function buildClouds() {
  const puff = new THREE.SphereGeometry(1, 14, 10), r = mulberry32(17);
  tables.forEach((T, ti) => {
    const grp = new THREE.Group(); grp.position.set(T.group.position.x, 0, T.group.position.z); scene.add(grp);
    const mat = glowPatch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, transparent: true, opacity: .92, emissive: 0xffffff, emissiveIntensity: .08 }));
    const clouds = [];
    for (let k = 0; k < 9; k++) {
      const parts = [], n = 6 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) { const g = puff.clone(), sc = .17 + r() * .17; g.scale(sc * 1.2, sc * .82, sc); g.translate((i - n / 2) * .15 + (r() - .5) * .08, (r() - .2) * .09 + (1 - Math.abs(i - n / 2) / n) * .1, (r() - .5) * .18); parts.push(g); }
      const c = new THREE.Mesh(mergeGeometries(parts), mat); c.castShadow = false;
      const a = k / 9 * Math.PI * 2 + r() * .5, d = T.R * (.3 + r() * .5);
      c.position.set(Math.cos(a) * d, T.TOP + 1.25 + r() * .6, Math.sin(a) * d); c.rotation.y = r() * 6; c.scale.setScalar(.001);
      grp.add(c); clouds.push({ mesh: c, k: k / 9 + r() * .05, s: 0, base: .8 + r() * .5, bob: r() * 6 });
    }
    cloudSets.push({ grp, mat, clouds, speed: (.02 + r() * .02) * (r() < .5 ? 1 : -1), offset: T.site.hero ? 0 : ti * 23 });
  });
}
/* ---------- precipitation: rain streaks and snowflakes falling from the clouds at a wind angle ---------- */
const PRECIP_VS = `
  attribute vec4 aSeed; attribute float aEnd;
  uniform float uTime, uSpeed, uH, uLen, uAmount, uSway, uSnow; uniform vec3 uDir; uniform float uPR;
  varying float vA;
  void main(){
    float s = fract(aSeed.w + uTime * uSpeed / uH);
    vec3 top = vec3(aSeed.x, uH, aSeed.z) - uDir * (uH / -uDir.y) * .5;        // start upwind so drops land over the table
    vec3 head = top + uDir * (s * uH / -uDir.y);
    head.x += sin(uTime * 1.3 + aSeed.w * 40.) * uSway; head.z += cos(uTime * 1.1 + aSeed.w * 31.) * uSway;
    vec3 p = head - uDir * uLen * (1. - aEnd);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSnow * uPR * (9. + 7. * fract(aSeed.w * 7.)) / -mv.z;
    float on = step(aSeed.y, uAmount);
    vA = on * smoothstep(0., .12, s) * smoothstep(1., .82, s) * (.35 + .65 * aEnd + uSnow);
  }`;
const RAIN_FS = `varying float vA; uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, vA * .85); }`;
const SNOW_FS = `varying float vA; uniform vec3 uColor; void main(){ float d = length(gl_PointCoord - .5); vec3 c = mix(uColor, vec3(.52, .6, .72), smoothstep(.18, .42, d)); gl_FragColor = vec4(c, smoothstep(.5, .3, d) * vA); }`;
const precipSets = [];
function buildPrecip() {
  const r = mulberry32(53);
  tables.forEach((T, ti) => {
    const grp = new THREE.Group(); grp.position.set(T.group.position.x, T.TOP + .02, T.group.position.z); scene.add(grp);
    const wind = r() * Math.PI * 2, H = 1.35;
    const mk = (n, snow) => {
      const seeds = new Float32Array(n * (snow ? 4 : 8)), ends = new Float32Array(n * (snow ? 1 : 2));
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * T.Rt * .9, x = Math.cos(a) * d, z = Math.sin(a) * d, amt = r(), ph = r();
        for (let e = 0; e < (snow ? 1 : 2); e++) { const k = snow ? i : i * 2 + e; seeds.set([x, amt, z, ph], k * 4); ends[k] = snow ? 1 : e; }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4)); g.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ends.length * 3), 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H / 2, 0), T.R * 2);
      const tilt = snow ? .75 : .42; // tan of the angle from vertical: rain ≈ 23°, snow ≈ 37°
      const dir = new THREE.Vector3(Math.cos(wind) * tilt, -1, Math.sin(wind) * tilt).normalize();
      const m = new THREE.ShaderMaterial({ vertexShader: PRECIP_VS, fragmentShader: snow ? SNOW_FS : RAIN_FS, transparent: true, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uSpeed: { value: snow ? .22 : 1.6 }, uH: { value: H }, uLen: { value: snow ? 0 : .14 }, uAmount: { value: 0 }, uSway: { value: snow ? .03 : 0 }, uSnow: { value: snow ? 1 : 0 },
          uDir: { value: dir }, uPR: { value: renderer.getPixelRatio() }, uColor: { value: new THREE.Color(snow ? 0xffffff : 0x5f86ad) } } });
      const obj = snow ? new THREE.Points(g, m) : new THREE.LineSegments(g, m); obj.frustumCulled = false; obj.visible = false; grp.add(obj); return obj;
    };
    precipSets.push({ rain: mk(T.site.hero ? 1600 : 800, false), snow: mk(T.site.hero ? 900 : 450, true), offset: T.site.hero ? 0 : ti * 23, rainA: 0, snowA: 0 });
  });
}
function precipState(day) {
  const p = D.precip[day], T = D.airT[day];
  const snowy = state.season === 'winter' || T < .5;
  const amt = clamp(p / 7, 0, 1);
  return { rain: snowy ? 0 : (p > .3 ? .15 + amt * .85 : 0), snow: snowy ? (p > .2 ? .2 + amt * .8 : 0) : 0 };
}
function updatePrecip(dt, t) {
  const on = state.layers.precip !== false;
  precipSets.forEach(S => {
    const st = precipState((playback.day + S.offset) % DAYS), k = 1 - Math.exp(-dt * 3);
    S.rainA = lerp(S.rainA, on ? st.rain : 0, k); S.snowA = lerp(S.snowA, on ? st.snow : 0, k);
    [[S.rain, S.rainA], [S.snow, S.snowA]].forEach(([o, a]) => { o.visible = a > .02; o.material.uniforms.uTime.value = t; o.material.uniforms.uAmount.value = a; });
  });
}
const _cc = new THREE.Color();
function updateClouds(dt, t) {
  const on = state.layers.clouds !== false;
  cloudSets.forEach(S => {
    const day = (playback.day + S.offset) % DAYS, cover = on ? Math.max(D.cloud[day], D.precip[day] > .3 ? .55 + clamp(D.precip[day] / 7, 0, .45) : 0) : 0, rain = D.smoothArr ? clamp(D.precip[day] / 6, 0, 1) : 0;
    S.grp.rotation.y += dt * S.speed;
    _cc.setHex(state.season === 'winter' ? 0xe9edf2 : 0xffffff).lerp(_tc.setHex(0x8e98a4), rain * .8); S.mat.color.lerp(_cc, .05);
    S.clouds.forEach(c => { const target = c.k < cover ? c.base : 0; c.s = lerp(c.s, target, 1 - Math.exp(-dt * 1.6)); c.mesh.scale.setScalar(Math.max(.001, c.s)); c.mesh.visible = c.s > .01; c.mesh.position.y += Math.sin(t * .5 + c.bob) * .0004; });
  });
}

function buildStars() {
  const n = 1600, a = new Float32Array(n * 3), r = mulberry32(11);
  for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, el = .3 + Math.asin(r()) * .85; a[i * 3] = Math.cos(th) * Math.cos(el) * 640; a[i * 3 + 1] = Math.sin(el) * 640 + 30; a[i * 3 + 2] = Math.sin(th) * Math.cos(el) * 640; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  stars.renderOrder = -1; if (!CONFIG.OUTSIDE_PANORAMA) scene.add(stars);
}
function applyLighting(instant) {
  const season = state.season, n = !!state.night;
  const elev = n ? 64 : { winter: 9, spring: 24, summer: 40, autumn: 18 }[season];
  const ex = n ? .88 : { winter: .98, spring: .92, summer: .9, autumn: .9 }[season];
  const el0 = state.sunElev ?? 40, ex0 = renderer.toneMappingExposure;
  const gTo = new THREE.Color({ winter: 0xe9eef3, spring: 0x6b6a45, summer: 0x5d6b3f, autumn: 0x6f5a35 }[season]); if (n) gTo.multiplyScalar(.18);
  const fogTo = new THREE.Color(n ? 0x0b1424 : season === 'winter' ? 0xe8eef4 : 0xd9e6ef);
  const F = { gFrom: groundMat.color.clone(), fogFrom: scene.fog.color.clone(), sunC: sun.color.clone(), sunI: sun.intensity, hS: hemi.color.clone(), hG: hemi.groundColor.clone(), hI: hemi.intensity,
    glow: nightGlow.value, env: scene.environmentIntensity, night: outsideMat ? outsideMat.uniforms.uNight.value : 0, st: stars ? stars.material.uniforms.uOpacity.value : 0, nx: NIGHT.v, ceil: HALLREF.ceil ? HALLREF.ceil.emissiveIntensity : .12, fill: HALLREF.fills[0]?.intensity ?? 18 };
  const T = { sunC: new THREE.Color(n ? 0xa9bfff : 0xfff0d6), sunI: n ? .5 : 2.4, hS: new THREE.Color(n ? 0x51648f : 0xe3f0ff), hG: new THREE.Color(n ? 0x0a1220 : 0x15253c), hI: n ? .28 : .6 };
  if (!outsideMat) sky.visible = !n;
  document.body.classList.toggle('night', n);
  tween(instant ? 1 : 1500, e => {
    state.sunElev = lerp(el0, elev, e); setSun(state.sunElev); renderer.toneMappingExposure = lerp(ex0, ex, e);
    groundMat.color.lerpColors(F.gFrom, gTo, e); scene.fog.color.lerpColors(F.fogFrom, fogTo, e);
    sun.color.lerpColors(F.sunC, T.sunC, e); sun.intensity = lerp(F.sunI, T.sunI, e);
    hemi.color.lerpColors(F.hS, T.hS, e); hemi.groundColor.lerpColors(F.hG, T.hG, e); hemi.intensity = lerp(F.hI, T.hI, e);
    nightGlow.value = lerp(F.glow, n ? .5 : 0, e); scene.environmentIntensity = lerp(F.env, n ? .1 : .55, e);
    if (outsideMat) outsideMat.uniforms.uNight.value = lerp(F.night, n ? 1 : 0, e);
    if (stars) stars.material.uniforms.uOpacity.value = lerp(F.st, n ? .95 : 0, e);
    setNightExtras(lerp(F.nx, n ? 1 : 0, e));
    if (HALLREF.ceil) HALLREF.ceil.emissiveIntensity = lerp(F.ceil, n ? .05 : .12, e);
    HALLREF.fills.forEach(l => l.intensity = lerp(F.fill, n ? 7 : 18, e));
  });
  const b = $('#btnNight'); if (b) { b.innerHTML = svg(n ? 'sun' : 'moon'); b.title = n ? 'Switch to day' : 'Switch to night'; }
}
function toggleNight() { state.night = !state.night; ls.set('hub.night', state.night ? '1' : '0'); applyLighting(false); }

function applySeason(season, instant = false) {
  const prev = state.season; state.season = season;
  const lc = state.layers.landcover;
  tables.forEach(T => {
    if (T.real) { realSeason(T, season, lc, instant); const W = WATER[season]; T.wMat.color.setHex(W.color); if (season !== 'winter') T.wMat.color.multiplyScalar(.55); T.wMat.opacity = season === 'winter' ? W.opacity : .8; T.wMat.envMapIntensity = .25; T.wMat.metalness = 0; if (season !== 'winter') T.wMat.color.setHex(0x1d4660); T.wMat.roughness = W.rough; T.snowfall.visible = false; return; }
    T.colorFrom.set(T.terr.geometry.attributes.color.array);
    terrainColors(T, season, lc && T.site.hero, T.colorTo);
    treeColors(T, season, lc && T.site.hero);
    const W = WATER[season]; T.wMat.color.setHex(W.color); T.wMat.opacity = W.opacity; T.wMat.roughness = W.rough;
    T.snowfall.visible = false; // replaced by the data-driven precipitation system
  });
  if (seasonTween) tweens.delete(seasonTween);
  const run = (e) => tables.forEach(T => { if (T.real) return; const a = T.terr.geometry.attributes.color.array; for (let i = 0; i < a.length; i++) a[i] = lerp(T.colorFrom[i], T.colorTo[i], e); T.terr.geometry.attributes.color.needsUpdate = true; });
  if (instant) run(1); else seasonTween = tween(900, run, easeInOut);
  snowMats.forEach(m => m.uniforms.uOpacity.value = season === 'winter' ? .9 : 0);
  // world
  applyLighting(instant);
  if (forestMesh) { const fc = forestMesh.instanceColor.array, base = forestMesh.userData.base, snowy = season === 'winter';
  for (let i = 0; i < fc.length; i += 3) { fc[i] = snowy ? lerp(base[i], .78, .55) : base[i]; fc[i + 1] = snowy ? lerp(base[i + 1], .82, .55) : base[i + 1]; fc[i + 2] = snowy ? lerp(base[i + 2], .85, .55) : base[i + 2]; }
  forestMesh.instanceColor.needsUpdate = true; }
  setOutsideSeason(season, instant);
  segSet($('#seasonSeg'), season); music.setMood(season);
}

/* =====================================================================
   Hero table layers: sensors, rivers, catchment, 360 pins
   ===================================================================== */
const heroLayers = { sensors: new THREE.Group(), rivers: new THREE.Group(), catchment: new THREE.Group(), pano: new THREE.Group() };
const globeObjs = [];
function buildHeroLayers(T) {
  Object.values(heroLayers).forEach(g => T.group.add(g));
  const sh = T.shape;
  // rivers
  const riverMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, 1.1, 1.8), toneMapped: false });
  sh.paths.forEach(p => {
    const pts = p.pts.filter(([x, z]) => Math.hypot(x, z) < .97).map(([x, z]) => new THREE.Vector3(x * T.Rt, T.real ? T.surfY(x, z) + .008 : Math.max(T.TOP - .03 + T.heightAt(x, z), T.wlBase) + .006, z * T.Rt));
    if (pts.length < 2) return;
    heroLayers.rivers.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, p.main ? .012 : .007, 6), riverMat));
  });
  if (T.real) {
    // Oulanka National Park boundary from the terrain database
    const pm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.1, .3), toneMapped: false, transparent: true, opacity: .8 }); let lab = null;
    OUL.park.forEach(line => { const pts = line.map(([x, z]) => new THREE.Vector3(x * T.Rt, T.surfY(x, z) + .012, z * T.Rt)); if (pts.length < 2) return; heroLayers.catchment.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, .005, 5), pm)); if (!lab || pts.length > lab.length) lab = pts; });
    if (lab) { const cEl = document.createElement('div'); cEl.innerHTML = '<div class="globe-tag show" style="background:rgba(120,60,0,.6)">Oulanka National Park boundary</div>'; const cl = new CSS2DObject(cEl); cl.position.copy(lab[Math.floor(lab.length / 2)]).add(new THREE.Vector3(0, .16, 0)); heroLayers.catchment.add(cl); heroLayers.catchLabel = cl; }
  } else {
  // catchment boundary
  const bpts = []; for (let i = 0; i < 160; i++) { const t = i / 160 * Math.PI * 2, rr = .8 + .1 * sh.N.n2(Math.cos(t) * 1.4 + 9, Math.sin(t) * 1.4), x = Math.cos(t) * rr, z = Math.sin(t) * rr * .86; bpts.push(T.local(x, z, .012)); }
  heroLayers.catchment.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bpts, true), 400, .011, 6, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.1, .3), toneMapped: false })));
  const cEl = document.createElement('div'); cEl.innerHTML = '<div class="globe-tag show" style="background:rgba(120,60,0,.6)">Catchment boundary (illustrative)</div>';
  const cl = new CSS2DObject(cEl); cl.position.copy(bpts[20]).add(new THREE.Vector3(0, .18, 0)); heroLayers.catchment.add(cl); heroLayers.catchLabel = cl;
  // road 8693 running north–south past the station (illustrative)
  const road = [[.12, -.98], [.06, -.6], [0, -.25], [.04, .06], [.12, .3], [.2, .52], [.18, .8], [.14, .98]].map(([x, z]) => T.local(x, z, .004));
  road.forEach(v => v.y = Math.max(v.y, T.wlBase + .02));
  T.group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(road), 160, .009, 4), new THREE.MeshStandardMaterial({ color: 0x8c8a84, roughness: .9 })));
  }
  // sensor stations: thin HUD markers (stem, hexagon reticle, pulse ring on the ground)
  const hexTex = canvasTex(128, 128, (c, w) => {
    const hx = (r, lw, al) => { c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = lw; c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; c[k ? 'lineTo' : 'moveTo'](w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r); } c.stroke(); };
    hx(54, 5, 1); hx(40, 2, .55); c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, w / 2, 13, 0, 7); c.fill();
    [0, 1, 2, 3].forEach(k => { const a = k * Math.PI / 2; c.fillRect(w / 2 + Math.cos(a) * 58 - 2, w / 2 + Math.sin(a) * 58 - 2, 4, 4); });
  });
  // sensor stations: small glowing globes on a thin stem, coloured by what they measure
  const SS = .048;
  GLOBES.forEach((G, i) => {
    const C = SENSOR_CATS[G.cat] || SENSOR_CATS.other, col = new THREE.Color(C.color);
    const SH = .1 + (i % 3) * .022;                          // staggered heights so close neighbours do not overlap
    const grp = new THREE.Group(); const base = T.local(G.at[0], G.at[1], 0); if (T.real) base.y = T.surfY(G.at[0], G.at[1]); grp.position.copy(base);
    const coreMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.6), toneMapped: false });
    const core = new THREE.Mesh(new THREE.SphereGeometry(SS * .42, 16, 12), coreMat); core.position.y = SH;
    const s = new THREE.Mesh(new THREE.SphereGeometry(SS * 1.1, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); s.position.y = SH; s.userData.globe = G.id; pickables.push(s);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col.clone().multiplyScalar(.7), transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(SS * 2.4); halo.position.y = SH;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0012, SH, 4), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.2), toneMapped: false, transparent: true, opacity: .7 })); stem.position.y = SH / 2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(SS * .3, SS * .36, 32), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.4), toneMapped: false, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .004;
    const tagEl = document.createElement('div'); tagEl.innerHTML = `<div class="globe-tag"><i style="background:${C.css}"></i>${G.short}</div>`;
    const tag = new CSS2DObject(tagEl); tag.position.y = SH + SS * .8;
    grp.add(core, s, halo, stem, ring, tag);
    heroLayers.sensors.add(grp);
    globeObjs.push({ G, grp, coreMat, halo, ring, shell: s, tag: tagEl.firstElementChild, phase: i * 1.3, col });
  });
  applySensorFilter();
  // 360 pins
  const pinTex = canvasTex(160, 160, (g, w) => {
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 10, 0, 7); g.stroke();
    g.lineWidth = 2; g.globalAlpha = .55; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 22, -.6, 3.74); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = 'rgba(6,20,40,.55)'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 13, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.font = `700 38px ui-monospace, Menlo, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('360', w / 2, w / 2 + 2);
  });
  const main = sh.paths.find(p => p.main).pts.filter(([x, z]) => Math.hypot(x, z) < .9);
  const riverAt = (u, off) => {
    const f = clamp(u, 0, 1) * (main.length - 1), i = Math.min(main.length - 2, Math.floor(f)), k = f - i;
    const [ax, az] = main[i], [bx, bz] = main[i + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
    return [lerp(ax, bx, k) - dz / L * off, lerp(az, bz, k) + dx / L * off];
  };
  CONFIG.PANORAMAS.forEach(P => {
    const [x, z] = P.river ? riverAt(P.river[0], P.river[1]) : P.at;
    const pos = T.local(x, z, 0); pos.y = T.real ? T.surfY(x, z) : Math.max(pos.y, T.wlBase);
    const PH = T.real ? .2 : .3; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pinTex, color: new THREE.Color(.55, 1.2, 1.9), depthTest: true, toneMapped: false })); sp.scale.setScalar(T.real ? .06 : .11); sp.position.copy(pos).add(new THREE.Vector3(0, PH, 0)); sp.userData.pano = P.id; pickables.push(sp);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.0015, .0015, PH - .03, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 1.1, 1.8), toneMapped: false, transparent: true, opacity: .7 })); st.position.copy(pos).add(new THREE.Vector3(0, (PH - .03) / 2, 0));
    const tagEl = document.createElement('div'); tagEl.innerHTML = `<div class="globe-tag">360° · ${P.title}</div>`;
    const tag = new CSS2DObject(tagEl); tag.position.copy(pos).add(new THREE.Vector3(0, PH + .1, 0));
    heroLayers.pano.add(sp, st, tag); panoTags[P.id] = tagEl.firstElementChild;
  });
}
const panoTags = {};

/* =====================================================================
   Live screen (YouTube) and the AI companion orb
   ===================================================================== */
const ORB_POS = new THREE.Vector3(36.2, 0, 8.2), ORB_DOCK_Y = 4.1;
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function normalizeUV(geo, w, h) { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + .5, p.getY(i) / h + .5); uv.needsUpdate = true; return geo; }
/* ---------- sci-fi orb ---------- */
const ORB_VS = `varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const ORB_FS = `
  uniform float uTime, uEnergy, uSwirl, uFlash; uniform vec3 uA, uB, uC;
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  void main(){
    vec3 n = normalize(vN); float fres = pow(1. - max(dot(n, normalize(vV)), 0.), 2.3);
    float t = uTime * (.22 + uSwirl);
    vec3 p = vP * 2.4;
    float f = n3(p + vec3(t, t * .7, -t * .5)) * .65 + n3(p * 2.3 - vec3(t * 1.4)) * .35;
    float bands = pow(sin(vP.y * 16. + f * 7. + uTime * (1. + uSwirl * 3.)) * .5 + .5, 8.);
    float sparks = pow(n3(p * 6. + uTime * 2.), 12.) * 4.;
    vec3 col = mix(uA, uB, smoothstep(.25, .85, f));
    col = mix(col, uC, bands * (.35 + .5 * uEnergy));
    float glow = .55 + .75 * uEnergy + uFlash * .8;
    col = col * (.35 + .9 * f) * glow + fres * mix(uA, vec3(1.), .45) * (1.1 + uEnergy) + sparks * uC * uEnergy;
    gl_FragColor = vec4(col * 1.2, .78 + fres * .22);
  }`;
const HUD_VS = `varying vec2 vXY; void main(){ vXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const HUD_FS = `
  uniform float uTime, uDash, uSpeed, uEnergy, uFlash; uniform vec3 uColor; varying vec2 vXY;
  void main(){
    float a = atan(vXY.y, vXY.x) / 6.28318 + .5;
    float d = uDash > 0. ? step(.42, fract(a * uDash)) : 1.;
    float sw = fract(a - uTime * uSpeed);
    float head = smoothstep(.78, 1., sw);
    float al = d * (.28 + .45 * uEnergy) + head * (.7 + uFlash);
    gl_FragColor = vec4(uColor * (1. + head * 1.6 + uFlash), al);
  }`;
const ORB_PAL = {
  idle:      [[.35, .75, 1.0], [.42, .36, 1.0], [1.0, .62, .42]],
  listening: [[.28, 1.0, .82], [.15, .6, 1.0], [.85, 1.0, 1.0]],
  thinking:  [[.66, .42, 1.0], [1.0, .42, .85], [.5, .85, 1.0]],
  speaking:  [[1.0, .74, .45], [.5, .7, 1.0], [1.0, 1.0, 1.0]],
};
const ORB = { group: null, inner: null, mat: null, rings: [], hud: [], halo: null, nucleus: null, mode: 'docked', state: 'idle', energy: .2, flash: 0, speakEnv: 0, swirl: .15, scale: 1,
  A: new THREE.Color(.35, .75, 1), B: new THREE.Color(.42, .36, 1), C: new THREE.Color(1, .62, .42), pedestalLbl: null, pedRing: null };
function buildOrb() {
  const ped = new THREE.Group(); ped.position.copy(ORB_POS); scene.add(ped);
  const el = document.createElement('div');
  el.innerHTML = `<div class="lbl ai"><div class="ic">${svg('ai')}</div><div>AI Companion</div></div>`;
  const lo = new CSS2DObject(el); lo.position.set(0, ORB_DOCK_Y + 1.1, 0); ped.add(lo);
  ORB.pedestalLbl = el.firstElementChild;
  ORB.pedestalLbl.addEventListener('click', e => { e.stopPropagation(); ORB.mode === 'docked' ? summonOrb() : dismissOrb(); });
  // orb
  const g = new THREE.Group(); g.position.copy(ORB_POS).setY(ORB_DOCK_Y); scene.add(g); ORB.group = g;
  const inner = new THREE.Group(); g.add(inner); ORB.inner = inner;
  ORB.mat = new THREE.ShaderMaterial({ vertexShader: ORB_VS, fragmentShader: ORB_FS, transparent: true, toneMapped: false, depthWrite: true,
    uniforms: { uTime: { value: 0 }, uEnergy: { value: .2 }, uSwirl: { value: .15 }, uFlash: { value: 0 }, uA: { value: ORB.A }, uB: { value: ORB.B }, uC: { value: ORB.C } } });
  const core = new THREE.Mesh(new THREE.SphereGeometry(.62, 72, 54), ORB.mat); core.userData.ai = true; pickables.push(core); inner.add(core); ORB.core = core; core.scale.setScalar(.58);
  // hologram mesh: two geodesic wire shells and glowing nodes
  ORB.wires = [[.64, 3, .55], [.47, 1, .8]].map(([r, det, op], k) => {
    const geo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r, det));
    const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(.4, .9, 1.6), transparent: true, opacity: op, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    inner.add(m); return m; });
  { const ico = new THREE.IcosahedronGeometry(.64, 1), pts = new THREE.BufferGeometry(); pts.setAttribute('position', ico.getAttribute('position'));
    ORB.nodes = new THREE.Points(pts, new THREE.PointsMaterial({ size: .05, map: glowTex, color: new THREE.Color(.6, 1.1, 1.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); inner.add(ORB.nodes); }
  ORB.nucleus = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); ORB.nucleus.scale.setScalar(.9); inner.add(ORB.nucleus);
  ORB.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x8a9cff, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); ORB.halo.scale.setScalar(3.4); inner.add(ORB.halo);
  const hud = (r0, r1, dash, speed, rot) => {
    const m = new THREE.ShaderMaterial({ vertexShader: HUD_VS, fragmentShader: HUD_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
      uniforms: { uTime: { value: 0 }, uDash: { value: dash }, uSpeed: { value: speed }, uEnergy: { value: .2 }, uFlash: { value: 0 }, uColor: { value: new THREE.Color(.55, .8, 1.3) } } });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 160, 1), m); mesh.rotation.set(...rot); inner.add(mesh); ORB.hud.push(mesh); return mesh;
  };
  hud(.86, .874, 0, .22, [1.25, .25, 0]); hud(1.0, 1.035, 48, -.14, [1.6, -.4, .3]); hud(1.15, 1.162, 5, .38, [.4, .9, 0]); hud(1.3, 1.31, 90, .08, [Math.PI / 2, 0, 0]);
  // simpler look: core, one wire shell and a soft glow; the rings, inner shell, nodes and sparks are switched off
  inner.scale.setScalar(.72); ORB.hud.forEach(m => m.visible = false); ORB.wires[1].visible = false; ORB.nodes.visible = false; ORB.halo.material.opacity = .3;
  // floating platform hanging from the ceiling on three thin cables
  { const P = new THREE.Group(); P.position.copy(ORB_POS).setY(ORB_DOCK_Y - .78); scene.add(P);
    const m = new THREE.MeshPhysicalMaterial({ color: 0x0a1626, roughness: .2, metalness: .8, clearcoat: 1, emissive: 0x020a16 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.95, .62, .14, 6), m); disc.castShadow = true; P.add(disc);
    const top = new THREE.Mesh(new THREE.CircleGeometry(.82, 6), hudMat(HUD_COMET_FS, { uSpeed: { value: .9 }, uBase: { value: .18 } }, { blending: THREE.AdditiveBlending })); top.rotation.x = -Math.PI / 2; top.position.y = .072; P.add(top);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(.95, .012, 6, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(.35, .95, 1.8), toneMapped: false })); edge.rotation.x = Math.PI / 2; edge.position.y = .07; P.add(edge);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.42, .62, 1.0, 32, 1, true), hudMat(HUD_WALL_FS, {}, { blending: THREE.AdditiveBlending })); beam.position.y = .58; P.add(beam);
    const ceil = HALL.h - 1.2 - (ORB_DOCK_Y - .78);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + .5, c = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, ceil, 4), new THREE.MeshBasicMaterial({ color: 0x5f86a8 })); c.position.set(Math.cos(a) * .8, ceil / 2, Math.sin(a) * .8); P.add(c); }
    const under = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x2fb6ff, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending })); under.scale.setScalar(2.4); under.position.y = -.2; P.add(under); }
  const sp = makeRingParticles(1.15, -.85); sp.material.uniforms.uColor.value = new THREE.Color(.7, .8, 1.1); sp.material.uniforms.uSize.value = 20; inner.add(sp); ORB.sparks = sp; sp.visible = false;
}
function orbPanelSide() { return ($('#sitePanel').classList.contains('show') || $('#aiPanel').classList.contains('show')) ? -1 : 1; }
const _of = new THREE.Vector3(), _or = new THREE.Vector3(), _ou = new THREE.Vector3(), _ot = new THREE.Vector3(), _op = new THREE.Vector3();
function updateOrb(dt, t) {
  const O = ORB; if (!O.group) return;
  if (O.mode === 'companion' && !renderer.xr.isPresenting) {
    camera.getWorldDirection(_of); _or.crossVectors(_of, camera.up).normalize(); _ou.crossVectors(_or, _of).normalize();
    const narrow = innerWidth < 820, side = narrow ? 0 : orbPanelSide();
    _ot.copy(camera.position).addScaledVector(_of, 1.9).addScaledVector(_or, (narrow ? 0 : .8) * side).addScaledVector(_ou, narrow ? .32 : -.16);
  } else _ot.copy(ORB_POS).setY(ORB_DOCK_Y);
  O.group.position.lerp(_ot, 1 - Math.exp(-dt * (O.mode === 'companion' ? 3.4 : 2.0)));
  const sc = O.mode === 'companion' ? .24 : 1; O.scale = lerp(O.scale, sc, 1 - Math.exp(-dt * 3)); O.group.scale.setScalar(O.scale);
  O.inner.position.y = Math.sin(t * 1.3) * .06;
  // energy by state
  let e, sw;
  if (O.state === 'listening') { e = .35 + clamp(micLevel() * 9, 0, 1) * .65; sw = .6; }
  else if (O.state === 'thinking') { e = .55 + .2 * Math.sin(t * 6); sw = 1.7; }
  else if (O.state === 'speaking') { const tl = ttsLevel(); if (tl >= 0) O.speakEnv = Math.max(O.speakEnv * Math.exp(-dt * 7), clamp(tl * 7, 0, 1)); O.speakEnv *= Math.exp(-dt * 7); if (Math.random() < dt * 8) O.speakEnv = Math.max(O.speakEnv, .5 + Math.random() * .5); e = .35 + .65 * O.speakEnv; sw = .8; }
  else { e = .22 + .08 * Math.sin(t * 1.2); sw = .15; }
  O.energy = lerp(O.energy, e, 1 - Math.exp(-dt * 12)); O.swirl = lerp(O.swirl, sw, 1 - Math.exp(-dt * 2)); O.flash *= Math.exp(-dt * 3);
  const P = ORB_PAL[O.state], k = 1 - Math.exp(-dt * 3);
  O.A.lerp(_tc.setRGB(...P[0]), k); O.B.lerp(_tc.setRGB(...P[1]), k); O.C.lerp(_tc.setRGB(...P[2]), k);
  const u = O.mat.uniforms; u.uTime.value = t; u.uEnergy.value = O.energy; u.uSwirl.value = O.swirl; u.uFlash.value = O.flash;
  O.core.rotation.y += dt * (.25 + O.swirl * .6);
  if (O.wires) { O.wires.forEach((w, k) => { w.rotation.y += dt * (.12 + .4 * O.swirl) * (k ? -1.6 : 1); w.rotation.x += dt * .05 * (k ? 1 : -1); w.material.color.copy(O.A).multiplyScalar(1.4 + O.energy); w.scale.setScalar(1 + .06 * O.energy * Math.sin(t * 5 + k)); });
    O.nodes.rotation.copy(O.wires[0].rotation); O.nodes.material.color.copy(O.A).multiplyScalar(1.6); O.nodes.material.size = .04 + .05 * O.energy; }
  O.hud.forEach((m, i) => { const mu = m.material.uniforms; mu.uTime.value = t * (1 + O.swirl); mu.uEnergy.value = O.energy; mu.uFlash.value = O.flash; mu.uColor.value.copy(O.A).multiplyScalar(1.25); m.rotation.z += dt * (.15 + .5 * O.energy) * (i % 2 ? -1 : 1); m.rotation.x += dt * .05 * (i - 1.5); });
  O.halo.scale.setScalar(2.2 * (1 + .25 * O.energy + .35 * O.flash)); O.halo.material.opacity = .3 + .45 * O.energy; O.halo.material.color.copy(O.A).multiplyScalar(.7);
  O.nucleus.material.opacity = .35 + .55 * O.energy; O.nucleus.scale.setScalar(.7 + .5 * O.energy);
  O.sparks.material.uniforms.uColor.value.copy(O.A);
  // caption follows the orb on screen
  const cap = $('#orbCaption');
  if (O.mode === 'companion' && cap.classList.contains('show')) {
    _op.copy(O.group.position).project(camera);
    const x = (_op.x * .5 + .5) * innerWidth, y = (-_op.y * .5 + .5) * innerHeight, w = cap.offsetWidth, h = cap.offsetHeight;
    const left = x + 70 + w > innerWidth - 16 ? x - 70 - w : x + 70;
    cap.style.transform = `translate(${clamp(left, 16, innerWidth - w - 16)}px, ${clamp(y - h / 2, 80, innerHeight - h - ($('#timeline').classList.contains('show') ? 236 : 172))}px)`;
  }
}
const _tc = new THREE.Color();

/* =====================================================================
   Lounge corner — sofas where visitors can sit and talk
   ===================================================================== */
function sectorShape(r0, r1, a0, a1, seg = 40) {
  const s = new THREE.Shape();
  for (let i = 0; i <= seg; i++) { const a = lerp(a0, a1, i / seg); const x = Math.cos(a) * r1, y = Math.sin(a) * r1; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  for (let i = seg; i >= 0; i--) { const a = lerp(a0, a1, i / seg); s.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
  return s;
}
function slab(shape, h, bevel = .06) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24 });
  g.rotateX(-Math.PI / 2); return g;
}
/* =====================================================================
   Shared sessions — several visitors in the same hall (peer-to-peer)
   Uses Trystero (WebRTC, signalling over public Nostr relays): no server to run.
   ===================================================================== */
const AV_COLORS = ['#0a84ff', '#ff9f0a', '#34c759', '#af52de', '#ff375f', '#30b0c7', '#ffcc00', '#a2845e', '#5e5ce6'];
const randomColor = (avoid = []) => { const free = AV_COLORS.filter(c => !avoid.includes(c)); const pool = free.length ? free : AV_COLORS; return pool[Math.floor(Math.random() * pool.length)]; };
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { } } };
const mp = {
  joined: false, joining: false, room: null, send: null, roomId: (new URLSearchParams(location.search).get('room') || 'diwa-hub').replace(/[^\w-]/g, '').slice(0, 40) || 'diwa-hub',
  name: new URLSearchParams(location.search).get('name')?.slice(0, 24) || ls.get('hub.name') || '', color: randomColor(), selfId: '', micOn: false, mic: null, peers: new Map(), acc: 0, selfSpeaking: false, an: null,
};
/* ---------- avatar: a glowing circle that shows a voice waveform while the person talks ---------- */
const AV_BARS = 48;
function avatarFace(color, name) {
  return canvasTex(256, 256, (g, w) => {
    const c = new THREE.Color(color), hi = '#' + c.clone().lerp(new THREE.Color(1, 1, 1), .45).getHexString(), lo = '#' + c.clone().multiplyScalar(.72).getHexString();
    const gr = g.createRadialGradient(w * .38, w * .32, 8, w / 2, w / 2, w / 2); gr.addColorStop(0, hi); gr.addColorStop(.7, color); gr.addColorStop(1, lo);
    g.fillStyle = gr; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.font = `650 ${w * .42}px ${DS.font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText((name || '?').trim().charAt(0).toUpperCase(), w / 2, w / 2 + w * .03);
  });
}
/* hologram head bust with floating hands (in the person's colour) */
const HOLO_AV_VS = `varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = -mv.xyz; vY = (modelMatrix * vec4(position, 1.)).y; gl_Position = projectionMatrix * mv; }`;
const HOLO_AV_FS = `uniform vec3 uColor; uniform float uTime; uniform float uLevel; varying vec3 vN; varying vec3 vV; varying float vY;
  void main(){ float f = 1. - abs(dot(normalize(vN), normalize(vV))); f = pow(f, 1.7);
    float scan = .5 + .5 * sin(vY * 140. - uTime * 5.); float band = smoothstep(.97, 1., fract(vY * 3. - uTime * .4));
    float a = .16 + f * .85 + scan * .07 + band * .35 + uLevel * .25;
    gl_FragColor = vec4(uColor * (.55 + f * 1.4 + band * .8 + uLevel * .6), clamp(a, 0., 1.)); }`;
let _avGeo;
function avatarGeo() {
  if (_avGeo) return _avGeo;
  const prof = [[0, -.2], [.046, -.2], [.05, -.15], [.066, -.115], [.094, -.08], [.11, -.03], [.116, .025], [.112, .08], [.097, .122], [.07, .156], [.036, .175], [0, .18]].map(([x, y]) => new THREE.Vector2(x, y));
  const head = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(40), 48); head.scale(1, 1, 1.12);
  const wire = new THREE.EdgesGeometry((() => { const g = new THREE.LatheGeometry(prof, 14); g.scale(1, 1, 1.12); return g; })(), 1);
  const visor = new THREE.CylinderGeometry(.119, .117, .05, 32, 1, true, Math.PI - .95, 1.9); visor.scale(1, 1, 1.12); visor.translate(0, .02, 0);
  const hand = new THREE.SphereGeometry(.042, 20, 14); hand.scale(.8, 1.25, .45);
  return _avGeo = { head, wire, visor, hand };
}
function makeAvatar(color, name) {
  const g = new THREE.Group(), face = new THREE.Group(); g.add(face);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(.2, 64), new THREE.MeshBasicMaterial({ map: avatarFace(color, name), transparent: true, toneMapped: false }));
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75, toneMapped: false, side: THREE.DoubleSide });
  const rim = new THREE.Mesh(new THREE.RingGeometry(.205, .218, 96), rimMat);
  const back = new THREE.Mesh(new THREE.CircleGeometry(.218, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(.55) })); back.rotation.y = Math.PI; back.position.z = -.002;
  // talking bars around the circle (like a voice waveform), collapse to a calm dotted ring when quiet
  const barMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(1, 1, 1), .35), transparent: true, opacity: .95, toneMapped: false, side: THREE.DoubleSide });
  const barGeo = new THREE.PlaneGeometry(.011, 1); barGeo.translate(0, .5, 0);
  const bars = new THREE.InstancedMesh(barGeo, barMat, AV_BARS);
  const ripples = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.22, .228, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.5), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })); face.add(m); return m; });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(color), transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(.95); halo.position.z = -.01;
  face.add(halo, back, disc, rim, bars);
  disc.material.visible = false; back.visible = false; rim.visible = false; halo.scale.setScalar(.6);   // the round face is replaced by the hologram bust (the disc stays as the click target)
  const AG = avatarGeo(), hc = new THREE.Color(color).multiplyScalar(1.25);
  const hm = new THREE.ShaderMaterial({ vertexShader: HOLO_AV_VS, fragmentShader: HOLO_AV_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: Object.assign(hudU(), { uColor: { value: hc }, uLevel: { value: 0 } }) });
  const bust = new THREE.Group(); g.add(bust); face.scale.multiplyScalar(.85);
  const head = new THREE.Mesh(AG.head, hm); const wire = new THREE.LineSegments(AG.wire, new THREE.LineBasicMaterial({ color: hc, transparent: true, opacity: .28, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  const visor = new THREE.Mesh(AG.visor, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.6, 1.8), transparent: true, opacity: .55, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  const hands = [-1, 1].map(sx => { const h = new THREE.Mesh(AG.hand, hm); h.position.set(sx * .19, -.27, -.09); h.rotation.z = sx * .35; bust.add(h); return h; });
  const neck = new THREE.Group(); neck.position.y = -.16; bust.add(neck); bust.rotation.order = 'YXZ';
  [head, wire, visor].forEach(o => { o.position.y += .16; neck.add(o); }); bust.traverse(o => o.renderOrder = 4);
  // a book the avatar can hold: closed (carrying) or open with a turning page (reading, showing)
  const bk = new THREE.Group(); bk.position.set(0, -.3, -.19); bk.visible = false; bust.add(bk);
  const cover = new THREE.MeshStandardMaterial({ color: 0x23518a, roughness: .5, emissive: 0x23518a, emissiveIntensity: .25 }), pageM = new THREE.MeshStandardMaterial({ color: 0xeef5fb, roughness: .8, emissive: 0xffffff, emissiveIntensity: .15, side: THREE.DoubleSide });
  const closed = new THREE.Mesh(new THREE.BoxGeometry(.13, .19, .025), [cover, cover, cover, cover, cover, cover]); closed.rotation.x = -.25; bk.add(closed);
  const open = new THREE.Group(); open.rotation.x = -1.05; bk.add(open);
  [-1, 1].forEach(sx => { const h = new THREE.Mesh(new THREE.BoxGeometry(.12, .17, .012), [pageM, pageM, pageM, pageM, pageM, cover]); h.position.set(sx * .061, 0, 0); h.rotation.y = sx * -.18; open.add(h); });
  const flip = new THREE.Group(); open.add(flip); const leaf = new THREE.Mesh(new THREE.PlaneGeometry(.115, .165), pageM); leaf.position.x = .058; flip.add(leaf); flip.position.z = .008;
  // face: eyes, brows and mouth on the front of the head (the bust looks along −z)
  const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .65).multiplyScalar(1.6), transparent: true, opacity: .95, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const dot = new THREE.SphereGeometry(1, 14, 10), face2 = new THREE.Group(); bust.add(face2);
  const eyes = [-1, 1].map(sx => { const e = new THREE.Mesh(dot, fm); e.position.set(sx * .038, .038, -.124); e.scale.set(.014, .01, .005); e.visible = false; face2.add(e); return e; });
  const brows = [-1, 1].map(sx => { const b = new THREE.Mesh(new THREE.BoxGeometry(.034, .0045, .004), fm); b.position.set(sx * .039, .064, -.121); b.rotation.z = sx * -.12; face2.add(b); return b; });
  const mouth = new THREE.Mesh(dot, fm); mouth.position.set(0, -.042, -.118); mouth.scale.set(.022, .0025, .005); face2.add(mouth); face2.visible = false;   // brows and lips switched off; the white eye strap stays
  // soft marker on the floor below the person
  const floor = new THREE.Mesh(new THREE.CircleGeometry(.32, 48), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(color), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const el = document.createElement('div'); el.innerHTML = `<div class="name-tag"><i style="background:${color}"></i><span></span><b class="spk">${svg('speaker')}</b></div>`;
  const tagEl = el.firstElementChild; tagEl.querySelector('span').textContent = name || 'Guest';
  const tag = new CSS2DObject(el); tag.position.y = .34; g.add(tag);
  g.scale.setScalar(1.3); scene.add(g);
  return { g, face, disc, rimMat, bars, barMat, ripples, halo, floor, tagEl, tag, color, phase: Math.random() * 10, level: 0, bust, hm, wire, hands, eyes, brows, mouth, fm, talk: 0, blink: 2 + Math.random() * 3, mOpen: 0, neck, bk, closed, open, flip, cover, holdK: 0, readK: 0, hold: 0, read: false };
}
const _bo = new THREE.Object3D();
const _hv = new THREE.Vector3(), smoothK = x => x * x * (3 - 2 * x);
function animateAvatar(A, level, t) {
  A.face.quaternion.copy(camera.quaternion);                  // the voice ring always faces the viewer
  if (A.bust) {
    const want = A.yaw !== undefined ? A.yaw : Math.atan2(-(camera.position.x - A.g.position.x), -(camera.position.z - A.g.position.z));
    let d = want - A.bust.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); A.bust.rotation.y += d * .12;
    A.hm.uniforms.uLevel.value = level;
    // talking: smoothed so gestures ease in and out
    A.talk += ((level > .04 ? 1 : 0) - A.talk) * (level > .04 ? .08 : .03);
    const T_ = A.talk, ph = A.phase;
    A.holdK += ((A.hold ? 1 : 0) - A.holdK) * .08; A.readK += ((A.read ? 1 : 0) - A.readK) * .05;
    A.neck.rotation.x = -.5 * A.readK + Math.sin(t * .7 + ph) * .03 * A.readK;   // reading: the head bends down over the book
    A.bk.visible = A.holdK > .05; A.closed.visible = A.hold === 1; A.open.visible = A.hold === 2;
    if (A.hold === 2) { const f = (t * .35 + ph) % 1; A.flip.rotation.y = f < .25 ? -Math.PI * smoothK(f / .25) : 0; }   // turn a page now and then
    A.hands.forEach((h, k) => { const sx = k ? 1 : -1, g1 = Math.sin(t * 2.1 + ph + k * 2.3), g2 = Math.sin(t * 1.3 + ph * 2 + k);
      h.position.set(sx * (.19 + .035 * T_ * (.5 + .5 * g2)), -.27 + Math.sin(t * 1.4 + ph + k * 1.7) * .018 + T_ * (.05 + .035 * g1), -.09 - T_ * (.05 + .02 * g2));
      h.rotation.set(-T_ * (.5 + .25 * g1), 0, sx * (.35 + T_ * .3 * g2));
      if (A.holdK > .01) { h.position.lerp(_hv.set(sx * (A.hold === 2 ? .13 : .075), -.31, -.19), A.holdK); h.rotation.x *= 1 - A.holdK; } });
    // mouth follows the voice with small syllable variation; eyes blink; brows lift a little on emphasis
    const syl = .55 + .45 * Math.abs(Math.sin(t * 11 + ph) * Math.sin(t * 7.3 + ph * 3));
    A.mOpen += (Math.min(1, level * 2.4) * syl - A.mOpen) * .35;
    A.mouth.scale.set(.022 - A.mOpen * .003, .0025 + A.mOpen * .0055, .005);
    const dtA = Math.min(.1, A._t ? t - A._t : 0); A._t = t; A.blink -= dtA; const bl = A.blink < 0 ? Math.max(.1, Math.abs(A.blink / .07 * 2 - 1)) : 1; if (A.blink < -.14) A.blink = 2.5 + Math.random() * 3.5;
    A.eyes.forEach(e => e.scale.y = .01 * bl);
    const lift = T_ * (.002 + .002 * Math.max(0, Math.sin(t * 1.7 + ph)));
    A.brows.forEach((b, k) => { b.position.y = .064 + lift; b.rotation.z = (k ? -1 : 1) * (.12 - T_ * .03 * Math.max(0, Math.sin(t * 1.7 + ph))); });
  }
  A.level = lerp(A.level, level, .35);
  const L = A.level, talking = L > .12;
  for (let i = 0; i < AV_BARS; i++) {
    const a = i / AV_BARS * Math.PI * 2;
    const wave = .5 + .5 * Math.sin(t * 13 + i * 1.7 + A.phase) * Math.sin(t * 7.3 + i * .63);
    const len = .006 + L * (.045 + .14 * wave);
    _bo.position.set(Math.cos(a) * .235, Math.sin(a) * .235, .001); _bo.rotation.set(0, 0, a - Math.PI / 2); _bo.scale.set(1, len, 1); _bo.updateMatrix();
    A.bars.setMatrixAt(i, _bo.matrix);
  }
  A.bars.instanceMatrix.needsUpdate = true;
  A.barMat.opacity = .45 + .55 * Math.min(1, L * 3);
  A.rimMat.opacity = talking ? .95 : .55 + .2 * Math.sin(t * 1.6 + A.phase);   // calm breathing when quiet
  A.halo.material.opacity = .18 + .5 * L; A.halo.scale.setScalar(.95 + .5 * L);
  A.ripples.forEach((r, k) => { const ph = (t * .9 + k * .5 + A.phase) % 1; r.scale.setScalar(1 + ph * .9); r.material.opacity = talking ? (1 - ph) * .6 * Math.min(1, L * 2) : 0; });
  A.floor.position.set(A.g.position.x, .03, A.g.position.z);
  A.floor.material.opacity = .35 + .4 * L;
  A.tagEl.classList.toggle('talking', talking);
  return talking;
}
function setAvatarStyle(P, name, color) {
  if ((name && name !== P.name) || (color && color !== P.color)) {
    P.name = name || P.name; P.color = color || P.color;
    P.av.tagEl.querySelector('span').textContent = P.name; P.av.tagEl.querySelector('i').style.background = P.color;
    P.av.disc.material.map = avatarFace(P.color, P.name); P.av.disc.material.needsUpdate = true;
    const c = new THREE.Color(P.color); P.av.barMat.color.copy(c).lerp(new THREE.Color(1, 1, 1), .35); P.av.halo.material.color.copy(c); P.av.floor.material.color.copy(c);
    P.av.ripples.forEach(r => r.material.color.copy(c).multiplyScalar(1.5));
    if (P.av.hm) { P.av.hm.uniforms.uColor.value.copy(c).multiplyScalar(1.25); P.av.wire.material.color.copy(c).multiplyScalar(1.25); P.av.fm.color.copy(c).lerp(new THREE.Color(0xffffff), .65).multiplyScalar(1.6); }
  }
}
function ensurePeer(id, d = {}) {
  let P = mp.peers.get(id);
  if (!P) {
    P = { id, name: d.n || 'Guest', color: d.c || '#8e8e93', pos: new THREE.Vector3(0, 1.6, 20), yaw: 0, pitch: 0, tgt: { pos: new THREE.Vector3(0, 1.6, 20), yaw: 0, pitch: 0 }, seen: false, level: 0 };
    P.av = makeAvatar(P.color, P.name); mp.peers.set(id, P);
    toast(`${P.name} joined the hub`, 2400); renderPeople();
  }
  setAvatarStyle(P, d.n, d.c);
  return P;
}
function removePeer(id) {
  const P = mp.peers.get(id); if (!P) return;
  scene.remove(P.av.g); scene.remove(P.av.floor); P.av.tag.element.remove(); P.voice?.el.remove(); try { P.voice?.src.disconnect(); } catch { }
  mp.peers.delete(id); toast(`${P.name} left`, 2000); renderPeople();
}
function onPose(d, id) {
  const P = ensurePeer(id, d); if (!Array.isArray(d.p)) return;
  // two people with the same colour: the one with the larger id quietly picks another free colour
  if (d.c && d.c === mp.color && mp.selfId && mp.selfId > id) { mp.color = randomColor([...mp.peers.values()].map(Q => Q.color)); renderPeople(); }
  P.tgt.pos.set(+d.p[0] || 0, +d.p[1] || 0, +d.p[2] || 0); P.tgt.yaw = +d.y || 0; P.tgt.pitch = clamp(+d.x || 0, -1.2, 1.2);
  if (!P.seen) { P.pos.copy(P.tgt.pos); P.yaw = P.tgt.yaw; P.seen = true; }
}
const _cp = new THREE.Vector3(), _cd = new THREE.Vector3();
function selfPose() {
  const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera;
  cam.getWorldPosition(_cp); cam.getWorldDirection(_cd);
  return { p: [+_cp.x.toFixed(3), +_cp.y.toFixed(3), +_cp.z.toFixed(3)], y: +Math.atan2(_cd.x, _cd.z).toFixed(3), x: +Math.asin(clamp(_cd.y, -1, 1)).toFixed(3), n: mp.name, c: mp.color };
}
function angLerp(a, b, k) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; }
const _vb = new Float32Array(256);
function updateMP(dt) {
  if (!mp.peers.size && !mp.joined) return;
  if (mp.joined && mp.send) { mp.acc += dt; if (mp.acc > .1) { mp.acc = 0; try { mp.send(selfPose()); } catch { } } }
  const ctx = music.ctx;
  if (ctx && mp.peers.size) {
    const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera; cam.getWorldPosition(_cp); cam.getWorldDirection(_cd); const L = ctx.listener;
    if (L.positionX) { L.positionX.value = _cp.x; L.positionY.value = _cp.y; L.positionZ.value = _cp.z; L.forwardX.value = _cd.x; L.forwardY.value = _cd.y; L.forwardZ.value = _cd.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(_cp.x, _cp.y, _cp.z); L.setOrientation(_cd.x, _cd.y, _cd.z, 0, 1, 0); }
  }
  let anyone = false;
  mp.peers.forEach(P => {
    const k = 1 - Math.exp(-dt * 8);
    P.pos.lerp(P.tgt.pos, k); P.yaw = angLerp(P.yaw, P.tgt.yaw, k); P.pitch = lerp(P.pitch, P.tgt.pitch, k);
    P.av.g.position.copy(P.pos).add(new THREE.Vector3(0, Math.sin(performance.now() / 900 + P.id.length) * .015, 0)); P.av.yaw = P.yaw + Math.PI;
    let lvl = P.simLevel ?? 0;
    if (P.voice) {
      P.voice.an.getFloatTimeDomainData(_vb); let s = 0; for (let i = 0; i < 256; i++) s += _vb[i] * _vb[i]; lvl = Math.sqrt(s / 256);
      const pn = P.voice.pan; if (pn.positionX) { pn.positionX.value = P.pos.x; pn.positionY.value = P.pos.y; pn.positionZ.value = P.pos.z; } else pn.setPosition(P.pos.x, P.pos.y, P.pos.z);
    }
    const talking = animateAvatar(P.av, clamp(lvl * 14, 0, 1), performance.now() / 1000); anyone = anyone || talking;
    const row = document.querySelector(`#peopleList [data-id="${P.id}"]`); if (row) row.classList.toggle('talking', talking);
  });
  // self speaking indicator
  if (mp.an) { mp.an.getFloatTimeDomainData(_vb); let s = 0; for (let i = 0; i < 256; i++) s += _vb[i] * _vb[i]; const me = Math.sqrt(s / 256) * 14 > .12 && mp.micOn; const r = document.querySelector('#peopleList [data-id="me"]'); if (r) r.classList.toggle('talking', me); }
  if (ORB.state === 'idle' && !$('#liveModal').classList.contains('show')) music.duck(anyone ? .45 : 1, .8);
}
function attachVoice(id, stream) {
  const ctx = music.ensureCtx(); if (!ctx) return; ctx.resume();
  const P = ensurePeer(id);
  const el = new Audio(); el.srcObject = stream; el.muted = true; el.play().catch(() => { }); // Chrome needs a playing element for WebRTC audio in Web Audio
  const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 256;
  const pan = ctx.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 2.2; pan.maxDistance = 60; pan.rolloffFactor = 1.1;
  const gn = ctx.createGain(); gn.gain.value = 1.25;
  src.connect(an); src.connect(pan); pan.connect(gn); gn.connect(ctx.destination);
  P.voice = { el, src, an, pan, gn };
}
async function mpJoin() {
  if (mp.joined || mp.joining) return;
  mp.name = (mp.name || 'Guest').slice(0, 24); mp.joining = true; renderPeople();
  try {
    // the peer-to-peer library is embedded in this page (no separate file to upload)
    const srcEl = document.getElementById('trystero-src');
    const modUrl = srcEl ? URL.createObjectURL(new Blob([srcEl.textContent], { type: 'text/javascript' })) : new URL('vendor/trystero-nostr.min.js', location.href).href;
    const { joinRoom, selfId } = await import(modUrl);
    mp.selfId = selfId || '';
    const room = joinRoom({ appId: 'diwa-spatial-hub.oulu' }, mp.roomId);
    const [sendPose, getPose] = room.makeAction('pose');
    const [sendWb, getWb] = room.makeAction('wb'); WB.send = sendWb; getWb(o => wbApply(o, true));
    mp.room = room; mp.send = sendPose;
    getPose(onPose);
    room.onPeerJoin(id => { ensurePeer(id); try { sendPose(selfPose(), id); if (BOARDS.some(B => B.ops.length)) sendWb({ t: 'state', boards: BOARDS.map(B => B.ops) }, id); } catch { } if (mp.mic) room.addStream(mp.mic, id); });
    room.onPeerLeave(removePeer);
    room.onPeerStream((stream, id) => attachVoice(id, stream));
    mp.joined = true;
  } catch (e) { mp.failed = String(e.message || e); console.warn('shared session', e); }
  mp.joining = false; renderPeople();
}
// microphone is only requested the first time someone unmutes
async function startMic() {
  try {
    mp.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    mp.room?.addStream(mp.mic);
    const ctx = music.ensureCtx(); if (ctx) { ctx.resume(); const s = ctx.createMediaStreamSource(mp.mic); mp.an = ctx.createAnalyser(); mp.an.fftSize = 256; s.connect(mp.an); }
    return true;
  } catch { toast('Microphone not available — others can still see you'); return false; }
}
function mpLeave() {
  WB.send = null;
  try { mp.room?.leave(); } catch { }
  mp.mic?.getTracks().forEach(t => t.stop()); mp.mic = null; mp.an = null; mp.room = null; mp.send = null; mp.joined = false; mp.micOn = false;
  [...mp.peers.keys()].forEach(removePeer); renderPeople();
}
async function mpMute() {
  if (!mp.micOn && !mp.mic) { if (!(await startMic())) return; }
  mp.micOn = !mp.micOn; mp.mic?.getAudioTracks().forEach(t => t.enabled = mp.micOn);
  toast(mp.micOn ? 'Microphone on — people near you can hear you' : 'Microphone off', 1800); renderPeople();
}
function renderPeople() {
  const hostIn = /^siamak\b/i.test(mp.name || '') || [...mp.peers.values()].some(P => /^siamak\b/i.test(P.name || ''));
  const n = mp.peers.size + (mp.joined ? 1 : 0) + (hostIn ? 0 : 1); const b = $('#peopleBadge'); b.textContent = n; b.style.display = n ? '' : 'none';
  $('#btnPeople').classList.toggle('live', mp.joined);
  const f = $('#mpForm'), on = $('#mpOn'); f.style.display = mp.joined ? 'none' : ''; on.style.display = mp.joined ? '' : 'none';
  $('#mpJoin').textContent = mp.joining ? 'Connecting…' : 'Reconnect'; $('#mpJoin').disabled = mp.joining; $('#mpJoin').style.display = mp.joining || !entered ? 'none' : '';
  $('#mpState').textContent = mp.joining || !entered ? 'Connecting you to the room…' : 'Not connected to the shared room. Check the network and try again.';
  $('#mpRoom').textContent = mp.roomId;
  const row = (id, name, color, sub) => `<div class="person" data-id="${id}"><i style="background:${color}"></i><div><b></b><span>${sub}</span></div><em>${svg('speaker')}</em></div>`;
  const host = hostIn ? '' : `<div class="person host"><i style="background:#e6f6ff"></i><div><b>Siamak</b></div></div>`;   // Siamak is always listed, as a person
  $('#peopleList').innerHTML = (mp.joined ? row('me', '', mp.color, mp.micOn ? 'You · mic on' : 'You · muted') : '') + host + (mp.joined ? [...mp.peers.values()].map(P => row(P.id, '', P.color, P.voice ? 'Voice connected' : 'Connecting voice…')).join('') : '');
  $('#peopleList').innerHTML += state.layers.agents ? AGENTS.filter(A => !A.host).map(A => `<div class="person agent" data-id="ag-${A.i}"><i style="background:${A.color}"></i><div><b>${A.name}</b><span>Resident agent</span></div></div>`).join('') : '';
  $('#peopleList').querySelectorAll('.person:not(.agent):not(.host)').forEach(r => { const id = r.dataset.id; r.querySelector('b').textContent = id === 'me' ? mp.name : mp.peers.get(id)?.name || 'Guest'; });
  $('#mpMute').innerHTML = svg('mic') + (mp.micOn ? 'Mute' : 'Unmute'); $('#mpMute').classList.toggle('muted', !mp.micOn);
}
function mpInitUI() {
  $('#btnPeople').innerHTML = svg('people') + '<span class="count" id="peopleBadge" style="display:none">0</span>';
  $('#mpJoin').addEventListener('click', mpJoin); $('#mpMute').addEventListener('click', mpMute);
  addEventListener('pagehide', () => { try { mp.room?.leave(); } catch { } });
  $('#mpInvite').addEventListener('click', async () => {
    const u = new URL(location.href); u.search = ''; u.searchParams.set('room', mp.roomId);
    try { await navigator.clipboard.writeText(u.href); toast('Invite link copied'); } catch { prompt('Copy this invite link:', u.href); }
  });
  $('#mpInvite').innerHTML = svg('ext') + 'Copy invite link';
  renderPeople();
}
/* =====================================================================
   Resident agents — Emma, Suzan and Sofia live in the hall: they wander, visit tables,
   sit in the lounges and have silent chats with each other. Every action lasts 5–10 s.
   (Local to each visitor's view; they are not part of the shared session.)
   ===================================================================== */
const AGENT_DEFS = [{ name: 'Emma', color: '#e04fa0' }, { name: 'Suzan', color: '#00c7be' }, { name: 'Sofia', color: '#ff6b3d' }, { name: 'Siamak', color: '#3d8bff', host: true }];
const AGENTS = [];
const AG = { STAND: 1.62, SIT: 1.18, SPEED: 1.15 };
const rnd = (a, b) => a + Math.random() * (b - a);
function freeFloorPoint() {
  for (let k = 0; k < 40; k++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * .8, p = new THREE.Vector3(Math.cos(a) * HALL.rx * r, AG.STAND, Math.sin(a) * HALL.rz * r);
    if (p.z < -24 || p.z > 26) continue;                                        // keep off the media wall and the entrance
    if (tables.some(T => Math.hypot(p.x - T.site.pos[0], p.z - T.site.pos[1]) < T.site.r + 1.2)) continue;
    if (LOUNGES.some(L => Math.hypot(p.x - L.x, p.z - L.z) < 4.2)) continue;
    return p;
  }
  return new THREE.Vector3(rnd(-6, 6), AG.STAND, rnd(12, 18));
}
function buildAgents() {
  AGENT_DEFS.forEach((d, i) => {
    const av = makeAvatar(d.color, d.name);
    if (!d.host) av.tagEl.insertAdjacentHTML('beforeend', '<em class="ag-pill">agent</em>');
    if (!d.host) { av.disc.userData.agent = i; pickables.push(av.disc); }
    if (!d.host) { av.tagEl.style.pointerEvents = 'auto'; av.tagEl.style.cursor = 'pointer'; av.tagEl.addEventListener('click', e => { e.stopPropagation(); agentAttend(i); }); }
    const A = { ...d, i, av, pos: freeFloorPoint(), goal: null, seat: -1, state: 'idle', timer: rnd(1, 4), partner: null, talk: 0, turn: 0, label: 'arriving' };
    if (d.host) { const neck = new THREE.Mesh(new THREE.TorusGeometry(.068, .0075, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.6), toneMapped: false })); neck.rotation.x = Math.PI / 2; neck.position.y = -.215; av.bust.add(neck); }
    av.g.position.copy(A.pos); AGENTS.push(A);
  });
}
function agentGo(A, p, after, label) { A.goal = p.clone(); A.after = after; A.state = 'walk'; A.label = label; }
function agentFree(A) { A.seat = -1; if (A.partner) { const B = A.partner; A.partner = null; if (B.partner === A) { B.partner = null; B.state = 'idle'; B.timer = rnd(1, 3); } } }
/* reading: take a DIWA book from a shelf, read it on a seat (or show it to another agent), then put it back in its place */
function bookDrop(A) { if (!A.book) return; A.book.mesh.visible = true; A.book = null; A.av.hold = 0; A.av.read = false; }
function shelfFront(sh) { const p = new THREE.Vector3(), d = new THREE.Vector3(); sh.getWorldPosition(p); sh.getWorldDirection(d); d.y = 0; d.normalize(); return { at: p.clone().addScaledVector(d, .95).setY(AG.STAND), look: p }; }
function faceTo(A, p) { A.av.yaw = Math.atan2(-(p.x - A.pos.x), -(p.z - A.pos.z)); }
function agentBook(A, show) {
  const inUse = new Set(AGENTS.filter(B => B.book).map(B => B.book.mesh)), opts = [];
  SHELVES.forEach(sh => (sh.userData.books || []).forEach(m => { if (m.visible && !inUse.has(m)) opts.push([sh, m]); }));
  if (!opts.length) return false;
  const [sh, mesh] = opts[Math.floor(Math.random() * opts.length)], F = shelfFront(sh);
  agentGo(A, F.at, 'take', 'choosing a book');
  A.next = () => {                                                              // at the shelf: take the book
    faceTo(A, F.look); mesh.visible = false; A.book = { mesh, sh }; A.av.cover.color.copy(mesh.material[0].color); A.av.cover.emissive.copy(mesh.material[0].color); A.av.hold = 1;
    A.state = 'take'; A.timer = 1.2;
    A.next = () => {
      const others = AGENTS.filter(B => B !== A && !B.partner && !B.busy && !B.book && B.state !== 'walk' && !B.attending);
      const putBack = () => { agentFree(A); A.av.hold = 1; A.av.read = false; agentGo(A, F.at, 'putback', 'putting a book back');
        A.next = () => { faceTo(A, F.look); A.state = 'putback'; A.timer = 1.2; A.next = () => { bookDrop(A); agentNext(A); }; }; };
      if (show && others.length) {                                              // show the book to another agent and talk about it
        const B = others[Math.floor(Math.random() * others.length)]; agentFree(B);
        const m = freeFloorPoint(), off = new THREE.Vector3(.7, 0, 0); A.partner = B; B.partner = A; A.fixT = B.fixT = 10; A.av.hold = 2;
        agentGo(A, m.clone().add(off), 'chat', `showing ${B.name} a book`); agentGo(B, m.clone().sub(off), 'chat', `looking at a book with ${A.name}`);
        A.next = putBack;
      } else {                                                                  // read it on a free seat for ten seconds
        const taken = new Set(AGENTS.map(B => B.seat).concat([seated])), free = SEATS.map((S, k) => k).filter(k => !taken.has(k));
        if (!free.length) return putBack();
        const k = free[Math.floor(Math.random() * free.length)]; A.seat = k; A.fixT = 10;
        agentGo(A, SEATS[k].pos.clone().setY(AG.STAND), 'read', 'reading a book');
        A.next = () => { A.seat = -1; putBack(); };
      }
    };
  };
  return true;
}
function agentNext(A) {
  if (A.book) bookDrop(A); A.next = null;
  agentFree(A);
  const pick = Math.random(), others = AGENTS.filter(B => B !== A && !B.partner && !B.busy && B.state !== 'walk');
  if (pick < .3) {                                                             // look at a table
    const T = tables[Math.floor(Math.random() * tables.length)], a = Math.random() * Math.PI * 2;
    let p = new THREE.Vector3(T.site.pos[0] + Math.cos(a) * (T.site.r + .9), AG.STAND, T.site.pos[1] + Math.sin(a) * (T.site.r + .9));
    if (p.z < -24) p.z = T.site.pos[1] + Math.abs(Math.sin(a)) * (T.site.r + .9);
    agentGo(A, p, 'look', `looking at the ${T.site.name} table`);
  } else if (pick < .4 && agentBook(A, false)) {                              // read a book
  } else if (pick < .48 && others.length && agentBook(A, true)) {             // show a book to someone
  } else if (pick < .6) {                                                      // sit on a free seat
    const taken = new Set(AGENTS.map(B => B.seat).concat([seated])), free = SEATS.map((S, k) => k).filter(k => !taken.has(k));
    if (!free.length) return agentNext(A);
    const k = free[Math.floor(Math.random() * free.length)], S = SEATS[k];
    A.seat = k; agentGo(A, S.pos.clone().setY(AG.STAND), 'sit', `sitting in a lounge`);
  } else if (pick < .78 && others.length) {                                    // meet another agent for a silent chat
    const B = others[Math.floor(Math.random() * others.length)]; agentFree(B);
    const m = freeFloorPoint(), off = new THREE.Vector3(.75, 0, 0);
    A.partner = B; B.partner = A;
    agentGo(A, m.clone().add(off), 'chat', `chatting with ${B.name}`); agentGo(B, m.clone().sub(off), 'chat', `chatting with ${A.name}`);
  } else agentGo(A, freeFloorPoint(), 'pause', 'walking around');
}
const _ag = new THREE.Vector3();
// make sure the hall sees some reading: a book outing starts at least every 60–100 s (the first after about 20 s)
let bookClock = 20, bookShow = false;
function bookScheduler(dt) {
  bookClock -= dt; if (bookClock > 0) return;
  if (AGENTS.some(A => A.book || A.label === 'choosing a book')) { bookClock = 15; return; }
  const ok = AGENTS.filter(A => !A.busy && !A.partner && !A.attending && !A.book && ['idle', 'look', 'pause', 'sit'].includes(A.state));
  if (!ok.length) { bookClock = 5; return; }
  const A = ok[Math.floor(Math.random() * ok.length)]; A.next = null; agentFree(A);
  if (agentBook(A, bookShow)) { bookShow = !bookShow; bookClock = rnd(60, 100); } else bookClock = 10;
}
function updateAgents(dt, t) {
  if (state.layers.agents) bookScheduler(dt);
  AGENTS.forEach(A => {
    let level = 0;
    if (A.state === 'walk') {
      _ag.copy(A.goal).sub(A.pos); _ag.y = 0; const d = _ag.length();
      if (d < .08) {
        if (A.busy) { A.state = 'held'; const f = A.arrive; A.arrive = null; f && f(); }
        else { A.state = A.after; A.timer = A.fixT ?? (A.next && A.state !== 'chat' ? .01 : rnd(5, 10)); A.fixT = undefined; if (A.state === 'sit') A.label = 'sitting in a lounge';
          if (A.state === 'read') { A.av.hold = 2; A.av.read = true; const S = SEATS[A.seat]; if (S) faceTo(A, S.look || S.center); } }
      }
      else {
        _ag.multiplyScalar(Math.min(d, (A.busy ? A.speed : AG.SPEED) * dt) / d);
        // steer around the tables
        tables.forEach(T => { const dx = A.pos.x - T.site.pos[0], dz = A.pos.z - T.site.pos[1], r = Math.hypot(dx, dz), lim = T.site.r + .7; if (r < lim + .6 && r > .01) { const push = (lim + .6 - r) * dt * 2.2; _ag.x += dx / r * push; _ag.z += dz / r * push; } });
        A.pos.add(_ag);
      }
      A.pos.y = lerp(A.pos.y, AG.STAND, .1);
    } else if (A.busy) {
      A.pos.y = lerp(A.pos.y, AG.STAND, .1);                                  // on a task: wait where the task left her
    } else {
      A.timer -= dt;
      if (A.state === 'sit' || A.state === 'read') { if (seated === A.seat) A.timer = 0; const S = SEATS[A.seat]; if (S) A.pos.lerp(_ag.set(S.pos.x, AG.SIT, S.pos.z), .08); }
      if (A.state === 'chat') {
        const B = A.partner;
        if (!B) A.timer = 0;
        else if (B.state === 'chat') {                                       // take turns, like a real conversation
          faceTo(A, B.pos);
          if (A.i < B.i) { A.turn -= dt; if (A.turn <= 0) { A.turn = rnd(1.4, 3.2); A.talk = A.talk ? 0 : 1; B.talk = 1 - A.talk; } B.timer = A.timer; }
          level = A.talk ? .25 + .25 * Math.abs(Math.sin(t * 5.3 + A.i) * Math.sin(t * 2.1)) : 0;
        } else A.timer = Math.max(A.timer, 1);
      }
      if (A.timer <= 0) { if (A.next) { const f = A.next; A.next = null; f(); } else agentNext(A); }
    }
    if (A.speaking) level = tts.an ? Math.min(1, .15 + ttsLevel() * 5) : .28 + .26 * Math.abs(Math.sin(t * 6.1 + A.i) * Math.sin(t * 2.3));
    if (A._pp && A.state === 'walk') { const dx = A.pos.x - A._pp.x, dz = A.pos.z - A._pp.z; if (dx * dx + dz * dz > 1e-6) A.av.yaw = Math.atan2(-dx, -dz); } A._pp = (A._pp || new THREE.Vector3()).copy(A.pos);
    A.av.g.position.copy(A.pos); A.av.g.position.y += Math.sin(t * 1.1 + A.i * 2) * .015 + (A.state === 'walk' ? Math.abs(Math.sin(t * 6 + A.i)) * .02 : 0);
    animateAvatar(A.av, level, t);
  });
}

/* =====================================================================
   Agent tasks: Emma guides tours and greets visitors; all three host their own tables
   and show features on request (tap an agent, or ask the orb "show me the spring flood").
   Everything they say is prepared text: only the voice uses the cloud allowance.
   ===================================================================== */
const AGENT_ROLE = ['Tour guide · hosts OU, KE, SO', 'Site host · TA, PA, OR', 'Site host · KO, AR, VA', 'Creator of the DIWA Spatial Hub'];
const HOSTS = { oulanka: 0, kemijoki: 0, sodankyla: 0, tana: 1, pallas: 1, osp: 1, kokkola: 2, archipelago: 2, vantaanjoki: 2 };
const HOST_LINES = {
  oulanka: 'Welcome to the Oulankajoki River, our centre table and the first fully interactive supersite. The glowing globes are sensor stations; tap one to see its data.',
  kemijoki: 'This is the Kemijoki, Finland’s longest river. It flows from eastern Lapland to the Gulf of Bothnia and is used heavily for hydropower.',
  sodankyla: 'Sodankylä in central Lapland has a long tradition of Arctic research, with boreal forest, open fens and a long snow season.',
  tana: 'This is the Tana River on the border between Finland and Norway, one of Europe’s most important rivers for wild Atlantic salmon.',
  pallas: 'Welcome to Pallas in western Lapland, where long-term measurements follow the atmosphere, snow and ecosystems of the fells.',
  osp: 'This is the Oulu Region, where the Oulujoki river system meets the Gulf of Bothnia and towns, farms and peatlands share one catchment.',
  kokkola: 'Near Kokkola, sand and gravel eskers store groundwater beneath a flat coastal landscape.',
  archipelago: 'The Archipelago Sea has tens of thousands of islands, and its shallow waters respond quickly to what rivers carry from the land.',
  vantaanjoki: 'The Vantaanjoki flows through farmland and the Helsinki area, a key place to study how land use affects river water.',
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const AGX = { tour: null, speech: null, quiet: false, introduced: new Set(), greeted: new Set(), lastGreet: 0, cand: null, since: 0, check: 0 };
const visitorName = () => (mp.name && mp.name !== 'Guest') ? mp.name : '';

/* where an agent stands for each kind of stop: beside it, on the visitor's side, out of the middle of the view */
function standPoint(where) {
  const p = new THREE.Vector3(), side = new THREE.Vector3();
  const beside = (c, toward, out, across) => { const d = new THREE.Vector3(toward.x - c.x, 0, toward.z - c.z).normalize(); side.set(-d.z, 0, d.x); return p.copy(c).addScaledVector(d, out).addScaledVector(side, across).setY(AG.STAND); };
  if (where === 'home') return p.set(3.4, AG.STAND, 22.5);
  if (where === 'map') return beside(MAPB.g.position, new THREE.Vector3(0, 0, 0), 3.6, 3.4);
  if (where === 'news') return beside(NEWS.g.position, new THREE.Vector3(0, 0, 0), 3.6, -3.4);
  if (where === 'screen') return beside(SCREENS[1].center, new THREE.Vector3(0, 0, 0), 4.2, 6.4);
  const T = tableOf(where); if (!T) return p.set(0, AG.STAND, 20);
  const c = new THREE.Vector3(T.site.pos[0], 0, T.site.pos[1]);
  return beside(c, T.view().pos, T.site.r + .9, T.site.r * .62);
}
function occupy(A) {
  bookDrop(A); A.next = null; agentFree(A); if (A.seat >= 0) A.seat = -1;
  A.busy = true; A.state = 'held'; A.label = 'guiding a visitor';
}
function release(A, after = 4) { if (!A.busy) return; A.busy = false; A.state = 'idle'; A.timer = rnd(after, after + 3); A.label = 'walking around'; }
function goTo(A, p) {
  return new Promise(res => {
    const d = Math.hypot(p.x - A.pos.x, p.z - A.pos.z);
    A.goal = p.clone(); A.speed = Math.max(2.6, d / 3.2); A.state = 'walk'; A.arrive = res;
    setTimeout(() => { if (A.arrive === res) { A.pos.copy(p); A.state = 'held'; A.arrive = null; res(); } }, 6000);
  });
}
/* voices: the same voice settings as the orb; in the browser each agent gets her own voice where the device has several */
function agentVoice(A) {
  const L = voicePick.list.filter(v => /^en/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a)).filter(v => voiceScore(v) > 0);
  return L.length ? L[A.i % L.length] : voicePick.best;
}
function agentSay(A, text, explicit = true) {
  return new Promise(resolve => {
    agentHush();
    $('#agCapDot').style.background = A.color; $('#agCapName').textContent = A.name; $('#agCapText').textContent = text;
    $('#agStop').style.display = AGX.tour ? '' : 'none'; $('#agentCap').classList.add('show');
    let over = false;
    const done = () => {
      if (over) return; over = true; A.speaking = false; if (AGX.speech?.done === done) AGX.speech = null;
      music.duck(ORB.state === 'idle' ? 1 : .22);
      setTimeout(() => { if (!AGX.speech && !AGX.tour) $('#agentCap').classList.remove('show'); }, 2600);
      resolve();
    };
    AGX.speech = { A, done }; A.speaking = true; music.duck(.22);
    const readTime = 1600 + text.length * 58;
    if (!ai.speak || (!explicit && AGX.quiet)) { setTimeout(done, readTime); return; }
    const browser = () => {
      if (!('speechSynthesis' in window)) { setTimeout(done, readTime); return; }
      speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text);
      u.voice = agentVoice(A) || null; u.pitch = [1.05, .97, 1.12][A.i]; u.rate = 1; const t0 = performance.now();
      u.onend = done; u.onerror = () => setTimeout(done, Math.max(0, readTime - (performance.now() - t0)));   // no voice: leave the caption up long enough to read
      speechSynthesis.speak(u);
    };
    if (voicePlan().cloud) speakCloud(text, done).catch(browser); else browser();
    setTimeout(done, 5000 + text.length * 95);                                 // never wait forever
  });
}
function agentHush() { const s = AGX.speech; if (!s) return; AGX.speech = null; stopSpeaking(); s.done(); }
const intro = A => AGX.introduced.has(A.i) ? '' : (AGX.introduced.add(A.i), `Hi, I’m ${A.name}. `);

/* ---------- on-demand guide ---------- */
async function agentDo(A, go, act, line, after) {
  if (AGX.tour) stopTour();
  if (A.busy && A.task) return; A.task = true;
  occupy(A); closeAgentMenu(); act?.();
  await Promise.all([goTo(A, standPoint(go)), wait(1600)]);
  await agentSay(A, intro(A) + line);
  A.task = false; after?.(); release(A, 6);
}
const showScenTab = () => { try { siteTab = 'scen'; segSet($('#spTabs'), 'scen'); renderSiteTab(HERO); } catch (e) { } };
const AG_ACTIONS = {
  tour:   { label: 'Give me a tour', run: A => agentTour(A) },
  flood:  { label: 'Spring flood', run: A => agentDo(A, 'oulanka', () => { focusSite('oulanka'); setTimeout(() => { applyFlood('q50'); showScenTab(); }, 1800); },
            'This is an illustrative spring flood on the Oulankajoki at a one-in-fifty-year level, made for demonstration rather than from a flood model. Snowmelt lifts the river over its floodplain. You can compare all three flood levels in the Scenarios tab.') },
  ice:    { label: 'River ice', run: A => agentDo(A, 'oulanka', () => { focusSite('oulanka'); setTimeout(() => { applyIce('jam'); showScenTab(); }, 1800); },
            'Here is an illustrative river-ice season on the Oulankajoki, made for demonstration rather than from observations. Ice grows through the winter and breaks up in spring, and where broken ice piles up at a bend it can jam the river.') },
  winter: { label: () => state.season === 'winter' ? 'Show summer' : 'Show winter', run: A => { const w = state.season !== 'winter';
            agentDo(A, 'home', () => { goHome(); applySeason(w ? 'winter' : 'summer'); }, w ? 'This is the hall in winter. Every table and the forest outside are now covered in snow.' : 'And here is summer again, with green forests and open water on every table.'); } },
  night:  { label: () => state.night ? 'Back to daylight' : 'Northern lights', run: A => { const n = !state.night;
            agentDo(A, 'home', () => { goHome(); if (state.night !== n) toggleNight(); }, n ? 'At night the hall goes dark, and the northern lights and stars appear in the sky over the Oulanka forest. Look up through the glass.' : 'Daylight is back. You can switch between day and night any time with the moon button.'); } },
  pano:   { label: '360° photo', run: A => agentDo(A, 'oulanka', () => focusSite('oulanka'), 'Let me take you into a real 360° photo from the Oulankajoki riverside. Drag to look around, and close it when you’re done.', () => openPano(CONFIG.PANORAMAS[0].id)) },
  video:  { label: 'Video wall', run: A => agentDo(A, 'screen', () => focusScreen(1), 'On the video wall you can watch films about DIWA and the Oulanka Research Station. Walk close to a screen to play it, and click it for sound.') },
  map:    { label: 'Map of Finland', run: A => agentDo(A, 'map', () => focusMap(), 'This map shows all nine DIWA supersites, from the Tana River in the far north to the Archipelago Sea in the southwest. Tap a pulsing point to learn more.') },
};
function hostTable(id, A = AGENTS[HOSTS[id]]) { return agentDo(A, id, () => focusSite(id), HOST_LINES[id]); }

/* ---------- tour guide ---------- */
async function agentTour(A) {
  if (AGX.tour) stopTour();
  const tour = AGX.tour = { A, stop: false }; closeAgentMenu(); occupy(A); A.task = true;
  const nm = visitorName() ? ', ' + visitorName() : '';
  const steps = [
    { go: 'home', act: () => goHome(), say: `Welcome to the tour${nm}! I’m ${A.name}. Follow me through the DIWA Spatial Hub.` },
    { go: 'oulanka', act: () => focusSite('oulanka'), say: 'This is the Oulankajoki River in Oulanka National Park, our centre table and the first fully interactive supersite. The small glowing globes are public sensor stations, coloured by what they measure.' },
    { go: 'map', act: () => focusMap(), say: 'This map shows all nine DIWA supersites across Finland, from the Tana River in the far north to the Archipelago Sea in the southwest.' },
    { go: 'kemijoki', act: () => focusSite('kemijoki'), say: 'The Kemijoki is Finland’s longest river. Every table follows the seasons: watch it turn to winter for a moment.',
      during: async () => { const s0 = state.season; await wait(2200); if (tour.stop) return; applySeason(s0 === 'winter' ? 'summer' : 'winter'); await wait(4200); applySeason(s0); } },
    { go: 'archipelago', act: () => focusSite('archipelago'), say: 'The Archipelago Sea has tens of thousands of islands. Its shallow waters respond quickly to what rivers carry from the land.' },
    { go: 'screen', act: () => focusScreen(1), say: 'On the video wall you can watch films about DIWA and the Oulanka Research Station. Walk close to a screen to play it.' },
    { go: 'home', act: () => goHome(), say: 'That’s the tour! Tap Suzan, Sofia or me any time to see the spring flood, river ice, winter or the northern lights, and ask the orb anything.' },
  ];
  AGX.introduced.add(A.i);
  for (const S of steps) {
    if (tour.stop) break;
    S.act(); await Promise.all([goTo(A, standPoint(S.go)), wait(1700)]);
    if (tour.stop) break;
    const sp = agentSay(A, S.say); S.during?.(); await sp;
    if (tour.stop) break; await wait(600);
  }
  if (AGX.tour === tour) AGX.tour = null;
  A.task = false; release(A, 5); $('#agStop').style.display = 'none';
}
function stopTour() { if (!AGX.tour) return; AGX.tour.stop = true; AGX.tour = null; agentHush(); $('#agentCap').classList.remove('show'); }

/* ---------- greeter: welcomes each visitor after the entry flight ---------- */
async function greetVisitor() {
  const A = AGENTS[0]; if (!A || !state.layers.agents || AGX.tour || A.task) return;
  A.task = true; occupy(A);
  await Promise.race([goTo(A, standPoint('home')), wait(2500)]);
  const nm = visitorName() ? ', ' + visitorName() : '';
  AGX.introduced.add(0);
  await agentSay(A, `Welcome to the DIWA Spatial Hub${nm}! I’m Emma. Suzan, Sofia and I are around the hall. If you need anything, just click one of us.`, false);
  A.task = false; release(A, 5);
}

/* ---------- site hosts: greet a visitor who stays at one of their tables ---------- */
function hostCheck(dt) {
  return;   // agents no longer offer help on their own: visitors click them when they want something
  const now = performance.now(); if (now < AGX.check) return; AGX.check = now + 500;   // twice a second, in real time
  if (!entered || AGX.tour || AGX.speech || pano.active || !state.layers.agents || ORB.state !== 'idle' || ai.listening || flight || renderer.xr.isPresenting) return;
  if (now - AGX.lastGreet < 25000) return;
  const cp = camera.position; let best = null;
  tables.forEach(T => { const d = Math.hypot(cp.x - T.site.pos[0], cp.z - T.site.pos[1]); if (d < T.site.r + 7 && cp.y < 9.5 && (!best || d < best.d)) best = { T, d }; });
  const id = best?.T.site.id;
  if (!id || AGX.greeted.has(id)) { AGX.cand = null; return; }
  if (AGX.cand !== id) { AGX.cand = id; AGX.since = now; return; }
  if (now - AGX.since < 1500) return;
  const A = AGENTS[HOSTS[id]]; if (A.task) return;
  AGX.greeted.add(id); AGX.lastGreet = now; hostGreet(A, id);
}
async function hostGreet(A, id) {
  A.task = true; occupy(A);
  await Promise.race([goTo(A, standPoint(id)), wait(2600)]);
  await agentSay(A, intro(A) + HOST_LINES[id], false);
  A.task = false; release(A, 6);
}

/* ---------- tap an agent: a small menu of what she can show ---------- */
let agentMenuFor = -1;
// clicked: the agent stops, turns to the visitor for two seconds, then offers help
function agentAttend(i) {
  const A = AGENTS[i]; if (!A || A.host || !state.layers.agents || A.attending) return;
  if (!A.busy) { if (A.state === 'walk') { A.goal = null; A.arrive = null; } if (A.seat < 0) A.state = 'held'; A.attending = true; }
  A.av.yaw = undefined;
  setTimeout(() => openAgentMenu(i), 2000);
}
function openAgentMenu(i) {
  const A = AGENTS[i]; if (!A || A.host || !state.layers.agents) return; agentMenuFor = i;
  $('#amDot').style.background = A.color; $('#amName').textContent = A.name; $('#amRole').textContent = AGENT_ROLE[i];
  $('#amGrid').innerHTML = Object.entries(AG_ACTIONS).map(([k, a]) => `<button class="am-act${k === 'tour' ? ' main' : ''}" data-k="${k}">${typeof a.label === 'function' ? a.label() : a.label}</button>`).join('');
  $('#amSites').innerHTML = '<span>Her tables</span>' + Object.entries(HOSTS).filter(([, h]) => h === i).map(([id]) => `<button class="am-site" data-site="${id}">${siteCode(SITE[id])} · ${SITE[id].name.replace(' Research Station', '').replace(' Groundwater Area', '')}</button>`).join('');
  $('#amSites').style.display = Object.values(HOSTS).includes(i) ? '' : 'none';
  $('#agentMenu').classList.add('show');
}
function closeAgentMenu() { const A = AGENTS[agentMenuFor]; if (A && A.attending) { A.attending = false; if (!A.busy && A.seat < 0) { A.state = 'idle'; A.timer = rnd(2, 4); } } $('#agentMenu').classList.remove('show'); agentMenuFor = -1; }
function setupAgentUI() {
  $('#amClose').addEventListener('click', closeAgentMenu);
  $('#amGrid').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b && agentMenuFor >= 0) AG_ACTIONS[b.dataset.k].run(AGENTS[agentMenuFor]); });
  $('#amSites').addEventListener('click', e => { const b = e.target.closest('[data-site]'); if (b && agentMenuFor >= 0) hostTable(b.dataset.site, AGENTS[agentMenuFor]); });
  $('#agStop').addEventListener('click', () => { stopTour(); goHome(); });
}

/* ---------- requests to the orb that an agent can handle without the AI ---------- */
const SITE_WORDS = { oulanka: /oulanka/, tana: /\b(tana|teno)\b/, pallas: /pallas/, sodankyla: /sodankyl/, kemijoki: /kemijoki/, osp: /oulu region|\boulu\b/, kokkola: /kokkola/, archipelago: /archipelago/, vantaanjoki: /vantaa/ };
function agentCommand(text) {
  const t = text.toLowerCase();
  const named = AGENTS.find(A => !A.host && new RegExp('\\b' + A.name.toLowerCase() + '\\b').test(t));
  const asks = /\b(show|take|bring|guide|tour|go to|let me see|can i see|i want to see|open)\b/.test(t);
  if (named && state.layers.agents && /\b(come|here|over here|join me|follow me)\b/.test(t) || named && t.replace(/[^a-z ]/g, '').trim() === named.name.toLowerCase()) return { A: named, come: true };
  if ((!named && !asks) || !state.layers.agents) return null;
  let key = null, site = null;
  if (/\btour\b|show me around|guide me/.test(t)) key = 'tour';
  else if (/flood/.test(t)) key = 'flood';
  else if (/\bice\b|ice jam|frozen river/.test(t)) key = 'ice';
  else if (/northern light|aurora|\bnight\b/.test(t)) key = state.night ? null : 'night';
  else if (/daylight|\bday\b/.test(t)) key = state.night ? 'night' : null;
  else if (/winter|snow/.test(t)) key = state.season === 'winter' ? null : 'winter';
  else if (/summer/.test(t)) key = state.season === 'winter' ? 'winter' : null;
  else if (/360|panorama|photo/.test(t)) key = 'pano';
  else if (/video|film|movie/.test(t)) key = 'video';
  else if (/\bmap\b/.test(t)) key = 'map';
  else site = Object.keys(SITE_WORDS).find(k => SITE_WORDS[k].test(t)) || null;
  if (!key && !site) return named ? { A: named, help: true } : null;
  const A = named || (site ? AGENTS[HOSTS[site]] : key === 'tour' ? AGENTS[0] : AGENTS.filter(B => !B.task && !B.host).sort((a, b) => a.pos.distanceTo(camera.position) - b.pos.distanceTo(camera.position))[0] || AGENTS[0]);
  return { A, key, site };
}
function runAgentCommand(c) {
  if (c.come) return agentCome(c.A);
  if (c.help) return agentSay(c.A, intro(c.A) + 'I can give you a tour, or show you the spring flood, river ice, winter, the northern lights, a 360° photo, the video wall or the map. Just ask!');
  if (c.site) return hostTable(c.site, c.A);
  AG_ACTIONS[c.key].run(c.A);
}

// called by name: walk over to the visitor, stop a little in front of them and turn to face them
async function agentCome(A) {
  occupy(A); const cam = camera.position, f = new THREE.Vector3(); camera.getWorldDirection(f); f.y = 0; f.normalize();
  const p = new THREE.Vector3(cam.x + f.x * 2.2, AG.STAND, cam.z + f.z * 2.2);
  await goTo(A, p); A.av.yaw = undefined;
  await agentSay(A, `Hi${visitorName() ? ' ' + visitorName() : ''}, I’m here. Click me to see what I can do for you.`);
  release(A, 25);
}
function agentsSummary() { return AGENTS.map(A => `${A.name} is ${A.label}`).join('; '); }
/* for testing without a network: __hub.simulatePeer('id', 'Name', '#ff9f0a', [x, y, z], yaw) */
function simulatePeer(id, n, c, p, y = 0, talk) { onPose({ p, y, x: 0, n, c }, id); const P = mp.peers.get(id); if (talk !== undefined) P.simLevel = talk; return P; }

/* =====================================================================
   v0.7 — DIWA assets, video wall, lounges, whiteboard, news, map, night extras
   ===================================================================== */
const ASSET = { logo: '%%LOGO%%', logoWhite: '%%LOGO_WHITE%%', drops: '%%DROPS%%', map: '%%MAP%%', mapBP: '%%MAPBP%%', catBP: '%%CATBP%%' };
const DIWA = { light: '#4ca9ff', blue: '#1770b8', navy: '#0c2a4c', ink: '#0d1b2a', paper: '#f5f8fc' };
const imgCache = {};
function loadImg(src) { return imgCache[src] ||= new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
const siteCode = s => s.code || s.name.slice(0, 2).toUpperCase();
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function wrapText(c, text, x, y, maxW, lh, maxLines = 99) {
  const words = text.split(' '); let line = '', n = 0;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y + n * lh); line = w; if (++n >= maxLines) return n; } else line = t; }
  if (line) c.fillText(line, x, y + n * lh); return n + 1;
}
/* a texture that can be redrawn later (e.g. when an image has loaded) */
function liveCanvas(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const redraw = async () => { await draw(g, w, h); t.needsUpdate = true; }; redraw();
  return { tex: t, cv, g, redraw };
}
function standBoard(parent, W, H, y0, frameColor = 0x2a2f37) {
  const m = new THREE.MeshPhysicalMaterial({ color: frameColor, roughness: .35, metalness: .4, clearcoat: .8 });
  const f = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(W + .14, H + .14, .1), { depth: .06, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 3, curveSegments: 10 }), m);
  f.position.set(0, y0 + H / 2, -.09); f.castShadow = true; parent.add(f);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, y0 + H * .5, 12), m); leg.position.set(sx * W * .38, (y0 + H * .5) / 2, -.06); leg.castShadow = true; parent.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.12, .04, .7), m); foot.position.set(sx * W * .38, .02, -.06); parent.add(foot); }
  return m;
}
function labelAt(parent, y, html, cls, onClick) {
  const el = document.createElement('div'); el.innerHTML = `<div class="lbl small ${cls || ''}">${html}</div>`;
  const o = new CSS2DObject(el); o.position.y = y; parent.add(o);
  el.firstElementChild.addEventListener('click', e => { e.stopPropagation(); onClick(); }); return el.firstElementChild;
}
function faceFrom(pos, look, lift = 1.7, dist = 5.5) { const d = new THREE.Vector3(look.x - pos.x, 0, look.z - pos.z).normalize(); return { pos: pos.clone().addScaledVector(d, dist).setY(lift + .4), tgt: pos.clone().setY(lift) }; }
function enterSpot(kind) { endStory(true); closeAllPanels(); standUp(); closeMapCard(); focus.kind = kind; focus.id = null; setDockCurrent(null); setLabelsFocus(null, true); $('#timeline').classList.remove('show'); $('#wbBar').classList.toggle('show', kind === 'wb'); }

/* ---------- video wall: three large YouTube screens ---------- */
const SCREENS = [];
function buildScreens() {
  const W = 14.4, Hh = 8.1, y0 = 1.8, R = .45;
  CONFIG.SCREENS.forEach((cfg, i) => {
    const k = i - 1, x = k * 16.5, z = -Math.sqrt(1 - (x / HALL.rx) ** 2) * HALL.rz * .84;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.lookAt(0, 0, 8); scene.add(g);
    const frameM = new THREE.MeshPhysicalMaterial({ color: 0x1c2128, roughness: .3, metalness: .45, clearcoat: 1, clearcoatRoughness: .18 });
    const fg = new THREE.ExtrudeGeometry(roundedRectShape(W + .4, Hh + .4, R + .2), { depth: .14, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 5, curveSegments: 18 }); fg.translate(0, 0, -.22);
    const frame = new THREE.Mesh(fg, frameM); frame.position.set(0, y0 + Hh / 2, 0); frame.castShadow = true; g.add(frame);
    const halo = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(W + .7, Hh + .7, R + .35), 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(.45, .85, 1.5), toneMapped: false, transparent: true, opacity: .18, depthWrite: false }));
    halo.position.set(0, y0 + Hh / 2, -.3); g.add(halo);
    for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .15, y0 + 1, 24), frameM); post.position.set(sx * W * .3, (y0 + 1) / 2, -.18); post.castShadow = true; g.add(post); }
    const punch = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending, side: THREE.DoubleSide });
    const vr = new THREE.MeshBasicMaterial({ map: canvasTex(1280, 720, (c, w, h) => {
      const grd = c.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * .7); grd.addColorStop(0, '#173254'); grd.addColorStop(1, '#05080d'); c.fillStyle = grd; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.font = `650 56px ${DS.font}`; c.textAlign = 'center'; c.fillText(cfg.title, w / 2, h / 2); c.globalAlpha = .6; c.font = `500 28px ${DS.font}`; c.fillText('Video plays on desktop browsers', w / 2, h / 2 + 60);
    }) });
    const mesh = new THREE.Mesh(normalizeUV(new THREE.ShapeGeometry(roundedRectShape(W, Hh, R), 18), W, Hh), punch);
    mesh.position.set(0, y0 + Hh / 2, 0); mesh.userData.screen = i; g.add(mesh); pickables.push(mesh);
    const el = document.createElement('div'); el.className = 'live-screen'; el.style.borderRadius = Math.round(R / W * 1280) + 'px';
    el.innerHTML = `<div class="poster thumb-poster" style="background-image:url('${cfg.thumb || `https://i.ytimg.com/vi/${cfg.id}/hqdefault.jpg`}')"><div><i class="play-ic"></i>${cfg.thumb ? '' : `<b>${cfg.title}</b>`}<span>Walk closer to play</span></div></div>`;
    g.updateMatrixWorld();
    const css = new CSS3DObject(el); css.position.copy(g.localToWorld(mesh.position.clone())); css.quaternion.copy(g.quaternion); css.scale.setScalar(W / 1280); scene.add(css);
    const S = { i, cfg, g, mesh, punch, vr, el, iframe: null, muted: true, playing: false, center: g.localToWorld(mesh.position.clone()) };
    S.lbl = labelAt(g, y0 + Hh + .9, `<div class="ic">${svg('live')}</div><div>${cfg.title}<small>${cfg.sub} · <span class="snd">muted</span></small></div>`, 'live', () => focusScreen(i));
    SCREENS.push(S);
  });
}
function ytCmd(S, func, args = []) { try { S.iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch { } }
function ensureIframe(S) {
  if (S.iframe) return; screensArmed = true;
  const f = document.createElement('iframe'); const id = S.cfg.id;
  f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${id}&start=${S.cfg.start || 0}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  f.addEventListener('load', () => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'scr' + S.i }), '*'); } catch { } });
  S.el.appendChild(f); S.iframe = f; S.playing = true;
}
let screensArmed = false, screenAcc = 0;
function updateScreens(dt) {
  if (!screensArmed || pano.active) return; screenAcc += dt; if (screenAcc < .5) return; screenAcc = 0;
  let active = null, best = 22;                       // only the nearest screen within 22 m plays
  SCREENS.forEach(S => { const d = camera.position.distanceTo(S.center); if (d < best) { best = d; active = S; } });
  SCREENS.forEach(S => {
    if (S === active) { ensureIframe(S); S.iframe.classList.add('on'); if (!S.playing) { ytCmd(S, 'playVideo'); S.playing = true; } }
    else if (S.iframe && S.playing) { ytCmd(S, 'pauseVideo'); S.playing = false; S.iframe.classList.remove('on'); if (!S.muted) setScreenSound(S, false); }
  });
}
function setScreenSound(S, on) {
  S.muted = !on; ensureIframe(S); S.iframe.classList.add('on');
  if (on) { SCREENS.forEach(o => { if (o !== S && !o.muted) setScreenSound(o, false); }); ytCmd(S, 'unMute'); ytCmd(S, 'setVolume', [100]); ytCmd(S, 'playVideo'); }
  else ytCmd(S, 'mute');
  S.lbl.querySelector('.snd').textContent = on ? 'sound on' : 'muted';
  S.lbl.classList.toggle('sound', on);
  music.duck(SCREENS.some(o => !o.muted) ? .15 : 1);
}
function focusScreen(i) {
  const S = SCREENS[i]; enterSpot('screen'); focus.id = 'screen' + i;
  ensureIframe(S);
  const cp = S.g.localToWorld(new THREE.Vector3(0, 5.9, 12.5)), tg = S.g.localToWorld(new THREE.Vector3(0, 5.85, 0));
  flyTo(cp, tg, 1800, () => toast('Click the screen to turn the sound on or off', 2600));
}
function focusLive() {
  enterSpot('wall');
  flyTo(new THREE.Vector3(0, 6.4, 6), new THREE.Vector3(0, 5.6, -28), 1900, () => toast('Walk up to a screen to play it · click it for sound', 2600));
}
function onScreenClick(i) { const S = SCREENS[i]; if (focus.kind === 'screen' && focus.id === 'screen' + i) setScreenSound(S, S.muted); else focusScreen(i); }

/* ---------- brochures with the DIWA identity ---------- */
function brochureTex(kind) {
  return liveCanvas(600, 860, async (c, w, h) => {
    if (kind === 0) {
      const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, DIWA.navy); g.addColorStop(1, DIWA.blue); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(76,169,255,.45)'; c.lineWidth = 6;
      for (let k = 0; k < 6; k++) { c.beginPath(); for (let x = 0; x <= w; x += 10) c.lineTo(x, 560 + k * 34 + 22 * Math.sin(x / 70 + k)); c.stroke(); }
      const L = await loadImg(ASSET.logoWhite); if (L) c.drawImage(L, 50, 60, 260, 260 * L.height / L.width);
      c.fillStyle = '#fff'; c.font = `700 58px ${DS.font}`; wrapText(c, 'Immersive DIWA Supersites', 50, 290, 500, 66);
      c.fillStyle = 'rgba(255,255,255,.82)'; c.font = `500 26px ${DS.font}`; wrapText(c, 'Spatial computing and digital twins of Finland’s water research sites', 50, 440, 500, 36);
      c.fillStyle = DIWA.light; c.fillRect(50, 790, 120, 6); c.fillStyle = '#fff'; c.font = `600 22px ${DS.font}`; c.fillText('Oulanka Research Station', 50, 830);
    } else {
      c.fillStyle = DIWA.paper; c.fillRect(0, 0, w, h);
      c.fillStyle = DIWA.light; c.fillRect(0, 0, w, 16); c.fillStyle = DIWA.blue; c.fillRect(0, 16, w * .6, 8);
      const L = await loadImg(ASSET.logo); if (L) c.drawImage(L, 50, 70, 260, 260 * L.height / L.width);
      c.fillStyle = DIWA.ink; c.font = `700 54px ${DS.font}`; wrapText(c, 'Oulankajoki Supersite', 50, 300, 500, 62);
      c.fillStyle = '#4a5a6c'; c.font = `500 26px ${DS.font}`; wrapText(c, 'Snow, soil, river and weather monitoring in Oulanka, Kuusamo', 50, 440, 500, 36);
      const g = c.createLinearGradient(0, 560, 0, 800); g.addColorStop(0, DIWA.light); g.addColorStop(1, DIWA.blue); c.fillStyle = g; rrect(c, 50, 560, 500, 230, 24); c.fill();
      c.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(110 + k * 120, 675, 26, 0, 7); c.fill(); }
      c.fillStyle = DIWA.blue; c.font = `600 22px ${DS.font}`; c.fillText('Digital Waters Flagship', 50, 830);
    }
  }).tex;
}

/* ---------- lounges: sofa + armchairs, coffee table with brochures ---------- */
const LOUNGES = [new THREE.Vector3(-24, 0, 19), new THREE.Vector3(24, 0, 19), new THREE.Vector3(-33, 0, 3)];   // the fourth set now faces the DIWA Knowledge panel
const SEATS = [];
let _chair;
function chairGeo() {
  if (_chair) return _chair;
  const parts = [], add = (w, h, d, x, y, z, r = .08) => { const g = new RoundedBoxGeometry(w, h, d, 3, r); g.translate(x, y, z); parts.push(g); };
  add(.92, .34, .88, 0, .3, 0); add(.92, .74, .2, 0, .66, -.36, .09); add(.17, .5, .88, -.42, .5, 0, .07); add(.17, .5, .88, .42, .5, 0, .07);
  const cush = new RoundedBoxGeometry(.66, .14, .7, 3, .06); cush.translate(0, .52, .06);
  return _chair = { body: mergeGeometries(parts), cush };
}
function buildLounge(L, li) {
  const g = new THREE.Group(); g.position.copy(L); scene.add(g);
  const face = Math.atan2(-L.z, -L.x), back = face + Math.PI, span = .82 * Math.PI;
  const fabric = new THREE.MeshStandardMaterial({ color: li % 2 ? 0x13233a : 0x17283f, roughness: .7, metalness: .1 });
  const fabric2 = new THREE.MeshStandardMaterial({ color: li % 2 ? 0x1d3352 : 0x213a5c, roughness: .75 });
  const pillowM = [0x2fb4ff, 0x1a5fb4, 0x7fe0ff].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .6, emissive: c, emissiveIntensity: .12 }));
  const rug = new THREE.Mesh(new THREE.CircleGeometry(4.2, 96), new THREE.MeshStandardMaterial({ color: 0x08111e, roughness: .5, metalness: .3 })); rug.rotation.x = -Math.PI / 2; rug.position.y = .02; rug.receiveShadow = true; g.add(rug);
  const rugEdge = new THREE.Mesh(new THREE.RingGeometry(4.12, 4.2, 128), hudMat(HUD_COMET_FS, { uSpeed: { value: .4 }, uBase: { value: .35 } }, { blending: THREE.AdditiveBlending })); rugEdge.rotation.x = -Math.PI / 2; rugEdge.position.y = .022; g.add(rugEdge);
  const a0 = -(back + span / 2), a1 = -(back - span / 2);
  const seat = new THREE.Mesh(slab(sectorShape(2.05, 2.95, a0, a1), .3), fabric); seat.position.y = .12; seat.castShadow = seat.receiveShadow = true; g.add(seat);
  const cush = new THREE.Mesh(slab(sectorShape(2.1, 2.85, a0 + .02, a1 - .02), .1, .05), fabric2); cush.position.y = .48; cush.castShadow = true; g.add(cush);
  const backrest = new THREE.Mesh(slab(sectorShape(2.8, 3.1, a0, a1), .82), fabric); backrest.position.y = .12; backrest.castShadow = true; g.add(backrest);
  for (const a of [a0, a1]) { const arm = new THREE.Mesh(slab(sectorShape(2.0, 3.1, a - .07, a + .07, 6), .5), fabric); arm.position.y = .12; arm.castShadow = true; g.add(arm); }
  const seatHit = (x, z, y = 1.18) => { const idx = SEATS.length; SEATS.push({ pos: new THREE.Vector3(x, y, z).add(L), center: L.clone() });
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.1, 12), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x, .6, z); hit.userData.seat = idx; g.add(hit); pickables.push(hit); };
  const N = 4;
  for (let i = 0; i < N; i++) {
    const a = back - span / 2 + span * (i + .5) / N, x = Math.cos(a) * 2.48, z = Math.sin(a) * 2.48; seatHit(x, z);
    const p = new THREE.Mesh(new THREE.BoxGeometry(.5, .42, .16, 3, 3, 1), pillowM[i % 3]);
    p.geometry.attributes.position.array.forEach((v, k, arr) => { if (k % 3 === 2) arr[k] = v * (1 - .5 * Math.abs(arr[k - 1] / .21) ** 2); });
    p.position.set(Math.cos(a) * 2.78, .84, Math.sin(a) * 2.78); p.lookAt(0, .84, 0); p.rotation.x -= .18; p.castShadow = true; g.add(p);
  }
  // two single armchairs on the open side, facing the coffee table
  const cg = chairGeo();
  for (const s of [-1, 1]) {
    const a = face + s * .78, x = Math.cos(a) * 2.25, z = Math.sin(a) * 2.25;
    const ch = new THREE.Group(); ch.position.set(x, 0, z); ch.lookAt(0, 0, 0); g.add(ch);
    const body = new THREE.Mesh(cg.body, fabric); body.castShadow = body.receiveShadow = true;
    const cu = new THREE.Mesh(cg.cush, pillowM[s > 0 ? 0 : 1]); cu.castShadow = true;
    for (const lx of [-.36, .36]) for (const lz of [-.32, .32]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.025, .02, .14, 8), new THREE.MeshStandardMaterial({ color: 0x3a2c22 })); leg.position.set(lx, .07, lz); ch.add(leg); }
    body.position.y = .1; cu.position.y = .1; ch.add(body, cu); seatHit(x, z, 1.15);
  }
  // coffee table with two DIWA brochures
  const wood = new THREE.MeshPhysicalMaterial({ color: 0x0c1a2c, roughness: .15, metalness: .4, clearcoat: 1, emissive: 0x041428 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .07, 64), wood); top.position.y = .46; top.castShadow = top.receiveShadow = true; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(.2, .32, .42, 32), new THREE.MeshStandardMaterial({ color: 0x2c2f35, roughness: .4, metalness: .5 })); leg.position.y = .21; g.add(leg);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.06, .05, .11, 20), new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: .3 })); cup.position.set(.45, .55, -.35); g.add(cup);
  const paper = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: .8 });
  [[-.22, .1, .35], [.3, .05, -.45]].forEach(([bx, bz, rot], k) => {
    const cover = new THREE.MeshStandardMaterial({ map: brochureTex((k + li) % 2), roughness: .55 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(.4, .012, .57), [paper, paper, cover, paper, paper, paper]);
    b.position.set(bx, .503 + k * .013, bz); b.rotation.y = face + Math.PI / 2 + rot; b.castShadow = true; g.add(b);
  });
  // floor lamp
  const lampA = back + span / 2 + .3, lx = Math.cos(lampA) * 3.05, lz = Math.sin(lampA) * 3.05;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.9, 12), leg.material); pole.position.set(lx, .95, lz); g.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.24, .34, .36, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fdcff, emissive: 0x2fb6ff, emissiveIntensity: .6, side: THREE.DoubleSide, roughness: .8 }));
  shade.position.set(lx, 1.95, lz); g.add(shade); NIGHT.emissive.push([shade.material, .6, 2.2]);
  const lglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x4fc3ff, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })); lglow.scale.setScalar(2.4); lglow.position.set(lx, 1.95, lz); g.add(lglow); NIGHT.sprites.push([lglow.material, .35, .9]);
  buildWhiteboard(L.clone().add(new THREE.Vector3(Math.cos(back) * 4.7, 0, Math.sin(back) * 4.7)), L);
  [[-(span / 2 + .42), 3.35], [2.02, 3.3]].forEach(([o, r]) => { const sa = back + o, shelf = makeBookshelf(); shelf.position.set(Math.cos(sa) * r, 0, Math.sin(sa) * r); g.add(shelf); shelf.lookAt(L.x, 0, L.z); SHELVES.push(shelf); });   // one beside the sofa, one between the lamp and the armchair
  labelAt(g, 2.9, `<div class="ic">${svg('sofa')}</div><div>Lounge ${li + 1}<small>Sit and talk together</small></div>`, '', () => focusLounge(li));
}
function buildLounges() { LOUNGES.forEach(buildLounge); }
/* cozy bookshelf in the hologram style: dark metal frame, cyan-lit shelf edges, books in blues */
const SPINE_TITLES = ['Digital Waters', 'DIWA Annual Review', 'Snow and Soil', 'Boreal Rivers', 'Peatland Hydrology', 'River Ice Dynamics', 'Groundwater of Finland', 'Sensing the North', 'Water Quality Atlas', 'Floods and Forecasts', 'Spatial Data Architecture', 'Catchment Science', 'Arctic Hydrology', 'Oulanka Field Notes', 'Climate and Water', 'Digital Twins of Rivers', 'Sensor Networks', 'Baltic Coastal Waters', 'Lakes of Finland', 'From Data to XR', 'Nordic Hydrology', 'Water Futures', 'Frost and Thaw', 'Remote Sensing of Snow'];
const SPINE_COLS = [['#1a3a66', '#e6f6ff'], ['#23518a', '#ffffff'], ['#0f2a4c', '#7fe3ff'], ['#2f6bb0', '#ffffff'], ['#5aa7e0', '#06203e'], ['#d8e8f6', '#0c2a4c'], ['#163055', '#ffd27a'], ['#3c86c8', '#ffffff']];
const _spine = {};
function spineMat(k) {
  if (_spine[k]) return _spine[k];
  const [bg, fg] = SPINE_COLS[k % SPINE_COLS.length], cv = document.createElement('canvas'); cv.width = 64; cv.height = 512; const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, 64, 512); c.fillStyle = fg; c.globalAlpha = .7; c.fillRect(0, 22, 64, 4); c.fillRect(0, 486, 64, 4); c.globalAlpha = 1;
  c.save(); c.translate(32, 256); c.rotate(Math.PI / 2); c.fillStyle = fg; c.font = `700 30px ${DS.font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(SPINE_TITLES[k % SPINE_TITLES.length], 0, 1, 430); c.restore();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const side = new THREE.MeshStandardMaterial({ color: bg, roughness: .55, emissive: bg, emissiveIntensity: .12 });
  return _spine[k] = [side, side, side, side, new THREE.MeshStandardMaterial({ map: tex, roughness: .5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .18 }), side];
}
const SHELVES = [];
const KN_BOOKS = ['Digital Waters · DIWA Flagship', 'Rivers of the Boreal North', 'Snow, Soil and Peatlands', 'Sensing Finnish Waters', 'Ice, Floods and a Changing Climate', 'Spatial Computing for Hydrology'];
function makeBookshelf() {
  const g = new THREE.Group(), W = 1.6, H = 1.0, Dp = .36, r = mulberry32(Math.floor(Math.random() * 1e6));
  const metal = new THREE.MeshStandardMaterial({ color: 0x0b1626, roughness: .3, metalness: .75, emissive: 0x020812 });
  const box = (w, h, d, x, y, z, m = metal) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  box(.05, H, Dp, -W / 2, H / 2, 0); box(.05, H, Dp, W / 2, H / 2, 0); box(W, H, .03, 0, H / 2, -Dp / 2 + .015, new THREE.MeshStandardMaterial({ color: 0x07101c, roughness: .5, metalness: .4 }));
  const edge = new THREE.MeshBasicMaterial({ color: new THREE.Color(.35, .95, 1.8), toneMapped: false });
  const shelfY = [.06, .5, H - .02];
  shelfY.forEach(y => { box(W, .035, Dp, 0, y, 0); box(W - .02, .008, .01, 0, y + .021, Dp / 2 - .004, edge); });
  const cols = [0x1a3a66, 0x23518a, 0x0f2a4c, 0x2f6bb0, 0x5aa7e0, 0xd8e8f6, 0x163055, 0x3c86c8];
  const bm = cols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .55, metalness: .1, emissive: c, emissiveIntensity: .12 }));
  shelfY.slice(0, 2).forEach((y, si) => {
    let x = -W / 2 + .06 + (si === 1 ? .2 : 0); const end = W / 2 - .06 - (si % 2 ? .38 : 0);
    while (x < end - .03) {
      const bw = .035 + r() * .045, bh = .26 + r() * .13; if (x + bw > end) break;
      const tilt = r() < .07 && x > -W / 2 + .2 ? .22 : 0;
      const titled = r() < .8, b = box(bw, bh, .21 + r() * .06, x + bw / 2, y + .02 + bh / 2, .02, titled ? spineMat(Math.floor(r() * SPINE_TITLES.length)) : bm[Math.floor(r() * bm.length)]);
      if (titled && !tilt) (g.userData.books ||= []).push(b);   // 80% carry a DIWA title on the spine b.rotation.z = tilt; if (tilt) b.position.x += bh * .1;
      x += bw + .004 + (tilt ? .06 : 0);
    }
    if (si % 2) { const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.09, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, 1, 1.8), wireframe: true, toneMapped: false })); orb.position.set(W / 2 - .22, y + .13, .02); g.add(orb); }
  });
  // two thin DIWA books standing at the front of the middle shelf, titles on their spines
  const T2 = [...KN_BOOKS].sort(() => r() - .5).slice(0, 2);
  T2.forEach((title, k) => {
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 900; const c = cv.getContext('2d');
    c.fillStyle = k ? '#0f3a6e' : '#e9f3fb'; c.fillRect(0, 0, 96, 900); c.fillStyle = k ? '#5fe0ff' : '#1770b8'; c.fillRect(0, 40, 96, 8); c.fillRect(0, 852, 96, 8);
    c.save(); c.translate(48, 450); c.rotate(Math.PI / 2); c.fillStyle = k ? '#ffffff' : '#0c2a4c'; c.font = `700 46px ${DS.font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title, 0, 2, 760); c.restore();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const side = new THREE.MeshStandardMaterial({ color: k ? 0x0f3a6e : 0xe9f3fb, roughness: .6 }), spine = new THREE.MeshStandardMaterial({ map: tex, roughness: .5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .25 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(.034, .34, .24), [side, side, side, side, spine, side]); b.position.set(-W / 2 + .1 + k * .045, .5 + .02 + .17, .04); b.castShadow = true; g.add(b);
  });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x2fb6ff, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(2.4, 1.4, 1); glow.position.set(0, H / 2, -.05); g.add(glow);
  return g;
}
let seated = -1;
function sitAt(i) {
  enterSpot(SEATS[i].knowledge ? 'knowledge' : 'lounge'); seated = i; const p = SEATS[i].pos, look = SEATS[i].look ? SEATS[i].look.clone() : SEATS[i].center.clone().setY(.95);
  if (SEATS[i].knowledge) setTimeout(() => summonOrb(), 1700);
  flyTo(p.clone(), look.clone().lerp(p, .02), 1600, () => { controls.minDistance = .01; toast('You’re seated · drag to look around · press H to stand up', 3000); });
}
function focusLounge(i = 0) {
  enterSpot('lounge'); const L = LOUNGES[i], dir = L.clone().normalize();
  flyTo(L.clone().sub(dir.multiplyScalar(6.5)).setY(3.2), L.clone().setY(.6), 1700, () => toast('Click a seat to sit down', 2400));
}
function standUp() { if (seated >= 0) { seated = -1; controls.minDistance = .8; } }

/* ---------- shared whiteboards: one behind each lounge sofa ---------- */
const WB = { W: 3.6, H: 2.2, y0: 1.0, cw: 1600, ch: 978, tool: 'pen', color: '#1d1d1f', drawing: false, last: null, send: null, active: null };
const BOARDS = [];
function buildWhiteboard(pos, look) {
  const B = { i: BOARDS.length, ops: [] }; BOARDS.push(B);
  const g = new THREE.Group(); g.position.copy(pos); g.lookAt(look.x, 0, look.z); scene.add(g); B.g = g;
  standBoard(g, WB.W, WB.H, WB.y0, 0xd7dce2);
  B.lc = liveCanvas(WB.cw, WB.ch, c => wbRepaint(B, c));
  B.mesh = new THREE.Mesh(new THREE.PlaneGeometry(WB.W, WB.H), new THREE.MeshStandardMaterial({ map: B.lc.tex, roughness: .25, metalness: 0, emissive: 0xffffff, emissiveIntensity: .6, emissiveMap: B.lc.tex }));
  B.mesh.position.set(0, WB.y0 + WB.H / 2, 0); B.mesh.userData.wb = B.i + 1; g.add(B.mesh); pickables.push(B.mesh);
  const tray = new THREE.Mesh(new RoundedBoxGeometry(WB.W * .9, .04, .12, 2, .015), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: .5, roughness: .4 })); tray.position.set(0, WB.y0 - .05, .07); g.add(tray);
  [[0x1d1d1f, -.5], [0x1770b8, -.35], [0xff3b30, -.2]].forEach(([c, x]) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.014, .13, 4, 8), new THREE.MeshStandardMaterial({ color: c })); m.rotation.z = Math.PI / 2; m.position.set(x, WB.y0 - .015, .08); g.add(m); });
  return B;
}
function wbRepaint(B, c = B.lc.g) {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, WB.cw, WB.ch);
  c.font = `600 30px ${DS.font}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(23,112,184,.22)'; c.fillText('Shared whiteboard · cleared when everyone leaves', 30, WB.ch - 28);
  B.ops.forEach(o => wbDraw(o, B, c));
  if (B.lc) B.lc.tex.needsUpdate = true;
}
function wbDraw(o, B, c = B.lc.g) {
  if (o.t === 's') { c.strokeStyle = o.c; c.lineWidth = o.w; c.lineCap = c.lineJoin = 'round'; c.beginPath(); c.moveTo(o.p[0] * WB.cw, o.p[1] * WB.ch); c.lineTo(o.p[2] * WB.cw, o.p[3] * WB.ch); c.stroke(); }
  else if (o.t === 'g') wbShape(c, o);
  else if (o.t === 'x') { c.fillStyle = o.c; c.font = `600 ${o.s}px ${DS.font}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(o.txt, o.x * WB.cw, o.y * WB.ch); }
  if (B.lc) B.lc.tex.needsUpdate = true;
}
// flowchart shapes: rectangle, rounded box, ellipse, decision diamond, line and arrow (drag from corner to corner)
function wbShape(c, o) {
  const [a, b, x2, y2] = o.a, x0 = Math.min(a, x2) * WB.cw, y0 = Math.min(b, y2) * WB.ch, w = Math.abs(x2 - a) * WB.cw, h = Math.abs(y2 - b) * WB.ch;
  c.strokeStyle = o.c; c.fillStyle = o.c; c.lineWidth = 6; c.lineCap = c.lineJoin = 'round'; c.setLineDash(o.k === 'dash' ? [18, 14] : []); c.beginPath();
  if (o.k === 'rect') c.rect(x0, y0, w, h);
  else if (o.k === 'round') c.roundRect(x0, y0, w, h, Math.min(28, w / 4, h / 4));
  else if (o.k === 'ellipse') c.ellipse(x0 + w / 2, y0 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (o.k === 'diamond') { c.moveTo(x0 + w / 2, y0); c.lineTo(x0 + w, y0 + h / 2); c.lineTo(x0 + w / 2, y0 + h); c.lineTo(x0, y0 + h / 2); c.closePath(); }
  else { const X1 = a * WB.cw, Y1 = b * WB.ch, X2 = x2 * WB.cw, Y2 = y2 * WB.ch; c.moveTo(X1, Y1); c.lineTo(X2, Y2); c.stroke(); c.setLineDash([]);
    if (o.k === 'arrow' || o.k === 'dash') { const an = Math.atan2(Y2 - Y1, X2 - X1), L = 26; c.beginPath(); c.moveTo(X2, Y2); c.lineTo(X2 - L * Math.cos(an - .45), Y2 - L * Math.sin(an - .45)); c.lineTo(X2 - L * Math.cos(an + .45), Y2 - L * Math.sin(an + .45)); c.closePath(); c.fill(); } return; }
  c.stroke(); c.setLineDash([]);
}
const WB_SHAPES = { rect: '<rect x="4" y="6" width="16" height="12"/>', round: '<rect x="4" y="6" width="16" height="12" rx="4"/>', ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6"/>', diamond: '<path d="M12 4l8 8-8 8-8-8z"/>', line: '<path d="M5 19L19 5"/>', arrow: '<path d="M5 19L18 6M18 6h-7M18 6v7"/>', dash: '<path d="M5 19l3-3M11 13l2-2M16 8l2-2M18 6h-6M18 6v6"/>' };
function wbApply(o, fromPeer) {
  if (o.t === 'state') { (o.boards || []).forEach((ops, i) => { const B = BOARDS[i]; if (B && Array.isArray(ops) && ops.length > B.ops.length) { B.ops = ops.slice(0, 20000); wbRepaint(B); } }); return; }
  const B = BOARDS[o.b ?? 0]; if (!B) return;
  if (o.t === 'clr') { B.ops = []; wbRepaint(B); }
  else { B.ops.push(o); wbDraw(o, B); }
  if (!fromPeer && WB.send) { try { WB.send(o); } catch { } }
}
function wbClearAll() { BOARDS.forEach(B => { B.ops = []; if (B.lc) wbRepaint(B); }); }
function wbUV(e) {
  if (!WB.active) return null;
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  const h = ray.intersectObject(WB.active.mesh, false)[0]; return h ? [h.uv.x, 1 - h.uv.y] : null;
}
function wbInput() {
  addEventListener('pointerdown', e => {
    if (focus.kind !== 'wb' || e.button !== 0 || e.target !== renderer.domElement) return;
    const uv = wbUV(e); if (!uv) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const b = WB.active.i;
    if (WB_SHAPES[WB.tool]) { WB.shape = { a: uv, b: uv }; return; }
    if (WB.tool === 'text') { const txt = $('#wbText').value.trim(); if (!txt) { toast('Type your text in the toolbar first', 2000); $('#wbText').focus(); return; } wbApply({ t: 'x', b, c: WB.color, s: 46, txt: txt.slice(0, 80), x: uv[0], y: uv[1] }); $('#wbText').value = ''; return; }
    WB.drawing = true; WB.last = uv;
  }, true);
  addEventListener('pointermove', e => {
    if (WB.shape) { const uv = wbUV(e); if (!uv) return; WB.shape.b = uv; const B = WB.active; wbRepaint(B); wbDraw({ t: 'g', k: WB.tool, c: WB.color, a: [...WB.shape.a, ...uv] }, B); return; }
    if (!WB.drawing) return; const uv = wbUV(e); if (!uv) return;
    const er = WB.tool === 'erase';
    wbApply({ t: 's', b: WB.active.i, c: er ? '#ffffff' : WB.color, w: er ? 46 : 6, p: [+WB.last[0].toFixed(4), +WB.last[1].toFixed(4), +uv[0].toFixed(4), +uv[1].toFixed(4)] });
    WB.last = uv;
  }, true);
  addEventListener('pointerup', () => {
    if (WB.shape) { const S = WB.shape; WB.shape = null; if (Math.hypot(S.b[0] - S.a[0], S.b[1] - S.a[1]) > .01) wbApply({ t: 'g', b: WB.active.i, k: WB.tool, c: WB.color, a: [...S.a, ...S.b].map(v => +v.toFixed(4)) }); else wbRepaint(WB.active); }
    WB.drawing = false; }, true);
  const bar = $('#wbBar');
  bar.querySelector('.wb-shapes').innerHTML = Object.entries(WB_SHAPES).map(([k, d]) => `<button class="wb-tool sh" data-tool="${k}" title="${{ rect: 'Box', round: 'Rounded box (process)', ellipse: 'Ellipse (start / end)', diamond: 'Diamond (decision)', line: 'Line', arrow: 'Arrow', dash: 'Dashed arrow' }[k]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg></button>`).join('');
  bar.querySelector('.wb-colors').innerHTML = ['#1d1d1f', '#1770b8', '#4ca9ff', '#ff3b30', '#34c759', '#ff9f0a'].map(c => `<button data-c="${c}" style="background:${c}" class="${c === WB.color ? 'on' : ''}" aria-label="Pen colour"></button>`).join('');
  const setTool = t => { WB.tool = t; bar.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); renderer.domElement.style.cursor = t === 'erase' ? 'cell' : t === 'text' ? 'text' : 'crosshair'; };
  const pickTool = e => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); };
  bar.querySelectorAll('.wb-colors button').forEach(b => b.addEventListener('click', () => { WB.color = b.dataset.c; bar.querySelectorAll('.wb-colors button').forEach(x => x.classList.toggle('on', x === b)); if (WB.tool === 'erase') setTool('pen'); }));
  bar.addEventListener('click', pickTool);
  $('#wbPen').innerHTML = svg('pen') + 'Pen'; $('#wbErase').innerHTML = svg('eraser') + 'Eraser'; $('#wbTextBtn').innerHTML = svg('textT') + 'Text';
  $('#wbClear').innerHTML = svg('trash') + 'Clear all'; $('#wbDone').innerHTML = svg('close');
  $('#wbClear').addEventListener('click', () => { if (WB.active && confirmClear()) wbApply({ t: 'clr', b: WB.active.i }); });
  $('#wbDone').addEventListener('click', goHome);
  $('#wbText').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { setTool('text'); toast('Click on the board to place the text', 2000); } });
  $('#wbText').addEventListener('focus', () => setTool('text'));
  setTool('pen');
}
let clearArmed = 0;
function confirmClear() { const now = performance.now(); if (now - clearArmed < 2500) { clearArmed = 0; return true; } clearArmed = now; toast('Click “Clear all” again to erase this whole board', 2400); return false; }
function focusWhiteboard(i) {
  if (i === undefined) { let best = 0, bd = 1e9; BOARDS.forEach((B, k) => { const d = B.g.position.distanceTo(camera.position); if (d < bd) { bd = d; best = k; } }); i = best; }
  const B = BOARDS[i]; WB.active = B; enterSpot('wb');
  const cp = B.g.localToWorld(new THREE.Vector3(0, WB.y0 + WB.H / 2 - .15, 3.5)), tg = B.g.localToWorld(new THREE.Vector3(0, WB.y0 + WB.H / 2, 0));
  flyTo(cp, tg, 1600, () => { controls.enabled = false; toast(mp.joined ? 'Draw on the board · everyone in the session sees it live' : 'Draw on the board · join the shared session to draw together', 3000); });
}

/* ---------- news board (slideshow) ---------- */
const NEWS = { pos: new THREE.Vector3(27.6, 0, -21.3), i: 0, from: -1, k: 1, timer: 0, W: 5.83, H: 8.1, y0: 1.8 };
function newsDraw(c, w, h) {
  const drawSlide = (n, a) => {
    const N = CONFIG.NEWS[n]; if (!N) return; c.globalAlpha = a;
    const g = c.createLinearGradient(0, 150, w, h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eaf3fd'); c.fillStyle = g; c.fillRect(0, 150, w, h - 150);
    c.fillStyle = DIWA.blue; c.font = `650 34px ${DS.font}`; c.textBaseline = 'alphabetic'; c.fillText(N.date + (N.tag ? '  ·  ' + N.tag : ''), 80, 260);
    c.fillStyle = DIWA.ink; c.font = `700 68px ${DS.font}`; const lines = wrapText(c, N.title, 80, 370, w - 160, 82, 6);
    c.fillStyle = '#4a5a6c'; c.font = `500 40px ${DS.font}`; wrapText(c, N.text, 80, 370 + lines * 82 + 50, w - 160, 56, 6);
    if (N.url) { c.fillStyle = DIWA.blue; c.font = `600 32px ${DS.font}`; c.fillText('Click to read on digitalwaters.fi  →', 80, h - 130); }
    c.globalAlpha = 1;
  };
  return async () => {
    c.fillStyle = DIWA.navy; c.fillRect(0, 0, w, 150);
    const L = await loadImg(ASSET.logoWhite); if (L) c.drawImage(L, 50, 32, 86 * L.width / L.height, 86);
    c.fillStyle = '#fff'; c.font = `650 46px ${DS.font}`; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('Latest News', w - 60, 76); c.textAlign = 'left';
    if (NEWS.from >= 0 && NEWS.k < 1) drawSlide(NEWS.from, 1);
    drawSlide(NEWS.i, NEWS.from >= 0 ? easeInOut(NEWS.k) : 1);
    const n = CONFIG.NEWS.length; for (let k = 0; k < n; k++) { c.fillStyle = k === NEWS.i ? DIWA.blue : 'rgba(23,112,184,.25)'; rrect(c, w - 60 - (n - k) * 44 + (k === NEWS.i ? -20 : 0), h - 82, k === NEWS.i ? 44 : 24, 14, 7); c.fill(); }
    c.fillStyle = 'rgba(12,42,76,.35)'; c.font = `700 70px ${DS.font}`; c.textBaseline = 'middle'; c.fillText('‹', 22, h / 2 + 60); c.textAlign = 'right'; c.fillText('›', w - 22, h / 2 + 60); c.textAlign = 'left';
  };
}
function buildNews() {
  const g = new THREE.Group(); g.position.copy(NEWS.pos); g.lookAt(0, 0, 4); scene.add(g); NEWS.g = g;
  standBoard(g, NEWS.W, NEWS.H, NEWS.y0);
  const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 1389; const c = cv.getContext('2d');
  NEWS.tex = new THREE.CanvasTexture(cv); NEWS.tex.colorSpace = THREE.SRGBColorSpace; NEWS.tex.anisotropy = 8; NEWS.paint = newsDraw(c, 1000, 1389);
  NEWS.paint().then(() => NEWS.tex.needsUpdate = true);
  NEWS.mesh = new THREE.Mesh(new THREE.PlaneGeometry(NEWS.W, NEWS.H), new THREE.MeshBasicMaterial({ map: NEWS.tex, toneMapped: false }));
  NEWS.mesh.position.set(0, NEWS.y0 + NEWS.H / 2, 0); NEWS.mesh.userData.news = true; g.add(NEWS.mesh); pickables.push(NEWS.mesh);
  labelAt(g, NEWS.y0 + NEWS.H + .55, `<div class="ic">${svg('news')}</div><div>Latest DIWA News<small>From digitalwaters.fi</small></div>`, '', focusNews);
}
function newsGo(d) { NEWS.from = NEWS.i; NEWS.i = (NEWS.i + d + CONFIG.NEWS.length) % CONFIG.NEWS.length; NEWS.k = 0; NEWS.timer = 0; }
function updateNews(dt) {
  if (!NEWS.tex) return; NEWS.timer += dt;
  if (NEWS.timer > 8) newsGo(1);
  if (NEWS.k < 1) { NEWS.k = Math.min(1, NEWS.k + dt / .7); NEWS.paint().then(() => NEWS.tex.needsUpdate = true); if (NEWS.k >= 1) NEWS.from = -1; }
}
function onNewsClick(e) {
  if (focus.kind !== 'news') { focusNews(); return; }
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  const h = ray.intersectObject(NEWS.mesh, false)[0]; if (!h) return;
  if (h.uv.x < .12) newsGo(-1); else if (h.uv.x > .88) newsGo(1); else { const u = CONFIG.NEWS[NEWS.i].url; if (u) window.open(u, '_blank', 'noopener'); }
}
function focusNews() { enterSpot('news'); const v = faceFrom(NEWS.g.position, new THREE.Vector3(0, 0, 4), NEWS.y0 + NEWS.H / 2, 11); flyTo(v.pos, v.tgt, 1700, () => toast('Use ‹ › to browse · click a story to open it', 2400)); }

/* ---------- Finland map of the supersites with pulsing pins ---------- */
const MAPB = { pos: new THREE.Vector3(-27.6, 0, -21.3), W: 5.83, H: 8.1, y0: 1.8, pins: [] };
// pin positions as fractions of the map image (x, y)
const MAP_PINS = { tana: [.523, .088], pallas: [.448, .222], sodankyla: [.551, .276], oulanka: [.695, .374], kemijoki: [.48, .387], osp: [.495, .489], kokkola: [.367, .585], vantaanjoki: [.452, .866], archipelago: [.246, .929] };
function buildMapBoard() {
  const g = new THREE.Group(); g.position.copy(MAPB.pos); g.lookAt(0, 0, 4); scene.add(g); MAPB.g = g;
  standBoard(g, MAPB.W, MAPB.H, MAPB.y0);
  const CW = 1000, CH = Math.round(CW * MAPB.H / MAPB.W), top = 190, mapH = CH - top - 40, mapW = mapH * 975 / 1362, mapX = (CW - mapW) / 2;
  MAPB.rect = { x: mapX / CW, y: top / CH, w: mapW / CW, h: mapH / CH };
  const lc = liveCanvas(CW, CH, async (c, w, h) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0b2a58'); bg.addColorStop(1, '#061a3a'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(120,200,255,.10)'; c.lineWidth = 1; for (let x = 0; x <= w; x += 25) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 25) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(140,215,255,.22)'; for (let x = 0; x <= w; x += 125) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 125) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(150,220,255,.7)'; c.lineWidth = 3; rrect(c, 22, 22, w - 44, h - 44, 22); c.stroke(); c.lineWidth = 1; rrect(c, 32, 32, w - 64, h - 64, 16); c.stroke();
    const L = await loadImg(ASSET.logoWhite); if (L) c.drawImage(L, 58, 62, 66 * L.width / L.height, 66);
    c.fillStyle = '#e6f6ff'; c.font = `700 46px ${DS.font}`; c.textAlign = 'right'; c.fillText('SUPERSITES', w - 58, 112); c.textAlign = 'left';
    const M = await loadImg(ASSET.mapBP); if (M) c.drawImage(M, mapX, top, mapW, mapH);   // pre-rendered by tools/make_blueprint_map.py
    // site names in clear white beside each point
    c.font = `650 25px ${DS.font}`; c.textBaseline = 'middle'; c.lineJoin = 'round';
    SITES.forEach(st => { const f = MAP_PINS[st.id]; if (!f) return;
      const px = mapX + f[0] * mapW, py = top + f[1] * mapH, nm = st.name.replace(' Research Station', '').replace(' Groundwater Area', ' groundwater');
      const right = px + 28 + c.measureText(nm).width < w - 40, tx = right ? px + 26 : px - 26; c.textAlign = right ? 'left' : 'right';
      c.strokeStyle = 'rgba(3,14,34,.92)'; c.lineWidth = 7; c.strokeText(nm, tx, py); c.fillStyle = st.hero ? '#ffd27a' : '#ffffff'; c.fillText(nm, tx, py); });
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(MAPB.W, MAPB.H), new THREE.MeshBasicMaterial({ map: lc.tex, toneMapped: false }));
  mesh.position.set(0, MAPB.y0 + MAPB.H / 2, 0); mesh.userData.mapBoard = true; g.add(mesh); pickables.push(mesh);
  const R = MAPB.rect;
  SITES.forEach(s => {
    const f = MAP_PINS[s.id]; if (!f) return;
    const x = (R.x + f[0] * R.w - .5) * MAPB.W, y = MAPB.y0 + (1 - (R.y + f[1] * R.h)) * MAPB.H;
    const col = new THREE.Color(s.hero ? 0xff9f0a : 0x5fe0ff).multiplyScalar(1.3);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(.055, 32), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); dot.position.set(x, y, .012);
    const rings = [0, 1].map(k => { const r = new THREE.Mesh(new THREE.RingGeometry(.068, .085, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, toneMapped: false, depthWrite: false })); r.position.set(x, y, .011); g.add(r); return r; });
    const hit = new THREE.Mesh(new THREE.CircleGeometry(.26, 16), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x, y, .02); hit.userData.mapPin = s.id; pickables.push(hit);
    g.add(dot, hit); MAPB.pins.push({ id: s.id, rings, dot, ph: Math.random() });
  });
  labelAt(g, MAPB.y0 + MAPB.H + .55, `<div class="ic">${svg('map')}</div><div>DIWA Supersites<small>Map of Finland</small></div>`, '', focusMap);
}
function updateMapPins(t) {
  CATB.pins.forEach(p => p.rings.forEach((r, k) => { const ph = (t * .55 + p.ph + k * .5) % 1; r.scale.setScalar(1 + ph * 1.6); r.material.opacity = (1 - ph) * .9; }));
  MAPB.pins.forEach(p => p.rings.forEach((r, k) => { const ph = (t * .55 + p.ph + k * .5) % 1; r.scale.setScalar(1 + ph * 1.6); r.material.opacity = (1 - ph) * .9; }));
}
function focusMap() { enterSpot('map'); const v = faceFrom(MAPB.g.position, new THREE.Vector3(0, 0, 4), MAPB.y0 + MAPB.H / 2, 11); flyTo(v.pos, v.tgt, 1700, () => toast('Click a pulsing point for details', 2200)); }
function openMapCard(id) {
  const s = SITE[id]; if (!s) return;
  $('#mapCard').innerHTML = `<div class="inner"><div class="sc-head"><div class="code-badge">${siteCode(s)}</div><div><h3>${s.name}</h3><p>${s.sub}</p></div><button class="x" id="mcClose">${svg('x')}</button></div>
    <div class="card"><p>${s.text}</p></div><div class="btn-row"><button class="btn" id="mcGo">${svg('ext')}Visit the table</button></div></div>`;
  $('#mapCard').classList.add('show');
  $('#mcClose').addEventListener('click', closeMapCard); $('#mcGo').addEventListener('click', () => { closeMapCard(); focusSite(id); });
}
function closeMapCard() { $('#mapCard')?.classList.remove('show'); }

/* ---------- DIWA Catchments board: supersite boundaries and the public sensor network, same format as the supersite map ---------- */
const CATB = { pos: new THREE.Vector3(-31.2, 0, -15.6), W: 5.83, H: 8.1, y0: 1.8, pins: [], info: {} };
// label anchors as fractions of the catchment image (printed by tools/make_catchment_board.py)
const CATCH_PINS = { archipelago: [.2106, .9011], kemijoki: [.6378, .2746], oulanka: [.7635, .3471], osp: [.6409, .4908], kokkola: [.3732, .5955], tana: [.5654, .0719], vantaanjoki: [.4792, .9019] };
const CATCH_NAMES = { archipelago: 'Archipelago Sea', kemijoki: 'Kemijoki', oulanka: 'Oulankajoki', osp: 'Oulu region', kokkola: 'Patamäki', tana: 'Tenojoki', vantaanjoki: 'Vantaanjoki' };
async function buildCatchBoard() {
  const g = new THREE.Group(); g.position.copy(CATB.pos); g.lookAt(0, 0, 4); scene.add(g); CATB.g = g;
  standBoard(g, CATB.W, CATB.H, CATB.y0);
  const [geo, sens] = await Promise.all([fetch('data/catchments.geojson').then(r => r.json()).catch(() => null), fetch('data/sensors-all.json').then(r => r.json()).catch(() => null)]);
  if (geo) geo.features.forEach(f => { const P = f.properties, L = sens?.supersites?.[P.id] || []; CATB.info[P.id] = { ...P, stations: L.length, sensors: L.reduce((a, s) => a + s.sensors.length, 0), cats: L.reduce((a, s) => (a[s.cat] = (a[s.cat] || 0) + s.sensors.length, a), {}) }; });
  const CW = 1000, CH = Math.round(CW * CATB.H / CATB.W), top = 190, mapH = CH - top - 110, mapW = mapH * 689 / 1159, mapX = (CW - mapW) / 2;
  CATB.rect = { x: mapX / CW, y: top / CH, w: mapW / CW, h: mapH / CH };
  const lc = liveCanvas(CW, CH, async (c, w, h) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0b2a58'); bg.addColorStop(1, '#061a3a'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(120,200,255,.10)'; c.lineWidth = 1; for (let x = 0; x <= w; x += 25) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 25) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(140,215,255,.22)'; for (let x = 0; x <= w; x += 125) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 125) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(150,220,255,.7)'; c.lineWidth = 3; rrect(c, 22, 22, w - 44, h - 44, 22); c.stroke(); c.lineWidth = 1; rrect(c, 32, 32, w - 64, h - 64, 16); c.stroke();
    const L = await loadImg(ASSET.logoWhite); if (L) c.drawImage(L, 58, 62, 66 * L.width / L.height, 66);
    c.fillStyle = '#e6f6ff'; c.font = `700 46px ${DS.font}`; c.textAlign = 'right'; c.fillText('CATCHMENTS', w - 58, 112); c.textAlign = 'left';
    const M = await loadImg(ASSET.catBP); if (M) c.drawImage(M, mapX, top, mapW, mapH);   // pre-rendered by tools/make_catchment_board.py
    c.font = `650 25px ${DS.font}`; c.textBaseline = 'middle'; c.lineJoin = 'round';
    Object.entries(CATCH_PINS).forEach(([id, f]) => { const px = mapX + f[0] * mapW, py = top + f[1] * mapH, nm = CATCH_NAMES[id];
      const right = id !== 'archipelago' && px + 28 + c.measureText(nm).width < w - 40, tx = right ? px + 24 : px - 24, ty = id === 'archipelago' ? py - 30 : py; c.textAlign = right ? 'left' : 'right';
      c.strokeStyle = 'rgba(3,14,34,.92)'; c.lineWidth = 7; c.strokeText(nm, tx, ty); c.fillStyle = id === 'oulanka' ? '#ffd27a' : '#ffffff'; c.fillText(nm, tx, ty); });
    // legend: sensor types
    const leg = Object.entries(SENSOR_CATS).filter(([k]) => ['soil', 'surface', 'groundwater', 'atmosphere', 'remote'].includes(k)); c.font = `600 21px ${DS.font}`; c.textAlign = 'left';
    let lx = 70, ly = h - 98; leg.forEach(([k, C], i) => { const nm = { soil: 'Soil', surface: 'Surface water', groundwater: 'Groundwater', atmosphere: 'Atmosphere', remote: 'Remote sensing' }[k];
      if (i === 3) { lx = 70; ly += 34; } c.fillStyle = C.css; c.beginPath(); c.arc(lx + 8, ly, 8, 0, 7); c.fill(); c.fillStyle = '#dbeeff'; c.fillText(nm, lx + 24, ly); lx += 48 + c.measureText(nm).width + 18; });
    c.fillStyle = 'rgba(200,225,255,.6)'; c.font = `500 18px ${DS.font}`; c.textAlign = 'right'; c.fillText('Public sensors only', w - 70, h - 64); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CATB.W, CATB.H), new THREE.MeshBasicMaterial({ map: lc.tex, toneMapped: false }));
  mesh.position.set(0, CATB.y0 + CATB.H / 2, 0); mesh.userData.catchBoard = true; g.add(mesh); pickables.push(mesh);
  const R = CATB.rect;
  Object.entries(CATCH_PINS).forEach(([id, f]) => {
    const x = (R.x + f[0] * R.w - .5) * CATB.W, y = CATB.y0 + (1 - (R.y + f[1] * R.h)) * CATB.H;
    const col = new THREE.Color(id === 'oulanka' ? 0xff9f0a : 0x5fe0ff).multiplyScalar(1.3);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(.05, 32), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); dot.position.set(x, y, .012);
    const rings = [0, 1].map(k => { const r = new THREE.Mesh(new THREE.RingGeometry(.062, .078, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, toneMapped: false, depthWrite: false })); r.position.set(x, y, .011); g.add(r); return r; });
    const hit = new THREE.Mesh(new THREE.CircleGeometry(.3, 16), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x, y, .02); hit.userData.catchPin = id; pickables.push(hit);
    g.add(dot, hit); CATB.pins.push({ id, rings, dot, ph: Math.random() });
  });
  labelAt(g, CATB.y0 + CATB.H + .55, `<div class="ic">${svg('map')}</div><div>DIWA Catchments<small>Supersites and sensors</small></div>`, '', focusCatch);
}
function focusCatch() { enterSpot('catch'); const v = faceFrom(CATB.g.position, new THREE.Vector3(0, 0, 4), CATB.y0 + CATB.H / 2, 11); flyTo(v.pos, v.tgt, 1700, () => toast('Click a pulsing point for the catchment', 2200)); }
function openCatchCard(id) {
  const I = CATB.info[id] || { name: CATCH_NAMES[id], kind: 'Catchment', area_km2: 0, stations: 0, sensors: 0, cats: {}, table: id };
  const bars = Object.entries(I.cats).map(([k, v]) => `<span class="chip"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:${SENSOR_CATS[k]?.css}"></i>${SENSOR_CATS[k]?.label} · ${v}</span>`).join('');
  $('#mapCard').innerHTML = `<div class="inner"><div class="sc-head"><div class="code-badge">${siteCode(SITE[I.table] || { name: I.name })}</div><div><h3>${I.name}</h3><p>${I.kind} · ${Number(I.area_km2).toLocaleString('en')} km²</p></div><button class="x" id="mcClose">${svg('x')}</button></div>
    <div class="stats"><div class="stat"><div class="k">Public stations</div><div class="v">${I.stations}</div></div><div class="stat"><div class="k">Public sensors</div><div class="v">${I.sensors}</div></div></div>
    ${bars ? `<div class="card"><h3>Sensor types</h3><div class="chips">${bars}</div></div>` : ''}
    <div class="btn-row"><button class="btn" id="mcMap">${svg('map')}Open the catchment map</button><button class="btn secondary" id="mcGo">${svg('ext')}Visit the 3D table</button></div></div>`;
  $('#mapCard').classList.add('show');
  $('#mcClose').addEventListener('click', closeMapCard); $('#mcGo').addEventListener('click', () => { closeMapCard(); focusSite(SITE[I.table] ? I.table : 'oulanka'); });
  $('#mcMap').addEventListener('click', () => window.open(`catchments/?site=${id}`, '_blank', 'noopener'));
}

/* ---------- night extras: aurora, twinkling stars, warm modern lamps ---------- */
const NIGHT = { v: 0, emissive: [], sprites: [], lights: [] };
const AURORA_VS = `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const AURORA_FS = `
  uniform float uTime, uNight; varying vec2 vUv;
  float h(float n){ return fract(sin(n) * 43758.5453); }
  float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h(i), h(i + 1.), f); }
  void main(){
    float a = vUv.x * 6.28318 * 3., t = uTime * .05;
    float curtain = 0.;
    for (int k = 0; k < 3; k++) {
      float fk = float(k);
      float base = .2 + .14 * n1(a * .9 + t * (1. + fk) + fk * 7.) + .05 * sin(a * 2.3 + uTime * .15 + fk);
      float rays = .55 + .45 * n1(a * 22. + uTime * .6 + fk * 13.);
      float band = smoothstep(base - .02, base + .03, vUv.y) * smoothstep(base + .55, base + .06, vUv.y);
      curtain += band * rays * (.6 - fk * .15) * (.5 + .5 * n1(a * 1.7 - t * 2. + fk * 3.));
    }
    vec3 green = vec3(.2, 1., .45), teal = vec3(.12, .85, .7), pink = vec3(.85, .3, .75);
    vec3 col = mix(green, teal, smoothstep(.2, .6, n1(a * .6 + t))); col = mix(col, pink, smoothstep(.62, .95, vUv.y) * .7);
    float al = clamp(curtain * 1.1, 0., 1.) * uNight * .6;
    gl_FragColor = vec4(col * 1.2, al);
  }`;
const STAR_VS = `attribute float aPh; uniform float uTime, uOpacity; varying float vA;
  void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
    float tw = .55 + .45 * sin(uTime * (1.2 + fract(aPh * 3.1) * 2.5) + aPh * 6.28);
    gl_PointSize = (1.2 + 2.2 * fract(aPh * 7.3)) * (.75 + .5 * tw); vA = uOpacity * (.35 + .65 * tw); }`;
const STAR_FS = `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(.88, .92, 1.), smoothstep(.5, .1, d) * vA); }`;
let aurora;
let floorLogo;
function buildWallSign() {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 768; const c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const draw = im => { c.clearRect(0, 0, 2048, 768); c.textAlign = 'center'; c.textBaseline = 'middle';
    if (im) c.drawImage(im, 1024 - 150 * im.width / im.height / 2 * 1, 40, 150 * im.width / im.height, 150);
    c.shadowColor = 'rgba(60,180,255,.9)'; c.shadowBlur = 40; c.fillStyle = '#ffffff'; c.font = `700 250px ${DS.font}`; c.fillText('DIWA Spatial Hub', 1024, 440, 1980);
    c.shadowBlur = 0; c.strokeStyle = 'rgba(140,220,255,.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(260, 620); c.lineTo(1788, 620); c.stroke(); tex.needsUpdate = true; };
  draw(null); loadImg(ASSET.logoWhite).then(draw);
  // a curved strip that follows the elliptical glass wall, just inside it
  const W = 15.5, H = 5.81, Y = 8.3, k = .982, phiC = 2.485, P = phi => new THREE.Vector3(HALL.rx * k * Math.cos(phi), 0, HALL.rz * k * Math.sin(phi));
  const half = (dir) => { let ph = phiC, len = 0; while (len < W / 2) { const n = ph + dir * .002; len += P(n).distanceTo(P(ph)); ph = n; } return ph; };
  const p0 = half(-1), p1 = half(1), N = 60, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) { const ph = lerp(p0, p1, i / N), v = P(ph); pos.push(v.x, Y - H / 2, v.z, v.x, Y + H / 2, v.z); uv.push(i / N, 0, i / N, 1); if (i < N) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  m.renderOrder = 3; scene.add(m);
}
function buildFloorLogo() {
  const mk = src => { const t = new THREE.TextureLoader().load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  floorLogo = { day: mk(ASSET.logo), night: mk(ASSET.logoWhite) };
  const m = new THREE.MeshStandardMaterial({ map: floorLogo.day, transparent: true, opacity: .3, roughness: .6, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 2.6), m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, .03, 15.4); mesh.renderOrder = 1; scene.add(mesh); floorLogo.mat = m;
}
function buildNightSky() {
  aurora = new THREE.Mesh(new THREE.CylinderGeometry(600, 600, 300, 160, 1, true), new THREE.ShaderMaterial({ vertexShader: AURORA_VS, fragmentShader: AURORA_FS, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uTime: { value: 0 }, uNight: { value: 0 } } }));
  aurora.position.y = 135; aurora.renderOrder = -1; aurora.visible = false; if (!CONFIG.OUTSIDE_PANORAMA) scene.add(aurora);
  // twinkling stars (replace the plain star points)
  if (stars) scene.remove(stars);
  const n = 2200, a = new Float32Array(n * 3), ph = new Float32Array(n), r = mulberry32(11);
  for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, el = .22 + Math.asin(r()) * .9; a[i * 3] = Math.cos(th) * Math.cos(el) * 640; a[i * 3 + 1] = Math.sin(el) * 640 + 30; a[i * 3 + 2] = Math.sin(th) * Math.cos(el) * 640; ph[i] = r(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  stars = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, fog: false, uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } } }));
  stars.renderOrder = -1; scene.add(stars);
}
function buildLamps() {
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: .35, metalness: .7 });
  const cable = new THREE.MeshBasicMaterial({ color: 0x30343a });
  // modern pendant ring lamps
  for (let i = 0; i < 8; i++) {
    const t = i / 8 * Math.PI * 2 + .2, x = Math.cos(t) * HALL.rx * .66, z = Math.sin(t) * HALL.rz * .66, y = HALL.h - 3.6;
    const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 3.4, 6), cable); c.position.y = 1.7; g.add(c);
    const ringM = new THREE.MeshStandardMaterial({ color: 0xfff1dc, emissive: 0xffc27a, emissiveIntensity: .25, roughness: .4 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.7, .06, 16, 96), ringM); ring.rotation.x = Math.PI / 2; g.add(ring);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .16, 16), metal); hub.position.y = .08; g.add(hub);
    for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .72, 4), cable); s.rotation.z = Math.PI / 2; s.rotation.y = k * Math.PI / 3; s.position.y = .02; g.add(s); }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb867, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(3.4); g.add(glow);
    NIGHT.emissive.push([ringM, .25, 2.6]); NIGHT.sprites.push([glow.material, 0, .8]);
  }
  // wall sconces on the wooden ribs
  hall.traverse(o => { if (o.geometry?.type === 'CylinderGeometry' && o.material === woodMat && o.position.y === .25) {
    const dir = new THREE.Vector3(o.position.x, 0, o.position.z).normalize();
    const p = o.position.clone().addScaledVector(dir, -.75).setY(2.6);
    const sm = new THREE.MeshStandardMaterial({ color: 0xfff1dc, emissive: 0xffb867, emissiveIntensity: .2, roughness: .5 });
    const sc = new THREE.Mesh(new THREE.CylinderGeometry(.16, .1, .42, 24, 1, true), sm); sc.position.copy(p); scene.add(sc);
    const up = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa75a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); up.scale.set(1.6, 3.2, 1); up.position.copy(p).setY(3.3); scene.add(up);
    NIGHT.emissive.push([sm, .2, 2.4]); NIGHT.sprites.push([up.material, 0, .75]);
  } });
  // warm light sources used at night only
  [[-14, -5], [14, -5], [0, 14], [-24, 19], [24, 19], [-33, 3], [33, 3], [0, -22]].forEach(([x, z]) => { const l = new THREE.PointLight(0xffb36b, 0, 26, 1.7); l.position.set(x, 6.5, z); scene.add(l); NIGHT.lights.push(l); });
}
function setNightExtras(v) {
  NIGHT.v = v;
  NIGHT.emissive.forEach(([m, d, n]) => m.emissiveIntensity = lerp(d, n, v));
  NIGHT.sprites.forEach(([m, d, n]) => m.opacity = lerp(d, n, v));
  NIGHT.lights.forEach(l => l.intensity = 8 * v);
  if (aurora) { aurora.material.uniforms.uNight.value = v; aurora.visible = v > .01; }
  if (floorLogo) { const want = v > .5 ? floorLogo.night : floorLogo.day; if (floorLogo.mat.map !== want) { floorLogo.mat.map = want; floorLogo.mat.needsUpdate = true; } }
  if (HALLREF.top) HALLREF.top.visible = v < .5;            // open skylight at night: stars overhead
  if (HALLREF.ceil) HALLREF.ceil.color.setHex(0xf6f3ee).lerp(_tc.setHex(0x4a4642), v);
}
function updateNightSky(t) { if (outsideMat && NIGHT.v > .001) outsideMat.uniforms.uTime.value = t; if (aurora?.visible) aurora.material.uniforms.uTime.value = t; if (stars?.material.uniforms) stars.material.uniforms.uTime.value = t; }

/* =====================================================================
   Camera flights
   ===================================================================== */
let flight = null;
function flyTo(pos, tgt, dur = 1700, done) {
  if (flight) tweens.delete(flight);
  const p0 = camera.position.clone(), t0 = controls.target.clone(), lift = Math.min(3.5, p0.distanceTo(pos) * .1);
  controls.enabled = false;
  flight = tween(dur, e => {
    camera.position.lerpVectors(p0, pos, e); camera.position.y += Math.sin(Math.PI * e) * lift;
    controls.target.lerpVectors(t0, tgt, e); camera.lookAt(controls.target);
  }, easeInOut, () => { flight = null; controls.enabled = true; done && done(); });
}
function clampCamera() {
  const s = .9, p = camera.position, k = (p.x / (HALL.rx * s)) ** 2 + (p.z / (HALL.rz * s)) ** 2;
  if (k > 1) { const f = 1 / Math.sqrt(k); p.x *= f; p.z *= f; }
  p.y = clamp(p.y, .6, HALL.h - 1.2);
  const t = controls.target, kt = (t.x / (HALL.rx * .85)) ** 2 + (t.z / (HALL.rz * .85)) ** 2;
  if (kt > 1 && !IDLE.on) { const f = 1 / Math.sqrt(kt); t.x *= f; t.z *= f; }
  t.y = clamp(t.y, 0, 8);
}

/* =====================================================================
   UI: segmented controls, dock, layers, panels
   ===================================================================== */
function makeSeg(el, items, value, onChange) {
  el.innerHTML = '<div class="seg-thumb"></div>' + items.map(i => `<button data-v="${i.v}">${i.icon ? svg(i.icon) : ''}<span>${i.label}</span></button>`).join('');
  el._onChange = onChange; el._v = value;
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { segSet(el, b.dataset.v); onChange(b.dataset.v); }));
  requestAnimationFrame(() => segSet(el, el._v));
}
function segSet(el, v) {
  const b = el.querySelector(`button[data-v="${v}"]`); if (!b) return; el._v = v;
  el.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
  const th = el.querySelector('.seg-thumb'); th.style.width = b.offsetWidth + 'px'; th.style.transform = `translateX(${b.offsetLeft - 3}px)`;
}

function buildUI() {
  $('#btnHome').innerHTML = svg('home'); $('#btnLayers').innerHTML = svg('layers'); $('#btnHelp').innerHTML = svg('help'); $('#btnFull').innerHTML = svg('full'); $('#btnLeave').innerHTML = svg('exit'); $('#btnLeave').addEventListener('click', leaveHub);
  $('#btnVR').innerHTML = svg('vr') + '<span>VR</span>';
  $('#tlPlay').innerHTML = svg('play'); $('#btnStory').innerHTML = svg('story') + 'Snowmelt story';
  $('#panoBack').innerHTML = svg('back') + 'Back to hub';
  document.querySelectorAll('.x').forEach(x => x.innerHTML = svg('x'));
  $('#aiIcon').innerHTML = svg('chat'); $('#aiSend').innerHTML = svg('send'); $('#aiMic').innerHTML = svg('mic'); $('#aiSpk').innerHTML = svg('speaker');
  $('#abMic').innerHTML = svg('mic'); $('#abSend').innerHTML = svg('send'); $('#abSpk').innerHTML = svg('speaker'); $('#abHist').innerHTML = svg('chat'); $('#abClose').innerHTML = svg('close');
  $('#btnNight').innerHTML = svg('moon'); $('#btnNight').addEventListener('click', toggleNight); mpInitUI();
  $('#btnMusic').innerHTML = svg('music'); $('#icMusic').innerHTML = svg('music'); $('#icAmb').innerHTML = svg('tree');
  $('#volRow').insertAdjacentHTML('afterbegin', svg('speaker'));
  fillVoiceSelect();
  $('#voiceSel').addEventListener('change', e => { voicePick.choice = e.target.value; try { localStorage.setItem('hub.voice', voicePick.choice); } catch { } toast('Voice set — ask the orb something to hear it', 2200); });
  const vr = $('#volRange'), setP = () => vr.style.setProperty('--p', vr.value + '%'); setP();
  vr.addEventListener('input', () => { setP(); music.vol = vr.value / 100; if (!music.on) { music.on = true; $('#musicPop [data-m=music] .switch').classList.add('on'); } music.start(); });
  $('#musicPop').querySelectorAll('.toggle-row').forEach(r => r.addEventListener('click', () => {
    const k = r.dataset.m; if (k === 'music') music.on = !music.on; else music.amb = !music.amb;
    r.querySelector('.switch').classList.toggle('on', k === 'music' ? music.on : music.amb);
    music.start(); $('#btnMusic').classList.toggle('muted', !music.on);
  }));
  makeSeg($('#seasonSeg'), [{ v: 'winter', label: 'Winter', icon: 'snow' }, { v: 'spring', label: 'Spring', icon: 'sprout' }, { v: 'summer', label: 'Summer', icon: 'sun' }, { v: 'autumn', label: 'Autumn', icon: 'leaf' }], 'summer', v => { stopPlay(); applySeason(v); });
  makeSeg($('#speedSeg'), [{ v: '1', label: '1×' }, { v: '3', label: '3×' }, { v: '8', label: '8×' }], '1', v => playback.speed = +v);
  // dock
  const dock = $('#dock');
  const item = (cls, icon, tip, fn, data = '') => { const b = document.createElement('button'); b.className = 'dock-item ' + cls; b.innerHTML = svg(icon) + `<span class="dock-tip">${tip}</span>`; if (data) b.dataset.site = data; b.addEventListener('click', fn); dock.appendChild(b); return b; };
  const sep = () => { const s = document.createElement('div'); s.className = 'dock-sep'; dock.appendChild(s); };
  item('', 'home', 'Overview', goHome); sep();
  SITES.forEach((s, i) => { const b = item(s.hero ? 'hero code' : 'code', s.icon, `${i + 1} · ${s.name}`, () => focusSite(s.id), s.id); b.firstElementChild.outerHTML = `<b class="dock-code">${siteCode(s)}</b>`; });
  sep();
  item('live', 'live', 'Video wall', focusLive);
  item('', 'pano', '360° views', () => openPano(CONFIG.PANORAMAS[0].id));
  item('', 'map', 'Supersite map', focusMap);
  item('', 'catch', 'Catchment map', focusCatch);
  item('', 'news', 'Latest DIWA News', focusNews);
  item('', 'book', 'DIWA Knowledge', focusKnowledge);
  item('', 'sofa', 'Lounge · sit and talk', () => focusLounge(0));
  item('', 'pen', 'Shared whiteboard (nearest)', () => focusWhiteboard());
  item('ai', 'ai', 'AI Companion', focusAI);
  // dock magnification
  const items = [...dock.querySelectorAll('.dock-item')];
  dock.addEventListener('mousemove', e => items.forEach(b => { const r = b.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)); const s = 1 + .38 * Math.max(0, 1 - d / 120) ** 2; b.style.transform = `scale(${s.toFixed(3)})`; }));
  dock.addEventListener('mouseleave', () => items.forEach(b => b.style.transform = ''));
  // layers popover
  const L = [
    ['sensors', 'Sensor stations', 'sensor', '#0a84ff'], ['rivers', 'River network', 'river', '#30b0c7'], ['catchment', 'Catchment boundary', 'boundary', '#ff9f0a'],
    ['landcover', 'Land cover', 'landcover', '#34c759'], ['pano', '360° points', 'pano', '#5856d6'], ['particles', 'Light particles', 'sparkle', '#ff9f6b'], ['clouds', 'Clouds over the tables', 'cloud', '#8e9bb0'], ['precip', 'Rain and snow', 'drop', '#5ac8fa'], ['places', 'Place names', 'textT', '#64d2ff'], ['agents', 'Agents · Emma, Suzan, Sofia', 'people', '#e04fa0'],
  ];
  $('#layerRows').innerHTML = L.map(([k, n, ic, c]) => `<div class="toggle-row" data-k="${k}"><div class="sw-ic" style="background:${c}">${svg(ic)}</div>${n}<div class="switch ${state.layers[k] ? 'on' : ''}"></div></div>`).join('') + '<div class="small-note" style="padding:0 8px 4px">Map layers apply to the Oulankajoki table. Its terrain, river, roads and buildings come from National Land Survey data; sensor positions are approximate. Clouds, rain and snow follow the weather of the timeline date.</div>';
  $('#layerRows').querySelectorAll('.toggle-row').forEach(r => r.addEventListener('click', () => { const k = r.dataset.k; state.layers[k] = !state.layers[k]; r.querySelector('.switch').classList.toggle('on', state.layers[k]); applyLayers(); }));
  const pop = (btn, el) => btn.addEventListener('click', e => { e.stopPropagation(); const show = !el.classList.contains('show'); document.querySelectorAll('.pop').forEach(p => p.classList.remove('show')); document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('on')); if (show) { el.classList.add('show'); btn.classList.add('on'); } });
  pop($('#btnLayers'), $('#layersPop')); pop($('#btnHelp'), $('#helpPop')); pop($('#btnMusic'), $('#musicPop')); pop($('#btnPeople'), $('#peoplePop'));
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.pop') && !e.target.closest('.icon-btn')) { document.querySelectorAll('.pop').forEach(p => p.classList.remove('show')); document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('on')); } });
  $('#btnHome').addEventListener('click', goHome);
  $('#btnFull').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.close;
    if (k === 'site') { closeSitePanel(); goHome(); } if (k === 'ai') { $('#aiPanel').classList.remove('show'); goHome(); } if (k === 'live') closeLiveModal();
  }));
  // timeline
  $('#tlRange').addEventListener('input', e => { stopPlay(); setDay(+e.target.value, true); });
  $('#tlPlay').addEventListener('click', togglePlay);
  $('#btnStory').addEventListener('click', () => story.active ? endStory() : startStory());
  $('#stNext').addEventListener('click', () => storyStep(story.i + 1));
  $('#stPrev').addEventListener('click', () => storyStep(story.i - 1));
  $('#liveModal').addEventListener('click', e => { if (e.target.id === 'liveModal') closeLiveModal(); });
  $('#panoBack').addEventListener('click', closePano);
  $('#panoPrev').innerHTML = svg('back'); $('#panoNext').innerHTML = svg('back');
  $('#panoPrev').addEventListener('click', () => panoStep(-1)); $('#panoNext').addEventListener('click', () => panoStep(1));
}
function applyLayers() {
  const L = state.layers;
  AGENTS.forEach(A => { A.av.g.visible = A.av.floor.visible = A.av.tag.visible = L.agents; });
  heroLayers.sensors.visible = L.sensors; heroLayers.rivers.visible = L.rivers; heroLayers.catchment.visible = L.catchment; heroLayers.pano.visible = L.pano;
  heroLayers.sensors.traverse(o => { if (o.isCSS2DObject) o.visible = L.sensors; });
  heroLayers.pano.traverse(o => { if (o.isCSS2DObject) o.visible = L.pano; });
  particleMats.forEach(m => m.uniforms.uOpacity.value = L.particles ? .85 : 0); if (dustMat) dustMat.uniforms.uOpacity.value = L.particles ? .35 : 0;
  $('#lcLegend').classList.toggle('show', L.landcover); syncHeroLabels();
  const T = tableOf('oulanka');
  if (T.real) { realSeason(T, state.season, L.landcover, false); return; }
  T.colorFrom.set(T.terr.geometry.attributes.color.array); terrainColors(T, state.season, L.landcover, T.colorTo); treeColors(T, state.season, L.landcover);
  tween(700, e => { const a = T.terr.geometry.attributes.color.array; for (let i = 0; i < a.length; i++) a[i] = lerp(T.colorFrom[i], T.colorTo[i], e); T.terr.geometry.attributes.color.needsUpdate = true; });
}
const tableOf = id => tables.find(t => t.site.id === id);

/* ---------- focus states ---------- */
const focus = { kind: 'home', id: null };
function syncHeroLabels() {
  if (heroLayers.catchLabel) heroLayers.catchLabel.visible = state.layers.catchment && focus.id === 'oulanka';
  if (heroLayers.places) heroLayers.places.children.forEach(o => o.visible = state.layers.places && focus.id === 'oulanka' && !scen.kind);
}
function setDockCurrent(id) { document.querySelectorAll('.dock-item').forEach(b => b.classList.toggle('current', !!id && b.dataset.site === id)); syncHeroLabels(); }
function setLabelsFocus(id, hideAll = false) { tables.forEach(T => { T.lbl.classList.toggle('hidden', hideAll || T.site.id === id); T.lbl.classList.toggle('dim', !!id && T.site.id !== id); }); }
function closeAllPanels() { closeSitePanel(); $('#aiPanel').classList.remove('show'); closeSensorCard(); clearScenario(); }
function goHome() {
  standUp(); closeMapCard(); $('#wbBar')?.classList.remove('show');
  endStory(true); closeAllPanels(); focus.kind = 'home'; focus.id = null; setDockCurrent(null); setLabelsFocus(null);
  $('#timeline').classList.remove('show'); flyTo(HOME_POS, HOME_TGT, 1800);
}
function focusSite(id, opts = {}) {
  standUp(); closeMapCard(); $('#wbBar')?.classList.remove('show');
  const T = tableOf(id); if (!T) return;
  if (!opts.keepStory) { endStory(true); siteTab = 'overview'; }
  if (focus.id !== id) clearScenario();
  $('#aiPanel').classList.remove('show'); closeSensorCard();
  focus.kind = 'site'; focus.id = id; setDockCurrent(id); setLabelsFocus(id);
  const v = T.view(); if (!opts.noFly) flyTo(v.pos, v.tgt, 1700);
  openSitePanel(T.site);
  $('#timeline').classList.toggle('show', !!T.site.hero);
}
function focusAI() { summonOrb(); }
function openLiveModal() {
  $('#liveTitle').textContent = CONFIG.SCREENS[0].title;
  $('#liveWrap').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${CONFIG.SCREENS[0].id}?autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  $('#liveModal').classList.add('show'); music.duck(.12);
}
function closeLiveModal() { music.duck(ORB.state === 'idle' ? 1 : .22); $('#liveModal').classList.remove('show'); setTimeout(() => $('#liveWrap').innerHTML = '', 400); }

/* =====================================================================
   Charts (SVG, hover crosshair + tooltip, playback cursor)
   ===================================================================== */
const charts = new Set();
function niceTicks(lo, hi, n = 3) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), f = step0 / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, t = [];
  for (let v = a; v <= b + step * .01; v += step) t.push(+v.toFixed(10));
  return t;
}
function chart(el, { series, unit, height = 132, type = 'line', decimals = 1, labelFor = i => fmtDate(i), dayToIndex = d => d, zeroBase = false, months = true, xTicks = null }) {
  el.classList.add('chart'); el.innerHTML = '';
  const W = Math.max(260, el.clientWidth || 340), H = height, m = { l: 36, r: 8, t: 8, b: 18 };
  const n = series[0].data.length;
  let lo = Infinity, hi = -Infinity; series.forEach(s => s.data.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));
  if (zeroBase || type === 'bar') lo = Math.min(0, lo);
  const ticks = niceTicks(lo, hi, 3); lo = ticks[0]; hi = ticks[ticks.length - 1];
  const X = i => m.l + (type === 'bar' ? (i + .5) / n : i / (n - 1)) * (W - m.l - m.r), Y = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
  const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('height', H);
  const uid = 'g' + Math.random().toString(36).slice(2, 8);
  let html = `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${series[0].color}" stop-opacity=".22"/><stop offset="1" stop-color="${series[0].color}" stop-opacity="0"/></linearGradient></defs>`;
  html += '<g class="grid">' + ticks.map(t => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/>`).join('') + '</g>';
  html += '<g class="axis">' + ticks.map(t => `<text x="${m.l - 6}" y="${Y(t) + 3}" text-anchor="end">${(+t).toLocaleString('en', { maximumFractionDigits: 2 })}</text>`).join('');
  if (months) html += MONTHS.map((mo, k) => k % 2 ? '' : `<text x="${m.l + (k / 12) * (W - m.l - m.r)}" y="${H - 4}">${mo}</text>`).join('');
  else if (xTicks) html += xTicks.map(([i, l]) => `<text x="${X(i)}" y="${H - 4}">${l}</text>`).join('');
  html += '</g>';
  if (type === 'bar') {
    const bw = Math.max(1.5, (W - m.l - m.r) / n - 2);
    html += series[0].data.map((v, i) => { const y = Y(Math.max(0, v)), h = Math.max(0, Y(0) - y); return `<path d="M${X(i) - bw / 2},${Y(0)} V${y + Math.min(2, h)} q0,-2 2,-2 h${bw - 4} q2,0 2,2 V${Y(0)} Z" fill="${series[0].color}"/>`; }).join('');
  } else {
    series.forEach((ser, si) => {
      const d = ser.data.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
      if (series.length === 1) html += `<path d="${d}L${X(n - 1)},${Y(lo)}L${X(0)},${Y(lo)}Z" fill="url(#${uid})"/>`;
      html += `<path d="${d}" fill="none" stroke="${ser.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
  }
  html += `<line class="cur" y1="${m.t}" y2="${H - m.b}" stroke="#86868b" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>`;
  html += series.map((ser, si) => `<circle class="cd" data-s="${si}" r="4.5" fill="${ser.color}" stroke="#fff" stroke-width="2" opacity="0"/>`).join('');
  html += `<rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" class="hit"/>`;
  s.innerHTML = html;
  if (series.length > 1) { const lg = document.createElement('div'); lg.className = 'legend'; lg.innerHTML = series.map(ser => `<span><i style="background:${ser.color}"></i>${ser.name}</span>`).join(''); el.appendChild(lg); }
  el.appendChild(s);
  const tip = document.createElement('div'); tip.className = 'tip'; el.appendChild(tip);
  const cur = s.querySelector('.cur'), dots = [...s.querySelectorAll('.cd')];
  const show = (i, withTip) => {
    i = clamp(i, 0, n - 1); const x = X(i); cur.setAttribute('x1', x); cur.setAttribute('x2', x); cur.setAttribute('opacity', 1);
    dots.forEach((d, si) => { d.setAttribute('cx', x); d.setAttribute('cy', Y(series[si].data[i])); d.setAttribute('opacity', type === 'bar' ? 0 : 1); });
    if (withTip) {
      tip.innerHTML = `<b>${labelFor(i)}</b>` + series.map(ser => `<div class="row"><span class="sw" style="background:${ser.color}"></span>${series.length > 1 ? ser.name + ' · ' : ''}${ser.data[i].toFixed(decimals)} ${unit}</div>`).join('');
      tip.classList.add('show');
      const r = s.getBoundingClientRect(), sc = r.width / W, px = x * sc, tw = tip.offsetWidth;
      tip.style.left = clamp(px + 12 > r.width - tw ? px - tw - 12 : px + 12, 0, r.width - tw) + 'px'; tip.style.top = (series.length > 1 ? 22 : 4) + 'px';
    }
  };
  const api = { cursor: null, setDay(d) { this.cursor = dayToIndex(d); if (!this.hovering) show(this.cursor, false); }, el };
  const hit = s.querySelector('.hit');
  hit.addEventListener('pointermove', e => { const r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W; const f = (x - m.l) / (W - m.l - m.r); const i = Math.round(type === 'bar' ? f * n - .5 : f * (n - 1)); api.hovering = true; show(i, true); });
  hit.addEventListener('pointerleave', () => { api.hovering = false; tip.classList.remove('show'); if (api.cursor != null) show(api.cursor, false); else { cur.setAttribute('opacity', 0); dots.forEach(d => d.setAttribute('opacity', 0)); } });
  // table view (monthly means)
  const tb = document.createElement('button'); tb.className = 'table-toggle'; tb.textContent = 'Show as table'; el.appendChild(tb);
  tb.addEventListener('click', () => {
    const ex = el.querySelector('.mini-table'); if (ex) { ex.remove(); tb.textContent = 'Show as table'; return; }
    const t = document.createElement('table'); t.className = 'mini-table';
    const per = n / 12, rows = xTicks ? xTicks.map(([i, l], j) => [l, i, j + 1 < xTicks.length ? xTicks[j + 1][0] : n]) : MONTHS.map((mo, k) => [mo, Math.round(k * per), Math.round((k + 1) * per)]);
    t.innerHTML = `<tr><th>${xTicks ? 'Period' : 'Month'}</th>${series.map(x => `<th>${x.name || unit}</th>`).join('')}</tr>` + rows.map(([mo, a0, a1]) => `<tr><td>${mo}</td>${series.map(x => { const sl = x.data.slice(a0, a1); const v = type === 'bar' ? sl.reduce((a, b) => a + b, 0) : sl.reduce((a, b) => a + b, 0) / Math.max(1, sl.length); return `<td>${v.toFixed(decimals)}</td>`; }).join('')}</tr>`).join('');
    el.appendChild(t); tb.textContent = 'Hide table';
  });
  charts.add(api); api.setDay(playback.day);
  return api;
}
const C1 = '#4fd1ff', C2 = '#ff9f43', C3 = '#5ff0b0';
const SEQ = ['#bfe8ff', '#4fc3ff', '#1f7fd6'];


/* ---------- open data: FMI weather + Syke hydrology (last 12 months) ---------- */
const OPEN = { state: 'idle', weather: null, hydro: null, why: {}, done: {} };
const OPEN_SITE = { lat: 66.3700, lon: 29.3120, E: 603390.8, N: 7363068.5 };
const OPEN_N = 365, SYKE_API = 'https://rajapinnat.ymparisto.fi/api/Hydrologiarajapinta/1.1/odata/';
const isoDay = d => d.toISOString().slice(0, 10);
const escH = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const addDays = (d, k) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + k); return x; };
function openWindow() { const end = new Date(); end.setUTCHours(0, 0, 0, 0); const e = addDays(end, -1); return { start: addDays(e, -(OPEN_N - 1)), end: e }; }
// map of 'YYYY-MM-DD' -> value  ->  { data: filled array, latest: {v, date} }  (null if too sparse)
function openSeries(map, start, minDays = 45) {
  const a = new Array(OPEN_N).fill(null), mask = new Array(OPEN_N).fill(0); let k = 0, latest = null;
  for (let i = 0; i < OPEN_N; i++) { const key = isoDay(addDays(start, i)), v = map.get(key); if (v != null && isFinite(v)) { a[i] = v; mask[i] = 1; k++; latest = { v, date: key }; } }
  if (k < minDays) return null;
  let last = -1;
  for (let i = 0; i < OPEN_N; i++) if (a[i] != null) {
    if (last < 0) for (let j = 0; j < i; j++) a[j] = a[i];
    else for (let j = last + 1; j < i; j++) a[j] = a[last] + (a[i] - a[last]) * (j - last) / (i - last);
    last = i;
  }
  for (let j = last + 1; j < OPEN_N; j++) a[j] = a[last];
  return { data: a, latest, days: k, raw: mask };
}
const kmBetween = (la1, lo1, la2, lo2) => { const r = Math.PI / 180, x = (lo2 - lo1) * r * Math.cos((la1 + la2) / 2 * r), y = (la2 - la1) * r; return Math.hypot(x, y) * 6371; };
async function fetchFMI() {
  const { start, end } = openWindow();
  // all stations in a box around Oulanka (Salla – Kuusamo airport); the nearest one that reports each value is used
  const base = `https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::daily::simple&bbox=28.4,65.9,30.2,66.9&parameters=tday,rrday,snow`;
  const chunks = []; for (let s = start; s <= end; s = addDays(s, 92)) { const e = addDays(s, 91); chunks.push([s, e > end ? end : e]); }
  const st = new Map(); // posKey -> { pos, tday, rrday, snow }
  await Promise.all(chunks.map(async ([a, b]) => {
    const r = await fetch(`${base}&starttime=${isoDay(a)}T00:00:00Z&endtime=${isoDay(b)}T00:00:00Z`); if (!r.ok) throw new Error('FMI HTTP ' + r.status);
    const x = new DOMParser().parseFromString(await r.text(), 'text/xml'), q = (el, n) => el.getElementsByTagNameNS('*', n)[0]?.textContent;
    for (const el of x.getElementsByTagNameNS('*', 'BsWfsElement')) {
      const t = q(el, 'Time'), p = q(el, 'ParameterName'), v = parseFloat(q(el, 'ParameterValue')), ps = (q(el, 'pos') || '').trim();
      if (!t || !ps || !['tday', 'rrday', 'snow'].includes(p) || !isFinite(v)) continue;
      if (!st.has(ps)) { const pos = ps.split(/\s+/).map(Number); st.set(ps, { pos, d: kmBetween(OPEN_SITE.lat, OPEN_SITE.lon, pos[0], pos[1]), tday: new Map(), rrday: new Map(), snow: new Map() }); }
      st.get(ps)[p].set(t.slice(0, 10), (p === 'rrday' || p === 'snow') ? Math.max(0, v) : v);
    }
  }));
  const list = [...st.values()].sort((a, b) => a.d - b.d);
  const pick = (p, min) => { for (const S of list) { const ser = openSeries(S[p], start, min); if (ser) return { ser, S }; } return null; };
  const T = pick('tday', 45), P = pick('rrday', 45), SN = pick('snow', 20);
  if (!T) throw new Error(`FMI returned no temperature data (${list.length} stations)`);
  // station names: take the FMI station whose position is closest to the data position (never just the first in the list)
  let fac = null;
  const nameOf = async S => {
    try {
      if (!fac) {
        const r = await fetch('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::ef::stations&bbox=27.5,65.5,31.0,67.5');
        const x = new DOMParser().parseFromString(await r.text(), 'text/xml');
        fac = [...x.getElementsByTagNameNS('*', 'EnvironmentalMonitoringFacility')].map(f => {
          const nm = [...f.getElementsByTagNameNS('*', 'name')].find(n => /\/name$/.test(n.getAttribute('codeSpace') || ''));
          const ps = f.getElementsByTagNameNS('*', 'pos')[0]?.textContent.trim().split(/\s+/).map(Number);
          return nm && ps && ps.length > 1 ? { name: nm.textContent.trim(), pos: ps } : null;
        }).filter(Boolean);
      }
      let best = null, bd = 1e9; for (const f of fac) { const d = kmBetween(S.pos[0], S.pos[1], f.pos[0], f.pos[1]); if (d < bd) { bd = d; best = f; } }
      return best && bd < 1.5 ? best.name : 'FMI weather station';
    } catch (e) { return 'FMI weather station'; }
  };
  const used = [...new Set([T, P, SN].filter(Boolean).map(o => o.S))];
  const names = new Map(await Promise.all(used.map(async S => [S, await nameOf(S)])));
  const tag = o => o ? { station: names.get(o.S), distKm: +o.S.d.toFixed(1) } : {};
  return { kind: 'weather', provider: 'Finnish Meteorological Institute (FMI) open data', licence: 'CC BY 4.0', station: names.get(T.S), distKm: +T.S.d.toFixed(1), start: isoDay(start), end: isoDay(end), updated: new Date().toISOString(),
    series: { airT: { ...T.ser, ...tag(T) }, precip: P ? { ...P.ser, ...tag(P) } : null, snow: SN ? { ...SN.ser, ...tag(SN) } : null } };
}
async function sykeJSON(url) { const r = await fetch(url.startsWith('http') ? url : SYKE_API + url, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error('Syke HTTP ' + r.status); return r.json(); }
async function fetchSYKE() {
  const { start, end } = openWindow();
  const pl = await sykeJSON(`Paikka?$filter=${encodeURIComponent("substringof('Oulankajoki',Nimi)")}&$top=200`);
  const sites = (pl.value || []).map(p => ({ id: p.Paikka_Id, name: p.Nimi, nro: p.Nro, d: Math.hypot((p.KoordErTmIta || 0) - OPEN_SITE.E, (p.KoordErTmPohj || 0) - OPEN_SITE.N) }))
    .filter(x => x.d < 80000).sort((a, b) => a.d - b.d).slice(0, 8);
  if (!sites.length) throw new Error('No Oulankajoki gauges found');
  const get = async (ent, scale) => {
    for (const st of sites) {
      try {
        let url = `${ent}?$filter=${encodeURIComponent(`Paikka_Id eq ${st.id} and Aika ge datetime'${isoDay(start)}T00:00:00'`)}&$orderby=Aika&$top=1000`, guard = 0; const m = new Map();
        while (url && guard++ < 6) { const j = await sykeJSON(url); (j.value || []).forEach(v => { if (v.Arvo != null) m.set(String(v.Aika).slice(0, 10), +v.Arvo * scale); }); url = j['odata.nextLink'] || null; }
        const ser = openSeries(m, start, 30); if (ser) return { ...ser, gauge: st.name, nro: st.nro, distKm: +(st.d / 1000).toFixed(1) };
      } catch (e) { }
    }
    return null;
  };
  const [Q, WL, WT] = await Promise.all([get('Virtaama', 1), get('Vedenkorkeus', .01), get('LampoPintavesi', 1)]);
  if (!Q && !WL) throw new Error('Syke returned no discharge or water level data');
  return { kind: 'hydro', provider: 'Finnish Environment Institute (Syke) hydrology API', licence: 'CC BY 4.0', start: isoDay(start), end: isoDay(end), updated: new Date().toISOString(), series: { Q, WL, WT } };
}
async function openSnapshot(name) { const r = await fetch(`data/open/${name}.json`, { cache: 'no-cache' }); if (!r.ok) throw new Error('no snapshot'); const j = await r.json(); j.snapshot = true; return j; }
function loadOpenData() {
  if (OPEN.promise) return OPEN.promise;
  OPEN.state = 'loading';
  const one = async (key, live, snap) => { try { OPEN[key] = await live(); } catch (e) { OPEN.why[key] = e.message; try { OPEN[key] = await openSnapshot(snap); } catch (e2) { OPEN[key] = null; } }
    OPEN.done[key] = true; if ($('#openLoading')?.dataset.k === key && HERO) renderSiteTab(HERO); };
  OPEN.promise = Promise.all([one('weather', fetchFMI, 'oulanka-weather'), one('hydro', fetchSYKE, 'oulanka-hydro')]).then(() => {
    OPEN.state = 'done'; applyRealData();
  });
  return OPEN.promise;
}
// put the open data into the hub's day-of-year timeline (animations, story, scenarios, AI charts, VR)
function openToDoy(O, ser) {
  const out = new Array(DAYS).fill(null), raw = new Array(DAYS).fill(false), s0 = new Date(O.start + 'T00:00:00Z').getTime();
  for (let i = 0; i < OPEN_N; i++) { const d = new Date(s0 + i * 864e5), doy = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5); if (doy > 364) continue; out[doy] = ser.data[i]; raw[doy] = ser.raw ? !!ser.raw[i] : true; }
  for (let k = 0; k < DAYS; k++) if (out[k] == null) out[k] = out[k - 1] ?? out[k + 1] ?? 0;
  return { a: out, raw };
}
function applyRealData() {
  const W = OPEN.weather, Hy = OPEN.hydro; if (!W && !Hy) return;
  const O = W || Hy, end = new Date(O.end + 'T00:00:00Z');
  REAL.endYear = end.getUTCFullYear(); REAL.endDoy = Math.min(364, Math.floor((end - Date.UTC(REAL.endYear, 0, 1)) / 864e5)); REAL.on = true;
  if (W && W.series.airT) {
    D.airT = openToDoy(W, W.series.airT).a; REAL.weather = true;
    if (W.series.precip) D.precip = openToDoy(W, W.series.precip).a;
    if (W.series.snow) D.snow = openToDoy(W, W.series.snow).a;
    D.weekly = Array.from({ length: 52 }, (_, w) => D.precip.slice(w * 7, w * 7 + 7).reduce((a, b) => a + b, 0));
    const r = mulberry32(31); let ar = 0; const wet = D.smoothArr(D.precip, 2);
    D.cloud = D.precip.map((p, i) => { ar = .85 * ar + (r() - .5) * .5; return clamp(.32 + wet[i] * .22 + ar * .6 + (D.rh[i] - 80) * .012, 0, 1); });
  }
  if (Hy && (Hy.series.Q || Hy.series.WL)) {
    REAL.hydro = true;
    if (Hy.series.Q) { D.Q = openToDoy(Hy, Hy.series.Q).a; PEAK_DAY = argMax(D.Q, 60, 200); }
    if (Hy.series.WL) { D.WL = openToDoy(Hy, Hy.series.WL).a; const so = [...D.WL].sort((a, b) => a - b); D.wlLo = so[Math.floor(DAYS * .02)]; D.wlHi = Math.max(D.wlLo + .3, so[Math.floor(DAYS * .98)]); }
    if (Hy.series.WT) { const t = openToDoy(Hy, Hy.series.WT); D.WT = t.a.map((v, i) => t.raw[i] ? v : ([0, 1, 2, 3, 10, 11].includes(dateOf(i).getUTCMonth()) ? 0.1 : v)); }
    const dQ = D.Q.map((q, i) => i ? Math.max(0, q - D.Q[i - 1]) : 0);
    D.TURB = D.smoothArr(dQ, 2).map((d, i) => 1.8 + d * 0.55 + D.Q[i] * 0.025);
  }
  computeScenarios(); buildStory();
  try { setDay(playback.day); updateStats(); } catch (e) { }
}
// chart helpers for the 12-month window
const openDate = (O, i) => new Date(O.start + 'T00:00:00Z').getTime() + i * 864e5;
const fmtOpen = (O, i) => { const d = new Date(openDate(O, i)); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const openTicks = (O, step = 1) => { const t = []; for (let i = 0; i < OPEN_N; i++) { const d = new Date(openDate(O, i)); if (d.getUTCDate() === 1 && d.getUTCMonth() % 2 === 0) t.push([Math.floor(i / step), `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`]); } return t; };
const openIdx = (O, day) => { const s = new Date(O.start + 'T00:00:00Z'), doy = Math.floor((s - Date.UTC(s.getUTCFullYear(), 0, 1)) / 864e5); return ((day - doy) % 365 + 365) % 365; };
function openChart(el, O, name, ser, unit, o = {}) {
  return chart(el, { series: [{ name, color: C1, data: ser.data }], unit, months: false, xTicks: openTicks(O), labelFor: i => fmtOpen(O, i), dayToIndex: d => openIdx(O, d), ...o });
}
function openWeekly(ser) { const w = []; ser.data.forEach((v, i) => { const k = Math.floor(i / 7); w[k] = (w[k] || 0) + v; }); return w; }
const openBadge = O => `<span class="badge live"><i></i>${O.snapshot ? 'Open data · daily copy' : 'Open data · live'}</span>`;

/* ---------- site panel ---------- */
let siteTab = 'overview';
function openSitePanel(site) {
  charts.clear();
  $('#spIcon').innerHTML = `<b class="sp-code">${siteCode(site)}</b>`; $('#spTitle').textContent = site.name; $('#spSub').textContent = site.sub;
  const tabsWrap = $('#spTabsWrap');
  if (site.hero) {
    tabsWrap.style.display = '';
    makeSeg($('#spTabs'), [{ v: 'overview', label: 'Overview' }, { v: 'sensors', label: 'Sensors' }, { v: 'weather', label: 'Weather' }, { v: 'hydro', label: 'Hydrology' }, { v: 'scen', label: 'Scenarios' }], siteTab, v => { siteTab = v; renderSiteTab(site); });
  } else tabsWrap.style.display = 'none';
  renderSiteTab(site);
  $('#sitePanel').classList.add('show');
  $('#timeline').classList.toggle('shift', innerWidth > 1100);
}
function closeSitePanel() { $('#sitePanel').classList.remove('show'); charts.clear(); $('#timeline').classList.remove('shift'); }
function renderSiteTab(site) {
  const b = $('#spBody'); charts.clear();
  const tab = site.hero ? siteTab : 'overview';
  if (tab !== 'scen') clearScenario();
  if (tab === 'scen') { renderScenarioTab(b); return; }
  const exNote = '<span class="badge"><i></i>Example data</span>';
  if (tab === 'overview') {
    b.innerHTML = `<div class="fade-in">
      <div class="card"><p>${site.text}</p></div>
      ${site.hero ? `
      <div class="stats">
        <div class="stat"><div class="k">Public sensor stations</div><div class="v">${GLOBES.length}</div></div>
        <div class="stat"><div class="k">Public sensors</div><div class="v">${GLOBES.reduce((a, G) => a + G.sensors.length, 0)}</div></div>
        <div class="stat"><div class="k">Drone surveys</div><div class="v">${FEN ? FEN.surveys.length : 0}</div></div>
        <div class="stat"><div class="k">360° views</div><div class="v">${CONFIG.PANORAMAS.length}</div></div>
      </div>
      ${FEN ? fenCardHTML() : ''}
      <div class="card"><h3>Explore</h3>
        <div class="btn-row" style="margin-top:0">
          <button class="btn" data-act="story">${svg('story')}Snowmelt story</button>
          <a class="btn secondary" href="fieldguide/" style="text-decoration:none">${svg('pano')}360° field guide</a>
          <button class="btn secondary" data-act="pano">${svg('pano')}360° views · ${CONFIG.PANORAMAS.length}</button>
          <button class="btn secondary" data-act="scen">${svg('scen')}Scenarios</button>
          <button class="btn secondary" data-act="live">${svg('live')}Video wall</button>
        </div>
        <div class="small-note">Sensor stations and their metadata come from the DIWA critical-zone sensor template; only sensors marked Open data or Public data are shown, at their surveyed positions. The terrain, river, roads and buildings are real (National Land Survey of Finland, CC BY 4.0). Station positions are approximate and time series are illustrative until coordinates and data exports are added.</div>
      </div>` : `
      <div class="card"><h3>Status</h3><dl class="kv"><dt>Table</dt><dd>Placeholder terrain</dd><dt>Layers</dt><dd>Not yet connected</dd><dt>Next step</dt><dd>Add site data with the Oulankajoki template</dd></dl></div>`}
      <div class="card"><h3>Catchment <span class="note">source to sea</span></h3><p>See ${site.name} at catchment scale with its public sensor network.</p><div class="btn-row"><a class="btn secondary" href="catchments/?site=${site.id}" style="text-decoration:none">${svg('map')}Open the catchment map</a></div></div>
      <div class="card"><h3>Ask about this site</h3><p>Open the assistant with a question about ${site.name}.</p><div class="btn-row"><button class="btn ghost" data-act="ask">${svg('ai')}Ask the Hub</button></div></div>
    </div>`;
  } else if (tab === 'sensors') {
    const used = Object.keys(SENSOR_CATS).filter(k => GLOBES.some(G => G.cat === k));
    b.innerHTML = `<div class="fade-in"><div class="card"><h3>Sensor types <span class="note">tap to show or hide</span></h3><div class="chips">${used.map(k => `<button class="chip cat-chip ${sensorFilter.has(k) ? '' : 'off'}" data-cat="${k}"><i style="background:${SENSOR_CATS[k].css}"></i>${SENSOR_CATS[k].label} · ${GLOBES.filter(G => G.cat === k).length}</button>`).join('')}</div></div>
      <div class="card" style="padding:6px 10px">${GLOBES.filter(G => sensorFilter.has(G.cat)).map(G => `<div class="list-row" data-g="${G.id}"><div class="dot" style="width:11px;height:11px;flex:none;margin:0 4px;background:${SENSOR_CATS[G.cat].css};box-shadow:0 0 8px ${SENSOR_CATS[G.cat].css}"></div><div><b>${G.name}</b><span>${G.place ? G.place + ' · ' : ''}${G.sensors.length} sensor${G.sensors.length > 1 ? 's' : ''}</span></div><div class="chev"></div></div>`).join('')}</div>
      <div class="small-note">Only sensors marked Open data or Public data in the DIWA sensor template are shown, at their surveyed positions. Private and confidential sensors are not included.</div></div>`;
    b.querySelectorAll('.list-row').forEach(r => r.addEventListener('click', () => openGlobe(r.dataset.g)));
    b.querySelectorAll('.cat-chip').forEach(c => c.addEventListener('click', () => { const k = c.dataset.cat; sensorFilter.has(k) ? sensorFilter.delete(k) : sensorFilter.add(k); applySensorFilter(); renderSiteTab(site); }));
  } else if (tab === 'weather') {
    const W = OPEN.weather;
    if (!OPEN.done.weather) { loadOpenData(); b.innerHTML = `<div class="fade-in"><div class="card" id="openLoading" data-k="weather"><h3>Loading open weather data…</h3><div class="small-note">Daily observations for the last 12 months from the Finnish Meteorological Institute.</div></div></div>`; }
    else if (W) {
      const S = W.series, upd = S.airT.latest.date;
      b.innerHTML = `<div class="fade-in"><div class="stats" id="wStats"></div>
      <div class="card"><h3>Air temperature <span class="note">°C · daily mean</span></h3><div id="cT"></div></div>
      ${S.precip ? `<div class="card"><h3>Precipitation <span class="note">mm · weekly total</span></h3><div id="cP"></div></div>` : ''}
      ${S.snow ? `<div class="card"><h3>Snow depth <span class="note">cm · daily</span></h3><div id="cS"></div></div>` : ''}
      <div style="display:flex;gap:8px;align-items:flex-start">${openBadge(W)}<span class="small-note" style="margin:0">Source: ${W.provider}, licence ${W.licence}. Station${[...new Set([S.airT, S.precip, S.snow].filter(Boolean).map(x => x.station || W.station))].length > 1 ? 's' : ''}: ${[...new Map([S.airT, S.precip, S.snow].filter(Boolean).map(x => [x.station || W.station, x])).values()].map(x => `${escH(x.station || W.station)} (${x.distKm ?? W.distKm} km away)`).join('; ')}. Last 12 months, latest day ${upd}.${S.snow ? '' : ' No snow depth is reported at this station.'}</span></div></div>`;
      openChart($('#cT'), W, 'Air temperature', S.airT, '°C');
      if (S.precip) chart($('#cP'), { series: [{ name: 'Precipitation', color: C1, data: openWeekly(S.precip) }], unit: 'mm', type: 'bar', months: false, xTicks: openTicks(W, 7), labelFor: i => `Week of ${fmtOpen(W, i * 7)}`, dayToIndex: d => Math.min(52, Math.floor(openIdx(W, d) / 7)) });
      if (S.snow) openChart($('#cS'), W, 'Snow depth', S.snow, 'cm', { decimals: 0, zeroBase: true });
    } else {
      b.innerHTML = `<div class="fade-in"><div class="stats" id="wStats"></div>
      <div class="card"><h3>Air temperature <span class="note">°C · daily</span></h3><div id="cT"></div></div>
      <div class="card"><h3>Precipitation <span class="note">mm · weekly total</span></h3><div id="cP"></div></div>
      <div class="card"><h3>Snow depth <span class="note">cm · daily</span></h3><div id="cS"></div></div>
      <div style="display:flex;gap:8px;align-items:center">${exNote}<span class="small-note" style="margin:0">FMI open data could not be loaded right now, so these are illustrative example series.</span></div></div>`;
      chart($('#cT'), { series: [{ name: 'Air temperature', color: C1, data: D.airT }], unit: '°C' });
      chart($('#cP'), { series: [{ name: 'Precipitation', color: C1, data: D.weekly }], unit: 'mm', type: 'bar', labelFor: i => `Week of ${fmtDate(i * 7)}`, dayToIndex: d => Math.min(51, Math.floor(d / 7)) });
      chart($('#cS'), { series: [{ name: 'Snow depth', color: C1, data: D.snow }], unit: 'cm', decimals: 0, zeroBase: true });
    }
  } else if (tab === 'hydro') {
    const Hy = OPEN.hydro;
    if (!OPEN.done.hydro) { loadOpenData(); b.innerHTML = `<div class="fade-in"><div class="card" id="openLoading" data-k="hydro"><h3>Loading open river data…</h3><div class="small-note">Daily discharge, water level and water temperature for the Oulankajoki from the Finnish Environment Institute.</div></div></div>`; }
    else if (Hy) {
      const S = Hy.series, g = [...new Map([S.Q, S.WL, S.WT].filter(Boolean).map(x => [x.gauge, x])).values()];
      b.innerHTML = `<div class="fade-in"><div class="stats" id="hStats"></div>
      ${S.Q ? `<div class="card"><h3>Discharge <span class="note">m³/s · daily</span></h3><div id="cQ"></div></div>` : ''}
      ${S.WL ? `<div class="card"><h3>Water level <span class="note">m above gauge datum</span></h3><div id="cW"></div></div>` : ''}
      ${S.WT ? `<div class="card"><h3>Water temperature <span class="note">°C</span></h3><div id="cWT"></div></div>` : ''}
      <div style="display:flex;gap:8px;align-items:flex-start">${openBadge(Hy)}<span class="small-note" style="margin:0">Source: ${Hy.provider}, licence ${Hy.licence}. Gauge${g.length > 1 ? 's' : ''}: ${g.map(x => `${escH(x.gauge)}${x.nro ? ' (' + escH(x.nro) + ')' : ''}, ${x.distKm} km away`).join('; ')}. Last 12 months.${S.WT ? '' : ' No water temperature is published for these gauges.'}</span></div></div>`;
      if (S.Q) openChart($('#cQ'), Hy, 'Discharge', S.Q, 'm³/s', { decimals: 1, zeroBase: true });
      if (S.WL) openChart($('#cW'), Hy, 'Water level', S.WL, 'm', { decimals: 2 });
      if (S.WT) openChart($('#cWT'), Hy, 'Water temperature', S.WT, '°C', { zeroBase: true });
    } else {
      b.innerHTML = `<div class="fade-in"><div class="stats" id="hStats"></div>
      <div class="card"><h3>Discharge <span class="note">m³/s</span></h3><div id="cQ"></div></div>
      <div class="card"><h3>Water level <span class="note">m above gauge datum</span></h3><div id="cW"></div></div>
      <div class="card"><h3>Water temperature <span class="note">°C</span></h3><div id="cWT"></div></div>
      <div style="display:flex;gap:8px;align-items:center">${exNote}<span class="small-note" style="margin:0">Syke open data could not be loaded right now, so these are illustrative example series.</span></div></div>`;
      chart($('#cQ'), { series: [{ name: 'Discharge', color: C1, data: D.Q }], unit: 'm³/s', decimals: 0, zeroBase: true });
      chart($('#cW'), { series: [{ name: 'Water level', color: C1, data: D.WL }], unit: 'm', decimals: 2 });
      chart($('#cWT'), { series: [{ name: 'Water temperature', color: C1, data: D.WT }], unit: '°C', zeroBase: true });
    }
  }
  b.querySelectorAll('[data-act]').forEach(x => x.addEventListener('click', () => {
    const a = x.dataset.act;
    if (a === 'story') startStory(); if (a === 'pano') openPano(CONFIG.PANORAMAS[0].id); if (a === 'live') focusLive(); if (a === 'scen') { siteTab = 'scen'; segSet($('#spTabs'), 'scen'); renderSiteTab(site); }
    if (a === 'ask') summonOrb(`Tell me about ${site.name} in Finland.`);
  }));
  updateStats();
}
function updateStats() {
  const d = playback.day, w = $('#wStats'), h = $('#hStats');
  const stat = (k, v, u) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}<small>${u}</small></div></div>`;
  const W = OPEN.weather, Hy = OPEN.hydro, lt = x => x ? x.latest : null, sv = (x, f, dec) => x ? (+x.latest.v).toFixed(dec) : '–';
  if (w && W) w.innerHTML = stat('Air temp. · latest', sv(W.series.airT, 0, 1), '°C') + stat('Snow depth · latest', sv(W.series.snow, 0, 0), W.series.snow ? 'cm' : '') + stat('Precipitation · 30 d', W.series.precip ? W.series.precip.data.slice(-30).reduce((a, b) => a + b, 0).toFixed(0) : '–', W.series.precip ? 'mm' : '') + stat('Latest day', W.series.airT.latest.date.slice(5).split('-').reverse().join('.'), '');
  else if (w) w.innerHTML = stat('Air temperature', D.airT[d].toFixed(1), '°C') + stat('Snow depth', D.snow[d].toFixed(0), 'cm') + stat('Precipitation · 7 d', D.precip.slice(Math.max(0, d - 6), d + 1).reduce((a, b) => a + b, 0).toFixed(1), 'mm') + stat('Cloud cover', Math.round(D.cloud[d] * 100), '%') + stat('Today', D.precip[d] > .3 ? (precipState(d).snow > 0 ? 'Snow' : 'Rain') : 'Dry', D.precip[d] > .3 ? D.precip[d].toFixed(1) + ' mm' : '');
  if (h && Hy) h.innerHTML = stat('Discharge · latest', sv(Hy.series.Q, 0, 1), Hy.series.Q ? 'm³/s' : '') + stat('Water level · latest', sv(Hy.series.WL, 0, 2), Hy.series.WL ? 'm' : '') + (Hy.series.WT ? stat('Water temp. · latest', sv(Hy.series.WT, 0, 1), '°C') : '') + stat('Latest day', ((Hy.series.Q || Hy.series.WL).latest.date).slice(5).split('-').reverse().join('.'), '');
  else if (h) h.innerHTML = stat('Discharge', D.Q[d].toFixed(0), 'm³/s') + stat('Water level', D.WL[d].toFixed(2), 'm') + stat('Water temp.', D.WT[d].toFixed(1), '°C') + stat('Turbidity', D.TURB[d].toFixed(1), 'FNU');
  const sc = $('#scStats'); if (sc && sensorCard.G) sc.innerHTML = sensorStats(sensorCard.G, d);
}

/* ---------- sensor card ---------- */
const sensorCard = { G: null, v: null };
const VARS = {
  airT: { label: 'Air temp', h: 'Air temperature · 2 m', unit: '°C', s: G => [{ name: 'Air temperature', color: C1, data: D.airT.map(v => v + (G.site === 'Puukkosuo fen' ? -.6 : 0)) }] },
  snow: { label: 'Snow depth', h: 'Snow depth', unit: 'cm', dec: 0, zero: true, s: G => [{ name: 'Snow depth', color: C1, data: D.snow.map(v => v * G.snowF) }] },
  sw: { label: 'Radiation', h: 'Incoming shortwave radiation', unit: 'W/m²', dec: 0, zero: true, s: () => [{ name: 'Shortwave in', color: C1, data: D.sw }] },
  rh: { label: 'Humidity', h: 'Relative humidity', unit: '%', dec: 0, s: () => [{ name: 'Relative humidity', color: C1, data: D.smoothArr(D.rh, 2) }] },
  co2: { label: 'CO₂', h: 'CO₂ mole fraction · 2 m', unit: 'ppm', dec: 0, s: () => [{ name: 'CO₂', color: C1, data: D.smoothArr(D.co2, 2) }] },
  pres: { label: 'Pressure', h: 'Air pressure', unit: 'hPa', dec: 0, s: () => [{ name: 'Air pressure', color: C1, data: D.pres }] },
  soil10: { label: 'Soil −10 cm', h: 'Soil temperature at −10 cm by treatment', unit: '°C', s: () => [{ name: 'Control', color: C1, data: D.soil10.CTL }, { name: 'Snow reduced (S−)', color: C2, data: D.soil10['S−'] }, { name: 'Snow added (S+)', color: C3, data: D.soil10['S+'] }] },
  profile: { label: 'Soil profile', h: 'Soil temperature profile · control', unit: '°C', s: () => Object.entries(D.profile).map(([k, v], i) => ({ name: k, color: SEQ[i], data: v })) },
  snowpack: { label: 'Snowpack', h: 'Snowpack temperature · 10 cm above ground', unit: '°C', s: () => [{ name: 'Snowpack temperature', color: C1, data: D.snowpack }] },
  wl: { label: 'Water level', h: 'Water level', unit: 'm', dec: 2, s: () => [{ name: 'Water level', color: C1, data: D.WL }] },
  q: { label: 'Discharge', h: 'Discharge', unit: 'm³/s', dec: 0, zero: true, s: () => [{ name: 'Discharge', color: C1, data: D.Q }] },
  wt: { label: 'Water temp', h: 'Water temperature', unit: '°C', s: () => [{ name: 'Water temperature', color: C1, data: D.WT }] },
  turb: { label: 'Turbidity', h: 'Turbidity', unit: 'FNU', s: () => [{ name: 'Turbidity', color: C1, data: D.TURB }] },
  vwc: { label: 'Soil moisture', h: 'Volumetric water content · −10 cm', unit: 'm³/m³', dec: 2, s: () => [{ name: 'Volumetric water content', color: C1, data: D.vwc }] },
};
function applySensorFilter() { globeObjs.forEach(o => { o.grp.visible = sensorFilter.has(o.G.cat); if (o.grp.visible) pickables.includes(o.shell) || pickables.push(o.shell); else { const k = pickables.indexOf(o.shell); if (k >= 0) pickables.splice(k, 1); } }); }
function fenCardHTML() {
  const T = tableOf('oulanka'), cur = T?.fenKey || FEN_BY_SEASON[state.season];
  const S = FEN.surveys.find(x => x.key === cur) || FEN.surveys[0];
  return `<div class="card" id="fenCard"><h3>Puukkosuo fen from the air <span class="note">drone surveys 2024</span></h3>
    <div class="var-pills">${FEN.surveys.map(x => `<button data-fen="${x.key}" class="${x.key === S.key ? 'active' : ''}">${x.season}</button>`).join('')}</div>
    <dl class="kv"><dt>Survey</dt><dd>${S.label} · ${S.product}</dd><dt>Flight</dt><dd>${S.images} images from ${S.alt_m} m</dd><dt>Ground resolution</dt><dd>${S.gsd_cm} cm per pixel</dd><dt>Area</dt><dd>${S.area_km2} km²</dd><dt>Accuracy</dt><dd>${S.gcp_err_cm} cm at ${S.gcp} control point${S.gcp > 1 ? 's' : ''}</dd><dt>Ground model</dt><dd>DTM ${FEN.dtm.date}, ${FEN.dtm.res_cm} cm · approximate</dd></dl>
    <div class="small-note">${FEN.by}. ${FEN.camera}, processed in ${FEN.software}. The season buttons above the hall also switch these photos.</div></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-fen]'); if (b) setFenSurvey(b.dataset.fen); });
function setFenSurvey(key) {
  const T = tableOf('oulanka'); if (!T || !T.real) return;
  const S = FEN.surveys.find(x => x.key === key); const season = Object.keys(FEN_BY_SEASON).find(k => FEN_BY_SEASON[k] === key);
  fenKey = null; if (season && season !== state.season) { stopPlay(); applySeason(season); segSet($('#seasonSeg'), season); } else realSeason(T, state.season, state.layers.landcover, false);
  toast(`Puukkosuo · ${S.season.toLowerCase()} survey, ${S.label}`, 2200);
}
function sensorStats(G, d) {
  const stat = (k, v, u) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}<small>${u}</small></div></div>`;
  if (G.water) return stat('Water level', D.WL[d].toFixed(2), 'm') + stat('Water temp.', D.WT[d].toFixed(1), '°C');
  if (G.id === 'snow-block') return stat('Soil −10 cm · S−', D.soil10['S−'][d].toFixed(1), '°C') + stat('Soil −10 cm · S+', D.soil10['S+'][d].toFixed(1), '°C');
  return stat('Air temperature', D.airT[d].toFixed(1), '°C') + stat('Snow depth', (D.snow[d] * G.snowF).toFixed(0), 'cm');
}
function openGlobe(id, fly = true) {
  const G = GLOBES.find(g => g.id === id), o = globeObjs.find(g => g.G.id === id); if (!G || !o) return;
  sensorCard.G = G; sensorCard.v = G.vars ? G.vars[0] : null;
  if (fly) {
    const T = tableOf('oulanka'); const wp = new THREE.Vector3(); o.grp.getWorldPosition(wp); wp.y += .42;
    const dir = new THREE.Vector3(-T.group.position.x * .3, 0, 24 - T.group.position.z).normalize();
    flyTo(wp.clone().add(dir.multiplyScalar(2.1)).setY(wp.y + 1.25), wp.clone().setY(wp.y - .1), 1500);
  }
  renderSensorCard(); $('#sensorCard').classList.add('show');
}
function renderSensorCard() {
  const G = sensorCard.G, v = VARS[sensorCard.v];
  if (G.real) { renderStationCard(G); return; }
  [...charts].forEach(c => { if (c.el.id === 'scChart') charts.delete(c); });
  $('#scInner').innerHTML = `
    <div class="sc-head"><div class="sc-orb"></div><div><h3>${G.name}</h3><p>${G.treat}</p></div><button class="x" id="scClose" style="margin-left:auto">${svg('x')}</button></div>
    <div class="stats" id="scStats">${sensorStats(G, playback.day)}</div>
    <div class="card"><div class="var-pills">${G.vars.map(k => `<button data-v="${k}" class="${k === sensorCard.v ? 'active' : ''}">${VARS[k].label}</button>`).join('')}</div>
      <h3>${v.h} <span class="note">${v.unit}</span></h3><div id="scChart"></div>
      <div style="margin-top:6px"><span class="badge"><i></i>Example data</span></div></div>
    <div class="card"><h3>Metadata <span class="note">DIWA template</span></h3>
      <dl class="kv"><dt>Site</dt><dd>${G.site}</dd><dt>Units</dt><dd>${G.plots}</dd><dt>Since</dt><dd>${G.since}</dd><dt>Heights</dt><dd>${G.heights}</dd><dt>Data quality</dt><dd>${G.flags} flagged periods${G.changes ? ` · ${G.changes} wiring changes` : ''}</dd><dt>Position</dt><dd>${OUL ? 'Approximate · on the real map, exact coordinates pending' : 'Illustrative · coordinates pending'}</dd></dl></div>
    <div class="card"><h3>Measures</h3><div class="chips">${G.measures.map(m => `<span class="chip">${m}</span>`).join('')}</div></div>
    <div class="card"><h3>Sensors</h3><div class="chips">${G.sensors.map(m => `<span class="chip gray">${m}</span>`).join('')}</div></div>`;
  chart($('#scChart'), { series: v.s(G), unit: v.unit, decimals: v.dec ?? 1, zeroBase: !!v.zero });
  $('#scClose').addEventListener('click', closeSensorCard);
  $('#scInner').querySelectorAll('.var-pills button').forEach(bt => bt.addEventListener('click', () => { sensorCard.v = bt.dataset.v; renderSensorCard(); }));
  globeObjs.forEach(o => o.tag.classList.toggle('show', o.G.id === G.id));
}
function renderStationCard(G) {
  const C = SENSOR_CATS[G.cat] || SENSOR_CATS.other, esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const since = G.sensors.map(x => x.start).filter(Boolean).sort()[0];
  $('#scInner').innerHTML = `
    <div class="sc-head"><div class="sc-orb" style="background:radial-gradient(circle at 35% 30%,#fff,${C.css} 45%,transparent 72%)"></div><div><h3>${esc(G.name)}</h3><p>${esc(G.place || G.site)} · ${C.label}</p></div><button class="x" id="scClose" style="margin-left:auto">${svg('x')}</button></div>
    <div class="stats"><div class="stat"><div class="k">Sensors</div><div class="v">${G.sensors.length}</div></div><div class="stat"><div class="k">Measuring since</div><div class="v">${since ? since.slice(0, 4) : '—'}</div></div></div>
    ${G.sensors.map(x => `<div class="card"><h3>${esc([x.producer, x.model].filter(Boolean).join(' ') || 'Sensor')} ${x.label ? `<span class="note">${esc(x.label)}</span>` : ''}</h3>
      <dl class="kv">${x.type ? `<dt>Observes</dt><dd>${esc(x.type)}</dd>` : ''}${x.params ? `<dt>Parameters</dt><dd>${esc(x.params)}${x.units ? ` <span class="note">(${esc(x.units)})</span>` : ''}</dd>` : ''}${x.res ? `<dt>Interval</dt><dd>${esc(x.res)}</dd>` : ''}${x.start ? `<dt>Since</dt><dd>${esc(x.start)}${x.end ? ' to ' + esc(x.end) : ''}</dd>` : ''}${x.fmt ? `<dt>Format</dt><dd>${esc(x.fmt)}</dd>` : ''}<dt>Data level</dt><dd>${esc(x.level)}</dd></dl>
      ${x.note ? `<div class="small-note">${esc(x.note)}</div>` : ''}</div>`).join('')}
    <div class="card"><h3>Location <span class="note">ETRS-TM35FIN</span></h3><dl class="kv"><dt>Easting</dt><dd>${G.E}</dd><dt>Northing</dt><dd>${G.N}</dd>${G.z ? `<dt>Elevation</dt><dd>${G.z} m (N2000)</dd>` : ''}</dl>
      <div class="small-note">From the DIWA critical-zone sensor template. No readings are shown for this station yet: its time series will be connected from the DIWA datalake. The Weather and Hydrology tabs show open data from FMI and Syke.</div></div>`;
  $('#scClose').addEventListener('click', closeSensorCard);
  globeObjs.forEach(o => o.tag.classList.toggle('show', o.G.id === G.id));
}
function closeSensorCard() { $('#sensorCard').classList.remove('show'); sensorCard.G = null; globeObjs.forEach(o => o.tag.classList.remove('show')); [...charts].forEach(c => { if (c.el.id === 'scChart') charts.delete(c); }); }

/* =====================================================================
   Timeline playback
   ===================================================================== */
const playback = { day: 120, playing: false, speed: 1, acc: 0 };
function setDay(d, fromUser = false) {
  playback.day = clamp(Math.round(d), 0, DAYS - 1);
  $('#tlRange').value = playback.day;
  $('#tlFill').style.width = (playback.day / (DAYS - 1) * 100) + '%';
  $('#tlDate').innerHTML = `${fmtDate(playback.day)}<small>${dateOf(playback.day).getUTCFullYear()} · ${seasonOfDay(playback.day)}</small>`;
  charts.forEach(c => c.setDay(playback.day));
  updateStats();
  const s = seasonOfDay(playback.day);
  if ((playback.playing || fromUser || story.active) && s !== state.season) applySeason(s);
  // water level on the hero table
  const T = tableOf('oulanka'); if (T && !scen.kind) { const k = (D.WL[playback.day] - D.wlLo) / (D.wlHi - D.wlLo); T.waterTarget = T.wlBase + clamp(k, -.1, 1) * (T.real ? T.wlAmp : .055); }
}
function togglePlay() { playback.playing ? stopPlay() : startPlay(); }
function startPlay() { if (playback.day >= DAYS - 1) setDay(0); playback.playing = true; $('#tlPlay').innerHTML = svg('pause'); }
function stopPlay() { playback.playing = false; $('#tlPlay').innerHTML = svg('play'); }

/* =====================================================================
   Story mode — spring snowmelt flood (illustrative)
   ===================================================================== */
const story = { active: false, i: 0 };
let STORY = [];
const argMax = (a, i0, i1) => { let k = i0; for (let i = i0; i <= i1; i++) if (a[i] > a[k]) k = i; return k; };
const fmtDY = i => `${fmtDate(i)} ${dateOf(i).getUTCFullYear()}`;
function buildStory() {
  const snowPk = argMax(D.snow, 0, 130);
  let melt = -1; for (let i = snowPk; i < 200; i++) if (D.airT[i] > 0 && D.airT[i + 1] > 0 && D.airT[i + 2] > 0 && D.snow[i + 4] < D.snow[i] - 1) { melt = i; break; }
  if (melt < 0) melt = Math.min(snowPk + 20, 150);
  let bare = -1; for (let i = melt; i < 220; i++) if (D.snow[i] < 1) { bare = i; break; }
  const peak = PEAK_DAY, rec = Math.min(260, peak + 35), base = Math.max(0, Math.min(snowPk, peak - 30));
  const wSrc = REAL.weather ? 'the FMI weather station at the research station' : 'the example weather series', hSrc = REAL.hydro ? 'the Syke gauge on the Oulankajoki' : 'the example river series';
  STORY = [
    { eyebrow: `Snowpack peak · ${fmtDY(snowPk)}`, title: 'The snowpack peaks', day: snowPk, view: 'over',
      text: () => `On ${fmtDY(snowPk)} the snow at ${wSrc} reached ${D.snow[snowPk].toFixed(0)} cm, the deepest of the winter. The river is under ice and flows at about ${D.Q[snowPk].toFixed(0)} m³/s at ${hSrc}.` },
    { eyebrow: `Melt onset · ${fmtDY(melt)}`, title: 'Warm days start the melt', day: melt, view: 'snow',
      text: () => `From ${fmtDY(melt)} the daily mean air temperature stays above 0 °C and the snow starts to go: ${D.snow[melt].toFixed(0)} cm on that day${bare >= 0 ? `, and the ground is snow-free by ${fmtDY(bare)}` : ''}.` },
    { eyebrow: `Flood peak · ${fmtDY(peak)}`, title: 'Meltwater reaches the river', day: peak, view: 'river',
      text: () => `Discharge peaks on ${fmtDY(peak)} at about ${D.Q[peak].toFixed(0)} m³/s, roughly ${Math.max(1, Math.round(D.Q[peak] / Math.max(1, D.Q[base])))}× the late-winter flow. The water level is ${(D.WL[peak] - D.WL[base]).toFixed(1)} m higher than in late winter.` },
    { eyebrow: `Recession · ${fmtDY(rec)}`, title: 'Back to summer conditions', day: rec, view: 'over',
      text: () => `By ${fmtDY(rec)} flow has fallen to about ${D.Q[rec].toFixed(0)} m³/s and the water temperature is ${D.WT[rec].toFixed(0)} °C. Summer rain now drives the smaller peaks.` },
  ];
}
buildStory();
function startStory() {
  clearScenario(); story.active = true; stopPlay(); buildStory();
  if (focus.id !== 'oulanka') focusSite('oulanka', { keepStory: true, noFly: true });
  siteTab = 'hydro'; openSitePanel(HERO);
  $('#stDots').innerHTML = STORY.map(() => '<i></i>').join('');
  $('#btnStory').innerHTML = svg('x') + 'End story';
  $('#story').classList.add('show'); storyStep(0);
}
function storyStep(i) {
  if (i < 0) return; if (i >= STORY.length) { endStory(); return; }
  story.i = i; const S = STORY[i], T = tableOf('oulanka');
  $('#stEyebrow').textContent = S.eyebrow + (REAL.weather && REAL.hydro ? ' · measured' : ' · illustrative'); $('#stTitle').textContent = S.title; $('#stText').textContent = S.text();
  $('#stDots').querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === i));
  $('#stPrev').style.visibility = i ? 'visible' : 'hidden'; $('#stNext').textContent = i === STORY.length - 1 ? 'Finish' : 'Next';
  const p0 = playback.day; tween(1500, e => setDay(lerp(p0, S.day, e)), easeInOut);
  const c = T.group.position;
  if (S.view === 'over') flyTo(new THREE.Vector3(c.x + 2.2, 11, c.z + 11), new THREE.Vector3(c.x, 1.2, c.z), 1900);
  if (S.view === 'snow' && globeObjs.length) { const wp = new THREE.Vector3(); (globeObjs.find(o => o.G.place === 'Puukkosuo fen') || globeObjs[0]).grp.getWorldPosition(wp); flyTo(wp.clone().add(new THREE.Vector3(.9, 1.5, 2.2)), wp.clone().add(new THREE.Vector3(0, .3, 0)), 1900); }
  if (S.view === 'river') flyTo(new THREE.Vector3(c.x + 4.6, 3.2, c.z + 4.6), new THREE.Vector3(c.x - .7, 1.15, c.z - .35), 1900);
}
function endStory(silent) {
  if (!story.active) return; story.active = false;
  $('#story').classList.remove('show'); $('#btnStory').innerHTML = svg('story') + 'Snowmelt story';
  if (!silent) { const T = tableOf('oulanka'), v = T.view(); flyTo(v.pos, v.tgt, 1600); }
}

/* =====================================================================
   360° viewer
   ===================================================================== */
const pano = { active: false, scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 1000), lon: 0, lat: 0, vlon: 0, vlat: 0, drag: null, cache: {}, current: null, video: null };
const panoSphere = new THREE.Mesh(new THREE.SphereGeometry(100, 72, 48).scale(-1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
pano.scene.add(panoSphere);
function placeholderPano(P) {
  return canvasTex(2048, 1024, (g, w, h) => {
    const r = mulberry32(P.id.charCodeAt(1) * 31);
    const sk = g.createLinearGradient(0, 0, 0, h / 2); sk.addColorStop(0, '#5f95d4'); sk.addColorStop(.75, '#b9d4ec'); sk.addColorStop(1, '#eaf2f8'); g.fillStyle = sk; g.fillRect(0, 0, w, h / 2);
    const sunG = g.createRadialGradient(w * .3, h * .3, 0, w * .3, h * .3, 160); sunG.addColorStop(0, 'rgba(255,250,230,1)'); sunG.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = sunG; g.fillRect(0, 0, w, h / 2);
    for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; const x = r() * w, y = 80 + r() * 260; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + k * 34, y + (r() - .5) * 14, 60 + r() * 40, 18 + r() * 10, 0, 0, 7); g.fill(); } }
    g.fillStyle = '#7f98a8'; g.beginPath(); g.moveTo(0, h / 2); for (let x = 0; x <= w; x += 16) g.lineTo(x, h / 2 - 30 - 26 * Math.sin(x / w * 6.2832 * 5) - 14 * Math.sin(x / w * 6.2832 * 17 + 1)); g.lineTo(w, h / 2); g.fill();
    const gr = g.createLinearGradient(0, h / 2, 0, h); gr.addColorStop(0, '#5f6f3e'); gr.addColorStop(1, '#3c4a2a'); g.fillStyle = gr; g.fillRect(0, h / 2, w, h / 2);
    if (P.kind === 'river') { const rv = g.createLinearGradient(0, h * .52, 0, h * .78); rv.addColorStop(0, '#6c9cbf'); rv.addColorStop(1, '#2f5f80'); g.fillStyle = rv; g.beginPath(); g.moveTo(0, h * .56); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * .55 + 18 * Math.sin(x / w * 6.2832 * 4)); for (let x = w; x >= 0; x -= 20) g.lineTo(x, h * .72 + 30 * Math.sin(x / w * 6.2832 * 3 + 1)); g.fill(); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${r() * .5})`; g.fillRect(r() * w, h * .56 + r() * h * .16, 6 + r() * 14, 1.5); } }
    for (let i = 0; i < 520; i++) { const x = r() * w, base = h / 2 + (P.kind === 'river' ? -6 : 10) + r() * 18, th = 26 + r() * 60, tw = th * .24; g.fillStyle = `hsl(${118 + r() * 20},${28 + r() * 15}%,${14 + r() * 10}%)`; g.beginPath(); g.moveTo(x, base - th); g.lineTo(x - tw, base); g.lineTo(x + tw, base); g.fill(); }
    if (P.kind === 'station') { for (let i = 0; i < 5; i++) { const x = 300 + i * 360 + r() * 80, y = h / 2 + 30, bw = 170 + r() * 80, bh = 70 + r() * 30; g.fillStyle = '#9a3b26'; g.fillRect(x, y - bh, bw, bh); g.fillStyle = '#3a2a24'; g.beginPath(); g.moveTo(x - 10, y - bh); g.lineTo(x + bw / 2, y - bh - 46); g.lineTo(x + bw + 10, y - bh); g.fill(); g.fillStyle = '#f4f1ea'; for (let k = 0; k < 3; k++) g.fillRect(x + 20 + k * (bw - 50) / 2, y - bh + 20, 26, 26); } }
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '600 34px -apple-system, Inter, sans-serif'; g.textAlign = 'center';
    for (let k = 0; k < 4; k++) g.fillText(`Placeholder · add ${P.file}`, w * (k + .5) / 4, h * .9);
  });
}
function loadPano(P) {
  if (pano.cache[P.id]) return Promise.resolve(pano.cache[P.id]);
  return new Promise(res => {
    if (/\.(mp4|webm)$/i.test(P.file)) {
      const v = document.createElement('video'); v.src = P.file; v.crossOrigin = 'anonymous'; v.loop = true; v.muted = true; v.playsInline = true;
      v.addEventListener('canplay', () => { const t = new THREE.VideoTexture(v); t.colorSpace = THREE.SRGBColorSpace; pano.cache[P.id] = { tex: t, ph: false, video: v }; res(pano.cache[P.id]); }, { once: true });
      v.addEventListener('error', () => { pano.cache[P.id] = { tex: placeholderPano(P), ph: true }; res(pano.cache[P.id]); }, { once: true });
      v.load(); return;
    }
    new THREE.TextureLoader().load(P.file, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; pano.cache[P.id] = { tex: t, ph: false }; res(pano.cache[P.id]); }, undefined,
      () => { pano.cache[P.id] = { tex: placeholderPano(P), ph: true }; res(pano.cache[P.id]); });
  });
}
const thumbOf = P => P.thumb || P.file.replace(/([^/]+)$/, 'thumbs/$1');
async function showPanoImage(id) {
  const list = CONFIG.PANORAMAS, i = list.findIndex(p => p.id === id), P = list[i]; pano.current = id;
  $('#panoTitle').textContent = P.title; $('#panoSub').textContent = `${P.sub ? P.sub + ' · ' : ''}${i + 1} / ${list.length}`;
  $('#panoStrip').querySelectorAll('.thumb').forEach(t => t.classList.toggle('active', t.dataset.id === id));
  $('#panoStrip .thumb.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  const loading = !pano.cache[P.id]; if (loading) $('#panoLoad').classList.add('show');
  const r = await loadPano(P);
  if (pano.current !== id) return;
  $('#panoLoad').classList.remove('show');
  if (pano.video && pano.video !== r.video) pano.video.pause();
  pano.video = r.video || null; if (pano.video) pano.video.play().catch(() => {});
  panoSphere.material.map = r.tex; panoSphere.material.needsUpdate = true;
  pano.lon = P.yaw ?? 180; pano.lat = 0; pano.vlon = pano.vlat = 0; pano.idle = 0;
  $('#panoPh').style.display = r.ph ? '' : 'none'; $('#panoPh').textContent = `Placeholder image — save your 360° photo as ${P.file}`;
  // warm the cache for the next view
  const nx = list[(i + 1) % list.length]; if (!pano.cache[nx.id]) setTimeout(() => loadPano(nx), 600);
}
function panoStep(d) { const list = CONFIG.PANORAMAS, i = list.findIndex(p => p.id === pano.current); showPanoImage(list[(i + d + list.length) % list.length].id); }
async function openPano(id) {
  endStory(true); stopPlay();
  const w = $('#whiteout'); w.classList.add('on');
  await new Promise(r => setTimeout(r, 480));
  if (!$('#panoStrip').children.length) {
    $('#panoStrip').innerHTML = CONFIG.PANORAMAS.map(P => `<button class="thumb" data-id="${P.id}" style="background-image:url('${thumbOf(P)}')"><span>${P.title}</span></button>`).join('');
    $('#panoStrip').querySelectorAll('.thumb').forEach(b => b.addEventListener('click', () => showPanoImage(b.dataset.id)));
  }
  pano.active = true; controls.enabled = false; pano.cam.fov = 75; pano.cam.updateProjectionMatrix();
  document.querySelectorAll('.hide-in-pano').forEach(e => e.classList.add('pano-hidden'));
  $('#css2d').style.display = $('#css3d').style.display = 'none';
  $('#panoUI').classList.add('show'); $('#panoHint').style.opacity = 1; setTimeout(() => $('#panoHint').style.opacity = 0, 2600);
  await showPanoImage(id);
  w.classList.remove('on');
}
async function closePano() {
  const w = $('#whiteout'); w.classList.add('on'); await new Promise(r => setTimeout(r, 480));
  pano.active = false; controls.enabled = true; if (pano.video) pano.video.pause();
  document.querySelectorAll('.hide-in-pano').forEach(e => e.classList.remove('pano-hidden'));
  $('#css2d').style.display = $('#css3d').style.display = '';
  $('#panoUI').classList.remove('show'); w.classList.remove('on');
}
function panoInput() {
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { if (!pano.active) return; pano.drag = { x: e.clientX, y: e.clientY, lon: pano.lon, lat: pano.lat }; pano.idle = 0; });
  addEventListener('pointermove', e => { if (!pano.active || !pano.drag) return; const k = pano.cam.fov / 75 * .12; const nl = pano.drag.lon - (e.clientX - pano.drag.x) * k, nt = pano.drag.lat + (e.clientY - pano.drag.y) * k; pano.vlon = nl - pano.lon; pano.vlat = nt - pano.lat; pano.lon = nl; pano.lat = nt; });
  addEventListener('pointerup', () => { pano.drag = null; });
  el.addEventListener('wheel', e => { if (!pano.active) return; pano.cam.fov = clamp(pano.cam.fov + e.deltaY * .03, 35, 95); pano.cam.updateProjectionMatrix(); }, { passive: true });
}
function updatePano(dt) {
  if (!pano.drag) { pano.lon += pano.vlon; pano.lat += pano.vlat; pano.vlon *= .92; pano.vlat *= .92; pano.idle += dt; if (pano.idle > 3) pano.lon += dt * 2.2; }
  pano.lat = clamp(pano.lat, -85, 85);
  const phi = THREE.MathUtils.degToRad(90 - pano.lat), th = THREE.MathUtils.degToRad(pano.lon);
  pano.cam.lookAt(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
}

/* =====================================================================
   AI companion — conversation via proxy + voice (Web Speech API)
   ===================================================================== */
const ai = { history: [], busy: false, speak: true, rec: null, listening: false, revealTimer: null, hideTimer: null };
const SUGGEST = ['Give me a tour', 'Show me the spring flood', 'What can I see in this hall?', 'List the supersites', 'What do the Oulanka sensors measure?', 'Explain spring snowmelt floods simply'];
const ORB_STATUS = { idle: 'Tap the orb or hold Space to talk', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…' };
function md(t) {
  const esc = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const blocks = esc.split(/\n{2,}/).map(b => {
    if (/^\s*[-•*] /m.test(b)) return '<ul>' + b.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^\s*[-•*] /, '')}</li>`).join('') + '</ul>';
    return `<p>${b.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  return blocks.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
}
const plain = t => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/[`#*]/g, '').replace(/^\s*[-•] /gm, '• ');
function addMsg(role, text, raw = false) {
  const m = document.createElement('div'); m.className = 'msg ' + role; m.innerHTML = raw ? text : md(text);
  $('#aiMsgs').appendChild(m); $('#aiMsgs').scrollTo({ top: 1e6, behavior: 'smooth' }); return m;
}
function autoGrow() { const t = $('#aiInput'); t.style.height = 'auto'; t.style.height = Math.min(120, t.scrollHeight) + 'px'; }
function setOrbState(s) {
  if (ORB.state !== s) ORB.flash = 1;
  ORB.state = s;
  $('#abStatus').textContent = ORB_STATUS[s];
  const bar = $('#assistBar'); ['idle', 'listening', 'thinking', 'speaking'].forEach(k => bar.classList.toggle(k, k === s));
  music.duck(s === 'idle' ? 1 : s === 'thinking' ? .55 : .22);
}
function caption(you, ans, opts = {}) {
  const c = $('#orbCaption'); clearTimeout(ai.hideTimer);
  if (you !== undefined) $('#capYou').textContent = you;
  if (ans !== undefined) $('#capAns').innerHTML = ans;
  c.classList.toggle('has-you', !!$('#capYou').textContent);
  if (ORB.mode === 'companion') c.classList.add('show');
  if (opts.hideAfter) ai.hideTimer = setTimeout(() => c.classList.remove('show'), opts.hideAfter);
}
function summonOrb(prefill) {
  if (ORB.mode !== 'companion') {
    ORB.mode = 'companion'; ORB.flash = 1;
    $('#assistBar').classList.add('show'); document.body.classList.add('assist-on');
    setOrbState('idle');
    caption('', 'Hi, I’m your AI Companion. Ask me anything — hold <b>Space</b> or tap the orb to talk.', { hideAfter: 7000 });
  }
  if (prefill) { $('#abInput').value = prefill; $('#abInput').focus({ preventScroll: true }); }
}
function dismissOrb() {
  stopListening(true); stopSpeaking(); clearInterval(ai.revealTimer);
  ORB.mode = 'docked'; setOrbState('idle');
  $('#assistBar').classList.remove('show'); document.body.classList.remove('assist-on'); $('#orbCaption').classList.remove('show');
  $('#aiPanel').classList.remove('show');
}
function aiInit() {
  const connected = !!CONFIG.AI_PROXY_URL;
  [$('#aiStatus'), $('#abConn')].forEach(st => { st.className = (st.id === 'abConn' ? 'ab-conn ' : 'ai-status ') + (connected ? 'ok' : 'off'); });
  $('#aiStatus span').textContent = connected ? 'Connected' : 'Not connected · set AI_PROXY_URL';
  $('#abConn').title = connected ? `Connected · ${CONFIG.AI_MODEL_LABEL}` : 'AI model not connected yet';
  addMsg('bot', 'Hi! I’m your AI Companion. Ask me anything — speak to the orb or type here.');
  if (!connected) addMsg('sys', 'The AI model isn’t connected yet. Deploy the included worker.js and paste its URL into CONFIG.AI_PROXY_URL (see README). Voice input and spoken replies already work.');
  $('#aiSuggest').innerHTML = SUGGEST.map(s => `<button>${s}</button>`).join('');
  $('#aiSuggest').querySelectorAll('button').forEach(b => b.addEventListener('click', () => sendAI(b.textContent)));
  $('#aiInput').addEventListener('input', autoGrow);
  $('#aiInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } e.stopPropagation(); });
  $('#aiSend').addEventListener('click', () => sendAI());
  $('#abInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const v = $('#abInput').value; $('#abInput').value = ''; sendAI(v); } if (e.key === 'Escape') $('#abInput').blur(); e.stopPropagation(); });
  $('#abSend').addEventListener('click', () => { const v = $('#abInput').value; $('#abInput').value = ''; sendAI(v); });
  const spk = () => { ai.speak = !ai.speak; [$('#aiSpk'), $('#abSpk')].forEach(b => b.classList.toggle('on', ai.speak)); if (!ai.speak) stopSpeaking(); toast(ai.speak ? 'Spoken replies on' : 'Spoken replies off', 1600); };
  $('#aiSpk').addEventListener('click', spk); $('#abSpk').addEventListener('click', spk);
  [$('#aiSpk'), $('#abSpk')].forEach(b => b.classList.toggle('on', ai.speak));
  $('#aiMic').addEventListener('click', toggleListening); $('#abMic').addEventListener('click', toggleListening); $('#abOrb').addEventListener('click', toggleListening);
  $('#abHist').addEventListener('click', () => { const p = $('#aiPanel'); if (p.classList.contains('show')) p.classList.remove('show'); else { closeSitePanel(); p.classList.add('show'); } });
  $('#abClose').addEventListener('click', dismissOrb);
}
/* ---------- what the assistant knows about the hall (sent with every question) ---------- */
function hubContext() {
  const code = s => s.code || siteCode(s);
  const L = [];
  L.push('ABOUT THIS HALL (DIWA Spatial Hub, demo by Siamak Bazzaz, MetaParametric.com). The user is standing inside it right now and can see everything listed here.');
  L.push('DIWA = Digital Waters, a Finnish research flagship (Research Council of Finland) on water and environmental monitoring, led by the University of Oulu with partners such as SYKE and the University of Turku. Website: digitalwaters.fi.');
  L.push('It is an oval glass hall with a forest landscape outside: a real 360° photo of the Oulankajoki riverside in Oulanka National Park, Kuusamo.');
  L.push(`SUPERSITE TABLES (${SITES.length} miniature 3D landscape tables, each labelled with a two-letter code). The big centre table is the hero site; the others form a ring around it:`);
  SITES.forEach((s, i) => L.push(`${i + 1}. ${code(s)} · ${s.name} (${s.sub})${s.hero ? ' — CENTRE TABLE, the only one with full data layers' : ''}. ${s.text}`));
  L.push(OUL ? 'The Oulankajoki table is a real map: a 3.7 km wide circle centred on Oulanka Research Station, built from the National Land Survey 2 m elevation model and terrain database (river, lakes, road 8693 and its bridge, trails, the station buildings, the visitor centre, Kiutaköngäs rapids, the Puukkosuo fen and the national park boundary). Terrain height is exaggerated 1.2×. Sensor positions on it are approximate. The other tables are still illustrative.' : 'The table terrains, trees and sensor positions are illustrative, not real elevation data; real DSM / elevation data will come in a later version.');
  L.push(`OULANKAJOKI SENSOR STATIONS (small glowing globes on the centre table, coloured by type: green soil, blue surface water, violet groundwater, yellow atmosphere, white remote sensing; only Open or Public sensors from the DIWA critical-zone sensor template): ${GLOBES.map(G => `${G.name}${G.place ? ' at ' + G.place : ''} (${G.sensors.map(x => [x.producer, x.model].filter(Boolean).join(' ') + (x.params ? ': ' + x.params : '')).join('; ')})`).join(' | ')}.`);
  if (FEN) L.push(`PUUKKOSUO FEN DRONE SURVEYS (${FEN.by}, ${FEN.camera}): ${FEN.surveys.map(S => `${S.season} ${S.label}, ${S.images} images from ${S.alt_m} m, ${S.gsd_cm} cm/pixel, accuracy ${S.gcp_err_cm} cm`).join('; ')}. The fen photo on the table follows the season buttons.`);
  L.push('Clicking a sensor globe opens a card with a time-series chart. A timeline at the bottom plays one year of illustrative weather and hydrology (discharge, water level, water temperature, air temperature, snow depth), and the table changes with the seasons (winter snow, spring melt, summer, autumn colours).');
  L.push(`SCENARIOS on the Oulankajoki table (ILLUSTRATIVE ONLY: made for demonstration, not model output or observations; always say so when you mention them): flooding (${FLOOD.map(f => f.name).join(', ')}) and river ice (${ICE.map(f => f.name).join(', ')}). There is also a story mode about the spring snowmelt flood.`);
  L.push(`360° PHOTOS: ${CONFIG.PANORAMAS.length} real 360° photos from Oulanka are pinned on the centre table (${CONFIG.PANORAMAS.map(p => p.title).join(', ')}). Clicking one opens it full screen.`);
  L.push(`MEDIA WALL at the back of the hall, left to right: a Finland map board with pulsing circles for each supersite; three big video screens (${CONFIG.SCREENS.map(v => v.title).join('; ')}) that play when you walk close and unmute when clicked; and a Latest News board with a slideshow from digitalwaters.fi.`);
  L.push(`Current news on the board: ${CONFIG.NEWS.map(n => `${n.date}: ${n.title}`).join('; ')}.`);
  L.push(`DIWA KNOWLEDGE PANEL: a large screen on the right wall, next to the news panel, with a sofa and two armchairs in front. Questions about DIWA papers and data are answered from the DIWA library (${KN.docs.length} documents loaded); the paper behind the answer is shown on the left of the panel, the conversation on the right.`);
  L.push(`LOUNGES: ${LOUNGES.length} seating corners (sofa, two armchairs, coffee table with two DIWA brochures, a lamp) near the walls, each with a shared whiteboard behind the sofa for drawing and writing together.`);
  L.push(`RESIDENT AGENTS: ${AGENTS.map(A => A.name).join(', ')} are three friendly agent avatars (coloured circles with a small 'agent' label) who live in the hall. Emma is the tour guide and greeter; each agent hosts three tables (Emma: Oulankajoki, Kemijoki, Sodankylä; Suzan: Tana, Pallas, Oulu Region; Sofia: Kokkola, Archipelago Sea, Vantaanjoki). Visitors can tap an agent for a tour or to see the spring flood, river ice, winter, the northern lights, a 360° photo, the video wall or the map, or ask you, for example 'show me the spring flood', and an agent will do it. Otherwise they wander, sit in the lounges and chat. They are part of the demo, not real visitors. Right now: ${agentsSummary()}.`);
  L.push('YOU, the assistant, are the glowing sci-fi orb that floats near the user. A big faded DIWA logo is printed on the floor near the entrance.');
  L.push('CONTROLS (top right and bottom dock): day/night toggle (night shows northern lights and stars outside), layers (sensors, rivers, catchment, land cover, 360° photos, clouds, rain/snow, particles), generated lo-fi background music, People (multi-user sessions where visitors appear as coloured circle avatars and talk by voice), VR button for headsets like Meta Quest 3, help. The bottom dock flies to each table; keys 1–9 too. Users can also sit on the sofas.');
  // live state
  const near = []; const cp = camera.position;
  tables.forEach(T => near.push([T.site.name + ' table', Math.hypot(cp.x - T.site.pos[0], cp.z - T.site.pos[1])]));
  SCREENS.forEach(S => near.push([`video screen "${S.cfg?.title || ''}"`, cp.distanceTo(S.center)]));
  near.push(['Finland map board', Math.hypot(cp.x - MAPB.pos.x, cp.z - MAPB.pos.z)], ['DIWA Catchments board', Math.hypot(cp.x - CATB.pos.x, cp.z - CATB.pos.z)], ['news board', Math.hypot(cp.x - NEWS.pos.x, cp.z - NEWS.pos.z)]);
  LOUNGES.forEach((p, i) => near.push([`lounge ${i + 1}`, Math.hypot(cp.x - p.x, cp.z - p.z)]));
  near.sort((a, b) => a[1] - b[1]);
  const st = [];
  st.push(focus.id ? `the user is looking at the ${SITE[focus.id].name} table` : 'the user is walking freely in the hall');
  st.push(`closest things: ${near.slice(0, 3).map(n => n[0]).join(', ')}`);
  st.push(state.night ? 'it is night mode (northern lights outside)' : 'it is day mode');
  st.push(`timeline date ${fmtDate(playback.day)}, season ${seasonOfDay(playback.day)}`);
  if (scen.kind) st.push(`active scenario: ${scen.kind === 'flood' ? (FLOOD.find(f => f.id === scen.id)?.name || 'flood') : (ICE.find(f => f.id === scen.id)?.name || 'river ice')}`);
  const on = Object.entries(state.layers).filter(([, v]) => v).map(([k]) => k); st.push(`layers on: ${on.join(', ')}`);
  st.push(`the user's name is ${mp.name || 'unknown'}`); if (mp.joined) st.push(`other real visitors in the hall: ${mp.peers.size ? [...mp.peers.values()].map(P => P.name).join(', ') : 'none right now'}`);
  if (music.on) st.push('lo-fi music is playing');
  L.push('RIGHT NOW: ' + st.join('; ') + '.');
  return L.join('\n');
}
async function sendAI(text) {
  text = (text ?? $('#aiInput').value).trim(); if (!text || ai.busy) return;
  if (ORB.mode !== 'companion') summonOrb();
  const cmd = agentCommand(text);
  if (cmd) {                                   // a guide request: an agent handles it, no AI call needed
    $('#aiInput').value = ''; autoGrow(); $('#aiSuggest').innerHTML = '';
    addMsg('user', text); addMsg('bot', cmd.help ? `${cmd.A.name} will answer.` : `${cmd.A.name} will show you.`);
    caption(text, `<b>${cmd.A.name}</b> ${cmd.help ? 'will answer.' : 'is on her way…'}`, { hideAfter: 3500 }); setOrbState('idle');
    runAgentCommand(cmd); return;
  }
  if (knWanted(text)) return kAsk(text);             // questions about DIWA papers and data go to the DIWA library
  $('#aiInput').value = ''; autoGrow(); $('#aiSuggest').innerHTML = '';
  addMsg('user', text); ai.history.push({ role: 'user', content: text });
  const typing = addMsg('bot', '<span class="typing"><i></i><i></i><i></i></span>', true); ai.busy = true;
  setOrbState('thinking'); caption(text, '<span class="typing"><i></i><i></i><i></i></span>');
  let reply;
  try {
    if (!CONFIG.AI_PROXY_URL) { await new Promise(r => setTimeout(r, 900)); reply = 'I’m not connected to an AI model yet. Once the proxy URL is set in the configuration, I’ll answer questions like this one.'; }
    else {
      const res = await fetch(CONFIG.AI_PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: ai.history.slice(-16), context: (() => { try { return hubContext(); } catch (e) { console.warn('hubContext', e); return ''; } })() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.reply) throw new Error(j.error || `HTTP ${res.status}`);
      reply = j.reply; if (j.engine) { const lbl = j.engine === 'claude' ? 'Claude' : 'Free AI · Workers AI'; $('#aiStatus span').textContent = 'Connected · ' + lbl; $('#abConn').title = 'Connected · ' + lbl; }
    }
  } catch (e) { reply = `Sorry — I couldn’t reach the assistant (${e.message}). Please try again in a moment.`; }
  typing.remove(); addMsg('bot', reply); ai.history.push({ role: 'assistant', content: reply }); ai.busy = false;
  deliver(reply);
}
/* ---------- assistant voice: pick the most human-sounding voice available ---------- */
const FEMALE = ['ava', 'emma', 'jenny', 'aria', 'michelle', 'sonia', 'libby', 'natasha', 'clara', 'zoe', 'samantha', 'serena', 'karen', 'moira', 'tessa', 'fiona', 'allison', 'susan', 'kate', 'joanna', 'salli', 'female', 'hazel', 'zira', 'catherine', 'victoria', 'nicky', 'shelley', 'sandy', 'flo'];
const MALE = ['guy', 'davis', 'tony', 'jason', 'brian', 'ryan', 'thomas', 'daniel', 'alex', 'fred', 'david', 'mark', 'george', 'james', 'eric', 'christopher', 'roger', 'steffan', 'andrew', 'male', 'rishi', 'aaron', 'arthur', 'oliver', 'reed', 'rocko', 'grandpa', 'eddy'];
function voiceScore(v) {
  const n = v.name.toLowerCase(); let s = 0;
  if (!/^en/i.test(v.lang)) return -99;
  if (/natural|neural/.test(n)) s += 10; if (/premium|enhanced|wavenet/.test(n)) s += 8; if (/google/.test(n)) s += 3;
  if (FEMALE.some(f => n.includes(f))) s += 5; if (MALE.some(f => new RegExp('\\b' + f + '\\b').test(n))) s -= 8;
  if (/en-(us|gb)/i.test(v.lang)) s += 1; if (/compact|novelty|bells|bad news|whisper|bubbles|zarvox|trinoids|organ|cellos/.test(n)) s -= 20;
  return s;
}
const voicePick = { list: [], best: null, choice: (() => { try { return localStorage.getItem('hub.voice') || 'auto'; } catch { return 'auto'; } })() };
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voicePick.list = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a));
  voicePick.best = voicePick.list[0] || null; fillVoiceSelect();
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.addEventListener?.('voiceschanged', loadVoices); }
function fillVoiceSelect() {
  const sel = document.getElementById('voiceSel'); if (!sel) return;
  const best = voicePick.best ? ` · ${voicePick.best.name.replace(/^Microsoft |^Google /, '').replace(/ Online \(Natural\).*| - English.*/, '')}` : '';
  sel.innerHTML = `<option value="auto">Automatic (most natural)${best}</option><option value="cloud">Cloud voice · Workers AI</option>` +
    voicePick.list.slice(0, 30).map(v => `<option value="v:${v.name.replace(/"/g, '')}">${v.name}</option>`).join('');
  sel.value = voicePick.choice; if (!sel.value) { sel.value = 'auto'; voicePick.choice = 'auto'; }
}
const isNaturalVoice = v => !!v && /natural|neural|premium|enhanced/i.test(v.name);
function voicePlan() {
  const c = voicePick.choice, proxy = !!CONFIG.AI_PROXY_URL;
  if (c === 'cloud' || (CONFIG.AI_VOICE === 'cloud' && c === 'auto')) return proxy ? { cloud: true } : { voice: voicePick.best };
  if (c.startsWith('v:')) return { voice: voicePick.list.find(v => v.name.replace(/"/g, '') === c.slice(2)) || voicePick.best };
  if (CONFIG.AI_VOICE === 'browser') return { voice: voicePick.best };
  return isNaturalVoice(voicePick.best) || !proxy ? { voice: voicePick.best } : { cloud: true };
}
const tts = { audio: null, an: null, buf: new Float32Array(512) };
async function speakCloud(text, onEnd) {
  const res = await fetch(CONFIG.AI_PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tts: text }) });
  if (!res.ok || !/audio/.test(res.headers.get('Content-Type') || '')) throw new Error('cloud voice unavailable');
  const url = URL.createObjectURL(await res.blob());
  const el = new Audio(url); tts.audio = el;
  const ctx = music.ensureCtx();
  if (ctx) { ctx.resume(); const src = ctx.createMediaElementSource(el); tts.an = ctx.createAnalyser(); tts.an.fftSize = 512; src.connect(tts.an); tts.an.connect(ctx.destination); }
  el.onended = el.onerror = () => { URL.revokeObjectURL(url); tts.audio = null; tts.an = null; onEnd(); };
  await el.play();
  return el;
}
function stopSpeaking() { speechSynthesis?.cancel(); if (tts.audio) { tts.audio.pause(); tts.audio.onended?.(); } }
function ttsLevel() { if (!tts.an) return -1; tts.an.getFloatTimeDomainData(tts.buf); let s = 0; for (let i = 0; i < tts.buf.length; i++) s += tts.buf[i] * tts.buf[i]; return Math.sqrt(s / tts.buf.length); }
function deliver(reply) {
  const txt = plain(reply); clearInterval(ai.revealTimer); stopSpeaking();
  let shown = 0, boundaryUsed = false, cloudEl = null;
  const render = () => { const a = $('#capAns'); a.textContent = txt.slice(0, shown); a.scrollTop = a.scrollHeight; };
  caption(undefined, ''); setOrbState('speaking');
  const finish = () => { clearInterval(ai.revealTimer); shown = txt.length; render(); if (ORB.state === 'speaking') setOrbState('idle'); caption(undefined, undefined, { hideAfter: 9000 }); };
  ai.revealTimer = setInterval(() => {
    if (cloudEl && cloudEl.duration) shown = Math.max(shown, Math.floor(txt.length * cloudEl.currentTime / cloudEl.duration) + 4);
    else if (!boundaryUsed || !ai.speak) shown = Math.min(txt.length, shown + 2);
    render(); if (!ai.speak && shown >= txt.length) finish();
  }, 33);
  if (!ai.speak) return;
  const browserSpeak = voice => {
    if (!('speechSynthesis' in window)) { ai.speak = false; return; }
    const u = new SpeechSynthesisUtterance(txt); u.voice = voice || voicePick.best || null;
    u.rate = isNaturalVoice(u.voice) ? 1 : 1.02; u.pitch = 1.04;
    u.onboundary = e => { boundaryUsed = true; shown = Math.max(shown, e.charIndex + (e.charLength || 6)); ORB.speakEnv = 1; };
    u.onend = finish; u.onerror = finish; speechSynthesis.speak(u);
  };
  const plan = voicePlan();
  if (plan.cloud) speakCloud(txt, finish).then(el => cloudEl = el).catch(() => browserSpeak(voicePick.best));
  else browserSpeak(plan.voice);
}
/* microphone level for the orb */
const mic = { stream: null, an: null, buf: null };
async function micStart() {
  try {
    const ctx = music.ensureCtx(); if (!ctx) return; await ctx.resume();
    mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const src = ctx.createMediaStreamSource(mic.stream); mic.an = ctx.createAnalyser(); mic.an.fftSize = 512; mic.buf = new Float32Array(512); src.connect(mic.an);
  } catch (e) { mic.an = null; }
}
function micStop() { mic.stream?.getTracks().forEach(t => t.stop()); mic.stream = null; mic.an = null; }
function micLevel() {
  if (!mic.an) return .05 + .06 * Math.random();
  mic.an.getFloatTimeDomainData(mic.buf); let s = 0; for (let i = 0; i < mic.buf.length; i++) s += mic.buf[i] * mic.buf[i];
  return Math.sqrt(s / mic.buf.length);
}
function toggleListening() { ai.listening ? stopListening() : startListening(); }
function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (ORB.mode !== 'companion') summonOrb();
  if (!SR) { toast('Voice input isn’t supported in this browser — try Chrome or Edge, or type your question.'); $('#abInput').focus(); return; }
  if (ai.listening || ai.busy) return;
  stopSpeaking(); clearInterval(ai.revealTimer);
  const rec = new SR(); ai.rec = rec; rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = false;
  let finalText = '', interim = '';
  rec.onstart = () => { ai.listening = true; setOrbState('listening'); caption('', '<span class="hint">Listening…</span>'); micStart(); };
  rec.onresult = e => { let s = ''; for (const r of e.results) { s += r[0].transcript; if (r.isFinal) finalText = s; } interim = s; caption(s, '<span class="hint">Listening…</span>'); };
  rec.onerror = e => { if (e.error === 'not-allowed') toast('Microphone permission was blocked. Allow it in the address bar to talk.'); else if (e.error !== 'no-speech' && e.error !== 'aborted') toast('Microphone error: ' + e.error); };
  rec.onend = () => {
    ai.listening = false; micStop();
    const t = (finalText || interim).trim();
    if (t && !ai.cancelled) sendAI(t); else { setOrbState('idle'); caption('', '<span class="hint">I didn’t catch that — try again.</span>', { hideAfter: 2500 }); }
    ai.cancelled = false;
  };
  ai.cancelled = false; rec.start();
}
function stopListening(cancel = false) { if (!ai.listening) return; ai.cancelled = cancel; ai.rec?.stop(); }

/* =====================================================================
   Lo-fi music — composed live with the Web Audio API (no audio files)
   ===================================================================== */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const PROG = {
  warm: [{ b: 43, n: [58, 62, 65, 69] }, { b: 48, n: [58, 64, 67, 69] }, { b: 41, n: [57, 60, 64, 67] }, { b: 38, n: [53, 57, 60, 64] }],   // Gm9 · C13 · Fmaj9 · Dm9
  winter: [{ b: 38, n: [53, 57, 60, 64] }, { b: 46, n: [57, 60, 62, 65] }, { b: 41, n: [57, 60, 64, 69] }, { b: 48, n: [55, 60, 65, 67] }], // Dm9 · Bbmaj7 · Fmaj7 · Csus
};
const PENTA = [72, 74, 77, 79, 81, 84, 86];
const music = {
  ctx: null, on: true, amb: false, vol: .5, started: false, mood: 'warm', step: 0, bar: 0, nextT: 0, timer: null, rnd: mulberry32(72),
  ensureCtx() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const c = this.ctx = new AC();
    this.out = c.createDynamicsCompressor(); this.out.threshold.value = -16; this.out.ratio.value = 3; this.out.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = 0; this.master.connect(this.out);
    this.duckG = c.createGain(); this.duckG.connect(this.master);
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 3200; this.lp.Q.value = .4; this.lp.connect(this.duckG);
    this.bus = c.createGain(); this.bus.gain.value = .9; this.bus.connect(this.lp);
    this.rev = c.createConvolver(); this.rev.buffer = this.impulse(3.4); this.revG = c.createGain(); this.revG.gain.value = .3; this.rev.connect(this.revG); this.revG.connect(this.lp);
    this.keys = c.createGain(); this.keys.gain.value = .55; this.keys.connect(this.bus); this.keysSend = c.createGain(); this.keysSend.gain.value = .5; this.keys.connect(this.keysSend); this.keysSend.connect(this.rev);
    this.drums = c.createGain(); this.drums.gain.value = .8; this.drums.connect(this.bus);
    this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.ambG = c.createGain(); this.ambG.gain.value = 0; this.ambG.connect(this.duckG);
    return c;
  },
  impulse(sec) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    return b;
  },
  start() {
    const c = this.ensureCtx(); if (!c) return; c.resume();
    if (!this.started) {
      this.started = true; this.nextT = c.currentTime + .15;
      this.timer = setInterval(() => this.schedule(), 25);
      this.startAmbience();
    }
    this.apply(2.5);
  },
  apply(fade = .8) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(this.on ? this.vol * .9 : 0, t, fade / 3);
    this.ambG.gain.setTargetAtTime(this.amb ? (this.mood === 'winter' ? .2 : .12) : 0, t, .6);
  },
  duck(level, sec = .5) { if (this.ctx) this.duckG.gain.setTargetAtTime(level, this.ctx.currentTime, sec / 3); },
  setMood(season) {
    this.mood = season === 'winter' ? 'winter' : 'warm'; if (!this.ctx) return; const t = this.ctx.currentTime;
    this.lp.frequency.setTargetAtTime(season === 'winter' ? 2100 : season === 'summer' ? 3800 : 3000, t, .8);
    this.drums.gain.setTargetAtTime(season === 'winter' ? .28 : season === 'spring' ? .65 : .8, t, .8);
    this.revG.gain.setTargetAtTime(season === 'winter' ? .48 : .3, t, .8);
    this.apply();
  },
  schedule() {
    const c = this.ctx, spb = 60 / 72 / 4;
    while (this.nextT < c.currentTime + .15) {
      const swing = this.step % 2 ? spb * .2 : 0;
      this.play(this.step, this.nextT + swing);
      this.nextT += spb; this.step = (this.step + 1) % 16; if (!this.step) this.bar++;
    }
  },
  play(s, t) {
    const r = this.rnd, ch = PROG[this.mood][this.bar % 4], winter = this.mood === 'winter';
    if (s === 0) { ch.n.forEach((m, i) => this.ep(mtof(m), t + i * .012, .085, 3.2)); this.bass(mtof(ch.b), t, .3, 1.6); }
    if (s === 10 && r() < .5) ch.n.slice(1).forEach((m, i) => this.ep(mtof(m), t + i * .01, .05, 1.4));
    if ((s === 7 || s === 10) && r() < .45 && !winter) this.bass(mtof(ch.b + (r() < .5 ? 7 : 12)), t, .2, .5);
    if (s === 0 || (s === 10 && !winter) || (s === 7 && r() < .2)) this.kick(t);
    if (s === 4 || s === 12) this.snare(t, winter ? .5 : 1);
    if (s % 2 === 0) this.hat(t, .5 + r() * .5);
    if (s % 2 === 0 && r() < (winter ? .1 : .14)) this.bell(mtof(PENTA[Math.floor(r() * PENTA.length)]), t);
    if (r() < .05) this.pop(t);
  },
  env(g, t, a, peak, dec, sus, end) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(.0001, peak * sus), t + a + dec); g.gain.exponentialRampToValueAtTime(.0001, t + end); },
  ep(f, t, v, dur) {
    const c = this.ctx, g = c.createGain(), o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(), trem = c.createOscillator(), tg = c.createGain();
    o1.type = 'sine'; o1.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2.003; g2.gain.value = .12;
    trem.frequency.value = 4.2; tg.gain.value = .12; trem.connect(tg); tg.connect(g.gain);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.keys);
    this.env(g, t, .012, v, .7, .35, dur);
    [o1, o2, trem].forEach(o => { o.start(t); o.stop(t + dur + .05); });
  },
  bass(f, t, v, dur) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 320; o.connect(lp); lp.connect(g); g.connect(this.bus);
    this.env(g, t, .02, v, .4, .5, dur); o.start(t); o.stop(t + dur + .05);
  },
  kick(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); o.connect(g); g.connect(this.drums);
    g.gain.setValueAtTime(.75, t); g.gain.exponentialRampToValueAtTime(.001, t + .38); o.start(t); o.stop(t + .4);
  },
  noiseHit(t, type, freq, q, v, dur) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q; s.connect(f); f.connect(g); g.connect(this.drums);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.start(t, Math.random()); s.stop(t + dur + .02);
  },
  snare(t, k) { this.noiseHit(t, 'bandpass', 1900, .7, .16 * k, .2); const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.value = 185; o.connect(g); g.connect(this.drums); g.gain.setValueAtTime(.08 * k, t); g.gain.exponentialRampToValueAtTime(.001, t + .09); o.start(t); o.stop(t + .1); },
  hat(t, v) { this.noiseHit(t, 'highpass', 7200, .5, .045 * v, .045); },
  pop(t) { this.noiseHit(t, 'highpass', 2500, .3, .035 + Math.random() * .03, .006); },
  bell(f, t) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 3.01; g2.gain.value = .15;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.keysSend); g.connect(this.keys);
    this.env(g, t, .02, .05, 1.2, .2, 2.6); o.start(t); o2.start(t); o.stop(t + 2.7); o2.stop(t + 2.7);
  },
  startAmbience() {
    const c = this.ctx;
    // wind through the trees
    const w = c.createBufferSource(); w.buffer = this.noise; w.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .6;
    const wg = c.createGain(); wg.gain.value = .5;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .07; lg.gain.value = .35; lfo.connect(lg); lg.connect(wg.gain);
    const lfo2 = c.createOscillator(), lg2 = c.createGain(); lfo2.frequency.value = .045; lg2.gain.value = 180; lfo2.connect(lg2); lg2.connect(bp.frequency);
    w.connect(bp); bp.connect(wg); wg.connect(this.ambG); w.start(); lfo.start(); lfo2.start();
    // vinyl hiss
    const v = c.createBufferSource(); v.buffer = this.noise; v.loop = true; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4500;
    const vg = c.createGain(); vg.gain.value = .012; v.connect(hp); hp.connect(vg); vg.connect(this.bus); v.start();
  },
};
document.addEventListener('visibilitychange', () => { if (!music.ctx) return; document.hidden ? music.ctx.suspend() : music.ctx.resume(); });

/* =====================================================================
   Scenarios — flooding and river ice on the Oulankajoki table (illustrative)
   ===================================================================== */
const FLOOD_W0 = 90, FLOOD_W1 = 200; // 1 Apr – 19 Jul
const FLOOD = [
  { id: 'typical', name: 'Typical spring flood', sub: 'Median snowmelt year', k: 1.0, rise: .012, color: SEQ[0] },
  { id: 'q50', name: '1-in-50-year flood', sub: '2 % chance in any year', k: 1.85, rise: .03, color: SEQ[1] },
  { id: 'q250', name: '1-in-250-year flood', sub: '0.4 % chance in any year', k: 2.55, rise: .046, color: SEQ[2] },
];
const SEASON_DAYS = [...Array(61).keys()].map(i => 304 + i).concat([...Array(151).keys()]); // 1 Nov → 31 May
const ICE_TICKS = [[0, 'Nov'], [30, 'Dec'], [61, 'Jan'], [92, 'Feb'], [120, 'Mar'], [151, 'Apr'], [181, 'May']];
const ICE = [
  { id: 'cold', name: 'Cold winter', sub: 'About 4 °C colder than typical', dT: -4, color: C1 },
  { id: 'jam', name: 'Ice jam at breakup', sub: 'Typical winter · ice piles up at a river bend', dT: 0, color: C3, jam: true },
  { id: 'mild', name: 'Mild winter', sub: 'About 4.5 °C warmer than typical', dT: 4.5, color: C2 },
];
function iceSeries(dT) {
  let h = 0, freeze = -1, breakup = -1; const out = [];
  SEASON_DAYS.forEach((d, k) => {
    const T = D.airT[d] + dT, a = 2.5 / (1 + D.snow[d] / 45); // snow on the ice slows growth
    if (breakup >= 0) h = 0;
    else if (T < 0) h = Math.sqrt(h * h + a * a * (-T)); // Stefan's law (freezing degree-days)
    else h = Math.max(0, h - 1.15 * T);                   // degree-day melt
    if (freeze < 0 && h > 3) freeze = k;
    if (freeze >= 0 && breakup < 0 && k > 120 && h < 15 && T > 0) { breakup = k; h = 0; }
    out.push(h);
  });
  return { h: out, freeze, breakup, max: Math.max(...out), days: out.filter(v => v > 1).length };
}
const smoothBump = (i, c, w) => Math.exp(-(((i - c) / w) ** 2));
function computeScenarios() {
FLOOD.forEach(f => {
  f.Q = D.Q.slice(FLOOD_W0, FLOOD_W1 + 1).map((q, j) => { const i = FLOOD_W0 + j; return q * (1 + (f.k - 1) * smoothBump(i, PEAK_DAY + 2 * (f.k - 1), 13 + 4 * (f.k - 1))); });
  f.peak = Math.max(...f.Q);
});
ICE.forEach(s => s.res = iceSeries(s.dT));
}
computeScenarios();

const scen = { kind: null, id: null, sub: 'flood', iceK: 75, icePlaying: false, iceAcc: 0, ice: null, floes: null, floeData: [], curve: null, label: null, labelEl: null, iceChart: null };
function buildScenarioObjects() {
  const T = tableOf('oulanka');
  scen.iceMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe7f7, transparent: true, opacity: .9, roughness: .25, metalness: 0, clearcoat: .8, clearcoatRoughness: .15, emissive: 0x0b3050, emissiveIntensity: .35 });
  if (T.real) { scen.ice = new THREE.Mesh(T.water.geometry, scen.iceMat); scen.ice.visible = false; T.group.add(scen.ice); }
  else { scen.ice = new THREE.Mesh(new THREE.CircleGeometry(T.Rt - .008, 140), scen.iceMat); scen.ice.rotation.x = -Math.PI / 2; scen.ice.visible = false; T.group.add(scen.ice); }
  const main = T.shape.paths.find(p => p.main).pts.filter(([x, z]) => Math.hypot(x, z) < .93);
  scen.curve = new THREE.CatmullRomCurve3(main.map(([x, z]) => new THREE.Vector3(x * T.Rt, 0, z * T.Rt)));
  const n = 170, fg = new THREE.CylinderGeometry(1, 1, 1, 6);
  scen.floes = new THREE.InstancedMesh(fg, new THREE.MeshStandardMaterial({ color: 0xf2f7fb, roughness: .45 }), n); scen.floes.visible = false; scen.floes.castShadow = true; T.group.add(scen.floes);
  const r = mulberry32(5);
  const fk = T.real ? .38 : 1;
  for (let i = 0; i < n; i++) scen.floeData.push({ u: r(), lat: (r() - .5) * .08 * fk, s: (.03 + r() * .04) * fk, sp: .6 + r() * .8, rot: r() * 6, tilt: (r() - .5) * .8, stack: r() });
  const el = document.createElement('div'); el.innerHTML = '<div class="scen-tag"></div>';
  scen.label = new CSS2DObject(el); scen.labelEl = el.firstElementChild; scen.label.visible = false; T.group.add(scen.label);
}
let JAM_U = .56;
function updateScenario(dt) {
  if (!scen.kind) return;
  const T = tableOf('oulanka');
  if (scen.kind === 'ice') {
    if (scen.icePlaying) { scen.iceAcc += dt * 9; if (scen.iceAcc >= 1) { const s = Math.floor(scen.iceAcc); scen.iceAcc -= s; setIceDay(scen.iceK + s >= SEASON_DAYS.length - 1 ? (stopIce(), SEASON_DAYS.length - 1) : scen.iceK + s); } }
    scen.ice.position.y = T.water.position.y + .003 + scen.iceH * (T.real ? .00005 : .00018);
    if (scen.floes.visible) {
      const o = new THREE.Object3D(), S = ICE.find(s => s.id === scen.id), jam = S.jam, p = new THREE.Vector3(), tn = new THREE.Vector3();
      scen.floeData.forEach((f, i) => {
        if (jam) { const target = JAM_U - f.stack * (T.real ? .07 : .16); f.u = lerp(f.u, target, 1 - Math.exp(-dt * .8 * f.sp)); }
        else { f.u += dt * .018 * f.sp; if (f.u > 1) f.u -= 1; }
        scen.curve.getPointAt(clamp(f.u, 0, 1), p); scen.curve.getTangentAt(clamp(f.u, 0, 1), tn);
        const side = new THREE.Vector3(-tn.z, 0, tn.x).multiplyScalar(f.lat * (jam ? 1.4 : 1));
        o.position.copy(p).add(side); o.position.y = waterYAt(T, o.position.x, o.position.z) + .004 + (jam ? f.stack * f.stack * (T.real ? .012 : .03) * Math.max(0, 1 - Math.abs(f.u - JAM_U) * (T.real ? 9 : 4)) : 0);
        o.rotation.set(jam ? f.tilt : 0, f.rot + (jam ? 0 : f.u * 3), jam ? f.tilt * .6 : 0);
        o.scale.set(f.s, .006, f.s * .8); o.updateMatrix(); scen.floes.setMatrixAt(i, o.matrix);
      });
      scen.floes.instanceMatrix.needsUpdate = true;
    }
  }
}
function scenarioWaterColor(on) { const T = tableOf('oulanka'); if (on) T.wMat.color.setHex(0x6d8f9c); else T.wMat.color.setHex(WATER[state.season].color); }
function clearScenario() {
  if (!scen.kind) return;
  stopIce(); scen.kind = null; scen.id = null;
  scen.ice.visible = false; scen.floes.visible = false; scen.label.visible = false;
  scenarioWaterColor(false); const T = tableOf('oulanka'); T.waterTarget = undefined; setDay(playback.day); syncHeroLabels();
}
function riverPoint(u) { const p = new THREE.Vector3(); scen.curve.getPointAt(u, p); const T = tableOf('oulanka'); if (T.real) p.y = waterYAt(T, p.x, p.z) - T.water.position.y + T.wlBase; return p; }
function scenView(u = .5) { const T = tableOf('oulanka'), p = riverPoint(u).add(T.group.position); p.y = T.real ? p.y + .05 : 1.15; const dir = new THREE.Vector3(-T.group.position.x * .3, 0, 24 - T.group.position.z).normalize(); return { pos: p.clone().addScaledVector(dir, 2.9).add(new THREE.Vector3(.8, 1.35, 0)), tgt: p }; }
function floodedShare(rise) {
  if (OUL) { const N = OUL.grid, m = rise * 100; let land = 0, fl = 0; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -1 + 2 * i / (N - 1), z = -1 + 2 * j / (N - 1); if (Math.hypot(x, z) > .9) continue; const k = j * N + i, h = OUL.H[k], l = OUL.L[k]; if (h > l) { land++; if (h < l + m) fl++; } } return fl / land; }
  const T = tableOf('oulanka'), wl = T.shape.wl, lvl = wl + rise; let land = 0, fl = 0;
  T.meta.forEach(m => { const r = Math.hypot(m.x, m.z); if (r > .9) return; if (m.h > wl) { land += r + .01; if (m.h < lvl) fl += r + .01; } });
  return fl / land;
}
FLOOD.forEach(f => f.share = 0);
function applyFlood(id, fly = true) {
  const F = FLOOD.find(f => f.id === id), T = tableOf('oulanka');
  if (scen.kind !== 'flood') { clearScenario(); scen.kind = 'flood'; }
  scen.id = id; stopPlay();
  if (state.season !== 'spring') applySeason('spring');
  setDay(PEAK_DAY); scenarioWaterColor(true);
  T.waterTarget = T.wlBase + riseOf(T, F.rise * 100);
  { const p = riverPoint(SU.flood); scen.label.position.copy(p).setY(p.y + riseOf(T, F.rise * 100) + .32); } scen.label.visible = true; syncHeroLabels();
  scen.labelEl.innerHTML = `<b>+${(F.rise * 100).toFixed(1)} m</b> · ${F.name}<em>Illustrative</em>`;
  if (fly) { const v = scenView(SU.view); flyTo(v.pos, v.tgt, 1800); }
  refreshScenarioUI();
}
function applyIce(id, fly = true) {
  if (scen.kind !== 'ice') { clearScenario(); scen.kind = 'ice'; }
  scen.id = id; stopPlay();
  const S = ICE.find(s => s.id === id);
  JAM_U = SU.jam; syncHeroLabels();
  if (fly) { const v = scenView(JAM_U); flyTo(v.pos, v.tgt, 1800); }
  setIceDay(S.jam ? S.res.breakup + 2 : scen.iceK, true);
  refreshScenarioUI();
}
function setIceDay(k, force = false) {
  k = clamp(Math.round(k), 0, SEASON_DAYS.length - 1); scen.iceK = k;
  const S = ICE.find(s => s.id === scen.id); if (!S) return;
  const T = tableOf('oulanka'), h = S.res.h[k], d = SEASON_DAYS[k], br = S.res.breakup;
  scen.iceH = h;
  scen.ice.visible = h > .5;
  const tk = clamp(h / 60, 0, 1);
  scen.iceMat.color.lerpColors(_tc.setHex(0x5f9fca), new THREE.Color(0xcfe7f7), tk); scen.iceMat.opacity = .55 + .4 * tk;
  const breakupPhase = br >= 0 && k >= br && k < br + 12;
  scen.floes.visible = breakupPhase;
  const jamOn = S.jam && breakupPhase;
  T.waterTarget = T.wlBase + (jamOn ? riseOf(T, 2.8) : 0);
  if (jamOn) scenarioWaterColor(true); else T.wMat.color.setHex(h > .5 || breakupPhase ? 0x2a5f86 : WATER[state.season].color);
  scen.label.visible = jamOn || h > .5;
  if (jamOn) { scen.label.position.copy(riverPoint(JAM_U)).add(new THREE.Vector3(0, .36, 0)); scen.labelEl.innerHTML = '<b>Ice jam</b> · water +2.8 m upstream<em>Illustrative</em>'; }
  else if (h > .5) { scen.label.position.copy(riverPoint(SU.ice)).add(new THREE.Vector3(0, .3, 0)); scen.labelEl.innerHTML = `<b>${h.toFixed(0)} cm</b> ice · ${fmtDate(d)}<em>Illustrative</em>`; }
  if (breakupPhase && k === br && !S.jam) scen.floeData.forEach(f => f.u = Math.random());
  const s = seasonOfDay(d); if (s !== state.season) { applySeason(s); if (!jamOn) T.wMat.color.setHex(h > .5 || breakupPhase ? 0x2a5f86 : WATER[s].color); }
  // panel bits
  const rg = $('#iceRange'); if (rg) { rg.value = k; $('#iceFill').style.width = (k / (SEASON_DAYS.length - 1) * 100) + '%'; $('#iceDate').innerHTML = `${fmtDate(d)}<small>${S.name}</small>`; }
  updateXsec(S, k);
  if (scen.iceChart) scen.iceChart.setDay(0);
}
function startIce() { if (!scen.kind) return; if (scen.iceK >= SEASON_DAYS.length - 1) setIceDay(0); scen.icePlaying = true; const b = $('#icePlay'); if (b) b.innerHTML = svg('pause'); }
function stopIce() { scen.icePlaying = false; const b = $('#icePlay'); if (b) b.innerHTML = svg('play'); }
function updateXsec(S, k) {
  const el = $('#xsec'); if (!el) return;
  const h = S.res.h[k], d = SEASON_DAYS[k], snow = h > .5 ? Math.min(40, D.snow[d] * .5) : 0;
  el.querySelector('.snow').style.height = (snow * 1.25) + 'px'; el.querySelector('.ice').style.height = (h * 1.25) + 'px';
  el.querySelector('.snow span').textContent = snow > 2 ? `Snow ${snow.toFixed(0)} cm` : '';
  el.querySelector('.ice span').textContent = h > 3 ? `Ice ${h.toFixed(0)} cm` : h > .5 ? 'Thin ice' : '';
  el.querySelector('.water span').textContent = h > .5 ? 'Water · 0 °C' : `Open water · ${D.WT[d].toFixed(0)} °C`;
  const S2 = $('#iceStats'); if (S2) S2.innerHTML = iceStats(S, k);
}
const stat = (k, v, u = '') => `<div class="stat"><div class="k">${k}</div><div class="v">${v}<small>${u}</small></div></div>`;
function iceStats(S, k) {
  const r = S.res; return stat('Ice now', r.h[k].toFixed(0), 'cm') + stat('Season maximum', r.max.toFixed(0), 'cm') +
    stat('Freeze-up', r.freeze >= 0 ? fmtDate(SEASON_DAYS[r.freeze]) : '—') + stat('Break-up', r.breakup >= 0 ? fmtDate(SEASON_DAYS[r.breakup]) : '—');
}
function renderScenarioTab(b) {
  if (!FLOOD[0].share) FLOOD.forEach(f => f.share = floodedShare(f.rise));
  b.innerHTML = `<div class="fade-in">
    <div class="seg on-glass" id="scenSeg" style="display:flex;margin-bottom:12px"></div>
    <div class="illus"><b>Illustrative scenarios</b>These floods and ice seasons are made for demonstration. They are not model output or observations of the Oulankajoki. Real model results from DIWA researchers will replace them.</div>
    <div id="scenBody"></div></div>`;
  makeSeg($('#scenSeg'), [{ v: 'flood', label: 'Flooding', icon: 'flood' }, { v: 'ice', label: 'River ice', icon: 'ice' }], scen.sub, v => { scen.sub = v; clearScenario(); renderScenarioBody(); });
  $('#scenSeg').querySelectorAll('button').forEach(x => x.style.flex = '1');
  renderScenarioBody();
}
function renderScenarioBody() {
  const b = $('#scenBody'); if (!b) return; [...charts].forEach(c => { if (c.el.closest('#scenBody')) charts.delete(c); }); scen.iceChart = null;
  const exNote = '<span class="badge"><i></i>Illustrative</span>';
  if (scen.sub === 'flood') {
    b.innerHTML = `<div class="scen-list">${FLOOD.map(f => `<button class="scen-row" data-id="${f.id}"><span class="radio"></span><div class="t"><b>${f.name}</b><span>${f.sub}</span></div><div class="v">${f.peak.toFixed(0)}<small>m³/s</small></div></button>`).join('')}</div>
      <div class="stats" id="floodStats"></div>
      <div class="card"><h3>Spring hydrographs <span class="note">m³/s</span></h3><div id="cFlood"></div></div>
      <div class="card"><p>Water rises on the table until it reaches the scenario level, showing which low ground floods. Table heights are exaggerated; levels and discharges are illustrative.</p></div>
      <div style="display:flex;gap:8px;align-items:center">${exNote}<span class="small-note" style="margin:0">Replace with SYKE flood-hazard maps or model results later.</span></div>`;
    chart($('#cFlood'), { series: FLOOD.map(f => ({ name: f.name.replace(' spring flood', ''), color: f.color, data: f.Q })), unit: 'm³/s', decimals: 0, zeroBase: true, months: false,
      xTicks: [[0, 'Apr'], [30, 'May'], [61, 'Jun'], [91, 'Jul']], labelFor: i => fmtDate(FLOOD_W0 + i), dayToIndex: d => clamp(d - FLOOD_W0, 0, FLOOD_W1 - FLOOD_W0) });
    b.querySelectorAll('.scen-row').forEach(r => r.addEventListener('click', () => applyFlood(r.dataset.id)));
  } else {
    if (!scen.id || !ICE.find(s => s.id === scen.id)) scen.id = 'cold';
    const S = ICE.find(s => s.id === scen.id);
    b.innerHTML = `<div class="scen-list">${ICE.map(s => `<button class="scen-row" data-id="${s.id}"><span class="radio"></span><div class="t"><b>${s.name}</b><span>${s.sub}</span></div><div class="v">${s.res.max.toFixed(0)}<small>cm max</small></div></button>`).join('')}</div>
      <div class="card ice-player">
        <div class="ice-top"><button class="play" id="icePlay" title="Play the ice season">${svg('play')}</button><div class="tl-date" id="iceDate"></div>
          <div class="slider"><div class="track ice"></div><div class="fill" id="iceFill"></div><input type="range" id="iceRange" min="0" max="${SEASON_DAYS.length - 1}" value="${scen.iceK}"><div class="ticks"><span>Nov</span><span>Jan</span><span>Mar</span><span>May</span></div></div></div>
        <div class="xsec" id="xsec"><div class="air"><span class="tag">Cross-section of the river</span></div><div class="snow"><span></span></div><div class="ice"><i></i><span></span></div><div class="water"><span></span></div></div>
      </div>
      <div class="stats" id="iceStats"></div>
      <div class="card"><h3>Ice thickness by scenario <span class="note">cm</span></h3><div id="cIce"></div></div>
      <div style="display:flex;gap:8px;align-items:center">${exNote}<span class="small-note" style="margin:0">Estimated with the freezing-degree-day method (Stefan’s law) from example air temperatures, with snow insulation. Replace with SYKE ice observations.</span></div>`;
    scen.iceChart = chart($('#cIce'), { series: ICE.map(s => ({ name: s.jam ? 'Typical (ice jam)' : s.name, color: s.color, data: s.res.h })), unit: 'cm', decimals: 0, zeroBase: true, months: false,
      xTicks: ICE_TICKS, labelFor: k => fmtDate(SEASON_DAYS[k]), dayToIndex: () => scen.iceK });
    b.querySelectorAll('.scen-row').forEach(r => r.addEventListener('click', () => applyIce(r.dataset.id)));
    $('#iceRange').addEventListener('input', e => { stopIce(); if (!scen.kind) applyIce(scen.id, false); setIceDay(+e.target.value); });
    $('#icePlay').addEventListener('click', () => { if (!scen.kind) applyIce(scen.id); scen.icePlaying ? stopIce() : startIce(); });
    updateXsec(S, scen.iceK); $('#iceDate').innerHTML = `${fmtDate(SEASON_DAYS[scen.iceK])}<small>${S.name}</small>`;
    $('#iceFill').style.width = (scen.iceK / (SEASON_DAYS.length - 1) * 100) + '%';
  }
  refreshScenarioUI();
}
function refreshScenarioUI() {
  document.querySelectorAll('#scenBody .scen-row').forEach(r => r.classList.toggle('active', r.dataset.id === scen.id && (scen.kind === scen.sub || (!scen.kind && false))));
  const fs = $('#floodStats');
  if (fs) { const F = FLOOD.find(f => f.id === scen.id) || FLOOD[0]; fs.innerHTML = stat('Peak discharge', F.peak.toFixed(0), 'm³/s') + stat('Water-level rise', '+' + (F.rise * 100).toFixed(1), 'm') + stat('Low ground flooded', Math.round(F.share * 100), '%') + stat('Peak date', fmtDate(PEAK_DAY + Math.round(2 * (F.k - 1)))); fs.style.opacity = scen.kind === 'flood' ? 1 : .55; }
}

/* =====================================================================
   Picking + input
   ===================================================================== */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down = null, hovered = null;
function pick(e) {
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  const vis = pickables.filter(o => { let v = true; o.traverseAncestors(a => { if (!a.visible) v = false; }); return v && o.visible; });
  const hit = ray.intersectObjects(vis, false)[0]; return hit ? hit.object : null;
}
function setupInput() {
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; if (flight && !pano.active) { tweens.delete(flight); flight = null; controls.enabled = true; } });
  el.addEventListener('pointerup', e => {
    if (pano.active || !down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 6) return;
    const o = pick(e); if (!o) return; const u = o.userData;
    if (u.globe) openGlobe(u.globe);
    else if (u.pano) openPano(u.pano);
    else if (u.seat !== undefined) sitAt(u.seat);
    else if (u.screen !== undefined) onScreenClick(u.screen);
    else if (u.news) onNewsClick(e);
    else if (u.knowledge) { if (focus.kind !== 'knowledge') focusKnowledge(); }
    else if (u.mapPin) { if (focus.kind !== 'map') focusMap(); openMapCard(u.mapPin); }
    else if (u.mapBoard) { if (focus.kind !== 'map') focusMap(); }
    else if (u.catchPin) { if (focus.kind !== 'catch') focusCatch(); openCatchCard(u.catchPin); }
    else if (u.catchBoard) { if (focus.kind !== 'catch') focusCatch(); }
    else if (u.wb) { if (focus.kind !== 'wb' || WB.active?.i !== u.wb - 1) focusWhiteboard(u.wb - 1); }
    else if (u.agent !== undefined) agentAttend(u.agent);
    else if (u.ai) { ORB.mode === 'docked' ? summonOrb() : toggleListening(); }
    else if (u.site) { if (focus.id !== u.site) focusSite(u.site); }
  });
  el.addEventListener('pointermove', e => {
    if (pano.active || e.buttons) return; const o = pick(e);
    const id = o ? (o.userData.site || (o.userData.globe && 'g:' + o.userData.globe) || (o.userData.pano && 'p:' + o.userData.pano) || (o.userData.live && 'live') || (o.userData.ai && 'ai') || (o.userData.agent !== undefined && 'ag') || (o.userData.seat !== undefined && 'seat') || (o.userData.screen !== undefined && 'scr') || (o.userData.news && 'news') || (o.userData.knowledge && 'kn') || (o.userData.mapPin && 'pin') || (o.userData.mapBoard && 'map') || (o.userData.catchPin && 'pin') || (o.userData.catchBoard && 'map') || (o.userData.wb && 'wb')) : null;
    if (focus.kind === 'wb' && id === 'wb') return; el.style.cursor = id ? 'pointer' : 'grab';
    if (id !== hovered) { hovered = id; globeObjs.forEach(g => g.tag.classList.toggle('show', hovered === 'g:' + g.G.id || sensorCard.G?.id === g.G.id)); Object.entries(panoTags).forEach(([k, el]) => el.classList.toggle('show', hovered === 'p:' + k)); }
  });
  const keys = new Set();
  addEventListener('keydown', e => {
    if (e.target.closest('textarea, input, select')) return;
    if (pano.active) { if (e.key === 'Escape') closePano(); if (e.key === 'ArrowRight') panoStep(1); if (e.key === 'ArrowLeft') panoStep(-1); return; }
    if (e.key === ' ') { e.preventDefault(); document.activeElement?.blur?.(); if (!e.repeat) { ai.spaceHeld = true; startListening(); } return; }
    keys.add(e.key.toLowerCase());
    if (e.key === 'Escape') { if (AGX.tour) { stopTour(); return; } if ($('#agentMenu').classList.contains('show')) { closeAgentMenu(); return; } if ($('#liveModal').classList.contains('show')) closeLiveModal(); else if (ai.listening) stopListening(true); else if (story.active) endStory(); else if (sensorCard.G) closeSensorCard(); else goHome(); }
    if (e.key === 'h' || e.key === 'H') goHome();
    if (/^[1-9]$/.test(e.key)) focusSite(SITES[+e.key - 1].id);
    if ((e.key === 'p' || e.key === 'P') && focus.id === 'oulanka') togglePlay();
  });
  addEventListener('keyup', e => { if (e.key === ' ' && !e.target.closest('textarea, input')) e.preventDefault(); if (e.key === ' ' && ai.spaceHeld) { ai.spaceHeld = false; setTimeout(() => stopListening(), 250); } keys.delete(e.key.toLowerCase()); });
  setupInput.keys = keys;
}
const _f = new THREE.Vector3(), _r = new THREE.Vector3();
function walk(dt) {
  const k = setupInput.keys; if (!k || !k.size || flight || pano.active) return;
  camera.getWorldDirection(_f); _f.y = 0; _f.normalize(); _r.crossVectors(_f, camera.up).normalize();
  const v = new THREE.Vector3(), sp = (k.has('shift') ? 14 : 6) * dt;
  if (k.has('w') || k.has('arrowup')) v.add(_f); if (k.has('s') || k.has('arrowdown')) v.sub(_f);
  if (k.has('d') || k.has('arrowright')) v.add(_r); if (k.has('a') || k.has('arrowleft')) v.sub(_r);
  if (v.lengthSq()) { v.normalize().multiplyScalar(sp); camera.position.add(v); controls.target.add(v); }
}

/* =====================================================================
   WebXR (VR headsets): teleport between tables with the controller
   ===================================================================== */
let xrBase = null;
function setupVR() {
  if (typeof vrSetup === 'function') return vrSetup();      // the VR edition (vr.html) has its own controls
  const b = $('#btnVR'); b.style.display = '';
  let ok = false;
  navigator.xr?.isSessionSupported('immersive-vr').then(v => { ok = v; b.classList.toggle('ready', v); }).catch(() => { });
  b.addEventListener('click', async () => {
    if (!ok) { toast('VR opens in a headset browser — on Meta Quest 3, open this page in the Quest Browser and press VR.', 4200); return; }
    location.href = 'vr.html' + location.search; return;    // headsets get the full VR edition
    if (renderer.xr.isPresenting) { renderer.xr.getSession()?.end(); return; }
    try { const sess = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] }); renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(sess); }
    catch (e) { toast('Couldn’t start VR: ' + e.message); }
  });
  renderer.xr.addEventListener('sessionstart', () => {
    xrBase = renderer.xr.getReferenceSpace(); SCREENS.forEach(S => S.mesh.material = S.vr); teleport(0, 24);
    toast('VR: point at a table and pull the trigger to teleport');
  });
  renderer.xr.addEventListener('sessionend', () => { SCREENS.forEach(S => S.mesh.material = S.punch); });
  for (let i = 0; i < 2; i++) {
    const c = renderer.xr.getController(i);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x8fd3ff }));
    line.scale.z = 12; c.add(line); scene.add(c);
    c.addEventListener('select', () => {
      const m = new THREE.Matrix4().extractRotation(c.matrixWorld); ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(m);
      const hit = ray.intersectObjects(pickables, false)[0]; if (!hit) return; const u = hit.object.userData;
      if (u.site) { const T = tableOf(u.site), dir = new THREE.Vector3(-T.group.position.x * .35, 0, 24 - T.group.position.z).normalize(); const p = T.group.position.clone().add(dir.multiplyScalar(T.R + 1.3)); teleport(p.x, p.z); }
      else if (u.ai) teleport(ORB_POS.x + 2, ORB_POS.z + 3); else if (u.screen !== undefined) { const p = SCREENS[u.screen].g.localToWorld(new THREE.Vector3(0, 0, 9)); teleport(p.x, p.z); }
    });
  }
}
function teleport(x, z) { if (!xrBase) return; renderer.xr.setReferenceSpace(xrBase.getOffsetReferenceSpace(new XRRigidTransform({ x: -x, y: 0, z: -z, w: 1 }))); }

/* =====================================================================
   Main loop
   ===================================================================== */
const clock = new THREE.Clock();
const tmpC = new THREE.Color(), cold = new THREE.Color(.45, 1.1, 2.2), mid = new THREE.Color(1.6, 1.6, 1.7), warm = new THREE.Color(2.2, 1.1, .35);
const perf = { n: 0, sum: 0, level: 2, armed: false };
function adaptQuality(rawDt) {
  if (!perf.armed || renderer.xr.isPresenting) return;
  perf.n++; perf.sum += rawDt;
  if (perf.n < 90) return;
  const avg = perf.sum / perf.n; perf.n = 0; perf.sum = 0;
  if (avg > .034 && perf.level === 2) { perf.level = 1; renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight); }
  else if (avg > .045 && perf.level === 1) { perf.level = 0; reflector.visible = false; floorOverlay.material.opacity = 1; floorOverlay.material.transparent = false; floorOverlay.material.needsUpdate = true; perf.armed = false; }
}
/* ---------- attract mode: after 10 s without input, return to the home view and turn slowly (same speed as the 360° photos) ---------- */
const IDLE = { t: 0, on: false, wait: 0, AFTER: 10, DEG_PER_S: 2.2, theta: 0, y: 0, R: [33, 30.5] };
['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, idleWake, { capture: true, passive: true }));
function idleWake() {
  IDLE.t = 0; if (!IDLE.on) return; IDLE.on = false;
  // if the slow turn left the view facing out through the glass, glide back to the home view
  const t = controls.target; if ((t.x / (HALL.rx * .85)) ** 2 + (t.z / (HALL.rz * .85)) ** 2 > 1) flyTo(HOME_POS.clone(), HOME_TGT.clone(), 1200);
}
function idleAllowed() {
  if (!entered || pano.active || renderer.xr.isPresenting || story.active || playback.playing || seated >= 0) return false;
  if (ORB.state !== 'idle' || mp.micOn || WB.drawing || AGX.tour || AGX.speech) return false;
  if (SCREENS.some(S => S.playing || !S.muted)) return false;          // someone is watching a video
  if (['wb', 'news', 'map', 'screen'].includes(focus.kind)) return false; // reading a board
  if (document.querySelector('#sitePanel.show, #aiPanel.show, #sensorCard.show, #mapCard.show, #liveModal.show, .pop.show, #wbBar.show')) return false;
  const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return false;
  return true;
}
function updateIdle(dt) {
  if (!IDLE.on) {
    IDLE.t += dt;
    if (IDLE.t > IDLE.AFTER && idleAllowed()) {
      IDLE.on = true; IDLE.wait = 2.2;
      const home = camera.position.distanceTo(HOME_POS) < 1.5 && focus.kind === 'home';
      if (home) IDLE.wait = 0; else goHome();
      IDLE.theta = Math.atan2(camera.position.x, camera.position.z);
    }
    return;
  }
  if (!idleAllowed()) { IDLE.on = false; IDLE.t = 0; return; }
  if (IDLE.wait > 0) { IDLE.wait -= dt; IDLE.theta = 0; IDLE.y = camera.position.y; return; }
  // circle slowly around the hall, starting from the home view and always looking at the tables
  IDLE.theta += dt * IDLE.DEG_PER_S * Math.PI / 180;
  const th = IDLE.theta, R = IDLE.R;
  camera.position.set(Math.sin(th) * R[0], lerp(IDLE.y ?? HOME_POS.y, HOME_POS.y, Math.min(1, th * 4)), Math.cos(th) * R[1]);
  controls.target.lerp(HOME_TGT, .05);
}
function loop() {
  const rawDt = clock.getDelta(), dt = Math.min(rawDt, .05), t = clock.elapsedTime, now = performance.now();
  adaptQuality(rawDt);
  updateTweens(now);
  if (typeof vrUpdate === 'function') vrUpdate(dt, t);       // VR edition only
  if (pano.active) { updatePano(dt); renderer.render(pano.scene, pano.cam); return; }
  if (playback.playing) { playback.acc += dt * 4 * playback.speed; if (playback.acc >= 1) { const s = Math.floor(playback.acc); playback.acc -= s; if (playback.day + s >= DAYS - 1) { setDay(DAYS - 1); stopPlay(); } else setDay(playback.day + s); } }
  particleMats.forEach(m => m.uniforms.uTime.value = t); snowMats.forEach(m => m.uniforms.uTime.value = t); if (dustMat) dustMat.uniforms.uTime.value = t;
  updateOrb(dt, t); updateScenario(dt); updateMP(dt); updateClouds(dt, t); updatePrecip(dt, t); updateScreens(dt); updateNews(dt); updateMapPins(t); updateNightSky(t); updateIdle(dt); updateAgents(dt, t); hostCheck(dt);
  const airT = D.airT[playback.day];
  globeObjs.forEach(o => {
    const p = .5 + .5 * Math.sin(t * 2 + o.phase);
    o.halo.material.opacity = .35 + .3 * p; o.ring.scale.setScalar(1 + ((t * .6 + o.phase) % 1) * 1.8); o.ring.material.opacity = 1 - ((t * .6 + o.phase) % 1);
    o.halo.material.opacity = (.3 + .25 * p) * (sensorCard.G?.id === o.G.id ? 2 : 1);
  });
  tables.forEach(T => {
    const target = (hovered === T.site.id || focus.id === T.site.id) ? 1 : 0; T.hover = lerp(T.hover, target, .12);
    T.rimMat.color.setRGB(.35 + .25 * T.hover, .85 + .4 * T.hover, 1.6 + .8 * T.hover);
    if (T.waterTarget !== undefined) T.water.position.y = lerp(T.water.position.y, T.waterTarget, .08);
    if (T.foamMat) T.foamMat.uniforms.uTime.value = t;
  updateHUD(t); updateKnowledge(dt, t);
  });
  if (!renderer.xr.isPresenting) {
    walk(dt);
    if (controls.enabled) { controls.update(); clampCamera(); }
  }
  renderer.render(scene, camera);
  if (!renderer.xr.isPresenting) { css2d.render(scene, camera); css3d.render(scene, camera); }
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); pano.cam.aspect = camera.aspect; pano.cam.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); css2d.setSize(innerWidth, innerHeight); css3d.setSize(innerWidth, innerHeight);
  if (sensorCard.G) renderSensorCard(); if ($('#sitePanel').classList.contains('show') && focus.id) renderSiteTab(SITE[focus.id]);
});

/* =====================================================================
   Hologram HUD theme: navy and black with cyan light, applied after the hall is built
   ===================================================================== */
const HUD = { t: [], cyan: new THREE.Color(.28, .9, 1.7), soft: new THREE.Color(.14, .45, .85) };
const hudU = () => { const u = { uTime: { value: 0 } }; HUD.t.push(u); return u; };
function updateHUD(t) { HUD.t.forEach(u => u.uTime.value = t); }
// animated floor: dark glass with a fine grid, hex rings radiating from the centre and a slow scan sweep
const HUD_FLOOR_FS = `
  uniform float uTime; varying vec2 vP;
  float line(float v, float w){ float f = abs(fract(v) - .5); return smoothstep(w, 0., .5 - f); }
  void main(){
    vec2 p = vP; float r = length(p / vec2(43., 35.));
    float g1 = max(line(p.x / 2., .025), line(p.y / 2., .025)) * .22;
    float g2 = max(line(p.x / 10., .012), line(p.y / 10., .012)) * .45;
    float rings = line(length(p) / 6. - uTime * .08, .02) * .35;
    float ang = atan(p.y, p.x), sweep = pow(max(0., cos(ang - uTime * .25)), 60.) * smoothstep(1., .2, r) * .6;
    float fade = smoothstep(1.02, .55, r);
    vec3 base = vec3(.012, .03, .06);
    vec3 c = base + vec3(.16, .62, 1.) * (g1 + g2 + rings + sweep) * fade;
    gl_FragColor = vec4(c, .9);
  }`;
const HOLO_VS = `varying vec2 vUv; varying vec2 vP; void main(){ vUv = uv; vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
// table hologram wall: a thin glass cylinder with rising scan lines
const HUD_WALL_FS = `
  uniform float uTime; varying vec2 vUv;
  void main(){
    float y = vUv.y, scan = smoothstep(.0, .06, fract(y * 6. - uTime * .35)) * smoothstep(.12, .06, fract(y * 6. - uTime * .35));
    float edge = smoothstep(.12, 0., y) * .5 + smoothstep(.85, 1., y) * .8;
    float a = .05 + scan * .1 + edge * .35;
    gl_FragColor = vec4(vec3(.25, .8, 1.5), a * (1. - y * .35));
  }`;
// moving light around a ring (angle-driven comets)
const HUD_COMET_FS = `
  uniform float uTime; uniform float uSpeed; uniform float uBase; varying vec2 vP;
  void main(){
    float a = atan(vP.y, vP.x);
    float c1 = pow(max(0., cos(a - uTime * uSpeed)), 80.), c2 = pow(max(0., cos(a + 3.1416 - uTime * uSpeed)), 80.);
    float pulse = .75 + .25 * sin(uTime * 1.7);
    float k = uBase * pulse + (c1 + c2) * 1.6;
    gl_FragColor = vec4(vec3(.3, .95, 1.8) * k, clamp(k, 0., 1.));
  }`;
// rectangular frame: light runs along the edge of a panel
const HUD_FRAME_FS = `
  uniform float uTime; uniform vec2 uSize; varying vec2 vP;
  void main(){
    float a = atan(vP.y / uSize.y, vP.x / uSize.x);
    float c1 = pow(max(0., cos(a - uTime * .6)), 40.), c2 = pow(max(0., cos(a + 3.1416 - uTime * .6)), 40.);
    float k = .38 + .12 * sin(uTime * 2. + a * 2.) + (c1 + c2) * 1.5;
    gl_FragColor = vec4(vec3(.3, .9, 1.7) * k, clamp(k, 0., 1.));
  }`;
// blueprint shimmer over the supersite map: scan line and a fine moving grid
const HUD_BP_FS = `
  uniform float uTime; uniform vec2 uSize; varying vec2 vUv;
  float line(float v, float w){ float f = abs(fract(v) - .5); return smoothstep(w, 0., .5 - f); }
  void main(){
    vec2 p = vUv * uSize;
    float grid = max(line(p.x * 4., .03), line(p.y * 4. + uTime * .05, .03)) * .07;
    float s = fract(uTime * .09); float scan = smoothstep(.025, 0., abs(vUv.y - (1. - s))) * .5 + smoothstep(.25, 0., (1. - s) - vUv.y) * step(vUv.y, 1. - s) * .06;
    gl_FragColor = vec4(vec3(.45, .9, 1.4) * (grid + scan), grid + scan);
  }`;
function hudMat(fs, extra = {}, opts = {}) {
  return new THREE.ShaderMaterial({ vertexShader: HOLO_VS, fragmentShader: fs, uniforms: Object.assign(hudU(), extra), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, ...opts });
}
function hudFrame(W, H, pad = .12, thick = .05, r = .2) {
  const outer = roundedRectShape(W + 2 * (pad + thick), H + 2 * (pad + thick), r + pad + thick), inner = roundedRectShape(W + 2 * pad, H + 2 * pad, r + pad);
  outer.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  return new THREE.Mesh(new THREE.ShapeGeometry(outer, 24), hudMat(HUD_FRAME_FS, { uSize: { value: new THREE.Vector2(W / 2, H / 2) } }, { blending: THREE.AdditiveBlending }));
}
function applyHUD() {
  document.body.classList.add('hud');
  // structure: dark blue metal instead of wood
  [woodMat, woodMatV].forEach(m => { m.map = null; m.color.setHex(0x0c1828); m.roughness = .32; m.metalness = .75; m.emissive = new THREE.Color(0x020812); m.needsUpdate = true; });
  floorOverlay.material = hudMat(HUD_FLOOR_FS, {}, { side: THREE.FrontSide }); floorOverlay.material.depthWrite = false; floorOverlay.renderOrder = -2;   // drawn first so see-through things above it stay visible
  hall.traverse(o => {
    if (!o.isMesh || !o.material || o === floorOverlay) return;
    const m = o.material;
    if (m.isMeshBasicMaterial && m.color && m.color.r > 1.2 && m.color.g > 1.2) m.color.set(.3, 1.0, 1.9);           // ceiling light lines → cyan
    else if (m.isMeshStandardMaterial && !m.isMeshPhysicalMaterial && m.color.getHex() === 0xd9d3c8) m.color.setHex(0x07101c);  // plinth
    else if (m.isMeshStandardMaterial && m.color.getHex() === 0x2c3036) { m.color.setHex(0x0a1422); m.emissive = new THREE.Color(0x05182c); }   // mullions
    else if (m.isMeshPhysicalMaterial && m.transparent) { m.color.setHex(0x8fd4ff); m.opacity = .07; }              // glass wall
  });
  if (HALLREF.ceil) { HALLREF.ceil.color.setHex(0x0a1422); HALLREF.ceil.emissive.setHex(0x0d3358); }
  if (HALLREF.top) HALLREF.top.material.color.setHex(0xbfe6ff);
  HALLREF.fills.forEach(l => l.color.setHex(0xbfdcff));
  NIGHT.emissive.forEach(([m]) => { m.color?.setHex(0x9fdcff); m.emissive?.setHex(0x2fb6ff); });
  NIGHT.sprites.forEach(([m]) => m.color.setHex(0x4fc3ff)); NIGHT.lights.forEach(l => l.color.setHex(0x5aa8ff));
  if (floorLogo) { floorLogo.day = floorLogo.night; floorLogo.mat.map = floorLogo.night; floorLogo.mat.color.setHex(0x9fe0ff); floorLogo.mat.opacity = .5; floorLogo.mat.needsUpdate = true; }
  particleMats.forEach(m => m.uniforms.uColor.value.set(.45, .85, 1.5)); if (dustMat) dustMat.uniforms.uColor.value.set(.5, .8, 1.3);
  // tables: the whole landscape sits inside a thin hologram cylinder with a running light on its rim
  tables.forEach(T => {
    let top;
    if (T.real) { let mx = -1e9; const N = OUL.grid; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -1 + 2 * i / (N - 1), z = -1 + 2 * j / (N - 1); if (x * x + z * z > 1) continue; const k = j * N + i; mx = Math.max(mx, OUL.H[k], OUL.L[k] > OUL.base + 5 ? OUL.L[k] : -1e9); } top = T.wlBase + T.ym(mx); }
    else top = T.TOP - .03 + Math.max(...T.meta.map(m => m.h), T.shape.wl);
    top += .035; T.topY = top;
    const g = T.group, Rt = T.Rt, h = top - (T.TOP - .1);
    if (T.wall) g.remove(T.wall);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(Rt + .004, Rt + .004, h, 200, 1, true), hudMat(HUD_WALL_FS, {}, { blending: THREE.AdditiveBlending }));
    wall.position.y = T.TOP - .1 + h / 2; g.add(wall); T.wall = wall;
    if (T.rim) { T.rim.geometry.dispose(); T.rim.geometry = new THREE.TorusGeometry(Rt + .006, .007, 6, 240); T.rim.position.y = top; }
    const ring = new THREE.Mesh(new THREE.RingGeometry(Rt + .012, Rt + .06, 240), hudMat(HUD_COMET_FS, { uSpeed: { value: .5 + (T.site.hero ? 0 : (T.site.seed % 5) * .07) }, uBase: { value: .22 } }, { blending: THREE.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = top + .001; g.add(ring);
    const base = new THREE.Mesh(new THREE.RingGeometry(T.R * .78, T.R * .84, 200), hudMat(HUD_COMET_FS, { uSpeed: { value: -.35 }, uBase: { value: .3 } }, { blending: THREE.AdditiveBlending }));
    base.rotation.x = -Math.PI / 2; base.position.y = .035; g.add(base);
    if (T.fr) T.fr.visible = false; if (T.fg) T.fg.material.color.setHex(0x3fb6ff);
    if (T.skirt) { const c = T.skirt.geometry.attributes.color; for (let i = 0; i < c.count; i++) { const topV = i % 2 === 0; c.setXYZ(i, topV ? .06 : .02, topV ? .16 : .05, topV ? .28 : .09); } c.needsUpdate = true; }
  });
  // video wall, news and supersite map: running light frames
  SCREENS.forEach(S => { const f = hudFrame(14.4, 8.1, .32, .06, .45); f.position.set(0, 1.8 + 8.1 / 2, .03); S.g.add(f); S.g.traverse(o => { if (o.material?.isMeshPhysicalMaterial) o.material.color.setHex(0x0a1422); }); });
  [[NEWS, NEWS.W, NEWS.H, NEWS.y0], [MAPB, MAPB.W, MAPB.H, MAPB.y0], [CATB, CATB.W, CATB.H, CATB.y0]].forEach(([B, W, H, y0]) => { const f = hudFrame(W, H, .12, .035, .1); f.position.set(0, y0 + H / 2, .02); B.g.add(f); });
  BOARDS.forEach(B => { const g = B.g || B.mesh?.parent; if (!g) return; const f = hudFrame(WB.W, WB.H, .1, .03, .08); f.position.set(0, WB.y0 + WB.H / 2, .02); g.add(f); });
  // blueprint shimmer over the map
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(MAPB.W, MAPB.H), hudMat(HUD_BP_FS, { uSize: { value: new THREE.Vector2(MAPB.W, MAPB.H) } }, { blending: THREE.AdditiveBlending }));
  bp.position.set(0, MAPB.y0 + MAPB.H / 2, .006); MAPB.g.add(bp);
  const bp2 = new THREE.Mesh(new THREE.PlaneGeometry(CATB.W, CATB.H), hudMat(HUD_BP_FS, { uSize: { value: new THREE.Vector2(CATB.W, CATB.H) } }, { blending: THREE.AdditiveBlending }));
  bp2.position.set(0, CATB.y0 + CATB.H / 2, .006); CATB.g.add(bp2);
  // stand boards in dark metal
  [NEWS.g, MAPB.g, CATB.g, ...BOARDS.map(B => B.g)].forEach(g => g && g.traverse(o => { if (o.material?.isMeshPhysicalMaterial) o.material.color.setHex(0x0a1422); }));
}
// blueprint version of the Finland map image: sea and land in blues, lines and text in light cyan
function blueprintImage(img) {
  // keep only the shapes: sea, land and the catchment areas in blues, every boundary line in yellow; the image's own text, pins and rivers are dropped
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data, W = c.width, H = c.height, cls = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < a.length; i += 4, p++) {
    if (a[i + 3] < 250) { cls[p] = 0; continue; }   // the image's own drop shadow and corners
    const r = a[i], gg = a[i + 1], b = a[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), L = (.3 * r + .59 * gg + .11 * b) / 255, sat = (mx - mn) / (mx || 1);
    if (sat > .28 && L < .75) cls[p] = 9;            // coloured detail (labels, pins, rivers): fill from the neighbours below
    else if (L < .7 && sat < .22) cls[p] = 4;          // boundary line
    else if (b - r > 18) cls[p] = 1;                   // sea and lakes
    else if (L < .93) cls[p] = 3;                      // catchment area
    else cls[p] = 2;                                   // land
  }
  for (let pass = 0; pass < 6; pass++) for (let p = 0; p < W * H; p++) if (cls[p] === 9) { const x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || (q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue; const v = cls[q]; if (v && v !== 9 && v !== 4) { cls[p] = v; break; } } }
  // Finland's outline: flood-fill the white land from a seed inside the country, add the catchment areas it touches, fill holes, smooth
  const N = W * H, nb = p => { const x = p % W, r = []; if (x > 0) r.push(p - 1); if (x < W - 1) r.push(p + 1); if (p >= W) r.push(p - W); if (p < N - W) r.push(p + W); return r; };
  const dil = (m, it) => { for (let k = 0; k < it; k++) { const o = m.slice(); for (let p = 0; p < N; p++) if (o[p]) nb(p).forEach(q => m[q] = 1); } return m; };
  const ero = (m, it) => { for (let k = 0; k < it; k++) { const o = m.slice(); for (let p = 0; p < N; p++) if (o[p] && nb(p).some(q => !o[q])) m[p] = 0; } return m; };
  const flood = (m, seeds, ok) => { const st = [...seeds]; while (st.length) { const p = st.pop(); if (m[p] || !ok(p)) continue; m[p] = 1; nb(p).forEach(q => st.push(q)); } return m; };
  const white = new Uint8Array(N), dith = new Uint8Array(N);
  for (let p = 0, i = 0; p < N; p++, i += 4) { if (a[i + 3] < 250) continue; const r = a[i], gg = a[i + 1], b = a[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), L = (.3 * r + .59 * gg + .11 * b) / 255, sat = (mx - mn) / (mx || 1);
    if (L > .9 && sat < .12) white[p] = 1; else if (sat < .25 && b - r <= 18) dith[p] = 1; }
  const bar = dil(Uint8Array.from(white, v => v ? 0 : 1), 2);
  let seed = -1; for (let r = 0; r < 80 && seed < 0; r++) for (let dx = -r; dx <= r && seed < 0; dx++) { const p = (Math.round(H * .64) + (r % 2 ? r : -r) / 2 | 0) * W + Math.round(W * .6) + dx; if (p >= 0 && p < N && !bar[p]) seed = p; }
  if (seed >= 0) {
    let fin = dil(flood(new Uint8Array(N), [seed], p => !bar[p]), 2);
    const near = dil(fin.slice(), 3), seeds = []; for (let p = 0; p < N; p++) if (near[p] && dith[p]) seeds.push(p);
    
    const dith2 = ero(dil(dith.slice(), 2), 2), cat = flood(new Uint8Array(N), seeds, p => dith2[p]);   // the catchments are dithered: close the checkerboard first for (let p = 0; p < N; p++) if (cat[p]) fin[p] = 1;
    const edge = []; for (let x = 0; x < W; x++) edge.push(x, (H - 1) * W + x); for (let y = 0; y < H; y++) edge.push(y * W, y * W + W - 1);
    const out = flood(new Uint8Array(N), edge, p => !fin[p]); for (let p = 0; p < N; p++) fin[p] = out[p] ? 0 : 1;
    fin = dil(ero(fin, 3), 3);                                                     // drop thin border lines reaching into neighbours
    for (let p = 0; p < N; p++) if (cls[p] === 4) cls[p] = fin[p] ? 3 : 2;           // other lines dissolve into the land
    for (let p = 0; p < N; p++) if (fin[p] && cls[p] === 2) cls[p] = 3;
    const brd = new Uint8Array(N); for (let p = 0; p < N; p++) if (fin[p] && nb(p).some(q => !fin[q])) brd[p] = 1;
    dil(brd, 2); for (let p = 0; p < N; p++) if (brd[p] && cls[p]) cls[p] = 4;
  }
  const COL = { 1: [8, 30, 70], 2: [16, 56, 108], 3: [24, 82, 140], 4: [255, 214, 90], 9: [16, 56, 108] };
  for (let p = 0, i = 0; p < W * H; p++, i += 4) { if (!cls[p]) continue; const o = COL[cls[p]]; a[i] = o[0]; a[i + 1] = o[1]; a[i + 2] = o[2]; a[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
}

/* =====================================================================
   DIWA Knowledge panel: questions answered from the DIWA library (papers and Excel files)
   Left: the paper the answer leans on most · Right: the live conversation
   The library comes from knowledge/index.json (built from a folder with tools/build_knowledge.py)
   or from a local folder the user connects in the browser (stays on that computer).
   ===================================================================== */
const KN = { docs: [], chunks: [], df: new Map(), avgLen: 1, src: null, cites: [], q: '', chat: [], reveal: 1e9, busy: false, from: '', W: 14.4, H: 8.1, y0: 1.8,
  pos: new THREE.Vector3(33.2, 0, -5.5), look: new THREE.Vector3(0, 0, 2) };
const KN_RX = /\b(paper|papers|publication|publications|article|articles|study|studies|according to|literature|dataset|datasets|excel|spreadsheet|library|published|authors?|cite|citation)\b/i;
const NPM = (name, ver, path) => /^(localhost|127\.)/.test(location.hostname) ? `/node_modules/${name}/${path}` : `https://cdn.jsdelivr.net/npm/${name}@${ver}/${path}`;
const KN_STOP = new Set('the a an and or of to in on for with by at from as is are was were be been this that these those it its into than then also can could may might will would should which who whom what when where how why do does did not no yes about over under between within during after before more most less such using use used based their there they them we our you your i me my he she his her us all any each other some'.split(' '));
const knTokens = t => (t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]{2,}/g) || []).filter(w => !KN_STOP.has(w));
function knIndex() {
  KN.df = new Map(); let tot = 0;
  KN.chunks.forEach(c => { c.tok = knTokens(c.t); c.tf = new Map(); c.tok.forEach(w => c.tf.set(w, (c.tf.get(w) || 0) + 1)); tot += c.tok.length; new Set(c.tok).forEach(w => KN.df.set(w, (KN.df.get(w) || 0) + 1)); });
  KN.avgLen = tot / Math.max(1, KN.chunks.length); knPaint();
}
function knSearch(q, k = 6) {
  const qt = [...new Set(knTokens(q))], N = KN.chunks.length; if (!qt.length || !N) return [];
  const sc = KN.chunks.map((c, i) => { let s = 0; qt.forEach(w => { const f = c.tf.get(w); if (!f) return; const idf = Math.log(1 + (N - KN.df.get(w) + .5) / (KN.df.get(w) + .5)); s += idf * f * 2.2 / (f + 1.2 * (.25 + .75 * c.tok.length / KN.avgLen)); }); return { i, s }; });
  return sc.filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k).map(x => ({ ...KN.chunks[x.i], score: x.s }));
}
async function loadKnowledgeIndex() {
  try { const r = await fetch('knowledge/index.json'); if (!r.ok) return; const j = await r.json(); KN.docs = j.docs || []; KN.chunks = j.chunks || []; KN.from = 'library'; knIndex(); } catch { }
}
/* ---------- connect a local folder (PDF, Excel, CSV, text): read in this browser only ---------- */
async function knLoadFiles(files) {
  files = [...files].filter(f => /\.(pdf|xlsx|xls|csv|txt|md)$/i.test(f.name)); if (!files.length) { toast('No PDF, Excel, CSV or text files in that folder', 2600); return; }
  KN.status = `Reading ${files.length} files…`; knPaint();
  let pdfjs = null, XLSX = null;
  for (const [n, f] of files.entries()) {
    KN.status = `Reading ${n + 1}/${files.length} · ${f.name}`; knPaint();
    try {
      if (/\.pdf$/i.test(f.name)) {
        if (!pdfjs) { pdfjs = await import(NPM('pdfjs-dist', '4.10.38', 'build/pdf.min.mjs')); pdfjs.GlobalWorkerOptions.workerSrc = NPM('pdfjs-dist', '4.10.38', 'build/pdf.worker.min.mjs'); }
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise, meta = await pdf.getMetadata().catch(() => ({}));
        const pages = []; for (let p = 1; p <= Math.min(pdf.numPages, 60); p++) { const tc = await (await pdf.getPage(p)).getTextContent(); pages.push(tc.items.map(it => it.str).join(' ').replace(/\s+/g, ' ')); }
        knAddDoc({ kind: 'paper', file: f.name, title: meta.info?.Title, authors: meta.info?.Author, pages });
      } else if (/\.(xlsx|xls|csv)$/i.test(f.name)) {
        if (!XLSX) XLSX = await import(NPM('xlsx', '0.18.5', 'xlsx.mjs'));
        const wb = XLSX.read(new Uint8Array(await f.arrayBuffer()), { type: 'array', cellDates: true });
        knAddDoc({ kind: 'table', file: f.name, sheets: wb.SheetNames.map(nm => ({ name: nm, rows: XLSX.utils.sheet_to_json(wb.Sheets[nm], { header: 1, raw: true, blankrows: false }) })) });
      } else knAddDoc({ kind: 'text', file: f.name, pages: [await f.text()] });
    } catch (e) { console.warn('knowledge: could not read', f.name, e); }
  }
  KN.from = 'folder'; KN.status = ''; knIndex(); toast(`DIWA library connected · ${KN.docs.length} documents`, 2600);
}
function knAddDoc(d) {
  const di = KN.docs.length, first = (d.pages?.[0] || '').slice(0, 3000);
  const year = (first.match(/\b(19[89]\d|20[0-3]\d)\b/) || [])[1] || '';
  const title = (d.title && d.title.length > 8 && !/^microsoft|untitled/i.test(d.title)) ? d.title : d.file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  KN.docs.push({ title, authors: d.authors || '', year, file: d.file, kind: d.kind });
  if (d.pages) d.pages.forEach((txt, p) => { for (let i = 0; i < txt.length; i += 900) { const t = txt.slice(Math.max(0, i - 120), i + 900).trim(); if (t.length > 80) KN.chunks.push({ d: di, p: p + 1, t }); } });
  if (d.sheets) d.sheets.forEach(sh => knSheetChunks(sh).forEach(t => KN.chunks.push({ d: di, p: sh.name, t })));
}
function knSheetChunks(sh) {
  const rows = sh.rows.filter(r => r.some(v => v !== null && v !== '')); if (!rows.length) return [];
  const head = rows[0].map((h, i) => String(h ?? `col ${i + 1}`)), body = rows.slice(1), out = [];
  const stats = head.map((h, i) => { const v = body.map(r => r[i]).filter(x => typeof x === 'number'); return v.length ? `${h}: ${v.length} values, min ${Math.min(...v).toFixed(2)}, max ${Math.max(...v).toFixed(2)}, mean ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)}` : `${h}: ${new Set(body.map(r => r[i]).filter(x => x != null)).size} distinct entries`; });
  out.push(`Sheet "${sh.name}" with ${body.length} rows and columns ${head.join(', ')}. ${stats.join('; ')}.`);
  for (let i = 0; i < body.length; i += 25) out.push(`Sheet "${sh.name}" rows ${i + 1}–${Math.min(body.length, i + 25)}: ` + body.slice(i, i + 25).map(r => head.map((h, k) => r[k] == null ? '' : `${h}=${r[k] instanceof Date ? r[k].toISOString().slice(0, 10) : r[k]}`).filter(Boolean).join(', ')).join(' | '));
  return out;
}
function knPick() { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.webkitdirectory = true; inp.addEventListener('change', () => knLoadFiles(inp.files)); inp.click(); }
/* ---------- asking ---------- */
const knWanted = text => focus.kind === 'knowledge' || (seated >= 0 && SEATS[seated]?.knowledge) || (KN.chunks.length && (KN_RX.test(text) || /\bdiwa\b.*\b(research|find|found|result|show|measure)/i.test(text)));
async function kAsk(text) {
  $('#aiInput').value = ''; autoGrow(); $('#aiSuggest').innerHTML = '';
  addMsg('user', text); const typing = addMsg('bot', '<span class="typing"><i></i><i></i><i></i></span>', true); ai.busy = true; KN.busy = true;
  setOrbState('thinking'); caption(text, '<span class="typing"><i></i><i></i><i></i></span>');
  KN.q = text; KN.chat.push({ who: visitorName() || 'You', t: text, user: true }); KN.chat.push({ who: 'DIWA AI', t: '…', user: false }); KN.reveal = 1e9; knPaint();
  const hits = knSearch(text, 6), byDoc = new Map();
  hits.forEach(h => byDoc.set(h.d, (byDoc.get(h.d) || 0) + h.score));
  KN.cites = [...byDoc.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  KN.src = hits.length ? hits.find(h => h.d === KN.cites[0]) : null;
  let reply; KN.chart = null; KN.chartK = 0;
  if (!KN.chunks.length) { const nm = visitorName(); reply = `Thank you${nm ? ', ' + nm : ''}. Right now I am not connected to the main DIWA library, but once it is connected I can answer your questions here, with the papers and data behind each answer. Meanwhile, here is a figure from the hub’s demo data that relates to your question.`; KN.chart = knChartFor(text); }
  else if (!hits.length) reply = 'I could not find anything about that in the DIWA library. Try other words, or ask about a topic covered by the papers and data files.';
  else {
    const ref = d => KN.cites.indexOf(d) + 1;
    const ctx = 'DIWA LIBRARY EXCERPTS. Answer the visitor\'s question using ONLY these excerpts from DIWA papers and data files. Cite sources inline as [1], [2] using the numbers below. Keep it to 3–6 sentences. If the excerpts do not answer the question, say so.\n\n' +
      hits.map(h => { const D = KN.docs[h.d]; return `[${ref(h.d)}] ${D.title}${D.authors ? ' — ' + D.authors : ''}${D.year ? ' (' + D.year + ')' : ''}, ${typeof h.p === 'number' ? 'p. ' + h.p : 'sheet ' + h.p}:\n${h.t.slice(0, 1100)}`; }).join('\n\n');
    try {
      if (!CONFIG.AI_PROXY_URL) throw new Error('no AI proxy configured');
      const res = await fetch(CONFIG.AI_PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: text }], context: ctx.slice(0, 8800) }) });
      const j = await res.json().catch(() => ({})); if (!res.ok || !j.reply) throw new Error(j.error || `HTTP ${res.status}`); reply = j.reply;
    } catch (e) {
      const D = KN.docs[KN.cites[0]];
      reply = `The AI could not be reached (${e.message}). The best match in the library is “${D.title}” [1]: ${KN.src.t.slice(0, 260)}…`;
    }
  }
  typing.remove(); addMsg('bot', reply); ai.busy = false; KN.busy = false;
  KN.chat[KN.chat.length - 1].t = reply; KN.reveal = 0; KN.chat = KN.chat.slice(-8); knPaint();
  deliver(reply);
}
/* ---------- the 3D panel ---------- */
function knWrap(c, text, maxW) {
  const out = []; String(text).split('\n').forEach(par => { let line = ''; par.split(/\s+/).forEach(w => { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); out.push(line); }); return out;
}
let knLC = null, knLast = 0;
function knPaint() { if (knLC) knLC.redraw(); }
const KN_TOPICS = [
  [/snow/i, () => ({ title: 'Snow depth', unit: 'cm', data: D.snow, color: '#bfe8ff', real: REAL.weather })],
  [/soil|frost|freez|ground temp/i, () => ({ title: 'Soil temperature at −10 cm', unit: '°C', data: D.soil10.CTL, color: '#ff9f43' })],
  [/temp|warm|cold|climate|weather/i, () => ({ title: 'Air temperature', unit: '°C', data: D.airT, color: '#ff9f43', real: REAL.weather })],
  [/flood|discharge|flow|runoff|river|stream/i, () => ({ title: 'Discharge, Oulankajoki', unit: 'm³/s', data: D.Q, color: '#4fd1ff', real: REAL.hydro })],
  [/rain|precip/i, () => ({ title: 'Weekly precipitation', unit: 'mm', data: D.weekly, color: '#5ff0b0', real: REAL.weather })],
];
function knChartFor(q) { for (const [rx, f] of KN_TOPICS) if (rx.test(q)) return f(); return { title: 'Water level, Oulankajoki', unit: 'm', data: D.WL, color: '#4fd1ff', real: REAL.hydro }; }
function knPage(c, x, y, w, h, rot, seed) {
  const r = mulberry32(seed); c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-w / 2, -h / 2);
  c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.fillStyle = '#eaf3fb'; rrect(c, 0, 0, w, h, 14); c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = 'rgba(120,200,255,.9)'; c.lineWidth = 2; rrect(c, 0, 0, w, h, 14); c.stroke();
  const P = 34, bar = (bx, by, bw, bh, col) => { c.fillStyle = col; c.fillRect(bx, by, bw, bh); };
  bar(P, 30, 90, 10, '#2a78d6'); bar(w - P - 120, 30, 120, 10, '#9db3c8');
  bar(P, 70, w * .78, 22, '#13233a'); bar(P, 100, w * .55, 22, '#13233a');
  bar(P, 140, w * .5, 10, '#55708c'); bar(P, 158, w * .38, 10, '#7f95ab');
  bar(P, 190, 70, 9, '#2a78d6'); for (let i = 0; i < 6; i++) bar(P, 208 + i * 15, (w - 2 * P) * (i === 5 ? .6 : .92 + r() * .08), 7, '#9db3c8');
  const cw = (w - 2 * P - 20) / 2, y0 = 320;
  for (let col = 0; col < 2; col++) for (let i = 0; i < 18; i++) { const yy = y0 + i * 14; if (col === 1 && i >= 3 && i <= 9) continue; bar(P + col * (cw + 20), yy, cw * (i % 6 === 5 ? .55 : .9 + r() * .1), 6, '#b4c4d4'); }
  const fx = P + cw + 20, fy = y0 + 3 * 14 - 4; c.strokeStyle = '#2a78d6'; c.lineWidth = 2; c.strokeRect(fx, fy, cw, 96);
  c.beginPath(); for (let i = 0; i <= 30; i++) { const xx = fx + 8 + i * (cw - 16) / 30, yy = fy + 70 - 45 * Math.abs(Math.sin(i / 30 * 3.1 + seed)) * (.6 + .4 * r()); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
  c.fillStyle = 'rgba(42,120,214,.85)'; c.font = '700 15px ui-monospace, Menlo, monospace'; c.fillText('SAMPLE PAGE', w - P - 118, h - 26);
  c.restore();
}
function knChart(c, x, y, w, h, ch, k) {
  const mono = 'ui-monospace, "SF Mono", Menlo, monospace', d = ch.data, n = d.length, mn = Math.min(...d), mx = Math.max(...d), pad = (mx - mn) * .1 || 1, lo = mn - pad, hi = mx + pad;
  const L = x + 70, R = x + w - 10, T = y + 54, B = y + h - 40, X = i => L + (R - L) * i / (n - 1), Y = v => B - (B - T) * (v - lo) / (hi - lo);
  c.fillStyle = '#7fd0ff'; c.font = `600 21px ${mono}`; c.fillText(`FIG. 1 · ${ch.title.toUpperCase()} · ${ch.unit}`, x, y + 22);
  c.fillStyle = '#6f93b3'; c.font = `500 17px ${mono}`; c.fillText(ch.real ? (/snow|air|precip/i.test(ch.title) ? 'FMI OPEN DATA' : 'SYKE OPEN DATA') + ' · LAST 12 MONTHS' : 'EXAMPLE DATA · ONE YEAR', x, y + 44);
  c.strokeStyle = 'rgba(120,210,255,.18)'; c.lineWidth = 1; c.font = `500 16px ${mono}`; c.textAlign = 'right';
  for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4, yy = Y(v); c.beginPath(); c.moveTo(L, yy); c.lineTo(R, yy); c.stroke(); c.fillStyle = '#8fb8d8'; c.fillText(v.toFixed(Math.abs(hi - lo) < 10 ? 1 : 0), L - 10, yy + 5); }
  c.textAlign = 'center'; 'JFMAMJJASOND'.split('').forEach((m, i) => { c.fillStyle = '#8fb8d8'; c.fillText(m, X(Math.round((i + .5) * (n - 1) / 12)), B + 26); });
  c.textAlign = 'left'; c.strokeStyle = 'rgba(150,220,255,.6)'; c.beginPath(); c.moveTo(L, T); c.lineTo(L, B); c.lineTo(R, B); c.stroke();
  const m = Math.max(2, Math.floor(n * k)); c.beginPath(); for (let i = 0; i < m; i++) i ? c.lineTo(X(i), Y(d[i])) : c.moveTo(X(i), Y(d[i]));
  const gr = c.createLinearGradient(0, T, 0, B); gr.addColorStop(0, ch.color + '55'); gr.addColorStop(1, ch.color + '00');
  c.save(); c.lineTo(X(m - 1), B); c.lineTo(L, B); c.closePath(); c.fillStyle = gr; c.fill(); c.restore();
  c.beginPath(); for (let i = 0; i < m; i++) i ? c.lineTo(X(i), Y(d[i])) : c.moveTo(X(i), Y(d[i])); c.strokeStyle = ch.color; c.lineWidth = 3; c.shadowColor = ch.color; c.shadowBlur = 12; c.stroke(); c.shadowBlur = 0;
  if (k < 1) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(X(m - 1), Y(d[m - 1]), 5, 0, 7); c.fill(); }
}
let knLogo = null;
function knDraw(c, w, h) {
  const mono = 'ui-monospace, "SF Mono", Menlo, monospace', F = DS.font;
  const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0b2a58'); bg.addColorStop(1, '#061a3a'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(120,200,255,.10)'; c.lineWidth = 1; for (let x = 0; x <= w; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.strokeStyle = 'rgba(140,215,255,.22)'; for (let x = 0; x <= w; x += 150) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 150) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.strokeStyle = 'rgba(150,220,255,.7)'; c.lineWidth = 3; rrect(c, 22, 22, w - 44, h - 44, 22); c.stroke(); c.lineWidth = 1; rrect(c, 32, 32, w - 64, h - 64, 16); c.stroke();
  if (knLogo === null) { knLogo = false; loadImg(ASSET.logoWhite).then(im => { knLogo = im; knPaint(); }); }
  if (knLogo) c.drawImage(knLogo, 64, 58, 70 * knLogo.width / knLogo.height, 70);
  c.fillStyle = '#e6f6ff'; c.font = `700 52px ${F}`; c.textAlign = 'right'; c.fillText('DIWA KNOWLEDGE', w - 64, 110);
  c.font = `600 20px ${mono}`;
  if (KN.status) { c.fillStyle = '#ffd27a'; c.fillText(KN.status.toUpperCase().slice(0, 60), w - 64, 146); }
  else if (KN.docs.length) { c.fillStyle = '#5ff0b0'; c.fillText(`● ${KN.from === 'folder' ? 'LOCAL FOLDER' : 'LIBRARY'} · ${KN.docs.length} DOCUMENTS`, w - 64, 146); }
  else { c.fillStyle = '#ff9f43'; c.fillText('○ LIBRARY NOT CONNECTED', w - 64, 146); }
  c.textAlign = 'left';
  const L = 70, LW = 780, R = 930, RW = w - R - 70, top = 190;
  c.strokeStyle = 'rgba(150,220,255,.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(R - 40, top); c.lineTo(R - 40, h - 70); c.stroke();
  // left: the source paper, or two sample first pages
  if (KN.src && KN.docs[KN.src.d]) {
    const D_ = KN.docs[KN.src.d]; let y = top + 40;
    c.fillStyle = '#ffd27a'; c.font = `700 22px ${mono}`; c.fillText(`[1] ${D_.kind === 'table' ? 'DATA FILE' : 'PAPER'}`, L, y); y += 50;
    c.fillStyle = '#ffffff'; c.font = `700 38px ${F}`; knWrap(c, D_.title, LW).slice(0, 3).forEach(l => { c.fillText(l, L, y); y += 46; });
    c.fillStyle = '#9fdcff'; c.font = `500 25px ${F}`; knWrap(c, [D_.authors, D_.year].filter(Boolean).join(' · ') || D_.file, LW).slice(0, 2).forEach(l => { c.fillText(l, L, y); y += 34; });
    c.fillStyle = '#6f93b3'; c.font = `500 20px ${mono}`; c.fillText((typeof KN.src.p === 'number' ? `PAGE ${KN.src.p}` : `SHEET ${KN.src.p}`).toUpperCase() + ' · ' + D_.file.slice(0, 40), L, y + 6); y += 52;
    const qt = new Set(knTokens(KN.q)); c.font = `400 26px ${F}`;
    knWrap(c, '“' + KN.src.t.replace(/\s+/g, ' ').slice(0, 900) + '…”', LW).slice(0, Math.max(3, Math.floor((h - 250 - y) / 36))).forEach(l => {
      let x = L; l.split(' ').forEach(word => { const hit = knTokens(word).some(t => qt.has(t)); const ww = c.measureText(word).width; if (hit) { c.fillStyle = 'rgba(255,210,122,.16)'; c.fillRect(x - 3, y - 26, ww + 6, 34); } c.fillStyle = hit ? '#ffd27a' : '#d6ecff'; c.fillText(word, x, y); x += c.measureText(word + ' ').width; }); y += 36; });
    const others = KN.cites.slice(1, 4); if (others.length) { let yy = h - 96 - (others.length - 1) * 34; c.font = `500 22px ${F}`; others.forEach((d, i) => { c.fillStyle = '#ffd27a'; c.fillText(`[${i + 2}]`, L, yy); c.fillStyle = '#a9cbe6'; c.fillText(knWrap(c, KN.docs[d].title, LW - 60)[0], L + 54, yy); yy += 34; }); }
  } else {
    knPage(c, L + 40, top + 40, 520, 700, -.07, 3);
    knPage(c, L + 230, top + 80, 520, 700, .045, 7);
  }
  // right: conversation in a typographic layout, newest at the bottom, figure underneath
  const ch = KN.chart, chartH = ch ? 330 : 0, bottom = h - 80 - (ch ? chartH + 30 : 0);
  // only the latest answer, set in large type and revealed slowly
  const ans = [...KN.chat].reverse().find(m => !m.user);
  if (ans && ans.t !== '…') {
    c.font = `300 34px ${F}`; const LH = 50, all = knWrap(c, ans.t.slice(0, KN.reveal), RW), maxL = Math.floor((bottom - top) / LH); let y = top + 40;
    c.fillStyle = '#5fe0ff'; c.fillRect(R, top, 56, 4);
    all.slice(0, maxL).forEach((l, i) => { let x = R; l.split(/(\[\d+\])/).forEach(part => { c.fillStyle = /^\[\d+\]$/.test(part) ? '#ffd27a' : '#eef8ff'; c.fillText(part, x, y + 22); x += c.measureText(part).width; }); y += LH; });
  } else if (ans) { c.fillStyle = '#7fd0ff'; c.font = `300 34px ${F}`; c.fillText('…', R, top + 62); }
  else { c.fillStyle = '#e6f6ff'; c.font = `700 40px ${F}`; c.fillText('Ask about DIWA research.', R, top + 70); c.fillStyle = '#8fb8d8'; c.font = `300 30px ${F}`; ['Answers appear here, with the sources', 'and figures behind them.'].forEach((l, i) => c.fillText(l, R, top + 124 + i * 44)); }
  if (ch && KN.chartK > 0) { c.strokeStyle = 'rgba(150,220,255,.35)'; c.beginPath(); c.moveTo(R, h - 80 - chartH - 10); c.lineTo(R + RW, h - 80 - chartH - 10); c.stroke(); knChart(c, R, h - 80 - chartH, RW, chartH, ch, KN.chartK); }
}
function updateKnowledge(dt, t) {
  if (!knLC) return;
  const last = KN.chat[KN.chat.length - 1];
  if (last && !last.user && KN.reveal < last.t.length && t - knLast > .05) { KN.reveal += Math.max(12, Math.round((t - knLast) * 240)); knLast = t; knPaint(); }
  else if (last && !last.user && KN.reveal >= last.t.length && KN.chart && KN.chartK < 1 && t - knLast > .04) { KN.chartK = Math.min(1, KN.chartK + Math.max(.03, (t - knLast) * .6)); knLast = t; knPaint(); }
}
function buildKnowledge() {
  const g = new THREE.Group(); g.position.copy(KN.pos); g.lookAt(KN.look); scene.add(g); KN.g = g;
  const frameM = new THREE.MeshPhysicalMaterial({ color: 0x0a1422, roughness: .3, metalness: .45, clearcoat: 1 });
  const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(KN.W + .3, KN.H + .3, .3), { depth: .12, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 3, curveSegments: 12 }), frameM);
  fr.position.set(0, KN.y0 + KN.H / 2, -.18); fr.castShadow = true; g.add(fr);
  for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .15, KN.y0 + 1, 24), frameM); post.position.set(sx * KN.W * .3, (KN.y0 + 1) / 2, -.16); g.add(post); }
  knLC = liveCanvas(1920, 1080, knDraw);
  const mesh = new THREE.Mesh(normalizeUV(new THREE.ShapeGeometry(roundedRectShape(KN.W, KN.H, .3), 18), KN.W, KN.H), new THREE.MeshBasicMaterial({ map: knLC.tex, toneMapped: false }));
  mesh.position.set(0, KN.y0 + KN.H / 2, 0); mesh.userData.knowledge = true; g.add(mesh); pickables.push(mesh); KN.mesh = mesh;
  const f = hudFrame(KN.W, KN.H, .3, .06, .45); f.position.set(0, KN.y0 + KN.H / 2, .03); g.add(f);
  labelAt(g, KN.y0 + KN.H + .9, `<div class="ic">${svg('book')}</div><div>DIWA Knowledge<small>Ask the DIWA library</small></div>`, 'ai', focusKnowledge);
  buildKnowledgeSeats(g);
  loadKnowledgeIndex();
}
// a sofa and two armchairs facing the panel
function buildKnowledgeSeats(panel) {
  const fwd = new THREE.Vector3(); panel.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  const side = new THREE.Vector3(fwd.z, 0, -fwd.x), centre = KN.pos.clone().addScaledVector(fwd, 10.5), look = KN.pos.clone().setY(KN.y0 + KN.H * .45);
  const fabric = new THREE.MeshStandardMaterial({ color: 0x1e3556, roughness: .65, metalness: .1, emissive: 0x06142a }), cushM = new THREE.MeshStandardMaterial({ color: 0x2a4a74, roughness: .7, emissive: 0x081a34 });
  const accent = [0x2fb4ff, 0x7fe0ff, 0x1a5fb4].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .6, emissive: c, emissiveIntensity: .12 }));
  const seat = (pos, y = 1.18) => { const idx = SEATS.length; SEATS.push({ pos: pos.clone().setY(y), center: pos.clone(), look, knowledge: true });
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.1, 12), new THREE.MeshBasicMaterial({ visible: false })); hit.position.copy(pos).setY(.6); hit.userData.seat = idx; scene.add(hit); pickables.push(hit); };
  // sofa: three seats
  const sofa = new THREE.Group(); sofa.position.copy(centre); sofa.lookAt(centre.clone().sub(fwd)); scene.add(sofa);
  const parts = [], add = (w, h, d, x, y, z, r = .08) => { const gg = new RoundedBoxGeometry(w, h, d, 3, r); gg.translate(x, y, z); parts.push(gg); };
  add(2.9, .34, .92, 0, .3, 0); add(2.9, .76, .22, 0, .66, -.36, .09); add(.18, .52, .92, -1.45, .5, 0, .07); add(.18, .52, .92, 1.45, .5, 0, .07);
  const body = new THREE.Mesh(mergeGeometries(parts), fabric); body.position.y = .08; body.castShadow = body.receiveShadow = true; sofa.add(body);
  [-.9, 0, .9].forEach((x, k) => { const cu = new THREE.Mesh(new RoundedBoxGeometry(.84, .14, .72, 3, .06), cushM); cu.position.set(x, .6, .06); sofa.add(cu);
    const p = new THREE.Mesh(new RoundedBoxGeometry(.46, .38, .14, 3, .06), accent[k]); p.position.set(x, .9, -.22); p.rotation.x = -.2; sofa.add(p);
    seat(centre.clone().addScaledVector(side, -x)); });
  // armchairs either side, turned toward the panel
  const cg = chairGeo();
  [-1, 1].forEach(s => {
    const p = centre.clone().addScaledVector(side, s * 2.7).addScaledVector(fwd, -1.3);
    const ch = new THREE.Group(); ch.position.copy(p); ch.lookAt(look.x, 0, look.z); scene.add(ch);
    const b = new THREE.Mesh(cg.body, fabric); b.position.y = .1; b.castShadow = true; const cu = new THREE.Mesh(cg.cush, accent[s > 0 ? 0 : 2]); cu.position.y = .1; ch.add(b, cu); seat(p, 1.15);
  });
  [].forEach(o => { const shelf = makeBookshelf(); shelf.position.copy(centre).addScaledVector(side, o).addScaledVector(fwd, .4); shelf.lookAt(look.x, 0, look.z); scene.add(shelf); });
  // rug with a running light edge
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.8, 96), new THREE.MeshStandardMaterial({ color: 0x08111e, roughness: .5, metalness: .3 })); rug.rotation.x = -Math.PI / 2; rug.position.copy(centre).addScaledVector(fwd, -.9).setY(.02); scene.add(rug);
  const edge = new THREE.Mesh(new THREE.RingGeometry(3.72, 3.8, 128), hudMat(HUD_COMET_FS, { uSpeed: { value: .4 }, uBase: { value: .35 } }, { blending: THREE.AdditiveBlending })); edge.rotation.x = -Math.PI / 2; edge.position.copy(rug.position).setY(.025); scene.add(edge);
}
function focusKnowledge() {
  enterSpot('knowledge'); const v = faceFrom(KN.g.position, KN.look, KN.y0 + KN.H / 2, 13.5);
  flyTo(v.pos, v.tgt, 1700, () => { summonOrb(); toast('Ask a question about DIWA research', 2600); });
}
function knShowConnect() {
  if ($('#knConnect')) return;
  const b = document.createElement('button'); b.id = 'knConnect'; b.className = 'kn-connect glass'; b.innerHTML = `${svg('layers')}<span>${KN.docs.length ? 'Add a folder to the library' : 'Connect folder'}</span>`;
  b.addEventListener('click', knPick); document.body.appendChild(b);
  const off = () => { if (focus.kind !== 'knowledge' && !(seated >= 0 && SEATS[seated]?.knowledge)) { b.remove(); clearInterval(iv); } }, iv = setInterval(off, 800);
}

/* =====================================================================
   Boot
   ===================================================================== */
async function boot() {
  await progress(.08, 'Building the hall');
  buildHall(); buildOutside();
  loadOpenData();
  await progress(.22, 'Loading the Oulanka map data'); await loadOulanka();
  await progress(.3, 'Shaping the tables');
  for (let i = 0; i < SITES.length; i++) { buildTable(SITES[i]); if (i % 3 === 2) await progress(.3 + .4 * (i + 1) / SITES.length, `Shaping the tables · ${i + 1}/${SITES.length}`); }
  await progress(.75, 'Placing sensors and layers');
  buildHeroLayers(tableOf('oulanka')); buildScenarioObjects(); buildScreens(); buildOrb(); makeDust(); buildLounges(); buildAgents(); buildStars(); buildNightSky(); buildLamps(); buildNews(); buildMapBoard(); buildCatchBoard(); buildKnowledge(); buildFloorLogo(); buildWallSign(); buildClouds(); buildPrecip(); applyHUD();
  await progress(.88, 'Preparing interface');
  buildUI(); aiInit(); wbInput(); setupInput(); panoInput(); setupVR(); setupAgentUI();
  state.night = true; applySeason('summer', true); applyLayers(); setDay(playback.day);
  renderer.setAnimationLoop(loop);
  renderer.compile(scene, camera);
  await progress(1, 'Ready');
  window.__hub = { OPEN, bookNow: () => bookClock = 0, agentBook, agentAttend, BOARDS, wbApply, KN, focusKnowledge, knLoadFiles, kAsk, knSearch, sitAt, SEATS, hubContext, sendAI, IDLE, AGENTS, tables, AGX, agentCommand, openAgentMenu, AG_ACTIONS, greetVisitor, THREE, scene, camera, controls, focusSite, goHome, focusAI, focusLive, openPano, closePano, openGlobe, startStory, focusCatch, openCatchCard, focusSite, GLOBES, tableOf, setFenSurvey, storyStep, applySeason, setDay, state, renderer,
    summonOrb, dismissOrb, D, cloudSets, precipSets, setOrbState, updateOrb, deliver, caption, applyFlood, applyIce, setIceDay, clearScenario, music, ORB, scen, enter, simulatePeer, sitAt, focusLounge, toggleNight, mp, getAurora: () => aurora, focusLive, focusScreen, focusMap, focusNews, focusWhiteboard, openMapCard, wbApply, SCREENS, WB, BOARDS };
  $('#loader').classList.add('ready');
  const nm = $('#ldName'); nm.value = mp.name; setTimeout(() => { if (!entered) nm.focus(); }, 400);
  nm.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') enter(true); });
  $('#btnEnter').addEventListener('click', () => enter(true));
  $('#btnEnterQuiet').addEventListener('click', () => enter(false));
  if (/[?&]autoenter\b/.test(location.search)) enter(false, true);
}
let entered = false;
/* leave: out of the shared room at once, mic and music off, back to the start screen */
function leaveHub() {
  if (!entered) return;
  try { renderer.xr.getSession()?.end(); } catch { }
  stopTour(); agentHush(); closeAgentMenu(); AGENTS.forEach(A => { A.task = false; release(A, 2); });
  stopSpeaking(); if (ORB.mode === 'companion') dismissOrb();
  closeAllPanels(); closeMapCard(); standUp(); document.querySelectorAll('.pop').forEach(p => p.classList.remove('show'));
  mpLeave(); music.on = false; music.apply(.6); $('#btnMusic').classList.add('muted');
  SCREENS.forEach(S => { if (!S.muted) setScreenSound(S, false); if (S.playing) { ytCmd(S, 'pauseVideo'); S.playing = false; } });
  screensArmed = false; IDLE.on = false; entered = false;
  const L = $('#loader'); L.classList.remove('gone'); requestAnimationFrame(() => L.classList.remove('hide'));
  focus.kind = 'home'; focus.id = null; camera.position.set(0, 16, 62); controls.target.copy(HOME_TGT);
}
function enter(sound, auto = false) {
  if (entered) return;
  const nm = $('#ldName'), name = nm.value.trim().replace(/\s+/g, ' ').slice(0, 24) || (auto ? 'Guest' : '');
  if (!name) { nm.focus(); nm.classList.add('shake'); setTimeout(() => nm.classList.remove('shake'), 500); toast('Please type your name first', 1800); return; }
  entered = true; mp.name = name; ls.set('hub.name', name); nm.blur();
  mpJoin();   // everyone who enters is visible to everyone else; the microphone stays off
  music.on = sound; $('#musicPop [data-m=music] .switch').classList.toggle('on', sound); $('#btnMusic').classList.toggle('muted', !sound);
  if (sound) music.start();
  screensArmed = true;
  $('#loader').classList.add('hide'); setTimeout(() => $('#loader').classList.add('gone'), 1000);
  camera.lookAt(HOME_TGT);
  AGX.quiet = !sound; AGX.greeted.clear(); AGX.introduced.clear();
  flyTo(HOME_POS, HOME_TGT, 3600, () => { const ps = new URLSearchParams(location.search).get('site'); if (ps && SITE[ps]) setTimeout(() => focusSite(ps), 300); setTimeout(() => $('#hint').style.opacity = 0, 6000); screensArmed = true; perf.armed = !/[?&]hq\b/.test(location.search); setTimeout(greetVisitor, 1200); });
}
boot();
