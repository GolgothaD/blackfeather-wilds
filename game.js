// Blackfeather Wilds — gameplay
(function(){
'use strict';
const B=window.__BFW,{scene,camera,renderer,SET,SFX}=B;const {SPECIES,ORDER,makeBird,animBird}=BIRDS;const H=W.H;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,hyp=Math.hypot;
const rnd=Math.random;const TAU=Math.PI*2;
const gH=(x,z)=>Math.max(H(x,z),0); // surface incl. water
// ---------- materials helpers
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o||{}));
function ell(r,sx,sy,sz,m){const e=new THREE.Mesh(new THREE.SphereGeometry(r,12,9),m);e.scale.set(sx,sy,sz);e.castShadow=true;return e}
// ---------- creature meshes
function mkMouse(){const g=new THREE.Group(),m=M(0x6d625a);g.add(ell(.06,1,.8,1.6,m));const h=ell(.04,1,.9,1.2,m);h.position.set(0,.02,-.1);g.add(h);
 for(const s of[-1,1]){const e=ell(.02,1,1,.4,M(0xc9a09a));e.position.set(s*.03,.06,-.09);g.add(e)}const t=new THREE.Mesh(new THREE.CylinderGeometry(.005,.008,.16,4),M(0xb8968e));t.rotation.x=1.3;t.position.set(0,0,.15);g.add(t);g.position.y=.05;return g}
function mkRabbit(){const g=new THREE.Group(),m=M(0x8a7258);const b=ell(.14,1,.9,1.4,m);b.position.y=.14;g.add(b);const h=ell(.08,1,1,1.2,m);h.position.set(0,.26,-.17);g.add(h);
 for(const s of[-1,1]){const e=ell(.025,1,4,.6,m);e.position.set(s*.035,.37,-.14);e.rotation.z=s*.2;g.add(e)}const t=ell(.04,1,1,1,M(0xeeeeee));t.position.set(0,.16,.19);g.add(t);return g}
function mkCanid(wolf){const g=new THREE.Group(),c=wolf?0x5e5c58:0xb5561f,m=M(c),bm=M(wolf?0x8f8c86:0xece4d8),dk=M(0x1e1a18);const s=wolf?1.5:1;
 const body=ell(.2*s,1,1,2.3,m);body.position.y=.42*s;g.add(body);const bel=ell(.17*s,.9,.7,2,bm);bel.position.y=.36*s;g.add(bel);
 const head=new THREE.Group();head.position.set(0,.55*s,-.5*s);g.add(head);head.add(ell(.13*s,1,.9,1.1,m));const sn=new THREE.Mesh(new THREE.ConeGeometry(.07*s,.22*s,8),bm);sn.rotation.x=-Math.PI/2;sn.position.set(0,-.03*s,-.17*s);head.add(sn);
 const no=ell(.022*s,1,1,1,dk);no.position.set(0,-.02*s,-.28*s);head.add(no);
 for(const k of[-1,1]){const e=new THREE.Mesh(new THREE.ConeGeometry(.05*s,.14*s,4),m);e.position.set(k*.07*s,.13*s,.0);head.add(e);const ey=ell(.016*s,1,1,1,M(0xd8a030,{emissive:wolf?0x332200:0}));ey.position.set(k*.06*s,.03*s,-.1*s);head.add(ey)}
 const tail=new THREE.Group();tail.position.set(0,.48*s,.42*s);g.add(tail);const tm=ell(.07*s,1,1,4,m);tm.position.z=.22*s;tm.rotation.x=.4;tail.add(tm);if(!wolf){const tt=ell(.05*s,1,1,1.5,bm);tt.position.set(0,-.08*s,.45*s);tail.add(tt)}
 const legs=[];for(const [x,z] of [[-.1,-.3],[.1,-.3],[-.1,.3],[.1,.3]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.03*s,.025*s,.36*s,5),dk);l.geometry.translate(0,-.18*s,0);l.position.set(x*s,.38*s,z*s);l.castShadow=true;g.add(l);legs.push(l)}
 g.userData={legs,head,tail};return g}
function mkFish(){const g=new THREE.Group();const m=M(0x8c9aa0,{metalness:.6,roughness:.3});g.add(ell(.1,.5,.8,2,m));const t=new THREE.Mesh(new THREE.ConeGeometry(.08,.14,4),m);t.rotation.x=Math.PI/2;t.position.z=.25;t.scale.x=.3;g.add(t);return g}
function mkSongbird(){const g=new THREE.Group(),m=M([0x7a5a3a,0x3a5a8a,0x9a8a3a][Math.floor(rnd()*3)]);g.add(ell(.05,1,.9,1.6,m));const h=ell(.035,1,1,1,m);h.position.set(0,.02,-.07);g.add(h);
 const wg=[];for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(.14,.06).translate(.07,0,0).rotateX(-Math.PI/2),M(0x4a3a2a,{side:THREE.DoubleSide}));w.scale.x=s;g.add(w);wg.push(w)}g.userData.w=wg;return g}
function mkCarcass(){const g=new THREE.Group();const m=M(0x5b3a2a),bm=M(0xd8ceb8,{roughness:.6}),red=M(0x5e1414,{roughness:.5});const b=ell(.35,1,.55,2,m);b.position.y=.18;g.add(b);
 for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(.26,.025,5,10,Math.PI),bm);r.position.set(0,.22,-.3+i*.14);r.rotation.y=Math.PI/2;g.add(r)}const f=ell(.2,1.2,.3,1.6,red);f.position.set(.1,.12,0);g.add(f);
 for(const [x,z,a] of[[.2,.5,.4],[-.2,.55,-.3],[.25,-.5,.2]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.03,.025,.6,5),m);l.rotation.z=1.4;l.rotation.y=a;l.position.set(x,.08,z);g.add(l)}return g}
function mkShiny(){const g=new THREE.Group();const m=M(rnd()<.5?0xffd257:0xd8e0ea,{metalness:1,roughness:.18,emissive:0x221a00});const t=new THREE.Mesh(new THREE.TorusGeometry(.07,.022,8,16),m);t.rotation.x=1.3;g.add(t);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glintTex(),color:0xfff1c0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.set(.6,.6,.6);g.add(sp);g.userData.sp=sp;return g}
let _gt=null;function glintTex(){if(_gt)return _gt;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,230,160,.5)');gr.addColorStop(1,'rgba(255,200,100,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);
 x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2;x.beginPath();x.moveTo(32,2);x.lineTo(32,62);x.moveTo(2,32);x.lineTo(62,32);x.stroke();_gt=new THREE.CanvasTexture(c);return _gt}
let _mk=null;function markTex(){if(_mk)return _mk;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.strokeStyle='#ffcf4a';x.lineWidth=6;x.beginPath();x.arc(32,32,22,0,TAU);x.stroke();x.fillStyle='#ffcf4a';x.beginPath();x.arc(32,32,6,0,TAU);x.fill();_mk=new THREE.CanvasTexture(c);return _mk}
// ---------- items (sticks / moss / shinies)
const items=[];const twigG=new THREE.CylinderGeometry(.018,.026,.7,5).rotateZ(Math.PI/2),mossG=new THREE.IcosahedronGeometry(.22,1);
const twigM=new THREE.MeshStandardMaterial({map:W.T.bark,color:0x8a7a66,roughness:1}),mossM=new THREE.MeshStandardMaterial({map:W.T.moss,color:0x8fbf6a,roughness:1});
const stickIM=new THREE.InstancedMesh(twigG,twigM,900),mossIM=new THREE.InstancedMesh(mossG,mossM,160);stickIM.castShadow=true;scene.add(stickIM,mossIM);
{const r=W.rng(77);let tries=0;
 while(items.filter(i=>i.type==='stick').length<300&&tries<20000){tries++;const t=W.trees[Math.floor(r()*W.trees.length)];const a=r()*TAU,d=1+r()*4;const x=t.x+Math.cos(a)*d,z=t.z+Math.sin(a)*d;const h=H(x,z);if(h<.6)continue;items.push({type:'stick',x,z,y:h+.04,rot:r()*6,alive:true,t:0,n:3})}
 const rocks=W.perches.filter(p=>p.kind==='rock');for(let i=0;i<120;i++){let x,z,h;if(i<70&&rocks.length){const p=rocks[Math.floor(r()*rocks.length)];const a=r()*TAU;x=p.x+Math.cos(a)*2.5;z=p.z+Math.sin(a)*2.5}else{const l=W.logs[Math.floor(r()*W.logs.length)];x=l.x+(r()-.5)*4;z=l.z+(r()-.5)*4}
  h=H(x,z);if(h<.6)continue;items.push({type:'moss',x,z,y:h+.06,rot:r()*6,alive:true,t:0})}
 for(let i=0;i<34;i++){let x,z;if(i<14){const a=r()*TAU,d=4+r()*26;x=W.RUINS.x+Math.cos(a)*d;z=W.RUINS.z+Math.sin(a)*d}else if(i<18){x=W.ARCH.x+(r()-.5)*40;z=W.ARCH.z+(r()-.5)*20}else{x=(r()-.5)*1300;z=(r()-.5)*1300}
  const h=H(x,z);if(h<.6){i--;continue}const it={type:'shiny',x,z,y:h+.08,alive:true,t:0};it.mesh=mkShiny();it.mesh.position.set(x,h+.08,z);scene.add(it.mesh);items.push(it)}}
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_e=new THREE.Euler();
function refreshItems(){let ks=0,km=0;for(const it of items){if(!it.alive){if(it.mesh)it.mesh.visible=false;continue}
 if(it.type==='stick'){for(let j=0;j<3;j++){_e.set(0,it.rot+j*.7,j*.05);_q.setFromEuler(_e);_v.set(it.x+j*.12-.12,it.y+j*.03,it.z+(j-1)*.1);_s.set(1+j*.1,1,1);_m4.compose(_v,_q,_s);stickIM.setMatrixAt(ks++,_m4)}}
 else if(it.type==='moss'){_q.identity();_v.set(it.x,it.y,it.z);_s.set(1,.45,1);_m4.compose(_v,_q,_s);mossIM.setMatrixAt(km++,_m4)}
 else if(it.mesh)it.mesh.visible=S&&S.sp==='crow'}
 stickIM.count=ks;mossIM.count=km;stickIM.instanceMatrix.needsUpdate=true;mossIM.instanceMatrix.needsUpdate=true;stickIM.computeBoundingSphere();mossIM.computeBoundingSphere()}
// ---------- creatures
const ents=[];
const ROLE={mouse:{mk:mkMouse,food:30,spd:4.2,size:0},rabbit:{mk:mkRabbit,food:55,spd:7,size:1.2},fox:{mk:()=>mkCanid(false),spd:7.2,dmg:16},wolf:{mk:()=>mkCanid(true),spd:8.5,dmg:26},fish:{mk:mkFish,food:45},songbird:{mk:mkSongbird,food:25},carrion:{mk:mkCarcass,food:40}};
function validGround(x,z){const h=H(x,z);return h>1.5&&h<70&&W.normalAt(x,z).y>.85}
function spawnNear(type,px,pz,minD,maxD){for(let k=0;k<30;k++){const a=rnd()*TAU,d=minD+rnd()*(maxD-minD);const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;if(Math.abs(x)>700||Math.abs(z)>700)continue;
  if(type==='fish'){const L=rnd()<.8?W.LAKE:W.POND;const r=L.r*.75*Math.sqrt(rnd()),b=rnd()*TAU;const fx=L.x+Math.cos(b)*r,fz=L.z+Math.sin(b)*r;if(H(fx,fz)<-1)return [fx,fz];continue}
  if(type==='rabbit'&&W.forestMask(x,z)>.55)continue;if(validGround(x,z))return [x,z]}return null}
function addEnt(type,x,z){const r=ROLE[type];const m=r.mk();scene.add(m);const e={type,x,z,y:H(x,z),yaw:rnd()*TAU,mesh:m,st:'idle',t:rnd()*3,vx:0,vz:0,alive:true,hide:0,cd:0,bites:3,ph:rnd()*9};
 if(type==='fish'){e.y=-.45;e.jump=0}if(type==='songbird'){e.cx=x;e.cz=z;e.cy=H(x,z)+12+rnd()*10;e.rad=8+rnd()*8;e.ang=rnd()*TAU;e.y=e.cy}ents.push(e);return e}
function populate(px,pz){
 const want={mouse:14,rabbit:6,songbird:12,fish:12,carrion:3,fox:2,wolf:2};
 for(const t in want){let have=ents.filter(e=>e.type===t);for(const e of have){if(hyp(e.x-px,e.z-pz)>(t==='fish'?600:260)){e.alive=false}}
  have=have.filter(e=>e.alive);
  let n=want[t]-have.length;while(n-->0){const p=spawnNear(t,px,pz,t==='fox'||t==='wolf'?110:t==='carrion'?60:25,t==='carrion'?240:170);if(!p)break;
   if(t==='songbird'){const c=addEnt(t,p[0],p[1]);for(let k=1;k<6&&n>0;k++,n--){const e=addEnt(t,p[0],p[1]);e.cx=c.cx;e.cz=c.cz;e.cy=c.cy+rnd()*3;e.rad=c.rad+rnd()*3;e.ang=c.ang+k*.4}}else addEnt(t,p[0],p[1])}}
 for(let i=ents.length-1;i>=0;i--)if(!ents[i].alive){scene.remove(ents[i].mesh);ents.splice(i,1)}}
// ---------- nest
const nestG=new THREE.Group();scene.add(nestG);
function buildNestMesh(){while(nestG.children.length)nestG.remove(nestG.children[0]);if(!S.nest)return;const n=S.nest,u=n.up;const r=W.rng(5);
 const s=Math.max(1,SPECIES[S.sp].size)*1.1;const tw=[];const ring=(R,y0,hgt,cnt)=>{for(let i=0;i<cnt;i++){const a=i/cnt*TAU+r()*.3;const g=new THREE.CylinderGeometry(.02,.03,.8+r()*.5,4);g.rotateZ(Math.PI/2).rotateY(-a+Math.PI/2+(r()-.5)*.8).rotateX((r()-.5)*.5);
  const rr=R*(1+(r()-.5)*.2);g.translate(Math.cos(a)*rr,y0+r()*hgt,Math.sin(a)*rr);tw.push(g)}};
 ring(.55*s,0,.22*s,70);ring(.4*s,-.05,.1,30);
 if(u.walls){ring(.62*s,.2*s,.6*s,90);// roof of twigs
  for(let i=0;i<40;i++){const a=i/40*TAU;const g=new THREE.CylinderGeometry(.02,.03,.95*s,4);g.translate(0,.47*s,0);g.rotateX(-.95).rotateY(-a);g.translate(Math.cos(a)*.62*s,.8*s,Math.sin(a)*.62*s);if(i%10<2)continue;tw.push(g)}}
 if(u.lookout){for(let i=0;i<3;i++){const g=new THREE.CylinderGeometry(.04,.05,2.2*s,5);g.translate(.7*s+i*.05,1.1*s,(i-1)*.12);tw.push(g)}ring(.35*s,2.2*s,.08,26);}
 if(u.larder){for(let i=0;i<18;i++){const g=new THREE.CylinderGeometry(.02,.03,.6,4).rotateZ(Math.PI/2).rotateY(r()*3);g.translate(-.8*s+(r()-.5)*.3,r()*.15,.2+(r()-.5)*.3);tw.push(g)}}
 const mesh=new THREE.Mesh(W.mergeGeos(tw),new THREE.MeshStandardMaterial({map:W.T.bark,color:0x7a6a55,roughness:1}));mesh.castShadow=mesh.receiveShadow=true;nestG.add(mesh);
 if(u.lining){const l=new THREE.Mesh(new THREE.SphereGeometry(.42*s,14,8,0,TAU,Math.PI*.55,Math.PI*.45),new THREE.MeshStandardMaterial({map:W.T.moss,color:0xa0c080,side:THREE.DoubleSide,roughness:1}));l.position.y=.32*s;nestG.add(l)}
 if(u.hoard){for(let i=0;i<5;i++){const m=mkShiny();m.position.set(Math.cos(i*1.3)*.3*s,.12,Math.sin(i*1.3)*.3*s);m.userData.sp.scale.setScalar(.35);nestG.add(m)}}
 nestG.position.set(n.x,n.y-.12,n.z)}
const UPG=[
 {id:'lining',name:'Moss Lining',desc:'+25 max health. Sleeping heals you fully.',cost:{moss:4,stick:2}},
 {id:'walls',name:'Woven Walls & Roof',desc:'Turns the nest into a tree base: full storm shelter and warmer nights.',cost:{stick:12}},
 {id:'larder',name:'Larder',desc:'Store up to 4 caught meals at home. Hunger drains 15% slower.',cost:{stick:6,moss:2}},
 {id:'lookout',name:'Lookout Perch',desc:'+20% max stamina and faster stamina recovery everywhere.',cost:{stick:8,shiny:1}},
 {id:'hoard',name:'Shiny Hoard',desc:'+8% flight speed. Your nest glitters. (Shinies: crows collect them.)',cost:{shiny:5}}];
// ---------- state
let S=null;const SAVEK='bfw-save-v1';
function newState(sp){const p=W.perches.filter(q=>q.kind==='tree'&&hyp(q.x-(-150),q.z-120)<120&&W.trees[q.tree].type!==0);const st=p.length?p[Math.floor(rnd()*p.length)]:{x:-150,y:H(-150,120)+10,z:120};
 return {v:1,sp,x:st.x,y:st.y,z:st.z,yaw:rnd()*TAU,pitch:0,roll:0,speed:0,vy:0,mode:'perch',perch:st,hp:SPECIES[sp].hp,hunger:80,thirst:75,stam:SPECIES[sp].stam,inv:{stick:0,moss:0,shiny:0},hold:null,
  nest:null,day:1,t:.3,storm:0,stormT:0,nextStorm:1.4+rnd(),obj:0,ab:0,abT:0,stats:{caught:0,flown:0,days:0},seenTut:false,played:0}}
function save(){if(!S||S.mode==='dead')return;const o=Object.assign({},S);o.perch=null;try{localStorage.setItem(SAVEK,JSON.stringify(o))}catch(e){}}
function load(){try{const o=JSON.parse(localStorage.getItem(SAVEK));if(o&&o.v===1&&SPECIES[o.sp])return o}catch(e){}return null}
function maxHp(){return SPECIES[S.sp].hp+(S.nest&&S.nest.up.lining?25:0)}
function maxSt(){return SPECIES[S.sp].stam*(S.nest&&S.nest.up.lookout?1.2:1)}
function nestCost(){return Math.round(8*SPECIES[S.sp].buildDisc)}
function costOf(u){const c=Object.assign({},u.cost);if(S.sp==='crow'&&c.stick)c.stick=Math.ceil(c.stick*.6);return c}
// ---------- player bird
let bird=null;const held=new THREE.Group();scene.add(held);
function setBird(sp){if(bird)scene.remove(bird);bird=makeBird(sp);scene.add(bird)}
const OBJ=[
 {t:'Take flight: hold FLAP (A) and steer with the stick',done:()=>S.stats.flown>4},
 {t:'Land on a treetop: press LAND (B) near a tree',done:()=>S.mode==='perch'&&S.perch&&S.perch.kind!=='rock'&&S.stats.flown>4},
 {t:'Drink: land at a pond, river or lake edge and press ACT (X)',done:()=>S.flags&&S.flags.drank},
 {t:'Eat: dive onto prey, or scavenge, then press ACT (X)',done:()=>S.flags&&S.flags.ate},
 {t:()=>`Gather sticks under trees (${S.inv.stick}/${nestCost()})`,done:()=>S.inv.stick>=nestCost()||S.nest},
 {t:'Perch on a tree and build your nest: ACT (X)',done:()=>!!S.nest},
 {t:'Rest in your nest (ACT at the nest)',done:()=>S.flags&&S.flags.rested},
 {t:'Upgrade your nest (moss is found on rocks and logs)',done:()=>S.nest&&Object.values(S.nest.up).some(Boolean)},
 {t:'Survive until day 4',done:()=>S.day>=4},
 {t:'Build every nest upgrade',done:()=>S.nest&&UPG.every(u=>S.nest.up[u.id])},
 {t:'Survive 10 days in the wild',done:()=>S.day>=11},
 {t:'You are a legend of the Blackfeather Wilds. Keep surviving!',done:()=>false}];
// ---------- HUD helpers
let toastT=0;function toast(m,long){const el=$('#toast');el.textContent=m;el.classList.add('on');toastT=long?4.5:2.6}window.toast=toast;
function prompt(m){const el=$('#prompt');if(m){el.innerHTML=m;el.classList.add('on')}else el.classList.remove('on');const a=$('#bAct');a.classList.toggle('hot',!!m)}
// ---------- world time / weather
function sunInfo(t){const a=(t-.25)*TAU;return {el:Math.sin(a),az:a}}
const SKYK=[ // t, top, horizon, sunCol, sunI, hemiI, fog
 [0,0x050914,0x101826,0x8ea4d8,.28,.18],[.2,0x0a1222,0x1c2433,0x9aaedf,.3,.2],[.25,0x3a4a78,0xe08a5a,0xff9a5a,1.2,.4],[.3,0x5d84c0,0xd9c2a4,0xffd9a8,2.2,.55],
 [.4,0x4a78c0,0xa9c2d8,0xfff2dc,2.8,.65],[.6,0x4a78c0,0xa9c2d8,0xfff2dc,2.8,.65],[.7,0x5a76b0,0xe0b088,0xffc890,2,.5],[.75,0x34406e,0xd8704a,0xff7a40,1.1,.38],[.8,0x0c1426,0x1f2436,0x9aaedf,.3,.2],[1,0x050914,0x101826,0x8ea4d8,.28,.18]];
const cA=new THREE.Color(),cB=new THREE.Color();
function skyAt(t){let i=0;while(i<SKYK.length-2&&SKYK[i+1][0]<=t)i++;const a=SKYK[i],b=SKYK[i+1],f=(t-a[0])/(b[0]-a[0]||1);
 const top=cA.set(a[1]).lerp(cB.set(b[1]),f).clone(),hor=cA.set(a[2]).lerp(cB.set(b[2]),f).clone(),sc=cA.set(a[3]).lerp(cB.set(b[3]),f).clone();return {top,hor,sc,si:lerp(a[4],b[4],f),hi:lerp(a[5],b[5],f)}}
function isNight(){return S.t<.23||S.t>.78}
// rain
let rain=null;function buildRain(){if(rain){scene.remove(rain);rain.geometry.dispose()}const n=B.getQ().rain;const g=new THREE.BufferGeometry();const p=new Float32Array(n*6);for(let i=0;i<n;i++){const x=(rnd()-.5)*60,y=rnd()*40,z=(rnd()-.5)*60;p.set([x,y,z,x,y-.9,z],i*6)}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));rain=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x9fb0c0,transparent:true,opacity:.35}));rain.frustumCulled=false;rain.visible=false;scene.add(rain)}
buildRain();
// markers (keen eye / owl sight)
const marks=[];for(let i=0;i<24;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:markTex(),depthTest:false,transparent:true}));s.scale.set(1.6,1.6,1);s.visible=false;s.renderOrder=10;scene.add(s);marks.push(s)}
// ---------- core update
const fwd=new THREE.Vector3();let flapAcc=0,flapSnd=0,lastSave=0,stormFlash=0,cam={yawOff:0,pitchOff:0,idle:0,pos:new THREE.Vector3(),init:false},msgCD={};
function once(k,m,t){if((msgCD[k]||0)>0)return;msgCD[k]=t||8;toast(m)}
function gameTick(dt,I){
 const sp=SPECIES[S.sp];S.played+=dt;for(const k in msgCD)msgCD[k]-=dt;
 // time & weather
 const night=isNight();const daySpeed=1/(night?240:600)*0.75; // full cycle ~ 9 min
 const pt=S.t;S.t+=dt*daySpeed*(night?2.6:1)*0.75*1.6;if(S.t>=1){S.t-=1}if(pt<.27&&S.t>=.27&&S.played>5){S.day++;toast('Dawn — Day '+S.day,true);save()}
 S.nextStorm-=dt/ (600);
 if(S.storm<=0&&S.nextStorm<=0){S.stormT=110+rnd()*70;S.nextStorm=1.6+rnd()*1.4;toast('A storm is rolling in. Find shelter in the trees or your nest.',true)}
 if(S.stormT>0){S.stormT-=dt;S.storm=Math.min(1,S.storm+dt/20)}else S.storm=Math.max(0,S.storm-dt/15);
 // meters
 const flying=S.mode==='fly'||S.mode==='landing';const resting=S.mode==='perch';const owlNight=S.sp==='owl'&&night;
 const hm=(flying?1.5:resting?.7:1)*(S.nest&&S.nest.up.larder?.85:1);S.hunger=clamp(S.hunger-dt*.2*hm,0,100);S.thirst=clamp(S.thirst-dt*.27*(flying?1.35:resting?.7:1)*(night?.8:1.1),0,100);
 const sheltered=(S.mode==='perch'&&S.perch&&(S.perch.kind==='tree'||S.perch.kind==='branch'||S.perch.nest))&&(!S.perch.nest||true);const inNest=atNest();const fullShelter=inNest&&S.nest.up.walls;
 let dmg=0;if(S.hunger<=0)dmg+=1.1;if(S.thirst<=0)dmg+=1.4;
 if(S.storm>.5&&!fullShelter&&!(sheltered&&W.trees[S.perch.tree||0]&&W.trees[S.perch.tree].type!==2))dmg+=.55;
 if(night&&S.storm>.5&&!inNest&&S.sp!=='owl')dmg+=.2;
 if(dmg>0)S.hp-=dt*dmg;else if(S.hunger>55&&S.thirst>55)S.hp=Math.min(maxHp(),S.hp+dt*(resting?1.2:.5));
 if(S.hunger<=0)once('hun','You are starving! Hunt or scavenge.');if(S.thirst<=0)once('thi','You are dying of thirst! Find water.');
 S.ab=Math.max(0,S.ab-dt);S.abT=Math.max(0,S.abT-dt);
 // ability
 if(I.abE&&S.mode!=='dead')useAbility();
 // player physics
 if(S.mode==='fly')flyTick(dt,I,sp);else if(S.mode==='ground')groundTick(dt,I,sp);else if(S.mode==='perch')perchTick(dt,I,sp);else if(S.mode==='landing')landingTick(dt,sp);
 const regen=S.nest&&S.nest.up.lookout?1.3:1;
 if(S.mode==='perch')S.stam=Math.min(maxSt(),S.stam+dt*14*regen);else if(S.mode==='ground')S.stam=Math.min(maxSt(),S.stam+dt*(S.onWater?-3:9)*regen);
 S.stam=Math.max(0,S.stam);
 // context actions
 contextTick(dt,I);
 if(S.hp<=0)die();
 // objectives
 while(S.obj<OBJ.length-1&&OBJ[S.obj].done()){S.obj++;SFX.ok();if(S.obj>1)toast('Goal complete!')}
 // ents & items
 entTick(dt);
 for(const it of items)if(!it.alive){it.t-=dt;if(it.t<=0){it.alive=true;itemsDirty=true}}
 for(const b of W.bushes)if(!b.ripe){b.t-=dt;if(b.t<=0){b.ripe=1;berriesDirty=true}}
 for(const l of W.logs)if(!l.grubs){l.t-=dt;if(l.t<=0)l.grubs=1}
 lastSave+=dt;if(lastSave>20){lastSave=0;save()}
}
let itemsDirty=true,berriesDirty=true;
function atNest(){return S.nest&&S.mode==='perch'&&S.perch&&S.perch.nest}
function forward(){const cp=Math.cos(S.pitch);fwd.set(-Math.sin(S.yaw)*cp,Math.sin(S.pitch),-Math.cos(S.yaw)*cp);return fwd}
function thermalAt(x,z){if(S.t<.33||S.t>.68||S.storm>.3)return 0;const f=W.forestMask(x,z);if(f>.52)return 0;const n=W.fbm(x*.01+70,z*.01+30,2);return Math.max(0,(n-.5)*4)}
function flyTick(dt,I,sp){
 const spd=sp.speed*(S.nest&&S.nest.up.hoard?1.08:1)*(S.sp==='owl'&&!isNight()?.92:1);
 const sx=I.mx,sy=SET.invert?I.my:-I.my;const dive=I.diveV||0,brake=I.brakeV||0;
 const turn=sp.turn*(1.55-clamp(S.speed/60,0,.6));
 S.yaw-=sx*turn*dt;S.roll=lerp(S.roll,-sx*.85-(S.mode==='fly'?0:0),1-Math.exp(-dt*5));
 let pt=sy*.7;if(dive>0)pt=lerp(pt,-1.25,dive);if(brake>0)pt=Math.max(pt,.45*brake);
 S.pitch=lerp(S.pitch,pt,1-Math.exp(-dt*(dive?3.2:2.4)));
 // flapping
 const wantFlap=I.flap&&S.stam>0;if(I.flapE&&S.stam>0)flapAcc=Math.max(flapAcc,.35);
 const flapping=wantFlap||flapAcc>0;flapAcc=Math.max(0,flapAcc-dt);
 const cruise=15*spd;
 let lift=0;if(flapping){const cost=sp.flapCost*1.4*(S.sp==='owl'&&!isNight()?1.2:1)*(S.storm>.5?1.3:1);S.stam-=cost*dt;S.speed+=Math.max(0,cruise-S.speed)*dt*1.8+dt*2;lift=3.2*(1-clamp((S.speed-8)/30,0,.7));
  flapSnd-=dt;if(flapSnd<=0){SFX.flap();flapSnd=.32}}else flapSnd=0;
 // gravity along path, drag
 S.speed+=-9.8*Math.sin(S.pitch)*dt*.95;S.speed-=(.0075*S.speed*S.speed*(dive>.2?.25:1)+brake*7)*dt;
 const maxS=(dive>.2?sp.diveMax:28)*spd;S.speed=clamp(S.speed,2.5,maxS);
 const sink=sp.glideSink+Math.max(0,8-S.speed)*.75;const th=thermalAt(S.x,S.z)*sp.thermal;
 if(!flapping&&dive<.2){S.stam=Math.min(maxSt(),S.stam+dt*(1.5+(S.sp==='hawk'?2.5+th*1.5:0)))}
 forward();
 let wx=0,wz=0;if(S.storm>.3){wx=Math.sin(S.played*.05)*4*S.storm;wz=Math.cos(S.played*.04)*4*S.storm;S.stam-=dt*2.5*S.storm}
 S.x+=fwd.x*S.speed*dt+wx*dt;S.z+=fwd.z*S.speed*dt+wz*dt;S.y+=(fwd.y*S.speed+lift-sink+th)*dt;
 S.stats.flown+=dt;
 // bounds
 const lim=760;if(Math.abs(S.x)>lim||Math.abs(S.z)>lim){S.x=clamp(S.x,-lim,lim);S.z=clamp(S.z,-lim,lim);S.yaw+=dt*2;once('edge','The wilds end at the great mountains.')}
 const ceil=320;if(S.y>ceil){S.y=ceil;S.pitch=Math.min(S.pitch,0)}
 // lightning danger
 if(S.storm>.7&&S.y-gH(S.x,S.z)>45){S.zap=(S.zap||0)+dt;if(S.zap>4){S.zap=0;strike(true)}else once('zap','Too high in a storm! Lightning!',6)}else S.zap=0;
 // ground / water contact
 const g=H(S.x,S.z);const surf=Math.max(g,0);
 if(S.y<surf+.3){
  if(g<0){// water
   if(tryFish(true))return;S.y=.3;S.onWater=true;S.mode='ground';S.speed=0;SFX.splash();once('wet','Splash! Press ACT to drink, FLAP to take off.')}
  else{const impact=S.speed*Math.max(.3,-Math.sin(S.pitch)+.35);if(impact>18){hurt((impact-18)*1.5,'Crash landing!')}
   S.y=surf;S.mode='ground';S.onWater=false;S.speed=0}
  S.pitch=0;S.roll=0}
 // land / perch
 if(I.landE){const p=findPerch(28);if(p)startLanding(p);else{S.pitch=-.5;S.autoLand=true;once('land','No perch nearby. Gliding down to land…',3)}}
 if(S.autoLand){S.pitch=Math.min(S.pitch,-.45);if(I.flap)S.autoLand=false}
}
function findPerch(range){let best=null,bd=1e9;forward();for(const p of W.nearPerches(S.x,S.z,range)){const dx=p.x-S.x,dz=p.z-S.z,dy=p.y-S.y;const d=hyp(dx,dz,dy);if(d>range)continue;
 const dot=(dx*fwd.x+dz*fwd.z)/(hyp(dx,dz)||1);const score=d*(1.4-dot*.6)+Math.max(0,dy)*1.5;if(score<bd){bd=score;best=p}}
 if(S.nest){const d=hyp(S.nest.x-S.x,S.nest.z-S.z,S.nest.y-S.y);if(d<range*1.2&&d<bd+6)best=nestPerch()}return best}
function nestPerch(){return {x:S.nest.x,y:S.nest.y+.15,z:S.nest.z,kind:'tree',tree:S.nest.tree,nest:true}}
let LD=null;function startLanding(p){LD={sx:S.x,sy:S.y,sz:S.z,p,t:0,dur:clamp(hyp(p.x-S.x,p.z-S.z,p.y-S.y)/Math.max(10,S.speed),.6,2.6)};S.mode='landing';S.autoLand=false}
function landingTick(dt,sp){if(!LD){S.mode='fly';return}LD.t+=dt/LD.dur;const t=Math.min(1,LD.t),e=t*t*(3-2*t);const p=LD.p;
 const nx=lerp(LD.sx,p.x,e),nz=lerp(LD.sz,p.z,e),ny=lerp(LD.sy,p.y,e)+Math.sin(t*Math.PI)*2;const dx=nx-S.x,dz=nz-S.z;if(hyp(dx,dz)>.01)S.yaw=Math.atan2(-dx,-dz);
 S.x=nx;S.y=ny;S.z=nz;S.pitch=lerp(S.pitch,.35,dt*4);S.roll=lerp(S.roll,0,dt*5);S.speed=lerp(S.speed,3,dt*3);
 if(t>=1){S.mode='perch';S.perch=p;S.pitch=0;S.speed=0;LD=null;SFX.flap();if(p.nest)arriveNest()}}
function takeOff(sp){const c=10*(S.onWater?2:1);if(S.stam<c){once('tired','Too tired to take off. Rest a moment.');return}S.stam-=c;S.mode='fly';S.speed=7*SPECIES[S.sp].speed;S.pitch=.55;S.y+=.4;S.onWater=false;S.perch=null;flapAcc=.6;SFX.flap()}
function perchTick(dt,I){if(I.flapE)return takeOff();S.yaw-=I.mx*dt*2;if(S.perch){S.x=S.perch.x;S.y=S.perch.y;S.z=S.perch.z}S.pitch=lerp(S.pitch,0,dt*4);S.roll=0}
function groundTick(dt,I){if(I.flapE)return takeOff();const m=hyp(I.mx,I.my);
 if(m>.1){const a=cam.yaw;const vx=(I.mx*Math.cos(a)+I.my*Math.sin(a)),vz=(-I.mx*Math.sin(a)+I.my*Math.cos(a));const sp=(S.onWater?1:2.4)*Math.min(1,m);
  const nx=S.x+vx*sp*dt,nz=S.z+vz*sp*dt;const g=H(nx,nz);if(g<-.35&&!S.onWater){once('deep','Too deep to wade. Drink here, or fly.',4)}else if(W.normalAt(nx,nz).y>.6||S.onWater){S.x=nx;S.z=nz}
  const ty=Math.atan2(-vx,-vz);let d=ty-S.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));S.yaw+=d*Math.min(1,dt*10);S.walk=(S.walk||0)+dt*m}
 const g=H(S.x,S.z);S.onWater=g<-.05;S.y=S.onWater?.12:g;S.pitch=0;S.roll=0}
// ---------- abilities
function useAbility(){const sp=SPECIES[S.sp];if(S.ab>0){once('cd',sp.ability+' recharging ('+Math.ceil(S.ab)+'s)',1.5);return}S.ab=sp.abCd;B.abilitySfx(S.sp);
 if(S.sp==='crow'||S.sp==='eagle'){let n=0;for(const e of ents)if((e.type==='fox'||e.type==='wolf')&&hyp(e.x-S.x,e.z-S.z)<45){e.st='flee';e.t=18;n++}S.abT=15;toast(S.sp==='crow'?(n?'CAW! Predators scatter.':'CAW! Nearby shinies revealed.'):(n?'SCREECH! Predators flee.':'SCREECH!'))}
 else if(S.sp==='hawk'){S.abT=20;toast('Keen Eye: prey marked')}
 else if(S.sp==='falcon'){if(S.mode==='fly'){S.pitch=-1.2;S.speed=Math.max(S.speed,30);S.abT=3;toast('STOOP!')}else{S.ab=0;toast('Stoop works in flight')}}
 else if(S.sp==='owl'){S.nv=!S.nv;S.ab=1;toast(S.nv?'Night Sight on':'Night Sight off')}}
// ---------- damage / death
function hurt(n,msg){if(S.mode==='dead')return;S.hp-=n;SFX.hit();B.rumble(1,.6,260);$('#hurt').classList.remove('on');void $('#hurt').offsetWidth;$('#hurt').classList.add('on');if(msg)toast(msg)}
function strike(onPlayer){stormFlash=1;setTimeout(SFX.thunder,onPlayer?0:600+rnd()*1500);if(onPlayer)hurt(28,'Struck by lightning! Fly lower in storms.')}
function die(){S.mode='dead';S.hp=0;save();localStorage.removeItem(SAVEK);if(S.nest){const k=JSON.stringify(Object.assign({},S,{perch:null}));localStorage.setItem(SAVEK+'-dead',k)}
 const hasNest=!!S.nest;$('#deadMsg').textContent=`You survived ${S.day} day${S.day>1?'s':''} and caught ${S.stats.caught} meal${S.stats.caught===1?'':'s'}.`;
 $('#bRespawn').style.display=hasNest?'':'none';showPanel('dead')}
function respawn(){const o=JSON.parse(localStorage.getItem(SAVEK+'-dead'));if(!o)return newGame(S.sp);S=o;S.mode='perch';S.perch=nestPerch();S.x=S.perch.x;S.y=S.perch.y;S.z=S.perch.z;S.hp=maxHp()*.6;S.hunger=Math.max(S.hunger,50);S.thirst=Math.max(S.thirst,50);S.stam=maxSt();S.inv={stick:0,moss:0,shiny:0};S.hold=null;S.t=.27;S.stormT=0;S.storm=0;
 localStorage.removeItem(SAVEK+'-dead');setBird(S.sp);buildNestMesh();save();showPanel(null);toast('You wake in your nest, hurt but alive.',true)}
// ---------- context actions
function near(list,r,f){let best=null,bd=r;for(const o of list){if(f&&!f(o))continue;const d=hyp(o.x-S.x,o.z-S.z,(o.y||S.y)-S.y);if(d<bd){bd=d;best=o}}return best}
function waterNear(){if(S.onWater)return true;for(let a=0;a<8;a++){if(H(S.x+Math.cos(a*.785)*1.6,S.z+Math.sin(a*.785)*1.6)<0)return true}return false}
function diet(t){return SPECIES[S.sp].diet[t]||0}
let ctx=null;
function contextTick(dt,I){ctx=null;const sp=SPECIES[S.sp];
 if(S.mode==='dead'){prompt(null);return}
 const onLand=S.mode==='ground',perched=S.mode==='perch',low=S.mode==='fly'&&S.y-gH(S.x,S.z)<2.6;
 if(S.hold){ctx={k:'eat',l:'Eat '+S.hold.name}; if(atNest()&&S.nest.up.larder&&S.nest.larder.length<4&&S.hunger>70)ctx={k:'store',l:'Store '+S.hold.name+' in larder'}}
 else if(atNest())ctx={k:'nest',l:'Nest: rest & upgrades'};
 else if(perched&&S.perch&&(S.perch.kind==='tree'||S.perch.kind==='branch')&&!S.nest&&S.inv.stick>=nestCost())ctx={k:'build',l:'Build nest here ('+nestCost()+' sticks)'};
 else if(perched&&S.perch&&(S.perch.kind==='tree'||S.perch.kind==='branch')&&!S.nest&&S.obj>=4)ctx={k:'nobuild',l:'Need '+nestCost()+' sticks to build'};
 if(!ctx&&(onLand||low)){const cap=sp.carry;const tot=S.inv.stick+S.inv.moss;
  const it=near(items,onLand?1.9:2.6,o=>o.alive&&(o.type!=='shiny'||S.sp==='crow'));
  if(it){ctx=tot>=cap&&it.type!=='shiny'?{k:'full',l:'Carrying all you can ('+cap+')'}:{k:'pick',o:it,l:'Pick up '+({stick:'sticks',moss:'moss',shiny:'shiny trinket'})[it.type]}}}
 if(!ctx&&onLand){
  const c=near(ents,2.2,e=>e.type==='carrion'&&e.bites>0);if(c)ctx=diet('carrion')?{k:'carrion',o:c,l:'Scavenge carcass'}:{k:'no',l:SPECIES[S.sp].short+'s won\'t eat carrion'};
  if(!ctx){const b=near(W.bushes,2.3,b=>b.ripe);if(b)ctx=diet('berries')?{k:'berries',o:b,l:'Eat berries'}:{k:'no',l:'Raptors don\'t eat berries'}}
  if(!ctx){const l=near(W.logs,3,l=>l.grubs);if(l&&diet('grubs'))ctx={k:'grubs',o:l,l:'Dig grubs from the log'}}
  if(!ctx){const m=near(ents,1.6,e=>(e.type==='mouse'||e.type==='rabbit')&&e.hide<=0);if(m&&canTake(m))ctx={k:'pounce',o:m,l:'Pounce!'}}
  if(!ctx&&waterNear())ctx={k:'drink',l:'Drink'}}
 prompt(ctx?(ctx.k==='no'||ctx.k==='full'||ctx.k==='nobuild'?'<i>'+ctx.l+'</i>':'<b class="kx">X</b> '+ctx.l):null);
 if(I.actE&&ctx)doAct(ctx)}
function canTake(e){if(e.type==='rabbit'&&SPECIES[S.sp].size<1.2)return false;return diet(e.type)>0}
function doAct(c){const sp=SPECIES[S.sp];
 switch(c.k){
 case 'eat':{const v=S.hold.food*diet(S.hold.type);S.hunger=clamp(S.hunger+v,0,100);if(S.hold.type==='fish')S.thirst=clamp(S.thirst+6,0,100);S.hold=null;SFX.eat();S.flags=Object.assign(S.flags||{},{ate:1});toast('+'+Math.round(v)+' food');break}
 case 'store':S.nest.larder.push(S.hold);S.hold=null;SFX.pick();toast('Stored in larder ('+S.nest.larder.length+'/4)');break;
 case 'nest':openNest();break;
 case 'build':S.inv.stick-=nestCost();const p=S.perch;S.nest={x:p.x,y:p.y,z:p.z,tree:p.tree,up:{},store:{stick:0,moss:0,shiny:0},larder:[]};S.perch=nestPerch();buildNestMesh();SFX.build();B.rumble(.4,.4,300);toast('Nest built! This is your home and save point.',true);save();break;
 case 'pick':{const it=c.o;it.alive=false;it.t=150+rnd()*90;itemsDirty=true;if(it.type==='stick'){S.inv.stick=Math.min(sp.carry-S.inv.moss,S.inv.stick+(S.sp==='crow'||S.sp==='eagle'?3:2));SFX.pick()}else if(it.type==='moss'){S.inv.moss++;SFX.pick()}else{S.inv.shiny++;SFX.shiny();toast('A shiny! ('+S.inv.shiny+')')}break}
 case 'carrion':{c.o.bites--;const v=c.o.bites>=0?40*diet('carrion')*.5:0;S.hunger=clamp(S.hunger+v,0,100);SFX.eat();S.flags=Object.assign(S.flags||{},{ate:1});toast('+'+Math.round(v)+' food');if(c.o.bites<=0){c.o.alive=false}break}
 case 'berries':{c.o.ripe=0;c.o.t=120;berriesDirty=true;const v=12*diet('berries');S.hunger=clamp(S.hunger+v,0,100);S.thirst=clamp(S.thirst+5,0,100);SFX.eat();S.flags=Object.assign(S.flags||{},{ate:1});toast('+'+Math.round(v)+' food');break}
 case 'grubs':{c.o.grubs=0;c.o.t=150;const v=10*diet('grubs');S.hunger=clamp(S.hunger+v,0,100);SFX.eat();S.flags=Object.assign(S.flags||{},{ate:1});toast('+'+Math.round(v)+' food');break}
 case 'pounce':catchPrey(c.o);break;
 case 'drink':S.thirst=clamp(S.thirst+30,0,100);SFX.drink();S.flags=Object.assign(S.flags||{},{drank:1});toast('+30 water');break}}
function catchPrey(e){e.alive=false;scene.remove(e.mesh);const i=ents.indexOf(e);if(i>=0)ents.splice(i,1);const r=ROLE[e.type];
 S.hold={type:e.type,food:r.food,name:({mouse:'mouse',rabbit:'rabbit',fish:'fish',songbird:'songbird'})[e.type]};S.stats.caught++;SFX.eat();B.rumble(.6,.3,180);toast('Caught a '+S.hold.name+'! Press ACT to eat.');
 while(held.children.length)held.remove(held.children[0]);const m=r.mk();held.add(m)}
function arriveNest(){const st=S.nest.store;let d=0;for(const k of ['stick','moss','shiny']){st[k]+=S.inv[k];d+=S.inv[k];S.inv[k]=0}if(d)toast('Dropped off '+d+' item'+(d>1?'s':'')+' at the nest');save()}
function tryFish(splash){for(const e of ents){if(e.type!=='fish')continue;const d=hyp(e.x-S.x,e.z-S.z);const r=S.sp==='eagle'?3:1.6;if(d<r&&(S.sp==='eagle'||e.jump>0)&&diet('fish')){catchPrey(e);S.y=.8;S.pitch=.4;S.speed=Math.max(S.speed*.5,7);SFX.splash();return true}}return false}
// ---------- entities tick
let popT=0;
function entTick(dt){popT-=dt;if(popT<=0){popT=4;populate(S.x,S.z)}
 const night=isNight(),owl=S.sp==='owl',pl=S.mode;const pAbove=S.y-gH(S.x,S.z);const diving=S.mode==='fly'&&S.speed>16;
 for(const e of ents){const dx=S.x-e.x,dz=S.z-e.z,d=hyp(dx,dz);e.t-=dt;e.cd-=dt;const m=e.mesh;
  if(d>300){m.visible=false;continue}m.visible=e.hide<=0;
  switch(e.type){
  case 'mouse':case 'rabbit':{const R=ROLE[e.type];if(e.hide>0){e.hide-=dt;break}
   if(e.type==='rabbit'&&night){m.visible=false;break}
   const alert=!owl&&d<(e.type==='rabbit'?18:13)&&pAbove<(diving?5:11);
   if(alert&&e.st!=='flee'){e.st='flee';e.t=2.2+rnd();const a=Math.atan2(-dx,-dz)+(rnd()-.5);e.vx=Math.sin(a)*R.spd;e.vz=Math.cos(a)*R.spd}
   if(e.st==='flee'){if(e.t<=0){e.st='idle';if(rnd()<.35){e.hide=18}}}
   else if(e.t<=0){e.t=1+rnd()*3;if(rnd()<.5){const a=rnd()*TAU,s=R.spd*.25;e.vx=Math.sin(a)*s;e.vz=Math.cos(a)*s}else{e.vx=e.vz=0}}
   const nx=e.x+e.vx*dt,nz=e.z+e.vz*dt;if(validGround(nx,nz)){e.x=nx;e.z=nz}else{e.vx*=-1;e.vz*=-1}
   if(e.vx||e.vz)e.yaw=Math.atan2(-e.vx,-e.vz);e.y=H(e.x,e.z);const hop=(e.vx||e.vz)?Math.abs(Math.sin(S.played*(e.type==='rabbit'?9:16)+e.ph))*(e.type==='rabbit'?.18:.03):0;
   m.position.set(e.x,e.y+hop,e.z);m.rotation.y=e.yaw;
   if(S.mode==='fly'&&canTake(e)){const r=.9+SPECIES[S.sp].size*.6+(S.speed>20?.8:0);if(hyp(dx,dz,S.y-.3-e.y)<r){catchPrey(e);S.pitch=.5;return}}
   break}
  case 'fox':case 'wolf':{const R=ROLE[e.type];const active=e.type==='fox'?!night||S.t<.25||S.t>.75:night;m.visible=active&&e.hide<=0;if(!active){continue}
   const onG=(pl==='ground')||(pl==='perch'&&pAbove<1.5)||(pl==='fly'&&pAbove<2);const fearsEagle=e.type==='fox'&&S.sp==='eagle';
   let spd=0,tx=0,tz=0;
   if(e.st==='flee'){if(e.t<=0)e.st='idle';tx=-dx;tz=-dz;spd=R.spd}
   else if(onG&&d<(night&&e.type==='wolf'?36:30)&&!fearsEagle){if(e.st!=='chase'){e.st='chase';SFX.growl();once('pred','A '+e.type+' is hunting you! Fly!',5)}tx=dx;tz=dz;spd=R.spd;
    if(d<1.3+SPECIES[S.sp].size*.3&&e.cd<=0){e.cd=1.3;hurt(R.dmg,'Bitten by a '+e.type+'!');}}
   else{if(e.st==='chase'){e.st='idle';e.t=2}if(e.t<=0){e.t=3+rnd()*4;const a=rnd()*TAU;e.wx=Math.sin(a);e.wz=Math.cos(a);e.walk=rnd()<.6}if(e.walk){tx=e.wx;tz=e.wz;spd=1.6}}
   if(spd){const l=hyp(tx,tz)||1;const nx=e.x+tx/l*spd*dt,nz=e.z+tz/l*spd*dt;if(H(nx,nz)>.3&&W.normalAt(nx,nz).y>.65){e.x=nx;e.z=nz}else e.t=0;let ty=Math.atan2(-tx,-tz);let df=ty-e.yaw;df=Math.atan2(Math.sin(df),Math.cos(df));e.yaw+=df*Math.min(1,dt*8)}
   e.y=H(e.x,e.z);m.position.set(e.x,e.y,e.z);m.rotation.y=e.yaw;const ph=S.played*(spd>3?11:5);const u=m.userData;u.legs.forEach((l,i)=>l.rotation.x=spd?Math.sin(ph+(i%2?Math.PI:0)+(i>1?1:0))*.6:0);u.tail.rotation.y=Math.sin(S.played*3)*.3;
   break}
  case 'fish':{e.t-=0;if(e.jump>0){e.jump-=dt;const k=1-e.jump/1.1;e.y=-.4+Math.sin(k*Math.PI)*1.6;m.rotation.x=lerp(.9,-.9,k);e.x+=Math.sin(e.yaw)*-2*dt;e.z+=Math.cos(e.yaw)*-2*dt;if(e.jump<=0){SFX.splash();e.y=-.45}}
   else{if(e.t<=0){e.t=2+rnd()*3;e.yaw+=(rnd()-.5)*2;if(rnd()<.12&&d<90){e.jump=1.1}}const nx=e.x-Math.sin(e.yaw)*1.2*dt,nz=e.z-Math.cos(e.yaw)*1.2*dt;if(H(nx,nz)<-1){e.x=nx;e.z=nz}else e.yaw+=Math.PI;m.rotation.x=0;e.y=-.45}
   m.position.set(e.x,e.y,e.z);m.rotation.y=e.yaw;if(S.mode==='fly'&&S.y<1.6&&(S.sp==='eagle'||e.jump>0))tryFish();break}
  case 'songbird':{const scared=d<12&&S.mode==='fly'&&!(S.sp==='falcon'&&S.speed>20);if(scared){e.cy+=dt*6;e.rad+=dt*4}else{e.cy=lerp(e.cy,H(e.cx,e.cz)+14,dt*.1);e.rad=lerp(e.rad,10,dt*.1)}
   e.ang+=dt*(scared?1.6:.7)*(e.rad>0?9/e.rad:1);const px=e.x,pz=e.z;e.x=e.cx+Math.cos(e.ang)*e.rad;e.z=e.cz+Math.sin(e.ang)*e.rad;e.y=e.cy+Math.sin(e.ang*3+e.ph)*1.5;
   m.position.set(e.x,e.y,e.z);m.rotation.y=Math.atan2(-(e.x-px),-(e.z-pz));const w=Math.sin(S.played*30+e.ph)*.8;m.userData.w[0].rotation.z=-w;m.userData.w[1].rotation.z=w;
   if(S.mode==='fly'&&diet('songbird')){const r=(S.sp==='falcon'?2.2:1.1)*SPECIES[S.sp].size;if(hyp(dx,dz,S.y-e.y)<r){catchPrey(e);return}}break}
  case 'carrion':m.position.set(e.x,H(e.x,e.z),e.z);m.rotation.y=e.yaw;m.scale.setScalar(.6+e.bites*.15);break}
 }
 // markers
 let mi=0;const show=(S.sp==='hawk'&&S.abT>0)||(S.sp==='owl'&&S.nv)||(S.sp==='crow'&&S.abT>0);
 if(show){for(const e of ents){if(mi>=marks.length)break;const crowMode=S.sp==='crow';if(crowMode)continue;if(!(e.type==='mouse'||e.type==='rabbit'||e.type==='songbird'||e.type==='fish'))continue;if(!e.mesh.visible)continue;const d=hyp(e.x-S.x,e.z-S.z);if(d>140)continue;marks[mi].position.set(e.x,e.y+1.2,e.z);marks[mi].visible=true;mi++}
  if(S.sp==='crow')for(const it of items){if(mi>=marks.length)break;if(it.type==='shiny'&&it.alive&&hyp(it.x-S.x,it.z-S.z)<160){marks[mi].position.set(it.x,it.y+1.4,it.z);marks[mi].visible=true;mi++}}}
 for(;mi<marks.length;mi++)marks[mi].visible=false}
window.__G={get S(){return S},set S(v){S=v},ents,items,newState,save,load,setBird,buildNestMesh,gameTick,startLanding,findPerch,catchPrey,doAct,UPG,costOf,nestCost,maxHp,maxSt,OBJ,isNight,skyAt,sunInfo,strike,respawn,die,
 hurt,toast,prompt,refreshItems,populate,takeOff,atNest,nestPerch,get bird(){return bird},held,cam,rain,buildRain,marks,get ctx(){return ctx},set itemsDirty(v){itemsDirty=v},get itemsDirty(){return itemsDirty},get berriesDirty(){return berriesDirty},set berriesDirty(v){berriesDirty=v},stormFlashRef:()=>stormFlash,setStormFlash:v=>stormFlash=v,arriveNest};
})();
