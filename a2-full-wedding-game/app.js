import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const chapters = [
  ['01','FLOWER STUDIO','相談・色決め','色見本をボードへ運ぼう','コーラル、アプリコット、黄、青緑。白一色にはせず、祝宴の色を実際の布と花で確認します。','横へなぞる'],
  ['02','DELIVERY','花の入荷・検品','花の箱を検品台へ運ぼう','箱が床を滑らず、台車と腕に重量が伝わるようにゆっくり運びます。','右へ運ぶ'],
  ['03','FLOWER STUDIO','バケツ洗浄','スポンジで内側を洗おう','擦った場所から汚れが落ち、濡れた面と泡だけが残ります。','円を描く'],
  ['04','FLOWER STUDIO','水と栄養剤','水を入れて混ぜよう','水位が少しずつ上がり、栄養剤が溶けて水面に波が広がります。','上へなぞる'],
  ['05','FLOWER STUDIO','開梱','包みをほどいて花を出そう','箱の蓋、包装紙、花束の順に開きます。花は瞬間移動しません。','左右へ開く'],
  ['06','FLOWER STUDIO','葉取り','茎に沿って葉を取ろう','指が通った高さの葉だけが外れ、葉は回転しながら床へ落ちます。','下へなぞる'],
  ['07','FLOWER STUDIO','切り戻し','茎を少し短く切ろう','刃が閉じた瞬間に茎片が分離し、切片は床へ落下します。','横へ切る'],
  ['08','HYDRATION','水揚げ','花を水へ入れて休ませよう','花首が徐々に起き、色と張りが数秒かけて戻ります。','下へ運ぶ'],
  ['09','FLOWER STUDIO','花材の仕分け','主花・線花・葉物に分けよう','同じ花材が用途別のバケツへ移り、棚の輪郭が少しずつ変わります。','左右へ分ける'],
  ['10','DESIGN BENCH','装花制作','花を金網の穴へ差そう','手が茎を掴み、穴へ近づけ、最後の短い距離だけ補正して水源へ入れます。','花を運ぶ'],
  ['11','PACKING','梱包','装花モジュールを箱へ入れよう','花を潰さない向きで一つずつ下ろし、固定具と蓋を順に閉じます。','下へ運ぶ'],
  ['12','LOAD-IN','車両へ積込','台車から車へ載せよう','後扉を開き、箱を荷室へ滑らせると車体がわずかに沈みます。','右へ押す'],
  ['13','ROAD','会場へ輸送','車を会場まで走らせよう','同じ箱と同じ花を載せたまま道路を進みます。車輪と荷物が別々に揺れます。','右へ走らせる'],
  ['14','VENUE SERVICE','荷下ろし','箱を台車へ下ろそう','扉を開き、荷室から箱を一つずつ台車へ移します。','左へ引く'],
  ['15','CEREMONY','現地設営','花の小道を組み立てよう','空の通路に、椅子、花、コーラルのリボン、パラソル、門を一つずつ設置します。','前へ運ぶ'],
  ['16','QUALITY CHECK','品質確認','傾き・水・リボンを直そう','傾いた装花を起こし、水位を戻し、緩いリボンを張ります。','気になる所をなぞる'],
  ['17','GRAND REVEAL','完成披露','ゲストを迎えよう','扉が開き、色鮮やかな参列者と楽団が歩いて入り、会場全体が祝宴になります。','上へなぞる'],
  ['18','RECEPTION','披露宴へ再配置','装花を長卓へ移そう','挙式で使った同じモジュールを台車で運び、横長の食卓へ組み替えます。','右へ運ぶ'],
  ['19','STRIKE','撤去・分別','花・器・金属・布を分けよう','祝宴後は一つずつ回収し、会場を空の状態へ戻します。','下へ片づける']
];

const canvas = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const fallback = document.querySelector('#fallback');
const chapterNo = document.querySelector('#chapterNo');
const chapterTitle = document.querySelector('#chapterTitle');
const chapterKicker = document.querySelector('#chapterKicker');
const instructionTitle = document.querySelector('#instructionTitle');
const instructionBody = document.querySelector('#instructionBody');
const gestureText = document.querySelector('#gestureText');
const progressBar = document.querySelector('#progressBar');
const timeline = document.querySelector('#timeline');
const next = document.querySelector('#next');
const prev = document.querySelector('#prev');
const resetButton = document.querySelector('#reset');
const completeCard = document.querySelector('#completeCard');
const again = document.querySelector('#again');

let renderer, scene, camera, clock, world;
const state = {
  chapter: Math.min(18, Math.max(0, Number(localStorage.getItem('a2Chapter') || 0))),
  progress: 0,
  dragging: false,
  lastX: 0,
  lastY: 0,
  handTarget: new THREE.Vector3(0,1.3,2),
  handVisible: false,
  cameraFrom: new THREE.Vector3(),
  cameraTo: new THREE.Vector3(),
  lookFrom: new THREE.Vector3(),
  lookTo: new THREE.Vector3(),
  cameraT: 1,
  confetti: [],
  people: [],
  musicians: [],
  flowerHeads: [],
  flowers: [],
  leaves: [],
  cutPieces: [],
  modules: [],
  chairs: [],
  umbrellas: []
};

const coral = new THREE.Color(0xe86b55);
const apricot = new THREE.Color(0xf2a356);
const yellow = new THREE.Color(0xf3c840);
const magenta = new THREE.Color(0xc74772);
const teal = new THREE.Color(0x2d9e98);
const blue = new THREE.Color(0x6d9fc2);
const green = new THREE.Color(0x436f4d);
const darkGreen = new THREE.Color(0x2f5038);
const brick = new THREE.Color(0x8d4d38);

const mat = (color, rough=.72, metal=.02) => new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const box = (w,h,d,color,rough=.75,metal=.02) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,rough,metal));
  m.castShadow = m.receiveShadow = true; return m;
};
const cyl = (r,h,color,segments=12) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat(color));
  m.castShadow=m.receiveShadow=true; return m;
};
function groupAt(x,y,z){ const g=new THREE.Group(); g.position.set(x,y,z); return g; }
function lerp(a,b,t){ return a+(b-a)*t; }
function ease(t){ return t*t*(3-2*t); }
function clamp(v,a=0,b=1){ return Math.max(a,Math.min(b,v)); }

function petalHead(color, scale=1){
  const g=new THREE.Group();
  const center=new THREE.Mesh(new THREE.SphereGeometry(.10*scale,9,7),mat(color, .82));
  g.add(center);
  for(let i=0;i<6;i++){
    const p=new THREE.Mesh(new THREE.SphereGeometry(.095*scale,8,6),mat(color.clone().offsetHSL((i-3)*.006,0,.025),.86));
    const a=i*Math.PI/3;
    p.scale.set(1.3,.68,.45);
    p.position.set(Math.cos(a)*.115*scale,Math.sin(a)*.115*scale,0);
    p.rotation.z=a;
    g.add(p);
  }
  return g;
}

function makeFlower(i){
  const g=new THREE.Group();
  const stem=cyl(.018,1.15,darkGreen,8); stem.position.y=.575; g.add(stem);
  const palette=[coral,apricot,yellow,magenta,teal,blue];
  const head=petalHead(palette[i%palette.length].clone(), .9+(i%4)*.06);
  head.position.y=1.18; g.add(head);
  const leaves=[];
  for(let j=0;j<3;j++){
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.09,7,5),mat(green.clone().offsetHSL(0,0,(j-1)*.03),.9));
    leaf.scale.set(1.9,.42,.42);
    leaf.position.set((j%2?-.1:.1),.28+j*.22,0);
    leaf.rotation.z=(j%2?-.7:.7);
    g.add(leaf); leaves.push(leaf);
  }
  g.userData={stem,head,leaves,index:i};
  state.flowerHeads.push(head); return g;
}

function makeChair(i, side){
  const g=new THREE.Group();
  const frame=mat(i%3===0?0xd2a44d:0x77523c,.5,.35);
  const seat=box(.62,.10,.62,0xd48b6b); seat.position.y=.52; g.add(seat);
  for(const x of [-.25,.25]) for(const z of [-.25,.25]){const leg=cyl(.026,.52,frame.color,8); leg.material=frame; leg.position.set(x,.26,z); g.add(leg);}
  const back=box(.62,.08,.10,0xd2a44d,.5,.35); back.position.set(0,1.0,.29); g.add(back);
  const ribbon=box(.66,.08,.035,[0xe86b55,0xf2a356,0x2d9e98,0xc74772][i%4]); ribbon.position.set(0,1.04,.35); ribbon.rotation.z=.09*(side||1); g.add(ribbon);
  return g;
}

function makePerson(i,musician=false){
  const g=new THREE.Group();
  const clothes=[0xd85848,0xf0a13e,0x2c8f8e,0x6f70b8,0xc84e78,0x66a34f][i%6];
  const torso=box(.32,.56,.20,clothes); torso.position.y=.84; g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),mat([0xe1b08d,0xc88c68,0x8b5c44,0xf0c5a5][i%4])); head.position.y=1.28; g.add(head);
  for(const x of [-.12,.12]){const arm=cyl(.045,.48,clothes,8); arm.position.set(x,.91,0); arm.rotation.z=x<0?.25:-.25; g.add(arm);}
  if(musician){
    const instrument = i%3===0 ? box(.46,.08,.12,0xd3a63b,.4,.65) : i%3===1 ? cyl(.16,.42,0xb76b2e,10) : box(.38,.28,.08,0x8d4d38,.5,.15);
    instrument.position.set(.22,.88,.16); instrument.rotation.z=.35; g.add(instrument);
  }
  return g;
}

function buildWorld(){
  world=new THREE.Group(); scene.add(world);
  const ground=box(96,.18,20,0x766c5e); ground.position.set(35,-.1,0); world.add(ground);

  const studio=groupAt(0,0,0); world.add(studio);
  const floor=box(18,.12,15,0x77746c); floor.position.y=.02; studio.add(floor);
  const wall=box(18,6,.25,0xb8a38d); wall.position.set(0,3,-7.25); studio.add(wall);
  const windowMesh=box(5.8,3,.08,0x8bb1ba,.35,.05); windowMesh.position.set(-4,3.5,-7.08); studio.add(windowMesh);
  const bench=box(5.5,.18,1.7,0x77503d); bench.position.set(0,1.0,-1.5); studio.add(bench);
  for(const x of [-2.3,2.3]){const leg=box(.15,1.0,.15,0x5d4034); leg.position.set(x,.5,-1.5); studio.add(leg);}
  const shelf=box(4,.16,.8,0x6e4b39); shelf.position.set(5,2.3,-4.8); studio.add(shelf);

  state.moodCards=[];
  [coral,apricot,teal].forEach((c,i)=>{const card=box(.72,.08,.94,c.getHex()); card.position.set(-3+i*.85,1.22,-1.0); studio.add(card); state.moodCards.push(card);});
  state.moodBoard=box(3.2,2.0,.10,0xe8d8c7); state.moodBoard.position.set(4.8,2.3,-6.9); studio.add(state.moodBoard);

  state.incomingCrate=groupAt(-6,0.65,2.4); studio.add(state.incomingCrate);
  const crateBody=box(2.4,1.15,1.6,0x9b7150); state.incomingCrate.add(crateBody);
  state.crateLid=box(2.45,.12,1.65,0x8a6347); state.crateLid.position.y=.64; state.incomingCrate.add(state.crateLid);
  state.wrapper=box(2.05,.62,1.35,0xd9b89e); state.wrapper.position.y=.2; state.incomingCrate.add(state.wrapper);

  state.bucket=groupAt(2.7,0,-.5); studio.add(state.bucket);
  const bucketOuter=new THREE.Mesh(new THREE.CylinderGeometry(.65,.55,1.05,20,1,true),new THREE.MeshStandardMaterial({color:0x6f7777,roughness:.45,metalness:.55,side:THREE.DoubleSide}));
  bucketOuter.position.y=.53; bucketOuter.castShadow=true; state.bucket.add(bucketOuter);
  state.bucketWater=new THREE.Mesh(new THREE.CylinderGeometry(.53,.53,.04,20),new THREE.MeshStandardMaterial({color:0x65a8b0,roughness:.2,metalness:.0,transparent:true,opacity:.75}));
  state.bucketWater.position.y=.12; state.bucketWater.scale.y=.02; state.bucket.add(state.bucketWater);
  state.dirt=new THREE.Mesh(new THREE.CylinderGeometry(.57,.50,.35,20,1,true),new THREE.MeshStandardMaterial({color:0x5e4b3e,roughness:1,transparent:true,opacity:.72,side:THREE.DoubleSide}));
  state.dirt.position.y=.33; state.bucket.add(state.dirt);
  state.sponge=box(.35,.12,.22,0xe1b33c); state.sponge.position.set(2.9,.55,.2); studio.add(state.sponge);

  state.shears=groupAt(-1,1.35,.2); studio.add(state.shears);
  for(const z of [-.05,.05]){const blade=box(.65,.04,.08,0xb7b7b2,.25,.7); blade.position.x=.3; blade.position.z=z; blade.rotation.z=z>0?.22:-.22; state.shears.add(blade);}
  const handle=cyl(.08,.38,0xbd4b3c,10); handle.rotation.z=Math.PI/2; handle.position.x=-.28; state.shears.add(handle);

  state.flowers=[];
  for(let i=0;i<18;i++){
    const f=makeFlower(i);
    const col=i%6,row=Math.floor(i/6);
    f.position.set(-5.2+col*.28,.65,-.6+row*.35);
    f.scale.setScalar(.82);
    studio.add(f); state.flowers.push(f);
  }
  for(let i=0;i<54;i++){
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.055,6,4),mat(green,.95));
    leaf.scale.set(2.0,.42,.42); leaf.visible=false; studio.add(leaf); state.leaves.push(leaf);
  }
  for(let i=0;i<18;i++){
    const seg=cyl(.018,.25,darkGreen,7); seg.visible=false; studio.add(seg); state.cutPieces.push(seg);
  }

  state.modules=[];
  for(let m=0;m<6;m++){
    const g=groupAt(-2.3+m*.9,.75,3.4); studio.add(g);
    const base=box(.72,.14,.48,0x715e4e); g.add(base);
    const mesh=cyl(.28,.26,0x4f6755,10); mesh.position.y=.18; g.add(mesh);
    g.visible=false; state.modules.push(g);
  }
  state.transportCrates=[];
  for(let i=0;i<3;i++){const c=groupAt(3.8+i*1.5,.6,2.8); studio.add(c); c.add(box(1.3,1.0,1.25,0x9b7150)); const lid=box(1.34,.10,1.29,0x80583d); lid.position.y=.56;c.add(lid);c.userData.lid=lid; state.transportCrates.push(c);}

  state.van=groupAt(17,0,0); world.add(state.van);
  const vanBody=box(4.2,1.85,2.05,0xf1c56b); vanBody.position.y=1.25; state.van.add(vanBody);
  const cabin=box(1.4,1.55,2.0,0xe69b4e); cabin.position.set(1.75,1.35,0); state.van.add(cabin);
  state.vanDoor=box(.12,1.55,1.65,0xe0b55e); state.vanDoor.position.set(-2.16,1.3,0); state.van.add(state.vanDoor);
  state.wheels=[];
  for(const x of [-1.3,1.4]) for(const z of [-1.0,1.0]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.18,16),mat(0x272522,.85)); w.rotation.x=Math.PI/2; w.position.set(x,.46,z); state.van.add(w); state.wheels.push(w);}
  const road=box(25,.05,7,0x4d4e4d); road.position.set(29,.01,0); world.add(road);
  for(let x=18;x<42;x+=3){const mark=box(1.4,.02,.10,0xf0d75d); mark.position.set(x,.05,0); world.add(mark);}

  state.ceremony=groupAt(48,0,0); world.add(state.ceremony);
  const grass=box(18,.10,16,0x647a4f); grass.position.y=.02; state.ceremony.add(grass);
  state.aisle=box(3.4,.06,12,0xd56f58); state.aisle.position.set(0,.08,0); state.ceremony.add(state.aisle);
  const manor=box(13,5,.6,brick.getHex()); manor.position.set(0,2.5,-7.7); state.ceremony.add(manor);
  for(let i=-2;i<=2;i++){const win=box(1.2,1.6,.05,0x7fa6ad,.35); win.position.set(i*2.25,3,-7.36);state.ceremony.add(win);}
  state.chairs=[];
  for(let row=0;row<7;row++) for(const side of [-1,1]){
    const ch=makeChair(row,side); ch.position.set(side*3.0,.05,4.6-row*1.35); ch.rotation.y=side<0?.08:-.08; state.ceremony.add(ch); state.chairs.push(ch);
  }
  state.umbrellas=[];
  for(let i=0;i<6;i++){
    const u=groupAt((i%2?-1:1)*5.2,0,4.6-Math.floor(i/2)*3.3); state.ceremony.add(u);
    const pole=cyl(.035,2.7,0x9a7659,8); pole.position.y=1.35; u.add(pole);
    const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.05,.55,18),mat([0xe96d58,0xf3ad46,0x2d9e98][i%3],.8)); canopy.position.y=2.55; canopy.rotation.x=Math.PI; u.add(canopy); u.userData.canopy=canopy; state.umbrellas.push(u);
  }
  state.arch=groupAt(0,0,-5.55); state.ceremony.add(state.arch);
  for(const x of [-1.8,1.8]){const p=cyl(.09,3.7,0xb49365,10);p.position.set(x,1.85,0);state.arch.add(p);}
  const top=new THREE.Mesh(new THREE.TorusGeometry(1.8,.09,10,28,Math.PI),mat(0xb49365,.55,.45)); top.rotation.z=Math.PI; top.position.y=3.7; state.arch.add(top);
  for(let i=0;i<20;i++){const h=petalHead([coral,apricot,yellow,magenta,teal][i%5].clone(),.7); const a=Math.PI*(i/19); h.position.set(Math.cos(a)*1.8,3.7+Math.sin(a)*1.8,.05); state.arch.add(h);}

  state.guests=[]; state.musicians=[];
  for(let i=0;i<20;i++){const p=makePerson(i,false); p.position.set(8+(i%5)*.5,.02,5-Math.floor(i/5)*1.5); state.ceremony.add(p); state.guests.push(p);}
  for(let i=0;i<4;i++){const p=makePerson(i,true); p.position.set(7+i*.75,.02,-3.7); state.ceremony.add(p); state.musicians.push(p);}
  for(let i=0;i<140;i++){const c=box(.045,.02,.10,[0xf2a356,0xe86b55,0x2d9e98,0xc74772,0xf3c840][i%5]); c.visible=false; state.ceremony.add(c); state.confetti.push(c);}

  state.reception=groupAt(70,0,0); world.add(state.reception);
  const recFloor=box(18,.1,16,0x6e5546); recFloor.position.y=.02; state.reception.add(recFloor);
  const recWall=box(18,5,.4,0xc8a781); recWall.position.set(0,2.5,-7.8); state.reception.add(recWall);
  state.longTable=box(11,.18,1.6,0x6a4637); state.longTable.position.set(0,1.0,-.5); state.reception.add(state.longTable);
  for(let x=-4.8;x<=4.8;x+=1.2){const lamp=cyl(.08,.52,0xd7a33c,10); lamp.position.set(x,1.42,-.5); state.reception.add(lamp);}
  state.bins=[];
  [0x477c55,0x557f9e,0xb35b44,0xd1a040].forEach((c,i)=>{const b=box(1.2,1.0,1.2,c); b.position.set(-5.5+i*1.5,.5,4.8); state.reception.add(b); state.bins.push(b);});

  state.aisleModules=[];
  for(let i=0;i<10;i++){
    const g=groupAt((i%2?-1:1)*1.9,.24,4.5-Math.floor(i/2)*2.1); state.ceremony.add(g);
    const base=box(.8,.16,.65,0x6f5848); g.add(base);
    for(let j=0;j<5;j++){const h=petalHead([coral,apricot,yellow,magenta,teal][(i+j)%5].clone(),.72); h.position.set((j-2)*.14,.35+(j%2)*.13,(j%3-1)*.12); g.add(h);}
    g.visible=false; state.aisleModules.push(g);
  }

  state.hand=new THREE.Group(); world.add(state.hand);
  const palm=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),mat(0xf2d7b8,.9)); palm.scale.set(1,.55,.9);state.hand.add(palm);
  for(let i=0;i<4;i++){const finger=cyl(.035,.24,0xf2d7b8,8);finger.rotation.z=Math.PI/2;finger.position.set(.19,.03,(i-1.5)*.065);state.hand.add(finger);}
  state.hand.visible=false;
}

function setAllFlowerPosition(mode,p){
  const f=state.flowers;
  f.forEach((fl,i)=>{
    let x=fl.position.x,y=fl.position.y,z=fl.position.z;
    if(mode==='crate'){x=-6+(i%6)*.18;y=.9+Math.floor(i/6)*.14;z=2.15+(i%3)*.12;}
    if(mode==='bench'){x=-4.8+(i%6)*.32;y=1.25;z=-1.15+Math.floor(i/6)*.32;}
    if(mode==='bucket'){const a=i/18*Math.PI*2;x=2.7+Math.cos(a)*.36;y=.15;z=-.5+Math.sin(a)*.36;}
    if(mode==='sort'){const bin=i%3;x=4.3+bin*.8;y=.22;z=-3.6+Math.floor(i/3)*.05;}
    fl.position.lerp(new THREE.Vector3(x,y,z),p);
  });
}

function chapterP(stage){
  if(state.chapter>stage) return 1;
  if(state.chapter<stage) return 0;
  return ease(state.progress);
}

function syncScene(){
  const p0=chapterP(0);
  state.moodCards.forEach((c,i)=>c.position.set(lerp(-3+i*.85,4.0+i*.75,p0),lerp(1.22,2.55,p0),lerp(-1.0,-6.75,p0)));

  const p1=chapterP(1); state.incomingCrate.position.set(lerp(-6,-.2,p1),.65,lerp(2.4,-.15,p1));

  const p2=chapterP(2); state.dirt.material.opacity=.72*(1-p2); state.sponge.position.set(2.7+Math.cos(p2*Math.PI*7)*.42,.55, -.5+Math.sin(p2*Math.PI*7)*.38);

  const p3=chapterP(3); state.bucketWater.position.y=lerp(.12,.55,p3); state.bucketWater.scale.y=lerp(.02,1,p3);

  const p4=chapterP(4); state.crateLid.rotation.z=-p4*1.35; state.crateLid.position.x=-p4*.55; state.wrapper.scale.x=1-p4*.45; state.wrapper.rotation.z=p4*.5;
  const flowersInBox = p4<.15?'crate':'bench'; setAllFlowerPosition(flowersInBox, clamp((p4-.15)/.75));

  const p5=chapterP(5);
  state.flowers.forEach((fl,i)=>fl.userData.leaves.forEach((leaf,j)=>leaf.visible=p5 < (i*3+j+1)/54));
  state.leaves.forEach((leaf,i)=>{
    const threshold=(i+1)/54; leaf.visible=p5>=threshold;
    if(leaf.visible){const age=clamp((p5-threshold)*8);leaf.position.set(-4.9+(i%6)*.32 + Math.sin(i)*.08,lerp(1.28,.06,age),-1.2+Math.floor((i%18)/6)*.3+(i%3)*.04);leaf.rotation.z=age*(2+i%5);}
  });

  const p6=chapterP(6);
  state.flowers.forEach((fl)=>{fl.userData.stem.scale.y=lerp(1,.82,p6);fl.userData.head.position.y=lerp(1.18,1.0,p6);});
  state.cutPieces.forEach((seg,i)=>{const th=(i+1)/18;seg.visible=p6>=th;if(seg.visible){const a=clamp((p6-th)*8);seg.position.set(-4.8+(i%6)*.32,lerp(1.1,.08,a),-.9+Math.floor(i/6)*.3);seg.rotation.z=a*2.2;}});

  const p7=chapterP(7); if(p7>.05) setAllFlowerPosition('bucket',clamp(p7*1.35));
  state.flowerHeads.forEach((h)=>{h.rotation.z=lerp(-.42,0,p7); h.scale.setScalar(lerp(.88,1.04,p7));});

  const p8=chapterP(8); if(state.chapter>=8) setAllFlowerPosition('sort',p8);

  const p9=chapterP(9);
  state.modules.forEach((m,i)=>{m.visible=p9>(i/6)*.75; m.position.y=lerp(.35,.75,p9);});
  state.flowers.forEach((fl,i)=>{if(state.chapter===9){const target=state.modules[i%6].position.clone().add(new THREE.Vector3(((i%3)-1)*.16,.46+((i%2)*.15),(i%2?-.12:.12)));fl.position.lerp(target,clamp(p9*1.3));}});

  const p10=chapterP(10);
  state.modules.forEach((m,i)=>{if(state.chapter>=10){const c=state.transportCrates[Math.floor(i/2)];const target=c.position.clone().add(new THREE.Vector3(i%2?.22:-.22,.2,0));m.position.lerp(target,p10);}});
  state.transportCrates.forEach((c)=>c.userData.lid.rotation.z=lerp(-.9,0,p10));

  const p11=chapterP(11);
  state.vanDoor.rotation.y=lerp(0,-1.35,clamp(p11*2));
  state.transportCrates.forEach((c,i)=>{if(state.chapter>=11)c.position.lerp(new THREE.Vector3(15.5+i*.5,.8,(i-1)*.45),p11);});

  const p12=chapterP(12);
  state.van.position.x=lerp(17,43,p12); state.wheels.forEach(w=>w.rotation.z=-p12*18);
  if(state.chapter===12) state.transportCrates.forEach((c,i)=>c.position.set(state.van.position.x-1+i*.45,.8,(i-1)*.45));

  const p13=chapterP(13);
  if(state.chapter>=13) state.transportCrates.forEach((c,i)=>c.position.lerp(new THREE.Vector3(44.2+i*.75,.65,3.5),p13));

  const p14=chapterP(14);
  state.chairs.forEach((ch,i)=>{const base=ch.userData.base || ch.position.clone();ch.userData.base=base;const off=(1-p14)*(i%2?4:-4);ch.position.x=base.x+off;});
  state.umbrellas.forEach((u,i)=>u.scale.setScalar(lerp(.25,1,clamp(p14*1.1-i*.03))));
  state.aisleModules.forEach((m,i)=>m.visible=p14>(i+1)/12);
  state.arch.scale.setScalar(lerp(.2,1,p14)); state.arch.position.y=lerp(-.2,0,p14);

  const p15=chapterP(15);
  state.aisleModules.forEach((m,i)=>m.rotation.z=lerp((i%3-1)*.16,0,p15));
  state.chairs.forEach((c,i)=>c.rotation.z=lerp((i%4-1.5)*.025,0,p15));

  const p16=chapterP(16);
  state.guests.forEach((g,i)=>{const row=Math.floor(i/5),col=i%5;g.position.x=lerp(8,(col-2)*1.0,p16);g.position.z=lerp(5-row*1.5,4.6-row*1.6,p16);});
  state.musicians.forEach((g,i)=>{g.position.x=lerp(7+i*.75,-5.2+i*.75,p16);});
  state.confetti.forEach((c,i)=>{const th=(i%30)/30;c.visible=p16>.45+th*.3;if(c.visible){const age=clamp((p16-.45-th*.3)*5);c.position.set((i%17-8)*.55,lerp(5.5,.2,age),-4+(i%11)*.8);c.rotation.z=age*(i%7+1);}});

  const p17=chapterP(17);
  state.aisleModules.forEach((m,i)=>{if(state.chapter>=17){const tx=70-4.3+i*.95; const tz=-.5+(i%2?-.28:.28);m.position.lerp(new THREE.Vector3(tx,.98,tz),p17);}});

  const p18=chapterP(18);
  if(state.chapter===18){
    state.aisleModules.forEach((m,i)=>m.position.lerp(new THREE.Vector3(64.5+(i%4)*1.5,.55,4.8),p18));
    state.chairs.forEach((c)=>c.scale.setScalar(lerp(1,.1,p18)));
    state.umbrellas.forEach(u=>u.scale.setScalar(lerp(1,.12,p18)));
    state.guests.forEach(g=>g.visible=p18<.1); state.musicians.forEach(g=>g.visible=p18<.1);
  }
}

const views=[
  [[8,5.3,10],[0,1.4,-1]],[[7,4.8,9],[-.2,1.2,0]],[[6.5,4.0,7],[2.7,.7,-.5]],[[6.5,4.0,7],[2.7,.7,-.5]],
  [[7,4.6,8],[-.8,1.2,0]],[[6.5,3.8,6],[-3.8,1.0,-1]],[[6.5,3.8,6],[-3.8,1.0,-1]],[[6,3.4,6],[2.7,.75,-.5]],
  [[8,4.5,8],[4.8,1,-3.5]],[[7,4.2,7],[-.2,1,3]],[[8,4.8,8],[4.5,.8,2.6]],[[22,4.2,7],[17,1,0]],
  [[31,5.0,11],[30,1,0]],[[51,4.6,9],[44.5,1,2.5]],[[54,5.4,11],[48,1.5,0]],[[54,4.8,10],[48,1.2,0]],
  [[54,5.3,12],[48,1.5,0]],[[77,5.0,10],[70,1.3,-.5]],[[77,5.0,10],[70,.8,2.5]]
];

function setChapter(index, keepProgress=false){
  state.chapter=clamp(index,0,18);
  if(!keepProgress) state.progress=0;
  localStorage.setItem('a2Chapter',String(state.chapter));
  const c=chapters[state.chapter];
  chapterNo.textContent=`${c[0]} / 19`; chapterKicker.textContent=c[1]; chapterTitle.textContent=c[2];
  instructionTitle.textContent=c[3]; instructionBody.textContent=c[4]; gestureText.textContent=c[5];
  prev.disabled=state.chapter===0; next.disabled=state.progress<.98;
  completeCard.hidden=true;
  [...timeline.children].forEach((el,i)=>{el.className=i<state.chapter?'done':i===state.chapter?'current':'';});
  const [pos,target]=views[state.chapter]; state.cameraFrom.copy(camera.position);state.lookFrom.copy(state.lookTo.lengthSq()?state.lookTo:new THREE.Vector3(...target));
  state.cameraTo.set(...pos);state.lookTo.set(...target);state.cameraT=0;
  syncScene(); updateUI();
}

function updateUI(){
  progressBar.style.width=`${Math.round(state.progress*100)}%`;
  next.disabled=state.progress<.98 || state.chapter===18;
  if(state.chapter===18 && state.progress>.995) completeCard.hidden=false;
}

function advanceBy(amount){
  state.progress=clamp(state.progress+amount); syncScene(); updateUI();
}

function pointerToWorld(x,y){
  const ndc=new THREE.Vector3((x/innerWidth)*2-1,-(y/innerHeight)*2+1,.2).unproject(camera);
  const dir=ndc.sub(camera.position).normalize();
  const t=(1.15-camera.position.y)/(dir.y||-.001);
  return camera.position.clone().add(dir.multiplyScalar(t));
}
function onDown(e){state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY;state.handVisible=true;state.hand.visible=true;state.handTarget.copy(pointerToWorld(e.clientX,e.clientY));canvas.setPointerCapture?.(e.pointerId);}
function onMove(e){
  state.handTarget.copy(pointerToWorld(e.clientX,e.clientY));
  if(!state.dragging)return;
  const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY; state.lastX=e.clientX;state.lastY=e.clientY;
  advanceBy(Math.hypot(dx,dy)/420);
  if([4,5,7,8,9,10,13,14,17,18].includes(state.chapter)){
    const f=state.flowers[0]; if(f){f.position.lerp(state.handTarget,.72);}
  }
}
function onUp(){state.dragging=false;state.handVisible=false;state.hand.visible=false;if(state.progress>.985){state.progress=1;syncScene();updateUI();}}

function makeTimeline(){for(let i=0;i<19;i++){const x=document.createElement('i');timeline.appendChild(x);}}

function animate(){
  const dt=clock.getDelta();
  state.cameraT=Math.min(1,state.cameraT+dt*1.5); const t=ease(state.cameraT);
  camera.position.lerpVectors(state.cameraFrom,state.cameraTo,t);
  const look=new THREE.Vector3().lerpVectors(state.lookFrom,state.lookTo,t); camera.lookAt(look);
  state.hand.position.lerp(state.handTarget,.18);
  if(state.chapter===12){state.transportCrates.forEach((c,i)=>{c.rotation.z=Math.sin(performance.now()*.008+i)*.015;});}
  if(state.chapter===16){state.musicians.forEach((p,i)=>p.rotation.y=Math.sin(performance.now()*.004+i)*.08);}
  renderer.render(scene,camera);
}

function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.35:1.65));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}

function init(){
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene();scene.background=new THREE.Color(0xb7c8bc);scene.fog=new THREE.FogExp2(0xc4c3b4,.008);
    camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.08,130);camera.position.set(8,5.3,10);
    clock=new THREE.Clock();
    const hemi=new THREE.HemisphereLight(0xd8e8ee,0x5d5448,1.8);scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xffd8a1,3.3);sun.position.set(-8,13,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;scene.add(sun);
    buildWorld();makeTimeline();resize();setChapter(state.chapter);
    loading.hidden=true;renderer.setAnimationLoop(animate);
  }catch(err){console.error(err);loading.hidden=true;fallback.hidden=false;}
}

canvas.addEventListener('pointerdown',onDown);
canvas.addEventListener('pointermove',onMove);
canvas.addEventListener('pointerup',onUp);
canvas.addEventListener('pointercancel',onUp);
next.addEventListener('click',()=>{if(state.progress>.98&&state.chapter<18)setChapter(state.chapter+1);});
prev.addEventListener('click',()=>{if(state.chapter>0)setChapter(state.chapter-1);});
resetButton.addEventListener('click',()=>{localStorage.removeItem('a2Chapter');state.progress=0;setChapter(0);});
again.addEventListener('click',()=>{completeCard.hidden=true;localStorage.removeItem('a2Chapter');setChapter(0);});
window.addEventListener('resize',resize,{passive:true});
window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&!next.disabled)next.click();if(e.key==='ArrowLeft'&&!prev.disabled)prev.click();});
init();
