'use strict';
const M=(color,roughness=.65,metalness=0,clearcoat=0,kind=0,scale=1,opacity=1)=>({color:hex(color),roughness,metalness,clearcoat,kind,scale,opacity});
const MAT={
  wood:M('#6e4328',.72,0,.03,1,1.2), woodLight:M('#b98650',.68,0,.03,1,1.1), woodDark:M('#3a2418',.78,0,.02,1,1.5),
  lacquerBlack:M('#100d0b',.2,0,.78,2,1.2), lacquerBrown:M('#28120c',.25,0,.64,2,1.1), lacquerRed:M('#8b170f',.24,0,.68,2,1.2),
  lacquerVermilion:M('#bd2b16',.28,0,.62,2,1.1), cloth:M('#a99579',.82,0,0,3,1), ground1:M('#6b5039',.95,0,0,4,.8),
  ground2:M('#8a6b4c',.93,0,0,4,1.2), ground3:M('#a38663',.9,0,0,4,1.8), paper:M('#d9d0ba',.92,0,0,5,1),
  gold:M('#c99a35',.28,.92,.12,6,1.2), iron:M('#383733',.58,.65,.05,0,1), stone:M('#72716b',.92,0,0,9,1.2),
  water:M('#2a5260',.18,.05,.35,7,1,.72), blue:M('#154055',.8,0,0,8,2), white:M('#e7e5dd',.72,0,.02,0,1),
  ink:M('#191b1b',.62,0,.08,10,1), charcoal:M('#211714',.92,0,0,9,1.3), snow:M('#dde4e2',.84,0,.02,5,.7),
  plaster:M('#9a8d78',.94,0,0,9,.8), greenWood:M('#405346',.82,0,.02,1,1.1)
};
const mesh=(geometry,position,scale,material,rotation=[0,0,0],anim='',seed=0)=>({geometry,position,scale,material,rotation,anim,seed});
const add=(scene,geometry,p,s,mat,r=[0,0,0],anim='',seed=0)=>scene.objects.push(mesh(geometry,p,s,mat,r,anim,seed));
const box=(scene,p,s,mat,r=[0,0,0],anim='',seed=0)=>add(scene,'box',p,s,mat,r,anim,seed);
const cyl=(scene,p,s,mat,r=[0,0,0],anim='',seed=0)=>add(scene,'cylinder',p,s,mat,r,anim,seed);
const bowl=(scene,p,s,mat,r=[0,0,0],anim='',seed=0,partial=false)=>add(scene,partial?'bowl270':'bowl',p,s,mat,r,anim,seed);
const plate=(scene,p,s,mat,r=[0,0,0],anim='',seed=0)=>add(scene,'plate',p,s,mat,r,anim,seed);
const sphere=(scene,p,s,mat,r=[0,0,0],anim='',seed=0)=>add(scene,'sphere',p,s,mat,r,anim,seed);
const torus=(scene,p,s,mat,r=[0,0,0],anim='',seed=0)=>add(scene,'torus',p,s,mat,r,anim,seed);

function rng(seed=1){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}
function particles(seed,count,min,max){
  const r=rng(seed),points=[];for(let i=0;i<count;i++)points.push([min[0]+r()*(max[0]-min[0]),min[1]+r()*(max[1]-min[1]),min[2]+r()*(max[2]-min[2])]);return points;
}
function sceneBase(clear='#17110d',fog='#2a2019'){
  return {clear:hex(clear),ambient:hex('#30261f'),fog:{color:hex(fog),near:10,far:27},posterize:0,
    camera:{eye:[7,4.5,9],target:[0,1.35,0],fov:42,ortho:0},lights:[],objects:[],particles:null};
}
function light(position,color='#fff2d5',power=1.2,directional=false){return{position,color:hex(color),power,directional}}

function addWorkshop(scene,{table=true,window=true,shelves=true,back='#4b392c',floor='#4c3425'}={}){
  box(scene,[0,-.15,0],[9,.18,8],M(floor,.86,0,.01,1,1.2));
  box(scene,[0,3.8,-5.3],[9,4,.16],M(back,.92,0,.01,9,.8));
  box(scene,[-7.8,3.4,0],[.18,3.6,5.4],MAT.woodDark);
  if(table){
    box(scene,[1,1.05,.1],[4.4,.22,2.2],MAT.woodLight);
    for(const x of [-2.8,4.8])for(const z of [-1.55,1.55])box(scene,[x,.35,z],[.22,.72,.22],MAT.woodDark);
  }
  if(window){
    box(scene,[-3.7,3.3,-5.0],[1.7,1.45,.12],M('#c8ab7d',.56,0,.02,5,.8));
    box(scene,[-3.7,3.3,-4.82],[.08,1.62,.08],MAT.woodDark);box(scene,[-3.7,3.3,-4.82],[1.82,.08,.08],MAT.woodDark);
    box(scene,[-4.55,3.3,-4.80],[.055,1.55,.06],MAT.woodDark);box(scene,[-2.85,3.3,-4.80],[.055,1.55,.06],MAT.woodDark);
    box(scene,[-3.7,2.6,-4.80],[1.75,.055,.06],MAT.woodDark);box(scene,[-3.7,4.0,-4.80],[1.75,.055,.06],MAT.woodDark);
  }
  if(shelves){
    for(const y of [2.1,3.55])box(scene,[4.5,y,-4.7],[2.4,.12,.46],MAT.woodDark);
    [[3.2,2.35],[4.5,2.35],[5.8,2.35],[3.5,3.8],[4.8,3.8],[6.0,3.8]].forEach((p,i)=>bowl(scene,[p[0],p[1],-4.35],[.44,.34,.44],i%3?MAT.lacquerBlack:MAT.lacquerRed,[0,0,0],'',i));
  }
}
function addTools(scene,y=1.42){
  cyl(scene,[1.35,y,.65],[.16,.54,.16],MAT.iron,[0,0,rad(90)]);
  cyl(scene,[2.25,y,.65],[.08,1.15,.08],MAT.woodLight,[0,0,rad(90)]);
  box(scene,[.7,y,.68],[.5,.055,.13],MAT.paper,[0,rad(-5),0]);
  cyl(scene,[-1.6,y,.55],[.34,.12,.34],MAT.stone);
  box(scene,[-.2,y,.75],[.9,.045,.35],MAT.paper,[0,rad(4),0]);
}
function addFuro(scene,p=[3.9,1.9,-3.7],scale=1){
  box(scene,p,[1.65*scale,1.95*scale,1.15*scale],MAT.woodDark);
  box(scene,[p[0],p[1],p[2]+1.18*scale],[1.38*scale,1.62*scale,.08*scale],M('#251a14',.9,0,.02,1,1.1));
  for(const y of [p[1]-.85*scale,p[1],p[1]+.85*scale])box(scene,[p[0],y,p[2]+1.30*scale],[1.15*scale,.05*scale,.05*scale],MAT.wood);
}
