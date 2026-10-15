/**
 * review.ts - Leaflet-based Map Review Workspace
 * 
 * Allows researchers and contributors to inspect building footprints,
 * propose department associations, record verifiable evidence URLs,
 * place entrance pins, save drafts locally, and export/import versioned JSON backups.
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GeoJSONFeatureCollection,
  BuildingProperties,
  GeoJSONPolygonGeometry,
  ReviewProposal,
  ReviewDatasetBackup,
  ConfidenceLevel,
} from './types';

const STORAGE_KEY = 'uch_review_proposals_v1';

class MapReviewApp {
  private map!: L.Map;
  private geojsonLayer!: L.GeoJSON;
  private features: GeoJSONFeatureCollection<BuildingProperties, GeoJSONPolygonGeometry> | null = null;
  private proposals: Record<string, ReviewProposal> = {};
  private selectedFeature: GeoJSON.Feature<GeoJSONPolygonGeometry, BuildingProperties> | null = null;
  private currentFilter: 'all' | 'identified' | 'unidentified' | 'proposed' = 'all';

  private entranceMarker: L.Marker | null = null;
  private isPickingEntrance = false;

  constructor() {
    this.loadProposalsFromStorage();
    this.initMap();
    this.loadGeoJSON();
    this.bindGlobalEvents();
  }

  private loadProposalsFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.proposals = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse local proposals storage:', e);
      this.proposals = {};
    }
  }

  private saveProposalsToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.proposals));
      this.updateCounts();
      this.refreshLayerStyles();
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private initMap(): void {
    // Center at UCH Ibadan [lat, lon]
    this.map = L.map('map-view', {
      center: [7.4025, 3.9030],
      zoom: 16,
      minZoom: 14,
      maxZoom: 19,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Map click for entrance pinning
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.isPickingEntrance || !this.selectedFeature) return;

      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lon = parseFloat(e.latlng.lng.toFixed(6));

      this.setProposedEntrancePin([lon, lat]);
      this.isPickingEntrance = false;

      const btn = document.getElementById('btn-pick-entrance');
      if (btn) {
        btn.textContent = '📍 Change Entrance Pin';
        btn.classList.remove('active');
      }

      const input = document.getElementById('prop-entrance') as HTMLInputElement | null;
      if (input) input.value = `${lon}, ${lat}`;

      this.showToast(`Entrance location pinned at [${lon}, ${lat}]`);
    });
  }

  private async loadGeoJSON(): Promise<void> {
    try {
      const res = await fetch('./data/buildings.geojson');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      this.features = await res.json();

      this.renderGeoJsonLayer();
      this.updateCounts();
    } catch (err) {
      console.error('Failed to load buildings.geojson:', err);
      this.showToast('Failed to load footprint data. Please reload.');
    }
  }

  private renderGeoJsonLayer(): void {
    if (!this.features) return;
    if (this.geojsonLayer) this.map.removeLayer(this.geojsonLayer);

    this.geojsonLayer = L.geoJSON(this.features as any, {
      style: (feature: any) => this.getFeatureStyle(feature),
      filter: (feature: any) => this.filterFeature(feature),
      onEachFeature: (feature: any, layer: L.Layer) => {
        layer.on({
          click: () => this.selectFeature(feature),
          mouseover: (e: L.LeafletMouseEvent) => {
            const target = e.target;
            target.setStyle({ weight: 3, fillOpacity: 0.65 });
          },
          mouseout: (e: L.LeafletMouseEvent) => {
            if (this.selectedFeature?.properties?.id !== feature.properties.id) {
              this.geojsonLayer.resetStyle(e.target);
            }
          },
        });
      },
    }).addTo(this.map);
  }

  private getFeatureStyle(feature: any): L.PathOptions {
    const bldId = feature.properties.id;
    const isSelected = this.selectedFeature?.properties?.id === bldId;
    const hasProposal = Boolean(this.proposals[bldId]);
    const isIdentified = feature.properties.is_identified;

    if (isSelected) {
      return {
        color: '#d9b343',
        weight: 3.5,
        fillColor: '#f7e39e',
        fillOpacity: 0.75,
      };
    }

    if (hasProposal) {
      return {
        color: '#cfa84a',
        weight: 2.5,
        fillColor: '#fff2ce',
        fillOpacity: 0.6,
      };
    }

    if (isIdentified) {
      return {
        color: '#1b6338',
        weight: 1.5,
        fillColor: '#9ac4a7',
        fillOpacity: 0.45,
      };
    }

    return {
      color: '#7c8894',
      weight: 1.0,
      fillColor: '#c5cdd4',
      fillOpacity: 0.35,
    };
  }

  private filterFeature(feature: any): boolean {
    const bldId = feature.properties.id;
    const hasProposal = Boolean(this.proposals[bldId]);
    const isIdentified = feature.properties.is_identified;

    if (this.currentFilter === 'identified') return isIdentified;
    if (this.currentFilter === 'unidentified') return !isIdentified;
    if (this.currentFilter === 'proposed') return hasProposal;
    return true;
  }

  private refreshLayerStyles(): void {
    if (this.geojsonLayer) {
      this.geojsonLayer.setStyle((feature: any) => this.getFeatureStyle(feature));
    }
  }

  private selectFeature(feature: any): void {
    this.selectedFeature = feature;
    this.refreshLayerStyles();

    const props: BuildingProperties = feature.properties;
    const proposal = this.proposals[props.id];

    // Clear previous entrance marker
    if (this.entranceMarker) {
      this.map.removeLayer(this.entranceMarker);
      this.entranceMarker = null;
    }

    if (proposal && proposal.proposedEntrance) {
      this.setProposedEntrancePin(proposal.proposedEntrance);
    }

    const panelTitle = document.getElementById('panel-title');
    const panelSubtitle = document.getElementById('panel-subtitle');
    const panelBody = document.getElementById('panel-body');

    if (panelTitle) panelTitle.textContent = props.name;
    if (panelSubtitle) panelSubtitle.textContent = `ID: ${props.id} | OSM Way: ${props.osm_id}`;

    if (panelBody) {
      panelBody.innerHTML = `
        <div class="form-group">
          <label>Identified Status</label>
          <div style="font-size: 0.82rem; font-weight: 600; color: ${props.is_identified ? 'var(--uch-green)' : '#8c6827'};">
            ${props.is_identified ? '✓ Verified in UCH Inventory' : '⚠️ Unverified Footprint (Neutral identifier)'}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Area</label>
            <div style="font-size: 0.85rem; font-weight: 600;">~${props.footprint_area_m2} m²</div>
          </div>
          <div class="form-group">
            <label>Estimated Height</label>
            <div style="font-size: 0.85rem; font-weight: 600;">${props.levels} Floor${props.levels > 1 ? 's' : ''} (~${props.height_m}m)</div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--warm-border); margin: 12px 0;" />

        <h3 style="font-size: 0.88rem; font-weight: 700; color: var(--uch-green); margin-bottom: 10px;">
          Propose Facility / Department Data
        </h3>

        <div class="form-group">
          <label for="prop-name">Proposed Facility Name *</label>
          <input type="text" id="prop-name" class="form-control" placeholder="e.g. Outpatient Dialysis Centre" value="${proposal ? proposal.proposedName : ''}" />
        </div>

        <div class="form-group">
          <label for="prop-dept">Department / Division *</label>
          <input type="text" id="prop-dept" class="form-control" placeholder="e.g. Nephrology / Internal Medicine" value="${proposal ? proposal.department : ''}" />
        </div>

        <div class="form-group">
          <label for="prop-evidence-url">Evidence Source URL *</label>
          <input type="url" id="prop-evidence-url" class="form-control" placeholder="https://uch-ibadan.org.ng/..." value="${proposal ? proposal.evidenceUrl : ''}" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="prop-capture-date">Observation Date</label>
            <input type="date" id="prop-capture-date" class="form-control" value="${proposal ? proposal.captureDate : new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label for="prop-confidence">Confidence</label>
            <select id="prop-confidence" class="form-control">
              <option value="verified" ${proposal?.confidence === 'verified' ? 'selected' : ''}>Verified (Documented)</option>
              <option value="high_confidence" ${proposal?.confidence === 'high_confidence' ? 'selected' : ''}>High Confidence</option>
              <option value="approximate" ${proposal?.confidence === 'approximate' ? 'selected' : ''}>Approximate</option>
              <option value="unverified_gap" ${proposal?.confidence === 'unverified_gap' ? 'selected' : ''}>Unverified Gap</option>
            </select>
          </div>
        </div>

        <div class="entrance-picker-box">
          <p><strong>Proposed Entrance Marker:</strong> Click button below, then click door position on map.</p>
          <div style="display: flex; gap: 8px;">
            <button id="btn-pick-entrance" class="btn btn-secondary btn-sm" style="color: var(--uch-green); border-color: var(--uch-gold);">
              📍 ${proposal?.proposedEntrance ? 'Change Entrance Pin' : 'Set Entrance Pin'}
            </button>
            <input type="text" id="prop-entrance" class="form-control" readonly placeholder="No pin set" value="${proposal?.proposedEntrance ? proposal.proposedEntrance.join(', ') : ''}" style="font-size: 0.75rem;" />
          </div>
        </div>

        <div class="form-group">
          <label for="prop-notes">Justification Notes & Limitations</label>
          <textarea id="prop-notes" class="form-control" placeholder="State how this building was identified and any visual limits...">${proposal ? proposal.notes : ''}</textarea>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button id="btn-save-proposal" class="btn btn-primary btn-full">
            💾 Save Local Draft
          </button>
          ${proposal ? `<button id="btn-delete-proposal" class="btn btn-secondary" style="background: #eedddd; color: #9c2727; border: 1px solid #dcaaaa;" title="Delete this draft">🗑️</button>` : ''}
        </div>

        <div class="notice-box">
          Proposals remain in your browser storage and are included when you click <strong>Export JSON</strong>. They are never published without verification.
        </div>
      `;

      this.bindPanelEvents(props);
    }
  }

  private bindPanelEvents(props: BuildingProperties): void {
    const btnPick = document.getElementById('btn-pick-entrance');
    if (btnPick) {
      btnPick.addEventListener('click', () => {
        this.isPickingEntrance = true;
        btnPick.textContent = '👆 Click Door On Map...';
        btnPick.classList.add('active');
        this.showToast('Click the building entrance location on the map.');
      });
    }

    const btnSave = document.getElementById('btn-save-proposal');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const nameInput = document.getElementById('prop-name') as HTMLInputElement | null;
        const deptInput = document.getElementById('prop-dept') as HTMLInputElement | null;
        const urlInput = document.getElementById('prop-evidence-url') as HTMLInputElement | null;
        const dateInput = document.getElementById('prop-capture-date') as HTMLInputElement | null;
        const confInput = document.getElementById('prop-confidence') as HTMLSelectElement | null;
        const notesInput = document.getElementById('prop-notes') as HTMLTextAreaElement | null;
        const entInput = document.getElementById('prop-entrance') as HTMLInputElement | null;

        const proposedName = nameInput?.value.trim() || '';
        const department = deptInput?.value.trim() || '';
        const evidenceUrl = urlInput?.value.trim() || '';

        if (!proposedName || !department) {
          alert('Please provide a proposed facility name and department.');
          return;
        }

        let proposedEntrance: [number, number] | undefined;
        if (entInput && entInput.value) {
          const parts = entInput.value.split(',').map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            proposedEntrance = [parts[0], parts[1]];
          }
        }

        const proposal: ReviewProposal = {
          footprintId: props.id,
          osmId: props.osm_id,
          proposedName,
          department,
          evidenceUrl,
          captureDate: dateInput?.value || new Date().toISOString().split('T')[0],
          confidence: (confInput?.value as ConfidenceLevel) || 'approximate',
          notes: notesInput?.value.trim() || '',
          proposedEntrance,
          updatedAt: new Date().toISOString(),
        };

        this.proposals[props.id] = proposal;
        this.saveProposalsToStorage();
        this.showToast(`Saved proposal for ${proposedName}`);
        this.selectFeature(this.selectedFeature);
      });
    }

    const btnDelete = document.getElementById('btn-delete-proposal');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (confirm(`Remove draft proposal for ${props.id}?`)) {
          delete this.proposals[props.id];
          this.saveProposalsToStorage();
          this.showToast(`Deleted draft for ${props.id}`);
          this.selectFeature(this.selectedFeature);
        }
      });
    }
  }

  private setProposedEntrancePin(coords: [number, number]): void {
    if (this.entranceMarker) {
      this.map.removeLayer(this.entranceMarker);
    }
    // coords is [lon, lat] -> Leaflet uses [lat, lon]
    this.entranceMarker = L.marker([coords[1], coords[0]], {
      icon: L.divIcon({
        className: 'custom-entrance-pin',
        html: `<div style="background: #cfa84a; border: 2px solid #0d3824; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    }).addTo(this.map);
  }

  private updateCounts(): void {
    if (!this.features) return;
    const total = this.features.features.length;
    const identified = this.features.features.filter((f) => f.properties.is_identified).length;
    const proposed = Object.keys(this.proposals).length;

    const countAll = document.getElementById('count-all');
    const countId = document.getElementById('count-identified');
    const countUnid = document.getElementById('count-unidentified');
    const countProp = document.getElementById('count-proposed');

    if (countAll) countAll.textContent = String(total);
    if (countId) countId.textContent = String(identified);
    if (countUnid) countUnid.textContent = String(total - identified);
    if (countProp) countProp.textContent = String(proposed);
  }

  private bindGlobalEvents(): void {
    // Filter Bar
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach((opt) => {
      opt.addEventListener('click', () => {
        filterOptions.forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        this.currentFilter = (opt.getAttribute('data-filter') as any) || 'all';
        this.renderGeoJsonLayer();
      });
    });

    // Export JSON Backup
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const backup: ReviewDatasetBackup = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          institution: 'University College Hospital, Ibadan',
          proposals: this.proposals,
        };

        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uch-proposals-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast(`Exported ${Object.keys(this.proposals).length} proposals.`);
      });
    }

    // Import JSON Backup with robust schema validation
    const fileImport = document.getElementById('file-import-json') as HTMLInputElement | null;
    if (fileImport) {
      fileImport.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const rawContent = event.target?.result as string;
            const parsed = JSON.parse(rawContent);

            // Validation checks
            if (!parsed || typeof parsed !== 'object') {
              throw new Error('File does not contain a valid JSON object.');
            }

            if (!parsed.proposals || typeof parsed.proposals !== 'object') {
              throw new Error('Missing "proposals" record collection in backup file.');
            }

            let validCount = 0;
            const existingProposals = { ...this.proposals };

            for (const [key, prop] of Object.entries(parsed.proposals) as [string, any][]) {
              if (prop && prop.footprintId && prop.proposedName) {
                existingProposals[key] = {
                  footprintId: String(prop.footprintId),
                  osmId: Number(prop.osmId || 0),
                  proposedName: String(prop.proposedName),
                  department: String(prop.department || ''),
                  evidenceUrl: String(prop.evidenceUrl || ''),
                  captureDate: String(prop.captureDate || new Date().toISOString().split('T')[0]),
                  confidence: (prop.confidence as ConfidenceLevel) || 'approximate',
                  notes: String(prop.notes || ''),
                  proposedEntrance: Array.isArray(prop.proposedEntrance) ? prop.proposedEntrance : undefined,
                  updatedAt: String(prop.updatedAt || new Date().toISOString()),
                };
                validCount++;
              }
            }

            this.proposals = existingProposals;
            this.saveProposalsToStorage();
            this.showToast(`Imported ${validCount} proposals successfully.`);

            if (this.selectedFeature) {
              this.selectFeature(this.selectedFeature);
            }
          } catch (err) {
            console.error('Import validation error:', err);
            alert(`Could not import file: ${err instanceof Error ? err.message : String(err)}\nExisting drafts were preserved.`);
          } finally {
            target.value = ''; // Reset input
          }
        };

        reader.readAsText(file);
      });
    }
  }

  private showToast(msg: string): void {
    const toast = document.getElementById('toast-notice');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  }
}

// Instantiate
new MapReviewApp();
