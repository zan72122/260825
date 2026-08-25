import { Node } from './renderer.js';
import { makeBox,makePlane,makeCylinder,makeSphere,makeTorus,makeLathe,makeDisc,makeRibbon,makeCone,OUTER_BOWL_PROFILE,INNER_BOWL_PROFILE,ROUGH_BOWL_PROFILE,bowlRadiusAtY } from './geometry.js';
import { material } from './materials.js';
import { TAU, deg, lerp, rand, seeded, v3Normalize, v3Sub, v3Length } from './math.js';

const GEO={
  box:makeBox(),plane:makePlane(),cylinder:makeCylinder(36),cylinderLow:makeCylinder(16),sphere:makeSphere(28,16),sphereLow:makeSphere(14,8),disc:makeDisc(48),
};

export class SceneKit{
  constructor(){this.named=new Map();this.geometryCache=new Map();}
  cached(key,factory){if(!this.geometryCache.has(key))this.geometryCache.set(key,factory());return this.geometryCache.get(key);}
  node(options={},parent=null){const n=new Node(options);if(parent)parent.add(n);if(options.name)this.named.set(options.name,n);return n;}
  group(parent=null,name='group',position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){return this.node({name,position,rotation,scale},parent);}
  mesh(geometry,mat,parent,options={}){return this.node({geometry,material:mat,parent,...options},parent);}
  box(size,pos,mat,parent,rot=[0,0,0],name='box'){return this.mesh(GEO.box,mat,parent,{name,position:pos,rotation:rot,scale:[size[0]/2,size[1]/2,size[2]/2]});}
  plane(size,pos,mat,parent,rot=[0,0,0],name='plane'){return this.mesh(GEO.plane,mat,parent,{name,position:pos,rotation:rot,scale:[size[0]/2,1,size[1]/2]});}
  cylinder(radius,height,pos,mat,parent,segments=36,rot=[0,0,0],name='cylinder'){
    const g=segments===36?GEO.cylinder:segments===16?GEO.cylinderLow:makeCylinder(segments);
    return this.mesh(g,mat,parent,{name,position:pos,rotation:rot,scale:[radius,height/2,radius]});
  }
  cone(radius,height,pos,mat,parent,rot=[0,0,0],name='cone'){
    return this.mesh(this.cached('cone:24',()=>makeCone(24)),mat,parent,{name,position:pos,rotation:rot,scale:[radius,height/2,radius]});
  }
  sphere(radius,pos,mat,parent,scale=[1,1,1],name='sphere',low=false){return this.mesh(low?GEO.sphereLow:GEO.sphere,mat,parent,{name,position:pos,scale:[radius*scale[0],radius*scale[1],radius*scale[2]]});}
  torus(major,minor,pos,mat,parent,rot=[0,0,0],name='torus',arc=TAU){const key=`torus:${major.toFixed(4)}:${minor.toFixed(4)}:${arc.toFixed(4)}`;return this.mesh(this.cached(key,()=>makeTorus(major,minor,56,12,arc)),mat,parent,{name,position:pos,rotation:rot});}
  disc(radius,pos,mat,parent,rot=[0,0,0],name='disc'){return this.mesh(GEO.disc,mat,parent,{name,position:pos,rotation:rot,scale:[radius,1,radius]});}
  lathe(profile,pos,mat,parent,options={}){const segments=options.segments||64,arc=options.arc||TAU,flip=options.flip||false;const key=`lathe:${segments}:${arc.toFixed(4)}:${flip?1:0}:${JSON.stringify(profile)}`;return this.mesh(this.cached(key,()=>makeLathe(profile,segments,arc,flip)),mat,parent,{name:options.name||'lathe',position:pos,rotation:options.rotation||[0,0,0],scale:options.scale||[1,1,1]});}
  ribbon(points,width,mat,parent,options={}){const normal=options.normal||[0,1,0];const key=`ribbon:${width.toFixed(4)}:${JSON.stringify(normal)}:${JSON.stringify(points)}`;return this.mesh(this.cached(key,()=>makeRibbon(points,width,normal)),mat,parent,{name:options.name||'ribbon',position:options.position||[0,0,0],rotation:options.rotation||[0,0,0]});}

  contactShadow(parent,pos=[0,.012,0],scale=[1.8,1,1.15],opacity=.22){const node=this.disc(1,pos,material('shadow',{opacity}),parent,[0,0,0],'contact-shadow');node.scale=scale;return node;}

  bowl(parent,options={}){
    const group=this.group(parent,options.name||'bowl',options.position||[0,0,0],options.rotation||[0,0,0],options.scale||[1,1,1]);
    const outerMat=options.outerMaterial||material(options.material||'keyaki');
    const innerMat=options.innerMaterial||outerMat;
    const arc=options.arc||TAU,rotation=options.arcRotation?[0,options.arcRotation,0]:[0,0,0];
    const profile=options.rough?ROUGH_BOWL_PROFILE:OUTER_BOWL_PROFILE;
    const outer=this.lathe(profile,[0,0,0],outerMat,group,{arc,rotation,name:'bowl-outer'});
    const inner=this.lathe(INNER_BOWL_PROFILE,[0,0,0],innerMat,group,{arc,flip:true,rotation,name:'bowl-inner'});
    const rim=this.torus(1.49,.045,[0,1.47,0],outerMat,group,[0,0,0],'bowl-rim',arc);
    if(arc<TAU-.05){outer.rotation.y=rotation[1];inner.rotation.y=rotation[1];rim.rotation.y=rotation[1];}
    const foot=this.cylinder(.49,.12,[0,.06,0],outerMat,group,36,[0,0,0],'bowl-foot');
    const footRing=this.torus(.44,.035,[0,.12,0],outerMat,group,[0,0,0],'bowl-foot-ring');
    group.userData={outer,inner,rim,foot,footRing,materials:[outerMat,innerMat]};
    if(options.shadow!==false)this.contactShadow(parent,[group.position[0],.018,group.position[2]],[1.45,1,.88],options.shadowOpacity??.2);
    return group;
  }

  explodedBowl(parent,options={}){
    const root=this.group(parent,options.name||'exploded-bowl',options.position||[0,0,0],options.rotation||[0,0,0],options.scale||[1,1,1]);
    const layers=options.layers||[
      ['keyaki',0],['cloth',.022],['jinokoCoarse',.045],['jinokoMedium',.068],['jinokoFine',.09],['matteBlackLacquer',.112],['blackLacquer',.135],['gold',.157]
    ];
    const arc=options.arc||5.28,arcRotation=options.arcRotation??deg(115);
    root.userData.layerNodes=[];
    layers.forEach(([matName,offset],index)=>{
      const scale=1+offset;
      const mat=material(matName,{opacity:index===layers.length-1&&matName==='gold'?.92:1,transparent:index===layers.length-1&&matName==='gold'});
      const shell=this.lathe(OUTER_BOWL_PROFILE,[index*.034,index*.045,0],mat,root,{arc,rotation:[0,arcRotation,0],scale:[scale,1+offset*.58,scale],name:`layer-${index}`});
      root.userData.layerNodes.push(shell);
      const a=arcRotation,b=arcRotation+arc;
      for(const angle of [a,b]){
        const pts=OUTER_BOWL_PROFILE.map(([r,y])=>[Math.cos(angle)*r*scale,y*(1+offset*.58),Math.sin(angle)*r*scale]);
        this.ribbon(pts,.025+(index*.0015),material(matName,{roughness:.82}),root,{normal:[Math.sin(angle),0,-Math.cos(angle)],name:`cut-${index}`});
      }
    });
    this.cylinder(.48,.12,[0,.06,0],material('keyaki'),root,36,[0,0,0],'exploded-foot');
    return root;
  }

  brush(parent,pos=[0,0,0],options={}){
    const g=this.group(parent,options.name||'brush',pos,options.rotation||[0,0,deg(-18)],options.scale||[1,1,1]);
    this.cylinder(.075,1.45,[0,.68,0],material(options.handle||'darkWood'),g,20,[0,0,0],'brush-handle');
    this.cylinder(.1,.18,[0,-.08,0],material('iron',{roughness:.5}),g,20,[0,0,0],'brush-ferrule');
    this.box([.22,.52,.07],[0,-.39,0],material(options.brushMaterial||'charcoal',{color:options.brushColor||'#2d1c15',roughness:.72}),g,[0,0,0],'brush-hair');
    return g;
  }

  spatula(parent,pos=[0,0,0],options={}){
    const g=this.group(parent,options.name||'spatula',pos,options.rotation||[0,0,deg(-28)],options.scale||[1,1,1]);
    this.cylinder(.065,.92,[0,.4,0],material(options.handle||'darkWood'),g,18);
    this.box([.42,.5,.045],[0,-.3,0],material(options.blade||'steel'),g,[0,0,0],'spatula-blade');
    return g;
  }

  knife(parent,pos=[0,0,0],options={}){
    const g=this.group(parent,options.name||'knife',pos,options.rotation||[0,0,deg(-38)],options.scale||[1,1,1]);
    this.box([.16,.82,.12],[0,.32,0],material('darkWood'),g);
    this.box([.09,.62,.025],[0,-.38,0],material('steel'),g,[0,0,deg(-4)]);
    return g;
  }

  whetstone(parent,pos=[0,0,0],options={}){
    const g=this.group(parent,options.name||'whetstone',pos,options.rotation||[deg(12),0,deg(-18)],options.scale||[1,1,1]);
    this.box([.54,.2,.27],[0,0,0],material('whetstone'),g);
    return g;
  }

  clothPad(parent,pos=[0,0,0],options={}){
    const g=this.group(parent,options.name||'cloth-pad',pos,options.rotation||[deg(18),0,deg(-12)],options.scale||[1,1,1]);
    this.box([.68,.12,.5],[0,0,0],material(options.material||'cloth'),g);
    return g;
  }

  jar(parent,pos=[0,0,0],options={}){
    const g=this.group(parent,options.name||'jar',pos,options.rotation||[0,0,0],options.scale||[1,1,1]);
    const mat=options.color?material(options.material||'ceramic',{color:options.color}):material(options.material||'ceramic');
    this.cylinder(options.radius||.38,options.height||.62,[0,(options.height||.62)/2,0],mat,g,32);
    this.torus((options.radius||.38)*.74,.035,[0,(options.height||.62)+.02,0],mat,g);
    if(options.contents)this.disc((options.radius||.38)*.68,[0,(options.height||.62)+.035,0],material(options.contents),g);
    return g;
  }

  shelfBowl(parent,pos,matName='blackLacquer',scale=.4){return this.bowl(parent,{position:pos,scale:[scale,scale,scale],material:matName,shadow:false});}

  woodChips(parent,position,count=18,seed=9){
    const rng=seeded(seed),group=this.group(parent,'wood-chips');
    for(let i=0;i<count;i++){
      const x=position[0]+(rng()-.5)*2.6,z=position[2]+(rng()-.5)*1.3;
      this.box([.06+rng()*.13,.018,.018+rng()*.04],[x,.045+rng()*.04,z],material('paleWood',{roughness:.95}),group,[rng()*.4,rng()*3,rng()*.4]);
    }
    return group;
  }

  goldWave(parent,bowlPos=[0,0,0],options={}){
    const scale=Array.isArray(options.scale)?options.scale:[options.scale||1,options.scale||1,options.scale||1];
    const group=this.group(parent,options.name||'gold-wave',bowlPos,options.rotation||[0,0,0],scale);
    const opacity=options.opacity??1,matName=options.material||'gold';
    const mat=material(matName,{opacity,transparent:opacity<1,doubleSided:true,roughness:matName==='scratch'?.5:.23});
    const buildLine=(rangeA,rangeB,baseY,amplitude,phase,width,name)=>{
      const count=options.count||72,points=[];
      for(let i=0;i<count;i++){
        const t=i/(count-1),angle=lerp(rangeA,rangeB,t);
        const localY=baseY+Math.sin(t*Math.PI*2.15+phase)*amplitude+Math.sin(t*Math.PI)*.12;
        const r=bowlRadiusAtY(localY)+.018;
        points.push([Math.sin(angle)*r,localY,Math.cos(angle)*r+.018]);
      }
      return this.ribbon(points,width,mat,group,{normal:[0,0,1],name});
    };
    buildLine(-1.02,1.08,.62,.105,0,matName==='scratch'?.0065:.018,'wave-main');
    buildLine(-.82,.72,.48,.062,1.15,matName==='scratch'?.0048:.012,'wave-low');
    // A short broken crest keeps the decoration directional rather than mechanically symmetric.
    buildLine(.18,.92,.86,.045,2.1,matName==='scratch'?.004:.01,'wave-crest');
    return group;
  }
}

export const BASIC_GEO=GEO;
