import { CHAPTERS,PROCESS_STATES,WOOD_CHOICES,DECORATION_CHOICES } from './game-data.js';
import { LAYERS } from './materials.js';
import { clamp } from './math.js';

const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];

export class GameUI{
  constructor(options={}){
    this.handlers=options.handlers||{};
    this.home=$('#home');this.gameUI=$('#game-ui');this.finale=$('#finale');this.bookPanel=$('#book-panel');this.aboutPanel=$('#about-panel');this.explodedPanel=$('#exploded-panel');
    this.startButton=$('#start-button');this.resumeButton=$('#resume-button');this.resumeLabel=$('#resume-label');
    this.chapterTitle=$('#chapter-title');this.chapterKicker=$('#chapter-kicker');this.overallProgress=$('#overall-progress');this.overallLabel=$('#overall-label');
    this.ribbon=$('#chapter-ribbon');this.ribbonNumber=$('#ribbon-number');this.ribbonGroup=$('#ribbon-group');this.ribbonTitle=$('#ribbon-title');
    this.stepLabel=$('#step-label');this.instructionTitle=$('#instruction-title');this.instructionDetail=$('#instruction-detail');this.instructionIcon=$('#instruction-icon');this.stepRing=$('#step-meter-ring');this.stepPercent=$('#step-percent');
    this.chapterDots=$('#chapter-dots');this.choicePanel=$('#choice-panel');this.complete=$('#chapter-complete');this.completeTitle=$('#complete-title');this.completeDetail=$('#complete-detail');this.completeKicker=$('#complete-kicker');
    this.autoSequence=$('#auto-sequence');this.autoProgress=$('#auto-progress');this.autoTitle=$('#auto-title');this.autoDetail=$('#auto-detail');
    this.hintPath=$('#hint-path');this.tapTarget=$('#tap-target');this.ghostHand=$('#ghost-hand');this.toastEl=$('#toast');this.soundButton=$('#sound-button');
    this.processList=$('#process-list');this.bookCount=$('#book-count');this.layerCards=$('#layer-cards');this.toastTimer=null;this.currentChapter=0;this.currentStep=0;this.panelOrigin='game';this.autoRaf=0;
    this.buildChapterDots();this.buildProcessList();this.buildLayerCards();this.bind();
  }

  bind(){
    this.startButton.addEventListener('click',()=>this.handlers.start?.(false));
    this.resumeButton.addEventListener('click',()=>this.handlers.start?.(true));
    $('#about-button').addEventListener('click',()=>this.openPanel(this.aboutPanel));
    $('#close-about-button').addEventListener('click',()=>this.closePanel(this.aboutPanel));
    $('#home-button').addEventListener('click',()=>this.handlers.home?.());
    $('#book-button').addEventListener('click',()=>{this.panelOrigin='game';this.openPanel(this.bookPanel);this.handlers.book?.(true);});
    $('#finale-book-button').addEventListener('click',()=>{this.panelOrigin='final';this.openPanel(this.bookPanel);this.handlers.book?.(true);});
    $('#exploded-button').addEventListener('click',()=>{this.closePanel(this.bookPanel,false);this.openPanel(this.explodedPanel);this.handlers.exploded?.(true);});
    $('#sound-button').addEventListener('click',()=>{const enabled=this.handlers.sound?.();this.setSound(enabled);});
    $('#next-chapter-button').addEventListener('click',()=>this.handlers.nextChapter?.());
    $('#reset-button').addEventListener('click',()=>{if(window.confirm('いままでの工程を消して、最初から作り直しますか？')){this.closePanel(this.aboutPanel);this.handlers.reset?.();}});
    $('#finale-view-button').addEventListener('click',()=>this.handlers.finalSpin?.());
    $('#new-game-button').addEventListener('click',()=>this.handlers.newGame?.());
    $$('[data-close-panel]').forEach(button=>button.addEventListener('click',()=>{
      const panel=button.closest('.panel');this.closePanel(panel);if(panel===this.bookPanel)this.handlers.book?.(false);if(panel===this.explodedPanel)this.handlers.exploded?.(false);
    }));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        const open=[this.explodedPanel,this.bookPanel,this.aboutPanel].find(panel=>!panel.hidden);if(open){this.closePanel(open);if(open===this.explodedPanel)this.handlers.exploded?.(false);if(open===this.bookPanel)this.handlers.book?.(false);}
      }
    });
  }

  buildChapterDots(){
    this.chapterDots.innerHTML='';CHAPTERS.forEach((chapter,index)=>{
      const button=document.createElement('button');button.type='button';button.className='chapter-dot';button.dataset.index=index;button.setAttribute('aria-label',`${chapter.number} ${chapter.title}`);button.innerHTML=`<span>${chapter.number} ${chapter.short}</span>`;button.addEventListener('click',()=>this.handlers.jump?.(index));this.chapterDots.append(button);
    });
  }

  buildProcessList(){
    this.processList.innerHTML='';PROCESS_STATES.forEach((state,index)=>{
      const item=document.createElement('li');item.dataset.index=index;item.innerHTML=`<div><strong>${state.name}</strong><small>${state.group} · ${state.detail}</small></div>`;this.processList.append(item);
    });
  }

  buildLayerCards(){
    this.layerCards.innerHTML='';LAYERS.forEach(layer=>{
      const card=document.createElement('div');card.className='layer-card';card.style.setProperty('--swatch',layer.color);card.innerHTML=`<i></i><div><strong>${layer.name} <small>${layer.reading}</small></strong><small>${layer.detail}</small></div>`;this.layerCards.append(card);
    });
  }

  setSaveAvailable(save){
    const has=Boolean(save&&Number.isFinite(save.chapter)&&(save.chapter>0||save.step>0));
    this.resumeButton.hidden=!has;if(has){const chapter=CHAPTERS[clamp(save.chapter,0,CHAPTERS.length-1)];this.resumeLabel.textContent=`${chapter.number} ${chapter.short} から`;this.startButton.querySelector('strong').textContent='もう一つ つくる';}
    else this.startButton.querySelector('strong').textContent='つくりはじめる';
  }

  showHome(save){
    this.home.classList.add('is-visible');this.gameUI.classList.remove('is-visible');this.finale.hidden=true;this.finale.classList.remove('is-visible');this.closeAllPanels();this.setSaveAvailable(save);this.hideChoice();this.hideComplete();this.autoSequence.hidden=true;
  }

  showGame(){
    this.home.classList.remove('is-visible');this.finale.hidden=true;this.finale.classList.remove('is-visible');this.gameUI.classList.add('is-visible');this.closeAllPanels();
  }

  updateChapter(chapter,index,stepIndex=0,completedChapter=-1){
    this.currentChapter=index;this.currentStep=stepIndex;this.chapterKicker.textContent=`工程 ${chapter.number} · ${chapter.group}`;this.chapterTitle.textContent=chapter.title;this.overallLabel.textContent=`${index+1} / ${CHAPTERS.length}`;this.overallProgress.style.width=`${((index+stepIndex/Math.max(1,chapter.steps.length))/CHAPTERS.length)*100}%`;
    this.ribbonNumber.textContent=chapter.number;this.ribbonGroup.textContent=chapter.group;this.ribbonTitle.textContent=chapter.title;this.ribbon.classList.remove('is-visible');requestAnimationFrame(()=>this.ribbon.classList.add('is-visible'));setTimeout(()=>this.ribbon.classList.remove('is-visible'),2600);
    $$('.chapter-dot',this.chapterDots).forEach((dot,i)=>{dot.classList.toggle('is-current',i===index);dot.classList.toggle('is-done',i<=completedChapter);dot.disabled=i>Math.max(index,completedChapter+1);});
    this.updateStep(chapter.steps[stepIndex],stepIndex,chapter.steps.length);
  }

  updateStep(step,index,total){
    if(!step)return;this.currentStep=index;this.stepLabel.textContent=`その ${index+1} / ${total}`;this.instructionTitle.textContent=step.title;this.instructionDetail.textContent=step.detail;this.instructionIcon.textContent=step.icon;this.setStepProgress(0);this.hideHint();
  }

  setStepProgress(progress){
    const p=clamp(progress);this.stepRing.style.strokeDashoffset=String(119.38*(1-p));this.stepPercent.textContent=String(Math.round(p*100));
  }

  showHint(show,mode='swipe-free'){
    this.hideHint();if(!show)return;
    if(['tap-target','tap-repeat','tap-spots','choice'].includes(mode))this.tapTarget.classList.add('is-visible');
    else if(mode==='drag'||mode==='trace'||mode==='dial'||mode==='circle'||mode==='radial'||mode==='long-stroke'||mode.startsWith('swipe')||mode==='rotate'||mode==='sprinkle'){this.hintPath.classList.add('is-visible');this.ghostHand.classList.add('is-visible');}
  }
  hideHint(){this.hintPath.classList.remove('is-visible');this.tapTarget.classList.remove('is-visible');this.ghostHand.classList.remove('is-visible');}

  showChoice(type,selected,onSelect){
    const choices=type==='wood'?WOOD_CHOICES:DECORATION_CHOICES;this.choicePanel.innerHTML='';this.choicePanel.hidden=false;
    choices.forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='choice-card';button.style.setProperty('--swatch',choice.color);button.classList.toggle('is-selected',choice.id===selected);button.innerHTML=`<i></i><strong>${choice.name}</strong><small>${choice.detail}</small>`;button.addEventListener('click',()=>{[...this.choicePanel.children].forEach(c=>c.classList.remove('is-selected'));button.classList.add('is-selected');onSelect(choice.id);});this.choicePanel.append(button);});
  }
  hideChoice(){this.choicePanel.hidden=true;this.choicePanel.innerHTML='';}

  showComplete(chapter){
    this.hideHint();this.hideChoice();this.completeKicker.textContent=`工程 ${chapter.number} できた！`;this.completeTitle.textContent=chapter.complete.title;this.completeDetail.textContent=chapter.complete.detail;this.complete.hidden=false;
  }
  hideComplete(){this.complete.hidden=true;}

  playAuto(auto,onProgress,onDone){
    if(!auto){onDone?.();return;}
    cancelAnimationFrame(this.autoRaf);this.autoSequence.hidden=false;this.autoProgress.style.width='0%';
    const start=performance.now(),duration=auto.duration||3500,beats=(auto.beats?.length?auto.beats:[{at:0,title:auto.title,detail:auto.detail}]).slice().sort((a,b)=>a.at-b.at);
    let activeBeat=-1;
    const frame=now=>{
      const p=clamp((now-start)/duration);this.autoProgress.style.width=`${p*100}%`;
      let nextBeat=0;for(let i=0;i<beats.length;i++)if(p>=beats[i].at)nextBeat=i;
      if(nextBeat!==activeBeat){activeBeat=nextBeat;this.autoTitle.textContent=beats[activeBeat].title;this.autoDetail.textContent=beats[activeBeat].detail;this.autoSequence.classList.remove('is-beat');requestAnimationFrame(()=>this.autoSequence.classList.add('is-beat'));}
      onProgress?.(p,activeBeat);
      if(p<1)this.autoRaf=requestAnimationFrame(frame);else{setTimeout(()=>{this.autoSequence.hidden=true;this.autoSequence.classList.remove('is-beat');onDone?.();},260);}
    };
    this.autoRaf=requestAnimationFrame(frame);
  }

  updateBook(completed,current=-1){
    const set=new Set(completed);this.bookCount.textContent=`${set.size} / ${PROCESS_STATES.length}`;
    $$('#process-list li').forEach((item,index)=>{item.classList.toggle('is-done',set.has(index));item.classList.toggle('is-current',index===current);});
  }

  openPanel(panel){panel.hidden=false;requestAnimationFrame(()=>panel.classList.add('is-open'));}
  closePanel(panel,restore=true){if(!panel)return;panel.classList.remove('is-open');panel.hidden=true;if(panel===this.explodedPanel&&restore)this.handlers.exploded?.(false);}
  closeAllPanels(){[this.bookPanel,this.aboutPanel,this.explodedPanel].forEach(panel=>panel.hidden=true);}

  setSound(enabled){this.soundButton.textContent=enabled?'♪':'×';this.soundButton.setAttribute('aria-label',enabled?'音を消す':'音を出す');}

  toast(message,duration=1200){clearTimeout(this.toastTimer);this.toastEl.textContent=message;this.toastEl.classList.add('is-visible');this.toastTimer=setTimeout(()=>this.toastEl.classList.remove('is-visible'),duration);}

  showFinal(state){
    this.home.classList.remove('is-visible');this.gameUI.classList.remove('is-visible');this.finale.hidden=false;this.finale.classList.add('is-visible');$('#finale-method').textContent=state.decoration==='makie'?'蒔絵で、能登の波を描きました。':'沈金で、能登の波を彫りました。';$('#finale-date').textContent=new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric'}).format(new Date());
  }
}
