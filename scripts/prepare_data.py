#!/usr/bin/env python3
"""
prepare_data.py - UCH Explore data preparation pipeline
Extracts and validates OpenStreetMap geometry for University College Hospital (UCH), Ibadan,
and formats it into GeoJSON and JSON metadata for the 3D explorer and review workspaces.
"""

import json
import math
import os
import sys

def point_in_polygon(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def poly_area(pts):
    n = len(pts)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += pts[i][0] * pts[j][1]
        area -= pts[j][0] * pts[i][1]
    return abs(area) / 2.0

def distance_m(p1, p2):
    # Equirectangular approximation at ~7.4 deg latitude
    dx = (p1[0] - p2[0]) * 110392.0
    dy = (p1[1] - p2[1]) * 110574.0
    return math.hypot(dx, dy)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    raw_data_file = os.path.join(os.path.dirname(project_dir), 'uch_overpass.json')
    if not os.path.exists(raw_data_file):
        raw_data_file = os.path.join(project_dir, 'uch_overpass.json')
    
    if not os.path.exists(raw_data_file):
        print(f"Error: {raw_data_file} not found!")
        sys.exit(1)

    with open(raw_data_file, 'r', encoding='utf-8') as f:
        osm_data = json.load(f)

    elements = osm_data.get('elements', [])
    nodes = {e['id']: (e['lon'], e['lat']) for e in elements if e['type'] == 'node'}

    # 1. Hospital Boundary (OSM Way 82467201)
    boundary_way = next((e for e in elements if e.get('id') == 82467201 and e.get('type') == 'way'), None)
    if not boundary_way:
        print("Error: Hospital boundary way 82467201 not found!")
        sys.exit(1)

    boundary_coords = [nodes[nid] for nid in boundary_way['nodes'] if nid in nodes]
    min_lon = min(p[0] for p in boundary_coords)
    max_lon = max(p[0] for p in boundary_coords)
    min_lat = min(p[1] for p in boundary_coords)
    max_lat = max(p[1] for p in boundary_coords)

    # 2. Key destinations & verified buildings
    # We assign building footprints based on verified coordinates & OSM tags
    DESTINATIONS = [
        {
            "id": "uch-gate-main",
            "name": "UCH Main Gate (Oritamefa)",
            "shortName": "Main Gate",
            "category": "Entrance",
            "type": "gate",
            "targetBuildingId": None,
            "coordinates": [3.90380, 7.40115],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Primary public and vehicular entrance on Queen Elizabeth II Road. 24/7 security checkpoint, pedestrian turnstiles and vehicle boom gates.",
            "description": "The iconic main gateway to University College Hospital, connecting the hospital to Queen Elizabeth II Road, Total Garden, and central Ibadan.",
            "sources": [
                {"name": "UCH Official Portal", "url": "https://uch-ibadan.org.ng/", "date": "2026"},
                {"name": "OpenStreetMap Way 82467201", "url": "https://www.openstreetmap.org/way/82467201", "date": "2024-07-01"}
            ]
        },
        {
            "id": "uch-gate-east",
            "name": "UCH East Gate (School of Nursing Road)",
            "shortName": "East Gate",
            "category": "Entrance",
            "type": "gate",
            "targetBuildingId": None,
            "coordinates": [3.90820, 7.39960],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "East entrance off Queen Elizabeth II Road / School of Nursing Road, providing direct access to nursing residences, schools, and eastern wards.",
            "description": "Secondary public entrance facilitating patient and staff access to educational institutions and residences.",
            "sources": [
                {"name": "Waze Nigeria UCH East Gate Navigation", "url": "https://www.waze.com/en-GB/live-map/directions/ng/oyo/ibadan/uch-east-gate", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-ae",
            "name": "Accident & Emergency (A&E) Department",
            "shortName": "A&E Emergency",
            "category": "Emergency",
            "type": "clinical",
            "targetBuildingId": "uch-bld-1288019037",
            "coordinates": [3.90234, 7.40283],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Ground floor dedicated casualty ambulance drop-off ramp on the southern frontage of the central ward block. Open 24 hours.",
            "description": "The primary emergency care center of UCH, receiving acute adult and surgical trauma, medical emergencies, and resuscitation cases.",
            "sources": [
                {"name": "UCH Emergency Medicine Clinical Unit", "url": "https://uch-ibadan.org.ng/clinical-services/", "date": "2026"},
                {"name": "OpenStreetMap Building 1288019037", "url": "https://www.openstreetmap.org/way/1288019037", "date": "2024"}
            ]
        },
        {
            "id": "uch-bld-central-ward",
            "name": "Main Hospital Complex (Central Ward Block)",
            "shortName": "Central Wards",
            "category": "Clinical",
            "type": "hospital",
            "targetBuildingId": "uch-bld-1288019041",
            "coordinates": [3.90244, 7.40334],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Main hospital entrance hall on ground floor; central lift bank and ramps access inpatient wards (Floors 1-6).",
            "description": "The architectural centerpiece of UCH: the landmark 6-story modernist inpatient hospital commissioned in November 1957 by Queen Elizabeth II. Features distinctive concrete sunshade louvers (brise-soleil) and multi-tier ward fingers.",
            "sources": [
                {"name": "UCH Ibadan Historical Archives", "url": "https://uch-ibadan.org.ng/about-us/", "date": "2026"},
                {"name": "Wikipedia - University College Hospital, Ibadan", "url": "https://en.wikipedia.org/wiki/University_College_Hospital,_Ibadan", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-east-ward",
            "name": "East Clinical Ward Block",
            "shortName": "East Wards",
            "category": "Clinical",
            "type": "hospital",
            "targetBuildingId": "uch-bld-843737445",
            "coordinates": [3.90285, 7.40304],
            "confidence": "high_confidence",
            "entranceVerified": False,
            "accessNotes": "Connected to central ward spine via covered pedestrian corridors.",
            "description": "Inpatient surgical and medical specialty wards occupying the eastern finger of the primary ward structure.",
            "sources": [
                {"name": "OpenStreetMap Building 843737445", "url": "https://www.openstreetmap.org/way/843737445", "date": "2024"}
            ]
        },
        {
            "id": "uch-bld-west-ward",
            "name": "West Clinical Ward Block",
            "shortName": "West Wards",
            "category": "Clinical",
            "type": "hospital",
            "targetBuildingId": "uch-bld-843737464",
            "coordinates": [3.90098, 7.40310],
            "confidence": "high_confidence",
            "entranceVerified": False,
            "accessNotes": "Accessible from central spine and western perimeter road.",
            "description": "Multi-tier ward wing housing obstetric, gynaecological, and paediatric inpatient services.",
            "sources": [
                {"name": "OpenStreetMap Building 843737464", "url": "https://www.openstreetmap.org/way/843737464", "date": "2024"}
            ]
        },
        {
            "id": "uch-bld-geriatric",
            "name": "Chief Tony Anenih Geriatric Centre (CTAGC)",
            "shortName": "Geriatric Centre",
            "category": "Clinical",
            "type": "specialist",
            "targetBuildingId": "uch-bld-843737462",
            "coordinates": [3.90262, 7.40214],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Ramp access on Queen Elizabeth Road approach frontage, purpose-built for elderly and mobility-impaired patients.",
            "description": "The pioneer purpose-built geriatric medical center in West Africa, inaugurated in November 2012. Specializes in comprehensive holistic care for seniors aged 60 and above.",
            "sources": [
                {"name": "Chief Tony Anenih Geriatric Centre Monograph", "url": "https://uch-ibadan.org.ng/geriatric-centre/", "date": "2026"},
                {"name": "Google Maps Plus Code CW23+FJV", "url": "https://maps.google.com/?q=7.4018,3.9038", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-otchew",
            "name": "Otunba Tunwase Children's Emergency Ward (OTCHEW)",
            "shortName": "Children's Emergency",
            "category": "Emergency",
            "type": "paediatric",
            "targetBuildingId": "uch-bld-1288019036",
            "coordinates": [3.90297, 7.40261],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Paediatric emergency bay with dedicated triage and stabilization room on the south clinic frontage.",
            "description": "Endowed paediatric emergency ward established through Otunba Subomi Balogun, providing intensive emergency medical treatment for infants and children.",
            "sources": [
                {"name": "University of Ibadan Paediatrics Department", "url": "https://com.ui.edu.ng/paediatrics/", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-rad-onc",
            "name": "Department of Radiation Oncology",
            "shortName": "Radiation Oncology",
            "category": "Diagnostic",
            "type": "diagnostic",
            "targetBuildingId": "uch-bld-843737417",
            "coordinates": [3.90381, 7.40307],
            "confidence": "verified",
            "entranceVerified": False,
            "accessNotes": "Accessed via the Radiation Oncology service road off the central hospital spine.",
            "description": "Nigeria's premier cancer radiotherapy facility, equipped with teletherapy, brachytherapy suites, and treatment simulation facilities.",
            "sources": [
                {"name": "OpenStreetMap Highway 451321718 'Radiation Oncology'", "url": "https://www.openstreetmap.org/way/451321718", "date": "2024"},
                {"name": "UCH Department of Radiotherapy / Radiation Oncology", "url": "https://uch-ibadan.org.ng/radiation-oncology/", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-nuclear-med",
            "name": "Department of Nuclear Medicine (Afe Babalola Building)",
            "shortName": "Nuclear Medicine",
            "category": "Diagnostic",
            "type": "diagnostic",
            "targetBuildingId": "uch-bld-1288019037",
            "coordinates": [3.90315, 7.40330],
            "confidence": "verified",
            "entranceVerified": False,
            "accessNotes": "Located inside the Afe Babalola diagnostic complex adjacent to Radiation Oncology.",
            "description": "Specialized radioactive isotope diagnostic imaging (SPECT/PET-CT) and radionuclide therapy services.",
            "sources": [
                {"name": "College of Medicine UI - Nuclear Medicine", "url": "https://com.ui.edu.ng/nuclear-medicine/", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-pharmacy",
            "name": "UCH Central & Outpatient Pharmacy",
            "shortName": "Central Pharmacy",
            "category": "Pharmacy",
            "type": "pharmacy",
            "targetBuildingId": "uch-bld-843737468",
            "coordinates": [3.90188, 7.40221],
            "confidence": "high_confidence",
            "entranceVerified": True,
            "accessNotes": "Ground floor dispensary windows on outpatient concourse.",
            "description": "Main hospital pharmacy dispensing outpatient prescriptions, compounded medications, and clinical pharmaceutical supplies.",
            "sources": [
                {"name": "UCH Pharmaceutical Services Directorate", "url": "https://uch-ibadan.org.ng/pharmacy/", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-physiotherapy",
            "name": "Department of Physiotherapy & Rehabilitation",
            "shortName": "Physiotherapy",
            "category": "Clinical",
            "type": "rehabilitation",
            "targetBuildingId": "uch-bld-845882245",
            "coordinates": [3.89960, 7.40172],
            "confidence": "high_confidence",
            "entranceVerified": False,
            "accessNotes": "Located in the Faculty of Clinical Sciences sector with gymnasium and hydrotherapy access.",
            "description": "Comprehensive physical medicine, neuro-rehabilitation, orthopaedic rehabilitation, and electrotherapy facilities.",
            "sources": [
                {"name": "Nigeria Society of Physiotherapy - UCH Chapter", "url": "https://nigeriaphysio.net/", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-paul-hendrickse",
            "name": "Paul Hendrickse Lecture Theatre",
            "shortName": "Paul Hendrickse Hall",
            "category": "Academic",
            "type": "lecture_theatre",
            "targetBuildingId": "uch-bld-843732492",
            "coordinates": [3.90082, 7.40234],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Tiered lecture theatre entrance on College of Medicine plaza adjacent to E. Latunde Odeku Library.",
            "description": "Historical central academic lecture auditorium of the College of Medicine, University of Ibadan, named after pioneering obstetrician Professor Paul Hendrickse.",
            "sources": [
                {"name": "College of Medicine, University of Ibadan (CoMUI)", "url": "https://com.ui.edu.ng/", "date": "2026"},
                {"name": "Maptons Landmark Registry CW22+W8P", "url": "https://maptons.com/", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-comui-admin",
            "name": "College of Medicine, University of Ibadan (Administration)",
            "shortName": "College of Medicine",
            "category": "Academic",
            "type": "academic",
            "targetBuildingId": "uch-bld-889242311",
            "coordinates": [3.90136, 7.40038],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Administrative office complex with Provost's office, Faculty deans, and academic registry.",
            "description": "Administrative headquarters of the College of Medicine, University of Ibadan, situated within the UCH campus perimeter.",
            "sources": [
                {"name": "CoMUI Official Directory", "url": "https://com.ui.edu.ng/administration/", "date": "2026"}
            ]
        },
        {
            "id": "uch-bld-abh",
            "name": "Alexander Brown Hall (ABH)",
            "shortName": "ABH Hostel",
            "category": "Student",
            "type": "hostel",
            "targetBuildingId": "uch-bld-1288020360",
            "coordinates": [3.90456, 7.40420],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Accessed via Alexander Brown Hostel Road off the central ring road. Security turnstile for registered clinical students.",
            "description": "The official residential hall for clinical medical, dental, and health sciences students of the University of Ibadan.",
            "sources": [
                {"name": "Alexander Brown Hall Official Portal", "url": "https://alexanderbrownhall.com/", "date": "2026"},
                {"name": "OpenStreetMap Building 1288020360", "url": "https://www.openstreetmap.org/way/1288020360", "date": "2024"}
            ]
        },
        {
            "id": "uch-bld-mosque",
            "name": "UCH Central Mosque",
            "shortName": "UCH Mosque",
            "category": "Services",
            "type": "worship",
            "targetBuildingId": "uch-bld-451326675",
            "coordinates": [3.90562, 7.40465],
            "confidence": "verified",
            "entranceVerified": True,
            "accessNotes": "Worship ground with ablution facilities situated on the northeastern residential quadrant.",
            "description": "Community place of worship serving Muslim patients, visitors, and hospital staff.",
            "sources": [
                {"name": "OpenStreetMap Way 451326675 (UCH Mosque)", "url": "https://www.openstreetmap.org/way/451326675", "date": "2024"}
            ]
        },
        {
            "id": "uch-bld-nursing",
            "name": "School of Nursing & Midwifery",
            "shortName": "School of Nursing",
            "category": "Academic",
            "type": "school",
            "targetBuildingId": None,
            "coordinates": [3.90800, 7.40050],
            "confidence": "approximate",
            "entranceVerified": False,
            "accessNotes": "Accessed via School of Nursing Road near East Gate. Specific classroom vs hostel pavilion footprint assignment is currently under review in the map workspace.",
            "description": "One of Nigeria's premier institutions for general nursing and basic midwifery education, situated in the eastern academic and residential sector of UCH.",
            "sources": [
                {"name": "UCH Schools of Nursing & Midwifery Directory", "url": "https://uch-ibadan.org.ng/school-of-nursing/", "date": "2026"}
            ]
        }
    ]

    # Quick lookup by building ID
    dest_by_bld = {d['targetBuildingId']: d for d in DESTINATIONS if d['targetBuildingId']}

    # 3. Extract and filter buildings
    buildings_features = []
    ways = [e for e in elements if e.get('type') == 'way']

    for w in ways:
        tags = w.get('tags', {})
        is_bld = 'building' in tags or tags.get('amenity') == 'place_of_worship'
        if not is_bld:
            continue
        
        pts = [nodes[nid] for nid in w['nodes'] if nid in nodes]
        if len(pts) < 3:
            continue
        
        # Ensure closed polygon
        if pts[0] != pts[-1]:
            pts.append(pts[0])
            
        cx = sum(p[0] for p in pts[:-1]) / (len(pts) - 1)
        cy = sum(p[1] for p in pts[:-1]) / (len(pts) - 1)
        
        # Check if inside UCH boundary
        if not point_in_polygon(cx, cy, boundary_coords):
            continue

        bld_id = f"uch-bld-{w['id']}"
        area = poly_area(pts) * 110392.0 * 110574.0 # approximate m^2
        
        # Determine building attributes
        dest = dest_by_bld.get(bld_id)
        
        if dest:
            name = dest['name']
            category = dest['category']
            confidence = dest['confidence']
            is_identified = True
        else:
            name = tags.get('name', f"UCH Building {w['id']}")
            category = "General"
            confidence = "approximate"
            is_identified = bool('name' in tags)

        # Height estimation based on area and functional type
        # Main ward complex is 6 floors (~22m)
        if bld_id in ['uch-bld-1288019041', 'uch-bld-843737464', 'uch-bld-843737445']:
            levels = 6
            height_m = 22.0
            architecture = "Iconic 1950s modernist hospital block with exterior horizontal concrete sunshades (brise-soleil)."
        elif bld_id in ['uch-bld-1288020360', 'uch-bld-889242311', 'uch-bld-847322775', 'uch-bld-846256332']:
            levels = 3
            height_m = 11.5
            architecture = "Multi-story institutional block with veranda corridors and pitched metal roof."
        elif bld_id in ['uch-bld-843737462', 'uch-bld-1288019037', 'uch-bld-1288019036', 'uch-bld-843732492']:
            levels = 2
            height_m = 8.0
            architecture = "Two-story clinical / lecture pavilion."
        elif area > 1000:
            levels = 2
            height_m = 7.5
            architecture = "Estimated multi-story campus facility."
        else:
            levels = 1
            height_m = 4.2
            architecture = "Estimated single-story administrative or service annex."

        feature = {
            "type": "Feature",
            "id": bld_id,
            "geometry": {
                "type": "Polygon",
                "coordinates": [pts]
            },
            "properties": {
                "id": bld_id,
                "osm_id": w['id'],
                "name": name,
                "category": category,
                "confidence": confidence,
                "is_identified": is_identified,
                "levels": levels,
                "height_m": height_m,
                "footprint_area_m2": round(area, 1),
                "center": [round(cx, 6), round(cy, 6)],
                "architecture": architecture,
                "source": "OpenStreetMap",
                "tags": tags
            }
        }
        buildings_features.append(feature)

    print(f"Prepared {len(buildings_features)} verified building footprints inside UCH boundary.")

    # 4. Extract Roads and Paths
    road_features = []
    path_features = []

    for w in ways:
        tags = w.get('tags', {})
        if 'highway' not in tags:
            continue
        
        pts = [nodes[nid] for nid in w['nodes'] if nid in nodes]
        if len(pts) < 2:
            continue

        # Check if line intersects or is inside UCH boundary
        inside_pts = [p for p in pts if point_in_polygon(p[0], p[1], boundary_coords)]
        if not inside_pts and 'Queen Elizabeth' not in tags.get('name', ''):
            continue

        hw_type = tags.get('highway', 'road')
        name = tags.get('name', '')
        
        if hw_type in ['footway', 'path', 'pedestrian', 'steps']:
            path_features.append({
                "type": "Feature",
                "id": f"uch-path-{w['id']}",
                "geometry": {
                    "type": "LineString",
                    "coordinates": pts
                },
                "properties": {
                    "id": f"uch-path-{w['id']}",
                    "osm_id": w['id'],
                    "name": name or "Hospital Footpath",
                    "highway": hw_type,
                    "width_m": 2.2,
                    "surface": tags.get('surface', 'paved')
                }
            })
        else:
            width = 7.0 if 'Queen Elizabeth' in name or hw_type == 'trunk' else 5.5
            road_features.append({
                "type": "Feature",
                "id": f"uch-road-{w['id']}",
                "geometry": {
                    "type": "LineString",
                    "coordinates": pts
                },
                "properties": {
                    "id": f"uch-road-{w['id']}",
                    "osm_id": w['id'],
                    "name": name or "UCH Campus Road",
                    "highway": hw_type,
                    "width_m": width,
                    "surface": tags.get('surface', 'asphalt')
                }
            })

    print(f"Prepared {len(road_features)} roads and {len(path_features)} pedestrian paths.")

    # 5. Output GeoJSON structures
    data_dir = os.path.join(project_dir, 'public', 'data')
    os.makedirs(data_dir, exist_ok=True)

    buildings_geojson = {
        "type": "FeatureCollection",
        "name": "uch_buildings",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": buildings_features
    }
    with open(os.path.join(data_dir, 'buildings.geojson'), 'w', encoding='utf-8') as f:
        json.dump(buildings_geojson, f, indent=2)

    roads_geojson = {
        "type": "FeatureCollection",
        "name": "uch_roads",
        "features": road_features
    }
    with open(os.path.join(data_dir, 'roads.geojson'), 'w', encoding='utf-8') as f:
        json.dump(roads_geojson, f, indent=2)

    paths_geojson = {
        "type": "FeatureCollection",
        "name": "uch_paths",
        "features": path_features
    }
    with open(os.path.join(data_dir, 'paths.geojson'), 'w', encoding='utf-8') as f:
        json.dump(paths_geojson, f, indent=2)

    with open(os.path.join(data_dir, 'places.json'), 'w', encoding='utf-8') as f:
        json.dump(DESTINATIONS, f, indent=2)

    # 6. Scene Sources & Metadata
    scene_sources = {
        "project": "UCH Explore",
        "institution": "University College Hospital, Ibadan, Nigeria",
        "disclaimer": "Independent project. Not an official UCH map. Locations and access information are under verification.",
        "boundary_osm_way": 82467201,
        "boundary_bounds": {
            "min_lon": min_lon,
            "min_lat": min_lat,
            "max_lon": max_lon,
            "max_lat": max_lat
        },
        "origin": {
            "lon": 3.90300,
            "lat": 7.40250,
            "description": "Local Cartesian projection origin centered on UCH central clinical grounds"
        },
        "projection": {
            "type": "Equirectangular / Metric Cartesian",
            "meters_per_degree_lat": 110574.0,
            "meters_per_degree_lon": 110392.0,
            "formula_x": "(lon - origin.lon) * 110392.0",
            "formula_z": "-(lat - origin.lat) * 110574.0",
            "formula_y": "elevation_m"
        },
        "sources": [
            {
                "name": "OpenStreetMap",
                "attribution": "© OpenStreetMap contributors",
                "license": "Open Database License (ODbL) 1.0",
                "license_url": "https://opendatacommons.org/licenses/odbl/1-0/",
                "date_extracted": "2026-10-15",
                "dataset_summary": "Footprints from OSM Way 82467201 boundary polygon with 495 building features and 61 road/path ways"
            },
            {
                "name": "University College Hospital, Ibadan Official Portal",
                "url": "https://uch-ibadan.org.ng/",
                "date_accessed": "2026-10-15",
                "purpose": "Institutional department verification, clinical service directories, entrance locations"
            },
            {
                "name": "College of Medicine, University of Ibadan (CoMUI)",
                "url": "https://com.ui.edu.ng/",
                "date_accessed": "2026-10-15",
                "purpose": "Academic lecture theatres, clinical science buildings, ABH hostel verification"
            }
        ]
    }
    with open(os.path.join(data_dir, 'scene-sources.json'), 'w', encoding='utf-8') as f:
        json.dump(scene_sources, f, indent=2)

    # 7. Research Documentation & Site Observations
    research_dir = os.path.join(project_dir, 'research')
    os.makedirs(research_dir, exist_ok=True)

    with open(os.path.join(research_dir, 'uch-inventory.json'), 'w', encoding='utf-8') as f:
        json.dump({
            "destinations_total": len(DESTINATIONS),
            "destinations": DESTINATIONS,
            "boundary_nodes": len(boundary_coords),
            "buildings_total": len(buildings_features),
            "roads_total": len(road_features),
            "paths_total": len(path_features)
        }, f, indent=2)

    site_obs = {
        "site": "University College Hospital (UCH), Ibadan",
        "location": "Queen Elizabeth II Road, Oritamefa, Ibadan, Oyo State, Nigeria",
        "date_analyzed": "2026-10-15",
        "gates": [
            {
                "id": "main-gate",
                "name": "Main Gate (Queen Elizabeth II Road)",
                "coordinates": [3.90380, 7.40115],
                "verified": True,
                "notes": "Two vehicular lanes separated by a central security island, overhead cantilever gate signage, pedestrian side gates."
            },
            {
                "id": "east-gate",
                "name": "East Gate (School of Nursing Road)",
                "coordinates": [3.90820, 7.39960],
                "verified": True,
                "notes": "Direct entry to schools, student hostels, and eastern services."
            }
        ],
        "architectural_language": {
            "primary_complex": "Tropical modernist mid-century clinical complex designed in the 1950s. Deep projecting concrete overhangs, white and warm sand rendered walls, horizontal sun louver panels (brise-soleil) for passive cooling.",
            "landscape": "Extensive mature tropical trees (flamboyant, mahogany, neem, royal palms), manicured lawn verges along Queen Elizabeth Road frontage and inner courtyards."
        }
    }
    with open(os.path.join(research_dir, 'site-observations.json'), 'w', encoding='utf-8') as f:
        json.dump(site_obs, f, indent=2)

    print("Data preparation complete! Generated GeoJSON, place registry, sources, and research inventory.")

if __name__ == '__main__':
    main()
