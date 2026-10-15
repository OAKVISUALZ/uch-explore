/**
 * lighting.ts - 3-Way Day, Sunset (Golden Hour), and Night Lighting System
 * 
 * Configures realistic tropical daylight, golden hour dusk, and atmospheric night lighting
 * with shadow management optimized for mobile GPUs.
 */

import * as THREE from 'three';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface WorldLighting {
  ambientLight: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  dirLight: THREE.DirectionalLight;
  nightGroup: THREE.Group;
  setTimeOfDay: (time: TimeOfDay) => void;
  getTimeOfDay: () => TimeOfDay;
}

export function setupLighting(scene: THREE.Scene): WorldLighting {
  let currentTime: TimeOfDay = 'day';

  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xfff6e8, 0.65);
  scene.add(ambientLight);

  // Hemisphere light: sky tone vs ground bounce
  const hemiLight = new THREE.HemisphereLight(0xdff0fa, 0x475e3e, 0.55);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  // Directional sun light with cascaded shadow map
  const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.3);
  dirLight.position.set(220, 320, 180);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 50;
  dirLight.shadow.camera.far = 700;

  const d = 380;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Night accent lights group
  const nightGroup = new THREE.Group();
  nightGroup.name = 'night-lights';
  nightGroup.visible = false;

  // Add warm hospital portal night pointlights
  const entranceLight = new THREE.PointLight(0xffe082, 1.8, 70, 1.2);
  entranceLight.position.set(88, 6, 149); // Queen Elizabeth road gate
  nightGroup.add(entranceLight);

  const emergencyLight = new THREE.PointLight(0xffdd99, 2.2, 85, 1.2);
  emergencyLight.position.set(-73, 8, -36); // A&E casualty bay
  nightGroup.add(emergencyLight);

  const wardLight = new THREE.PointLight(0xfff0b3, 2.0, 95, 1.2);
  wardLight.position.set(-61, 10, 93); // Central ward spine
  nightGroup.add(wardLight);

  scene.add(nightGroup);

  function setTimeOfDay(time: TimeOfDay): void {
    currentTime = time;

    if (time === 'sunset') {
      // Golden Hour (Nigerian Dusk)
      scene.background = new THREE.Color(0xd47a37);
      scene.fog = new THREE.FogExp2(0xd47a37, 0.0011);
      ambientLight.color.setHex(0xf39c12);
      ambientLight.intensity = 0.55;
      hemiLight.color.setHex(0xfad390);
      hemiLight.groundColor.setHex(0x573d1c);
      hemiLight.intensity = 0.5;
      dirLight.color.setHex(0xff793f);
      dirLight.intensity = 1.6;
      dirLight.position.set(380, 120, 240); // Low sun angle
      nightGroup.visible = true; // Twilight lamps turning on
    } else if (time === 'night') {
      // Midnight Atmospheric Blue
      scene.background = new THREE.Color(0x0a1017);
      scene.fog = new THREE.FogExp2(0x0a1017, 0.0016);
      ambientLight.color.setHex(0x1a2638);
      ambientLight.intensity = 0.35;
      hemiLight.color.setHex(0x223348);
      hemiLight.groundColor.setHex(0x0e141a);
      hemiLight.intensity = 0.3;
      dirLight.color.setHex(0x6080aa); // Cool moonlight
      dirLight.intensity = 0.45;
      dirLight.position.set(-150, 250, -100);
      nightGroup.visible = true;
    } else {
      // Equatorial Morning Daylight
      scene.background = new THREE.Color(0xcbe3f5);
      scene.fog = new THREE.FogExp2(0xcbe3f5, 0.0009);
      ambientLight.color.setHex(0xfff6e8);
      ambientLight.intensity = 0.65;
      hemiLight.color.setHex(0xdff0fa);
      hemiLight.groundColor.setHex(0x475e3e);
      hemiLight.intensity = 0.55;
      dirLight.color.setHex(0xfffaf0);
      dirLight.intensity = 1.3;
      dirLight.position.set(220, 320, 180);
      nightGroup.visible = false;
    }
  }

  setTimeOfDay('day');

  return {
    ambientLight,
    hemiLight,
    dirLight,
    nightGroup,
    setTimeOfDay,
    getTimeOfDay: () => currentTime,
  };
}
