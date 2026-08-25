import { TAU, clamp, v3Normalize, v3Cross, v3Sub } from './math.js';

let geometryId = 1;
export function createGeometry(positions, normals, uvs, indices, dynamic = false) {
  return {
    id: geometryId++,
    positions: positions instanceof Float32Array ? positions : new Float32Array(positions),
    normals: normals instanceof Float32Array ? normals : new Float32Array(normals),
    uvs: uvs instanceof Float32Array ? uvs : new Float32Array(uvs),
    indices: indices instanceof Uint32Array ? indices : new Uint32Array(indices),
    dynamic,
    version: 0,
  };
}

export function touchGeometry(geometry) { geometry.version++; return geometry; }

export function makeBox() {
  const p=[],n=[],u=[],idx=[];
  const faces=[
    [[0,0,1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
    [[0,0,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
    [[1,0,0],[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
    [[-1,0,0],[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],
    [[0,1,0],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
    [[0,-1,0],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]],
  ];
  for (const face of faces) {
    const base=p.length/3;
    for(let i=1;i<5;i++) { p.push(...face[i]); n.push(...face[0]); u.push(i===1||i===4?0:1,i<3?0:1); }
    idx.push(base,base+1,base+2,base,base+2,base+3);
  }
  return createGeometry(p,n,u,idx);
}

export function makePlane() {
  return createGeometry(
    [-1,0,-1, 1,0,-1, 1,0,1, -1,0,1],
    [0,1,0, 0,1,0, 0,1,0, 0,1,0],
    [0,0,1,0,1,1,0,1],
    [0,1,2,0,2,3]
  );
}

export function makeCylinder(segments=40,capped=true) {
  const p=[],n=[],u=[],idx=[];
  for(let i=0;i<=segments;i++) {
    const a=i/segments*TAU,c=Math.cos(a),s=Math.sin(a);
    p.push(c,-1,s,c,1,s); n.push(c,0,s,c,0,s); u.push(i/segments,0,i/segments,1);
  }
  for(let i=0;i<segments;i++) { const k=i*2; idx.push(k,k+1,k+3,k,k+3,k+2); }
  if(capped) {
    for(const y of [-1,1]) {
      const base=p.length/3; p.push(0,y,0); n.push(0,y,0); u.push(.5,.5);
      for(let i=0;i<=segments;i++) {
        const a=i/segments*TAU,c=Math.cos(a),s=Math.sin(a);
        p.push(c,y,s); n.push(0,y,0); u.push(c*.5+.5,s*.5+.5);
      }
      for(let i=0;i<segments;i++) y>0 ? idx.push(base,base+i+1,base+i+2) : idx.push(base,base+i+2,base+i+1);
    }
  }
  return createGeometry(p,n,u,idx);
}

export function makeCone(segments=32) {
  const p=[],n=[],u=[],idx=[];
  const slope=v3Normalize([1,.55,0]);
  for(let i=0;i<=segments;i++) {
    const a=i/segments*TAU,c=Math.cos(a),s=Math.sin(a);
    p.push(c,-1,s,0,1,0);n.push(slope[0]*c,slope[1],slope[0]*s, slope[0]*c,slope[1],slope[0]*s);u.push(i/segments,0,i/segments,1);
  }
  for(let i=0;i<segments;i++){const k=i*2;idx.push(k,k+1,k+3,k,k+3,k+2);}
  const base=p.length/3;p.push(0,-1,0);n.push(0,-1,0);u.push(.5,.5);
  for(let i=0;i<=segments;i++){const a=i/segments*TAU,c=Math.cos(a),s=Math.sin(a);p.push(c,-1,s);n.push(0,-1,0);u.push(c*.5+.5,s*.5+.5)}
  for(let i=0;i<segments;i++)idx.push(base,base+i+2,base+i+1);
  return createGeometry(p,n,u,idx);
}

export function makeSphere(segments=30,rings=18) {
  const p=[],n=[],u=[],idx=[];
  for(let j=0;j<=rings;j++) {
    const v=j/rings,phi=v*Math.PI;
    for(let i=0;i<=segments;i++) {
      const q=i/segments*TAU,x=Math.sin(phi)*Math.cos(q),y=Math.cos(phi),z=Math.sin(phi)*Math.sin(q);
      p.push(x,y,z);n.push(x,y,z);u.push(i/segments,v);
    }
  }
  for(let j=0;j<rings;j++) for(let i=0;i<segments;i++) {
    const a=j*(segments+1)+i,b=a+segments+1;idx.push(a,b,a+1,b,b+1,a+1);
  }
  return createGeometry(p,n,u,idx);
}

export function makeTorus(major=1,minor=.1,segments=56,tube=12,arc=TAU) {
  const p=[],n=[],u=[],idx=[];
  for(let i=0;i<=segments;i++) {
    const a=i/segments*arc,ca=Math.cos(a),sa=Math.sin(a);
    for(let j=0;j<=tube;j++) {
      const b=j/tube*TAU,cb=Math.cos(b),sb=Math.sin(b),r=major+minor*cb;
      p.push(r*ca,minor*sb,r*sa);n.push(cb*ca,sb,cb*sa);u.push(i/segments,j/tube);
    }
  }
  for(let i=0;i<segments;i++) for(let j=0;j<tube;j++) {
    const a=i*(tube+1)+j,b=a+tube+1;idx.push(a,b,a+1,b,b+1,a+1);
  }
  return createGeometry(p,n,u,idx);
}

export function makeLathe(profile,segments=64,arc=TAU,flip=false) {
  const p=[],n=[],u=[],idx=[],count=profile.length;
  const profileNormals=profile.map((pt,i)=>{
    const prev=profile[Math.max(0,i-1)],next=profile[Math.min(count-1,i+1)];
    const normal=v3Normalize([next[1]-prev[1],prev[0]-next[0],0]);
    return flip?[-normal[0],-normal[1],0]:normal;
  });
  for(let s=0;s<=segments;s++) {
    const a=s/segments*arc,c=Math.cos(a),z=Math.sin(a);
    for(let i=0;i<count;i++) {
      const [r,y]=profile[i],pn=profileNormals[i];
      p.push(r*c,y,r*z);n.push(pn[0]*c,pn[1],pn[0]*z);u.push(s/segments,i/(count-1));
    }
  }
  for(let s=0;s<segments;s++) for(let i=0;i<count-1;i++) {
    const a=s*count+i,b=a+count;
    flip ? idx.push(a,a+1,b,b,a+1,b+1) : idx.push(a,b,a+1,b,b+1,a+1);
  }
  return createGeometry(p,n,u,idx);
}

export function makeDisc(segments=48,inner=0) {
  const p=[],n=[],u=[],idx=[];
  if(inner<=0) {
    p.push(0,0,0);n.push(0,1,0);u.push(.5,.5);
    for(let i=0;i<=segments;i++){const a=i/segments*TAU,x=Math.cos(a),z=Math.sin(a);p.push(x,0,z);n.push(0,1,0);u.push(x*.5+.5,z*.5+.5)}
    for(let i=0;i<segments;i++)idx.push(0,i+1,i+2);
  } else {
    for(let i=0;i<=segments;i++){const a=i/segments*TAU,x=Math.cos(a),z=Math.sin(a);p.push(x*inner,0,z*inner,x,0,z);n.push(0,1,0,0,1,0);u.push(x*inner*.5+.5,z*inner*.5+.5,x*.5+.5,z*.5+.5)}
    for(let i=0;i<segments;i++){const k=i*2;idx.push(k,k+1,k+3,k,k+3,k+2)}
  }
  return createGeometry(p,n,u,idx);
}

export function makeRibbon(points,width=.04,normalHint=[0,1,0]) {
  const p=[],n=[],u=[],idx=[];
  if(points.length<2)return createGeometry([],[],[],[]);
  for(let i=0;i<points.length;i++){
    const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
    const tangent=v3Normalize(v3Sub(next,prev));
    let side=v3Normalize(v3Cross(normalHint,tangent));
    if(Math.abs(side[0])+Math.abs(side[1])+Math.abs(side[2])<.01)side=[1,0,0];
    const pt=points[i];
    p.push(pt[0]-side[0]*width,pt[1]-side[1]*width,pt[2]-side[2]*width,pt[0]+side[0]*width,pt[1]+side[1]*width,pt[2]+side[2]*width);
    n.push(...normalHint,...normalHint);u.push(0,i/(points.length-1),1,i/(points.length-1));
  }
  for(let i=0;i<points.length-1;i++){const k=i*2;idx.push(k,k+1,k+3,k,k+3,k+2)}
  return createGeometry(p,n,u,idx);
}

export function makeGridPlane(cols=20,rows=12) {
  const p=[],n=[],u=[],idx=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
    const ux=x/cols,uy=y/rows;p.push(ux*2-1,0,uy*2-1);n.push(0,1,0);u.push(ux,uy);
  }
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const a=y*(cols+1)+x,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);
  }
  return createGeometry(p,n,u,idx,true);
}

export const OUTER_BOWL_PROFILE = [
  [.36,0],[.48,.01],[.56,.08],[.57,.18],[.67,.28],[.86,.43],[1.07,.66],[1.25,.92],[1.42,1.19],[1.52,1.42],[1.53,1.50]
];
export const INNER_BOWL_PROFILE = [
  [.48,.20],[.59,.27],[.75,.40],[.96,.61],[1.16,.86],[1.34,1.16],[1.44,1.40],[1.45,1.46]
];
export const ROUGH_BOWL_PROFILE = [
  [.40,0],[.58,.02],[.66,.12],[.70,.28],[.90,.52],[1.18,.83],[1.48,1.17],[1.68,1.47],[1.68,1.55]
];

export function bowlRadiusAtY(y,inner=false) {
  const profile=inner?INNER_BOWL_PROFILE:OUTER_BOWL_PROFILE;
  if(y<=profile[0][1])return profile[0][0];
  if(y>=profile.at(-1)[1])return profile.at(-1)[0];
  for(let i=0;i<profile.length-1;i++){
    const a=profile[i],b=profile[i+1];
    if(y>=a[1]&&y<=b[1]){const t=(y-a[1])/(b[1]-a[1]);return a[0]+(b[0]-a[0])*t;}
  }
  return profile.at(-1)[0];
}

export function interpolateProfile(a,b,t) {
  const count=Math.min(a.length,b.length),out=[];
  for(let i=0;i<count;i++)out.push([a[i][0]+(b[i][0]-a[i][0])*clamp(t),a[i][1]+(b[i][1]-a[i][1])*clamp(t)]);
  return out;
}
