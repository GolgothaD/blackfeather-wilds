// Prey lock-on + assisted homing dive strike
(function(){const B=window.__BFW,G=window.__G,{camera}=B;const PREY={mouse:1,rabbit:1,squirrel:1,songbird:1,fish:1};
const NAME={mouse:'Mouse',rabbit:'Rabbit',squirrel:'Squirrel',songbird:'Songbird',fish:'Fish'};
const st=document.createElement('style');st.textContent=`#reti{position:fixed;left:0;top:0;width:64px;height:64px;margin:-32px 0 0 -32px;pointer-events:none;z-index:6;display:none;transition:transform .12s}
#reti .r{position:absolute;inset:0;border:2px solid rgba(255,235,170,.75);border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,.6)}
#reti.lk .r{border:3px solid #ff5a3a;box-shadow:0 0 14px #ff5a3a;animation:rp 1s linear infinite}#reti.lk .r:before,#reti.lk .r:after{content:'';position:absolute;left:50%;top:-10px;bottom:-10px;border-left:2px solid #ff5a3a}
#reti .t{position:absolute;top:70px;left:50%;transform:translateX(-50%);white-space:nowrap;font:600 13px system-ui;color:#fff;text-shadow:0 1px 3px #000;background:rgba(0,0,0,.35);padding:2px 7px;border-radius:8px}
#reti.hit .r{border-color:#5dff7a;box-shadow:0 0 22px #5dff7a}#reti.miss .r{border-color:#aaa;border-style:dashed}
@keyframes rp{to{transform:rotate(360deg)}}#hcue{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%) scale(.6);font:800 34px system-ui;letter-spacing:2px;pointer-events:none;opacity:0;z-index:7;text-shadow:0 2px 8px #000;transition:all .25s}#hcue.on{opacity:1;transform:translate(-50%,-50%) scale(1)}`;document.head.appendChild(st);
const el=document.createElement('div');el.id='reti';el.innerHTML='<div class="r"></div><div class="t"></div>';document.body.appendChild(el);const tx=el.querySelector('.t');
const cue=document.createElement('div');cue.id='hcue';document.body.appendChild(cue);let cueT=0,flashT=0,flashC='';
const H={auto:null,lock:null,minD:1e9,diving:false,hits:0,misses:0,last:''};window.HUNT=H;
const v=new THREE.Vector3(),cf=new THREE.Vector3();
function ok(e){const S=G.S;if(!e.alive===false&&0)return;if(!e||e.alive===false||!PREY[e.type]||!e.mesh||!e.mesh.visible&&e.type!=='fish')return false;if(G.ents.indexOf(e)<0)return false;
 if(e.type==='songbird'||e.type==='fish')return G.diet(e.type)>0;return G.canTake(e)}
function cands(){const S=G.S;camera.getWorldDirection(cf);const out=[];for(const e of G.ents){if(!ok(e))continue;const dx=e.x-S.x,dy=e.y-S.y,dz=e.z-S.z,d=Math.hypot(dx,dy,dz);if(d>120||d<.5)continue;
  const c=(dx*cf.x+dy*cf.y+dz*cf.z)/d;if(c<.6)continue;v.set(e.x,e.y,e.z).project(camera);if(v.z>1||Math.abs(v.x)>1.05||Math.abs(v.y)>1.05)continue;out.push({e,d,s:d*(1+(1-c)*6)})}
 return out.sort((a,b)=>a.s-b.s)}
function cueShow(t,c){cue.textContent=t;cue.style.color=c;cue.classList.add('on');cueT=1.1}
function flash(c){flashC=c;flashT=.6}
H.cands=cands;
H.miss=function(why){H.misses++;H.last='miss';cueShow(why||'MISSED','#ffd0c0');flash('miss');try{B.SFX.nav()}catch(_){}};
H.caught=function(e){if(H.lock===e||H.auto===e){H.hits++;H.last='hit';cueShow(H.diving?'STRIKE!':'GOT IT!','#7dff8e');flash('hit');try{B.SFX.hit()}catch(_){}}if(H.lock===e)H.lock=null;if(H.auto===e)H.auto=null;H.minD=1e9};
H.grabR=function(){const S=G.S;return (2.4+(S.sp==='eagle'?1:0))*(S.sp==='falcon'?1.35:1)*(G.pwOn('talon')?1.5:1)};
H.tryGrab=function(e,k){const S=G.S;const hd=Math.hypot(e.x-S.x,e.z-S.z),vy=Math.abs(e.y-S.y),g=H.grabR()*k;if(e.type==='fish'&&S.y>3)return false;if(hd<g&&vy<g*1.2){G.catchPrey(e);S.pitch=.5;S.speed=Math.max(6,S.speed*.6);if(e.type==='fish')S.y=Math.max(S.y,.8);return true}return false};
H.boost=function(){const S=G.S;return H.lock&&H.diving?(S.sp==='falcon'?1.3:1.1):1};
H.aim=function(I){const S=G.S,e=H.lock;if(!(e&&(I.diveV||0)>.1&&S.mode==='fly'&&ok(e)))return null;const dx=e.x-S.x,dz=e.z-S.z,hd=Math.hypot(dx,dz)||1e-3,dy=e.y+(hd>7?Math.min(2.5,hd*.15):.3)-S.y;const fal=S.sp==='falcon';return Math.max(fal?-1.45:-1.3,Math.min(.35,Math.atan2(dy,hd)))};
H.steer=function(dt,I){const S=G.S,e=H.lock;H.diving=!!(e&&(I.diveV||0)>.1&&S.mode==='fly');if(!H.diving)return;
 const dx=e.x-S.x,dz=e.z-S.z,hd=Math.hypot(dx,dz)||1e-3,dy=e.y+(hd>7?Math.min(2.5,hd*.15):.3)-S.y;if(H.tryGrab(e,1))return;const ty=Math.atan2(-dx,-dz);let df=ty-S.yaw;df=Math.atan2(Math.sin(df),Math.cos(df));
 const fal=S.sp==='falcon',k=(fal?4.5:2.6)*Math.min(1,I.diveV);S.yaw+=df*(1-Math.exp(-dt*k));
 S.roll=S.roll*.9-Math.sign(df)*Math.min(.6,Math.abs(df))*.1;
 if(fal)S.speed+=dt*6*I.diveV};
let prevDive=0;
H.tick=function(dt,I){const S=G.S;if(!S)return;const fly=S.mode==='fly';const list=fly?cands():[];
 if(H.lock&&!fly&&H.diving&&ok(H.lock))H.tryGrab(H.lock,2.5);if(H.lock&&!ok(H.lock)){H.lock=null;if(H.diving)H.miss('ESCAPED');}
 if(H.lock){const e=H.lock,d=Math.hypot(e.x-S.x,e.y-S.y,e.z-S.z);if(d>160||!fly){if(!fly&&H.diving){H.diving=false;H.miss()}H.lock=null}}
 H.auto=list.length?list[0].e:null;
 if(I.lockE&&fly)H.presses=(H.presses||0)+1;const fresh=I!==H._lastI;H._lastI=I;H.deb=Math.max(0,(H.deb||0)-dt);if(I.lockE&&fresh&&fly&&H.deb<=0){H.deb=.35;if(!H.lock){H.lock=H.auto;if(H.lock)try{B.SFX.ok()}catch(_){}}else{const i=list.findIndex(c=>c.e===H.lock);const nx=list.filter(c=>c.e!==H.lock);H.lock=nx.length?(list[(i+1)%list.length].e===H.lock?nx[0].e:list[(i+1)%list.length].e):(i>=0?H.lock:null);try{B.SFX.nav()}catch(_){}}H.minD=1e9}
 const e=H.lock;const dv=I.diveV||0;
 if(e&&fly){const d=Math.hypot(e.x-S.x,e.y-S.y,e.z-S.z);const sz=G.SP?1:1;const grab=(2.4+(S.sp==='eagle'?1:0))*(S.sp==='falcon'?1.35:1)*(G.pwOn('talon')?1.5:1);
  if(dv>.1){if(!H.tryGrab(e,1.3)){H.minD=Math.min(H.minD,d);if(H.minD<12&&d>H.minD+5){H.miss();H.minD=1e9}}}
  else if(prevDive>.1&&H.tryGrab(e,2.2)){}
  else if(prevDive>.1&&H.minD<20){H.minD=1e9}}
 prevDive=dv;
 if(cueT>0){cueT-=dt;if(cueT<=0)cue.classList.remove('on')}if(flashT>0)flashT-=dt;
 const bl=document.getElementById('bLock');if(bl)bl.classList.toggle('on',!!H.lock)};
H.draw=function(){const S=G.S;const e=H.lock||H.auto;el.classList.toggle('hit',flashT>0&&flashC==='hit');el.classList.toggle('miss',flashT>0&&flashC==='miss');
 if(!e||!S||S.mode!=='fly'||document.body.classList.contains('menu')){el.style.display=flashT>0?'block':'none';return}
 v.set(e.x,e.y+.25,e.z).project(camera);if(v.z>1){el.style.display='none';return}
 const W_=innerWidth,H_=innerHeight;el.style.display='block';const cx=Math.min(W_-40,Math.max(40,(v.x*.5+.5)*W_)),cy=Math.min(H_-110,Math.max(40,(-v.y*.5+.5)*H_));el.style.left=cx+'px';el.style.top=cy+'px';el.classList.toggle('lk',!!H.lock);
 const d=Math.hypot(e.x-S.x,e.y-S.y,e.z-S.z);const s=Math.max(.55,Math.min(1.2,18/Math.max(d,1)+.5));el.querySelector('.r').style.transform='scale('+s.toFixed(2)+')';
 tx.textContent=(H.lock?'🔒 ':'')+NAME[e.type]+' · '+Math.round(d)+' m'+(H.lock&&!H.diving?' — hold Dive':'')};
const gt=G.gameTick;G.gameTick=function(dt,I){gt(dt,I);try{H.tick(dt,I||{});H.draw()}catch(err){console.error(err)}};
})();
