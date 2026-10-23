// Blackfeather Wilds — loop, camera, HUD, menus
(function(){
'use strict';
const B=window.__BFW,G=window.__G,{scene,camera,renderer,SET,SFX}=B;const {SPECIES,ORDER,makeBird,animBird}=BIRDS;const H=W.H;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,hyp=Math.hypot,TAU=Math.PI*2;
let panel='title',paused=true;let selIdx=0;const cam=G.cam;cam.yaw=0;cam.pitch=.25;
// ---------- panels & focus nav
function showPanel(p){panel=p;$$('.panel').forEach(e=>e.classList.toggle('on',e.id==='p-'+p));document.body.classList.toggle('inmenu',!!p);paused=!!p;focusI=0;setFocus();if(p==='select')renderSelect();if(p==='title')$('#bCont').style.display=G.load()?'':'none';if(p==='settings')renderSettings()}
window.showPanel=showPanel;
let focusI=0;function btns(){const p=$('#p-'+panel);return p?[...p.querySelectorAll('.btn:not([disabled])')].filter(b=>b.offsetParent!==null):[]}
function setFocus(){const L=btns();L.forEach((b,i)=>b.classList.toggle('foc',i===focusI&&document.body.classList.contains('pad')))}
function menuInput(I){if(!panel)return;const L=btns();if(!L.length)return;
 if(panel==='select'){if(I.leftN){selIdx=(selIdx+ORDER.length-1)%ORDER.length;SFX.nav();renderSelect()}if(I.rightN){selIdx=(selIdx+1)%ORDER.length;SFX.nav();renderSelect()}}
 if(I.downN||(panel!=='select'&&I.rightN&&false)){focusI=(focusI+1)%L.length;SFX.nav();setFocus()}if(I.upN){focusI=(focusI+L.length-1)%L.length;SFX.nav();setFocus()}
 if(panel==='settings'&&(I.leftN||I.rightN)){const b=L[focusI];if(b&&b.dataset.k){cycleSetting(b.dataset.k,I.leftN?-1:1)}}
 if(I.ok){const b=L[focusI];if(b){SFX.ok();b.click()}}
 if(I.back||I.pauseE&&panel==='pause'){const bk=$('#p-'+panel+' [data-back]');if(bk){SFX.nav();bk.click()}}}
// ---------- title / select
function newGame(sp){G.S=G.newState(sp);G.setBird(sp);G.buildNestMesh();G.itemsDirty=true;G.save();cam.init=false;showPanel(null);G.toast('Welcome to the Blackfeather Wilds. Survive.',true);showHelpOnce()}
window.newGame=newGame;
function cont(){const o=G.load();if(!o)return;G.S=o;const S=o;S.perch=null;if(S.mode==='perch'||S.mode==='landing'){S.mode='ground';const p=S.nest&&hyp(S.x-S.nest.x,S.z-S.nest.z,S.y-S.nest.y)<2?G.nestPerch():null;if(p){S.mode='perch';S.perch=p}else{S.y=Math.max(H(S.x,S.z),0)}}
 if(S.mode==='fly'){S.speed=Math.max(S.speed,8)}G.setBird(S.sp);G.buildNestMesh();G.itemsDirty=true;cam.init=false;showPanel(null);G.toast('Day '+S.day+' — welcome back',true)}
function renderSelect(){const id=ORDER[selIdx],sp=SPECIES[id];$('#selName').textContent=sp.name;$('#selTag').textContent=sp.tag;$('#selDesc').textContent=sp.desc;$('#selAb').textContent='Ability: '+sp.ability;
 const lab=['Speed','Endurance','Toughness','Utility','Hunting'];$('#selBars').innerHTML=sp.bars.map((v,i)=>`<div class="bar"><span>${lab[i]}</span><i>${'<b></b>'.repeat(v)}${'<u></u>'.repeat(5-v)}</i></div>`).join('');
 $('#selDots').innerHTML=ORDER.map((o,i)=>`<span class="${i===selIdx?'on':''}">${SPECIES[o].short}</span>`).join('');
 if(!G.bird||G.bird.userData.id!==id){G.setBird(id)}}
$('#bNew').onclick=()=>{if(G.load()&&!confirmNew){confirmNew=true;$('#bNew').textContent='Tap again to start over';setTimeout(()=>{confirmNew=false;$('#bNew').textContent='New Game'},3000);return}confirmNew=false;$('#bNew').textContent='New Game';selIdx=0;showPanel('select')};let confirmNew=false;
$('#bCont').onclick=cont;$('#selPrev').onclick=()=>{selIdx=(selIdx+4)%5;renderSelect()};$('#selNext').onclick=()=>{selIdx=(selIdx+1)%5;renderSelect()};
$('#bStart').onclick=()=>newGame(ORDER[selIdx]);$('#bSelBack').onclick=()=>showPanel('title');
$$('#selDots').forEach(d=>d.addEventListener('click',e=>{const i=[...d.children].indexOf(e.target);if(i>=0){selIdx=i;renderSelect()}}));
$('#bHow').onclick=()=>showPanel('help');$('#bHelpBack').onclick=()=>showPanel(G.S&&G.S.mode!=='dead'&&prevPanel==='pause'?'pause':'title');let prevPanel='title';
$('#bSettings').onclick=()=>{prevPanel='title';showPanel('settings')};$('#bSetBack').onclick=()=>showPanel(prevPanel);
$('#bResume').onclick=()=>showPanel(null);$('#bPSet').onclick=()=>{prevPanel='pause';showPanel('settings')};$('#bPHelp').onclick=()=>{prevPanel='pause';showPanel('help')};
$('#bQuit').onclick=()=>{G.save();showPanel('title')};$('#bPMap').onclick=()=>openMap();
$('#bRespawn').onclick=()=>G.respawn();$('#bDeadNew').onclick=()=>{localStorage.removeItem('bfw-save-v1-dead');selIdx=ORDER.indexOf(G.S.sp);showPanel('select')};
$('#bMapBack').onclick=()=>showPanel(mapFrom);let mapFrom=null;
function showHelpOnce(){if(!localStorage.getItem('bfw-help')){localStorage.setItem('bfw-help','1');prevPanel=null;showPanel('help')}}
$('#tPause').addEventListener('click',()=>{if(!panel)showPanel('pause')});$('#tMap').addEventListener('click',()=>{if(!panel)openMap()});
// ---------- settings
const SOPTS={gfx:[['auto','Auto'],['low','Low'],['med','Medium'],['high','High']],stick:[['S','Small'],['M','Medium'],['L','Large']],hand:[['left','Stick left'],['right','Stick right']],invert:[[false,'Up = climb'],[true,'Up = dive (pilot)']],vib:[[true,'On'],[false,'Off']],sound:[[true,'On'],[false,'Off']],sens:[[.6,'Low'],[1,'Normal'],[1.5,'High']]};
const SLAB={gfx:'Graphics',stick:'Thumbstick size',hand:'Thumbstick side',invert:'Flight pitch',vib:'Vibration',sound:'Sound',sens:'Camera speed'};
function renderSettings(){$('#setList').innerHTML=Object.keys(SOPTS).map(k=>{const o=SOPTS[k].find(x=>x[0]===SET[k])||SOPTS[k][0];return `<button class="btn set" data-k="${k}"><span>${SLAB[k]}</span><b>‹ ${o[1]}${k==='gfx'&&SET.gfx==='auto'?' ('+B.presetName()+')':''} ›</b></button>`}).join('');
 $$('#setList .btn').forEach(b=>b.onclick=()=>cycleSetting(b.dataset.k,1));setFocus()}
function cycleSetting(k,d){const L=SOPTS[k];let i=L.findIndex(x=>x[0]===SET[k]);i=(i+d+L.length)%L.length;SET[k]=L[i][0];if(k==='gfx'){if(SET.gfx==='auto')SET.autoQ=null;B.applyQuality();G.buildRain();autoT=0;autoF=0}
 if(k==='stick'||k==='hand')B.layoutTouch();if(k==='sound'&&SET.sound)B.auInit();B.saveSet();const fi=focusI;renderSettings();focusI=fi;setFocus()}
// ---------- nest menu
function openNest(){const S=G.S;const n=S.nest;const st=n.store;
 $('#nestStore').innerHTML=`Stored: <b>${st.stick}</b> sticks · <b>${st.moss}</b> moss · <b>${st.shiny}</b> shinies${n.up.larder?` · Larder <b>${n.larder.length}/4</b>`:''}`;
 const night=G.isNight();$('#bRest').textContent=night?'Sleep until dawn':'Rest (recover stamina & save)';
 $('#bLarder').style.display=n.up.larder&&n.larder.length?'':'none';$('#bLarder').textContent='Eat from larder ('+n.larder.length+')';
 $('#upgList').innerHTML=G.UPG.map(u=>{const c=G.costOf(u);const has=n.up[u.id];const ok=!has&&Object.keys(c).every(k=>st[k]>=c[k]);
  const cs=Object.entries(c).map(([k,v])=>`${v} ${k==='stick'?'sticks':k==='shiny'?'shiny':'moss'}`).join(' + ');
  return `<button class="btn upg ${has?'have':''}" data-u="${u.id}" ${has?'disabled':''}><b>${u.name}${has?' ✓':''}</b><small>${u.desc}</small><em class="${ok?'ok':''}">${has?'Built':cs}</em></button>`}).join('');
 $$('#upgList .btn').forEach(b=>b.onclick=()=>buyUpg(b.dataset.u));showPanel('nest')}
window.openNest=openNest;
function buyUpg(id){const S=G.S,n=S.nest,u=G.UPG.find(x=>x.id===id),c=G.costOf(u);if(!Object.keys(c).every(k=>n.store[k]>=c[k])){G.toast('Not enough materials stored at the nest');return}
 for(const k in c)n.store[k]-=c[k];n.up[id]=true;SFX.ok();G.buildNestMesh();G.save();G.toast(u.name+' built!');openNest()}
$('#bRest').onclick=()=>{const S=G.S;const night=G.isNight();const lin=S.nest.up.lining;
 if(night){S.t=.26;S.hunger=Math.max(5,S.hunger-14);S.thirst=Math.max(5,S.thirst-18);S.hp=lin?G.maxHp():Math.min(G.maxHp(),S.hp+45);if(S.storm>0&&S.nest.up.walls){S.stormT=0;S.storm=0}}
 else{S.hp=Math.min(G.maxHp(),S.hp+(lin?25:12));S.hunger=Math.max(5,S.hunger-4);S.thirst=Math.max(5,S.thirst-5);S.t+=.04;if(S.stormT>0&&S.nest.up.walls){S.stormT=Math.max(0,S.stormT-60)}}
 S.stam=G.maxSt();S.flags=Object.assign(S.flags||{},{rested:1});G.save();fade();showPanel(null);G.toast(night?'You sleep safely through the night.':'Rested. Progress saved.')};
$('#bLarder').onclick=()=>{const S=G.S,f=S.nest.larder.shift();if(!f)return;const v=f.food*(SPECIES[S.sp].diet[f.type]||.5);S.hunger=clamp(S.hunger+v,0,100);SFX.eat();G.toast('+'+Math.round(v)+' food');openNest()};
$('#bNestBack').onclick=()=>showPanel(null);
function fade(){const f=$('#fade');f.classList.remove('on');void f.offsetWidth;f.classList.add('on')}
// ---------- map
const mapC=$('#mapC'),mapX=mapC.getContext('2d');
function openMap(){mapFrom=panel==='pause'?'pause':null;showPanel('map');drawMap(mapX,mapC.width,true)}
function drawMap(x,s,full){const S=G.S;x.drawImage(W.mapImg,0,0,s,s);const k=s/W.SIZE,P=(wx,wz)=>[(wx+W.HALF)*k,(wz+W.HALF)*k];
 x.lineWidth=Math.max(1,s/200);if(S.nest){const [a,b]=P(S.nest.x,S.nest.z);x.fillStyle='#ffd34d';x.strokeStyle='#000';x.beginPath();x.arc(a,b,s/45,0,TAU);x.fill();x.stroke()}
 if(full){x.font=`${Math.round(s/30)}px Georgia`;x.fillStyle='rgba(255,240,210,.85)';x.textAlign='center';const lb=[[W.LAKE.x,W.LAKE.z,'Stillwater Lake'],[W.RUINS.x,W.RUINS.z-38,'Old Watchers'],[W.ARCH.x,W.ARCH.z-40,'The Great Arch'],[W.POND.x,W.POND.z+50,'Frog Pond'],[0,-640,'Ironback Mountains']];for(const [a,b,t] of lb){const [u,v]=P(a,b);x.fillText(t,u,v)}}
 if(S.sp==='hawk'||full){x.fillStyle='rgba(255,90,60,.9)';for(const e of G.ents){if(e.type==='fox'||e.type==='wolf'){if(!full||!e.mesh.visible)continue;const [a,b]=P(e.x,e.z);x.fillRect(a-1.5,b-1.5,3,3)}}}
 const [a,b]=P(S.x,S.z);x.save();x.translate(a,b);x.rotate(-S.yaw);x.fillStyle='#fff';x.strokeStyle='#000';x.beginPath();const r=s/(full?32:16);x.moveTo(0,-r);x.lineTo(r*.6,r*.7);x.lineTo(0,r*.35);x.lineTo(-r*.6,r*.7);x.closePath();x.fill();x.stroke();x.restore()}
const mini=$('#mini'),miniX=mini.getContext('2d');
function drawMini(){const S=G.S;const s=mini.width;const zoom=4;miniX.save();miniX.beginPath();miniX.arc(s/2,s/2,s/2,0,TAU);miniX.clip();
 miniX.translate(s/2,s/2);miniX.rotate(cam.yaw);const k=s/W.SIZE*zoom;miniX.drawImage(W.mapImg,(-W.HALF-S.x)*k,(-W.HALF-S.z)*k,W.SIZE*k,W.SIZE*k);
 if(S.nest){miniX.fillStyle='#ffd34d';miniX.strokeStyle='#000';miniX.lineWidth=2;const nx=clamp((S.nest.x-S.x)*k,-s*.45,s*.45),nz=clamp((S.nest.z-S.z)*k,-s*.45,s*.45);miniX.beginPath();miniX.arc(nx,nz,6,0,TAU);miniX.fill();miniX.stroke()}
 if(S.sp==='hawk'){miniX.fillStyle='#ffcf4a';for(const e of G.ents)if((e.type==='mouse'||e.type==='rabbit')&&e.mesh.visible&&hyp(e.x-S.x,e.z-S.z)<120){miniX.fillRect((e.x-S.x)*k-2,(e.z-S.z)*k-2,4,4)}}
 for(const p of G.pwSpots){if(!G.pwAlive(p))continue;const dx=(p.x-S.x)*k,dz=(p.z-S.z)*k;if(Math.abs(dx)>s*.47||Math.abs(dz)>s*.47)continue;miniX.fillStyle=G.PW[p.k].css;miniX.strokeStyle='#000';miniX.lineWidth=1.5;miniX.beginPath();miniX.arc(dx,dz,4.5,0,TAU);miniX.fill();miniX.stroke()}
 miniX.rotate(-cam.yaw);miniX.rotate(-(S.yaw-cam.yaw));miniX.fillStyle='#fff';miniX.strokeStyle='#000';miniX.lineWidth=2;miniX.beginPath();miniX.moveTo(0,-9);miniX.lineTo(6,7);miniX.lineTo(0,3);miniX.lineTo(-6,7);miniX.closePath();miniX.fill();miniX.stroke();miniX.restore();
 miniX.strokeStyle='rgba(230,220,190,.6)';miniX.lineWidth=3;miniX.beginPath();miniX.arc(s/2,s/2,s/2-1.5,0,TAU);miniX.stroke();
 // north marker
 const na=-cam.yaw-Math.PI/2;miniX.fillStyle='#ffd9a0';miniX.font='bold 13px sans-serif';miniX.textAlign='center';miniX.textBaseline='middle';miniX.fillText('N',s/2+Math.cos(na)*(s/2-10),s/2+Math.sin(na)*(s/2-10))}
// ---------- HUD
function hud(){const S=G.S;const set=(id,v,m)=>{const e=$(id);e.style.width=clamp(v/m*100,0,100)+'%';e.parentNode.classList.toggle('low',v/m<.25)};
 set('#mHp',S.hp,G.maxHp());set('#mFood',S.hunger,100);set('#mWater',S.thirst,100);set('#mSt',S.stam,G.maxSt());
 const h=Math.floor(S.t*24),mi=Math.floor((S.t*24-h)*60/15)*15;$('#clock').innerHTML=`Day ${S.day} · ${((h+11)%12+1)}:${String(mi).padStart(2,'0')} ${h<12?'AM':'PM'}${S.storm>.2?' · <b>Storm</b>':''}`;
 $('#inv').innerHTML=`<span title="sticks">🪵 ${S.inv.stick}</span><span title="moss">🌿 ${S.inv.moss}</span>${S.sp==='crow'||S.inv.shiny?`<span title="shinies">✨ ${S.inv.shiny}</span>`:''}<span class="cap">/${SPECIES[S.sp].carry}</span>${S.hold?`<span class="hold">🍖 ${S.hold.name}</span>`:''}`;
 const o=G.OBJ[S.obj];$('#obj').textContent=typeof o.t==='function'?o.t():o.t;
 const sp=SPECIES[S.sp];const ab=$('#bAb');ab.querySelector('small').textContent=sp.ability;ab.classList.toggle('cd',S.ab>0&&S.sp!=='owl');ab.style.setProperty('--cd',S.ab>0?(S.ab/sp.abCd):0);
 const fl=S.mode==='fly'||S.mode==='landing';$('#bLand').querySelector('small').textContent=fl?'Land':'—';$('#bLand').classList.toggle('dim',!fl);$('#bFlap').querySelector('small').textContent=fl?'Flap':'Take off';$('#bDive').classList.toggle('dim',!fl);
 {let h='';for(const k in (S.pw||{})){const d=G.PW[k],r=S.pw[k];h+=`<div class="pw" style="--c:${d.css};--f:${clamp(r/d.dur,0,1)}"><i>${d.icon}</i><b>${Math.ceil(r)}</b></div>`}const pb=$('#pwbar');if(pb._h!==h){pb.innerHTML=h;pb._h=h}}
 $('#alt').textContent=fl?`${Math.round(S.speed*3.6)} km/h · ${Math.round(S.y-Math.max(0,H(S.x,S.z)))} m`:'';}
// ---------- camera
const _cv=new THREE.Vector3();function crownAvoid(t,c){const d=t.distanceTo(c);if(d<.5)return;const ts=W.nearTrees((t.x+c.x)/2,(t.z+c.z)/2,d/2+12);let best=1;
 for(const tr of ts){if(tr.type===2)continue;const cy=tr.y+tr.ht*.65,cr=Math.max(1.2,(tr.w||tr.ht*.3)*.45);for(let i=2;i<=10;i++){const f=i/10;_cv.lerpVectors(t,c,f);const dx=_cv.x-tr.x,dz=_cv.z-tr.z,dy=(_cv.y-cy)*.6;if(dx*dx+dz*dz+dy*dy<cr*cr){best=Math.min(best,Math.max(.25,f-.12));break}}}
 if(best<1)c.lerpVectors(t,c,best)}
const tgt=new THREE.Vector3(),cpos=new THREE.Vector3(),look=new THREE.Vector3();
function camTick(dt,I){const S=G.S;const sz=SPECIES[S.sp].size;const fl=S.mode==='fly'||S.mode==='landing';
 const sens=SET.sens*2.2;cam.yawOff-=I.cx*dt*sens*(I.cx&&Math.abs(I.cx)>1.5?.25:1);cam.pitchOff=clamp(cam.pitchOff+I.cy*dt*sens*.6*(Math.abs(I.cy)>1.5?.25:1),-.6,1.1);
 if(Math.abs(I.cx)>.02||Math.abs(I.cy)>.02)cam.idle=0;else cam.idle+=dt;
 if(fl&&cam.idle>1.2){cam.yawOff=lerp(cam.yawOff,0,1-Math.exp(-dt*2));cam.pitchOff=lerp(cam.pitchOff,0,1-Math.exp(-dt*2))}
 const baseYaw=fl?S.yaw:(cam.groundYaw===undefined?S.yaw:cam.groundYaw);if(!fl){cam.groundYaw=baseYaw}else cam.groundYaw=undefined;
 cam.yaw=baseYaw+cam.yawOff;const d=(fl?4.6+clamp(S.speed/40,0,1)*1.8:3.4)*sz*(B.isTouch&&innerWidth<innerHeight?1.15:1);const pitch=(fl?.2-S.pitch*.25:.42)+cam.pitchOff;
 tgt.set(S.x,S.y+.35*sz,S.z);cpos.set(tgt.x+Math.sin(cam.yaw)*Math.cos(pitch)*d,tgt.y+Math.sin(pitch)*d,tgt.z+Math.cos(cam.yaw)*Math.cos(pitch)*d);
 crownAvoid(tgt,cpos);const gy=Math.max(H(cpos.x,cpos.z),0)+.6;if(cpos.y<gy)cpos.y=gy;
 if(!cam.init){camera.position.copy(cpos);cam.init=true}else camera.position.lerp(cpos,1-Math.exp(-dt*(fl?6:8)));
 const cg=Math.max(H(camera.position.x,camera.position.z),0)+.5;if(camera.position.y<cg)camera.position.y=cg;
 look.copy(tgt);look.y+=(innerWidth<innerHeight?.55:.25)*sz*(fl?1:.6);if(fl){look.x+=-Math.sin(S.yaw)*1.5;look.z+=-Math.cos(S.yaw)*1.5}camera.lookAt(look);
 camera.fov=lerp(camera.fov,(innerWidth<innerHeight?74:60)+(fl?clamp((S.speed-15)/2,0,14):0),dt*3);camera.updateProjectionMatrix()}
// ---------- environment update
let envT=99,pmrem=null,envRT=null;const skyScene=new THREE.Scene();
function envTick(dt){const S=G.S||{t:.3,storm:0,x:0,z:0,y:0};const k=G.skyAt(S.t);const st=S.storm||0;const si=G.sunInfo(S.t);
 const nightV=S.sp==='owl'&&S.nv&&G.isNight();
 const u=B.sky.material.uniforms;const grey=new THREE.Color(0x4a5058);u.top.value.copy(k.top).lerp(grey.clone().multiplyScalar(.6),st*.8);u.hor.value.copy(k.hor).lerp(grey,st*.75);u.sunCol.value.copy(k.sc);u.night.value=clamp(-si.el*3,0,1);u.storm.value=st;if(u.uH){const e=clamp((si.el-.05)/.3,0,1);u.uH.value=W.hdr?e*e*(3-2*e)*(1-st)*.85:0}
 const day=si.el>-.05;const sd=new THREE.Vector3(Math.cos(si.az)*.8,Math.max(.08,Math.abs(si.el)),.45).normalize();
 if(day){u.sunDir.value.set(Math.cos(si.az)*.8,si.el,.45).normalize()}else u.sunDir.value.set(-Math.cos(si.az)*.8,-si.el,-.3).normalize();
 B.sun.color.copy(k.sc);B.sun.intensity=k.si*(1-st*.7)*(nightV?3:1);B.sun.position.set(S.x+sd.x*200,S.y+sd.y*200,S.z+sd.z*200);B.sun.target.position.set(S.x,S.y,S.z);
 // snap shadow cam to texel to reduce shimmer
 B.hemi.intensity=k.hi*(1-st*.4)*(nightV?3.2:1);B.hemi.color.copy(k.top).lerp(new THREE.Color(0xffffff),.4);B.hemi.groundColor.set(0x3a3020);
 scene.fog.color.copy(u.hor.value);scene.fog.density=B.getQ().fog*(1+st*1.6)*(nightV?.6:1);
 renderer.toneMappingExposure=nightV?1.9:1;
 if(W.windT)W.windT.value+=dt*(1+st*2);if(W.wT)W.wT.value+=dt;if(u.uT)u.uT.value+=dt;if(u.uCQ)u.uCQ.value=B.getQ().clouds??2;
 if(W.mtns)for(const mm of W.mtns){const U=(mm.material||mm).uniforms;if(!U)continue;U.hor&&U.hor.value.copy(u.hor.value);U.sunCol&&U.sunCol.value.copy(k.sc);if(U.night)U.night.value=u.night.value}
 if(W.WATERFALL){const F=W.WATERFALL;if(F.tex)F.tex.offset.y+=dt*1.6;if(F.mists)for(const m of F.mists){m.material.rotation+=dt*.2*(m.userData.o||1);m.material.opacity=.25+Math.sin(tt*2+(m.userData.o||0)*5)*.1}}
 if(W.updateGrassField)W.updateGrassField(camera.position.x,camera.position.z);
 if(window.LIFE)LIFE.tick(dt);G.pwVis&&G.pwVis(tt);
 W.waterMat.normalMap.offset.x+=dt*.004;W.waterMat.normalMap.offset.y+=dt*.0025;W.waterMat.color.set(0x1b3640).lerp(u.hor.value,.25);
 // env map for reflections (water, metal)
 envT+=dt;if(envT>8&&B.getQ().shadows){envT=0;if(!pmrem){pmrem=new THREE.PMREMGenerator(renderer)}const m=B.sky.clone();skyScene.clear();skyScene.add(m);if(envRT)envRT.dispose();envRT=pmrem.fromScene(skyScene,0,1,5000);scene.environment=envRT.texture}
 // flash
 let f=G.stormFlashRef();if(f>0){f=Math.max(0,f-dt*2.5);G.setStormFlash(f)}B.flash.intensity=f*4;
 if(st>.7&&Math.random()<dt*.06)G.strike(false);
 // rain
 const R=G.rain;R.visible=st>.15;if(R.visible){R.material.opacity=.35*st;R.position.set(camera.position.x,camera.position.y-20,camera.position.z);const p=R.geometry.attributes.position.array;for(let i=0;i<p.length;i+=6){p[i+1]-=dt*28;p[i+4]-=dt*28;if(p[i+1]<0){const y=40;p[i+1]=y;p[i+4]=y-.9}}R.geometry.attributes.position.needsUpdate=true}
 // chunk culling by distance
 const view=B.getQ().view;for(const ch of W.chunks){const v=hyp(ch.cx-camera.position.x,ch.cz-camera.position.z)<view+300;for(const m of ch.meshes)m.visible=v}
 // audio
 if(B.AU.ctx&&G.S){const S=G.S;const fl=S.mode==='fly';B.AU.wind.g.gain.value=lerp(B.AU.wind.g.gain.value,(fl?.05+clamp(S.speed/40,0,1)*.4:.03)+st*.2,dt*3);B.AU.wind.fl.frequency.value=300+S.speed*25;
  B.AU.rain.g.gain.value=lerp(B.AU.rain.g.gain.value,st*.35,dt*2);const nearW=Math.max(H(S.x,S.z),0)<1.5&&S.y<6;B.AU.water.g.gain.value=lerp(B.AU.water.g.gain.value,nearW?.06:0,dt*2);
  if(Math.random()<dt*.25){if(G.isNight()){for(let i=0;i<4;i++)tSfx('square',4200,4100,.03,.012,i*.06)}else if(st<.3){const f=2000+Math.random()*1800;tSfx('sine',f,f*1.3,.12,.035,0);tSfx('sine',f*1.1,f*.9,.1,.03,.15)}}}}
function tSfx(t,a,b,d,v,dl){const c=B.AU.ctx;if(!c||!SET.sound)return;const T=c.currentTime+dl;const o=c.createOscillator();o.type=t;o.frequency.setValueAtTime(a,T);o.frequency.exponentialRampToValueAtTime(b,T+d);const g=c.createGain();g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(v,T+.01);g.gain.exponentialRampToValueAtTime(.0003,T+d);o.connect(g).connect(B.AU.m);o.start(T);o.stop(T+d+.02)}
// ---------- bird visual
const bq=new THREE.Euler(0,0,0,'YXZ');
function birdVis(dt,I){const S=G.S,b=G.bird;if(!b)return;const fl=S.mode==='fly';const ld=S.mode==='landing';
 b.position.set(S.x,S.y+(fl||ld?0:.18*SPECIES[S.sp].size*1.25+(S.mode==='ground'?Math.abs(Math.sin((S.walk||0)*5))*.16*(S.gait||0)*SPECIES[S.sp].size:0)),S.z);bq.set(S.pitch,S.yaw,S.roll);b.rotation.copy(bq);
 const flapping=fl&&(I.flap||(S._flapVis=(S._flapVis||0)-dt)>0);if(fl&&I.flapE)S._flapVis=.35;
 animBird(b,dt,{mode:fl||ld?'fly':'perch',flap:fl?(flapping&&S.stam>0?1:0):ld?.6:0,flapRate:SPECIES[S.sp].size>1.4?7:SPECIES[S.sp].id==='falcon'?11:9,tuck:fl?clamp((-S.pitch-.4)*1.6,0,1):0,brake:ld?1:(I.brakeV||0),look:S.mode!=='fly'?Math.sin(S.played*.7)*.5:0});
 b.visible=S.mode!=='dead';const h=G.held;h.visible=!!S.hold;if(S.hold){h.position.copy(b.position);h.position.y-=.35*SPECIES[S.sp].size;h.rotation.y=S.yaw}}
// ---------- select / title camera
let tt=0;function menuCam(dt){if(panel==='select'||(panel==='settings'&&prevPanel!=='pause'&&!G.S)){const b=G.bird;if(!b)return;const p={x:W.RUINS.x+24,z:W.RUINS.z,y:0};p.y=W.perches.find(q=>q.kind==='stone').y;
  b.position.set(p.x,p.y+.25,p.z);b.rotation.set(0,tt*.35,0);animBird(b,dt,{mode:tt%10<4?'fly':'perch',flap:tt%10<4?1:0,flapRate:6});const sz=b.scale.x;
  const portrait=innerWidth<innerHeight;camera.position.set(p.x+2.2*sz*(portrait?1.2:1),p.y+.7*sz,p.z+(portrait?1.4:.6)*sz);camera.lookAt(p.x+(portrait?0:.2*sz),p.y+(portrait?-.15:.2)*sz,p.z-(portrait?0:.75*sz));G.held.visible=false;
  const st={t:.3};return st}
 if(panel==='title'||(!G.S&&panel)){const a=tt*.03;const cx=W.LAKE.x-30,cz=W.LAKE.z-80;camera.position.set(cx+Math.cos(a)*220,95,cz+Math.sin(a)*220);camera.lookAt(cx,15,cz)}}
// ---------- auto quality
let autoT=0,autoF=0;function autoQ(dt){if(SET.gfx!=='auto'||SET.autoQ==='low'&&autoT>99)return;autoT+=dt;autoF++;if(autoT>4){const fps=autoF/autoT;const cur=B.presetName();
 if(fps<26&&cur!=='low'){SET.autoQ=cur==='high'?'med':'low';B.applyQuality();G.buildRain();G.toast('Graphics set to '+SET.autoQ+' for smoother play');B.saveSet()}else if(!SET.autoQ){SET.autoQ=cur;B.saveSet()}autoT=-1e9}}
// ---------- main loop
let last=performance.now(),fpsA=60;window.__fps=()=>fpsA;
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,(now-last)/1000);last=now;fpsA=lerp(fpsA,1/Math.max(dt,.001),.05);
 const I=B.readInput();
 if(panel){menuInput(I);inLock=true}if(!panel&&inLock){if(I.flap||I.land||I.act||I.ab||I.dive)for(const k of ['flap','land','act','ab','dive','flapE','landE','actE','abE','diveE'])I[k]=false;else inLock=false}
 if(!panel&&G.S&&G.S.mode!=='dead'){if(I.pauseE){showPanel('pause');}else if(I.mapE){openMap()}else{G.gameTick(dt,I);camTick(dt,I);autoQ(dt)}}
 else if(panel==='map'&&I.mapE)showPanel(mapFrom);
 if(G.S&&(panel===null||panel==='pause'||panel==='nest'||panel==='map'||panel==='dead'||(panel==='help'&&prevPanel!=='title')||(panel==='settings'&&prevPanel==='pause'))){birdVis(dt,panel?{}:I);if(panel){camTick(0.016,{cx:0,cy:0})}}else menuCam(dt);
 tt+=dt;envTick(dt);
 if(G.itemsDirty){G.refreshItems();G.itemsDirty=false}
 if(G.berriesDirty){const bi=W.berryMesh;if(!W.berryOrig)W.berryOrig=bi.instanceMatrix.array.slice();const O=W.berryOrig,A=bi.instanceMatrix.array;for(const b of W.bushes)for(const i of b.bi){if(b.ripe)A.set(O.subarray(i*16,i*16+16),i*16);else A.fill(0,i*16,i*16+16)}bi.instanceMatrix.needsUpdate=true;G.berriesDirty=false}
 for(const it of G.items)if(it.mesh&&it.mesh.visible){it.mesh.userData.sp.material.rotation+=dt;it.mesh.userData.sp.scale.setScalar(.5+Math.sin(now*.004+it.x)*.2)}
 if(!panel&&G.S){hud();if(++miniC%3===0)drawMini()}
 const tEl=$('#toast');if(tEl.classList.contains('on')){toastLeft-=dt}
 if(B.getQ().bloom&&window.BLOOM&&BLOOM.ok!==false)BLOOM.render();else renderer.render(scene,camera)}
let inLock=false,miniC=0,toastLeft=0;
setInterval(()=>{const t=$('#toast');if(t.classList.contains('on')&&(t._s=(t._s||0)+1)>(t.textContent.length>40?9:6)){t.classList.remove('on');t._s=0}},500);
new MutationObserver(()=>{$('#toast')._s=0}).observe($('#toast'),{childList:true,characterData:true,subtree:true});
// boot
B.resize();B.layoutTouch();G.refreshItems();G.populate(-150,120);
$('#loading').style.display='none';showPanel('title');requestAnimationFrame(frame);
addEventListener('visibilitychange',()=>{if(document.hidden&&G.S){G.save();if(!panel)showPanel('pause')}});
addEventListener('resize',()=>{B.parkStick()});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
// test hooks
window.BFW={G,B,showPanel,newGame,cont,openNest,openMap,get panel(){return panel},selIdx:i=>{selIdx=i;renderSelect()},
 step(n,inp,dt){dt=dt||1/30;const I=Object.assign({mx:0,my:0,cx:0,cy:0,diveV:0,brakeV:0},inp||{});for(let i=0;i<n;i++){G.gameTick(dt,I);camTick(dt,I);birdVis(dt,I);I.flapE=I.landE=I.actE=I.abE=I.lockE=false}envTick(dt);hud();drawMini()}};
})();
