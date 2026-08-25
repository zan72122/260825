'use strict';
function build01(){
  const s=sceneBase('#170f0a','#4a3222');s.ambient=hex('#34251c');s.camera={eye:[8.4,4.8,10.2],target:[.7,1.65,-.4],fov:39,ortho:0};
  s.lights=[light([-5,7,2],'#ffd69c',2.15),light([4,5,3],'#b06b3f',.65),light([-.4,1,1],'#76402b',.25)];
  s.fog={color:hex('#4a3222'),near:11,far:28};addWorkshop(s);addTools(s);
  bowl(s,[.85,1.28,-.2],[1.22,1.12,1.22],MAT.lacquerBlack,[0,rad(-15),0],'slow-spin');
  torus(s,[.85,1.18,-.2],[.98,.98,.98],M('#21130c',.7,0,.1,1,1),[0,0,0]);
  box(s,[-1.1,1.38,-.45],[.65,.05,.18],MAT.paper,[0,rad(7),0]);
  s.particles={mode:1,size:10,colorA:hex('#765439'),colorB:hex('#b88b55'),points:particles(11,22,[-6,.3,-4],[6,5,4])};return s;
}
function build02(){
  const s=sceneBase('#18262d','#334b55');s.ambient=hex('#20343d');s.camera={eye:[-7.8,4.6,10],target:[.6,1.55,-.6],fov:42,ortho:0};
  s.lights=[light([-5,6,1],'#badbe1',1.65),light([4,4,1],'#6f9aa4',.6),light([0,2,5],'#455d65',.3)];
  s.fog={color:hex('#334b55'),near:9,far:24};addWorkshop(s,{back:'#3f4c4c',floor:'#394347'});
  box(s,[-3.7,3.3,-4.75],[1.62,1.35,.05],M('#6e939f',.18,0,.28,7,1,.58));
  addFuro(s,[4.8,2.05,-3.65],.95);
  bowl(s,[.35,1.29,-.15],[1.18,1.05,1.18],MAT.lacquerBrown,[0,rad(12),0],'slow-spin');
  cyl(s,[-1.2,1.37,.45],[.08,1.25,.08],MAT.woodLight,[0,0,rad(87)]);
  box(s,[1.9,1.43,.65],[.8,.045,.4],MAT.cloth,[0,rad(-6),0]);
  s.particles={mode:2,size:34,colorA:hex('#91b7c1'),colorB:hex('#d1e1e2'),points:particles(22,145,[-8,1,-4],[8,8,6])};return s;
}
function build03(){
  const s=sceneBase('#170908','#41150f');s.ambient=hex('#28100d');s.camera={eye:[7.2,3.65,8.7],target:[.35,1.35,-.1],fov:38,ortho:0};
  s.lights=[light([-2.2,2.0,2.5],'#ff6c32',2.2),light([3,5,-1],'#ffd2a2',.85),light([-5,4,-2],'#6b1c16',.45)];
  s.fog={color:hex('#3d160f'),near:10,far:24};addWorkshop(s,{back:'#3b1b16',floor:'#3a1b14'});
  bowl(s,[.55,1.25,-.15],[1.32,1.17,1.32],MAT.lacquerVermilion,[0,rad(-8),0],'slow-spin');
  box(s,[-2.4,.42,1.2],[1.0,.18,.72],MAT.charcoal);for(let i=0;i<8;i++)sphere(s,[-3.0+i*.18,.72,1.2+(i%2)*.14],[.15,.11,.15],MAT.charcoal);
  box(s,[-2.4,.93,1.2],[.78,.035,.55],M('#8c2d16',.55,0,.08,9,1,.56));
  cyl(s,[2.3,1.42,.65],[.09,1.45,.09],MAT.woodLight,[0,0,rad(90)]);
  box(s,[.2,1.40,.83],[.75,.045,.25],MAT.paper);
  s.particles={mode:1,size:8,colorA:hex('#6d2b17'),colorB:hex('#b95732'),points:particles(33,12,[-3,.4,.4],[-1,2.5,2.2])};return s;
}
function build04(){
  const s=sceneBase('#cfd7d5','#c7d1cf');s.ambient=hex('#788689');s.camera={eye:[-7.4,4.5,9.4],target:[.55,1.45,-.5],fov:41,ortho:0};
  s.lights=[light([-5,7,2],'#eef8f8',2.45),light([5,5,1],'#b4c5c6',.85),light([0,2,5],'#7a8e90',.35)];
  s.fog={color:hex('#c7d1cf'),near:10,far:23};addWorkshop(s,{back:'#737d7c',floor:'#6d6962'});
  box(s,[-3.7,3.3,-4.72],[1.62,1.35,.05],M('#e5ecea',.78,0,.02,5,1));
  box(s,[-3.7,.12,-5.0],[4.4,.32,2.0],MAT.snow);
  bowl(s,[.7,1.28,-.3],[1.2,1.07,1.2],MAT.lacquerBlack,[0,rad(18),0],'slow-spin');
  plate(s,[-1.25,1.23,.25],[.55,.34,.55],MAT.lacquerRed);
  box(s,[2.35,1.4,.65],[.85,.04,.38],MAT.paper,[0,rad(-3),0]);
  return s;
}
function build05(){
  const s=sceneBase('#060504','#17120b');s.ambient=hex('#17130d');s.camera={eye:[1.4,4.6,7.2],target:[0,.55,0],fov:32,ortho:0};
  s.lights=[light([-2.4,5.8,3.8],'#ffe8ad',2.7),light([4,2,1],'#7a5c24',.35)];s.fog={color:hex('#17120b'),near:8,far:18};
  box(s,[0,-.42,0],[7,.25,5],M('#0b0907',.9,0,.03,9,1));
  plate(s,[0,.05,0],[2.42,.46,2.42],MAT.lacquerBlack,[rad(-4),rad(8),0],'slow-spin');
  /* Gold geometry follows the carved grooves; it is reflective metal, not emissive paint. */
  torus(s,[0,.51,0],[1.16,.055,1.16],MAT.gold,[rad(90),0,rad(-18)]);
  torus(s,[.48,.54,.25],[.57,.042,.57],MAT.gold,[rad(90),0,rad(34)]);
  for(let i=0;i<16;i++){const a=i/15*Math.PI*1.55,x=-1.05+Math.cos(a)*.72,z=.18+Math.sin(a)*.72;sphere(s,[x,.54,z],[.045,.025,.045],MAT.gold)}
  cyl(s,[-2.1,.7,1.4],[.055,1.2,.055],MAT.iron,[rad(4),0,rad(82)]);
  cyl(s,[-2.65,.72,1.35],[.105,.72,.105],MAT.woodDark,[rad(4),0,rad(82)]);
  box(s,[2.7,.2,-.4],[.36,.12,.52],MAT.paper,[0,rad(14),0]);return s;
}
function build06(){
  const s=sceneBase('#130d09','#291d13');s.ambient=hex('#251a12');s.camera={eye:[-6.5,4.2,8.5],target:[.25,1.2,-.15],fov:36,ortho:0};
  s.lights=[light([-2,6,3],'#f5d799',1.8),light([4,3,2],'#aa7735',.65),light([0,1,-2],'#5e3522',.25)];s.fog={color:hex('#291d13'),near:9,far:22};
  box(s,[0,-.25,0],[7,.2,5],MAT.woodDark);box(s,[0,1.0,0],[4.8,.18,2.7],MAT.wood);
  bowl(s,[.3,1.25,-.25],[1.22,1.08,1.22],MAT.lacquerBrown,[0,rad(18),0],'slow-spin');
  for(let i=0;i<42;i++){const a=i*.67,r=.72+.25*Math.sin(i*1.7),y=1.95+.23*Math.sin(i*.91),x=.3+Math.cos(a)*r,z=-.25+Math.sin(a)*r;sphere(s,[x,y,z],[.024+(i%4)*.006,.016,.024+(i%4)*.006],MAT.gold)}
  cyl(s,[2.75,1.55,.55],[.18,.78,.18],MAT.woodLight,[0,0,rad(8)]);cyl(s,[2.75,2.15,.55],[.10,.48,.10],MAT.paper,[0,0,rad(8)]);
  box(s,[-2.0,1.32,.5],[.82,.035,.42],MAT.paper,[0,rad(-9),0]);
  s.particles={mode:3,size:9,colorA:hex('#8d682a'),colorB:hex('#e4c36c'),points:particles(66,72,[-1.2,1.8,-1.5],[1.8,4.8,1.4])};return s;
}
function build07(){
  const s=sceneBase('#587d83','#87a5a6');s.ambient=hex('#50696b');s.camera={eye:[8.7,4.6,11.5],target:[0,1.2,-1.5],fov:45,ortho:0};
  s.lights=[light([-5,8,4],'#ffe1a1',2.1),light([5,5,0],'#b8d1ca',.7)];s.fog={color:hex('#87a5a6'),near:13,far:34};
  box(s,[0,-.35,0],[12,.22,9],M('#5a4a35',.82,0,.02,1,1.3));box(s,[0,.02,-7],[14,.07,5],M('#376b74',.22,.02,.22,7,1));
  box(s,[0,.18,-11.5],[14,.22,1.0],M('#5c7471',.9,0,0,9,1.2));box(s,[-7,1,-9],[4,1.3,1.2],M('#526764',.9,0,0,9,1));
  box(s,[0,1.0,.5],[4.5,.2,2.2],MAT.woodLight);for(const x of [-3.7,3.7])for(const z of [-.9,1.7])box(s,[x,.3,z],[.22,.75,.22],MAT.woodDark);
  bowl(s,[.5,1.25,-.1],[1.18,1.04,1.18],MAT.lacquerBlack,[0,rad(-18),0],'slow-spin');
  cyl(s,[-1.5,1.42,.55],[.08,1.1,.08],MAT.woodLight,[0,0,rad(90)]);box(s,[2.0,1.38,.6],[.8,.04,.35],MAT.cloth);
  for(const x of [-5,5])box(s,[x,3.2,-.2],[.18,3.3,.18],MAT.woodDark);box(s,[0,6.0,-.2],[5.2,.18,.18],MAT.woodDark);
  return s;
}
function build08(){
  const s=sceneBase('#2b2018','#4a382b');s.ambient=hex('#403025');s.camera={eye:[7.8,4.5,9.2],target:[.4,1.55,0],fov:38,ortho:0};
  s.lights=[light([-4,7,4],'#ffe0b0',2.0),light([4,4,1],'#b87949',.75),light([0,2,-4],'#786555',.3)];s.fog={color:hex('#4a382b'),near:11,far:24};
  box(s,[0,-.3,0],[8,.2,6],MAT.woodDark);box(s,[0,1.0,.2],[4.8,.18,2.6],MAT.woodLight);
  const layers=[
    {p:[-.55,1.15,-.1],s:[1.45,1.25,1.45],m:MAT.woodLight},
    {p:[-.30,1.22,-.05],s:[1.38,1.20,1.38],m:MAT.cloth},
    {p:[-.05,1.29,0],s:[1.31,1.15,1.31],m:MAT.ground1},
    {p:[.20,1.36,.05],s:[1.24,1.10,1.24],m:MAT.ground2},
    {p:[.45,1.43,.10],s:[1.17,1.05,1.17],m:MAT.ground3},
    {p:[.70,1.50,.15],s:[1.10,1.0,1.10],m:MAT.lacquerBlack}
  ];
  layers.forEach((l,i)=>bowl(s,l.p,l.s,l.m,[0,rad(-18),0],'',i,true));
  box(s,[3.25,1.28,.6],[.08,1.12,.6],M('#d2c2a7',.88,0,0,5,1));for(let i=0;i<6;i++)box(s,[3.36,2.04-i*.31,.61],[.22,.025,.42],layers[i].m);
  cyl(s,[-2.6,1.36,.75],[.10,1.0,.10],MAT.woodDark,[0,0,rad(90)]);return s;
}
