import assert from 'node:assert/strict';
import { CHAPTERS, PROCESS_STATES } from '../src/game-data.js';
import { WorkshopWorld } from '../src/workshop.js';
import { TaskEngine } from '../src/tasks.js';

if (!globalThis.window) globalThis.window = {};
window.innerWidth = 1440;
window.innerHeight = 900;
window.devicePixelRatio = 1;

assert.equal(CHAPTERS.length, 15, '15 chapters are required');
assert.equal(PROCESS_STATES.length, 32, 'process book must preserve 32 states');
assert.equal(new Set(CHAPTERS.map(c => c.id)).size, CHAPTERS.length, 'chapter ids must be unique');
for (const chapter of CHAPTERS) {
  assert.ok(chapter.steps.length > 0, `${chapter.title} needs an interactive step`);
  assert.ok(chapter.auto?.duration >= 2500, `${chapter.title} needs an auto process bridge`);
  assert.equal(chapter.auto?.beats?.length, 3, `${chapter.title} needs three auto-process beats`);
}
const coveredStates = new Set(CHAPTERS.flatMap(chapter => chapter.states));
assert.deepEqual([...coveredStates].sort((a,b)=>a-b), PROCESS_STATES.map((_,index)=>index), 'all 32 process states must be covered');

const state = { wood: 'keyaki', decoration: 'chinkin' };
const world = new WorkshopWorld(null);
for (const chapter of CHAPTERS) {
  for (const step of chapter.steps) {
    world.setChapter(chapter, step, state);
    world.setProgress(.5, step, state);
    world.addStroke(step, { x: .5, y: .45 }, 1);
    world.setProgress(1, step, state);
    if (step === chapter.steps.at(-1)) {
      world.beginAuto(chapter, state);
      world.setAutoProgress(chapter, .5, state);
      world.endAuto(chapter, state);
    }
    world.update(1 / 60, 1, state);
    let meshCount = 0;
    world.scene.traverse(node => { if (node.geometry && node.material && node.visible) meshCount++; });
    assert.ok(meshCount >= 20, `${chapter.number}.${step.id} should build a substantial 3D scene`);
  }
}
window.innerWidth = 430;
window.innerHeight = 932;
world.setHome();
world.update(1 / 60, 2, state);
assert.ok(world.camera.position[2] >= 9, 'portrait camera should move back instead of cropping the bowl');

const fakeCanvas = {
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }),
  setPointerCapture() {},
  releasePointerCapture() {}
};
let completed = 0;
const fakeWorld = {
  setPointer() {},
  setProgress() {},
  addStroke() {},
  applyChoice() {}
};
const engine = new TaskEngine({ canvas: fakeCanvas, world: fakeWorld, onComplete: () => completed++ });
engine.setTask(CHAPTERS[1], CHAPTERS[1].steps[0], state);
engine.setProgress(1);
engine.finish();
assert.equal(completed, 1, 'task engine should report completion');

console.log(`Smoke test passed: ${CHAPTERS.length} chapters, ${CHAPTERS.reduce((n,c)=>n+c.steps.length,0)} interactive steps, ${PROCESS_STATES.length} process states.`);
