/* Oulanka table model (real map, 1 m diameter in metres), shared by the AR Table and the AR booklet viewer. */
import * as THREE from 'three';
const DATA = new URL('../oulanka/', import.meta.url).href;
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const PANOS = { p01: 'Riverside monitoring point', p15: 'Research station yard', p14: 'Road bridge over the Oulankajoki', p02: 'Footbridge over the rapids', p03: 'Rapids and red cliffs', p08: 'Calm river bend', p11: 'Riverside meadow', p04: 'Pine forest above the river', p05: 'Riverside trail', p06: 'Trail stairs to the river', p07: 'Stairs in old-growth forest', p09: 'Stairs and boardwalk', p10: 'Boardwalk through birch forest', p12: 'Pine heath forest road', p13: 'Fen boardwalk · experiment plots' };
export const hooks = { onState: null };
/* ------------------------------------------------------------------ the Oulanka table, in metres (1 m diameter) */
export const S = { season: 'summer', flood: false, ice: false, night: false, spin: true, half: false };
const RT = .5, BODY = .1, VE = 1.6, ROT = .11;   // table radius, body height, terrain exaggeration, spin (rad/s)
export let OUL, M;                                      // data, model parts
export async function loadData() {
  const ok = r => { if (!r.ok) throw new Error(r.url + ' ' + r.status); return r; };
  const tl = new THREE.TextureLoader(), tex = f => tl.loadAsync(DATA + f).then(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; });
  const [meta, tb, trb, summer, winter, fenJul, fenMar, sens] = await Promise.all([fetch(DATA + 'oulanka.json').then(ok).then(r => r.json()), fetch(DATA + 'terrain.bin').then(ok).then(r => r.arrayBuffer()), fetch(DATA + 'trees.bin').then(ok).then(r => r.arrayBuffer()), tex('map-summer.jpg'), tex('map-winter.jpg'),
    tex('fen-jul.webp').catch(() => tex('fen-drone.webp')).catch(() => null), tex('fen-mar.webp').catch(() => null), fetch(DATA + 'sensors.json').then(ok).then(r => r.json()).catch(() => null)]);
  const fen = fenJul; meta.stations = sens ? sens.stations.filter(s => s.inTable) : [];
  const n = meta.grid * meta.grid, u = new Uint16Array(tb); meta.H = new Float32Array(n); meta.L = new Float32Array(n);
  for (let i = 0; i < n; i++) { meta.H[i] = meta.base + u[i] / meta.enc; meta.L[i] = meta.base + u[n + i] / meta.enc; }
  meta.trees = new Float32Array(trb); meta.tex = { summer, winter, fen, fenWinter: fenMar }; OUL = meta;
}
const HOLO_VS = `varying vec2 vUv; varying vec2 vP; void main(){ vUv = uv; vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const WALL_FS = `uniform float uTime; uniform float uK; varying vec2 vUv; void main(){ float y = vUv.y, f = fract(y * 6. - uTime * .35); float scan = smoothstep(0., .06, f) * smoothstep(.12, .06, f);
  float edge = smoothstep(.12, 0., y) * .5 + smoothstep(.85, 1., y) * .8; float a = (.05 + scan * .1 + edge * .35) * uK; gl_FragColor = vec4(vec3(.25, .8, 1.5), a * (1. - y * .35)); }`;
const COMET_FS = `uniform float uTime; uniform float uK; varying vec2 vP; void main(){ float a = atan(vP.y, vP.x); float c1 = pow(max(0., cos(a - uTime * .5)), 80.), c2 = pow(max(0., cos(a + 3.1416 - uTime * .5)), 80.);
  float k = (.22 * (.75 + .25 * sin(uTime * 1.7)) + (c1 + c2) * 1.6) * uK; gl_FragColor = vec4(vec3(.3, .95, 1.8) * k, clamp(k, 0., 1.)); }`;
const UT = { uTime: { value: 0 }, uK: { value: 1 } };
const holo = fs => new THREE.ShaderMaterial({ vertexShader: HOLO_VS, fragmentShader: fs, uniforms: UT, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
function labelSprite(text, sub, key) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), F = '-apple-system,"Inter","Segoe UI",Roboto,sans-serif';
  g.font = `700 ${key ? 46 : 40}px ${F}`; const w = Math.max(g.measureText(text).width, sub ? (g.font = `500 30px ${F}`, g.measureText(sub).width) : 0) + 48; c.width = Math.ceil(w); c.height = sub ? 118 : 74;
  g.fillStyle = 'rgba(3,14,30,.72)'; g.strokeStyle = key ? 'rgba(120,220,255,.85)' : 'rgba(90,200,255,.45)'; g.lineWidth = 3; g.beginPath(); g.roundRect(2, 2, c.width - 4, c.height - 4, 14); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.font = `700 ${key ? 46 : 40}px ${F}`; g.textBaseline = 'middle'; g.fillText(text, 24, sub ? 42 : 38); if (sub) { g.fillStyle = '#8fdcff'; g.font = `500 30px ${F}`; g.fillText(sub, 24, 88); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); const h = key ? .022 : .018; s.scale.set(h * c.width / c.height, h, 1); s.center.set(.5, 0); return s;
}
function pinTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(4,20,40,.6)'; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke();
  g.fillStyle = '#fff'; g.font = '700 32px ui-monospace,Menlo,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('360', 64, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function buildModel(opt = {}) {
  const O = OUL, N = O.grid, R = O.R, VS = VE * RT / R, Y0 = BODY + .004, ym = m => Y0 + (m - O.zmin) * VS;
  const grid = (A, x, z) => { const fx = (x + 1) / 2 * (N - 1), fz = (z + 1) / 2 * (N - 1), i = clamp(Math.floor(fx), 0, N - 2), j = clamp(Math.floor(fz), 0, N - 2), u = clamp(fx - i, 0, 1), v = clamp(fz - j, 0, 1), k = j * N + i;
    return lerp(lerp(A[k], A[k + 1], u), lerp(A[k + N], A[k + N + 1], u), v); };
  const hAt = (x, z) => ym(grid(O.H, x, z)), lAt = (x, z) => ym(grid(O.L, x, z)), sAt = (x, z) => Math.max(hAt(x, z), lAt(x, z));
  const root = new THREE.Group(), spin = new THREE.Group(); root.add(spin);
  // body of the table: dark metal with a name band, running light on the rim
  const metal = new THREE.MeshStandardMaterial({ color: 0x0b1828, roughness: .3, metalness: .7, emissive: 0x020812 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(RT + .012, RT - .03, BODY, 96), metal); body.position.y = BODY / 2; root.add(body);
  { const c = document.createElement('canvas'); c.width = 2048; c.height = 160; const g = c.getContext('2d'); g.font = '700 96px -apple-system,"Inter",Roboto,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#3fc0ff'; g.shadowBlur = 20; g.fillStyle = '#fff'; g.fillText('OULANKA RESEARCH STATION', 1024, 84);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false });
    [0, Math.PI].forEach(o => { const b = new THREE.Mesh(new THREE.CylinderGeometry(RT + .014, RT - .02, BODY * .55, 64, 1, true, o + Math.PI / 2 - 1.1, 2.2), m); b.position.y = BODY / 2; root.add(b); }); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(RT + .006, RT + .04, 160), holo(COMET_FS)); ring.rotation.x = -Math.PI / 2; ring.position.y = BODY + .001; root.add(ring);
  // outer degree ring, like the printed sheet: turns the opposite way to the table
  const dial = new THREE.Group(); dial.position.y = BODY + .002; if (opt.dial !== false) root.add(dial);
  { const c = document.createElement('canvas'); c.width = c.height = 2048; const g = c.getContext('2d'), C = 1024;
    g.strokeStyle = '#5fd7ff'; g.lineWidth = 7; g.beginPath(); g.arc(C, C, 900, 0, 7); g.stroke(); g.lineWidth = 3; g.globalAlpha = .7; g.beginPath(); g.arc(C, C, 975, 0, 7); g.stroke(); g.globalAlpha = 1;
    for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2, r0 = 912, r1 = k % 6 === 0 ? 1010 : 960; g.lineWidth = k % 6 === 0 ? 12 : 5; g.beginPath(); g.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); g.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const R0 = RT + .05, R1 = RT + .12, m = new THREE.Mesh(new THREE.RingGeometry(R0, R1, 200, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.3, 1.4, 1.6), side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    // map the ring geometry onto the band of the texture between radius 880 and 1024
    const uvA = m.geometry.attributes.uv, pA = m.geometry.attributes.position; for (let i = 0; i < uvA.count; i++) { const x = pA.getX(i), y = pA.getY(i), r = Math.hypot(x, y), a = Math.atan2(y, x), rr = (880 + (r - R0) / (R1 - R0) * 144) / 2048; uvA.setXY(i, .5 + Math.cos(a) * rr, .5 + Math.sin(a) * rr); }
    m.rotation.x = -Math.PI / 2; dial.add(m); }
  const foot = new THREE.Mesh(new THREE.RingGeometry(RT * .78, RT * .84, 120), holo(COMET_FS)); foot.rotation.x = -Math.PI / 2; foot.position.y = .002; if (opt.dial !== false) root.add(foot);
  // terrain: grid clipped to the circle
  const G = 241, pos = new Float32Array(G * G * 3), wpos = new Float32Array(G * G * 3), uv = new Float32Array(G * G * 2), ins = new Uint8Array(G * G), Hm = new Float32Array(G * G), Lm = new Float32Array(G * G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const k = j * G + i; let x = -1 + 2 * i / (G - 1), z = -1 + 2 * j / (G - 1); const r = Math.hypot(x, z); ins[k] = r <= 1; if (r > 1) { x /= r; z /= r; }
    Hm[k] = grid(O.H, x, z); Lm[k] = grid(O.L, x, z); pos[k * 3] = wpos[k * 3] = x * RT; pos[k * 3 + 2] = wpos[k * 3 + 2] = z * RT; pos[k * 3 + 1] = ym(Hm[k]); wpos[k * 3 + 1] = ym(Lm[k]); uv[k * 2] = (x + 1) / 2; uv[k * 2 + 1] = (1 - z) / 2; }
  const idx = [], widx = [];
  for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) { const a = j * G + i, b = a + 1, c = a + G, d = c + 1; if (!(ins[a] | ins[b] | ins[c] | ins[d])) continue; idx.push(a, c, b, b, c, d);
    if (Math.max(Lm[a] - Hm[a], Lm[b] - Hm[b], Lm[c] - Hm[c], Lm[d] - Hm[d]) > -7) widx.push(a, c, b, b, c, d); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); tg.setIndex(idx); tg.computeVertexNormals();
  const U = { uWinter: { value: O.tex.winter }, uSnow: { value: 0 } };
  const tm = new THREE.MeshStandardMaterial({ map: O.tex.summer, roughness: .95 });
  tm.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); sh.fragmentShader = 'uniform sampler2D uWinter;\nuniform float uSnow;\n' + sh.fragmentShader.replace('#include <map_fragment>', 'diffuseColor.rgb *= mix(texture2D(map, vMapUv).rgb, texture2D(uWinter, vMapUv).rgb, uSnow);'); };
  const terr = new THREE.Mesh(tg, tm); spin.add(terr);
  // cut edge of the landscape block
  { const SEG = 360, p = [], ix = []; for (let s = 0; s <= SEG; s++) { const a = s / SEG * Math.PI * 2, x = Math.cos(a), z = Math.sin(a); p.push(x * RT, sAt(x * .999, z * .999), z * RT, x * RT, BODY, z * RT); }
    for (let s = 0; s < SEG; s++) { const a = s * 2; ix.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeVertexNormals(); spin.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1, side: THREE.DoubleSide }))); }
  // water following the real river and lake levels
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wpos, 3)); wg.setIndex(widx); wg.computeVertexNormals();
  const wm = new THREE.MeshStandardMaterial({ color: 0x1d4660, transparent: true, opacity: .82, roughness: .08, metalness: .1 });
  const water = new THREE.Mesh(wg, wm); spin.add(water);
  // white water at Kiutaköngäs
  const fp = [], fd = [], fs = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  O.rapids.forEach(line => { const flip = lAt(...line[0]) < lAt(...line[line.length - 1]) ? -1 : 1;
    for (let s = 0; s < line.length - 1; s++) { const [ax, az] = line[s], [bx, bz] = line[s + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) * R / 2), dx = (bx - ax) * flip, dz = (bz - az) * flip, dl = Math.hypot(dx, dz) || 1;
      for (let q = 0; q < n; q++) for (let w = 0; w < 2; w++) { const t = (q + rnd()) / n, x = lerp(ax, bx, t) + (rnd() - .5) * 12 / R, z = lerp(az, bz, t) + (rnd() - .5) * 12 / R; fp.push(x * RT, lAt(x, z) + .0008, z * RT); fd.push(dx / dl, 0, dz / dl); fs.push(rnd()); } } });
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('aDir', new THREE.Float32BufferAttribute(fd, 3)); fg.setAttribute('aS', new THREE.Float32BufferAttribute(fs, 1));
  const foam = new THREE.Points(fg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: UT,
    vertexShader: 'attribute vec3 aDir; attribute float aS; uniform float uTime; varying float vA; void main(){ float f = fract(uTime * .35 + aS * 7.); vec3 p = position + aDir * (f - .5) * .006; vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = (2.5 + 2.5 * fract(aS * 13.)) * 0.9 / -mv.z; vA = (.5 + .5 * abs(sin(uTime * 2.3 + aS * 40.))) * sin(f * 3.1416); }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(.96, .98, 1., smoothstep(.5, .1, d) * vA); }' }));
  water.add(foam);
  // fen drone photo (5 cm) as a sharper inset on Puukkosuo
  let fenM = null;
  if (O.fen && O.tex.fen) { const [[x0, z0], [x1, z1]] = O.fen.bounds, NX = 40, NZ = Math.round(NX * (z1 - z0) / (x1 - x0)), p = [], u2 = [], ix = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = lerp(x0, x1, i / NX), z = lerp(z0, z1, j / NZ); p.push(x * RT, hAt(x, z) + .0004, z * RT); u2.push(i / NX, 1 - j / NZ); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; ix.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u2, 2)); g.setIndex(ix); g.computeVertexNormals();
    fenM = new THREE.MeshStandardMaterial({ map: O.tex.fen, transparent: true, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); spin.add(new THREE.Mesh(g, fenM)); }
  // trees: spruce, pine and birch from the land-cover analysis
  const ni = g => g.index ? g.toNonIndexed() : g, cone = (r, h, y) => { const g = new THREE.ConeGeometry(r, h, 5); g.translate(0, y + h / 2, 0); return ni(g); };
  const merge = gs => { let n = 0; gs.forEach(g => n += g.attributes.position.count); const p = new Float32Array(n * 3); let o = 0; gs.forEach(g => { p.set(g.attributes.position.array, o); o += g.attributes.position.array.length; }); const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(p, 3)); m.computeVertexNormals(); return m; };
  const crowns = [merge([cone(.3, .55, .15), cone(.22, .45, .45)]), (() => { const a = new THREE.IcosahedronGeometry(.25, 0); a.scale(1, .6, 1); a.translate(0, .82, 0); return merge([ni(a)]); })(), (() => { const a = new THREE.IcosahedronGeometry(.24, 0); a.scale(.8, 1.3, .8); a.translate(0, .62, 0); return merge([ni(a)]); })()];
  const trunkG = (() => { const g = new THREE.CylinderGeometry(.025, .035, .8, 4, 1, true); g.translate(0, .4, 0); return g; })();
  const tr = O.trees, nT = tr.length / 4, cnt = [0, 0, 0]; for (let i = 0; i < nT; i++) cnt[tr[i * 4 + 3]]++;
  const crownM = [0x1f3a26, 0x3d5a2c, 0x5f8a38].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true }));
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 }), birchTrunk = new THREE.MeshStandardMaterial({ color: 0xd9d6cc, roughness: 1 });
  const IM = [0, 1, 2].map(t => [new THREE.InstancedMesh(crowns[t], crownM[t], Math.max(1, cnt[t])), new THREE.InstancedMesh(trunkG, t === 2 ? birchTrunk : trunkM, Math.max(1, cnt[t]))]);
  const o = new THREE.Object3D(), K = [0, 0, 0], TH = [.0095, .0105, .008];
  for (let i = 0; i < nT; i++) { if (i % 5 === 4) continue; const x = tr[i * 4], z = tr[i * 4 + 1], s = tr[i * 4 + 2], t = tr[i * 4 + 3], sz = TH[t] * s;
    o.position.set(x * RT, hAt(x, z) - .0005, z * RT); o.scale.set(sz, sz * (.9 + rnd() * .3), sz); o.rotation.y = rnd() * 6; o.updateMatrix(); IM[t][0].setMatrixAt(K[t], o.matrix); IM[t][1].setMatrixAt(K[t], o.matrix); K[t]++; }
  IM.forEach(([a, b], t) => { a.count = b.count = K[t]; spin.add(a, b); });
  // buildings from the real footprints, gable roofs on the rectangular ones; bridges
  const STY = { station: [0x25282d, 0x1c1e22], red: [0x9a2d20, 0x2d2e31], centre: [0xe6e0d2, 0x6b6f74], cabin: [0x6e4c33, 0x3d4045], yellow: [0xc9b06a, 0x4f7f5a] }, roofs = [];
  const HB = VS * 2.6;
  O.buildings.forEach(B => { const st = STY[B.style] || STY.cabin; let lo = 1e9; B.pts.forEach(([x, z]) => lo = Math.min(lo, hAt(x, z)));
    const wh = B.floors * 3.3 * HB + .002, wall = new THREE.MeshStandardMaterial({ color: st[0], roughness: .85 }), roof = new THREE.MeshStandardMaterial({ color: st[1], roughness: .7, side: THREE.DoubleSide }); roof.userData.base = st[1]; roofs.push(roof);
    const eg = new THREE.ExtrudeGeometry(new THREE.Shape(B.pts.map(([x, z]) => new THREE.Vector2(x * RT, -z * RT))), { depth: wh, bevelEnabled: false }); eg.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(eg, [roof, wall]); m.position.y = lo - .001; spin.add(m);
    if (B.rect && B.len < 140) { const L2 = B.len / R * RT / 2 * 1.06, W2 = B.wid / R * RT / 2 * 1.1, hr = Math.min(W2 * .55, .006), rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute([-L2, 0, -W2, L2, 0, -W2, L2, 0, W2, -L2, 0, W2, -L2, hr, 0, L2, hr, 0], 3)); rg.setIndex([0, 4, 1, 1, 4, 5, 2, 5, 3, 3, 5, 4, 0, 3, 4, 1, 5, 2]); rg.computeVertexNormals();
      const rm = new THREE.Mesh(rg, roof); rm.position.set(B.c[0] * RT, lo - .001 + wh, B.c[1] * RT); rm.rotation.y = -B.ang; spin.add(rm); } });
  O.bridges.forEach(B => { const y = ym(O.base + B.deck), w = Math.max(B.w / R * RT, .003), mat = new THREE.MeshStandardMaterial({ color: B.kind === 'road' ? 0x8a8c90 : 0x8a5a36, roughness: .7 });
    for (let s = 0; s < B.pts.length - 1; s++) { const [ax, az] = B.pts[s], [bx, bz] = B.pts[s + 1], dx = (bx - ax) * RT, dz = (bz - az) * RT, len = Math.hypot(dx, dz);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len + .002, .0015, w), mat); m.position.set((ax + bx) / 2 * RT, y, (az + bz) / 2 * RT); m.rotation.y = -Math.atan2(dz, dx); spin.add(m); } });
  // place names
  const labels = new THREE.Group(); if (opt.labels !== false) spin.add(labels);
  O.labels.filter(l => l.kind === 'key' || l.kind === 'river' || /Visitor/.test(l.t)).forEach(l => { const s = labelSprite(l.t, l.sub, l.kind === 'key'); const [x, z] = l.at; s.position.set(x * RT, sAt(x, z) + (l.kind === 'key' ? .05 : .025), z * RT); labels.add(s); });
  // 360° photo points
  const pins = [], pt = pinTexture();
  Object.entries(O.pano).forEach(([id, [x, z]]) => { if (!PANOS[id]) return; const y = sAt(x, z);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pt, color: new THREE.Color(.6, 1.2, 1.9), transparent: true, depthWrite: false, toneMapped: false })); s.scale.setScalar(.015); s.position.set(x * RT, y + .025, z * RT); s.userData.pano = id;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.0005, .0005, .025, 4), new THREE.MeshBasicMaterial({ color: 0x7fdcff })); st.position.set(x * RT, y + .0125, z * RT); if (opt.pins !== false) { spin.add(s, st); pins.push(s); } });
  // public sensor stations (DIWA sensor template): small glowing dots coloured by what they measure
  const SC = { soil: 0x34d399, surface: 0x38bdf8, groundwater: 0xa78bfa, atmosphere: 0xfacc15, vegetation: 0x86efac, remote: 0xf1f5f9, other: 0x94a3b8 };
  const sensors = new THREE.Group(); if (opt.sensors !== false) spin.add(sensors);
  (O.stations || []).forEach((st, i) => { const [x, z] = st.at, y = sAt(x, z), c = new THREE.Color(SC[st.cat] || SC.other), h = .012 + (i % 3) * .003;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.0028, 10, 8), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.6), toneMapped: false })); dot.position.set(x * RT, y + h, z * RT);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.0003, .0003, h, 4), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .7 })); stem.position.set(x * RT, y + h / 2, z * RT);
    sensors.add(dot, stem); });
  // hologram glass around the landscape
  let top = -1e9; for (let i = 0; i < O.H.length; i++) top = Math.max(top, O.H[i]); const topY = ym(top) + .01;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(RT + .003, RT + .003, topY - BODY, 160, 1, true), holo(WALL_FS)); wall.position.y = BODY + (topY - BODY) / 2; root.add(wall);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RT + .004, .0018, 6, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, 1.1, 2), toneMapped: false })); rim.rotation.x = Math.PI / 2; rim.position.y = topY; root.add(rim);
  // night glow around the station
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 64; { const g = glowC.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const glowT = new THREE.CanvasTexture(glowC), lamps = new THREE.Group(); lamps.visible = false; spin.add(lamps);
  O.buildings.filter(b => b.d < 400).forEach(b => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(.025); s.position.set(b.c[0] * RT, hAt(...b.c) + .008, b.c[1] * RT); lamps.add(s); });
  // lights live with the model so it looks the same in every mode
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x2a3442, 1.25), sun = new THREE.DirectionalLight(0xfff1dc, 1.9); sun.position.set(.6, 1.2, .5); root.add(hemi, sun);
  M = { root, spin, dial, opt, U, water, wm, foam, IM, crownM, roofs, fenM, labels, pins, sensors, lamps, hemi, sun, VS, waterY: 0, appear: 0 };
  return root;
}
// toggles
export function applyState(instant) {
  if (!M) return;
  const win = S.season === 'winter';
  M.target = { snow: win ? 1 : 0, rise: S.flood ? 4.5 * M.VS : 0 };
  if (instant) { M.U.uSnow.value = M.target.snow; M.water.position.y = M.target.rise; }
  M.crownM[0].color.setHex(win ? 0x52625a : 0x1f3a26); M.crownM[1].color.setHex(win ? 0x6d7d72 : 0x3d5a2c);
  M.IM[2][0].visible = !win;                                        // birches lose their leaves
  M.roofs.forEach(r => r.color.setHex(win ? 0xeef3f7 : r.userData.base));
  const ft = win && OUL.tex.fenWinter ? OUL.tex.fenWinter : OUL.tex.fen;                 // Puukkosuo drone photo of the matching season
  if (M.fenM && ft && M.fenM.map !== ft) { M.fenM.map = ft; M.fenM.needsUpdate = true; }
  const ice = S.ice || win;
  M.wm.color.setHex(S.ice ? 0xdfeaf2 : win ? 0xcfdde8 : S.flood ? 0x5a4a32 : 0x1d4660); M.wm.roughness = ice ? .35 : .08; M.wm.opacity = ice ? .96 : .84;
  M.hemi.intensity = S.night ? .3 : 1.25; M.sun.intensity = S.night ? .12 : 1.9; M.sun.color.setHex(S.night ? 0x7fa0ff : 0xfff1dc); M.lamps.visible = S.night;
  hooks.onState && hooks.onState([S.season === 'winter' ? 'Winter' : 'Summer', S.flood && 'spring flood', S.ice && 'river ice', S.night && 'night'].filter(Boolean).join(' · ') + ` · ${S.half ? '50 cm' : '1 m'} table`);
}
export function tickModel(dt, t) {
  if (!M) return; UT.uTime.value = t;
  if (M.target) { M.U.uSnow.value = lerp(M.U.uSnow.value, M.target.snow, .05); M.water.position.y = lerp(M.water.position.y, M.target.rise, .04); }
  if (S.spin && M.opt.spin !== false) { M.spin.rotation.y += dt * ROT; M.dial.rotation.y -= dt * ROT * .6; }
  // appearing: rises from the base and fades the hologram in
  if (M.appear < 1) { M.appear = Math.min(1, M.appear + dt / 1.6); const e = 1 - Math.pow(1 - M.appear, 3); M.spin.scale.set(1, Math.max(.001, e), 1); M.spin.position.y = 0; UT.uK.value = e * (1 + 2 * (1 - e)); M.labels.visible = M.appear > .9; }
}
