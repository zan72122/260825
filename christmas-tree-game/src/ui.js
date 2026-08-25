import { clamp, formatTime } from './helpers.js';

const iconPaths = {
  measure: '<path d="M8 25 24 9m-13-3 15 15M6 10l4-4 16 16-4 4zM12 9l-2 2m6 2-2 2m6 2-2 2"/>',
  tree: '<path d="m16 3-5 8h3l-6 9h6v8h4v-8h6l-6-9h3z"/>',
  tag: '<path d="M5 7v8l10 10 10-10L15 5H7a2 2 0 0 0-2 2Zm6 3h.01"/>',
  rope: '<path d="M9 25c-4-3-4-8 0-11s10-1 10 4-6 8-10 5m7-16c5 2 7 7 4 11m-2 6 5 4"/>',
  saw: '<path d="m5 22 17-12 4 5-17 12zm4-1 2 2m2-5 2 2m2-5 2 2m2-5 2 2"/>',
  truck: '<path d="M3 9h17v12H3zm17 5h5l4 5v2h-9zM8 25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>',
  road: '<path d="M12 3 8 29m12-26 4 26M16 5v5m0 5v5m0 5v4"/>',
  door: '<path d="M6 29V4h16v25M11 4v25m5-13h.01M24 8h4v21"/>',
  carry: '<path d="M5 18h22M8 15v6m16-6v6M11 10l5-5 5 5M16 5v13"/>',
  raise: '<path d="M6 26 24 8m-9 0h9v9M5 27h22M8 27v-5m16 5v-5"/>',
  bolt: '<path d="M12 5h8l4 7-4 7h-8l-4-7zm4 14v9m-4 0h8"/>',
  bag: '<path d="M11 6h10l-2 5c5 3 7 8 6 16H7c-1-8 1-13 6-16zm2 5h6M10 22c4-2 8-2 12 0"/>',
  strap: '<path d="M5 12h22v8H5zm8-4h6v16h-6m-5-8h16"/>',
  water: '<path d="M16 3S8 13 8 20a8 8 0 0 0 16 0c0-7-8-17-8-17Zm-4 18c1 3 3 4 6 4"/>',
  branch: '<path d="M16 29V6m0 7-6-5m6 10 7-6m-7 12-7-6M10 8 7 5m16 7 3-3M9 18l-4-1"/>',
  lights: '<path d="M4 9c7 6 17-4 24 3M7 12v5m7-5v5m7-6v5m6-1v5M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7-1a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>',
  ribbon: '<path d="M16 13c-3-5-9-6-10-2-1 5 5 7 10 4m0-2c3-5 9-6 10-2 1 5-5 7-10 4m0-2v15m0-11-6 9m6-9 6 9"/>',
  ornament: '<path d="M13 7h6m-3-4v4m0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-5 4c3 2 7 2 10 0M9 18c4-2 10-2 14 0"/>',
  star: '<path d="m16 3 3.4 7 7.6 1.1-5.5 5.3 1.3 7.6-6.8-3.6L9.2 24l1.3-7.6L5 11.1 12.6 10z"/>',
  inspect: '<path d="M14 5a10 10 0 1 0 7 17l6 6m-13-18v4m0 8v.01"/>',
  lever: '<path d="M7 26h18M10 26V9h12v17M16 9V5m0 0 8 7M16 5 8 12"/>',
  care: '<path d="M8 28V13m0 0c0-5 4-8 8-8s8 3 8 8M8 13h16M4 19h8m8 0h8M6 24h4m12 0h4"/>',
  broom: '<path d="M21 3 10 22m-3-2 8 5-4 5-8-5zm11-14 3 2"/>',
  crate: '<path d="M5 8h22v19H5zm0 5h22M10 8V5h12v3m-10 9 8 8m0-8-8 8"/>',
  fix: '<path d="M21 4a7 7 0 0 0-8 9L5 21l6 6 8-8a7 7 0 0 0 9-8l-5 5-5-5z"/>',
};

function iconSvg(name) {
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${iconPaths[name] ?? iconPaths.fix}</svg>`;
}

function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing UI element #${id}`);
  return element;
}

export class GameUI {
  constructor(chapters) {
    this.chapters = chapters;
    this.app = byId('app');
    this.canvas = byId('scene');
    this.header = byId('game-header');
    this.titleScreen = byId('title-screen');
    this.hud = byId('hud');
    this.interaction = byId('interaction-layer');
    this.loading = byId('loading');
    this.fatal = byId('fatal-error');
    this.feedbackNode = byId('feedback');
    this.saveChip = byId('save-chip');
    this.chapterCount = byId('chapter-count');
    this.chapterTitle = byId('chapter-title');
    this.taskIcon = byId('task-icon');
    this.taskStep = byId('task-step');
    this.taskInstruction = byId('task-instruction');
    this.taskDetail = byId('task-detail');
    this.progressRing = byId('task-progress-ring');
    this.progressLabel = byId('task-progress-label');
    this.gestureGuide = byId('gesture-guide');
    this.chapterSheet = byId('chapter-sheet');
    this.pauseSheet = byId('pause-sheet');
    this.chapterComplete = byId('chapter-complete');
    this.completeTitle = byId('complete-title');
    this.completeChange = byId('complete-change');
    this.endingScreen = byId('ending-screen');
    this.chapterList = byId('chapter-list');
    this.continueButton = byId('continue-button');
    this.continueLabel = byId('continue-label');
    this.soundButton = byId('sound-button');
    this.autotestReport = byId('autotest-report');
    this.feedbackTimer = 0;
    this.saveTimer = 0;
    this.currentIndex = 0;
    this.highestUnlocked = 0;
    this.issueLayer = document.createElement('div');
    this.issueLayer.className = 'inspection-pins';
    this.issueLayer.setAttribute('aria-hidden', 'true');
    this.app.append(this.issueLayer);
    this.renderChapterList();
  }

  renderChapterList() {
    this.chapterList.replaceChildren();
    this.chapters.forEach((chapter, index) => {
      const item = document.createElement('li');
      item.dataset.index = String(index);
      item.innerHTML = `
        <button class="chapter-list__button" type="button" data-chapter-index="${index}">
          <span class="chapter-list__number">${String(index + 1).padStart(2, '0')}</span>
          <span><strong>${chapter.title}</strong><small>${chapter.short}</small></span>
          <span class="chapter-list__state" aria-hidden="true">○</span>
        </button>`;
      this.chapterList.append(item);
    });
  }

  setChapterSelectionHandler(handler) {
    this.chapterList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-chapter-index]');
      if (!button || button.disabled) return;
      handler(Number(button.dataset.chapterIndex));
    });
  }

  setReady() {
    this.app.classList.remove('is-loading');
    this.app.setAttribute('aria-busy', 'false');
    this.loading.hidden = true;
  }

  showFatal(error) {
    console.error(error);
    this.app.classList.remove('is-loading');
    this.loading.hidden = true;
    this.fatal.hidden = false;
    this.app.classList.add('has-webgl-error');
  }

  showTitle(save = null) {
    this.app.dataset.screen = 'title';
    this.titleScreen.hidden = false;
    this.header.hidden = true;
    this.hud.hidden = true;
    this.interaction.hidden = true;
    this.endingScreen.hidden = true;
    this.chapterComplete.hidden = true;
    this.closeSheets();
    this.clearIssuePins();
    if (save && save.completed === false && save.chapterIndex >= 0) {
      this.continueButton.hidden = false;
      const chapter = this.chapters[Math.min(save.chapterIndex, this.chapters.length - 1)];
      this.continueLabel.textContent = `${String(save.chapterIndex + 1).padStart(2, '0')} · ${chapter.title}`;
    } else {
      this.continueButton.hidden = true;
    }
  }

  showGame() {
    this.app.dataset.screen = 'game';
    this.titleScreen.hidden = true;
    this.header.hidden = false;
    this.hud.hidden = false;
    this.interaction.hidden = false;
    this.endingScreen.hidden = true;
    this.chapterComplete.hidden = true;
    this.closeSheets();
  }

  showEnding({ actions = 0, elapsed = 0 } = {}) {
    this.app.dataset.screen = 'ending';
    this.header.hidden = true;
    this.hud.hidden = true;
    this.interaction.hidden = true;
    this.chapterComplete.hidden = true;
    this.endingScreen.hidden = false;
    byId('ending-jobs').textContent = String(this.chapters.length);
    byId('ending-actions').textContent = String(actions);
    byId('ending-time').textContent = formatTime(elapsed);
  }

  setChapter(index, highestUnlocked = index) {
    this.currentIndex = clamp(index, 0, this.chapters.length - 1);
    this.highestUnlocked = clamp(highestUnlocked, 0, this.chapters.length - 1);
    const chapter = this.chapters[this.currentIndex];
    this.chapterCount.textContent = `${this.currentIndex + 1} / ${this.chapters.length}`;
    this.chapterTitle.textContent = chapter.title;
    [...this.chapterList.children].forEach((item, itemIndex) => {
      const button = item.querySelector('button');
      const state = item.querySelector('.chapter-list__state');
      item.classList.toggle('is-current', itemIndex === this.currentIndex);
      item.classList.toggle('is-done', itemIndex < this.currentIndex || itemIndex < this.highestUnlocked);
      item.classList.toggle('is-locked', itemIndex > this.highestUnlocked);
      button.disabled = itemIndex > this.highestUnlocked;
      state.textContent = itemIndex < this.currentIndex || itemIndex < this.highestUnlocked ? '✓' : itemIndex === this.currentIndex ? '●' : '—';
    });
  }

  setTask({ step = '', instruction = '', detail = '', icon = 'fix' }) {
    this.taskStep.textContent = step;
    this.taskInstruction.textContent = instruction;
    this.taskDetail.textContent = detail;
    this.taskIcon.innerHTML = iconSvg(icon);
  }

  setProgress(value) {
    const progress = clamp(value);
    const circumference = 100.531;
    this.progressRing.style.strokeDashoffset = String(circumference * (1 - progress));
    this.progressLabel.textContent = `${Math.round(progress * 100)}%`;
  }

  setGestureType(type) {
    this.gestureGuide.dataset.gesture = type || 'tap';
  }

  showGestureGuide(type = null) {
    if (type) this.setGestureType(type);
    this.gestureGuide.classList.add('is-visible');
    this.gestureGuide.setAttribute('aria-hidden', 'false');
  }

  hideGestureGuide() {
    this.gestureGuide.classList.remove('is-visible');
    this.gestureGuide.setAttribute('aria-hidden', 'true');
  }

  showFeedback(message, tone = 'good', duration = 1850) {
    window.clearTimeout(this.feedbackTimer);
    this.feedbackNode.textContent = message;
    this.feedbackNode.classList.remove('is-good', 'is-gentle', 'is-visible');
    this.feedbackNode.classList.add(tone === 'gentle' ? 'is-gentle' : 'is-good');
    requestAnimationFrame(() => this.feedbackNode.classList.add('is-visible'));
    this.feedbackTimer = window.setTimeout(() => this.feedbackNode.classList.remove('is-visible'), duration);
  }

  showSaved() {
    window.clearTimeout(this.saveTimer);
    this.saveChip.classList.add('is-visible');
    this.saveTimer = window.setTimeout(() => this.saveChip.classList.remove('is-visible'), 1300);
  }

  openChapterSheet() { this.chapterSheet.hidden = false; }
  closeChapterSheet() { this.chapterSheet.hidden = true; }
  openPause() { this.pauseSheet.hidden = false; }
  closePause() { this.pauseSheet.hidden = true; }
  closeSheets() { this.closeChapterSheet(); this.closePause(); }

  showChapterComplete(chapter) {
    this.completeTitle.textContent = `${chapter.title}、できました`;
    this.completeChange.textContent = chapter.change;
    this.chapterComplete.hidden = false;
  }

  hideChapterComplete() { this.chapterComplete.hidden = true; }

  setSoundEnabled(enabled) {
    this.soundButton.setAttribute('aria-pressed', String(Boolean(enabled)));
  }

  updateIssuePins(pins) {
    const current = new Map([...this.issueLayer.children].map((node) => [node.dataset.issueId, node]));
    pins.forEach((pin) => {
      let node = current.get(pin.id);
      if (!node) {
        node = document.createElement('span');
        node.className = 'inspection-pin';
        node.dataset.issueId = pin.id;
        node.innerHTML = '<i></i>';
        this.issueLayer.append(node);
      }
      current.delete(pin.id);
      node.hidden = !pin.visible || pin.fixed;
      node.style.transform = `translate3d(${Math.round(pin.x)}px, ${Math.round(pin.y)}px, 0)`;
    });
    current.forEach((node) => node.remove());
  }

  clearIssuePins() { this.issueLayer.replaceChildren(); }

  showAutotest(lines) {
    this.autotestReport.hidden = false;
    this.autotestReport.textContent = Array.isArray(lines) ? lines.join('\n') : String(lines);
  }
}
