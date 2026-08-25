import { World } from './world.js';
import { GameUI } from './ui.js';
import { WorkAudio } from './audio.js';
import { CHAPTERS, createTasks } from './tasks.js';
import { clamp } from './helpers.js';

const SAVE_KEY = 'biltmore-tree:save:v1';
const SAVE_VERSION = 1;

function safeParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export class ChristmasTreeGame {
  constructor() {
    this.params = new URLSearchParams(location.search);
    this.autotest = this.params.has('autotest');
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || this.params.has('reduced');
    document.body.dataset.reducedMotion = String(this.reducedMotion);

    this.ui = new GameUI(CHAPTERS);
    this.audio = new WorkAudio();
    this.world = new World(this.ui.canvas, { reducedMotion: this.reducedMotion, params: this.params });
    this.tasks = createTasks(this);
    this.currentTask = null;
    this.currentIndex = 0;
    this.highestUnlocked = 0;
    this.actions = 0;
    this.elapsed = 0;
    this.playing = false;
    this.paused = false;
    this.transitioning = false;
    this.lastFrame = performance.now();
    this.pointerId = null;
    this.pointerDownAt = null;
    this.feedbackSerial = 0;
    this.animationFrame = 0;
    this.save = this.readSave();

    this.bindUI();
    this.bindPointer();
    this.bindLifecycle();
    this.ui.setSoundEnabled(this.audio.enabled);
    this.ui.setReady();
    this.ui.showTitle(this.save);
    this.world.showTitleWorld(true);
    this.loop = this.loop.bind(this);
    this.animationFrame = requestAnimationFrame(this.loop);

    window.__TREE_GAME__ = {
      game: this,
      goto: (index) => this.enterChapter(Number(index), { allowLocked: true }),
      force: () => this.currentTask?.forceComplete(),
      snapshot: () => this.snapshot(),
      autotest: () => this.runAutotest(),
      reset: () => this.beginNewGame(),
    };

    if (this.autotest) queueMicrotask(() => this.runAutotest());
  }

  bindUI() {
    document.getElementById('new-game-button').addEventListener('click', () => this.beginNewGame());
    document.getElementById('continue-button').addEventListener('click', () => this.continueGame());
    document.getElementById('chapters-button').addEventListener('click', () => {
      if (!this.playing) return;
      this.paused = true;
      this.ui.openChapterSheet();
      this.audio.play('click');
    });
    document.getElementById('pause-button').addEventListener('click', () => this.pause());
    document.getElementById('resume-button').addEventListener('click', () => this.resume());
    document.getElementById('title-button').addEventListener('click', () => this.returnToTitle());
    document.getElementById('hint-button').addEventListener('click', () => {
      if (!this.paused && this.playing) this.currentTask?.hint();
    });
    document.getElementById('repeat-button').addEventListener('click', () => {
      if (!this.paused && this.playing) this.restartCurrentTask();
    });
    document.getElementById('sound-button').addEventListener('click', () => {
      const enabled = this.audio.toggle();
      this.ui.setSoundEnabled(enabled);
    });
    document.getElementById('replay-button').addEventListener('click', () => this.beginNewGame());
    document.getElementById('finished-view-button').addEventListener('click', () => {
      this.ui.endingScreen.hidden = true;
      this.ui.titleScreen.hidden = false;
      this.world.showFinishedNight();
    });
    document.querySelectorAll('[data-close-sheet]').forEach((node) => node.addEventListener('click', () => {
      this.ui.closeChapterSheet();
      this.paused = false;
    }));
    this.ui.setChapterSelectionHandler((index) => {
      this.ui.closeChapterSheet();
      this.paused = false;
      this.enterChapter(index);
    });
  }

  bindPointer() {
    const layer = this.ui.interaction;
    const makePointer = (event) => {
      const rect = layer.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nx = clamp(x / Math.max(1, rect.width));
      const ny = clamp(y / Math.max(1, rect.height));
      return {
        id: event.pointerId,
        x,
        y,
        nx,
        ny,
        ndcX: nx * 2 - 1,
        ndcY: (1 - ny) * 2 - 1,
        width: rect.width,
        height: rect.height,
        pressure: event.pressure || .5,
        time: performance.now(),
      };
    };

    layer.addEventListener('pointerdown', (event) => {
      if (!this.playing || this.paused || this.transitioning || this.pointerId !== null) return;
      event.preventDefault();
      this.audio.unlock();
      this.pointerId = event.pointerId;
      layer.setPointerCapture?.(event.pointerId);
      layer.classList.add('is-active');
      const pointer = makePointer(event);
      this.pointerDownAt = pointer;
      this.currentTask?.pointerDown(pointer);
    });

    layer.addEventListener('pointermove', (event) => {
      const pointer = makePointer(event);
      this.world.setParallax((pointer.nx - .5) * 2, (.5 - pointer.ny) * 2);
      if (event.pointerId !== this.pointerId || !this.playing || this.paused || this.transitioning) return;
      event.preventDefault();
      this.currentTask?.pointerMove(pointer);
    });

    const finishPointer = (event) => {
      if (event.pointerId !== this.pointerId) return;
      const pointer = makePointer(event);
      this.currentTask?.pointerUp(pointer);
      layer.releasePointerCapture?.(event.pointerId);
      layer.classList.remove('is-active');
      this.pointerId = null;
      this.pointerDownAt = null;
    };
    layer.addEventListener('pointerup', finishPointer);
    layer.addEventListener('pointercancel', finishPointer);
    layer.addEventListener('lostpointercapture', () => {
      layer.classList.remove('is-active');
      this.pointerId = null;
    });
  }

  bindLifecycle() {
    window.addEventListener('resize', () => this.world.resize(), { passive: true });
    window.visualViewport?.addEventListener('resize', () => this.world.resize(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.playing && !this.paused) this.pause(false);
      this.lastFrame = performance.now();
    });
  }

  readSave() {
    const raw = safeParse(localStorage.getItem(SAVE_KEY));
    if (!raw || raw.version !== SAVE_VERSION) return null;
    return {
      version: SAVE_VERSION,
      chapterIndex: clamp(Number(raw.chapterIndex) || 0, 0, CHAPTERS.length - 1),
      highestUnlocked: clamp(Number(raw.highestUnlocked) || 0, 0, CHAPTERS.length - 1),
      actions: Math.max(0, Number(raw.actions) || 0),
      elapsed: Math.max(0, Number(raw.elapsed) || 0),
      completed: Boolean(raw.completed),
      savedAt: raw.savedAt || null,
    };
  }

  writeSave({ completed = false, silent = false } = {}) {
    this.save = {
      version: SAVE_VERSION,
      chapterIndex: this.currentIndex,
      highestUnlocked: this.highestUnlocked,
      actions: this.actions,
      elapsed: this.elapsed,
      completed,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
      if (!silent) this.ui.showSaved();
    } catch (error) {
      console.warn('Could not save progress:', error);
    }
  }

  freshTask(index) {
    const fresh = createTasks(this)[index];
    this.tasks[index] = fresh;
    return fresh;
  }

  beginNewGame() {
    this.audio.unlock();
    this.currentTask?.exit();
    this.actions = 0;
    this.elapsed = 0;
    this.currentIndex = 0;
    this.highestUnlocked = 0;
    this.save = null;
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    this.playing = true;
    this.paused = false;
    this.transitioning = false;
    this.ui.showGame();
    this.enterChapter(0, { allowLocked: true, writeSave: true });
  }

  continueGame() {
    const save = this.readSave();
    if (!save || save.completed) {
      this.beginNewGame();
      return;
    }
    this.audio.unlock();
    this.actions = save.actions;
    this.elapsed = save.elapsed;
    this.currentIndex = save.chapterIndex;
    this.highestUnlocked = Math.max(save.highestUnlocked, save.chapterIndex);
    this.playing = true;
    this.paused = false;
    this.transitioning = false;
    this.ui.showGame();
    this.enterChapter(this.currentIndex, { allowLocked: true, writeSave: false });
  }

  enterChapter(index, options = {}) {
    const target = clamp(Math.round(index), 0, CHAPTERS.length - 1);
    if (!options.allowLocked && target > this.highestUnlocked) return;
    this.currentTask?.exit();
    this.currentIndex = target;
    this.highestUnlocked = Math.max(this.highestUnlocked, target);
    this.ui.setChapter(target, this.highestUnlocked);
    this.world.applyMilestone(target);
    this.currentTask = this.freshTask(target);
    this.currentTask.enter();
    this.ui.setProgress(0);
    this.ui.hideChapterComplete();
    this.ui.showGame();
    this.playing = true;
    this.paused = false;
    this.transitioning = false;
    if (options.writeSave !== false) this.writeSave({ silent: Boolean(options.silent) });
  }

  restartCurrentTask() {
    if (this.transitioning) return;
    this.audio.play('click');
    this.feedback('この仕事のはじめへ戻しました', 'gentle');
    this.enterChapter(this.currentIndex, { allowLocked: true, writeSave: false });
  }

  completeCurrentTask() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.currentTask?.exit();
    const chapter = CHAPTERS[this.currentIndex];
    const last = this.currentIndex === CHAPTERS.length - 1;
    this.highestUnlocked = Math.max(this.highestUnlocked, Math.min(CHAPTERS.length - 1, this.currentIndex + 1));
    this.writeSave({ completed: last, silent: this.autotest });

    if (this.autotest) {
      this.transitioning = false;
      return;
    }

    this.ui.showChapterComplete(chapter);
    this.audio.play(last ? 'chime' : 'click');
    window.setTimeout(() => {
      this.ui.hideChapterComplete();
      if (last) {
        this.playing = false;
        this.transitioning = false;
        this.ui.showEnding({ actions: this.actions, elapsed: this.elapsed });
      } else {
        this.enterChapter(this.currentIndex + 1, { allowLocked: true, writeSave: true });
      }
    }, this.motionDelay(last ? 1450 : 980));
  }

  pause(withSound = true) {
    if (!this.playing || this.paused) return;
    this.paused = true;
    this.ui.openPause();
    if (withSound) this.audio.play('click');
    this.writeSave({ silent: true });
  }

  resume() {
    this.ui.closePause();
    this.paused = false;
    this.audio.play('click');
    this.lastFrame = performance.now();
  }

  returnToTitle() {
    this.writeSave({ silent: true });
    this.currentTask?.exit();
    this.playing = false;
    this.paused = false;
    this.transitioning = false;
    this.ui.showTitle(this.save);
    this.world.showTitleWorld();
  }

  feedback(message, tone = 'good') {
    this.feedbackSerial += 1;
    this.ui.showFeedback(message, tone);
  }

  markAction() {
    this.actions += 1;
    if (this.actions % 8 === 0) this.writeSave({ silent: true });
  }

  motionDelay(milliseconds) {
    if (this.autotest) return 0;
    return this.reducedMotion ? Math.min(120, milliseconds * .18) : milliseconds;
  }

  loop(now) {
    const dt = clamp((now - this.lastFrame) / 1000, 0, .05);
    this.lastFrame = now;
    if (!this.paused) {
      this.world.update(dt);
      if (this.playing && !this.transitioning) {
        this.currentTask?.update(dt);
        this.elapsed += dt;
      }
    }
    this.world.render();
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  snapshot() {
    return {
      screen: this.ui.app.dataset.screen,
      chapterIndex: this.currentIndex,
      chapterId: CHAPTERS[this.currentIndex]?.id,
      highestUnlocked: this.highestUnlocked,
      actions: this.actions,
      elapsed: Math.round(this.elapsed * 100) / 100,
      playing: this.playing,
      paused: this.paused,
      transitioning: this.transitioning,
      worldMode: this.world.mode,
      tree: {
        compression: this.world.tree.state.compression,
        cut: this.world.tree.state.cut,
        raise: this.world.tree.state.raise,
        lights: [...this.world.tree.state.lights],
        ribbons: [...this.world.tree.state.ribbons],
        ornaments: this.world.tree.state.ornaments,
        star: this.world.tree.state.star,
      },
    };
  }

  async runAutotest() {
    this.autotest = true;
    const lines = ['Biltmore Christmas Tree full-game browser test', ''];
    const assertions = [];
    const assert = (condition, message) => {
      if (!condition) throw new Error(message);
      assertions.push(message);
    };

    try {
      this.playing = true;
      this.paused = false;
      this.actions = 0;
      this.elapsed = 0;
      this.highestUnlocked = CHAPTERS.length - 1;
      this.ui.showGame();
      for (let index = 0; index < CHAPTERS.length; index += 1) {
        this.enterChapter(index, { allowLocked: true, writeSave: false, silent: true });
        const task = this.currentTask;
        assert(task.chapter.id === CHAPTERS[index].id, `chapter ${index + 1}: ${CHAPTERS[index].id} entered`);
        task.applyFinal?.();
        this.world.update(.016);
        task.update?.(.016);
        assert(Number.isFinite(this.world.camera.position.x), `chapter ${index + 1}: camera remains finite`);
        task.exit();
        lines.push(`PASS ${String(index + 1).padStart(2, '0')}  ${CHAPTERS[index].id}`);
      }
      this.world.showFinishedNight();
      this.world.update(.016);
      assert(this.world.tree.state.star >= .99, 'finished tree retains its topper');
      assert(this.world.tree.state.ornaments >= .99, 'finished tree retains its ornaments');
      assert(this.world.tree.state.lights.every((value) => value >= .99), 'finished tree retains all three light circuits');
      this.ui.openChapterSheet();
      assert(!this.ui.chapterSheet.hidden, 'chapter sheet opens');
      this.ui.closeChapterSheet();
      assert(this.ui.chapterSheet.hidden, 'chapter sheet closes');
      assert(document.querySelectorAll('#chapter-list li').length === CHAPTERS.length, 'chapter map lists all 17 jobs');
      assert(document.documentElement.scrollWidth <= window.innerWidth + 2, 'no page-level horizontal overflow');
      lines.push('', `PASS — ${CHAPTERS.length} chapters, ${assertions.length} assertions`);
      document.body.dataset.autotest = 'pass';
      this.ui.showAutotest(lines);
      console.info(lines.join('\n'));
      return { passed: true, assertions, lines };
    } catch (error) {
      lines.push('', `FAIL — ${error.stack || error.message || error}`);
      document.body.dataset.autotest = 'fail';
      this.ui.showAutotest(lines);
      console.error(error);
      return { passed: false, error, assertions, lines };
    }
  }

  dispose() {
    cancelAnimationFrame(this.animationFrame);
    this.currentTask?.exit();
    this.world.dispose();
  }
}

export function startGame() {
  return new ChristmasTreeGame();
}
