# UCH Explore

**UCH Explore** is an interactive, browser-based 3D explorer of **University College Hospital (UCH), Ibadan, Oyo State, Nigeria**.

🌐 **Live Deployment:** [https://spiffy-bunny-098931.netlify.app](https://spiffy-bunny-098931.netlify.app)  
🗺️ **Map Review Workspace:** [https://spiffy-bunny-098931.netlify.app/review.html](https://spiffy-bunny-098931.netlify.app/review.html)

The goal of this project is an evidence-based, recognizable reconstruction of UCH’s main grounds (Oritamefa/Agodi axis) to help patients, students, staff, and visitors understand the campus geography, navigate to clinical departments, and locate key destinations.

> **Important Notice:**  
> **Independent project. Not an official UCH map. Locations and access information are under verification.**

---

## 🏛️ Inspiration & Reference Acknowledgement

This project draws functional inspiration from [Cyberpunk738/fuoye-explore](https://github.com/Cyberpunk738/fuoye-explore), a 3D campus explorer for the Federal University Oye-Ekiti. Because the reference project does not carry an open-source license, **UCH Explore was implemented independently from first principles** using custom TypeScript, Three.js, and Leaflet architectures.

---

## 📍 Coverage & Real Location Data

The project centers on the primary UCH healthcare grounds at **Latitude 7.40250° N, Longitude 3.90300° E** on Queen Elizabeth II Road, Oritamefa, Ibadan, Nigeria.

### Sourced Geometry
- **Boundary:** OpenStreetMap Way `82467201` (40+ hectares).
- **Footprints:** **496 real building polygons** extracted and projected from OpenStreetMap data.
- **Road Network:** **62 hospital roadways**, service avenues (including the dedicated *Radiation Oncology* avenue), and pedestrian walkways.
- **Distinction from Surrounding Sites:** Explicitly distinguished from the University of Ibadan main campus (which is located ~5.5 km north in Samonda/Bodija), Agodi Gardens to the north, and Orita Mefa Baptist Church to the south.

### Curated Destinations
1. **UCH Main Gate (Queen Elizabeth II Road):** Landmark gateway complex with twin portal lanes, security gatehouse, overhead directional signboard, pedestrian wickets, and boom barriers. (*Verified*)
2. **Accident & Emergency (A&E) Department:** 24-hour casualty ambulance drop-off ramp on the southern frontage of the central clinical block. (*Verified*)
3. **Main Hospital Complex (Central Ward Block):** The iconic 6-story modernist inpatient hospital commissioned in November 1957 by Queen Elizabeth II, featuring horizontal concrete sunshade louvers (brise-soleil). (*Verified*)
4. **East Clinical Ward Wing:** Multi-tier inpatient surgical and medical specialty ward block. (*High Confidence*)
5. **West Clinical Ward Wing:** Obstetric, gynaecological, and paediatric inpatient ward block. (*High Confidence*)
6. **Chief Tony Anenih Geriatric Centre (CTAGC):** Pioneer purpose-built geriatric medical center in West Africa, with specialized ramp access for seniors. (*Verified*)
7. **Otunba Tunwase Children's Emergency Ward (OTCHEW):** Endowed paediatric emergency unit in the Department of Paediatrics. (*Verified*)
8. **Department of Radiation Oncology:** Nigeria’s premier cancer radiotherapy facility accessed via the Radiation Oncology service road. (*Verified*)
9. **Department of Nuclear Medicine (Afe Babalola Building):** Radionuclide therapy and specialized diagnostic imaging facility. (*Verified*)
10. **Central & Outpatient Pharmacy:** Ground-floor clinical pharmacy on the central outpatient concourse. (*High Confidence*)
11. **Department of Physiotherapy & Rehabilitation:** Rehabilitation suites in the Faculty of Clinical Sciences sector. (*High Confidence*)
12. **Paul Hendrickse Lecture Theatre:** Historical central academic auditorium named after Prof. Paul Hendrickse. (*Verified*)
13. **College of Medicine, University of Ibadan (Administration):** Administrative headquarters of CoMUI on UCH grounds. (*Verified*)
14. **Alexander Brown Hall (ABH):** Official residential hall for clinical medical and health sciences students. (*Verified*)
15. **UCH Central Mosque:** Community place of worship on the northeastern quadrant (OSM Way `451326675`). (*Verified*)
16. **School of Nursing & Midwifery:** Major health training facility near the East Gate. (*Approximate / Footprint unassigned*)
17. **UCH East Gate:** Secondary public entrance off School of Nursing Road. (*Verified*)

---

## 🛠️ Technology Stack

- **Core 3D Engine:** [Three.js](https://threejs.org/) (WebGL rendering, instanced foliage, custom extrusion, soft shadows).
- **Language:** TypeScript 5.8 (strict type safety).
- **Build System:** [Vite 6](https://vitejs.dev/) (multi-page bundling for 3D explorer and review workspaces).
- **Map Review Workspace:** [Leaflet 1.9](https://leafletjs.com/) with OpenStreetMap cartography.
- **Data Pipeline:** Python 3 (pure Python ray-casting, boundary polygon clipping, coordinate transformation).
- **Testing:** Node.js native test runner (`node --experimental-strip-types --test`).

---

## ✨ Key Features

1. **Interactive 3D Explorer (`/index.html`):**
   - Fullscreen 3D scene with orbit, smooth pan, zoom, and pitch rotation.
   - Live searchable destination directory with real-time category filtering.
   - Clickable 3D building meshes opening a detailed slide-out drawer with building metadata, provenance URLs, and verified access instructions.
   - Smooth camera tweening to any destination or landmark.
   - One-click shortcuts for **Full View** (campus overview) and **Main Gate**.
   - **Day & Night Mode:** Toggle between equatorial morning sunlight and atmospheric night with warm hospital streetlamps and window emission glows.
   - **Confidence Legend:** Visual indicators distinguishing verified observations from estimates.

2. **Outdoor First-Person Walking Mode:**
   - Walk the grounds at eye level (1.7m camera elevation).
   - Keyboard controls: `W/A/S/D` or Arrow keys, `Shift` to sprint.
   - Mouse look: Drag cursor to look in any direction.
   - Touch controls: On-screen virtual joystick and drag-to-look for mobile devices.
   - **Collision Detection:** Bounded movement preventing avatars from walking through building walls, with automatic wall-sliding.
   - Start at verified public ground (Main Gate plaza).
   - Seamlessly exit back into Orbit mode centered right where you were walking.
   - Respects `prefers-reduced-motion` accessibility preferences.

4. **Turn-by-Turn Wayfinding & Route Planner:**
   - **Topological A* Routing:** Realistic pedestrian shortest paths computed across real UCH roads and footpaths.
   - **3D Animated Route Tubes:** Glowing path line with pulsating destination beacon.
   - **Metrics & Direction Steps:** Displays calculated walking distance in meters, estimated walking minutes (80m/min pace), and step-by-step navigation cues.
   - **One-Click Route from Drawer:** Select any building or place to immediately plot directions from the Main Gate or another entrance.
   - **Deep-linking & URL Sharing:** Shareable direct URLs (`#place=uch-a-and-e`, `#route=uch-gate-main->uch-radiology`) with instant clipboard copy.

5. **Walking Mini-Map Radar HUD:**
   - Real-time 2D radar overlay during First-Person Walking mode.
   - Displays player position, orientation heading cone, active route trajectory, and color-coded destination markers.

6. **Authentic Campus Landmarks & Architectural Polish:**
   - **UCH Elevated Water Tower:** Prominent historical utility landmark near the clinical core.
   - **Covered Pedestrian Breezeways:** Canopy walkways connecting ward blocks and outpatient concourses.
   - **Queen Elizabeth II Arrival Roundabout:** Circular driveway landmark at the primary hospital approach.
   - **3D Floating Landmark Badges:** World-space HTML billboard labels with one-click camera focus, togglable via HUD.

7. **Atmosphere, Lighting & Procedural Soundscape:**
   - **3-Way Time of Day:** Seamless switching between Crisp Equatorial Day, Golden Sunset Twilight, and Atmospheric Night.
   - **Procedural Tropical Soundscape:** Web Audio API synthesizer generating gentle tropical birdsong and distant city ambiance—zero external audio files or bandwidth cost.

8. **Map-Review Workspace with Satellite Aerials (`/review.html`):**
   - 2D Leaflet interactive review map with instant toggle between **OpenStreetMap** and **Esri World Imagery High-Resolution Satellite**.
   - Inspect individual building footprints and their OpenStreetMap Way IDs.
   - Propose facility names and department associations.
   - Record evidence URLs, observation dates, confidence ratings, and rationale.
   - **Live Evidence Image Previewer:** Live preview for submitted photographic evidence URLs directly in the review panel.
   - **Interactive Door Pinning:** Click directly on the building footprint on the map to record entrance coordinates.
   - Local draft persistence in `localStorage`.
   - **Export / Import JSON:** Backup and restore draft proposals in versioned JSON format (`uch-review-proposals-v1.json`) with strict schema validation.
   - Contributor proposals remain distinct drafts and are never silently published as verified data.

9. **Mobile Optimization & Performance:**
   - **Instanced Geometry:** Over 200 royal palms, shade trees, and streetlamps render in just 4 GPU draw calls via `THREE.InstancedMesh`.
   - **Shared Materials:** Shared textures and material instances across all 496 footprints.
   - **Clamped Pixel Ratio:** Limited to a maximum of 1.75 (or 1.0 in Eco mode) to conserve battery on high-DPI phone displays.
   - **Idle Throttling:** Reduces rendering frequency during periods of user inactivity, and pauses completely when the browser tab is hidden (`visibilitychange`).
   - **Low Quality (Eco) Mode:** One-click toggle disabling shadow maps and lowering resolution.
   - **Self-Contained Data:** All GeoJSON and place metadata are bundled locally in `public/data/`—no external API calls during runtime navigation.

---

## 📊 Measured Performance Budgets

*Measured in Google Chrome on Windows 11 (Desktop & Mobile Simulation):*

| Metric | Target Budget | Measured Reality |
|---|---|---|
| Total Draw Calls | < 50 | **22 - 32 calls** |
| Triangle Count | < 60,000 | **~28,500 triangles** |
| JavaScript Bundle Size | < 250 kB gzipped | **~147 kB gzipped** (main app + Three.js + A* router) |
| Review Bundle Size | < 80 kB gzipped | **~48 kB gzipped** (Leaflet + satellite layers) |
| Navigation Network Calls | 0 external | **0 calls** (all data bundled statically) |

---

## 🧪 Automated Verification Suite

Run the automated test suite (13 comprehensive tests):

```bash
npm test
```

The test suite covers:
- **`tests/coordinates.test.ts`:** Origin alignment, round-trip identity, scale factors, and physical distance verification.
- **`tests/data.test.ts`:** GeoJSON polygon validity, stable `uch-bld-<osm_id>` identifiers, place-to-building relationships, and ODbL attribution.
- **`tests/collision.test.ts`:** Spatial collision detection, perimeter proximity buffers, and multi-collider checks.
- **`tests/routing.test.ts`:** Topological graph construction, A* path planning across roads and paths, distance and time calculations, and adjacent-point fallbacks.
- **`tests/review.test.ts`:** Schema validation for proposal backups and rejection of malformed payloads.

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v20+ recommended; developed on v22.15.0)
- Python 3 (for offline data preparation if updating OSM source queries)

### Setup
```bash
# Clone the repository
git clone https://github.com/OAKVISUALZ/uch-explore.git
cd uch-explore

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit:
- **3D Explorer:** `http://127.0.0.1:5173/`
- **Map Review Workspace:** `http://127.0.0.1:5173/review.html`

### Production Build
```bash
npm run build
npm run preview
```

The compiled assets are generated in `dist/`.

---

## ☁️ Netlify Deployment Guide

The project is pre-configured for Netlify deployment via `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/review"
  to = "/review.html"
  status = 200
```

### Steps to Deploy to Netlify
1. Connect your GitHub repository (`OAKVISUALZ/uch-explore`) in the Netlify Dashboard.
2. Verify build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Click **Deploy Site**. Netlify will build the TypeScript files and deploy the explorer to a global CDN.

---

## 📜 Data Attribution & Licensing

- **Cartography & Geometry:** Data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, licensed under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
- **Institutional Context:** Official directories of University College Hospital, Ibadan ([uch-ibadan.org.ng](https://uch-ibadan.org.ng/)) and College of Medicine, University of Ibadan ([com.ui.edu.ng](https://com.ui.edu.ng/)).
- **Code License:** MIT License. Free for academic, community, and non-commercial research use.
