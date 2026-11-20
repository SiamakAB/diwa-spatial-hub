
/* =====================================================================
   VR EDITION (vr.html only) — Meta Quest 3 and other WebXR headsets
   Laser pointers · thumbstick walking and snap turn · teleport · hand menu
   3D info cards · 360° photos inside the headset · agents' subtitles
   Shares everything else (hall, tables, data, agents, AI, sessions) with the browser version.
   ===================================================================== */
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const VR = {
  ok: false, on: false, dolly: new THREE.Group(), ctrls: [], panels: [], menu: null, card: null, sub: null, fade: null,
  pano: null, panoIdx: 0, hidden: [], snapReady: [true, true], btnPrev: [{}, {}], placeCard: false, menuOn: true,
  camPrev: null, subKey: '', menuKey: '',
};
const _vm = new THREE.Matrix4(), _vp = new THREE.Vector3(), _vq = new THREE.Vector3(), _hp = new THREE.Vector3(), _hd = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);
const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const faceYaw = (dx, dz) => Math.atan2(-dx, -dz);
const inHall = p => (p.x / (HALL.rx * .9)) ** 2 + (p.z / (HALL.rz * .9)) ** 2 < 1;
const headYawLocal = () => new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y;

/* ---------- canvas panels (menus, cards, subtitles) ---------- */
const UIF = 'Inter, system-ui, -apple-system, Segoe UI, sans-serif';
function makePanel(wm, hm, render, ppm = 1000) {
  const W = Math.round(wm * ppm), H = Math.round(hm * ppm);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wm, hm), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  mesh.renderOrder = 20;
  const P = { mesh, ctx, tex, W, H, buttons: [], hover: null, render };
  mesh.userData.panel = P; VR.panels.push(P);
  P.redraw = () => { ctx.clearRect(0, 0, W, H); P.buttons = []; P.render(P); tex.needsUpdate = true; };
  P.hit = uv => { const x = uv.x * W, y = (1 - uv.y) * H; return P.buttons.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null; };
  return P;
}
function panelBg(P, r = 40) {
  const c = P.ctx; c.beginPath(); c.roundRect(4, 4, P.W - 8, P.H - 8, r);
  c.fillStyle = 'rgba(10,26,46,0.9)'; c.fill(); c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,0.22)'; c.stroke();
}
function panelBtn(P, id, x, y, w, h, label, opts = {}) {
  const c = P.ctx, hov = P.hover === id;
  P.buttons.push({ id, x, y, w, h, run: opts.run });
  c.beginPath(); c.roundRect(x, y, w, h, Math.min(26, h / 2));
  c.fillStyle = opts.primary ? (hov ? '#2a8be0' : '#1770b8') : opts.on ? (hov ? '#ffffff' : '#e8f2fc') : opts.danger ? (hov ? 'rgba(255,90,80,.45)' : 'rgba(255,90,80,.28)') : (hov ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.13)');
  c.fill();
  c.fillStyle = opts.on ? '#0c2a4c' : '#ffffff'; c.font = `600 ${opts.size || 34}px ${UIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(label, x + w / 2, y + h / 2 + 2); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
}

/* ---------- hand menu (left controller) ---------- */
function menuRender(P) {
  const c = P.ctx; panelBg(P, 44);
  c.fillStyle = '#9fc6ea'; c.font = `700 26px ${UIF}`; c.fillText('DIWA SPATIAL HUB · VR', 40, 64);
  const L = 40, G = 16, W = P.W - 80, half = (W - G) / 2, q = (W - 3 * G) / 4, h = 78;
  let y = 96;
  if (VR.pano) {
    const P0 = CONFIG.PANORAMAS[VR.panoIdx];
    c.fillStyle = '#fff'; c.font = `700 34px ${UIF}`; wrapText(c, P0.title, L, y + 34, W, 40, 2);
    c.fillStyle = '#b9cde2'; c.font = `500 26px ${UIF}`; c.fillText(`360° photo ${VR.panoIdx + 1} of ${CONFIG.PANORAMAS.length}`, L, y + 124);
    y += 160;
    panelBtn(P, 'prev', L, y, half, h, '‹ Previous', { run: () => vrPano(VR.panoIdx - 1) });
    panelBtn(P, 'next', L + half + G, y, half, h, 'Next ›', { run: () => vrPano(VR.panoIdx + 1) }); y += h + G;
    panelBtn(P, 'back', L, y, W, h, 'Back to the hall', { primary: true, run: vrPanoClose });
    return;
  }
  panelBtn(P, 'home', L, y, half, h, 'Home', { run: () => { vrCardClose(); clearScenario(); goHome(); } });
  panelBtn(P, 'tour', L + half + G, y, half, h, AGX.tour ? 'Stop tour' : 'Tour with Emma', { primary: !AGX.tour, danger: !!AGX.tour, size: 30, run: () => { vrCardClose(); AGX.tour ? stopTour() : AG_ACTIONS.tour.run(AGENTS[0]); } }); y += h + G;
  c.fillStyle = '#9fc6ea'; c.font = `700 22px ${UIF}`; c.fillText('SEASON', L, y + 20); y += 32;
  [['winter', 'Winter'], ['spring', 'Spring'], ['summer', 'Summer'], ['autumn', 'Autumn']].forEach(([s, lb], k) =>
    panelBtn(P, 's-' + s, L + k * (q + G), y, q, 66, lb, { on: state.season === s, size: 23, run: () => applySeason(s) }));
  y += 66 + G + 6;
  panelBtn(P, 'night', L, y, half, h, state.night ? 'Daylight' : 'Night sky', { run: toggleNight });
  panelBtn(P, 'music', L + half + G, y, half, h, music.on ? 'Music off' : 'Music on', { run: () => { music.on = !music.on; if (music.on) music.start(); music.apply(.6); } }); y += h + G;
  panelBtn(P, 'flood', L, y, half, h, 'Spring flood', { run: () => { vrCardClose(); focusSite('oulanka'); setTimeout(() => applyFlood('q50', false), 400); vrSiteCard('oulanka'); } });
  panelBtn(P, 'ice', L + half + G, y, half, h, 'River ice', { run: () => { vrCardClose(); focusSite('oulanka'); setTimeout(() => applyIce('jam', false), 400); vrSiteCard('oulanka'); } }); y += h + G;
  panelBtn(P, 'map', L, y, half, h, 'Map of Finland', { size: 30, run: () => { vrCardClose(); focusMap(); } });
  panelBtn(P, 'pano', L + half + G, y, half, h, '360° photos', { run: () => vrPano(0) }); y += h + G;
  panelBtn(P, 'mic', L, y, half, h, mp.micOn ? 'Mic off' : 'Mic on', { on: mp.micOn, run: () => mpMute() });
  panelBtn(P, 'exit', L + half + G, y, half, h, 'Exit VR', { danger: true, run: () => renderer.xr.getSession()?.end() });
}
function menuKey() { return [VR.pano ? VR.panoIdx : -1, state.season, state.night, music.on, mp.micOn, !!AGX.tour].join('|'); }

/* ---------- world cards ---------- */
let cardSpec = null;
function cardRender(P) {
  const c = P.ctx, S = cardSpec; if (!S) return; panelBg(P, 48);
  const L = 56, W = P.W - 112;
  panelBtn(P, 'x', P.W - 112, 34, 72, 72, '×', { size: 48, run: vrCardClose });
  if (S.code) { c.beginPath(); c.arc(L + 34, 86, 34, 0, 7); c.fillStyle = S.color || '#1770b8'; c.fill(); c.fillStyle = '#fff'; c.font = `800 28px ${UIF}`; c.textAlign = 'center'; c.fillText(S.code, L + 34, 96); c.textAlign = 'left'; }
  const tx = S.code ? L + 88 : L;
  c.fillStyle = '#fff'; c.font = `700 44px ${UIF}`; c.fillText(S.title, tx, 84);
  if (S.sub) { c.fillStyle = '#9fc6ea'; c.font = `600 26px ${UIF}`; c.fillText(S.sub, tx, 122); }
  c.fillStyle = '#dbe7f3'; c.font = `500 30px ${UIF}`;
  const lines = wrapText(c, S.text || '', L, 196, W, 42, S.buttons?.length ? 7 : 10);
  const bs = S.buttons || [], cols = Math.min(3, bs.length) || 1, G = 18, bw = (W - (cols - 1) * G) / cols, bh = 76;
  const rows = Math.ceil(bs.length / cols); let y = P.H - 48 - rows * bh - (rows - 1) * G;
  bs.forEach((b, k) => panelBtn(P, 'b' + k, L + (k % cols) * (bw + G), y + Math.floor(k / cols) * (bh + G), bw, bh, b.label, { primary: b.primary, size: 30, run: b.run }));
}
function vrCard(spec) {
  cardSpec = spec;
  if (!VR.card) { VR.card = makePanel(1.1, .72, cardRender); scene.add(VR.card.mesh); }
  VR.card.redraw(); VR.card.mesh.visible = true; VR.placeCard = 2;   // placed in front of the user once the view has settled
}
function vrCardClose() { if (VR.card) VR.card.mesh.visible = false; cardSpec = null; }
function placeCardNow() {
  camera.getWorldPosition(_hp); camera.getWorldDirection(_hd); _hd.y = 0; if (_hd.lengthSq() < 1e-4) _hd.set(0, 0, -1); _hd.normalize();
  const m = VR.card.mesh; m.position.copy(_hp).addScaledVector(_hd, 1.35); m.position.y = _hp.y - .12;
  m.lookAt(_hp.x, m.position.y, _hp.z);
}
function vrSiteCard(id) {
  const s = SITE[id], hero = !!s.hero;
  const buttons = hero ? [
    { label: 'Spring flood', run: () => applyFlood('q50', false) },
    { label: 'River ice', run: () => applyIce('jam', false) },
    { label: '360° photos', run: () => vrPano(0) },
    { label: 'Clear scenario', run: () => clearScenario() },
    { label: `Ask ${AGENTS[HOSTS[id]].name}`, run: () => { vrCardClose(); hostTable(id); } },
    { label: 'Close', primary: true, run: vrCardClose },
  ] : [
    { label: `Ask ${AGENTS[HOSTS[id]]?.name || 'the host'}`, run: () => { vrCardClose(); hostTable(id); } },
    { label: 'Close', primary: true, run: vrCardClose },
  ];
  vrCard({ code: siteCode(s), title: s.name, sub: s.sub, text: hero ? 'The Oulankajoki flows through Oulanka National Park in Kuusamo, past the University of Oulu’s Oulanka Research Station. Point at a glowing globe for its sensors, or try a scenario below. The flood and ice scenarios are illustrative, not model output.' : s.text, buttons });
}
function vrGlobeCard(gid) {
  const G = GLOBES.find(g => g.id === gid); if (!G) return;
  const C = SENSOR_CATS[G.cat] || SENSOR_CATS.other, since = G.sensors.map(x => x.start).filter(Boolean).sort()[0];
  vrCard({ code: 'S', color: C.css, title: G.name, sub: `${G.place || G.site} · ${C.label}`, text: `${G.sensors.map(x => [x.producer, x.model].filter(Boolean).join(' ') + (x.params ? ': ' + x.params : '')).join('. ')}.${since ? ` Measuring since ${since.slice(0, 4)}.` : ''} Details are in the browser version.`, buttons: [{ label: 'Close', primary: true, run: vrCardClose }] });
}
function vrAgentCard(i) {
  const A = AGENTS[i], go = k => () => { vrCardClose(); AG_ACTIONS[k].run(A); };
  vrCard({ code: A.name[0], color: A.color, title: A.name, sub: AGENT_ROLE[i], text: 'I can guide you through the hall or show you something. What would you like to see?',
    buttons: [{ label: 'Give me a tour', primary: true, run: go('tour') }, { label: 'Spring flood', run: go('flood') }, { label: 'River ice', run: go('ice') },
      { label: state.season === 'winter' ? 'Show summer' : 'Show winter', run: go('winter') }, { label: state.night ? 'Daylight' : 'Northern lights', run: go('night') }, { label: 'Map of Finland', run: go('map') }] });
}
function vrNewsCard(k = NEWS.i) {
  const n = CONFIG.NEWS[(k + CONFIG.NEWS.length) % CONFIG.NEWS.length];
  vrCard({ code: 'N', title: 'Latest DIWA news', sub: `${n.date} · ${n.tag}`, text: `${n.title}. ${n.text}`,
    buttons: [{ label: '‹ Previous', run: () => vrNewsCard(k - 1) }, { label: 'Next ›', run: () => vrNewsCard(k + 1) }, { label: 'Close', primary: true, run: vrCardClose }] });
}
const vrNote = (title, text) => vrCard({ title, text, buttons: [{ label: 'Close', primary: true, run: vrCardClose }] });

/* ---------- subtitles for the agents' voices (follow the view) ---------- */
function subRender(P) {
  const s = AGX.speech; if (!s) return; const c = P.ctx; panelBg(P, 36);
  c.beginPath(); c.arc(64, 64, 22, 0, 7); c.fillStyle = s.A.color; c.fill();
  c.fillStyle = '#fff'; c.font = `700 30px ${UIF}`; c.fillText(s.A.name, 100, 74);
  c.fillStyle = '#e3edf7'; c.font = `500 28px ${UIF}`; wrapText(c, $('#agCapText').textContent, 44, 126, P.W - 88, 38, 3);
}

/* ---------- moving around ---------- */
const headLocalY = () => (camera.position.y > .3 ? camera.position.y : 1.6);
const MAX_LIFT = 8;
function vrTeleport(x, z, yaw, eyeY) {
  vrFade();
  VR.dolly.position.y = eyeY === undefined ? 0 : clamp(eyeY - headLocalY(), 0, MAX_LIFT);   // no eye height = back on the floor
  const p = new THREE.Vector3(x, 0, z); if (!inHall(p)) { const k = Math.sqrt((p.x / (HALL.rx * .88)) ** 2 + (p.z / (HALL.rz * .88)) ** 2); p.x /= k; p.z /= k; }
  if (yaw !== undefined) VR.dolly.rotation.y = yaw - headYawLocal();
  const off = new THREE.Vector3(camera.position.x, 0, camera.position.z).applyAxisAngle(_Y, VR.dolly.rotation.y);
  VR.dolly.position.x = p.x - off.x; VR.dolly.position.z = p.z - off.z;
}
function vrFade() { if (!VR.fade) return; VR.fade.material.opacity = 1; }
// hub camera moves (focusSite, tours, goHome …) become a short teleport in VR
const TABLE_TOP = 1.1, LOOK_DOWN = THREE.MathUtils.degToRad(36);
function vrStandFor(pos, tgt) {
  let stand, look, eye;
  if (pos.distanceTo(HOME_POS) < .5) { vrTeleport(0, 22, faceYaw(0, -1), 4.2); return; }     // overview from the entrance, a little raised
  if (focus.kind === 'site' && focus.id) {
    // above and back from the table, looking down about 36°, so the whole table fits in view
    const T = tableOf(focus.id), c = new THREE.Vector3(T.site.pos[0], 0, T.site.pos[1]);
    const d = new THREE.Vector3(pos.x - c.x, 0, pos.z - c.z); if (d.lengthSq() < 1e-4) d.set(0, 0, 1); d.normalize();
    const D = T.site.r * 1.55 + .6;
    stand = c.clone().addScaledVector(d, D); look = c; eye = TABLE_TOP + D * Math.tan(LOOK_DOWN);
  } else {
    // boards and screens: eyes level with their centre, far enough back to see all of it
    const d = new THREE.Vector3(pos.x - tgt.x, 0, pos.z - tgt.z), len = d.length(); if (len < 1e-3) d.set(0, 0, 1); d.normalize();
    const dist = focus.kind === 'screen' ? 10 : (focus.kind === 'map' || focus.kind === 'news') ? 7.5 : clamp(len, 2.4, 6.5);
    look = tgt.clone().setY(0); stand = look.clone().addScaledVector(d, dist); eye = Math.max(1.6, tgt.y);
  }
  vrTeleport(stand.x, stand.z, faceYaw(look.x - stand.x, look.z - stand.z), eye);
}
const _flyTo2D = flyTo;
flyTo = function (pos, tgt, dur, done) {
  if (!renderer.xr.isPresenting) return _flyTo2D(pos, tgt, dur, done);
  vrStandFor(pos, tgt); if (done) setTimeout(done, 150);
};
// agent circles face the real head position in VR (the head is inside the moving rig)
const _animAv2D = animateAvatar, _wq = new THREE.Quaternion();
animateAvatar = function (A, level, t) { _animAv2D(A, level, t); if (renderer.xr.isPresenting) A.face.quaternion.copy(camera.getWorldQuaternion(_wq)); };
const _openPano2D = openPano;
openPano = function (id) { return renderer.xr.isPresenting ? vrPano(Math.max(0, CONFIG.PANORAMAS.findIndex(p => p.id === id))) : _openPano2D(id); };

/* ---------- 360° photos inside the headset ---------- */
const panoLoader = new THREE.TextureLoader();
function vrPano(i) {
  const N = CONFIG.PANORAMAS.length; VR.panoIdx = ((i % N) + N) % N; const P0 = CONFIG.PANORAMAS[VR.panoIdx];
  vrCardClose();
  if (!VR.pano) {
    VR.hidden = scene.children.filter(o => o !== VR.dolly && o.visible); VR.hidden.forEach(o => o.visible = false);
    const g = new THREE.SphereGeometry(40, 64, 40); g.scale(-1, 1, 1);
    VR.pano = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x223344, toneMapped: false })); VR.dolly.add(VR.pano);
  }
  VR.pano.position.set(camera.position.x, 1.6, camera.position.z);
  panoLoader.load(P0.file, t => {
    if (!VR.pano || CONFIG.PANORAMAS[VR.panoIdx] !== P0) { t.dispose(); return; }
    t.colorSpace = THREE.SRGBColorSpace; const old = VR.pano.material.map; VR.pano.material.map = t; VR.pano.material.color.set(0xffffff); VR.pano.material.needsUpdate = true; old?.dispose();
  });
  VR.menuKey = '';
}
function vrPanoClose() {
  if (!VR.pano) return;
  VR.pano.material.map?.dispose(); VR.pano.geometry.dispose(); VR.dolly.remove(VR.pano); VR.pano = null;
  VR.hidden.forEach(o => o.visible = true); VR.hidden = []; VR.menuKey = '';
}

/* ---------- controllers ---------- */
function vrRay(c) { ray.camera = renderer.xr.getCamera(); _vm.identity().extractRotation(c.matrixWorld); ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(_vm); ray.far = 80; }
const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
function vrHit(c) {
  vrRay(c);
  const pm = VR.panels.filter(P => shown(P.mesh) && P !== VR.sub).map(P => P.mesh);
  const hp = ray.intersectObjects(pm, false)[0];
  if (hp) return { kind: 'panel', P: hp.object.userData.panel, uv: hp.uv, point: hp.point, dist: hp.distance, org: ray.ray.origin.clone() };
  if (VR.pano) return null;
  const ho = ray.intersectObjects(pickables, false).find(h => shown(h.object));
  const fp = ray.ray.intersectPlane(FLOOR, new THREE.Vector3()), fd = fp ? ray.ray.origin.distanceTo(fp) : Infinity;
  const org = ray.ray.origin.clone();
  if (ho && ho.distance < fd) return { kind: 'obj', o: ho.object, point: ho.point, dist: ho.distance, org };
  if (fp && inHall(fp)) return { kind: 'floor', point: fp, dist: fd, org };
  return null;
}
function vrSelect(c) {
  const h = c.userData.hit; if (!h) return;
  if (h.kind === 'panel') { const b = h.P.hit(h.uv); if (b?.run) { b.run(); haptic(c, .6, 30); VR.menuKey = ''; h.P === VR.card && cardSpec && VR.card.redraw(); } return; }
  if (h.kind === 'floor') { vrTeleport(h.point.x, h.point.z); return; }
  const u = h.o.userData; haptic(c, .5, 25);
  if (u.agent !== undefined) vrAgentCard(u.agent);
  else if (u.site) { focusSite(u.site); vrSiteCard(u.site); }
  else if (u.globe) vrGlobeCard(u.globe);
  else if (u.pano) vrPano(Math.max(0, CONFIG.PANORAMAS.findIndex(p => p.id === u.pano)));
  else if (u.seat !== undefined) { const S = SEATS[u.seat]; vrTeleport(S.pos.x, S.pos.z, faceYaw(S.center.x - S.pos.x, S.center.z - S.pos.z)); }
  else if (u.mapPin) { focusMap(); vrSiteCard(u.mapPin); }
  else if (u.mapBoard) focusMap();
  else if (u.news) { focusNews(); vrNewsCard(); }
  else if (u.screen !== undefined || u.live) vrNote(u.screen !== undefined ? CONFIG.SCREENS[u.screen].title : 'Live camera', 'YouTube videos can’t play inside a VR scene. Watch them in the browser version of the hub; a later VR update will play the films here as video files.');
  else if (u.wb) vrNote('Whiteboard', 'Drawing on the whiteboards works in the browser version for now. In VR you can still see what others draw.');
  else if (u.ai) vrNote('Ask the Hub', 'Voice questions to the AI work best in the browser version. In VR, point at Emma, Suzan or Sofia for a guided tour or a demonstration.');
}
function haptic(c, v, ms) { try { c.userData.gp?.hapticActuators?.[0]?.pulse(v, ms); } catch { } }

function vrSetup() {
  const b = $('#btnVR'); b.style.display = '';
  const css = document.createElement('style');
  css.textContent = '#vrBig{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:70;display:none;align-items:center;gap:14px;padding:22px 34px;border-radius:24px;border:0;background:#fff;color:#0c2a4c;font:700 24px Inter,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.35);cursor:pointer}#vrBig.show{display:flex}#vrBig small{display:block;font-weight:500;font-size:14px;color:#4a5f75}';
  document.head.appendChild(css);
  const big = document.createElement('button'); big.id = 'vrBig';
  big.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="7" width="19" height="11" rx="3"/><path d="M8.5 13.5a1.5 1.5 0 1 0 0-.01M15.5 13.5a1.5 1.5 0 1 0 0-.01"/></svg><span>Enter VR<small>Put on the headset and use the controllers</small></span>';
  document.body.appendChild(big);
  navigator.xr?.isSessionSupported('immersive-vr').then(v => {
    VR.ok = v; b.classList.toggle('ready', v);
    if (v) { const e = $('#btnEnter'); if (e) e.textContent = 'Enter in VR'; }
  }).catch(() => { });
  const go = async () => {
    if (!VR.ok) { toast('This is the VR edition. Open it in the Meta Quest Browser and press Enter VR.', 4200); return; }
    if (renderer.xr.isPresenting) { renderer.xr.getSession()?.end(); return; }
    try { const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] }); renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(s); }
    catch (e) { toast('Couldn’t start VR: ' + e.message); big.classList.add('show'); }
  };
  b.addEventListener('click', go); big.addEventListener('click', go);
  // entering the hub from the start screen goes straight into the headset (same click = permission to start VR)
  $('#btnEnter')?.addEventListener('click', () => setTimeout(() => { if (entered && VR.ok) go(); }, 0));
  $('#btnEnterQuiet')?.addEventListener('click', () => setTimeout(() => { if (entered && VR.ok) big.classList.add('show'); }, 0));

  // controllers, models and laser rays
  const factory = new XRControllerModelFactory();
  for (let i = 0; i < 2; i++) {
    const c = renderer.xr.getController(i), grip = renderer.xr.getControllerGrip(i);
    try { grip.add(factory.createControllerModel(grip)); } catch (e) { }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: .85 }));
    c.add(line); c.userData.line = line;
    const dot = new THREE.Mesh(new THREE.RingGeometry(.018, .03, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, depthTest: false, toneMapped: false }));
    dot.renderOrder = 30; dot.visible = false; scene.add(dot); c.userData.dot = dot;
    c.addEventListener('connected', e => { c.userData.hand = e.data.handedness; c.userData.gp = e.data.gamepad; grip.userData.hand = e.data.handedness; if (e.data.handedness === 'left' && VR.menu) grip.add(VR.menu.mesh); });
    c.addEventListener('disconnected', () => { c.userData.gp = null; });
    c.addEventListener('selectstart', () => vrSelect(c));
    VR.dolly.add(c, grip); VR.ctrls.push({ c, grip });
  }
  // the hand menu rides on the left controller, tilted towards the eyes
  VR.menu = makePanel(.24, .36, menuRender, 2200); VR.menu.mesh.position.set(0, .07, -.03); VR.menu.mesh.rotation.x = -1.05; VR.menu.mesh.scale.setScalar(1);
  VR.sub = makePanel(.62, .17, subRender, 1400); VR.sub.mesh.position.set(0, -.3, -1.05); VR.sub.mesh.visible = false;
  VR.fade = new THREE.Mesh(new THREE.SphereGeometry(.25, 16, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, side: THREE.BackSide, depthTest: false, toneMapped: false })); VR.fade.renderOrder = 99;

  renderer.xr.addEventListener('sessionstart', vrStart);
  renderer.xr.addEventListener('sessionend', vrEnd);
}
function vrStart() {
  VR.on = true; $('#vrBig')?.classList.remove('show');
  VR.camPrev = { p: camera.position.clone(), q: camera.quaternion.clone() };
  scene.add(VR.dolly); VR.dolly.add(camera); camera.add(VR.sub.mesh, VR.fade);
  camera.position.set(0, 0, 0); camera.quaternion.identity();
  controls.enabled = false; IDLE.on = false;
  if (typeof reflector !== 'undefined' && reflector) reflector.visible = false;      // a mirror floor costs too much in a headset
  try { renderer.xr.setFoveation(1); } catch { }
  SCREENS.forEach(S => S.mesh.material = S.vr);
  closeAllPanels(); closeAgentMenu(); focus.kind = 'home'; focus.id = null;
  VR.dolly.position.set(0, 2.6, 23); VR.dolly.rotation.set(0, 0, 0);
  VR.menuKey = ''; VR.menu.mesh.visible = true;
  setTimeout(() => vrNote('Welcome to the VR hub', 'Point with either controller and pull the trigger to select a table, a sensor globe, an agent or a 360° photo, or to teleport across the floor. Walk with the left stick. Push the right stick left or right to turn, forward or back to rise or sink. Your menu is on your left hand; press X to hide it.'), 900);
}
function vrEnd() {
  VR.on = false; vrPanoClose(); vrCardClose();
  scene.add(camera); if (VR.camPrev) { camera.position.copy(VR.camPrev.p); camera.quaternion.copy(VR.camPrev.q); }
  scene.remove(VR.dolly); controls.enabled = true;
  if (typeof reflector !== 'undefined' && reflector) reflector.visible = true;
  SCREENS.forEach(S => S.mesh.material = S.punch);
  VR.ctrls.forEach(({ c }) => c.userData.dot.visible = false);
  goHome();
}

/* ---------- every frame in the headset ---------- */
function vrUpdate(dt, t) {
  if (!renderer.xr.isPresenting) return;
  if (VR.fade && VR.fade.material.opacity > 0) VR.fade.material.opacity = Math.max(0, VR.fade.material.opacity - dt * 5);
  if (VR.placeCard && VR.card?.mesh.visible) { if (--VR.placeCard <= 0) { VR.placeCard = 0; placeCardNow(); } }
  // menu redraw when something it shows has changed
  const mk = menuKey(); if (mk !== VR.menuKey) { VR.menuKey = mk; VR.menu.redraw(); }
  VR.menu.mesh.visible = VR.menuOn && !!VR.menu.mesh.parent;
  // subtitles while an agent speaks
  const sk = AGX.speech ? AGX.speech.A.name + $('#agCapText').textContent : '';
  if (sk !== VR.subKey) { VR.subKey = sk; VR.sub.mesh.visible = !!sk; if (sk) VR.sub.redraw(); }
  // pointers, hover and buttons
  const hovers = new Map();
  VR.ctrls.forEach(({ c }, i) => {
    const gp = c.userData.gp; if (!gp) { c.userData.line.visible = false; c.userData.dot.visible = false; return; }
    const h = vrHit(c); c.userData.hit = h;
    c.userData.line.visible = true; c.userData.line.scale.z = h ? h.dist : 6;
    const dot = c.userData.dot; dot.visible = !!h;
    if (h) { dot.position.copy(h.point); dot.lookAt(h.org); dot.scale.setScalar(h.kind === 'floor' ? 3 : 1 + h.dist * .05); dot.material.color.set(h.kind === 'floor' ? 0x9fd4ff : 0xffffff); }
    if (h?.kind === 'panel') { const b = h.P.hit(h.uv); if (b) hovers.set(h.P, b.id); }
    // thumbsticks: left walks, right snap-turns
    const ax = gp.axes || [], sx = ax[2] || 0, sy = ax[3] || 0, hand = c.userData.hand;
    if (hand === 'left' && Math.hypot(sx, sy) > .15) {
      camera.getWorldDirection(_hd); _hd.y = 0; _hd.normalize(); _vq.crossVectors(_hd, _Y).normalize();
      const sp = 2.4 * dt; VR.dolly.position.addScaledVector(_hd, -sy * sp).addScaledVector(_vq, sx * sp);
      camera.getWorldPosition(_hp); if (!inHall(_hp)) { VR.dolly.position.addScaledVector(_hd, sy * sp).addScaledVector(_vq, -sx * sp); }
    }
    if (hand === 'right') {
      if (Math.abs(sy) > .2 && Math.abs(sy) > Math.abs(sx)) VR.dolly.position.y = clamp(VR.dolly.position.y - sy * 1.8 * dt, 0, MAX_LIFT);   // rise or sink
      if (Math.abs(sx) > .65 && Math.abs(sx) > Math.abs(sy) && VR.snapReady[i]) {
        VR.snapReady[i] = false; camera.getWorldPosition(_hp); const a = -Math.sign(sx) * Math.PI / 6;
        const y0 = VR.dolly.position.y; VR.dolly.position.sub(_hp).applyAxisAngle(_Y, a).add(_hp); VR.dolly.rotation.y += a; VR.dolly.position.y = y0;
      } else if (Math.abs(sx) < .3) VR.snapReady[i] = true;
    }
    // X / Y on the left controller show or hide the menu
    const pressed = !!(gp.buttons[4]?.pressed || gp.buttons[5]?.pressed);
    if (hand === 'left' && pressed && !VR.btnPrev[i].x) { VR.menuOn = !VR.menuOn; haptic(c, .4, 20); }
    VR.btnPrev[i].x = pressed;
  });
  VR.panels.forEach(P => { const id = hovers.get(P) || null; if (P.hover !== id) { P.hover = id; P.redraw(); if (id) VR.ctrls.forEach(({ c }) => c.userData.hit?.P === P && haptic(c, .15, 10)); } });
  if (VR.pano) VR.pano.position.set(camera.position.x, camera.position.y || 1.6, camera.position.z);
}
window.__vr = { VR, vrPano, vrPanoClose, vrSiteCard, vrAgentCard, vrNewsCard, vrHit, vrSelect, vrTeleport, menuRender };   // for automated tests
