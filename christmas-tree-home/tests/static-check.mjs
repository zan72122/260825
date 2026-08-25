import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const html = read('index.html');
const css = read('styles.css');
const loader = read('src/main.js');
const fragmentPaths = [
  'src/runtime/part-01.jsfrag',
  'src/runtime/part-02.jsfrag',
  'src/runtime/part-03.jsfrag',
  'src/runtime/part-04.jsfrag',
  'src/runtime/part-05.jsfrag',
  'src/runtime/part-06.jsfrag',
];
const fragments = fragmentPaths.map(read);
const runtime = fragments.join('\n');

for (const id of [
  'app',
  'scene-canvas',
  'copy-panel',
  'scene-number',
  'scene-place',
  'scene-kicker',
  'scene-title',
  'scene-description',
  'material-caption',
  'start-overline',
  'start-label',
  'start-button',
  'previous-button',
  'next-button',
  'variant-dots',
  'info-button',
  'sound-button',
  'info-modal',
  'start-modal',
  'start-modal-copy',
  'toast',
]) {
  assert(html.includes(`id="${id}"`), `Missing HTML id: ${id}`);
}

assert(html.includes('type="importmap"'), 'Three.js import map is missing');
assert(html.includes('three@0.170.0'), 'Expected pinned Three.js r170 CDN URL');
assert(html.includes('./src/main.js'), 'Entry module is missing');
assert(html.includes('viewport-fit=cover'), 'Safe-area viewport support is missing');
assert(html.includes('user-scalable=no'), 'Mobile viewport policy is missing');

assert(fragmentPaths.every((fragmentPath) => loader.includes(fragmentPath.replace('src/', './'))), 'Loader does not list all six runtime fragments');
assert(loader.includes('globalThis.__CHRISTMAS_TREE_THREE__'), 'Three.js hand-off to generated module is missing');
assert(loader.includes('URL.createObjectURL'), 'Blob runtime module construction is missing');
assert(loader.includes('has-webgl-error'), 'WebGL/load failure fallback is missing');

const variantBlockStart = runtime.indexOf('const variants = [');
assert(variantBlockStart >= 0, 'Variant metadata array is missing');
const variantBlockEnd = runtime.indexOf('];', variantBlockStart);
assert(variantBlockEnd > variantBlockStart, 'Variant metadata array is not closed');
const variantBlock = runtime.slice(variantBlockStart, variantBlockEnd + 2);
const ids = [...variantBlock.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
assert(ids.length === 14, `Expected 14 variants, found ${ids.length}`);
assert(new Set(ids).size === 14, 'Variant IDs must be unique');

const expectedBuilders = [
  'buildBiltmoreHall',
  'buildNewYorkPlaza',
  'buildNurembergMarket',
  'buildTokyoAtrium',
  'buildOkinawaTerrace',
  'buildHelsinkiLivingRoom',
  'buildOaxacaCourtyard',
  'buildCzechGlassWorkshop',
  'buildLoireSalon',
  'buildLaplandRaising',
  'buildAucklandGarden',
  'buildEdinburghStation',
  'buildKyotoMachiya',
  'buildTechnicalCutaway',
];
for (const builder of expectedBuilders) {
  assert(runtime.includes(`function ${builder}(`), `Missing scene builder function: ${builder}`);
  assert(variantBlock.includes(`build: ${builder}`), `Variant metadata does not reference ${builder}`);
}

for (const helper of [
  'createFraserFir',
  'createTreeStand',
  'decorateTree',
  'addGuyWires',
  'createScaffold',
  'createLongPole',
  'createCrate',
  'createTrolley',
  'disposeWorld',
]) {
  assert(runtime.includes(`function ${helper}(`), `Missing core geometry/helper: ${helper}`);
}

assert(runtime.includes('new THREE.InstancedMesh'), 'Instanced geometry is not used');
assert(runtime.includes('renderer.shadowMap.enabled = true'), 'Shadow maps are not enabled');
assert(runtime.includes('renderer.toneMapping = THREE.ACESFilmicToneMapping'), 'Tone mapping is missing');
assert(runtime.includes('window.matchMedia(\'(pointer: coarse)\')'), 'Coarse pointer adaptation is missing');
assert(runtime.includes('const threshold = isCoarsePointer ? 28 : 42'), 'Forgiving swipe threshold is missing');
assert(runtime.includes('prefers-reduced-motion'), 'Reduced-motion handling is missing');
assert(runtime.includes('renderer.setAnimationLoop'), 'Render loop is missing');
assert(runtime.includes('disposeWorld(previousRoot)'), 'Old scenes are not explicitly disposed');

for (const ui of [
  'heritage', 'metropolis', 'market', 'precision', 'island', 'nordic', 'folk',
  'workshop', 'salon', 'arctic', 'summer', 'station', 'machiya', 'technical',
]) {
  assert(css.includes(`data-ui='${ui}'`), `Missing CSS UI grammar: ${ui}`);
}

assert(css.includes('env(safe-area-inset-top)'), 'Top safe area is missing');
assert(css.includes('env(safe-area-inset-bottom)'), 'Bottom safe area is missing');
assert(css.includes('@media (orientation:portrait)'), 'Portrait layout is missing');
assert(css.includes('@media (max-height:650px) and (orientation:landscape)'), 'Short landscape layout is missing');
assert(css.includes('@media (prefers-reduced-motion:reduce)'), 'Reduced-motion CSS is missing');
assert(css.includes('min-height:56px'), 'Large touch target baseline is missing');

const openingBraces = (css.match(/{/g) ?? []).length;
const closingBraces = (css.match(/}/g) ?? []).length;
assert(openingBraces === closingBraces, `CSS brace mismatch: ${openingBraces} open vs ${closingBraces} close`);

console.log(`Static check passed: ${ids.length} unique variants, ${expectedBuilders.length} builders, ${fragmentPaths.length} runtime parts.`);
console.log(`Variant IDs: ${ids.join(', ')}`);
