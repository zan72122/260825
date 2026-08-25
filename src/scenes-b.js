'use strict';
function build09(){
  const s=sceneBase('#e9e8e3','#e9e8e3');s.ambient=hex('#bfc0bd');s.camera={eye:[7.4,3.6,8.2],target:[0,1.2,0],fov:38,ortho:3.4};
  s.lights=[light([-4,8,5],'#ffffff',1.6),light([5,6,2],'#e4e8e7',1.05),light([0,3,-5],'#c4cac8',.45)];s.fog={color:hex('#e9e8e3'),near:18,far:36};
  box(s,[0,-.5,0],[9,.18,7],M('#dddcd6',.88,0,.01,5,1));box(s,[0,3.7,-4.8],[9,4,.12],M('#f1f0eb',.92,0,0,5,1));
  const plinths=[[-2.1,.25,0],[0,.25,-.25],[2.1,.25,0]];plinths.forEach((p,i)=>{box(s,p,[.8,.75,.8],M('#d2d1cc',.82,0,.01,5,1));bowl(s,[p[0],1.05,p[2]],[.7,.62,.7],i===1?MAT.lacquerRed:MAT.lacquerBlack,[0,rad(i*18-18),0],'slow-spin',i)});
  box(s,[0,2.85,-4.5],[3.6,.02,.65],M('#d6d2c9',.86,0,0,5,1),[rad(90),0,0]);return s;
}
function build10(){
  const s=sceneBase('#cfc4ac','#cfc4ac');s.ambient=hex('#8b8171');s.camera={eye:[-7,4.3,8.6],target:[.3,1.1,0],fov:38,ortho:3.8};
  s.lights=[light([-5,8,4],'#fff3d7',1.65),light([4,4,2],'#b8ad98',.55)];s.fog={color:hex('#cfc4ac'),near:15,far:30};
  box(s,[0,-.38,0],[9,.16,7],MAT.paper);box(s,[0,1.0,.2],[4.7,.14,2.55],M('#a99b82',.85,0,.01,5,1));
  bowl(s,[1.0,1.18,-.25],[1.18,1.03,1.18],MAT.lacquerBlack,[0,rad(-10),0],'slow-spin');
  box(s,[-2.4,1.34,-.1],[1.0,.04,.72],MAT.paper,[0,rad(-7),0]);for(let i=0;i<5;i++)sphere(s,[-2.6+i*.35,1.39,-.1+Math.sin(i)*.16],[.14,.012,.05],MAT.ink);
  cyl(s,[-.9,1.43,.9],[.075,1.55,.075],MAT.woodDark,[0,0,rad(92)]);cyl(s,[-.04,1.43,.9],[.15,.42,.15],MAT.ink,[0,0,rad(92)]);
  box(s,[3.0,1.30,.65],[.55,.10,.48],MAT.stone);return s;
}
function build11(){
  const s=sceneBase('#193945','#254956');s.ambient=hex('#294854');s.camera={eye:[7.2,4.8,9.6],target:[.4,1.45,-.5],fov:39,ortho:4.3};s.posterize=3;
  s.lights=[light([-4,7,4],'#f4cf82',1.75),light([5,4,1],'#db7e47',.65),light([0,2,-4],'#5f8e91',.3)];s.fog={color:hex('#254956'),near:14,far:29};
  box(s,[0,-.3,0],[9,.2,7],M('#c79d59',.9,0,0,1,1));box(s,[0,3.7,-5],[9,4,.14],M('#1d4f60',.92,0,0,0,1));
  box(s,[.8,1.0,.2],[4.5,.22,2.2],M('#d0a45e',.78,0,.02,1,1));
  for(const x of [-2.8,4.4])for(const z of [-1.5,1.7])box(s,[x,.3,z],[.21,.72,.21],M('#6e3b28',.84,0,0,1,1));
  bowl(s,[.6,1.26,-.2],[1.24,1.10,1.24],M('#b73421',.34,0,.55,2,1),[0,rad(10),0],'slow-spin');
  box(s,[-3.8,3.2,-4.75],[1.55,1.35,.08],M('#e0bf71',.76,0,0,5,1));box(s,[-3.8,3.2,-4.60],[.07,1.5,.07],M('#17313b',.82));box(s,[-3.8,3.2,-4.60],[1.7,.07,.07],M('#17313b',.82));
  cyl(s,[-1.3,1.4,.7],[.09,1.22,.09],M('#5d3426',.75,0,0,1,1),[0,0,rad(90)]);box(s,[2.4,1.36,.65],[.8,.04,.35],M('#eee0b4',.85,0,0,5,1));
  return s;
}
function build12(){
  const s=sceneBase('#5b4432','#806c56');s.ambient=hex('#594638');s.camera={eye:[9.5,10.5,11],target:[0,.7,-.5],fov:38,ortho:0};
  s.lights=[light([-6,10,5],'#ffe1a6',2.15),light([5,7,2],'#b97950',.55)];s.fog={color:hex('#806c56'),near:16,far:34};
  box(s,[0,-.4,0],[12,.25,9],M('#806849',.9,0,0,4,.8));
  /* An actual small town: separate buildings, lanes, bridges and workshop courtyards. */
  const houses=[[-5,0,-3],[-1.7,0,-3],[2,0,-3],[5.2,0,-3],[-4.5,0,2],[-.7,0,2],[3.5,0,2]];
  houses.forEach((p,i)=>{const h=1.1+(i%3)*.22;box(s,[p[0],h,p[2]],[1.25,h,1.15],i%2?MAT.wood:MAT.woodDark);box(s,[p[0],h*2+.24,p[2]],[1.5,.18,1.4],M(i%3===0?'#6f2d22':'#40332b',.86,0,.02,9,1),[0,0,rad(i%2?4:-4)]);box(s,[p[0],.55,p[2]+1.18],[.38,.55,.05],M('#2c211b',.9))});
  box(s,[0,-.05,-.1],[9,.05,.62],M('#b2a078',.94,0,0,4,1));box(s,[-.2,-.02,0],[.58,.05,7],M('#b2a078',.94,0,0,4,1));
  const route=[[-5,.35,-.2],[-3,.35,-.2],[-1,.35,-.2],[1,.35,-.2],[3,.35,-.2],[5,.35,-.2]];
  route.forEach((p,i)=>bowl(s,p,[.26,.22,.26],i===route.length-1?MAT.lacquerRed:(i<2?MAT.woodLight:MAT.ground2),[0,rad(i*12),0],'bob',i));
  for(const x of [-3,0,3])cyl(s,[x,.3,4.2],[.18,.55,.18],MAT.woodDark);return s;
}
function build13(){
  const s=sceneBase('#062d3a','#0b3946');s.ambient=hex('#0f4552');s.camera={eye:[7.3,4.0,8.5],target:[.45,1.1,0],fov:38,ortho:3.75};
  s.lights=[light([-4,7,4],'#b8e6e4',1.55),light([5,4,1],'#5aa6ad',.7)];s.fog={color:hex('#0b3946'),near:15,far:31};
  box(s,[0,-.35,0],[9,.14,7],MAT.blue);box(s,[0,3.6,-4.8],[9,4,.10],M('#0a3b49',.88,0,0,8,2.2));
  bowl(s,[.8,.95,-.15],[1.35,1.15,1.35],M('#39808b',.62,0,.12,8,2.4),[0,rad(18),0],'slow-spin');
  /* Dimension lines are physical bars, not screen-space glowing outlines. */
  box(s,[.8,2.95,-.15],[1.98,.018,.018],M('#a0d7d7',.55,0,.02,0));box(s,[-1.18,2.95,-.15],[.018,.26,.018],M('#a0d7d7',.55));box(s,[2.78,2.95,-.15],[.018,.26,.018],M('#a0d7d7',.55));
  box(s,[3.25,1.72,-.15],[.018,1.35,.018],M('#a0d7d7',.55));box(s,[3.25,.37,-.15],[.28,.018,.018],M('#a0d7d7',.55));box(s,[3.25,3.07,-.15],[.28,.018,.018],M('#a0d7d7',.55));
  for(let i=0;i<7;i++)torus(s,[-2.7,1.0+i*.28,.5],[.33+i*.055,.018,.33+i*.055],M('#71b8bd',.62,0,.02,0),[0,0,0]);
  box(s,[-2.7,.85,.5],[.02,1.05,.9],M('#71b8bd',.62,0,.02,0));return s;
}
function build14(){
  const s=sceneBase('#c6aa79','#c7b487');s.ambient=hex('#8f7654');s.camera={eye:[7.1,2.75,8.4],target:[.6,1.15,0],fov:45,ortho:0};
  s.lights=[light([-5,7,4],'#fff0c8',2.35),light([5,4,2],'#d69a62',.65)];s.fog={color:hex('#c7b487'),near:11,far:26};
  addWorkshop(s,{back:'#b49a70',floor:'#887052'});box(s,[-3.7,3.3,-4.75],[1.62,1.35,.05],M('#eee1bb',.62,0,.03,5,1));
  bowl(s,[.65,1.23,-.15],[1.22,1.08,1.22],MAT.lacquerRed,[0,rad(-12),0],'slow-spin');
  /* Large, readable tools at a child's eye line, but still proportioned as tools. */
  cyl(s,[-1.4,1.42,.82],[.13,1.55,.13],MAT.woodLight,[0,0,rad(90)]);box(s,[.3,1.41,.82],[.34,.12,.25],MAT.iron);
  box(s,[2.3,1.39,.72],[1.05,.055,.5],MAT.cloth,[0,rad(-4),0]);cyl(s,[3.2,1.52,-.75],[.35,.16,.35],MAT.ground2);
  s.particles={mode:1,size:7,colorA:hex('#a88153'),colorB:hex('#c7a36d'),points:particles(144,12,[-5,.5,-4],[5,4,4])};return s;
}
function build15(){
  const s=sceneBase('#07120e','#17281e');s.ambient=hex('#15251c');s.camera={eye:[-7.2,4.4,9.3],target:[.2,1.65,-1.0],fov:40,ortho:0};
  s.lights=[light([-3,5,3],'#c8c69a',1.0),light([4,3,1],'#789278',.58),light([0,1,-3],'#4f6a57',.25)];s.fog={color:hex('#17281e'),near:8,far:20};
  box(s,[0,-.3,0],[8,.2,6],MAT.greenWood);box(s,[0,3.6,-5],[8,4,.12],M('#23372b',.9,0,.01,1,1));
  addFuro(s,[.6,2.05,-3.55],1.75);
  for(const y of [.75,1.55,2.35,3.15])for(const x of [-.9,.35,1.6])bowl(s,[x,y,-1.90],[.48,.38,.48],(x+y)%2>.6?MAT.lacquerBlack:MAT.lacquerBrown,[0,rad((x+y)*12),0],'slow-spin',Math.round((x+y)*10));
  box(s,[-3.4,.25,1.2],[1.1,.13,.75],MAT.stone);box(s,[-3.4,.43,1.2],[.92,.025,.6],MAT.water);
  cyl(s,[3.7,1.1,.4],[.08,1.35,.08],MAT.woodLight,[0,0,rad(90)]);
  s.particles={mode:4,size:11,colorA:hex('#536b5c'),colorB:hex('#8ea18b'),points:particles(155,42,[-5,.3,-3],[5,5,3])};return s;
}
const BUILDERS=[build01,build02,build03,build04,build05,build06,build07,build08,build09,build10,build11,build12,build13,build14,build15];
function getVariant(){
  const id=new URL(location.href).searchParams.get('v')||'01';return VARIANTS.find(v=>v.id===id)||VARIANTS[0];
}
