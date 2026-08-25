'use strict';
const fs = require('fs');
const vm = require('vm');

class ClassList {
  constructor(){ this.set = new Set(); }
  add(...names){ names.forEach(n=>this.set.add(n)); }
  remove(...names){ names.forEach(n=>this.set.delete(n)); }
  contains(n){ return this.set.has(n); }
}
class Element {
  constructor(id=''){
    this.id=id; this.children=[]; this.listeners={}; this.attributes={}; this.classList=new ClassList();
    this.style={setProperty(){}}; this.hidden=false; this.textContent=''; this._innerHTML=''; this.width=0; this.height=0;
  }
  set innerHTML(v){ this._innerHTML=v; }
  get innerHTML(){ return this._innerHTML; }
  appendChild(el){ this.children.push(el); return el; }
  addEventListener(type,fn){ (this.listeners[type] ||= []).push(fn); }
  dispatch(type,event={}){ for(const fn of this.listeners[type]||[]) fn({target:this,currentTarget:this,...event}); }
  setAttribute(k,v){ this.attributes[k]=String(v); }
  getAttribute(k){ return this.attributes[k]; }
  querySelector(sel){ if(sel==='.sheet-close') return elements.sheetClose; return null; }
  querySelectorAll(){ return []; }
  scrollIntoView(){}
  focus(){}
  animate(){ return {cancel(){}}; }
  get offsetWidth(){ return 100; }
  setPointerCapture(){}
}

const ids = ['scene','app','loading','fallback','sceneNumber','sceneKicker','sceneTitle','sceneDescription','featureList','sceneRail','previousButton','nextButton','viewButton','viewLabel','soundButton','celebrateButton','infoButton','infoPanel','sheetClose','meta'];
const elements = Object.fromEntries(ids.map(id=>[id,new Element(id)]));

let drawCalls=0;
const gl = new Proxy({
  VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,ELEMENT_ARRAY_BUFFER:6,STATIC_DRAW:7,FLOAT:8,TRIANGLES:9,UNSIGNED_SHORT:10,DEPTH_TEST:11,LEQUAL:12,COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,BLEND:13,SRC_ALPHA:14,ONE_MINUS_SRC_ALPHA:15,
  createShader(){return {};}, shaderSource(){}, compileShader(){}, getShaderParameter(){return true;}, getShaderInfoLog(){return '';},
  createProgram(){return {};}, attachShader(){}, linkProgram(){}, getProgramParameter(){return true;}, getProgramInfoLog(){return '';}, deleteShader(){}, useProgram(){},
  createBuffer(){return {};}, bindBuffer(){}, bufferData(){}, getAttribLocation(_p,name){return name==='aPosition'?0:1;}, getUniformLocation(){return {};},
  enableVertexAttribArray(){}, vertexAttribPointer(){}, enable(){}, disable(){}, depthFunc(){}, clearColor(){}, clear(){}, viewport(){}, uniformMatrix4fv(){}, uniformMatrix3fv(){}, uniform3fv(){}, uniform1f(){}, drawElements(){drawCalls++;}, blendFunc(){}, depthMask(){}
},{ get(target,prop){ if(prop in target) return target[prop]; return 0; }});
elements.scene.getContext = () => gl;

const document = {
  querySelector(sel){
    if(sel.startsWith('#')) return elements[sel.slice(1)];
    if(sel.startsWith('meta')) return elements.meta;
    return new Element();
  },
  createElement(tag){ return new Element(tag); }
};
let raf=null;
const listeners={};
const windowObj = globalThis;
Object.assign(globalThis, {
  window: windowObj, __AISLE_CAPTURE_MODE__:true, document, innerWidth:1280, innerHeight:800, devicePixelRatio:1,
  location:{href:'http://localhost/?v=1',search:'?v=1'}, history:{replaceState(){}},
  matchMedia(){return {matches:false};}, requestAnimationFrame(cb){raf=cb;return 1;},
  addEventListener(type,fn){(listeners[type] ||= []).push(fn);},
  AudioContext: class {}, webkitAudioContext: class {}
});

const runtimeDir = __dirname + '/../runtime';
const code = fs.readdirSync(runtimeDir).filter(name=>name.endsWith('.jsfrag')).sort().map(name=>fs.readFileSync(runtimeDir+'/'+name,'utf8')).join('\n');
vm.runInThisContext(code,{filename:'app.js'});
if(!globalThis.__AISLE_FESTIVAL_READY__) throw new Error('ready flag was not set');
if(elements.sceneRail.children.length !== 12) throw new Error(`expected 12 tabs, got ${elements.sceneRail.children.length}`);

for(let i=0;i<12;i++){
  const button=elements.sceneRail.children[i];
  const handlers=button.listeners.click||[];
  if(!handlers.length) throw new Error(`tab ${i+1} has no click handler`);
  handlers[0]();
  drawCalls=0;
  if(!raf) throw new Error('render callback missing');
  const frame=raf; raf=null; frame(performance.now()+100+i*16);
  if(drawCalls < 100) throw new Error(`variant ${i+1} drew only ${drawCalls} objects`);
  console.log(`variant A${i+1}: ${drawCalls} draw calls`);
}
console.log('PASS: all 12 variants built and rendered through the WebGL stub');
