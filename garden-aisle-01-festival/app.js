const runtimeParts = [
  './runtime/part-01.jsfrag',
  './runtime/part-02.jsfrag',
  './runtime/part-03.jsfrag',
  './runtime/part-04.jsfrag',
  './runtime/part-05.jsfrag',
  './runtime/part-06.jsfrag',
  './runtime/part-07.jsfrag',
  './runtime/part-08.jsfrag',
  './runtime/part-09.jsfrag',

];

async function boot() {
  try {
    const responses = await Promise.all(runtimeParts.map((path) => fetch(path)));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Runtime part could not be loaded: ${failed.url} (${failed.status})`);
    const source = (await Promise.all(responses.map((response) => response.text()))).join('\n');
    new Function(`${source}\n//# sourceURL=garden-aisle-01-festival-runtime.js`)();
  } catch (error) {
    console.error(error);
    const fallback = document.querySelector('#fallback');
    const loading = document.querySelector('#loading');
    if (fallback) fallback.hidden = false;
    if (loading) loading.hidden = true;
  }
}

boot();
