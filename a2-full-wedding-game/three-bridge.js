const sources = [
  'https://unpkg.com/three@0.169.0/build/three.module.js',
  'https://esm.sh/three@0.169.0',
  'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js'
];

function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Three.js load timeout after ${ms}ms`)), ms);
  });
}

async function loadThree() {
  const attempts = sources.map(async (source) => {
    try {
      const module = await import(source);
      return { module, source };
    } catch (error) {
      throw new Error(`${source}: ${error?.message || error}`);
    }
  });

  const { module, source } = await Promise.race([
    Promise.any(attempts),
    timeout(8000)
  ]);

  globalThis.__A2_THREE_SOURCE__ = source;
  return module;
}

const THREE = await loadThree();

export const ACESFilmicToneMapping = THREE.ACESFilmicToneMapping;
export const BoxGeometry = THREE.BoxGeometry;
export const Clock = THREE.Clock;
export const Color = THREE.Color;
export const ConeGeometry = THREE.ConeGeometry;
export const CylinderGeometry = THREE.CylinderGeometry;
export const DirectionalLight = THREE.DirectionalLight;
export const DoubleSide = THREE.DoubleSide;
export const FogExp2 = THREE.FogExp2;
export const Group = THREE.Group;
export const HemisphereLight = THREE.HemisphereLight;
export const Mesh = THREE.Mesh;
export const MeshStandardMaterial = THREE.MeshStandardMaterial;
export const PCFSoftShadowMap = THREE.PCFSoftShadowMap;
export const PerspectiveCamera = THREE.PerspectiveCamera;
export const Scene = THREE.Scene;
export const SphereGeometry = THREE.SphereGeometry;
export const SRGBColorSpace = THREE.SRGBColorSpace;
export const TorusGeometry = THREE.TorusGeometry;
export const Vector3 = THREE.Vector3;
export const WebGLRenderer = THREE.WebGLRenderer;
