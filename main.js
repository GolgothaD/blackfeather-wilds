// Blackfeather Wilds — game
(function(){
'use strict';
const {SPECIES,ORDER,makeBird,animBird}=BIRDS;
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,dist2=(ax,az,bx,bz)=>Math.hypot(ax-bx,az-bz);
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
// ---------- settings
const SET=Object.assign({gfx:'auto',stick:'L',hand:'left',invert:false,vib:true,sound:true,sens:1,autoQ:null},JSON.parse(localStorage.getItem('bfw-settings')||'{}'));
function saveSet(){localStorage.setItem('bfw-settings',JSON.stringify(SET))}
const PRESETS={low:{pr:.75,shadows:0,seg:192,hdr:0,detail:0,trees:.42,grass:0,gfield:0,clouds:0,life:.45,bloom:0,fog:.0042,view:430,aa:false,rain:350},
 med:{pr:1.25,shadows:1024,seg:320,hdr:1,detail:1,trees:.7,grass:1,gfield:9000,clouds:1,life:.75,bloom:0,fog:.003,view:620,aa:true,rain:800},
 high:{pr:2,shadows:2048,seg:512,hdr:1,detail:2,trees:1,grass:1,gfield:22000,clouds:2,life:1,bloom:1,fog:.0024,view:900,aa:true,rain:1500}};
function presetName(){return SET.gfx==='auto'?(SET.autoQ||(isTouch?'med':'high')):SET.gfx}
let Q=PRESETS[presetName()];
// ---------- renderer / scene
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:Q.aa||!isTouch,powerPreference:'high-performance'});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x9fb8d2,Q.fog);
const camera=new THREE.PerspectiveCamera(62,1,.1,5000);
W.maxAniso=Math.min(Q.detail?16:4,renderer.capabilities.getMaxAnisotropy()||4);W.Q0=Q;const sky=W.makeSky(scene);
const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.shadow.bias=-.0004;sun.shadow.normalBias=.12;scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(0xbfd4ff,0x3a3020,.6);scene.add(hemi);
const flash=new THREE.AmbientLight(0xcfd8ff,0);scene.add(flash);
function applyQuality(){Q=PRESETS[presetName()];renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,Q.pr));
 renderer.shadowMap.enabled=!!Q.shadows;sun.castShadow=!!Q.shadows;if(Q.shadows){sun.shadow.mapSize.set(Q.shadows,Q.shadows);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}
  const c=sun.shadow.camera;c.left=c.bottom=-70;c.right=c.top=70;c.near=1;c.far=600;c.updateProjectionMatrix()}
 scene.fog.density=Q.fog;if(W.terrain){W.buildTerrain(Q.seg);W.setTreeDensity(Q.trees);W.setCards&&W.setCards(!!Q.grass);W.indexPerches();W.grass.count=Q.grass?W.grassMax:0;if(W.setGrassField)W.setGrassField(Q.gfield,Q.gfield>12000?34:26);if(window.LIFE)LIFE.setDensity(Q.life)}if(window.BLOOM)BLOOM.setOn(!!Q.bloom);
 scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true});resize()}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?74:60;camera.updateProjectionMatrix();document.body.classList.toggle('portrait',w<h)}
addEventListener('resize',resize);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,Q.pr));
W.build(scene,Q);applyQuality();
// ---------- audio
const AU={ctx:null};
function auInit(){if(AU.ctx||!SET.sound)return;try{const c=new (window.AudioContext||window.webkitAudioContext)();AU.ctx=c;const m=c.createGain();m.gain.value=.7;m.connect(c.destination);AU.m=m;
 const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nb=nb;
 const mk=(f,q)=>{const s=c.createBufferSource();s.buffer=nb;s.loop=true;const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.value=0;s.connect(fl).connect(g).connect(m);s.start();return {g,fl}};
 AU.wind=mk(500,.6);AU.rain=mk(2500,.4);AU.water=mk(900,.8)}catch(e){}}
function tone(type,f0,f1,dur,vol,delay){const c=AU.ctx;if(!c||!SET.sound)return;const t=c.currentTime+(delay||0);const o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(g).connect(AU.m);o.start(t);o.stop(t+dur+.05)}
function pwSfx(k){const base={gold:880,plume:660,berry:520,talon:330,shadow:220,thermal:440}[k]||600;[0,4,7,12].forEach((n,i)=>tone('triangle',base*Math.pow(2,n/12),base*Math.pow(2,n/12)*1.01,.35,.07,i*.07));tone('sine',base*4,base*2,.6,.03,.28)}
function noise(dur,f,vol,type,delay){const c=AU.ctx;if(!c||!SET.sound)return;const t=c.currentTime+(delay||0);const s=c.createBufferSource();s.buffer=AU.nb;const fl=c.createBiquadFilter();fl.type=type||'lowpass';fl.frequency.value=f;const g=c.createGain();
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0005,t+dur);s.connect(fl).connect(g).connect(AU.m);s.start(t,Math.random());s.stop(t+dur+.05)}
const SFX={flap:()=>noise(.16,700,.22),caw:()=>{for(let i=0;i<3;i++){tone('sawtooth',620,430,.22,.12,i*.28);tone('square',1240,700,.2,.03,i*.28)}},
 screech:()=>{tone('sawtooth',2400,1500,.9,.09);tone('sine',3000,1800,.8,.06)},hoot:()=>{tone('sine',320,280,.35,.25);tone('sine',300,260,.6,.22,.45)},kee:()=>{tone('sawtooth',2200,1700,.35,.08);tone('sawtooth',2300,1700,.35,.08,.4)},
 eat:()=>{for(let i=0;i<4;i++)noise(.06,2200,.18,'bandpass',i*.09)},drink:()=>{for(let i=0;i<3;i++)tone('sine',500,900,.12,.12,i*.15)},pick:()=>tone('triangle',700,1100,.12,.15),shiny:()=>{tone('sine',1500,1500,.3,.1);tone('sine',2250,2250,.4,.07,.1)},
 hit:()=>{noise(.3,500,.5);tone('square',140,60,.3,.15)},thunder:()=>{noise(2.5,180,.9);noise(1.2,400,.4,'lowpass',.1)},splash:()=>noise(.5,1600,.35,'bandpass'),build:()=>{for(let i=0;i<5;i++)noise(.07,1200,.2,'bandpass',i*.12)},
 ok:()=>tone('triangle',660,990,.12,.1),nav:()=>tone('triangle',520,520,.05,.05),growl:()=>{noise(.6,250,.35);tone('sawtooth',90,70,.6,.08)}};
function abilitySfx(id){({crow:SFX.caw,hawk:SFX.kee,falcon:SFX.kee,owl:SFX.hoot,eagle:SFX.screech})[id]()}
function rumble(s,w,d){if(!SET.vib)return;const p=padObj();if(p&&p.vibrationActuator&&p.vibrationActuator.playEffect){try{p.vibrationActuator.playEffect('dual-rumble',{duration:d||200,strongMagnitude:s,weakMagnitude:w})}catch(e){}}else if(navigator.vibrate&&isTouch){try{navigator.vibrate(d||60)}catch(e){}}}
// ---------- input
const K={};addEventListener('keydown',e=>{if(e.code==='Tab')e.preventDefault();K[e.code]=true;auInit()});addEventListener('keyup',e=>{K[e.code]=false});
let padIdx=null;addEventListener('gamepadconnected',e=>{padIdx=e.gamepad.index;document.body.classList.add('pad');(window.toast||(()=>{}))('Controller connected')});
addEventListener('gamepaddisconnected',()=>{padIdx=null;document.body.classList.remove('pad')});
function padObj(){const ps=navigator.getGamepads?navigator.getGamepads():[];if(padIdx!=null&&ps[padIdx])return ps[padIdx];for(const p of ps)if(p&&p.connected){padIdx=p.index;if(!document.body.classList.contains('pad')){document.body.classList.add('pad');window.__setHint&&window.__setHint()}return p}return null}
const TI={mx:0,my:0,cx:0,cy:0,flap:false,dive:false,brake:false,tap:{}};// touch input
// desktop: pointer-lock mouse look, LMB flap, RMB dive, controller/keyboard hint
if(!isTouch){const locked=()=>document.pointerLockElement===canvas;
 canvas.addEventListener('mousedown',e=>{auInit&&auInit();if(!locked()){try{canvas.requestPointerLock()}catch(_){}return}if(e.button===0)TI.flap=true;if(e.button===2)TI.dive=true;if(e.button===1){e.preventDefault();TI.tap.lock=true}});
 addEventListener('mouseup',e=>{if(e.button===0)TI.flap=false;if(e.button===2)TI.dive=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 addEventListener('mousemove',e=>{if(!locked())return;const k=.035*(SET.sens||1);TI.cx+=e.movementX*k;TI.cy+=e.movementY*k*(SET.invert?-1:1)});
 const hint=document.createElement('div');hint.id='ctlHint';document.body.appendChild(hint);
 const setHint=()=>{hint.innerHTML=document.body.classList.contains('pad')?'🎮 LS move · RS look · A flap · B land · X act · RB skill · Y build · View bag · LS-click scan · LB lock · RT dive · LT brake · ↑ map':
  '⌨ WASD steer · Space flap · Shift dive · Q land · E act · R skill · B build · I bag · F scan · Tab lock · M map · Esc pause · or plug in a controller'};
 setHint();addEventListener('gamepadconnected',()=>{setHint();hint.classList.add('flash');setTimeout(()=>hint.classList.remove('flash'),1500)});addEventListener('gamepaddisconnected',()=>{document.body.classList.remove('pad');padIdx=null;setHint()});
 window.__setHint=setHint}
const prevB={};let I={};
const dz=v=>Math.abs(v)<.16?0:(v-Math.sign(v)*.16)/.84;
function readInput(){const p=padObj();const b=n=>!!(p&&p.buttons[n]&&p.buttons[n].pressed);const bv=n=>p&&p.buttons[n]?p.buttons[n].value:0;
 let mx=0,my=0,cx=0,cy=0;if(p){mx=dz(p.axes[0]||0);my=dz(p.axes[1]||0);cx=dz(p.axes[2]||0);cy=dz(p.axes[3]||0)}
 if(K.KeyA||K.ArrowLeft)mx-=1;if(K.KeyD||K.ArrowRight)mx+=1;if(K.KeyW||K.ArrowUp)my-=1;if(K.KeyS||K.ArrowDown)my+=1;
 if(K.KeyJ)cx-=1;if(K.KeyL)cx+=1;
 mx+=TI.mx;my+=TI.my;cx+=TI.cx;cy+=TI.cy;TI.cx=0;TI.cy=0;
 const held={flap:b(0)||K.Space||TI.flap,dive:bv(7)>.3||K.ShiftLeft||TI.dive,brake:bv(6)>.3||K.ControlLeft,land:b(1)||K.KeyQ,act:b(2)||K.KeyE,ab:b(5)||K.KeyR,pause:b(9)||K.Escape||K.KeyP,map:b(12)||K.KeyM,build:b(3)||K.KeyB,inv:b(8)||K.KeyI,scan:b(10)||b(13)||K.KeyF,
  up:b(12),down:b(13),left:b(14),right:b(15),lb:b(4),rb:b(5),lock:b(4)||b(11)||K.Tab};
 const n={mx:clamp(mx,-1,1),my:clamp(my,-1,1),cx,cy,diveV:Math.max(bv(7),held.dive?1:0),brakeV:bv(6)};
 for(const k in held){n[k]=held[k];n[k+'E']=held[k]&&!prevB[k];prevB[k]=held[k]}
 for(const k in TI.tap){if(TI.tap[k]){n[k+'E']=true;TI.tap[k]=false}}
 // stick as menu nav
 const sy=p?(p.axes[1]||0):0,sx=p?(p.axes[0]||0):0;const nav=(k,v)=>{const h=v;n[k+'N']=h&&!prevB[k+'N'];prevB[k+'N']=h};
 nav('up',n.up||sy<-.6||K.ArrowUp);nav('down',n.down||sy>.6||K.ArrowDown);nav('left',n.left||sx<-.6||K.ArrowLeft);nav('right',n.right||sx>.6||K.ArrowRight);
 n.ok=n.flapE&&!(K.Space&&false)||(K.Enter&&!prevB.enter);prevB.enter=K.Enter;n.back=n.landE||(K.Backspace&&!prevB.bk);prevB.bk=K.Backspace;
 I=n;return n}
// touch controls
const tStick=$('#stick'),tKnob=$('#knob');let stickT=null,camT=null,stickO={x:0,y:0};
function stickR(){return {S:60,M:78,L:95}[SET.stick]||95}
function layoutTouch(){document.body.classList.toggle('lefty',SET.hand==='right');const r=stickR();tStick.style.width=tStick.style.height=r*2+'px';tKnob.style.width=tKnob.style.height=r*.9+'px';parkStick()}
function parkStick(){const r=stickR();tStick.classList.remove('live');const x=SET.hand==='right'?innerWidth-r-34:r+34;const y=innerHeight-r-(document.body.classList.contains('portrait')?120:40);
 tStick.style.left=x-r+'px';tStick.style.top=y-r+'px';tKnob.style.transform='translate(-50%,-50%)'}
function inStickZone(x,y){const left=SET.hand!=='right';return (left?x<innerWidth*.45:x>innerWidth*.55)&&y>innerHeight*.3}
const tz=$('#tzone');
tz.addEventListener('touchstart',e=>{auInit();for(const t of e.changedTouches){if(stickT==null&&inStickZone(t.clientX,t.clientY)){stickT=t.identifier;stickO={x:t.clientX,y:t.clientY};const r=stickR();tStick.classList.add('live');tStick.style.left=t.clientX-r+'px';tStick.style.top=t.clientY-r+'px'}
 else if(camT==null){camT={id:t.identifier,x:t.clientX,y:t.clientY}}}e.preventDefault()},{passive:false});
tz.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===stickT){const r=stickR();let dx=t.clientX-stickO.x,dy=t.clientY-stickO.y;const l=Math.hypot(dx,dy);if(l>r){dx*=r/l;dy*=r/l}
  tKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;TI.mx=dx/r;TI.my=dy/r}
 else if(camT&&t.identifier===camT.id){TI.cx+=(t.clientX-camT.x)*.09;TI.cy+=(t.clientY-camT.y)*.09;camT.x=t.clientX;camT.y=t.clientY}}e.preventDefault()},{passive:false});
function tend(e){for(const t of e.changedTouches){if(t.identifier===stickT){stickT=null;TI.mx=TI.my=0;parkStick()}if(camT&&t.identifier===camT.id)camT=null}}
tz.addEventListener('touchend',tend);tz.addEventListener('touchcancel',tend);
document.querySelectorAll('[data-b]').forEach(el=>{const k=el.dataset.b;
 el.addEventListener('touchstart',e=>{auInit();e.preventDefault();e.stopPropagation();el.classList.add('dn');if(k==='flap'){TI.flap=true;TI.tap.flap=true}else if(k==='dive')TI.dive=true;else TI.tap[k]=true;if(SET.vib&&navigator.vibrate)try{navigator.vibrate(12)}catch(_){}} ,{passive:false});
 const up=e=>{e.preventDefault();el.classList.remove('dn');if(k==='flap')TI.flap=false;if(k==='dive')TI.dive=false};el.addEventListener('touchend',up);el.addEventListener('touchcancel',up);
 el.addEventListener('mousedown',e=>{auInit();if(k==='flap'){TI.flap=true;TI.tap.flap=true}else if(k==='dive')TI.dive=true;else TI.tap[k]=true});el.addEventListener('mouseup',()=>{TI.flap=false;TI.dive=false})});
// expose
window.__BFW={pwSfx,AU,scene,camera,renderer,SET,applyQuality,saveSet,readInput,SFX,abilitySfx,rumble,auInit,layoutTouch,parkStick,resize,sun,hemi,flash,sky,AU,TI,presetName,PRESETS,getQ:()=>Q,isTouch};
})();
