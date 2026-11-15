# DIWA Spatial Hub — Draft v0.2

An immersive 3D hall in the browser presenting the DIWA sites as interactive miniature landscapes. It runs from a single `index.html` with no build step, so it can be hosted directly on GitHub Pages.

## What's inside

| Area | What it does |
|---|---|
| **Hall** | A wooden, glass-walled hall with a reflective floor, a forest and a lake outside. It has 9 tables: Tana, Pallas, Sodankylä, Oulankajoki, Kemijoki, Vantaanjoki, Kokkola, Archipelago Sea and Organic Space Planning. |
| **Navigation** | Click a table, a floating label or a dock icon to fly there. Drag to look, scroll to zoom and use WASD to walk. Keys 1–9 jump to tables, H returns to the overview, P plays the timeline and holding Space talks to the orb. |
| **Oulankajoki table** | The fully interactive supersite: |
| | • 5 sensor-station globes (4 towers and the snow block) with metadata from `oulanka-metadata-template_1.xlsx` |
| | • Weather and Hydrology tabs with charts, a timeline and playback |
| | • River network, catchment boundary and land-cover layers |
| | • A "Spring snowmelt flood" story in four guided steps |
| | • 360° photo points |
| **Oulankajoki layout** | The river course, lakes, the stream from the north-west lake, the road past the station and the station buildings follow the real layout around Oulanka Research Station. They were traced by hand from a map as a reference only; no map imagery is included. Heights are still illustrative until the NLS DSM is added. |
| **Seasons** | A Winter / Spring / Summer / Autumn switch changes the terrain, water, ice, trees, snowfall, sun height and the landscape outside. |
| **Live camera** | A YouTube live stream on a screen in the hall. Clicking the screen opens the player with sound. |
| **Scenarios** | A Scenarios tab on the Oulankajoki table:<br>• **Flooding:** a typical spring flood, a 1-in-50-year flood and a 1-in-250-year flood. Water rises on the table, with peak discharge, water-level rise, the share of low ground flooded, and hydrographs.<br>• **River ice:** a cold winter, a mild winter and an ice jam at breakup. Ice thickness is estimated with Stefan's law, including snow insulation. There is an ice sheet on the river, ice floes at breakup, a jam with upstream flooding, a live river cross-section and a season player. |
| **AI companion orb** | A sci-fi orb that floats beside you and follows the camera. It shows four states: idle, listening (reacting to your voice), thinking and speaking. Answers appear as subtitles next to the orb, and spoken replies are on by default. **Hold Space** or tap the orb to talk, or type in the assistant bar. It needs the proxy below before it can answer. |
| **Lo-fi music** | Original lo-fi music generated live in the browser (Web Audio), so there are no files or licences. It has seasonal moods and an optional forest ambience, and it quietens automatically while the orb listens or speaks and when the live player is open. It starts with the "Enter the hub" button and is controlled from the ♪ button. |
| **Design** | One shared set of styles for the 2D interface and the 3D objects: rounded corners (10/14/20/26 px), frosted glass and spring animations. The live screen, table name plates and 360° pins use the same rounded glass style as the labels. |
| **VR** | An *Enter VR* button appears on headsets such as the Meta Quest Browser. Point at a table and pull the trigger to teleport. |

> **Illustrative content.** The terrain, station positions, catchment geometry and all time series are placeholders. They are marked "Example data" or "illustrative" in the interface. The sensor *metadata* (sensors, variables, heights, treatments, flagged periods) is real and comes from the DIWA template.

## Publish on GitHub Pages

1. Create a repository, for example `diwa-spatial-hub`, and upload `index.html` (and `README.md`).
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`.
3. After a minute the hub is live at `https://<your-user>.github.io/diwa-spatial-hub/`.

Open it through that address (or a local server such as `python -m http.server`), not by double-clicking the file. Browsers block the 360° photos and the YouTube embed on `file://` pages.

## 360° photos

The `panoramas/` folder already contains 15 Oulanka 360° photos (`oulanka-01.jpg` to `oulanka-15.jpg`) and their small previews in `panoramas/thumbs/`. **Upload the whole folder, with the same structure, next to `index.html`.**

- **Pins:** each photo is a 360° pin on the Oulankajoki table. Hovering over a pin shows its title, and clicking it opens the viewer. In the viewer, use the thumbnail strip, the ‹ › buttons or the ← → keys to move between views.
- **Titles and positions:** both are set in `CONFIG.PANORAMAS` at the top of the script. `river: [u, offset]` places a pin along the main river, where `u` runs from 0 (west) to 1 (east). `at: [x, z]` places it anywhere on the table, from −1 to 1. `yaw` sets the starting view direction in degrees.
- **Adding more:** export as equirectangular (2:1) JPG and add an entry to `CONFIG.PANORAMAS`. A thumbnail in `thumbs/` with the same file name is optional but makes the strip load faster.
- **Outside the windows:** `CONFIG.OUTSIDE_PANORAMA` (currently `oulanka-08.jpg`, the calm river bend) is the real landscape seen through the glass. It changes tone with the seasons, for example looking snowy in winter. Set it to `''` to go back to the procedural sky.
- **Before publishing:** a few photos show people in the distance (for example 12, 13 and 14). Check that this is fine before making the repository public.

## Connect the AI assistant (about 10 minutes)

A public web page can't keep an API key secret, so the hub talks to a small Cloudflare Worker that holds the key.

1. Get an API key at **console.anthropic.com**.
2. In the **Cloudflare dashboard**, go to **Workers & Pages → Create → Create Worker**. Name it, for example, `diwa-hub-ai`, then click **Deploy**.
3. Click **Edit code**, replace everything with the contents of `worker.js`, and click **Deploy**.
4. Go to **Settings → Variables and Secrets** and add:
   - `ANTHROPIC_API_KEY`, set as a **Secret**, containing your key.
   - `ALLOWED_ORIGINS`: `https://<your-user>.github.io`
   - `MODEL` (optional). The default is `claude-haiku-5-5`.
5. Copy the worker URL (`https://diwa-hub-ai.<account>.workers.dev`) into `index.html`:
   ```js
   AI_PROXY_URL: 'https://diwa-hub-ai.<account>.workers.dev',
   ```

The assistant is general-purpose for now. To make it DIWA-aware later, extend the `SYSTEM` text in `worker.js` with site descriptions and metadata. The page doesn't need to change.

**Voice:** the mic uses the browser's built-in speech recognition. It works best in Chrome and Edge, works partly in Safari, and is limited in the Quest Browser, where text chat still works. Answers are read aloud with the browser's own voices.

## Configuration (top of the script in `index.html`)

```js
const CONFIG = {
  AI_PROXY_URL: '',                 // Cloudflare Worker URL
  AI_MODEL_LABEL: 'Claude Haiku',   // shown in the assistant header
  YOUTUBE_VIDEO_ID: 'K6LHjnnxH48',  // the live stream; it must allow embedding
  LIVE_TITLE: 'Live camera',
  PANORAMAS: [ ... ],               // 360° views (see above)
};
```

Site names and descriptions are in `SITES`, and the sensor stations are in `GLOBES`.

## Performance

The hub lowers its own quality on slower laptops: first resolution, then floor reflections. To force full quality during a demo, add `?hq` to the URL. Adding `?autoenter` skips the Enter screen, but the music then starts muted. Chrome or Edge on a laptop with a recent GPU gives the smoothest result.

## Next steps

- Add real coordinates for towers and plots to the metadata template. The globes then move to their true positions.
- Replace the example series with CSV exports from InfluxDB and river gauge data.
- Replace the procedural terrain with elevation data (NLS Finland) and the catchment, river and land-cover layers with SYKE GIS data.
- Add a DIWA knowledge prompt to the assistant, then a premium voice so the orb pulses exactly with the audio.
- Swap the illustrative flood levels for SYKE flood-hazard maps or model results, and the estimated ice for SYKE ice observations.
- Show the interface inside VR as 3D panels, for full in-headset use on Quest 3.

Built with [three.js](https://threejs.org) r170 (loaded from the jsDelivr CDN).
