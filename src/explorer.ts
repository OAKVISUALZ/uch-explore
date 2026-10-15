/**
 * explorer.ts - Main Application Entry & UI Controller
 * 
 * Manages search, directory lists, detail drawer slide-out, mode transitions,
 * route planning, 3-way time of day, procedural audio, deep-linking, and mobile controls.
 */

import { UCHDataManager } from './data';
import { ExplorerScene } from './explorer-scene';
import { DestinationPlace, BuildingProperties } from './types';

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

async function initUCHExplore(): Promise<void> {
  const loadingOverlay = document.getElementById('loading-overlay');
  const webglModal = document.getElementById('webgl-error-modal');
  const canvasContainer = document.getElementById('canvas-container');

  if (!checkWebGL() || !canvasContainer) {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (webglModal) webglModal.style.display = 'flex';
    return;
  }

  const dataManager = new UCHDataManager();

  try {
    const data = await dataManager.loadAll();

    // DOM Elements
    const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
    const filterContainer = document.getElementById('filter-container');
    const directoryList = document.getElementById('directory-list');

    const drawer = document.getElementById('detail-drawer');
    const drawerClose = document.getElementById('drawer-close');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerCategory = document.getElementById('drawer-category');
    const drawerDesc = document.getElementById('drawer-desc');
    const drawerArch = document.getElementById('drawer-arch');
    const drawerAccess = document.getElementById('drawer-access');
    const drawerSources = document.getElementById('drawer-sources');
    const metaBldId = document.getElementById('meta-bld-id');
    const metaConfidence = document.getElementById('meta-confidence');
    const metaLevels = document.getElementById('meta-levels');
    const metaArea = document.getElementById('meta-area');
    const btnDrawerRoute = document.getElementById('btn-drawer-route');
    const btnDrawerShare = document.getElementById('btn-drawer-share');

    // Controls
    const btnDirections = document.getElementById('btn-directions');
    const routePlannerCard = document.getElementById('route-planner-card');
    const btnCloseRoute = document.getElementById('btn-close-route');
    const routeFrom = document.getElementById('route-from') as HTMLSelectElement | null;
    const routeTo = document.getElementById('route-to') as HTMLSelectElement | null;
    const btnCalcRoute = document.getElementById('btn-calc-route');
    const btnClearRoute = document.getElementById('btn-clear-route');
    const routeSummary = document.getElementById('route-summary');

    const btnToggleWalk = document.getElementById('btn-toggle-walk');
    const btnExitWalk = document.getElementById('btn-exit-walk');
    const walkBanner = document.getElementById('walk-banner');
    const walkTouchOverlay = document.getElementById('walk-touch-overlay');

    const btnToggleTime = document.getElementById('btn-toggle-time');
    const timeIcon = document.getElementById('time-icon');
    const timeLabel = document.getElementById('time-label');

    const btnToggleAudio = document.getElementById('btn-toggle-audio');
    const audioIcon = document.getElementById('audio-icon');

    const btnToggleLabels = document.getElementById('btn-toggle-labels');
    const btnToggleQuality = document.getElementById('btn-toggle-quality');
    const qualityLabel = document.getElementById('quality-label');
    const btnFullView = document.getElementById('btn-full-view');
    const btnMainGate = document.getElementById('btn-main-gate');
    const toastMessage = document.getElementById('toast-message');

    let currentCategory = 'All';
    let currentSelectedPlace: DestinationPlace | null = null;

    function showToast(msg: string): void {
      if (!toastMessage) return;
      toastMessage.textContent = msg;
      toastMessage.style.display = 'block';
      setTimeout(() => {
        toastMessage.style.display = 'none';
      }, 3000);
    }

    // Initialize 3D Scene
    const scene = new ExplorerScene(canvasContainer, data, {
      onSelectBuilding: (building: BuildingProperties, place?: DestinationPlace) => {
        showBuildingDetails(building, place);
      },
      onDeselect: () => {
        if (drawer) drawer.classList.remove('open');
        currentSelectedPlace = null;
      },
      onModeChange: (mode: 'orbit' | 'walk') => {
        const isWalk = mode === 'walk';
        if (walkBanner) walkBanner.style.display = isWalk ? 'flex' : 'none';
        if (btnToggleWalk) {
          btnToggleWalk.classList.toggle('active', isWalk);
        }
        if (walkTouchOverlay) {
          const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          walkTouchOverlay.style.display = isWalk && isTouch ? 'block' : 'none';
        }
      },
      onRouteCalculated: (route) => {
        if (routeSummary) {
          routeSummary.style.display = 'block';
          routeSummary.innerHTML = `
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--uch-green);">
              🚶 ${route.distanceMeters}m (~${route.walkingMinutes} min walk)
            </div>
            <ol style="margin-left: 18px; margin-top: 6px; font-size: 0.76rem; color: var(--warm-text-muted);">
              ${route.instructions.map((step) => `<li>${step}</li>`).join('')}
            </ol>
          `;
        }
      },
    });

    scene.start();

    // Populate Route Select Dropdowns
    if (routeFrom && routeTo) {
      for (const p of data.places) {
        const opt1 = document.createElement('option');
        opt1.value = p.id;
        opt1.textContent = `${p.category}: ${p.shortName}`;
        routeFrom.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = p.id;
        opt2.textContent = `${p.category}: ${p.shortName}`;
        routeTo.appendChild(opt2);
      }
      routeFrom.value = 'uch-gate-main';
      routeTo.value = 'uch-bld-ae';
    }

    // Populate Directory List
    function renderDirectory(): void {
      if (!directoryList) return;
      const query = searchInput ? searchInput.value : '';
      const places = dataManager.searchPlaces(query, currentCategory);

      directoryList.innerHTML = '';

      if (places.length === 0) {
        directoryList.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--warm-text-muted); font-size: 0.85rem;">
            No destinations found. Check spelling or try selecting "All".
          </div>
        `;
        return;
      }

      for (const place of places) {
        const card = document.createElement('div');
        card.className = 'directory-card';

        const confClass = `badge-${place.confidence}`;
        const confLabel = place.confidence === 'verified'
          ? 'Verified'
          : place.confidence === 'high_confidence'
          ? 'High Conf'
          : 'Approximate';

        card.innerHTML = `
          <div class="card-title-row">
            <div class="card-title">${place.name}</div>
            <span class="card-badge ${confClass}">${confLabel}</span>
          </div>
          <div class="card-desc">${place.description}</div>
          <div class="card-meta-row">
            <span>🏷️ ${place.category}</span>
            <span>📍 ${place.targetBuildingId ? place.targetBuildingId : 'Ground feature'}</span>
          </div>
        `;

        card.addEventListener('click', () => {
          scene.focusOnDestination(place);
          const bld = place.targetBuildingId
            ? data.buildings.features.find((b) => b.properties.id === place.targetBuildingId)?.properties
            : null;
          showBuildingDetails(bld || createSyntheticBuildingProps(place), place);
          window.location.hash = `place=${place.id}`;
        });

        directoryList.appendChild(card);
      }
    }

    renderDirectory();

    // Search and Category Filter handlers
    if (searchInput) {
      searchInput.addEventListener('input', () => renderDirectory());
    }

    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('filter-chip')) {
          filterContainer.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
          target.classList.add('active');
          currentCategory = target.getAttribute('data-category') || 'All';
          renderDirectory();
        }
      });
    }

    // Detail Drawer rendering
    function showBuildingDetails(building: BuildingProperties, place?: DestinationPlace): void {
      if (!drawer) return;
      currentSelectedPlace = place || null;

      const title = place ? place.name : building.name;
      const category = place ? place.category : building.category;
      const description = place
        ? place.description
        : building.is_identified
        ? 'Verified hospital facility.'
        : 'Footprint identified in OpenStreetMap data. Specific department assignment is under review.';

      if (drawerTitle) drawerTitle.textContent = title;
      if (drawerCategory) drawerCategory.textContent = category.toUpperCase();
      if (drawerDesc) drawerDesc.textContent = description;

      if (metaBldId) metaBldId.textContent = building.id;
      if (metaConfidence) {
        metaConfidence.textContent = building.confidence.replace('_', ' ').toUpperCase();
      }
      if (metaLevels) {
        metaLevels.textContent = `${building.levels} Floor${building.levels > 1 ? 's' : ''} (~${building.height_m}m)`;
      }
      if (metaArea) {
        metaArea.textContent = `~${building.footprint_area_m2} m²`;
      }

      if (drawerArch) {
        drawerArch.textContent = building.architecture;
      }

      if (drawerAccess) {
        if (place && place.entranceVerified) {
          drawerAccess.innerHTML = `<strong>✓ Verified Entrance:</strong> ${place.accessNotes}`;
          drawerAccess.style.borderLeftColor = 'var(--uch-green)';
          drawerAccess.style.background = 'var(--uch-green-subtle)';
        } else if (place) {
          drawerAccess.innerHTML = `<strong>Access Notice:</strong> ${place.accessNotes} (Doorway under verification)`;
          drawerAccess.style.borderLeftColor = 'var(--uch-gold)';
          drawerAccess.style.background = 'var(--uch-gold-light)';
        } else {
          drawerAccess.innerHTML = 'Entrance location not yet recorded. Contributor review recommended.';
          drawerAccess.style.borderLeftColor = '#8c6827';
          drawerAccess.style.background = '#f8efe0';
        }
      }

      if (drawerSources) {
        drawerSources.innerHTML = '';
        const sources = place?.sources || [
          { name: 'OpenStreetMap Way ' + building.osm_id, url: `https://www.openstreetmap.org/way/${building.osm_id}` },
        ];

        for (const s of sources) {
          const li = document.createElement('li');
          if (s.url) {
            li.innerHTML = `<strong>${s.name}</strong>: <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a> ${s.date ? `(${s.date})` : ''}`;
          } else {
            li.innerHTML = `<strong>${s.name}</strong> ${s.date ? `(${s.date})` : ''}`;
          }
          drawerSources.appendChild(li);
        }
      }

      drawer.classList.add('open');
    }

    if (drawerClose) {
      drawerClose.addEventListener('click', () => {
        scene.deselect();
        drawer?.classList.remove('open');
      });
    }

    // Drawer action buttons (Route from Main Gate & Share Link)
    if (btnDrawerRoute) {
      btnDrawerRoute.addEventListener('click', () => {
        if (!currentSelectedPlace) return;
        if (routeFrom) routeFrom.value = 'uch-gate-main';
        if (routeTo) routeTo.value = currentSelectedPlace.id;
        if (routePlannerCard) routePlannerCard.style.display = 'block';
        scene.planRoute('uch-gate-main', currentSelectedPlace.id);
        showToast(`Route plotted to ${currentSelectedPlace.shortName}`);
      });
    }

    if (btnDrawerShare) {
      btnDrawerShare.addEventListener('click', () => {
        if (!currentSelectedPlace) return;
        const place = currentSelectedPlace;
        const shareUrl = `${window.location.origin}${window.location.pathname}#place=${place.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast(`Direct link copied for ${place.shortName}!`);
        }).catch(() => {
          showToast(`Direct link: ${shareUrl}`);
        });
      });
    }

    // Route Planner Controls
    if (btnDirections) {
      btnDirections.addEventListener('click', () => {
        if (!routePlannerCard) return;
        const isOpen = routePlannerCard.style.display === 'block';
        routePlannerCard.style.display = isOpen ? 'none' : 'block';
      });
    }

    if (btnCloseRoute) {
      btnCloseRoute.addEventListener('click', () => {
        if (routePlannerCard) routePlannerCard.style.display = 'none';
      });
    }

    if (btnCalcRoute) {
      btnCalcRoute.addEventListener('click', () => {
        if (!routeFrom || !routeTo) return;
        scene.planRoute(routeFrom.value, routeTo.value);
      });
    }

    if (btnClearRoute) {
      btnClearRoute.addEventListener('click', () => {
        scene.clearRoute();
        if (routeSummary) routeSummary.style.display = 'none';
        showToast('Navigation route cleared.');
      });
    }

    // Header buttons
    if (btnToggleWalk) {
      btnToggleWalk.addEventListener('click', () => {
        scene.toggleWalkingMode();
      });
    }

    if (btnExitWalk) {
      btnExitWalk.addEventListener('click', () => {
        scene.exitWalkMode();
      });
    }

    // 3-Way Time of Day Toggle (Day -> Sunset -> Night)
    if (btnToggleTime) {
      btnToggleTime.addEventListener('click', () => {
        const nextTime = scene.cycleTimeOfDay();
        if (timeIcon && timeLabel) {
          if (nextTime === 'sunset') {
            timeIcon.textContent = '🌅';
            timeLabel.textContent = 'Sunset';
          } else if (nextTime === 'night') {
            timeIcon.textContent = '🌙';
            timeLabel.textContent = 'Night';
          } else {
            timeIcon.textContent = '☀️';
            timeLabel.textContent = 'Day';
          }
        }
        showToast(`Lighting set to ${nextTime.toUpperCase()}`);
      });
    }

    // Ambient Audio Synthesizer Toggle
    if (btnToggleAudio) {
      btnToggleAudio.addEventListener('click', () => {
        const isActive = scene.toggleAudio();
        if (audioIcon) {
          audioIcon.textContent = isActive ? '🔊' : '🔇';
        }
        btnToggleAudio.classList.toggle('active', isActive);
        showToast(isActive ? 'Ambient sound enabled' : 'Ambient sound muted');
      });
    }

    // 3D Floating Landmark Labels Toggle
    if (btnToggleLabels) {
      btnToggleLabels.addEventListener('click', () => {
        const isShown = scene.toggleLabels();
        btnToggleLabels.classList.toggle('active', isShown);
        showToast(isShown ? '3D landmark badges visible' : '3D landmark badges hidden');
      });
    }

    if (btnToggleQuality) {
      btnToggleQuality.addEventListener('click', () => {
        const isLow = scene.toggleQuality();
        if (qualityLabel) qualityLabel.textContent = isLow ? '⚡ Eco' : '⚡ High';
        btnToggleQuality.classList.toggle('active', isLow);
      });
    }

    if (btnFullView) {
      btnFullView.addEventListener('click', () => {
        scene.deselect();
        scene.setFullView(true);
      });
    }

    if (btnMainGate) {
      btnMainGate.addEventListener('click', () => {
        scene.focusOnMainEntrance();
        const gatePlace = data.places.find((p) => p.id === 'uch-gate-main');
        if (gatePlace) {
          showBuildingDetails(createSyntheticBuildingProps(gatePlace), gatePlace);
        }
      });
    }

    // Parse URL #hash on initial load for deep-linking
    function checkDeepLink(): void {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      const params = new URLSearchParams(hash);
      const placeId = params.get('place');
      const walk = params.get('walk');
      const routeParam = params.get('route');

      if (placeId) {
        const p = data.places.find((item) => item.id === placeId);
        if (p) {
          setTimeout(() => {
            scene.focusOnDestination(p);
            const bld = p.targetBuildingId
              ? data.buildings.features.find((b) => b.properties.id === p.targetBuildingId)?.properties
              : null;
            showBuildingDetails(bld || createSyntheticBuildingProps(p), p);
          }, 600);
        }
      } else if (routeParam) {
        const [from, to] = routeParam.split(':');
        if (from && to) {
          setTimeout(() => {
            scene.planRoute(from, to);
            if (routePlannerCard) routePlannerCard.style.display = 'block';
            if (routeFrom) routeFrom.value = from;
            if (routeTo) routeTo.value = to;
          }, 600);
        }
      }

      if (walk === 'true') {
        setTimeout(() => {
          scene.enterWalkMode();
        }, 800);
      }
    }

    checkDeepLink();
    setupVirtualJoystick(scene);

    // Hide loader
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 400);
    }
  } catch (err) {
    console.error('Initialization error:', err);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="padding: 24px; text-align: center; max-width: 480px;">
          <h2 style="color: #ff8080; margin-bottom: 12px;">Failed to Load Map Data</h2>
          <p style="font-size: 0.9rem; line-height: 1.4; color: #eeddcc;">
            ${err instanceof Error ? err.message : String(err)}
          </p>
          <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #cfa84a; border: none; font-weight: bold; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

function createSyntheticBuildingProps(place: DestinationPlace): BuildingProperties {
  return {
    id: place.id,
    osm_id: 0,
    name: place.name,
    category: place.category,
    confidence: place.confidence,
    is_identified: true,
    levels: 1,
    height_m: 5,
    footprint_area_m2: 120,
    center: place.coordinates,
    architecture: 'Verified outdoor landmark.',
    source: 'UCH Records',
  };
}

function setupVirtualJoystick(scene: ExplorerScene): void {
  const base = document.getElementById('joystick-base');
  const nipple = document.getElementById('joystick-nipple');
  if (!base || !nipple) return;

  const walker = scene.getWalkerController();
  const maxRadius = 35;
  let activeTouchId: number | null = null;
  let baseX = 0;
  let baseY = 0;

  base.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    activeTouchId = touch.identifier;
    const rect = base.getBoundingClientRect();
    baseX = rect.left + rect.width / 2;
    baseY = rect.top + rect.height / 2;
  }, { passive: false });

  base.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (activeTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        const dx = touch.clientX - baseX;
        const dy = touch.clientY - baseY;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const nx = Math.cos(angle) * clampedDist;
        const ny = Math.sin(angle) * clampedDist;

        nipple.style.transform = `translate(${nx}px, ${ny}px)`;
        walker.setTouchMove(nx / maxRadius, ny / maxRadius);
      }
    }
  }, { passive: false });

  const endTouch = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        activeTouchId = null;
        nipple.style.transform = 'translate(0px, 0px)';
        walker.setTouchMove(0, 0);
      }
    }
  };

  base.addEventListener('touchend', endTouch);
  base.addEventListener('touchcancel', endTouch);
}

initUCHExplore();
