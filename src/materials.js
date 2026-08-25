import { makeMaterial } from './renderer.js';
import { hexToRgb } from './math.js';

const MATERIALS={
  darkWood:{color:'#4b2d1d',secondary:'#4b2d1d',roughness:.72,kind:1,patternScale:1.1},
  paleWood:{color:'#a87543',secondary:'#a87543',roughness:.66,kind:1,patternScale:.9},
  keyaki:{color:'#8b5a2f',secondary:'#8b5a2f',roughness:.68,kind:1,patternScale:1.3},
  katsura:{color:'#aa7648',secondary:'#aa7648',roughness:.74,kind:1,patternScale:.8},
  hiba:{color:'#b08a5c',secondary:'#b08a5c',roughness:.72,kind:1,patternScale:.72},
  rawLacquer:{color:'#432619',secondary:'#24120c',roughness:.32,clearcoat:.12,kind:2,patternScale:1.4,wetness:.52},
  blackLacquer:{color:'#120907',secondary:'#120907',roughness:.12,clearcoat:.84,kind:2,patternScale:1.4,wetness:.2},
  matteBlackLacquer:{color:'#160d0a',secondary:'#160d0a',roughness:.48,clearcoat:.18,kind:2,patternScale:1.2},
  vermilionLacquer:{color:'#8f2419',secondary:'#b43322',roughness:.15,clearcoat:.72,kind:2,patternScale:1.25,wetness:.18},
  cloth:{color:'#bfae8b',secondary:'#bfae8b',roughness:.94,kind:3,patternScale:1.05},
  clothDark:{color:'#897558',secondary:'#897558',roughness:.96,kind:3,patternScale:1.1},
  jinokoCoarse:{color:'#8d6546',secondary:'#8d6546',roughness:.98,kind:4,patternScale:1.5},
  jinokoMedium:{color:'#6f4d37',secondary:'#6f4d37',roughness:.94,kind:4,patternScale:1.05},
  jinokoFine:{color:'#50372b',secondary:'#50372b',roughness:.9,kind:4,patternScale:.72},
  paper:{color:'#ddd2bd',secondary:'#ddd2bd',roughness:.96,kind:5,patternScale:1.2},
  gold:{color:'#c99a3e',secondary:'#f0cd6d',roughness:.22,metalness:.94,kind:6,patternScale:1.2},
  goldDust:{color:'#b8842e',secondary:'#e9c65b',roughness:.34,metalness:.9,kind:6,patternScale:2.4},
  water:{color:'#6e9a9a',secondary:'#89b4b0',roughness:.08,clearcoat:.45,opacity:.58,transparent:true,doubleSided:true,kind:7,patternScale:1},
  stone:{color:'#797269',secondary:'#797269',roughness:.9,kind:8,patternScale:1.3},
  whetstone:{color:'#686259',secondary:'#686259',roughness:.86,kind:8,patternScale:1.7},
  iron:{color:'#3c3a37',secondary:'#3c3a37',roughness:.48,metalness:.62,kind:9,patternScale:1.3},
  steel:{color:'#777b78',secondary:'#777b78',roughness:.32,metalness:.82,kind:9,patternScale:1.2},
  charcoal:{color:'#211b18',secondary:'#211b18',roughness:.96,kind:10,patternScale:1.3},
  paste:{color:'#b69b74',secondary:'#b69b74',roughness:.82,kind:11,patternScale:1.1},
  layerCut:{color:'#9b704e',secondary:'#9b704e',roughness:.86,kind:12,patternScale:1},
  scratch:{color:'#3a2118',secondary:'#3a2118',roughness:.66,kind:13,patternScale:1},
  ceramic:{color:'#b7aa96',secondary:'#b7aa96',roughness:.58,kind:8,patternScale:.7},
  redClay:{color:'#8b4934',secondary:'#8b4934',roughness:.88,kind:4,patternScale:1.1},
  shadow:{color:'#000000',secondary:'#000000',roughness:1,opacity:.22,transparent:true,unlit:true,doubleSided:true},
  glass:{color:'#aec5c1',secondary:'#aec5c1',roughness:.1,opacity:.22,transparent:true,clearcoat:.5,doubleSided:true},
  mist:{color:'#d8d7cd',secondary:'#d8d7cd',roughness:1,opacity:.16,transparent:true,unlit:true,doubleSided:true},
  redThread:{color:'#7a2b20',secondary:'#7a2b20',roughness:.8,kind:3},
  whitePowder:{color:'#d5c8b1',secondary:'#e5ddce',roughness:1,kind:4,patternScale:2},
};

export function material(name,overrides={}){
  const base=MATERIALS[name];
  if(!base)throw new Error(`Unknown material: ${name}`);
  const result=makeMaterial({...base,...overrides});
  if(overrides.color)result.color=hexToRgb(overrides.color);
  if(overrides.secondary)result.secondary=hexToRgb(overrides.secondary);
  return result;
}

export const LAYERS=[
  {id:'wood',name:'木地',reading:'きじ',color:'#a87543',material:'keyaki',detail:'ケヤキなどの木を、ろくろで薄く挽く。'},
  {id:'cloth',name:'布着せ',reading:'ぬのきせ',color:'#c5b58f',material:'cloth',detail:'口や底など、弱いところを麻布で守る。'},
  {id:'coarse',name:'一辺地',reading:'いっぺんじ',color:'#8d6546',material:'jinokoCoarse',detail:'粗い輪島地の粉で、強い骨格をつくる。'},
  {id:'medium',name:'二辺地',reading:'にへんじ',color:'#6f4d37',material:'jinokoMedium',detail:'中くらいの粒で、凹凸を小さくする。'},
  {id:'fine',name:'三辺地',reading:'さんべんじ',color:'#50372b',material:'jinokoFine',detail:'細かい粒で、上塗のための面を整える。'},
  {id:'middle',name:'中塗',reading:'なかぬり',color:'#2d1711',material:'matteBlackLacquer',detail:'下地を覆う、最初の連続した漆の面。'},
  {id:'top',name:'上塗',reading:'うわぬり',color:'#120907',material:'blackLacquer',detail:'埃を避け、長い刷毛で一息に塗る。'},
  {id:'decoration',name:'沈金・蒔絵',reading:'ちんきん・まきえ',color:'#c99a3e',material:'gold',detail:'彫った溝、または漆で描いた線へ金を定着させる。'},
];

export function cloneMaterial(value){
  return {...value,color:[...value.color],secondary:[...value.secondary]};
}
