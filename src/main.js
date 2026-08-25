import { Renderer } from './renderer.js';
import { WorkshopWorld } from './workshop.js';
import { TaskEngine } from './tasks.js';
import { GameUI } from './ui.js';
import { SoundManager } from './audio.js';
import { CHAPTERS,PROCESS_STATES } from './game-data.js';
import { clamp } from './math.js';

const SAVE_KEY='wajima-124-layers-save-v2';
const DEFAULT_STATE=()=>({
  version:2,started:false,finished:false,chapter:0,step:0,completedChapter:-1,completedStates:[],wood:'keyaki',decoration:'chinkin',sound:true,createdAt:Date.now(),updatedAt:Date.now()
});

function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(!parsed||parsed.version!==2)return DEFAULT_STATE();
    return {...DEFAULT_STATE(),...parsed,completedStates:Array.isArray(parsed.completedStates)?parsed.completedStates:[]};
  }catch{return DEFAULT_STATE();}
}
function saveState(state){
  state.updatedAt=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{}
}

class WajimaGame{
  constructor(){
    this.canvas=document.querySelector('#stage');this.state=loadState();this.sound=new SoundManager();this.sound.setEnabled(this.state.sound!==false);this.paused=false;this.inAuto=false;this.lastTime=performance.now();this.lastGestureSound=0;this.restoreMode='game';
    try{this.renderer=new Renderer(this.canvas);this.world=new WorkshopWorld(this.renderer);}catch(error){console.error(error);document.querySelector('#webgl-error').hidden=false;return;}
    this.ui=new GameUI({handlers:{
      start:resume=>this.start(resume),home:()=>this.goHome(),book:open=>this.onBook(open),exploded:open=>this.onExploded(open),sound:()=>this.toggleSound(),nextChapter:()=>this.nextChapter(),reset:()=>this.reset(),newGame:()=>this.newGame(),finalSpin:()=>this.spinFinal(),jump:index=>this.jump(index)
    }});
    this.ui.setSound(this.sound.enabled);this.ui.updateBook(this.state.completedStates,this.currentProcessIndex());
    this.tasks=new TaskEngine({canvas:this.canvas,world:this.world,onProgress:(p,step)=>this.onProgress(p,step),onComplete:step=>this.onStepComplete(step),onHint:(show,mode)=>this.ui.showHint(show,mode),onChoice:(type,id)=>this.onChoice(type,id),onFeedback:message=>this.feedback(message)});
    this.bindCanvas();this.applyQueryDebug();
    if(this.state.finished){this.showFinal(false);}else{this.world.setHome();this.ui.showHome(this.state);}
    this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
    window.addEventListener('resize',()=>this.renderer.resize());document.addEventListener('visibilitychange',()=>{if(document.hidden)saveState(this.state);});window.addEventListener('beforeunload',()=>saveState(this.state));
  }

  bindCanvas(){
    this.canvas.addEventListener('pointerdown',event=>{if(this.paused||this.inAuto)return;this.sound.ensure();this.sound.tap();this.tasks.pointerDown(event);},{passive:true});
    this.canvas.addEventListener('pointermove',event=>{if(this.paused||this.inAuto)return;this.tasks.pointerMove(event);this.gestureSound();},{passive:true});
    this.canvas.addEventListener('pointerup',event=>{if(this.paused||this.inAuto)return;this.tasks.pointerUp(event);},{passive:true});
    this.canvas.addEventListener('pointercancel',event=>this.tasks.pointerCancel(event),{passive:true});
    window.addEventListener('keydown',event=>{
      if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;
      if(event.key.toLowerCase()==='k'&&this.tasks.enabled){this.tasks.setProgress(1);this.tasks.finishSoon();}
      if(event.key.toLowerCase()==='n')this.nextChapter();
      if(event.key.toLowerCase()==='b')document.querySelector('#book-button')?.click();
      if(event.key.toLowerCase()==='h')this.goHome();
      if(event.key==='ArrowRight'&&event.shiftKey)this.jump(clamp(this.state.chapter+1,0,14));
      if(event.key==='ArrowLeft'&&event.shiftKey)this.jump(clamp(this.state.chapter-1,0,14));
    });
  }

  applyQueryDebug(){
    const query=new URLSearchParams(location.search);
    if(query.has('chapter')){
      this.state={...DEFAULT_STATE(),started:true,chapter:clamp(Number(query.get('chapter'))||0,0,14),step:clamp(Number(query.get('step'))||0,0,3),completedChapter:clamp((Number(query.get('chapter'))||0)-1,-1,14)};
      for(let i=0;i<=this.state.completedChapter;i++)for(const s of CHAPTERS[i].states)this.addCompletedState(s);
      saveState(this.state);setTimeout(()=>this.enterGame(),0);
    }
    if(query.get('complete')==='1'){this.state={...DEFAULT_STATE(),started:true,finished:true,chapter:14,step:2,completedChapter:14,completedStates:PROCESS_STATES.map((_,i)=>i)};saveState(this.state);setTimeout(()=>this.showFinal(false),0);}
  }

  start(resume){
    this.sound.ensure();
    if(!resume){
      if(this.state.started&&!this.state.finished&&this.state.chapter>0&&!window.confirm('保存中のうつわとは別に、最初から作りますか？'))return;
      this.state=DEFAULT_STATE();this.state.started=true;this.state.sound=this.sound.enabled;saveState(this.state);
    }
    this.enterGame();
  }

  enterGame(){
    this.paused=false;this.inAuto=false;this.state.started=true;this.state.finished=false;this.ui.showGame();this.enterStep();
  }

  enterStep(){
    const chapter=CHAPTERS[clamp(this.state.chapter,0,CHAPTERS.length-1)];
    this.state.step=clamp(this.state.step,0,chapter.steps.length-1);
    const step=chapter.steps[this.state.step];
    this.world.setChapter(chapter,step,this.state);
    for(let i=0;i<this.state.step;i++)this.world.setProgress(1,chapter.steps[i],this.state);
    this.world.setStep(step,this.state);
    this.ui.updateChapter(chapter,this.state.chapter,this.state.step,this.state.completedChapter);
    this.ui.updateStep(step,this.state.step,chapter.steps.length);
    this.ui.hideChoice();this.ui.hideComplete();
    this.tasks.setTask(chapter,step,this.state);
    if(step.mode==='choice')this.ui.showChoice(step.choice,this.state[step.choice],id=>this.tasks.selectChoice(step.choice,id));
    this.ui.updateBook(this.state.completedStates,this.currentProcessIndex());saveState(this.state);
  }

  onProgress(progress,step){
    this.ui.setStepProgress(progress);
    if(progress>.02&&progress<.98&&Math.floor(progress*10)!==Math.floor((progress-.02)*10))this.sound.haptic(5);
  }

  onChoice(type,id){this.state[type]=id;saveState(this.state);this.sound.step();}

  onStepComplete(step){
    const chapter=CHAPTERS[this.state.chapter];this.sound.step();this.ui.hideHint();this.ui.hideChoice();
    if(this.state.step<chapter.steps.length-1){
      this.state.step++;saveState(this.state);this.ui.toast('できた。つぎの手しごとへ。',850);setTimeout(()=>this.enterStep(),620);
    }else{
      this.inAuto=true;this.tasks.enabled=false;this.world.beginAuto(chapter,this.state);this.ui.playAuto(chapter.auto,(progress)=>this.world.setAutoProgress(chapter,progress,this.state),()=>{
        this.inAuto=false;this.world.endAuto(chapter,this.state);for(const index of chapter.states)this.addCompletedState(index);this.state.completedChapter=Math.max(this.state.completedChapter,this.state.chapter);saveState(this.state);this.ui.updateBook(this.state.completedStates,this.currentProcessIndex());this.sound.chapter();this.ui.showComplete(chapter);
      });
    }
  }

  nextChapter(){
    this.ui.hideComplete();
    if(this.state.chapter>=CHAPTERS.length-1){
      for(const index of CHAPTERS[14].states)this.addCompletedState(index);this.state.completedChapter=14;this.state.finished=true;saveState(this.state);this.showFinal(true);return;
    }
    this.state.chapter++;this.state.step=0;saveState(this.state);this.enterStep();
  }

  addCompletedState(index){if(!this.state.completedStates.includes(index))this.state.completedStates.push(index);this.state.completedStates.sort((a,b)=>a-b);}

  currentProcessIndex(){
    const chapter=CHAPTERS[clamp(this.state.chapter,0,14)];if(!chapter.states.length)return this.state.completedStates.at(-1)??0;
    const ratio=(this.state.step+.01)/Math.max(1,chapter.steps.length);return chapter.states[Math.min(chapter.states.length-1,Math.floor(ratio*chapter.states.length))];
  }

  feedback(message){this.ui.toast(message,850);this.sound.tap();}

  gestureSound(){
    const now=performance.now();if(now-this.lastGestureSound<95)return;this.lastGestureSound=now;const id=this.tasks.step?.id||'';
    if(id.includes('pour'))this.sound.pour();else if(id.includes('gold'))this.sound.gold();else if(id.includes('sand')||id.includes('lathe')||id.includes('trim')||id.includes('roiro'))this.sound.scrape();else this.sound.brush();
  }

  goHome(){
    saveState(this.state);this.paused=true;this.inAuto=false;this.tasks.enabled=false;this.world.setHome();this.ui.showHome(this.state);
  }

  onBook(open){
    this.paused=open;this.ui.updateBook(this.state.completedStates,this.currentProcessIndex());
    if(!open&&this.ui.explodedPanel.hidden){if(this.state.finished)this.world.setFinal(this.state);else if(this.state.started)this.enterStep();else this.world.setHome();}
  }

  onExploded(open){
    if(open){this.restoreMode=this.state.finished?'final':this.state.started?'game':'home';this.paused=true;this.world.setExplodedView(this.state);}
    else{this.paused=false;if(this.restoreMode==='final')this.world.setFinal(this.state);else if(this.restoreMode==='game')this.enterStep();else this.world.setHome();}
  }

  toggleSound(){this.state.sound=this.sound.toggle();saveState(this.state);return this.sound.enabled;}

  reset(){this.state=DEFAULT_STATE();this.state.sound=this.sound.enabled;saveState(this.state);this.world.setHome();this.ui.showHome(this.state);this.ui.updateBook([],0);this.ui.toast('工程を最初に戻しました。');}
  newGame(){this.state=DEFAULT_STATE();this.state.sound=this.sound.enabled;this.state.started=true;saveState(this.state);this.enterGame();}

  jump(index){
    const max=Math.max(this.state.completedChapter+1,this.state.chapter);if(index>max||index<0||index>=CHAPTERS.length)return;
    this.state.chapter=index;this.state.step=0;this.state.started=true;this.state.finished=false;saveState(this.state);this.enterGame();
  }

  showFinal(withSound=true){
    this.paused=false;this.state.finished=true;this.state.started=true;this.state.chapter=14;this.state.completedChapter=14;for(let i=0;i<PROCESS_STATES.length;i++)this.addCompletedState(i);saveState(this.state);this.tasks.enabled=false;this.world.setFinal(this.state);this.ui.updateBook(this.state.completedStates,31);this.ui.showFinal(this.state);if(withSound)this.sound.finale();
  }

  spinFinal(){this.world.finalSpin+=1.2;this.sound.gold();this.ui.toast('光の帯を、ゆっくり見てみよう。');}

  loop(now){
    const dt=Math.min(.05,Math.max(0,(now-this.lastTime)/1000));this.lastTime=now;
    if(this.renderer){if(!this.paused)this.tasks?.update(dt);this.world.update(dt,now/1000,this.state);this.renderer.render(this.world.scene,this.world.camera,now/1000);requestAnimationFrame(this.loop);}
  }
}

window.__wajimaGame=new WajimaGame();

if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Service worker registration failed',error)));
}
