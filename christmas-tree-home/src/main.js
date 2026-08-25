import * as THREE from 'three';

const runtimeParts = [
  './runtime/part-01.jsfrag',
  './runtime/part-02.jsfrag',
  './runtime/part-03.jsfrag',
  './runtime/part-04.jsfrag',
  './runtime/part-05.jsfrag',
  './runtime/part-06.jsfrag',
];

async function boot() {
  let moduleUrl;
  try {
    const responses = await Promise.all(runtimeParts.map((path) => fetch(new URL(path, import.meta.url))));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Runtime part could not be loaded: ${failed.url} (${failed.status})`);

    const parts = await Promise.all(responses.map((response) => response.text()));
    globalThis.__CHRISTMAS_TREE_THREE__ = THREE;
    const source = `const THREE = globalThis.__CHRISTMAS_TREE_THREE__;\n${parts.join('\n')}`;
    moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    await import(moduleUrl);
  } catch (error) {
    console.error('Christmas tree runtime failed to load:', error);
    const app = document.querySelector('#app');
    const loading = document.querySelector('#loading-indicator');
    app?.classList.add('has-webgl-error');
    app?.setAttribute('aria-busy', 'false');
    if (loading) loading.innerHTML = '<span>3Dを開始できませんでした。ネット接続とWebGLを確認してください。</span>';
  } finally {
    if (moduleUrl) URL.revokeObjectURL(moduleUrl);
    delete globalThis.__CHRISTMAS_TREE_THREE__;
  }
}

boot();
