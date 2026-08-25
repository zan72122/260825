import { Scene,Camera,Node } from './renderer.js';
import { SceneKit } from './scene-kit.js';
import { material,LAYERS } from './materials.js';
import { makeLathe,makeTorus,makeRibbon,OUTER_BOWL_PROFILE,ROUGH_BOWL_PROFILE,bowlRadiusAtY } from './geometry.js';
import { clamp,lerp,smoothstep,easeOutCubic,deg,rand,seeded,TAU,v3Lerp } from './math.js';

const BOWL_Y=.92;
const SURFACE_BY_STEP={
  'sand-wood':'wood','raw-lacquer':'raw','press-cloth':'cloth','somi':'raw','coat-coarse':'coarse','coat-medium':'medium','coat-fine':'fine',
  'sand-ground':'sand','harden-ground':'raw','middle-coat':'middle','top-inside':'top','top-outside':'top','roiro-sand':'matte','surigushi':'raw','polish':'polish',
  'draw-decoration':'scratch','gold-decoration':'gold'
};

export class WorkshopWorld{
  constructor(renderer){
    this.renderer=renderer;
    this.scene=new Scene();
    this.camera=new Camera();
    this.kit=new SceneKit();
    this.environment=new Node({name:'environment'});
    this.dynamic=new Node({name:'dynamic'});
    this.effectsRoot=new Node({name:'effects'});
    this.scene.add(this.environment);this.scene.add(this.dynamic);this.scene.add(this.effectsRoot);
    this.effects=[];this.strokeNodes=[];this.refs={};this.mode='home';this.chapter=0;this.step=null;this.progress=0;this.pointer={x:.5,y:.5,down:false};this.orientation='landscape';this.orbit={x:0,y:0};this.targetOrbit={x:0,y:0};this.decoration='chinkin';this.wood='keyaki';this.finalSpin=0;this.autoState=null;
    this.buildEnvironment();
    this.setHome();
  }

  addLight(type,position,color,power){this.scene.lights.push({type,position,color,power});}

  buildEnvironment(){
    const k=this.kit,e=this.environment;
    this.scene.background=[.052,.031,.021];this.scene.fogColor=[.07,.043,.03];this.scene.fogNear=8.5;this.scene.fogFar=23;this.scene.ambient=[.31,.25,.21];this.scene.horizon=[.32,.28,.22];
    this.scene.lights.length=0;
    this.addLight('directional',[-.48,.86,.34],'#f5c58e',1.35);
    this.addLight('directional',[.72,.36,-.44],'#8ea8a9',.52);
    this.addLight('point',[-3.2,3.8,2.8],'#d6834a',.52);

    k.plane([22,22],[0,0,0],material('darkWood',{color:'#291b13',roughness:.92,patternScale:1.9}),e,[0,0,0],'floor');
    for(let i=-7;i<=7;i++)k.box([.025,.016,15],[i*.72,.012,-1],material('shadow',{opacity:.12}),e);
    k.box([18,7,.42],[0,3.5,-5.6],material('stone',{color:'#59483b',roughness:.98,patternScale:.62}),e);
    k.box([.42,7,13],[-7.4,3.5,0],material('stone',{color:'#40352d',roughness:.99}),e);
    for(const x of [-6.6,-2.2,2.2,6.6])k.box([.22,7.2,.38],[x,3.6,-5.33],material('darkWood',{color:'#2f1d14'}),e);
    k.box([18,.25,.48],[0,6.35,-5.28],material('darkWood',{color:'#302017'}),e);

    // Shoji window: physically framed rather than a glowing backdrop.
    const window=k.group(e,'window',[-4.45,3.7,-5.28]);
    k.box([3.05,3.55,.12],[0,0,0],material('paper',{color:'#b9aa91',roughness:.9}),window);
    const frame=material('darkWood',{color:'#342116',roughness:.78});
    k.box([3.28,.16,.22],[0,1.86,.04],frame,window);k.box([3.28,.16,.22],[0,-1.86,.04],frame,window);k.box([.16,3.85,.22],[-1.64,0,.04],frame,window);k.box([.16,3.85,.22],[1.64,0,.04],frame,window);
    for(let i=-2;i<=2;i++)k.box([.055,3.55,.12],[i*.61,0,.11],frame,window);
    for(let j=-2;j<=2;j++)k.box([3.05,.055,.12],[0,j*.66,.11],frame,window);

    // Far shelves and plausible stored bowls establish scale.
    const shelf=k.group(e,'shelf',[4.45,0,-4.86]);
    k.box([4.1,.2,1.05],[0,1.18,0],material('darkWood'),shelf);k.box([4.1,.2,1.05],[0,2.55,0],material('darkWood'),shelf);k.box([4.1,.2,1.05],[0,3.92,0],material('darkWood'),shelf);
    for(const x of [-1.9,1.9])k.box([.2,4.55,1.04],[x,2.25,0],material('darkWood'),shelf);
    const stored=[[-1.25,1.34,'blackLacquer'],[-.35,1.34,'vermilionLacquer'],[.6,1.34,'blackLacquer'],[1.3,1.34,'matteBlackLacquer'],[-1.3,2.72,'keyaki'],[-.42,2.72,'blackLacquer'],[.48,2.72,'vermilionLacquer'],[1.35,2.72,'blackLacquer']];
    for(const [x,y,m] of stored)k.shelfBowl(shelf,[x,y,.06],m,.31);

    // Workbench: thick top, tenoned legs, believable contact.
    const table=k.group(e,'workbench',[0,0,0]);
    k.box([7.0,.28,3.25],[0,.72,0],material('paleWood',{color:'#78502f',roughness:.72,patternScale:1.45}),table);
    for(const [x,z] of [[-3,.98],[3,.98],[-3,-.98],[3,-.98]])k.box([.42,1.45,.42],[x,.0,z],material('darkWood',{color:'#49301f'}),table);
    k.box([5.95,.2,.2],[0,.14,.98],material('darkWood',{color:'#3a271c'}),table);k.box([5.95,.2,.2],[0,.14,-.98],material('darkWood',{color:'#3a271c'}),table);
    k.box([.18,.18,2.0],[-3,.14,0],material('darkWood',{color:'#3a271c'}),table);k.box([.18,.18,2.0],[3,.14,0],material('darkWood',{color:'#3a271c'}),table);

    // Small furo cabinet at the far left; chapter 12 brings camera closer.
    const furo=k.group(e,'far-furo',[-5.2,.05,-2.0]);
    k.box([2.0,3.25,1.55],[0,1.62,0],material('darkWood',{color:'#30251e',roughness:.86}),furo);
    k.box([1.68,2.85,.06],[0,1.58,.81],material('darkWood',{color:'#201813',roughness:.8}),furo);
    for(const y of [.65,1.28,1.91,2.54])k.box([1.55,.08,1.35],[0,y,0],material('darkWood',{color:'#57402d'}),furo);
    k.cylinder(.05,.1,[.55,1.63,.88],material('iron'),furo,18,[deg(90),0,0]);
  }

  clearDynamic(){
    this.dynamic.clear();this.effectsRoot.clear();this.effects.length=0;this.strokeNodes.length=0;this.refs={};this.progress=0;this.autoState=null;
  }

  setHome(){
    this.mode='home';this.clearDynamic();
    this.camera.position=[1.2,3.15,8.7];this.camera.target=[1.0,1.66,0];this.camera.fov=38;this.scene.fogNear=9;this.scene.fogFar=22;
    const root=this.kit.group(this.dynamic,'home-root',[1.4,BOWL_Y,-.1],[0,deg(-8),0],[1.22,1.22,1.22]);
    this.refs.homeBowl=this.kit.explodedBowl(root,{position:[0,0,0],arc:5.2,arcRotation:deg(112)});
    this.kit.contactShadow(this.dynamic,[1.43,.84,-.1],[2.05,1,1.15],.22);
    // Material samples make the chosen cross-section idea legible even on small screens.
    const samples=this.kit.group(this.dynamic,'samples',[3.35,.89,.65],[0,deg(-14),0],[.72,.72,.72]);
    LAYERS.slice(0,7).forEach((layer,i)=>{
      const mat=material(layer.material,{roughness:layer.id==='top'?.16:.82});
      this.kit.box([.82,.13,.52],[0,i*.2,0],mat,samples,[0,deg(i*2),0],`sample-${layer.id}`);
    });
    this.kit.brush(this.dynamic,[3.0,.96,-.55],{rotation:[deg(78),deg(-18),deg(76)],scale:[.68,.68,.68]});
    this.kit.spatula(this.dynamic,[3.74,.91,-.62],{rotation:[deg(76),deg(10),deg(72)],scale:[.62,.62,.62]});
    this.spawnAmbientDust(36,23);
  }

  setExplodedView(finalState={}){
    this.mode='exploded';this.clearDynamic();
    this.camera.position=[0,2.9,8.3];this.camera.target=[0,1.65,0];this.camera.fov=37;
    const root=this.kit.group(this.dynamic,'exploded-view',[0,BOWL_Y,0],[0,deg(-12),0],[1.42,1.42,1.42]);
    this.refs.exploded=this.kit.explodedBowl(root,{arc:5.05,arcRotation:deg(104)});
    if(finalState.decoration)this.kit.goldWave(this.dynamic,[0,BOWL_Y,0],{opacity:.92,scale:1.42});
    this.spawnAmbientDust(26,51);
  }

  setChapter(chapter,step,state){
    this.mode='game';this.chapter=chapter.id;this.step=step;this.wood=state.wood||'keyaki';this.decoration=state.decoration||'chinkin';this.clearDynamic();
    this.scene.fogNear=8.5;this.scene.fogFar=22;this.camera.fov=41;
    const builders={
      'wood-choice':()=>this.buildWoodChoice(),lathe:()=>this.buildLathe(),repair:()=>this.buildRepair(),hardening:()=>this.buildHardening(),cloth:()=>this.buildCloth(),
      'cloth-trim':()=>this.buildClothTrim(),mix:()=>this.buildMix(),layers:()=>this.buildLayers(),sanding:()=>this.buildSanding(),'middle-coat':()=>this.buildMiddleCoat(),
      'top-coat':()=>this.buildTopCoat(),furo:()=>this.buildFuro(),roiro:()=>this.buildRoiro(),decoration:()=>this.buildDecoration(),inspection:()=>this.buildInspection()
    };
    (builders[chapter.scene]||builders['wood-choice'])();
    this.setStep(step,state);
  }

  setStep(step,state={}){
    this.step=step;this.progress=0;this.clearStrokes();
    if(!step)return;
    // Tool and camera can change between substeps without rebuilding the whole station.
    this.configureTool(step);
    this.setProgress(0,step,state);
  }

  buildWoodChoice(){
    this.camera.position=[0,3.35,8.5];this.camera.target=[0,1.45,0];
    const woods=[['keyaki',-2],['katsura',0],['hiba',2]];
    this.refs.woodChoices=[];
    for(const [name,x] of woods){
      const g=this.kit.group(this.dynamic,`wood-${name}`,[x,.91,.0],[0,deg(8*x),0]);
      const mat=material(name);
      this.kit.cylinder(.82,.72,[0,.36,0],mat,g,48,[0,0,deg(90)]);
      this.kit.disc(.79,[.37,.36,0],material(name,{roughness:.8,patternScale:2}),g,[0,0,deg(90)]);
      this.kit.contactShadow(this.dynamic,[x,.84,.04],[1.0,1,.62],.2);
      g.userData.choice=name;this.refs.woodChoices.push(g);
    }
    this.kit.knife(this.dynamic,[-3.05,.96,.72],{rotation:[deg(82),0,deg(68)],scale:[.62,.62,.62]});
  }

  buildLathe(){
    this.camera.position=[0,2.85,8.0];this.camera.target=[0,1.55,0];
    const lathe=this.kit.group(this.dynamic,'lathe-station',[0,.9,0]);
    const iron=material('iron'),wood=material('darkWood');
    this.kit.box([6.2,.28,1.2],[0,.05,0],wood,lathe);
    this.kit.box([.26,1.35,1.05],[-2.55,.72,0],iron,lathe);this.kit.box([.26,1.35,1.05],[2.55,.72,0],iron,lathe);
    this.kit.cylinder(.13,5.05,[0,.83,0],iron,lathe,24,[0,0,deg(90)]);
    this.refs.latheSpin=this.kit.group(lathe,'lathe-spin',[0,.78,0],[0,0,deg(90)],[.88,.88,.88]);
    const roughMat=material(this.wood,{opacity:1,transparent:true});
    const finalMat=material(this.wood,{opacity:.02,transparent:true});
    this.refs.roughBowl=this.kit.lathe(ROUGH_BOWL_PROFILE,[0,0,0],roughMat,this.refs.latheSpin,{name:'rough-blank'});
    this.refs.finalBowl=this.kit.bowl(this.refs.latheSpin,{position:[0,0,0],material:this.wood,shadow:false});
    this.refs.finalBowl.userData.materials.forEach(m=>{m.opacity=.02;m.transparent=true;});
    this.kit.woodChips(this.dynamic,[0,.85,.35],24,7);
    this.refs.tool=this.kit.knife(this.dynamic,[2.2,1.55,1.05],{rotation:[deg(90),0,deg(88)],scale:[.85,.85,.85],name:'lathe-tool'});
  }

  buildRepair(){
    this.camera.position=[0,2.8,7.35];this.camera.target=[0,1.6,0];
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],material:this.wood,scale:[1.08,1.08,1.08]});
    const pts=[];for(let i=0;i<18;i++){const t=i/17,y=BOWL_Y+.45+t*.72,angle=-.20+Math.sin(t*5.2)*.08,r=bowlRadiusAtY(y-BOWL_Y)+.018;pts.push([Math.sin(angle)*r,y,Math.cos(angle)*r]);}
    this.refs.crack=this.kit.ribbon(pts,.012,material('scratch',{color:'#2c1710',roughness:.92}),this.dynamic,{normal:[0,0,1],name:'crack'});
    this.refs.filler=this.kit.ribbon(pts,.026,material('paste',{color:'#6f4930',opacity:0,transparent:true}),this.dynamic,{normal:[0,0,1],name:'filler'});
    this.refs.tool=this.kit.knife(this.dynamic,[1.95,1.72,1.1],{scale:[.8,.8,.8]});
    this.kit.jar(this.dynamic,[-2.4,.87,.5],{material:'ceramic',contents:'paste',radius:.42,height:.38});
  }

  buildHardening(){
    this.camera.position=[0,2.95,7.6];this.camera.target=[0,1.55,0];
    const woodMat=material(this.wood,{secondary:'#3b2418',progress:0,progressMode:1});
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],outerMaterial:woodMat,innerMaterial:woodMat,scale:[1.08,1.08,1.08]});
    this.refs.tool=this.kit.clothPad(this.dynamic,[1.8,1.72,1.2],{scale:[.8,.8,.8]});
    this.kit.jar(this.dynamic,[-2.2,.87,.45],{material:'ceramic',contents:'rawLacquer',radius:.38,height:.45});
    this.kit.box([.8,.06,.6],[-2.0,.9,-.65],material('paper'),this.dynamic,[0,deg(8),0]);
  }

  buildCloth(){
    this.camera.position=[0,3.0,7.7];this.camera.target=[0,1.58,0];
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],material:this.wood,scale:[1.08,1.08,1.08]});
    this.refs.clothBand=this.kit.torus(1.54,.105,[0,BOWL_Y+1.42,0],material('cloth',{opacity:.08,transparent:true}),this.dynamic,[0,0,0],'cloth-band');
    this.refs.clothLoose=this.kit.box([2.0,.055,.78],[-2.25,1.09,.52],material('cloth'),this.dynamic,[deg(4),deg(10),deg(-8)],'loose-cloth');
    this.refs.tool=this.kit.clothPad(this.dynamic,[2.0,1.65,1.15],{scale:[.75,.75,.75]});
  }

  buildClothTrim(){
    this.camera.position=[0,2.9,7.35];this.camera.target=[0,1.7,0];
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],material:this.wood,scale:[1.1,1.1,1.1]});
    this.refs.clothBand=this.kit.torus(1.55,.115,[0,BOWL_Y+1.43,0],material('cloth'),this.dynamic,[0,0,0],'cloth-band');
    this.refs.somiMat=material('rawLacquer',{progress:0,progressMode:1,opacity:.96,transparent:true});
    this.refs.somiShell=this.kit.lathe(OUTER_BOWL_PROFILE,[0,BOWL_Y,0],this.refs.somiMat,this.dynamic,{scale:[1.105,1.105,1.105],name:'somi-shell'});
    this.refs.tool=this.kit.knife(this.dynamic,[1.9,1.8,1.05],{scale:[.8,.8,.8]});
  }

  buildMix(){
    this.camera.position=[0,4.35,7.1];this.camera.target=[0,1.05,0];this.camera.fov=44;
    const mix=this.kit.group(this.dynamic,'mix-station',[0,.88,0]);
    this.refs.mixBowl=this.kit.bowl(mix,{position:[0,0,0],material:'ceramic',scale:[.78,.45,.78],shadow:false});
    this.refs.mixSurface=this.kit.disc(1.0,[0,.69,0],material('paste',{color:'#7c593f',roughness:.74}),mix,[0,0,0],'mix-surface');
    this.refs.mixSurface.scale=[1.02,1,1.02];
    const ingredients=[[-2.25,'rawLacquer','#4b291b'],[2.25,'paste','#b59b75'],[-1.45,'jinokoCoarse','#8d6546']];
    this.refs.ingredientJars=[];
    for(const [x,content,color] of ingredients)this.refs.ingredientJars.push(this.kit.jar(this.dynamic,[x,.87,.25],{material:'ceramic',contents:content,color,radius:.42,height:.58}));
    this.refs.tool=this.kit.spatula(this.dynamic,[1.2,1.55,1.0],{scale:[.8,.8,.8]});
    this.kit.box([1.1,.04,.8],[2.0,.9,-.8],material('paper'),this.dynamic,[0,deg(-8),0]);
  }

  buildLayers(){
    this.camera.position=[0,3.0,7.65];this.camera.target=[0,1.6,0];
    const base=material(this.wood);
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],outerMaterial:base,innerMaterial:base,scale:[1.06,1.06,1.06]});
    this.refs.layerShells=[];
    const defs=[['jinokoCoarse',1.075],['jinokoMedium',1.095],['jinokoFine',1.115]];
    for(const [matName,scale] of defs){
      const mat=material(matName,{opacity:.015,transparent:true,progress:0,progressMode:1});
      const shell=this.kit.lathe(OUTER_BOWL_PROFILE,[0,BOWL_Y,0],mat,this.dynamic,{scale:[scale,scale,scale],name:`shell-${matName}`});
      this.refs.layerShells.push({shell,mat,name:matName});
    }
    this.refs.tool=this.kit.spatula(this.dynamic,[1.95,1.58,1.08],{scale:[.84,.84,.84]});
    const samples=this.kit.group(this.dynamic,'layer-samples',[-2.5,.9,.55],[0,deg(8),0],[.7,.7,.7]);
    defs.forEach(([m],i)=>this.kit.box([.8,.12,.52],[0,i*.18,0],material(m),samples));
  }

  buildSanding(){
    this.camera.position=[0,3.0,7.45];this.camera.target=[0,1.58,0];
    const ground=material('jinokoFine',{secondary:'#655147',progress:0,progressMode:3});
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],outerMaterial:ground,innerMaterial:ground,scale:[1.11,1.11,1.11]});
    this.refs.water=this.kit.torus(1.46,.025,[0,BOWL_Y+1.19,0],material('water',{opacity:.05}),this.dynamic,[0,0,0],'water-film');
    this.refs.tool=this.kit.whetstone(this.dynamic,[1.75,1.67,1.25],{scale:[.85,.85,.85]});
    this.kit.jar(this.dynamic,[-2.15,.87,.5],{material:'ceramic',contents:'water',radius:.36,height:.52});
  }

  buildMiddleCoat(){
    this.camera.position=[0,2.9,7.45];this.camera.target=[0,1.63,0];
    const mat=material('jinokoFine',{secondary:'#1d0f0b',progress:0,progressMode:1});
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],outerMaterial:mat,innerMaterial:mat,scale:[1.1,1.1,1.1]});
    this.refs.pits=[];
    const pitMat=material('scratch',{color:'#b08b72',opacity:.0,transparent:true});
    for(const [a,y] of [[-.62,.75],[.08,.98],[.68,.58]]){
      const r=bowlRadiusAtY(y)+.03;this.refs.pits.push(this.kit.sphere(.045,[Math.sin(a)*r,BOWL_Y+y,Math.cos(a)*r],pitMat,this.dynamic,[1.4,.5,.35],'pit',true));
    }
    this.refs.tool=this.kit.brush(this.dynamic,[1.85,1.75,1.12],{scale:[.82,.82,.82]});
    this.kit.jar(this.dynamic,[-2.2,.87,.5],{material:'ceramic',contents:'matteBlackLacquer',radius:.38,height:.46});
  }

  buildTopCoat(){
    this.camera.position=[0,2.95,7.55];this.camera.target=[0,1.62,0];
    const mat=material('matteBlackLacquer',{secondary:'#100806',progress:0,progressMode:1,roughness:.42,clearcoat:.22});
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],outerMaterial:mat,innerMaterial:mat,scale:[1.1,1.1,1.1]});
    this.refs.topMat=mat;
    this.refs.tool=this.kit.brush(this.dynamic,[1.9,1.8,1.08],{scale:[.88,.88,.88],brushColor:'#24130d'});
    this.kit.box([1.3,.04,.8],[-2.1,.9,.62],material('paper'),this.dynamic,[0,deg(4),0]);
    this.spawnAmbientDust(10,61,.7);
  }

  buildFuro(){
    this.camera.position=[0,3.15,8.3];this.camera.target=[0,1.8,-.25];
    const cabinet=this.kit.group(this.dynamic,'furo-close',[0,.75,-.45]);
    this.kit.box([5.6,4.2,.35],[0,2.05,-1.5],material('darkWood',{color:'#2f251f',roughness:.9}),cabinet);
    this.kit.box([.34,4.2,2.5],[-2.8,2.05,-.42],material('darkWood',{color:'#382a22'}),cabinet);this.kit.box([.34,4.2,2.5],[2.8,2.05,-.42],material('darkWood',{color:'#382a22'}),cabinet);
    this.kit.box([5.95,.32,2.5],[0,4.15,-.42],material('darkWood',{color:'#382a22'}),cabinet);
    this.refs.furoShelves=[];for(const y of [.45,1.35,2.25,3.15])this.refs.furoShelves.push(this.kit.box([5.25,.10,2.15],[0,y,-.35],material('darkWood',{color:'#5a412e'}),cabinet));
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[-2.1,BOWL_Y,.85],material:'blackLacquer',scale:[.88,.88,.88]});
    this.refs.humidityNeedle=this.kit.box([.05,.72,.04],[2.05,2.55,.9],material('gold'),this.dynamic,[0,0,deg(-65)],'humidity-needle');
    this.kit.torus(.62,.045,[2.05,2.55,.84],material('iron'),this.dynamic,[deg(90),0,0]);
    this.kit.disc(.56,[2.05,2.55,.82],material('paper',{color:'#c0ae91'}),this.dynamic,[deg(90),0,0]);
    this.refs.tool=null;
    this.refs.drops=[];for(let i=0;i<22;i++)this.refs.drops.push(this.kit.sphere(.025,[rand(-2.5,2.5),rand(1.0,4.1),rand(-1.2,.4)],material('water',{opacity:rand(.12,.32)}),this.dynamic,[.65,1.5,.65],'humidity-drop',true));
  }

  buildRoiro(){
    this.camera.position=[0,2.75,7.1];this.camera.target=[0,1.68,0];
    const mat=material('matteBlackLacquer',{secondary:'#0c0605',progress:0,progressMode:0,roughness:.56,clearcoat:.2});
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],outerMaterial:mat,innerMaterial:mat,scale:[1.12,1.12,1.12]});
    this.refs.roiroMat=mat;
    this.refs.tool=this.kit.whetstone(this.dynamic,[1.75,1.72,1.18],{scale:[.72,.72,.72]});
    this.kit.jar(this.dynamic,[-2.15,.87,.45],{material:'ceramic',contents:'whitePowder',radius:.36,height:.42});
    this.kit.clothPad(this.dynamic,[-1.75,.98,-.62],{scale:[.62,.62,.62],material:'clothDark'});
  }

  buildDecoration(){
    this.camera.position=[0,2.35,6.35];this.camera.target=[0,1.68,.25];this.camera.fov=35;
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],material:'blackLacquer',scale:[1.18,1.18,1.18]});
    this.refs.waveScratch=this.kit.goldWave(this.dynamic,[0,BOWL_Y,0],{material:'scratch',opacity:.06,count:72,scale:1.18});
    this.refs.waveGold=this.kit.goldWave(this.dynamic,[0,BOWL_Y,0],{material:'gold',opacity:0,count:72,scale:1.18});
    this.refs.tool=this.kit.knife(this.dynamic,[1.75,1.82,1.02],{scale:[.76,.76,.76]});
    this.kit.box([.9,.035,.66],[-2.0,.9,.56],material('paper'),this.dynamic,[0,deg(7),0]);
    this.refs.goldDish=this.kit.jar(this.dynamic,[2.25,.87,.25],{material:'ceramic',contents:'goldDust',radius:.38,height:.24});
  }

  buildInspection(){
    this.camera.position=[0,2.85,7.6];this.camera.target=[0,1.58,0];
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[0,BOWL_Y,0],material:'blackLacquer',scale:[1.1,1.1,1.1]});
    this.refs.goldWave=this.kit.goldWave(this.dynamic,[0,BOWL_Y,0],{opacity:1,scale:1.1});
    const box=this.kit.group(this.dynamic,'wood-box',[2.4,.87,.25],[0,deg(-8),0]);
    this.kit.box([2.3,.16,2.0],[0,.08,0],material('hiba'),box);this.kit.box([.16,.75,2.0],[-1.07,.42,0],material('hiba'),box);this.kit.box([.16,.75,2.0],[1.07,.42,0],material('hiba'),box);this.kit.box([2.0,.75,.16],[0,.42,-.92],material('hiba'),box);this.kit.box([2.0,.75,.16],[0,.42,.92],material('hiba'),box);
    this.refs.box=box;
    this.kit.clothPad(this.dynamic,[-2.1,1.0,.55],{scale:[.85,.85,.85],material:'cloth'});
    this.refs.inspectMarkers=[];
  }

  configureTool(step){
    if(!this.refs.tool)return;
    const mode=step.mode;
    if(mode==='circle'||mode==='swipe-free'){
      if(step.id.includes('roiro')||step.id==='polish')this.replaceTool(step.id==='polish'?'cloth':'whetstone');
      else if(step.id==='sand-wood')this.replaceTool('cloth');
    }else if(mode==='swipe-y'||mode==='long-stroke')this.replaceTool('brush');
    else if(mode==='swipe-x'&&step.id.includes('coat'))this.replaceTool('spatula');
    else if(step.id==='fill-crack'||step.id==='somi'||step.id==='fill-pits')this.replaceTool('spatula');
    else if(step.id==='trim-cloth'||step.id==='open-crack'||step.id==='draw-decoration')this.replaceTool(this.decoration==='makie'?'brush':'knife');
  }

  replaceTool(type){
    if(this.refs.tool&&this.refs.tool.parent)this.refs.tool.parent.remove(this.refs.tool);
    const pos=[1.85,1.72,1.15],options={scale:[.8,.8,.8],name:'active-tool'};
    if(type==='brush')this.refs.tool=this.kit.brush(this.dynamic,pos,options);
    else if(type==='spatula')this.refs.tool=this.kit.spatula(this.dynamic,pos,options);
    else if(type==='knife')this.refs.tool=this.kit.knife(this.dynamic,pos,options);
    else if(type==='whetstone')this.refs.tool=this.kit.whetstone(this.dynamic,pos,options);
    else this.refs.tool=this.kit.clothPad(this.dynamic,pos,options);
  }

  applyChoice(type,id){
    if(type==='wood'){
      this.wood=id;
      for(const g of this.refs.woodChoices||[]){const selected=g.userData.choice===id;g.position[1]=selected?1.15:.91;g.scale=selected?[1.08,1.08,1.08]:[.96,.96,.96];}
    }else if(type==='decoration'){
      this.decoration=id;this.replaceTool(id==='chinkin'?'knife':'brush');
      if(this.refs.waveScratch)this.refs.waveScratch.children?.forEach?.(()=>{});
    }
  }

  clearStrokes(){for(const node of this.strokeNodes){if(node.parent)node.parent.remove(node);}this.strokeNodes.length=0;}

  pointerToWorld(pointer,inside=false){
    const x=(pointer.x-.5)*5.3;
    const y=BOWL_Y+.22+(1-pointer.y)*1.55;
    const localY=clamp(y-BOWL_Y,.2,1.43);
    const angle=clamp((pointer.x-.5)*2.65,-1.2,1.2);
    const r=bowlRadiusAtY(localY,inside)+(inside?-.03:.055);
    return [Math.sin(angle)*r,BOWL_Y+localY,Math.cos(angle)*r];
  }

  setPointer(pointer){
    this.pointer={...this.pointer,...pointer};
    if(this.refs.tool){
      const p=this.pointerToWorld(pointer,Boolean(this.step?.surface==='inside'));
      this.refs.tool.position=v3Lerp(this.refs.tool.position,[p[0]+.12,p[1]+.25,p[2]+.25],.42);
      this.refs.tool.rotation[1]=lerp(this.refs.tool.rotation[1],(pointer.x-.5)*.55,.35);
      this.refs.tool.rotation[2]=lerp(this.refs.tool.rotation[2],deg(-20)+(pointer.x-.5)*.25,.35);
    }
    if(this.mode==='exploded'||this.mode==='home')this.targetOrbit.x=(pointer.x-.5)*.24;
  }

  addStroke(step,pointer,intensity=1){
    if(!step||!this.refs.bowl&&!['stir-base','clean-room'].includes(step.id))return;
    if(step.id==='stir-base'){
      const a=(pointer.x-.5)*TAU;this.refs.tool.position=[Math.sin(a)*.65,1.65,Math.cos(a)*.42];return;
    }
    if(step.id==='clean-room'){
      if(Math.random()<.35)this.spawnParticles('dust',[(pointer.x-.5)*4.8,.95,(pointer.y-.5)*1.6],2);return;
    }
    const surface=SURFACE_BY_STEP[step.id];if(!surface)return;
    const inside=step.surface==='inside';const pos=this.pointerToWorld(pointer,inside);
    let matName='rawLacquer',scale=[.08,.018,.035],opacity=.72;
    if(surface==='wood'){matName='paleWood';opacity=.25;scale=[.1,.012,.05];}
    if(surface==='cloth'){matName='cloth';opacity=.55;scale=[.12,.018,.055];}
    if(surface==='coarse'){matName='jinokoCoarse';scale=[.11,.026,.06];}
    if(surface==='medium'){matName='jinokoMedium';scale=[.105,.022,.055];}
    if(surface==='fine'){matName='jinokoFine';scale=[.1,.018,.05];}
    if(surface==='sand'||surface==='matte'){matName='whitePowder';opacity=.18;scale=[.12,.01,.06];}
    if(surface==='middle'){matName='matteBlackLacquer';scale=[.11,.014,.05];}
    if(surface==='top'){matName='blackLacquer';scale=[.12,.012,.045];opacity=.85;}
    if(surface==='polish'){matName='blackLacquer';opacity=.32;scale=[.13,.008,.06];}
    if(surface==='scratch'){matName='scratch';scale=[.055,.012,.018];opacity=.85;}
    if(surface==='gold'){matName='gold';scale=[.045,.012,.025];opacity=.95;}
    const node=this.kit.sphere(1,[...pos],material(matName,{opacity,transparent:opacity<1}),this.effectsRoot,scale,'stroke',true);
    this.strokeNodes.push(node);if(this.strokeNodes.length>125){const old=this.strokeNodes.shift();if(old.parent)old.parent.remove(old);}
    if(step.id.includes('lathe')&&Math.random()<.55)this.spawnParticles('chip',pos,2);
    if(step.id==='gold-decoration'&&Math.random()<.75)this.spawnParticles('gold',pos,3);
    if(step.id==='sand-ground'&&Math.random()<.28)this.spawnParticles('mud',pos,2);
  }

  spawnParticles(type,pos,count=5){
    const params={chip:['paleWood',[.035,.012,.012],.75],gold:['goldDust',[.018,.012,.018],1.2],mud:['jinokoFine',[.026,.012,.026],.65],dust:['paper',[.015,.015,.015],1.2]}[type]||['paper',[.02,.02,.02],1];
    for(let i=0;i<count;i++){
      const node=this.kit.sphere(1,[pos[0]+rand(-.08,.08),pos[1]+rand(-.03,.09),pos[2]+rand(-.06,.06)],material(params[0],{opacity:type==='dust'?.28:.85,transparent:type==='dust'}),this.effectsRoot,params[1],'particle',true);
      this.effects.push({node,velocity:[rand(-.55,.55),rand(.25,1.15),rand(-.35,.35)],life:params[2],max:params[2],gravity:type==='dust'?.05:1.7,spin:rand(-4,4)});
    }
  }

  spawnAmbientDust(count=28,seed=1,opacityScale=1){
    const rng=seeded(seed);
    for(let i=0;i<count;i++){
      const node=this.kit.sphere(1,[rng()*8-2.5,rng()*4.5+.7,rng()*6-2.5],material('paper',{color:'#d0ad75',opacity:(.05+rng()*.13)*opacityScale,transparent:true,unlit:true}),this.effectsRoot,[.012+rng()*.02,.012+rng()*.02,.012+rng()*.02],'ambient-dust',true);
      this.effects.push({node,velocity:[(rng()-.5)*.025,.015+rng()*.02,(rng()-.5)*.018],life:999,max:999,gravity:0,spin:rng()*2,ambient:true,baseY:node.position[1],phase:rng()*TAU});
    }
  }

  setProgress(progress,step=this.step,state={}){
    this.progress=clamp(progress);if(!step)return;
    const p=this.progress;
    if(step.id==='choose-wood')return;
    if(step.id.startsWith('lathe-')){
      const index=step.id==='lathe-rough'?0:step.id==='lathe-inside'?1:2;
      const total=clamp((index+p)/3);if(this.refs.roughBowl){this.refs.roughBowl.material.opacity=1-total*.92;this.refs.roughBowl.scale=[1-total*.08,1-total*.08,1-total*.08];}
      if(this.refs.finalBowl)this.refs.finalBowl.userData.materials.forEach(m=>m.opacity=.04+total*.96);
    }
    if(step.id==='open-crack'&&this.refs.crack)this.refs.crack.scale=[1+p*.06,1,1+p*.06];
    if(step.id==='fill-crack'&&this.refs.filler)this.refs.filler.material.opacity=p;
    if(step.id==='sand-wood'&&this.refs.bowl)this.refs.bowl.rotation[1]=p*.22;
    if(step.id==='raw-lacquer'&&this.refs.bowl)this.refs.bowl.userData.materials.forEach(m=>{m.progress=p;m.wetness=p*.6;m.roughness=lerp(.7,.3,p);});
    if(step.id==='drag-cloth'&&this.refs.clothLoose){this.refs.clothLoose.position=[lerp(-2.25,0,p),lerp(1.09,2.17,p),lerp(.52,.2,p)];this.refs.clothLoose.rotation[2]=lerp(deg(-8),0,p);}
    if(step.id==='press-cloth'&&this.refs.clothBand){this.refs.clothBand.material.opacity=.08+p*.92;this.refs.clothBand.scale=[1,lerp(1.8,1,p),1];if(this.refs.clothLoose)this.refs.clothLoose.material.opacity=1-p;}
    if(step.id==='trim-cloth'&&this.refs.clothBand)this.refs.clothBand.scale=[1,lerp(1.25,.82,p),1];
    if(step.id==='somi'&&this.refs.somiMat){this.refs.somiMat.progress=p;this.refs.somiMat.opacity=.15+p*.8;}
    if(step.id.startsWith('pour-')&&this.refs.mixSurface){const idx=['pour-lacquer','pour-paste','pour-powder'].indexOf(step.id);this.refs.mixSurface.material.color=[lerp(.49,.37,(idx+p)/3),lerp(.35,.24,(idx+p)/3),lerp(.25,.17,(idx+p)/3)];this.refs.mixSurface.scale=[1+p*.025,1,1+p*.025];}
    if(step.id==='stir-base'&&this.refs.mixSurface){this.refs.mixSurface.rotation[1]=p*TAU*2;this.refs.mixSurface.material.roughness=lerp(.8,.54,p);}
    if(step.id.startsWith('coat-')){
      const index=step.id==='coat-coarse'?0:step.id==='coat-medium'?1:2;
      this.refs.layerShells?.forEach((entry,i)=>{if(i<index){entry.mat.opacity=1;entry.mat.progress=1;}else if(i===index){entry.mat.opacity=.08+p*.92;entry.mat.progress=p;}else entry.mat.opacity=.01;});
    }
    if(step.id==='add-water'&&this.refs.water)this.refs.water.material.opacity=.05+p*.5;
    if(step.id==='sand-ground'&&this.refs.bowl){this.refs.bowl.userData.materials.forEach(m=>{m.progress=p;m.secondary=[.29,.25,.23];m.roughness=lerp(.98,.72,p);});if(this.refs.water)this.refs.water.material.opacity=.48-p*.18;}
    if(step.id==='harden-ground'&&this.refs.bowl)this.refs.bowl.userData.materials.forEach(m=>{m.secondary=[.20,.11,.08];m.progress=p;m.wetness=p*.3;});
    if(step.id==='middle-coat'&&this.refs.bowl)this.refs.bowl.userData.materials.forEach(m=>{m.progress=p;m.roughness=lerp(.88,.42,p);});
    if(step.id==='find-pits'&&this.refs.pits)this.refs.pits.forEach((pit,i)=>pit.material.opacity=clamp(p*3-i)*.75);
    if(step.id==='fill-pits'&&this.refs.pits)this.refs.pits.forEach((pit,i)=>pit.material.opacity=(1-clamp(p*3-i))*.75);
    if(step.id==='clean-room')this.effects.filter(e=>e.ambient).forEach(e=>e.node.material.opacity*=.96);
    if((step.id==='top-inside'||step.id==='top-outside')&&this.refs.topMat){const base=step.id==='top-inside'?p*.5:.5+p*.5;this.refs.topMat.progress=base;this.refs.topMat.roughness=lerp(.42,.1,base);this.refs.topMat.clearcoat=lerp(.22,.9,base);this.refs.topMat.wetness=base*.45;}
    if(step.id==='place-furo'&&this.refs.bowl){this.refs.bowl.position=[lerp(-2.1,0,p),lerp(BOWL_Y,2.03,p),lerp(.85,-.45,p)];this.refs.bowl.scale=[.88,.88,.88];}
    if(step.id==='humidity'&&this.refs.humidityNeedle)this.refs.humidityNeedle.rotation[2]=deg(-65+125*p);
    if(step.id==='rotate-bowl'&&this.refs.bowl)this.refs.bowl.rotation[1]=p*TAU*1.4;
    if(step.id==='roiro-sand'&&this.refs.roiroMat){this.refs.roiroMat.roughness=lerp(.56,.74,p);this.refs.roiroMat.clearcoat=lerp(.2,.08,p);}
    if(step.id==='surigushi'&&this.refs.roiroMat){this.refs.roiroMat.wetness=p*.4;this.refs.roiroMat.roughness=lerp(.74,.42,p);}
    if(step.id==='polish'&&this.refs.roiroMat){this.refs.roiroMat.roughness=lerp(.42,.07,p);this.refs.roiroMat.clearcoat=lerp(.25,.95,p);this.refs.roiroMat.wetness=.12;}
    if(step.id==='draw-decoration'&&this.refs.waveScratch){this.refs.waveScratch.traverse?.(node=>{if(node.material)node.material.opacity=.06+p*.78;});}
    if(step.id==='gold-decoration'&&this.refs.waveGold){this.refs.waveGold.traverse?.(node=>{if(node.material)node.material.opacity=p;});}
    if(step.id==='rotate-inspect'&&this.refs.bowl){this.refs.bowl.rotation[1]=p*TAU;if(this.refs.goldWave)this.refs.goldWave.rotation[1]=p*TAU;}
    if(step.id==='box-bowl'&&this.refs.bowl){this.refs.bowl.position=[lerp(0,2.4,p),lerp(BOWL_Y,1.15,p),lerp(0,.25,p)];this.refs.bowl.scale=[lerp(1.1,.65,p),lerp(1.1,.65,p),lerp(1.1,.65,p)];if(this.refs.goldWave){this.refs.goldWave.position=[lerp(0,2.4,p),lerp(BOWL_Y,1.15,p),lerp(0,.25,p)];this.refs.goldWave.scale=[lerp(1.1,.65,p),lerp(1.1,.65,p),lerp(1.1,.65,p)];}}
  }

  beginAuto(chapter,state={}){
    const copy=value=>value?[...value]:null;
    this.autoState={
      chapter:chapter.id,
      toolPos:copy(this.refs.tool?.position),toolRot:copy(this.refs.tool?.rotation),
      bowlPos:copy(this.refs.bowl?.position),bowlRot:copy(this.refs.bowl?.rotation),bowlScale:copy(this.refs.bowl?.scale),
      latheRot:copy(this.refs.latheSpin?.rotation),mixRot:copy(this.refs.mixSurface?.rotation),
      wood:(this.refs.woodChoices||[]).map(node=>({node,pos:copy(node.position),rot:copy(node.rotation)})),
      layerScales:(this.refs.layerShells||[]).map(entry=>copy(entry.shell.scale)),
      goldPos:copy(this.refs.goldWave?.position),goldScale:copy(this.refs.goldWave?.scale),
    };
    this.setAutoProgress(chapter,0,state);
  }

  setAutoProgress(chapter,progress,state={}){
    const p=clamp(progress),e=smoothstep(0,1,p),base=this.autoState;
    if(!base||base.chapter!==chapter.id)return;
    if(this.refs.tool&&base.toolPos){
      this.refs.tool.position=[base.toolPos[0]+e*.72,base.toolPos[1]+e*.38,base.toolPos[2]-e*.52];
      this.refs.tool.rotation=[base.toolRot?.[0]||0,(base.toolRot?.[1]||0)-e*.18,(base.toolRot?.[2]||0)+e*.12];
    }
    switch(chapter.id){
      case 0:{
        const selected=base.wood.find(item=>item.node.userData.choice===(state.wood||this.wood));
        if(selected){selected.node.position[1]=selected.pos[1]+Math.sin(p*Math.PI)*.17+e*.06;selected.node.rotation[1]=selected.rot[1]+p*TAU*.42;}
        break;
      }
      case 1:
        if(this.refs.latheSpin&&base.latheRot)this.refs.latheSpin.rotation[1]=base.latheRot[1]+p*TAU*4.2;
        if(this.refs.finalBowl)this.refs.finalBowl.userData.materials.forEach(mat=>mat.opacity=1);
        if(this.refs.roughBowl)this.refs.roughBowl.material.opacity=.04*(1-p);
        break;
      case 2:
        if(this.refs.filler){this.refs.filler.material.opacity=1;this.refs.filler.material.roughness=lerp(.72,.92,e);}
        break;
      case 3:
        this.refs.bowl?.userData.materials.forEach(mat=>{mat.progress=1;mat.wetness=lerp(.58,.06,e);mat.roughness=lerp(.29,.48,e);});
        if(this.refs.bowl&&base.bowlRot)this.refs.bowl.rotation[1]=base.bowlRot[1]+Math.sin(p*Math.PI*2)*.08;
        break;
      case 4:
        if(this.refs.clothBand){this.refs.clothBand.material.opacity=1;this.refs.clothBand.scale=[1,lerp(1,.95,e),1];}
        if(this.refs.clothLoose)this.refs.clothLoose.material.opacity=0;
        break;
      case 5:
        if(this.refs.somiMat){this.refs.somiMat.progress=1;this.refs.somiMat.opacity=1;this.refs.somiMat.wetness=lerp(.28,0,e);this.refs.somiMat.roughness=lerp(.42,.74,e);}
        break;
      case 6:
        if(this.refs.mixSurface){this.refs.mixSurface.rotation[1]=(base.mixRot?.[1]||0)+p*TAU*3.1;this.refs.mixSurface.material.roughness=lerp(.52,.66,e);this.refs.mixSurface.scale=[1.03-e*.012,1,1.03-e*.012];}
        break;
      case 7:
        this.refs.layerShells?.forEach((entry,index)=>{entry.mat.opacity=1;entry.mat.progress=1;const scale=base.layerScales[index]||entry.shell.scale;const settle=e*.004*(index+1);entry.shell.scale=[scale[0]-settle,scale[1]-settle*.5,scale[2]-settle];});
        break;
      case 8:
        if(this.refs.water)this.refs.water.material.opacity=lerp(.3,.02,e);
        if(this.refs.bowl&&base.bowlRot)this.refs.bowl.rotation[1]=base.bowlRot[1]+p*.48;
        this.refs.bowl?.userData.materials.forEach(mat=>{mat.wetness=lerp(.32,.02,e);mat.roughness=lerp(.66,.78,e);});
        break;
      case 9:
        this.refs.bowl?.userData.materials.forEach(mat=>{mat.progress=1;mat.wetness=lerp(.26,.01,e);mat.roughness=lerp(.38,.5,e);});
        this.refs.pits?.forEach(pit=>pit.material.opacity=0);
        if(this.refs.bowl&&base.bowlRot)this.refs.bowl.rotation[1]=base.bowlRot[1]+Math.sin(p*Math.PI)*.2;
        break;
      case 10:
        if(this.refs.topMat){this.refs.topMat.progress=1;this.refs.topMat.wetness=lerp(.46,.04,e);this.refs.topMat.roughness=lerp(.09,.14,e);this.refs.topMat.clearcoat=lerp(.92,.82,e);}
        if(this.refs.bowl&&base.bowlRot)this.refs.bowl.rotation[1]=base.bowlRot[1]+p*TAU*.62;
        break;
      case 11:
        if(this.refs.bowl&&base.bowlRot){this.refs.bowl.rotation[1]=base.bowlRot[1]+p*TAU*2.8;this.refs.bowl.userData.materials.forEach(mat=>{mat.wetness=lerp(.35,.015,e);mat.roughness=lerp(.09,.15,e);});}
        this.refs.drops?.forEach((drop,index)=>drop.material.opacity=(.08+(index%5)*.025)*(1-e*.25));
        break;
      case 12:
        if(this.refs.roiroMat){const pulse=Math.sin(p*Math.PI*6)*.025*(1-e);this.refs.roiroMat.roughness=lerp(.11,.055,e)+pulse;this.refs.roiroMat.clearcoat=lerp(.78,.98,e);this.refs.roiroMat.wetness=lerp(.16,.035,e);}
        if(this.refs.bowl&&base.bowlRot)this.refs.bowl.rotation[1]=base.bowlRot[1]+p*.42;
        break;
      case 13:
        if(this.refs.waveScratch)this.refs.waveScratch.traverse(node=>{if(node.material)node.material.opacity=lerp(.84,.08,e);});
        if(this.refs.waveGold)this.refs.waveGold.traverse(node=>{if(node.material)node.material.opacity=e;});
        if(this.refs.bowl&&base.bowlRot)this.refs.bowl.rotation[1]=base.bowlRot[1]+Math.sin(p*Math.PI)*.18;
        if(p>.42&&Math.random()<.12)this.spawnParticles('gold',[0,1.65,1.35],1);
        break;
      case 14:
        if(this.refs.bowl&&base.bowlPos){this.refs.bowl.position=[base.bowlPos[0],base.bowlPos[1]-e*.12,base.bowlPos[2]];this.refs.bowl.rotation[1]=(base.bowlRot?.[1]||0)+p*.22;}
        if(this.refs.goldWave&&base.goldPos){this.refs.goldWave.position=[base.goldPos[0],base.goldPos[1]-e*.12,base.goldPos[2]];this.refs.goldWave.rotation[1]=(base.bowlRot?.[1]||0)+p*.22;}
        break;
    }
  }

  endAuto(chapter,state={}){this.setAutoProgress(chapter,1,state);this.autoState=null;}

  update(dt,time,state={}){
    this.orientation=window.innerHeight>window.innerWidth?'portrait':'landscape';
    if(this.mode==='home'){
      this.refs.homeBowl&&(this.refs.homeBowl.rotation[1]=Math.sin(time*.17)*.07+this.orbit.x);
      this.camera.position=this.orientation==='portrait'?[0.8,3.9,9.7]:[1.2,3.15,8.7];this.camera.target=this.orientation==='portrait'?[.7,1.95,0]:[1.0,1.66,0];
    }else if(this.mode==='exploded'){
      this.refs.exploded&&(this.refs.exploded.rotation[1]=this.orbit.x+Math.sin(time*.12)*.04);
      this.camera.position=this.orientation==='portrait'?[0,3.7,10.1]:[0,2.9,8.3];this.camera.target=this.orientation==='portrait'?[0,1.95,0]:[0,1.65,0];
    }else if(this.mode==='final'){
      if(this.refs.bowl){this.finalSpin+=dt*.18;this.refs.bowl.rotation[1]=this.finalSpin;if(this.refs.goldWave)this.refs.goldWave.rotation[1]=this.finalSpin;}
      this.camera.position=this.orientation==='portrait'?[0,3.5,9.3]:[1.4,3.0,8.0];this.camera.target=[.6,1.55,0];
    }else{
      if(this.orientation==='portrait'){
        this.camera.position[2]=Math.max(this.camera.position[2],8.9);this.camera.position[1]+=(.08-this.camera.position[0]*.0)*dt;
      }
      if(this.refs.latheSpin)this.refs.latheSpin.rotation[1]+=dt*(this.pointer.down?9:4.6);
      if(this.chapter===11&&this.refs.bowl&&this.step?.id==='rotate-bowl')this.refs.bowl.rotation[1]+=dt*.35;
      if(this.chapter===13&&this.refs.bowl)this.refs.bowl.rotation[1]=Math.sin(time*.14)*.08;
    }
    this.orbit.x=lerp(this.orbit.x,this.targetOrbit.x,1-Math.pow(.002,dt));
    for(let i=this.effects.length-1;i>=0;i--){
      const effect=this.effects[i],n=effect.node;
      if(effect.ambient){n.position[0]+=effect.velocity[0]*dt;n.position[1]=effect.baseY+Math.sin(time*.25+effect.phase)*.12;n.position[2]+=effect.velocity[2]*dt;if(n.position[0]>5)n.position[0]=-3;if(n.position[0]<-3)n.position[0]=5;continue;}
      effect.life-=dt;if(effect.life<=0){if(n.parent)n.parent.remove(n);this.effects.splice(i,1);continue;}
      effect.velocity[1]-=effect.gravity*dt;n.position[0]+=effect.velocity[0]*dt;n.position[1]+=effect.velocity[1]*dt;n.position[2]+=effect.velocity[2]*dt;n.rotation[1]+=effect.spin*dt;n.material.opacity=clamp(effect.life/effect.max);
    }
    if(this.refs.drops)for(let i=0;i<this.refs.drops.length;i++){const d=this.refs.drops[i];d.position[1]-=dt*(.035+(i%5)*.008);if(d.position[1]<1)d.position[1]=4.15;}
  }

  setFinal(state={}){
    this.mode='final';this.clearDynamic();this.decoration=state.decoration||'chinkin';
    this.camera.position=[1.4,3.0,8.0];this.camera.target=[.6,1.55,0];this.camera.fov=38;
    const pedestal=this.kit.group(this.dynamic,'final-pedestal',[1.4,.88,.1]);
    this.kit.box([3.5,.18,2.2],[0,.09,0],material('stone',{color:'#655c51',roughness:.8}),pedestal);
    this.refs.bowl=this.kit.bowl(this.dynamic,{position:[1.4,1.06,.1],material:'blackLacquer',scale:[1.28,1.28,1.28]});
    this.refs.goldWave=this.kit.goldWave(this.dynamic,[1.4,1.06,.1],{opacity:1,scale:1.28});
    this.kit.contactShadow(this.dynamic,[1.4,1.04,.1],[1.9,1,1.15],.25);
    this.spawnAmbientDust(42,91,.9);
  }
}
