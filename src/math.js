export const TAU = Math.PI * 2;
export const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOutCubic = (t) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
export const deg = (v) => v * Math.PI / 180;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const seeded = (seed = 1) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export function hexToRgb(value) {
  if (Array.isArray(value)) return value;
  let s = String(value ?? '#ffffff').replace('#', '').trim();
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const n = Number.parseInt(s, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

export function vec3(x = 0, y = 0, z = 0) { return [x, y, z]; }
export const v3Add = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const v3Sub = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const v3Scale = (a,s) => [a[0]*s,a[1]*s,a[2]*s];
export const v3Dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const v3Cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const v3Length = (a) => Math.hypot(a[0],a[1],a[2]);
export const v3Normalize = (a) => { const l=v3Length(a)||1; return [a[0]/l,a[1]/l,a[2]/l]; };
export const v3Lerp = (a,b,t) => [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];

export function mat4Identity() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

export function mat4Multiply(out, a, b) {
  const r = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let row = 0; row < 4; row++) {
      r[c*4+row] = a[row]*b[c*4] + a[4+row]*b[c*4+1] + a[8+row]*b[c*4+2] + a[12+row]*b[c*4+3];
    }
  }
  out.set(r);
  return out;
}

export function mat4Perspective(out, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  out.set([
    f/aspect,0,0,0,
    0,f,0,0,
    0,0,(far+near)*nf,-1,
    0,0,2*far*near*nf,0
  ]);
  return out;
}

export function mat4Ortho(out, left, right, bottom, top, near, far) {
  out.set([
    2/(right-left),0,0,0,
    0,2/(top-bottom),0,0,
    0,0,-2/(far-near),0,
    -(right+left)/(right-left),-(top+bottom)/(top-bottom),-(far+near)/(far-near),1
  ]);
  return out;
}

export function mat4LookAt(out, eye, center, up = [0,1,0]) {
  const z = v3Normalize(v3Sub(eye, center));
  const x = v3Normalize(v3Cross(up, z));
  const y = v3Cross(z, x);
  out.set([
    x[0],y[0],z[0],0,
    x[1],y[1],z[1],0,
    x[2],y[2],z[2],0,
    -v3Dot(x,eye),-v3Dot(y,eye),-v3Dot(z,eye),1
  ]);
  return out;
}

export function mat4Compose(position = [0,0,0], rotation = [0,0,0], scale = [1,1,1]) {
  const [x,y,z] = rotation;
  const sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
  const out = mat4Identity();
  out[0]=(cy*cz+sy*sx*sz)*scale[0];
  out[1]=(cx*sz)*scale[0];
  out[2]=(-sy*cz+cy*sx*sz)*scale[0];
  out[4]=(-cy*sz+sy*sx*cz)*scale[1];
  out[5]=(cx*cz)*scale[1];
  out[6]=(sy*sz+cy*sx*cz)*scale[1];
  out[8]=(sy*cx)*scale[2];
  out[9]=(-sx)*scale[2];
  out[10]=(cy*cx)*scale[2];
  out[12]=position[0];out[13]=position[1];out[14]=position[2];
  return out;
}

export function normalMatrixFromMat4(m) {
  const a00=m[0],a01=m[1],a02=m[2],a10=m[4],a11=m[5],a12=m[6],a20=m[8],a21=m[9],a22=m[10];
  const b01=a22*a11-a12*a21;
  const b11=-a22*a10+a12*a20;
  const b21=a21*a10-a11*a20;
  let det=a00*b01+a01*b11+a02*b21;
  det=det?1/det:1;
  return new Float32Array([
    b01*det,(-a22*a01+a02*a21)*det,(a12*a01-a02*a11)*det,
    b11*det,(a22*a00-a02*a20)*det,(-a12*a00+a02*a10)*det,
    b21*det,(-a21*a00+a01*a20)*det,(a11*a00-a01*a10)*det
  ]);
}

export function projectPoint(point, viewProj, width, height) {
  const x=point[0],y=point[1],z=point[2];
  const cx=viewProj[0]*x+viewProj[4]*y+viewProj[8]*z+viewProj[12];
  const cy=viewProj[1]*x+viewProj[5]*y+viewProj[9]*z+viewProj[13];
  const cw=viewProj[3]*x+viewProj[7]*y+viewProj[11]*z+viewProj[15];
  if (!cw) return [width*.5,height*.5,1];
  return [(cx/cw*.5+.5)*width,(-cy/cw*.5+.5)*height,cw];
}

export function distance2D(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
export function angle2D(a,b) { return Math.atan2(b.y-a.y,b.x-a.x); }
export function wrapAngle(v) {
  while(v>Math.PI)v-=TAU;
  while(v<-Math.PI)v+=TAU;
  return v;
}
