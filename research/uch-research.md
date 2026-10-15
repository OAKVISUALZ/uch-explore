# UCH Ibadan Geospatial & Architecture Research

**Project:** UCH Explore  
**Date of Research:** 15 October 2026  
**Subject:** University College Hospital (UCH), Ibadan, Oyo State, Nigeria  
**Site Coordinates:** Latitude 7.4025° N, Longitude 3.9030° E  
**Cartographic Reference:** OpenStreetMap Way `82467201`  

---

## 1. Executive Summary & Site Definition

University College Hospital (UCH), Ibadan, founded in 1952 and officially opened by Queen Elizabeth II in November 1957, is Nigeria’s first teaching hospital. It functions both as a tertiary referral healthcare facility and the clinical training campus for the College of Medicine, University of Ibadan (CoMUI).

### Distinction from Other Campuses
- **UCH Main Grounds (Oritamefa / Agodi):** The primary 40+ hectare health campus bounded by Queen Elizabeth II Road to the south/east, Yemetu to the west, and Agodi residential/reserve areas to the north.
- **University of Ibadan Main Campus (Samonda / Bodija):** Located approximately 5.5 kilometers north. While the pre-clinical faculties (Basic Medical Sciences) have administrative ties to UI, clinical teaching and hospital residences (such as Alexander Brown Hall) are located directly inside UCH at Oritamefa.
- **Surrounding Institutions:** Agodi Gardens lies north; Orita Mefa Baptist Church sits across Queen Elizabeth Road to the southwest; Total Garden roundabout is the key eastern traffic nexus.

---

## 2. Perimeter, Entrances & Ground Observations

### Site Boundary (OSM Way 82467201)
- **Bounding Box:**
  - Minimum Longitude: `3.897237° E`
  - Maximum Longitude: `3.909983° E`
  - Minimum Latitude: `7.399146° N`
  - Maximum Latitude: `7.406424° N`
- Contains **495 distinct building footprints** and **62 roads/service avenues**.

### Verified Entrances
1. **UCH Main Gate (Queen Elizabeth II Road):**
   - Coordinates: `3.90380° E, 7.40115° N`
   - **Confidence:** Verified
   - **Configuration:** Twin vehicular ingress/egress lanes separated by a central concrete gatehouse island, overhead directional steel truss signage, pedestrian side gates, 24-hour security control.
2. **UCH East Gate (School of Nursing Road):**
   - Coordinates: `3.90820° E, 7.39960° N`
   - **Confidence:** Verified
   - **Configuration:** Access gate off Queen Elizabeth II Road towards School of Nursing, hostel blocks, and eastern service facilities.

---

## 3. Departmental Directory & Building Associations

| Destination ID | Name | Category | Associated Footprint | Verification Status | Source Reference |
|---|---|---|---|---|---|
| `uch-gate-main` | UCH Main Gate | Entrance | None (Outdoor plaza) | Verified | UCH Portal / Satellite |
| `uch-gate-east` | UCH East Gate | Entrance | None (Outdoor road) | Verified | Waze / OSM |
| `uch-bld-ae` | Accident & Emergency (A&E) | Emergency | `uch-bld-1288019037` | Verified | UCH Clinical Services / Satellite |
| `uch-bld-central-ward` | Main Hospital Complex (Central Block) | Clinical | `uch-bld-1288019041` | Verified | UCH History / OSM 1288019041 |
| `uch-bld-east-ward` | East Clinical Ward Wing | Clinical | `uch-bld-843737445` | High Confidence | OSM 843737445 |
| `uch-bld-west-ward` | West Clinical Ward Wing | Clinical | `uch-bld-843737464` | High Confidence | OSM 843737464 |
| `uch-bld-geriatric` | Chief Tony Anenih Geriatric Centre | Clinical | `uch-bld-843737462` | Verified | Plus Code CW23+FJV / Monograph |
| `uch-bld-otchew` | Otunba Tunwase Children's Emergency Ward | Emergency | `uch-bld-1288019036` | Verified | UI Paediatrics / Endowment Records |
| `uch-bld-rad-onc` | Department of Radiation Oncology | Diagnostic | `uch-bld-843737417` | Verified | OSM Way 451321718 / UCH |
| `uch-bld-nuclear-med` | Nuclear Medicine (Afe Babalola Bldg) | Diagnostic | `uch-bld-1288019037` | Verified | CoMUI Nuclear Medicine |
| `uch-bld-pharmacy` | Central & Outpatient Pharmacy | Pharmacy | `uch-bld-843737468` | High Confidence | UCH Pharmaceutical Directorate |
| `uch-bld-physiotherapy` | Department of Physiotherapy | Clinical | `uch-bld-845882245` | High Confidence | NSP / Clinical Sciences |
| `uch-bld-paul-hendrickse`| Paul Hendrickse Lecture Theatre | Academic | `uch-bld-843732492` | Verified | CW22+W8P / CoMUI Records |
| `uch-bld-comui-admin` | College of Medicine Administration | Academic | `uch-bld-889242311` | Verified | CoMUI Registry |
| `uch-bld-abh` | Alexander Brown Hall (ABH) | Student | `uch-bld-1288020360` | Verified | ABH Official / CW33+QW |
| `uch-bld-mosque` | UCH Central Mosque | Services | `uch-bld-451326675` | Verified | OSM Way 451326675 |
| `uch-bld-nursing` | School of Nursing & Midwifery | Academic | `uch-bld-847322775` | Verified | UCH Nursing Directory |

---

## 4. Architectural & Landscape Form

### The 1950s Ward Complex
- Multi-tier ward fingers extending north-south from a central clinical spine.
- 6 stories (~22m height).
- Passive solar control: Deep exterior horizontal brise-soleil sunshades, ribbon fenestration, light sand/cream masonry finish.
- Cantilevered access walkways and breezeways connecting ward fingers.

### Pavilion & Secondary Facilities
- 1 to 3 story masonry structures with veranda circulations, pitched roofs, and landscaped perimeter parking.
- Chief Tony Anenih Geriatric Centre: Specialized ground-level accessible entrance with ramps and shaded canopy.

### Landscape
- Mature equatorial foliage: Royal palms (*Roystonea regia*), Delonix regia (flamboyant tree), Neem trees (*Azadirachta indica*), manicured lawn verges along Queen Elizabeth Road.

---

## 5. Provenance, Licensing & Gap Analysis

1. **Geometry Source:** OpenStreetMap contributors. Open Database License (ODbL) 1.0.
2. **Attribution:** "Data © OpenStreetMap contributors, ODbL 1.0".
3. **Height Data:** Building heights are estimated based on floor counts and verified photographic evidence (e.g. 6 floors for central ward block, 3 floors for student halls, 1-2 floors for pavilions). No LIDAR or surveyed elevation models are claimed.
4. **Unresolved Footprints:** 478 buildings within the hospital boundary have neutral identifiers (`uch-bld-<osm_id>`) until ground contributors add confirmed departmental tags via the `/review.html` workspace.
5. **No Synthetic Fiction:** No artificial buildings, false roads, or unverified wheelchair routes have been introduced into the primary scene.
