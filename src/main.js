import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const runtimeParts = [
  './runtime/part-01.jsfrag',
  './runtime/part-02.jsfrag',
  './runtime/part-03.jsfrag',
  './runtime/part-04.jsfrag',
  './runtime/part-05.jsfrag',
  './runtime/part-06.jsfrag'
];

async function boot() {
  let moduleUrl;
  try {
    const responses = await Promise.all(runtimeParts.map((path) => fetch(new URL(path, import.meta.url))));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Runtime part could not be loaded: ${failed.url} (${failed.status})`);

    const parts = await Promise.all(responses.map((response) => response.text()));
    globalThis.__WEDDING_FLOWER_THREE__ = THREE;
    const source = `const THREE = globalThis.__WEDDING_FLOWER_THREE__;\n${parts.join('\n')}`;
    moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    await import(moduleUrl);
  } catch (error) {
    console.error(error);
    const fallback = document.querySelector('#fallback');
    const canvas = document.querySelector('#scene');
    if (fallback) fallback.hidden = false;
    if (canvas) canvas.hidden = true;
  } finally {
    if (moduleUrl) URL.revokeObjectURL(moduleUrl);
    delete globalThis.__WEDDING_FLOWER_THREE__;
  }
}

boot();
