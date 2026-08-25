'use strict';
const $ = (selector) => document.querySelector(selector);
const canvas = $('#stage');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rad = (d) => d * Math.PI / 180;
const hex = (value) => {
  const s = value.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map(c => c + c).join('') : s, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
};

function m4() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
function m4Multiply(out, a, b) {
  const r = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) {
    r[c * 4 + row] = a[row] * b[c * 4] + a[4 + row] * b[c * 4 + 1] + a[8 + row] * b[c * 4 + 2] + a[12 + row] * b[c * 4 + 3];
  }
  out.set(r); return out;
}
function m4Perspective(out, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  out.set([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]); return out;
}
function m4Ortho(out, l, r, b, t, n, f) {
  out.set([2/(r-l),0,0,0, 0,2/(t-b),0,0, 0,0,-2/(f-n),0, -(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]); return out;
}
function v3Normalize(a) {
  const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l,a[1]/l,a[2]/l];
}
function v3Cross(a,b){ return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function v3Sub(a,b){ return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function m4LookAt(out, eye, center, up=[0,1,0]) {
  const z=v3Normalize(v3Sub(eye,center)), x=v3Normalize(v3Cross(up,z)), y=v3Cross(z,x);
  out.set([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
    -(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),
    -(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),
    -(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1]);
  return out;
}
function m4Compose(position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]) {
  const [x,y,z]=rotation, sx=Math.sin(x),cx=Math.cos(x), sy=Math.sin(y),cy=Math.cos(y), sz=Math.sin(z),cz=Math.cos(z);
  const out=m4();
  out[0]=(cy*cz+sy*sx*sz)*scale[0]; out[1]=(cx*sz)*scale[0]; out[2]=(-sy*cz+cy*sx*sz)*scale[0];
  out[4]=(-cy*sz+sy*sx*cz)*scale[1]; out[5]=(cx*cz)*scale[1]; out[6]=(sy*sz+cy*sx*cz)*scale[1];
  out[8]=(sy*cx)*scale[2]; out[9]=(-sx)*scale[2]; out[10]=(cy*cx)*scale[2];
  out[12]=position[0]; out[13]=position[1]; out[14]=position[2];
  return out;
}
function normalFromM4(m) {
  const a00=m[0],a01=m[1],a02=m[2],a10=m[4],a11=m[5],a12=m[6],a20=m[8],a21=m[9],a22=m[10];
  const b01=a22*a11-a12*a21,b11=-a22*a10+a12*a20,b21=a21*a10-a11*a20;
  let det=a00*b01+a01*b11+a02*b21; det=det ? 1/det : 1;
  return new Float32Array([
    b01*det,(-a22*a01+a02*a21)*det,(a12*a01-a02*a11)*det,
    b11*det,(a22*a00-a02*a20)*det,(-a12*a00+a02*a10)*det,
    b21*det,(-a21*a00+a01*a20)*det,(a11*a00-a01*a10)*det
  ]);
}

function geometry(vertices, normals, uvs, indices) {
  return {vertices:new Float32Array(vertices),normals:new Float32Array(normals),uvs:new Float32Array(uvs),indices:new Uint32Array(indices)};
}
function makeBox() {
  const p=[],n=[],u=[],idx=[]; const faces=[
    [[0,0,1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
    [[0,0,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
    [[1,0,0],[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
    [[-1,0,0],[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],
    [[0,1,0],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
    [[0,-1,0],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]
  ];
  faces.forEach((f,fi)=>{const base=p.length/3; for(let i=1;i<5;i++){p.push(...f[i]);n.push(...f[0]);u.push(i===1||i===4?0:1,i<3?0:1)} idx.push(base,base+1,base+2,base,base+2,base+3)});
  return geometry(p,n,u,idx);
}
function makePlane() {
  return geometry([-1,0,-1, 1,0,-1, 1,0,1, -1,0,1],[0,1,0,0,1,0,0,1,0,0,1,0],[0,0,1,0,1,1,0,1],[0,1,2,0,2,3]);
}
function makeCylinder(segments=40, capped=true) {
  const p=[],n=[],u=[],idx=[];
  for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(c,-1,s,c,1,s);n.push(c,0,s,c,0,s);u.push(i/segments,0,i/segments,1)}
  for(let i=0;i<segments;i++){const k=i*2;idx.push(k,k+1,k+3,k,k+3,k+2)}
  if(capped){for(const y of [-1,1]){const base=p.length/3;p.push(0,y,0);n.push(0,y,0);u.push(.5,.5);for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(c,y,s);n.push(0,y,0);u.push(c*.5+.5,s*.5+.5)}for(let i=0;i<segments;i++){if(y>0)idx.push(base,base+i+1,base+i+2);else idx.push(base,base+i+2,base+i+1)}}}
  return geometry(p,n,u,idx);
}
function makeSphere(segments=32,rings=18) {
  const p=[],n=[],u=[],idx=[];
  for(let j=0;j<=rings;j++){const v=j/rings,ph=v*Math.PI;for(let i=0;i<=segments;i++){const q=i/segments*Math.PI*2,x=Math.sin(ph)*Math.cos(q),y=Math.cos(ph),z=Math.sin(ph)*Math.sin(q);p.push(x,y,z);n.push(x,y,z);u.push(i/segments,v)}}
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;idx.push(a,b,a+1,b,b+1,a+1)}
  return geometry(p,n,u,idx);
}
function makeTorus(major=1,minor=.16,segments=48,tube=12,arc=Math.PI*2) {
  const p=[],n=[],u=[],idx=[];
  for(let i=0;i<=segments;i++){const a=i/segments*arc,ca=Math.cos(a),sa=Math.sin(a);for(let j=0;j<=tube;j++){const b=j/tube*Math.PI*2,cb=Math.cos(b),sb=Math.sin(b),r=major+minor*cb;p.push(r*ca,minor*sb,r*sa);n.push(cb*ca,sb,cb*sa);u.push(i/segments,j/tube)}}
  for(let i=0;i<segments;i++)for(let j=0;j<tube;j++){const a=i*(tube+1)+j,b=a+tube+1;idx.push(a,b,a+1,b,b+1,a+1)}
  return geometry(p,n,u,idx);
}
function makeLathe(profile, segments=64, arc=Math.PI*2) {
  const p=[],n=[],u=[],idx=[],count=profile.length;
  const profileNormals=profile.map((pt,i)=>{
    const prev=profile[Math.max(0,i-1)],next=profile[Math.min(count-1,i+1)];
    return v3Normalize([next[1]-prev[1],prev[0]-next[0],0]);
  });
  for(let s=0;s<=segments;s++){const a=s/segments*arc,c=Math.cos(a),z=Math.sin(a);for(let i=0;i<count;i++){const [r,y]=profile[i],pn=profileNormals[i];p.push(r*c,y,r*z);n.push(pn[0]*c,pn[1],pn[0]*z);u.push(s/segments,i/(count-1))}}
  for(let s=0;s<segments;s++)for(let i=0;i<count-1;i++){const a=s*count+i,b=a+count;idx.push(a,b,a+1,b,b+1,a+1)}
  return geometry(p,n,u,idx);
}
const BOWL_PROFILE=[
  [.34,0],[.48,0],[.55,.10],[.62,.17],[.88,.31],[1.18,.62],[1.40,1.03],[1.50,1.38],[1.49,1.47],
  [1.36,1.48],[1.27,1.16],[1.08,.78],[.79,.42],[.52,.24],[.42,.18]
];
const SHALLOW_PROFILE=[
  [.42,0],[.62,0],[.70,.10],[1.18,.22],[1.62,.42],[1.72,.55],[1.65,.62],[1.52,.59],[1.18,.42],[.72,.22],[.50,.15]
];

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
uniform float uRoughness;
uniform float uMetalness;
uniform float uClearcoat;
uniform float uOpacity;
uniform float uPatternScale;
uniform int uKind;
uniform float uPosterize;
uniform float uTime;
uniform vec3 uCameraPos;
uniform vec3 uAmbient;
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
vec3 materialColor(){
  vec3 c=uBaseColor;
  float s=max(.1,uPatternScale);
  if(uKind==1){
    float grain=sin((vWorld.x*2.0+noise3(vWorld*s*.7)*2.8)*10.0)*.5+.5;
    float longGrain=noise3(vec3(vWorld.x*.7,vWorld.y*5.0,vWorld.z*.7)*s);
    c*=mix(.68,1.22,grain*.35+longGrain*.65);
  }else if(uKind==2){
    float brush=sin(vUv.y*920.0+noise3(vWorld*7.0)*7.0)*.5+.5;
    float depth=noise3(vWorld*s*5.0);
    c*=mix(.82,1.10,brush*.16+depth*.25);
  }else if(uKind==3){
    float warp=step(.55,fract(vUv.x*62.0*s));
    float weft=step(.55,fract(vUv.y*48.0*s));
    c*=mix(.64,1.26,max(warp,weft)*.42+noise3(vWorld*10.0)*.18);
  }else if(uKind==4){
    float grit=noise3(vWorld*s*31.0);
    grit+=.45*noise3(vWorld*s*71.0);
    c*=mix(.52,1.30,clamp(grit*.72,0.0,1.0));
  }else if(uKind==5){
    float fiber=noise3(vec3(vWorld.x*2.0,vWorld.y*28.0,vWorld.z*2.0)*s);
    c*=mix(.82,1.08,fiber);
  }else if(uKind==6){
    float fleck=step(.68,noise3(vWorld*s*45.0));
    c=mix(c,c*vec3(1.35,1.18,.68),fleck*.7);
  }else if(uKind==7){
    float ripple=sin(vWorld.x*6.0+uTime*.25)+sin(vWorld.z*8.0-uTime*.18);
    c*=.88+.12*ripple;
  }else if(uKind==8){
    float gx=smoothstep(.94,1.0,fract(vWorld.x*s))+smoothstep(.94,1.0,fract(vWorld.z*s));
    c=mix(c,c*1.55,clamp(gx,0.0,1.0));
  }else if(uKind==9){
    c*=mix(.67,1.18,noise3(vWorld*s*8.0));
  }else if(uKind==10){
    float wash=noise3(vWorld*s*2.2);
    c*=mix(.56,1.18,wash);
  }
  return c;
}
void main(){
  vec3 n=normalize(vNormal),v=normalize(uCameraPos-vWorld);
  vec3 base=materialColor();
  vec3 lit=uAmbient*base;
  vec3 f0=mix(vec3(.035),base,uMetalness);
  for(int i=0;i<4;i++){
    if(i>=uLightCount)break;
    vec3 l;float att=1.0;
    if(uLightPos[i].w<.5){l=normalize(uLightPos[i].xyz);}
    else{vec3 d=uLightPos[i].xyz-vWorld;float ds=max(dot(d,d),.2);l=normalize(d);att=1.0/(1.0+.055*ds);}
    float ndl=max(dot(n,l),0.0);
    if(uPosterize>1.0)ndl=floor(ndl*uPosterize+.5)/uPosterize;
    vec3 h=normalize(l+v);
    float shininess=mix(8.0,150.0,pow(1.0-uRoughness,1.45));
    float spec=pow(max(dot(n,h),0.0),shininess);
    float coat=pow(max(dot(n,h),0.0),190.0)*uClearcoat;
    lit+=(base*ndl*(1.0-uMetalness)+f0*spec*(.45+uMetalness*1.8)+vec3(coat))*uLightColor[i]*uLightPower[i]*att;
  }
  float upward=clamp(n.y*.5+.5,0.0,1.0);
  lit*=mix(.76,1.02,upward);
  float dist=distance(uCameraPos,vWorld);
  float fog=smoothstep(uFogNear,uFogFar,dist);
  lit=mix(lit,uFogColor,fog);
  outColor=vec4(lit,uOpacity);
}`;

const PARTICLE_VERTEX = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 aPosition;
layout(location=1) in float aSeed;
uniform mat4 uViewProj;
uniform float uTime;
uniform int uMode;
uniform float uSize;
out float vAlpha;
out float vSeed;
void main(){
  vec3 p=aPosition;
  if(uMode==1){p.x+=sin(uTime*.23+aSeed*13.0)*.18;p.y+=mod(uTime*.10+aSeed*2.0,1.0)*.45;}
  else if(uMode==2){p.y-=mod(uTime*(1.6+aSeed)+aSeed*8.0,6.0);p.x+=p.y*.13;}
  else if(uMode==3){p.y-=mod(uTime*(.38+aSeed*.4)+aSeed*5.0,3.2);p.x+=sin(uTime+aSeed*30.0)*.08;}
  else if(uMode==4){p.y+=sin(uTime*.25+aSeed*20.0)*.16;p.x+=cos(uTime*.16+aSeed*18.0)*.11;}
  vec4 clip=uViewProj*vec4(p,1.0);
  gl_Position=clip;
  gl_PointSize=uSize/max(.35,clip.w*.13);
  vAlpha=.35+.65*aSeed;vSeed=aSeed;
}`;
const PARTICLE_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
in float vAlpha;
in float vSeed;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform int uMode;
out vec4 outColor;
void main(){
  vec2 p=gl_PointCoord*2.0-1.0;
  float r=length(p);
  if(uMode==2){if(abs(p.x)>.18||abs(p.y)>.92)discard;}
  else if(r>1.0)discard;
  float a=(1.0-smoothstep(.45,1.0,r))*vAlpha;
  if(uMode==2)a=vAlpha*.45;
  outColor=vec4(mix(uColorA,uColorB,vSeed),a);
}`;
