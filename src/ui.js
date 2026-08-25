'use strict';
const els={
  title:$('#title'),kana:$('#kana'),kicker:$('#kicker'),subtitle:$('#subtitle'),process:$('#process'),style:$('#styleLabel'),
  counter:$('#variantCounter'),caption:$('#captionIndex'),start:$('#startButton'),prev:$('#prevButton'),next:$('#nextButton'),
  gallery:$('#galleryButton'),brand:$('#brandButton'),tray:$('#variantTray'),close:$('#closeTrayButton'),grid:$('#variantGrid'),
  preview:$('#previewPanel'),previewLabel:$('#previewLabel'),previewHint:$('#previewHint'),previewPercent:$('#previewPercent'),previewBar:$('#previewBar'),
  orientation:$('#orientationLabel'),error:$('#errorPanel'),errorMessage:$('#errorMessage'),status:$('#renderStatus')
};
const state={cameraYaw:0,cameraPitch:0,preview:false,previewStart:0,progress:0};
let renderer,active=getVariant(),pointer=null,drag=0,raf=0,last=performance.now(),returnFocus=null;

const PREVIEW=[
  {end:.14,label:'木地を挽く',hint:'木の内側と外側を、同じ厚みに近づける'},
  {end:.28,label:'刻苧と布で守る',hint:'弱い場所を埋め、布を密着させる'},
  {end:.54,label:'地の粉を三層',hint:'粗い粒から細かい粒へ。塗って、研ぐ'},
  {end:.72,label:'中塗・上塗',hint:'埃を避け、長い刷毛で薄く均す'},
  {end:.88,label:'湿り気の中で固める',hint:'塗師風呂で、急がず待つ'},
  {end:1,label:'沈金・蒔絵',hint:'彫った溝へ金、漆で描いた面へ金粉'}
];
function previewStep(p){return PREVIEW.find(x=>p<=x.end)||PREVIEW.at(-1)}
function luminance(color){const c=hex(color).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]}

function applyVariant(v,{url=true,announce=true}={}){
  active=v;const i=VARIANTS.indexOf(v);state.cameraYaw=0;state.cameraPitch=0;state.preview=false;state.progress=0;
  document.body.dataset.variant=v.id;document.body.dataset.layout=v.layout;
  const root=document.documentElement;
  root.style.setProperty('--accent',v.accent);root.style.setProperty('--ink',v.ink);root.style.setProperty('--panel',v.panel);root.style.setProperty('--button',v.button);
  root.style.setProperty('--line',luminance(v.ink)<.42?'rgba(0,0,0,.24)':'rgba(255,255,255,.28)');
  $('meta[name="theme-color"]').setAttribute('content',v.button);
  els.title.textContent=v.name;els.kana.textContent=v.kana;els.kicker.textContent=v.kicker;els.subtitle.textContent=v.subtitle;els.process.textContent=v.process;els.style.textContent=v.style;
  els.counter.textContent=`${v.id} / ${String(VARIANTS.length).padStart(2,'0')}`;els.caption.textContent=`SCENE ${v.id}`;document.title=`${v.id} ${v.name} — 輪島塗を、つくろう。`;
  els.preview.setAttribute('aria-hidden','true');els.start.dataset.active='false';els.start.querySelector('strong').textContent='つくりはじめる';els.start.querySelector('small').textContent='さわって、工程をのぞく';
  renderer.setScene(BUILDERS[i]());
  els.grid.querySelectorAll('.variant-card').forEach(card=>card.setAttribute('aria-current',card.dataset.id===v.id?'true':'false'));
  if(url){const next=new URL(location.href);next.searchParams.set('v',v.id);next.hash='';history.replaceState({v:v.id},'',next)}
  if(announce){document.body.dataset.ready='true';document.body.dataset.scene=v.slug;els.status.textContent=`ready:${v.id}:${v.slug}`}
}
function step(delta){const i=(VARIANTS.indexOf(active)+delta+VARIANTS.length)%VARIANTS.length;applyVariant(VARIANTS[i])}
function makeCards(){
  const frag=document.createDocumentFragment();
  VARIANTS.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='variant-card';b.dataset.id=v.id;b.style.setProperty('--card-accent',v.accent);
    b.innerHTML=`<span class="variant-card-top"><span class="variant-card-number">${v.id}</span><span class="variant-card-swatch" aria-hidden="true"></span></span><strong>${v.name}</strong><small>${v.style}</small>`;
    b.addEventListener('click',()=>{applyVariant(v);closeTray()});frag.append(b)});
  els.grid.append(frag);
}
function openTray(){returnFocus=document.activeElement;els.tray.hidden=false;requestAnimationFrame(()=>{const current=els.grid.querySelector('[aria-current="true"]');(current||els.close).focus({preventScroll:true});current?.scrollIntoView({block:'nearest'})})}
function closeTray(){if(els.tray.hidden)return;els.tray.hidden=true;returnFocus?.focus?.({preventScroll:true})}
function beginPreview(){state.preview=true;state.previewStart=performance.now();state.progress=0;els.preview.setAttribute('aria-hidden','false');els.start.dataset.active='true';els.start.querySelector('strong').textContent='工程を見ています';els.start.querySelector('small').textContent='もう一度押すと、最初から'}
function updatePreview(now){
  if(!state.preview)return;state.progress=clamp((now-state.previewStart)/6800,0,1);const stage=previewStep(state.progress);
  els.previewLabel.textContent=stage.label;els.previewHint.textContent=stage.hint;els.previewPercent.textContent=`${Math.round(state.progress*100)}%`;els.previewBar.style.width=`${state.progress*100}%`;
  if(state.progress>=1){state.preview=false;els.start.dataset.active='false';els.start.querySelector('strong').textContent='もういちど見る';els.start.querySelector('small').textContent='木地から完成まで、6.8秒の予告編';setTimeout(()=>els.preview.setAttribute('aria-hidden','true'),1000)}
}
function updateOrientation(){const portrait=innerHeight>innerWidth;document.body.dataset.orientation=portrait?'portrait':'landscape';els.orientation.textContent=portrait?'PORTRAIT / TOUCH READY':'LANDSCAPE / TOUCH READY'}

function bind(){
  els.prev.addEventListener('click',()=>step(-1));els.next.addEventListener('click',()=>step(1));els.gallery.addEventListener('click',openTray);els.brand.addEventListener('click',()=>applyVariant(VARIANTS[0]));
  els.close.addEventListener('click',closeTray);els.tray.querySelector('[data-close-tray]').addEventListener('click',closeTray);els.start.addEventListener('click',beginPreview);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};drag=0;canvas.setPointerCapture?.(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;drag+=Math.hypot(dx,dy);
    /* 4歳児向け: 小さな移動を1.4倍前後の読みやすいカメラ応答へ。ただし上下反転はさせない。 */
    state.cameraYaw+=dx*.0048;state.cameraPitch=clamp(state.cameraPitch+dy*.0036,-.38,.38)});
  const release=e=>{if(!pointer||pointer.id!==e.pointerId)return;canvas.releasePointerCapture?.(e.pointerId);pointer=null;if(drag<9&&!state.preview)beginPreview()};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  addEventListener('resize',updateOrientation,{passive:true});addEventListener('orientationchange',updateOrientation,{passive:true});
  addEventListener('popstate',()=>applyVariant(getVariant(),{url:false}));
  document.addEventListener('keydown',e=>{if(!els.tray.hidden&&e.key==='Escape'){closeTray();return}if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);if((e.key==='g'||e.key==='G')&&els.tray.hidden)openTray()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();showError(new Error('3D描画が一時停止しました。ページを再読み込みしてください。'))});
}
function loop(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;updatePreview(now);renderer.render(now/1000,state,dt);raf=requestAnimationFrame(loop)}
function showError(error){console.error(error);els.errorMessage.textContent=error instanceof Error?error.message:String(error);els.error.hidden=false;document.body.dataset.ready='error';els.status.textContent=`error:${els.errorMessage.textContent}`}
try{makeCards();renderer=new Renderer(canvas);bind();updateOrientation();applyVariant(active,{url:false});raf=requestAnimationFrame(loop)}catch(error){showError(error)}
