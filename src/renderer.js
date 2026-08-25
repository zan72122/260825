import {
  mat4Identity, mat4Multiply, mat4Perspective, mat4Ortho, mat4LookAt,
  mat4Compose, normalMatrixFromMat4, hexToRgb, v3Length, v3Sub, clamp
} from './math.js';

const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uViewProj;
uniform mat3 uNormalMatrix;
out vec3 vWorld;
out vec3 vNormal;
out vec2 vUv;
void main(){
  vec4 world=uModel*vec4(aPosition,1.0);
  vWorld=world.xyz;
  vNormal=normalize(uNormalMatrix*aNormal);
  vUv=aUv;
  gl_Position=uViewProj*world;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
in vec3 vWorld;
in vec3 vNormal;
in vec2 vUv;
out vec4 outColor;
uniform vec3 uBaseColor;
uniform vec3 uSecondaryColor;
uniform float uRoughness;
uniform float uMetalness;
uniform float uClearcoat;
uniform float uOpacity;
uniform float uPatternScale;
uniform float uWetness;
uniform float uProgress;
uniform int uProgressMode;
uniform int uKind;
uniform float uUnlit;
uniform float uTime;
uniform vec3 uCameraPos;
uniform vec3 uAmbient;
uniform vec3 uHorizon;
uniform vec4 uLightPos[4];
uniform vec3 uLightColor[4];
uniform float uLightPower[4];
uniform int uLightCount;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

float hash31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise3(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float coatingMask(){
  if(uProgressMode==1){return smoothstep(1.03-uProgress,0.92-uProgress,vUv.y);}
  if(uProgressMode==2){return smoothstep(1.04-uProgress,0.91-uProgress,vUv.x);}
  if(uProgressMode==3){float n=noise3(vWorld*8.0+vec3(0.0,uTime*.015,0.0));return smoothstep(.78-uProgress*.72,.95-uProgress*.72,n);}
  if(uProgressMode==4){return smoothstep(.03,.12,uProgress-abs(vUv.x-.5)*1.35);}
  return uProgress;
}
vec3 materialColor(){
  vec3 c=uBaseColor;
  float s=max(.1,uPatternScale);
  if(uKind==1){
    // Subtle, directional pores. Large high-contrast swirls read as synthetic plastic,
    // so the growth pattern stays within the tonal range of unfinished wood.
    float bend=noise3(vec3(vWorld.x*.28,vWorld.y*.45,vWorld.z*.28)*s);
    float lines=sin((vWorld.x*.58+vWorld.z*.16+bend*.74)*31.0)*.5+.5;
    float pores=noise3(vec3(vWorld.x*4.4,vWorld.y*7.5,vWorld.z*4.4)*s);
    c*=mix(.82,1.13,lines*.38+pores*.62);
  }else if(uKind==2){
    float brush=sin(vUv.y*780.0+noise3(vWorld*8.0)*8.0)*.5+.5;
    float depth=noise3(vWorld*s*5.0);
    c*=mix(.77,1.12,brush*.13+depth*.24);
  }else if(uKind==3){
    float warp=step(.56,fract(vUv.x*58.0*s));
    float weft=step(.58,fract(vUv.y*48.0*s));
    c*=mix(.58,1.26,max(warp,weft)*.47+noise3(vWorld*11.0)*.16);
  }else if(uKind==4){
    float grit=noise3(vWorld*s*28.0)+.45*noise3(vWorld*s*67.0);
    c*=mix(.50,1.33,clamp(grit*.73,0.0,1.0));
  }else if(uKind==5){
    float fiber=noise3(vec3(vWorld.x*3.0,vWorld.y*33.0,vWorld.z*3.0)*s);
    c*=mix(.78,1.12,fiber);
  }else if(uKind==6){
    float fleck=step(.66,noise3(vWorld*s*50.0));
    c=mix(c,c*vec3(1.38,1.18,.62),fleck*.72);
  }else if(uKind==7){
    float ripple=sin(vWorld.x*7.0+uTime*.6)+sin(vWorld.z*9.0-uTime*.43);
    c*=.86+.11*ripple;
  }else if(uKind==8){
    float grit=noise3(vWorld*s*24.0);
    c*=mix(.63,1.22,grit);
  }else if(uKind==9){
    c*=mix(.67,1.16,noise3(vWorld*s*9.0));
  }else if(uKind==10){
    float smear=sin(vUv.x*260.0+noise3(vWorld*9.0)*5.0)*.5+.5;
    c*=mix(.5,1.08,smear*.38+noise3(vWorld*7.0)*.3);
  }else if(uKind==11){
    c*=mix(.74,1.12,noise3(vWorld*s*13.0));
  }else if(uKind==12){
    float bands=step(.5,fract(vUv.y*12.0));
    c*=mix(.76,1.12,bands*.18+noise3(vWorld*14.0)*.2);
  }else if(uKind==13){
    float scratched=sin((vUv.x+vUv.y)*1100.0+noise3(vWorld*20.0)*9.0)*.5+.5;
    c*=mix(.76,1.1,scratched*.17);
  }
  float mask=clamp(coatingMask(),0.0,1.0);
  c=mix(c,uSecondaryColor,mask);
  return c;
}
void main(){
  vec3 n=normalize(vNormal),v=normalize(uCameraPos-vWorld);
  vec3 base=materialColor();
  if(uUnlit>.5){outColor=vec4(base,uOpacity);return;}
  float hemi=clamp(n.y*.5+.5,0.0,1.0);
  vec3 lit=base*(uAmbient*mix(.68,1.08,hemi));
  vec3 f0=mix(vec3(.035),base,uMetalness);
  float rough=clamp(uRoughness-uWetness*.28,.035,1.0);
  for(int i=0;i<4;i++){
    if(i>=uLightCount)break;
    vec3 l;float att=1.0;
    if(uLightPos[i].w<.5){l=normalize(uLightPos[i].xyz);}
    else{vec3 d=uLightPos[i].xyz-vWorld;float ds=max(dot(d,d),.15);l=normalize(d);att=1.0/(1.0+.048*ds);}
    float ndl=max(dot(n,l),0.0);
    vec3 h=normalize(l+v);
    float shininess=mix(7.0,210.0,pow(1.0-rough,1.6));
    float spec=pow(max(dot(n,h),0.0),shininess);
    float coat=pow(max(dot(n,h),0.0),260.0)*uClearcoat;
    float wrap=max((dot(n,l)+.18)/1.18,0.0);
    lit+=(base*wrap*(1.0-uMetalness)+f0*spec*(.45+uMetalness*2.2)+vec3(coat))*uLightColor[i]*uLightPower[i]*att;
  }
  float fres=pow(1.0-max(dot(n,v),0.0),4.0);
  vec3 env=mix(vec3(.11,.065,.045),uHorizon,clamp(n.y*.5+.5,0.0,1.0));
  lit+=env*fres*(.055+uClearcoat*.23+uMetalness*.34);
  float dist=distance(uCameraPos,vWorld);
  float fog=smoothstep(uFogNear,uFogFar,dist);
  lit=mix(lit,uFogColor,fog);
  lit=lit/(lit+vec3(.78));
  lit=pow(max(lit,vec3(0.0)),vec3(.9));
  outColor=vec4(lit,uOpacity);
}`;

function compileShader(gl,type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
    const log=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(log||'Shader compile failed');
  }
  return shader;
}
function createProgram(gl,vs,fs){
  const program=gl.createProgram();gl.attachShader(program,compileShader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(program,compileShader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const log=gl.getProgramInfoLog(program);gl.deleteProgram(program);throw new Error(log||'Program link failed');}
  return program;
}

let nodeId=1;
export class Node {
  constructor(options={}){
    this.id=nodeId++;
    this.name=options.name||`node-${this.id}`;
    this.geometry=options.geometry||null;
    this.material=options.material||null;
    this.position=options.position?[...options.position]:[0,0,0];
    this.rotation=options.rotation?[...options.rotation]:[0,0,0];
    this.scale=options.scale?[...options.scale]:[1,1,1];
    this.visible=options.visible!==false;
    this.renderOrder=options.renderOrder||0;
    this.children=[];
    this.parent=null;
    this.userData=options.userData||{};
    this.worldMatrix=mat4Identity();
  }
  add(child){if(child.parent)child.parent.remove(child);child.parent=this;this.children.push(child);return child;}
  remove(child){const i=this.children.indexOf(child);if(i>=0){this.children.splice(i,1);child.parent=null;}return child;}
  clear(){for(const child of this.children)child.parent=null;this.children.length=0;}
  traverse(callback){callback(this);for(const child of this.children)child.traverse(callback);}
}

export class Scene extends Node {
  constructor(){
    super({name:'scene'});
    this.background=[.07,.04,.025];
    this.fogColor=[.08,.05,.035];
    this.fogNear=8;
    this.fogFar=21;
    this.ambient=[.30,.27,.23];
    this.horizon=[.28,.24,.19];
    this.lights=[];
  }
}

export class Camera {
  constructor(){
    this.position=[0,3.2,7.5];
    this.target=[0,1,0];
    this.up=[0,1,0];
    this.fov=42;
    this.near=.05;
    this.far=60;
    this.projection='perspective';
    this.orthoSize=5;
    this.view=mat4Identity();
    this.proj=mat4Identity();
    this.viewProj=mat4Identity();
  }
  update(aspect){
    mat4LookAt(this.view,this.position,this.target,this.up);
    if(this.projection==='orthographic'){
      const h=this.orthoSize,w=h*aspect;mat4Ortho(this.proj,-w,w,-h,h,this.near,this.far);
    }else mat4Perspective(this.proj,this.fov*Math.PI/180,aspect,this.near,this.far);
    mat4Multiply(this.viewProj,this.proj,this.view);
  }
}

export function makeMaterial(options={}){
  return {
    color:hexToRgb(options.color||'#ffffff'),
    secondary:hexToRgb(options.secondary||options.color||'#ffffff'),
    roughness:options.roughness??.72,
    metalness:options.metalness??0,
    clearcoat:options.clearcoat??0,
    opacity:options.opacity??1,
    kind:options.kind??0,
    patternScale:options.patternScale??1,
    wetness:options.wetness??0,
    progress:options.progress??0,
    progressMode:options.progressMode??0,
    unlit:options.unlit?1:0,
    doubleSided:options.doubleSided??false,
    transparent:options.transparent??((options.opacity??1)<.999),
  };
}

export class Renderer {
  constructor(canvas){
    this.canvas=canvas;
    const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:'high-performance'});
    if(!gl)throw new Error('WebGL2 unavailable');
    this.gl=gl;
    this.program=createProgram(gl,VERTEX_SHADER,FRAGMENT_SHADER);
    this.locations={};
    for(const name of ['uModel','uViewProj','uNormalMatrix','uBaseColor','uSecondaryColor','uRoughness','uMetalness','uClearcoat','uOpacity','uPatternScale','uWetness','uProgress','uProgressMode','uKind','uUnlit','uTime','uCameraPos','uAmbient','uHorizon','uLightPos','uLightColor','uLightPower','uLightCount','uFogColor','uFogNear','uFogFar']){
      this.locations[name]=gl.getUniformLocation(this.program,name);
    }
    this.geometryCache=new Map();
    this.pixelRatio=1;
    this.maxPixelRatio=2;
    this.width=0;this.height=0;
    this.time=0;
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
  }
  resize(){
    const rect=this.canvas.getBoundingClientRect();
    const dpr=Math.min(this.maxPixelRatio,window.devicePixelRatio||1);
    const w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));
    if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;this.width=w;this.height=h;this.pixelRatio=dpr;this.gl.viewport(0,0,w,h);return true;}
    return false;
  }
  uploadGeometry(geometry){
    const gl=this.gl;
    let cache=this.geometryCache.get(geometry.id);
    if(cache&&cache.version===geometry.version)return cache;
    if(!cache){cache={vao:gl.createVertexArray(),position:gl.createBuffer(),normal:gl.createBuffer(),uv:gl.createBuffer(),index:gl.createBuffer(),version:-1};this.geometryCache.set(geometry.id,cache);}
    gl.bindVertexArray(cache.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,cache.position);gl.bufferData(gl.ARRAY_BUFFER,geometry.positions,geometry.dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,cache.normal);gl.bufferData(gl.ARRAY_BUFFER,geometry.normals,geometry.dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,cache.uv);gl.bufferData(gl.ARRAY_BUFFER,geometry.uvs,geometry.dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cache.index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geometry.indices,geometry.dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
    gl.bindVertexArray(null);cache.count=geometry.indices.length;cache.version=geometry.version;return cache;
  }
  updateWorld(node,parentWorld=null){
    const local=mat4Compose(node.position,node.rotation,node.scale);
    if(parentWorld)mat4Multiply(node.worldMatrix,parentWorld,local);else node.worldMatrix.set(local);
    for(const child of node.children)this.updateWorld(child,node.worldMatrix);
  }
  render(scene,camera,time=0){
    const gl=this.gl;this.resize();this.time=time;
    camera.update(this.canvas.width/this.canvas.height);
    this.updateWorld(scene,null);
    gl.clearColor(...scene.background,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.locations.uViewProj,false,camera.viewProj);
    gl.uniform3fv(this.locations.uCameraPos,camera.position);
    gl.uniform3fv(this.locations.uAmbient,scene.ambient);
    gl.uniform3fv(this.locations.uHorizon,scene.horizon);
    gl.uniform3fv(this.locations.uFogColor,scene.fogColor);
    gl.uniform1f(this.locations.uFogNear,scene.fogNear);
    gl.uniform1f(this.locations.uFogFar,scene.fogFar);
    gl.uniform1f(this.locations.uTime,time);
    const lightPos=new Float32Array(16),lightColor=new Float32Array(12),lightPower=new Float32Array(4);
    const count=Math.min(4,scene.lights.length);
    for(let i=0;i<count;i++){
      const l=scene.lights[i],p=l.position||[0,1,0];
      lightPos.set([p[0],p[1],p[2],l.type==='directional'?0:1],i*4);
      lightColor.set(hexToRgb(l.color||'#ffffff'),i*3);lightPower[i]=l.power??1;
    }
    gl.uniform4fv(this.locations.uLightPos,lightPos);gl.uniform3fv(this.locations.uLightColor,lightColor);gl.uniform1fv(this.locations.uLightPower,lightPower);gl.uniform1i(this.locations.uLightCount,count);
    const opaque=[],transparent=[];
    scene.traverse(node=>{
      if(node===scene||!node.visible||!node.geometry||!node.material)return;
      const item={node,distance:v3Length(v3Sub([node.worldMatrix[12],node.worldMatrix[13],node.worldMatrix[14]],camera.position))};
      (node.material.transparent||node.material.opacity<.999?transparent:opaque).push(item);
    });
    opaque.sort((a,b)=>a.node.renderOrder-b.node.renderOrder);
    transparent.sort((a,b)=>(a.node.renderOrder-b.node.renderOrder)||(b.distance-a.distance));
    gl.depthMask(true);for(const item of opaque)this.draw(item.node);
    gl.depthMask(false);for(const item of transparent)this.draw(item.node);gl.depthMask(true);
    gl.bindVertexArray(null);
  }
  draw(node){
    const gl=this.gl,m=node.material,g=this.uploadGeometry(node.geometry);
    if(m.doubleSided)gl.disable(gl.CULL_FACE);else gl.enable(gl.CULL_FACE);
    gl.uniformMatrix4fv(this.locations.uModel,false,node.worldMatrix);gl.uniformMatrix3fv(this.locations.uNormalMatrix,false,normalMatrixFromMat4(node.worldMatrix));
    gl.uniform3fv(this.locations.uBaseColor,m.color);gl.uniform3fv(this.locations.uSecondaryColor,m.secondary);
    gl.uniform1f(this.locations.uRoughness,clamp(m.roughness));gl.uniform1f(this.locations.uMetalness,clamp(m.metalness));gl.uniform1f(this.locations.uClearcoat,clamp(m.clearcoat));gl.uniform1f(this.locations.uOpacity,clamp(m.opacity));gl.uniform1f(this.locations.uPatternScale,m.patternScale);gl.uniform1f(this.locations.uWetness,clamp(m.wetness));gl.uniform1f(this.locations.uProgress,clamp(m.progress));gl.uniform1i(this.locations.uProgressMode,m.progressMode|0);gl.uniform1i(this.locations.uKind,m.kind|0);gl.uniform1f(this.locations.uUnlit,m.unlit?1:0);
    gl.bindVertexArray(g.vao);gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_INT,0);
  }
  dispose(){
    const gl=this.gl;for(const cache of this.geometryCache.values()){gl.deleteVertexArray(cache.vao);gl.deleteBuffer(cache.position);gl.deleteBuffer(cache.normal);gl.deleteBuffer(cache.uv);gl.deleteBuffer(cache.index);}gl.deleteProgram(this.program);
  }
}
