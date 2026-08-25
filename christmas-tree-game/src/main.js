const params = new URLSearchParams(location.search);
const useStub = params.has('stub');

async function boot() {
  try {
    const THREE = useStub
      ? await import('../test/three-stub.js')
      : await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
    globalThis.__TREE_THREE__ = THREE;
    const { startGame } = await import('./game.js');
    startGame();
  } catch (error) {
    console.error('Christmas tree game failed to start:', error);
    const loading = document.getElementById('loading');
    const fatal = document.getElementById('fatal-error');
    const app = document.getElementById('app');
    if (loading) loading.hidden = true;
    if (fatal) fatal.hidden = false;
    app?.classList.remove('is-loading');
    app?.classList.add('has-webgl-error');
    app?.setAttribute('aria-busy', 'false');
  }
}

boot();
