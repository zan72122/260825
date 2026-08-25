import { clamp, distance2D, angle2D, wrapAngle, TAU, lerp } from './math.js';

function makeTrace(kind,count=72){
  const points=[];
  for(let i=0;i<count;i++){
    const t=i/(count-1);
    if(kind==='crack')points.push({x:.5+Math.sin(t*5.4)*.025,y:.34+t*.34});
    else if(kind==='rim'){
      const a=Math.PI*.12+t*Math.PI*.76;points.push({x:.5+Math.cos(a)*.23,y:.46-Math.sin(a)*.14});
    }else{
      points.push({x:.31+t*.40,y:.48+Math.sin(t*Math.PI*2.35)*.035-Math.sin(t*Math.PI)*.075});
    }
  }
  return points;
}

export class TaskEngine{
  constructor(options){
    this.canvas=options.canvas;this.world=options.world;this.onProgress=options.onProgress||(()=>{});this.onComplete=options.onComplete||(()=>{});this.onHint=options.onHint||(()=>{});this.onChoice=options.onChoice||(()=>{});this.onFeedback=options.onFeedback||(()=>{});
    this.chapter=null;this.step=null;this.state=null;this.progress=0;this.raw=0;this.enabled=false;this.pointerId=null;this.start=null;this.last=null;this.virtual=null;this.totalMove=0;this.lastStrokeAt=0;this.angleTotal=0;this.lastAngle=null;this.coverage=new Set();this.spots=new Set();this.idle=0;this.hintShown=false;this.dragging=false;this.dragProgress=0;this.longStrokeStart=null;this.tracePoints=[];
  }

  setTask(chapter,step,state={}){
    this.chapter=chapter;this.step=step;this.state=state;this.progress=0;this.raw=0;this.enabled=Boolean(step);this.pointerId=null;this.start=null;this.last=null;this.virtual=null;this.totalMove=0;this.lastStrokeAt=0;this.angleTotal=0;this.lastAngle=null;this.coverage.clear();this.spots.clear();this.idle=0;this.hintShown=false;this.dragging=false;this.dragProgress=0;this.longStrokeStart=null;this.tracePoints=step?.trace?makeTrace(step.trace):[];
    this.onHint(false,step?.mode);
    this.onProgress(0,step);
  }

  selectChoice(type,id){
    if(!this.enabled||this.step?.mode!=='choice')return;
    this.state[type]=id;this.world.applyChoice(type,id);this.onChoice(type,id);this.setProgress(1);setTimeout(()=>this.finish(),420);
  }

  pointFromEvent(event){
    const rect=this.canvas.getBoundingClientRect();
    return {x:clamp((event.clientX-rect.left)/rect.width),y:clamp((event.clientY-rect.top)/rect.height),time:performance.now()};
  }

  amplify(point){
    if(!this.virtual||!this.last)return {...point};
    const dx=(point.x-this.last.x)*1.45,dy=(point.y-this.last.y)*1.45;
    return {x:clamp(this.virtual.x+dx),y:clamp(this.virtual.y+dy),time:point.time};
  }

  pointerDown(event){
    if(!this.enabled||this.pointerId!==null||this.step?.mode==='choice')return;
    const p=this.pointFromEvent(event);this.pointerId=event.pointerId;this.start={...p};this.last={...p};this.virtual={...p};this.totalMove=0;this.idle=0;this.hintShown=false;this.onHint(false,this.step.mode);this.dragging=this.step.mode==='drag';this.longStrokeStart={...p};this.lastAngle=null;
    try{this.canvas.setPointerCapture(event.pointerId);}catch{}
    this.world.setPointer({...p,down:true});
    if(this.step.mode==='dial'){const c=this.dialCenter();this.lastAngle=angle2D(c,p);}
    if(this.step.mode==='circle'){const c=this.workCenter();this.lastAngle=angle2D(c,p);}
  }

  pointerMove(event){
    if(!this.enabled||event.pointerId!==this.pointerId||!this.last)return;
    const physical=this.pointFromEvent(event),p=this.amplify(physical),dx=p.x-this.virtual.x,dy=p.y-this.virtual.y,dist=Math.hypot(dx,dy);
    this.virtual=p;this.totalMove+=dist;this.idle=0;this.world.setPointer({...p,down:true});
    const mode=this.step.mode;
    if(dist>.0015){
      if(mode==='swipe-x')this.swipeAxis(dx,dy,'x',p);
      else if(mode==='swipe-y')this.swipeAxis(dx,dy,'y',p);
      else if(mode==='swipe-free')this.freeSwipe(dist,p);
      else if(mode==='circle')this.circleMove(p);
      else if(mode==='trace')this.traceMove(p);
      else if(mode==='drag')this.dragMove(p);
      else if(mode==='long-stroke'){this.world.addStroke(this.step,p,dist);}
      else if(mode==='dial')this.dialMove(p);
      else if(mode==='sprinkle')this.sprinkleMove(dist,p);
      else if(mode==='rotate')this.rotateMove(dx,p);
      else if(mode==='radial')this.world.addStroke(this.step,p,dist);
      else if(mode==='tap-repeat'&&this.step.id==='fill-pits')this.world.addStroke(this.step,p,dist);
    }
    this.last=physical;
  }

  pointerUp(event){
    if(event.pointerId!==this.pointerId)return;
    const p=this.virtual||this.pointFromEvent(event);this.world.setPointer({...p,down:false});
    const mode=this.step?.mode;
    if(this.enabled){
      if(mode==='tap-target')this.tapTarget(p);
      else if(mode==='tap-repeat')this.tapRepeat(p);
      else if(mode==='tap-spots')this.tapSpots(p);
      else if(mode==='radial')this.radialEnd(p);
      else if(mode==='long-stroke')this.longStrokeEnd(p);
      else if(mode==='drag')this.dragEnd(p);
    }
    try{this.canvas.releasePointerCapture(event.pointerId);}catch{}
    this.pointerId=null;this.start=null;this.last=null;this.virtual=null;this.lastAngle=null;this.dragging=false;this.longStrokeStart=null;
  }

  pointerCancel(event){if(event.pointerId===this.pointerId){this.world.setPointer({x:.5,y:.5,down:false});this.pointerId=null;this.start=null;this.last=null;this.virtual=null;}}

  workCenter(){return window.innerHeight>window.innerWidth?{x:.5,y:.43}:{x:.5,y:.48};}
  dialCenter(){return window.innerHeight>window.innerWidth?{x:.67,y:.36}:{x:.73,y:.39};}

  swipeAxis(dx,dy,axis,p){
    const primary=axis==='x'?Math.abs(dx):Math.abs(dy),secondary=axis==='x'?Math.abs(dy):Math.abs(dx);
    if(primary<secondary*.45)return;
    const amount=primary*(axis==='x'?3.15:3.65);
    this.addRaw(amount);if(performance.now()-this.lastStrokeAt>34){this.world.addStroke(this.step,p,amount);this.lastStrokeAt=performance.now();}
  }

  freeSwipe(dist,p){this.addRaw(dist*3.0);if(performance.now()-this.lastStrokeAt>34){this.world.addStroke(this.step,p,dist);this.lastStrokeAt=performance.now();}}

  circleMove(p){
    const c=this.workCenter(),a=angle2D(c,p);if(this.lastAngle!==null){const d=Math.abs(wrapAngle(a-this.lastAngle));if(d<.65){this.angleTotal+=d;this.raw=this.angleTotal/TAU;this.setProgress(this.raw/(this.step.target||1));if(performance.now()-this.lastStrokeAt>32){this.world.addStroke(this.step,p,d);this.lastStrokeAt=performance.now();}}}this.lastAngle=a;
  }

  traceMove(p){
    if(!this.tracePoints.length)return;
    let nearest=-1,best=Infinity;
    for(let i=0;i<this.tracePoints.length;i++){const d=distance2D(p,this.tracePoints[i]);if(d<best){best=d;nearest=i;}}
    const radius=window.innerHeight>window.innerWidth?.15:.12;
    if(best<radius){
      for(let j=Math.max(0,nearest-2);j<=Math.min(this.tracePoints.length-1,nearest+2);j++)this.coverage.add(j);
      const snap=this.tracePoints[nearest],magnet={x:lerp(p.x,snap.x,.22),y:lerp(p.y,snap.y,.22)};
      this.world.setPointer({...magnet,down:true});this.world.addStroke(this.step,magnet,1);
      this.setProgress(this.coverage.size/this.tracePoints.length);
    }
  }

  dragConfig(){
    const id=this.step.id,portrait=window.innerHeight>window.innerWidth;
    if(id==='drag-cloth')return {source:portrait?{x:.25,y:.50}:{x:.29,y:.56},target:portrait?{x:.5,y:.37}:{x:.5,y:.43},radius:.23};
    if(id==='place-furo')return {source:portrait?{x:.34,y:.58}:{x:.31,y:.58},target:portrait?{x:.5,y:.30}:{x:.5,y:.36},radius:.28};
    return {source:portrait?{x:.5,y:.42}:{x:.5,y:.47},target:portrait?{x:.69,y:.50}:{x:.72,y:.52},radius:.27};
  }

  dragMove(p){
    const {source,target}=this.dragConfig();const total=Math.max(.001,distance2D(source,target));
    const vx=target.x-source.x,vy=target.y-source.y,px=p.x-source.x,py=p.y-source.y;
    const projection=clamp((px*vx+py*vy)/(total*total));this.dragProgress=Math.max(this.dragProgress,projection);this.setProgress(this.dragProgress*.94);this.world.setProgress(this.dragProgress,this.step,this.state);
  }

  dragEnd(p){
    const {target,radius}=this.dragConfig();if(distance2D(p,target)<radius||this.dragProgress>.82){this.setProgress(1);this.finishSoon();}else{this.onFeedback('もう少し、大きく運ぼう');this.setProgress(this.dragProgress*.72);}
  }

  dialMove(p){
    const c=this.dialCenter(),a=angle2D(c,p);if(this.lastAngle!==null){let d=wrapAngle(a-this.lastAngle);if(Math.abs(d)<.7){this.raw=clamp(this.raw+d*.48,0,this.step.target||1);this.setProgress(this.raw/(this.step.target||1));}}this.lastAngle=a;
  }

  sprinkleMove(dist,p){
    const amount=dist*4.6;this.addRaw(amount);if(performance.now()-this.lastStrokeAt>24){this.world.addStroke(this.step,p,amount);this.lastStrokeAt=performance.now();}
  }

  rotateMove(dx,p){this.addRaw(Math.abs(dx)*1.25);this.world.setPointer({...p,down:true});}

  tapTarget(p){
    if(this.totalMove>.055)return;
    const target=this.workCenter(),radius=window.innerHeight>window.innerWidth?.25:.2;
    if(distance2D(p,target)<radius){this.setProgress(1);this.onFeedback('みつけた！');this.finishSoon();}else this.onFeedback('黒い細い線をさがそう');
  }

  tapRepeat(p){
    if(this.totalMove>.07)return;this.raw+=1;this.setProgress(this.raw/(this.step.target||1));this.world.addStroke(this.step,p,1);
    if(this.progress>=1)this.finishSoon();
  }

  spotTargets(){
    const portrait=window.innerHeight>window.innerWidth;
    if(this.step.inspection)return portrait?[{x:.5,y:.27},{x:.43,y:.42},{x:.5,y:.56}]:[{x:.5,y:.33},{x:.42,y:.46},{x:.5,y:.60}];
    return portrait?[{x:.42,y:.41},{x:.56,y:.34},{x:.60,y:.49}]:[{x:.42,y:.46},{x:.54,y:.38},{x:.61,y:.52}];
  }

  tapSpots(p){
    if(this.totalMove>.06)return;const targets=this.spotTargets();let nearest=-1,best=Infinity;
    targets.forEach((t,i)=>{if(this.spots.has(i))return;const d=distance2D(p,t);if(d<best){best=d;nearest=i;}});
    const radius=window.innerHeight>window.innerWidth?.22:.16;
    if(nearest>=0&&best<radius){this.spots.add(nearest);this.raw=this.spots.size;this.setProgress(this.raw/(this.step.target||targets.length));this.onFeedback(`${this.spots.size}こ め`);if(this.progress>=1)this.finishSoon();}
    else this.onFeedback('光が変わるところをタッチ');
  }

  radialEnd(p){
    if(!this.start)return;const c=this.workCenter(),startD=distance2D(this.start,c),endD=distance2D(p,c);
    if(endD-startD>.08){this.raw+=1;this.setProgress(this.raw/(this.step.target||1));this.world.addStroke(this.step,p,1);if(this.progress>=1)this.finishSoon();}
    else this.onFeedback('まんなかから、外へ');
  }

  longStrokeEnd(p){
    if(!this.longStrokeStart)return;const dy=Math.abs(p.y-this.longStrokeStart.y),dx=Math.abs(p.x-this.longStrokeStart.x);
    if(dy>.17&&dy>dx*.65){this.raw+=1;this.setProgress(this.raw/(this.step.target||1));this.world.addStroke(this.step,p,1);if(this.progress>=1)this.finishSoon();}
    else if(this.totalMove>.03)this.onFeedback('もっと長く、すーっと');
  }

  addRaw(amount){
    if(!this.enabled)return;this.raw+=amount;this.setProgress(this.raw/(this.step.target||1));if(this.progress>=1)this.finishSoon();
  }

  setProgress(value){
    const next=clamp(value);if(next<this.progress)return;this.progress=next;this.world.setProgress(next,this.step,this.state);this.onProgress(next,this.step);
  }

  finishSoon(){if(!this.enabled)return;this.enabled=false;setTimeout(()=>this.finish(),420);}
  finish(){if(this.progress<.999)return;this.enabled=false;this.onComplete(this.step);}

  update(dt){
    if(!this.enabled||this.pointerId!==null||this.step?.mode==='choice')return;
    this.idle+=dt;if(this.idle>2.4&&!this.hintShown){this.hintShown=true;this.onHint(true,this.step.mode);}
  }
}
