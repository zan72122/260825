import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const runtimeParts = ['./runtime/part-01.jsfrag', './runtime/part-02.jsfrag', './runtime/part-03.jsfrag', './runtime/part-04.jsfrag', './runtime/part-05.jsfrag', './runtime/part-06.jsfrag', './runtime/part-07.jsfrag', './runtime/part-08.jsfrag', './runtime/part-09.jsfrag', './runtime/part-10.jsfrag', './runtime/part-11.jsfrag'];

async function boot() {
  let moduleUrl;
  try {
    const responses = await Promise.all(runtimeParts.map((path) => fetch(new URL(path, import.meta.url))));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Peak runtime part could not be loaded: ${failed.url} (${failed.status})`);
    const sourceParts = await Promise.all(responses.map((response) => response.text()));
    globalThis.__GARDEN_PEAK_THREE__ = THREE;
    moduleUrl = URL.createObjectURL(new Blob([sourceParts.join('\n')], { type: 'text/javascript' }));
    await import(moduleUrl);
  } catch (error) {
    console.error(error);
    const fallback = document.querySelector('#fallback');
    const loading = document.querySelector('#loading');
    const canvas = document.querySelector('#scene');
    if (fallback) fallback.hidden = false;
    if (loading) loading.hidden = true;
    if (canvas) canvas.hidden = true;
  } finally {
    if (moduleUrl) URL.revokeObjectURL(moduleUrl);
    delete globalThis.__GARDEN_PEAK_THREE__;
  }
}

boot();
