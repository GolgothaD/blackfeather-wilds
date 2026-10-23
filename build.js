// Blackfeather Wilds v5 — materials, inventory, multi-structure building, item finding
(function(){
'use strict';
const B=window.__BFW,G=window.__G,{scene,SFX}=B;const {SPECIES}=BIRDS;const H=W.H;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const TAU=Math.PI*2,hyp=Math.hypot,clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ST=()=>G.S;const toast=(m,l)=>window.toast&&window.toast(m,l);const sfx=k=>{try{SFX[k]&&SFX[k]()}catch(e){}};
// ---------- materials
const MAT={
 stick:{i:'🪵',n:'Sticks',amt:3,c:0x8a6a48,g:'twig',d:'Straight twigs. The frame of every nest and platform. Found under trees.'},
 bark:{i:'🟫',n:'Bark strips',amt:2,c:0x6b4a32,g:'flat',d:'Tough strips peeled from broadleaf trunks. Used for walls and decks.'},
 leaf:{i:'🍃',n:'Leaves',amt:3,c:0x5f9a3a,g:'flat',d:'Broad green leaves. Shingle roofs and larders with them.'},
 pine:{i:'🌲',n:'Pine needles',amt:3,c:0x3f6a3a,g:'flat',d:'Springy needles from under pines. Waterproof roof layer.'},
 moss:{i:'🌿',n:'Moss',amt:2,c:0x8fbf6a,g:'lump',d:'Soft moss from rocks and logs. Warm nest lining.'},
 grass:{i:'🌾',n:'Dry grass',amt:3,c:0xcdb46a,g:'flat',d:'Dry grass tufts from meadows and the farm. Woven into walls.'},
 reed:{i:'🎋',n:'Reeds',amt:2,c:0xa8b060,g:'twig',d:'Long reeds from the marsh and lake shore. Windbreaks and roofs.'},
 mud:{i:'🟤',n:'Mud',amt:2,c:0x5a4030,g:'lump',d:'Sticky mud from the marsh and shores. Seals walls, bowls and shelters.'},
 pebble:{i:'🪨',n:'Pebbles',amt:2,c:0x9a9a94,g:'lump',d:'Smooth stones near rocks and ruins. Bowls and hoard displays.'},
 feather:{i:'🪶',n:'Feathers',amt:1,c:0xece6d6,g:'flat',d:'Lost feathers. Lining and banners. Carcasses sometimes drop them.'},
 wool:{i:'🧶',n:'Sheep wool',amt:2,c:0xf2efe6,g:'lump',d:'Snagged wool from the farm fences. The warmest lining.'},
 twine:{i:'🧵',n:'Twine',amt:1,c:0xc89a5a,g:'twig',d:'Baling twine from the farm. Ties platforms, lookouts and traps.'},
 bone:{i:'🦴',n:'Bones',amt:1,c:0xe8e0c8,g:'twig',d:'Clean small bones from open ground and carcasses. Trap triggers.'},
 shell:{i:'🐚',n:'Snail shells',amt:1,c:0xd8b890,g:'lump',d:'Empty shells along the water. Pretty, light, good for the hoard.'},
 shiny:{i:'💎',n:'Shinies',amt:1,c:0xffd860,g:'shiny',d:'Glittering trinkets near the ruins. Crows prize them: hoards and lookouts.'}};
const KEYS=Object.keys(MAT);
const CAP={crow:24,eagle:18,hawk:14,owl:14,falcon:10};
function emptyInv(){const o={};for(const k of KEYS)o[k]=0;return o}
// ---------- structures
const HOME_ST=[
 {n:'Frame',cost:{stick:8},b:'Save point, rest spot and material stash.'},
 {n:'Walls',cost:{stick:8,bark:4,grass:4},b:'Woven walls: storm damage halved at home.'},
 {n:'Roof',cost:{leaf:6,pine:4,reed:3},b:'Shingled roof: full storm shelter and warm nights.'},
 {n:'Lining',cost:{moss:4,feather:3,wool:2},b:'+25 max health; sleeping heals fully.'}];
const T={
 home:{i:'🏠',n:'Home nest',tab:'Nests',tree:1,max:1,st:HOME_ST,d:'Your main nest. Saves, stash, larder link.'},
 outpost:{i:'🪺',n:'Outpost nest',tab:'Nests',tree:1,max:3,st:[
  {n:'Frame',cost:{stick:10},b:'Land here, rest, save and reach your stash.'},
  {n:'Walls',cost:{stick:6,grass:4,mud:2},b:'Storm damage halved while perched here.'},
  {n:'Roof',cost:{leaf:6,bark:3},b:'Full storm shelter here.'},
  {n:'Lining',cost:{moss:3,feather:2},b:'Resting here also restores health.'}],d:'An extra nest in any big tree.'},
 platform:{i:'🪵',n:'Tree platform',tab:'Nests',tree:1,max:4,st:[
  {n:'Frame',cost:{stick:8,bark:3},b:'A landing deck: quick take-off perch anywhere.'},
  {n:'Deck',cost:{bark:4,twine:2},b:'Railed deck: stamina refills 2× faster while perched.'}],d:'A flat perch in any tree.'},
 bowl:{i:'💧',n:'Water bowl',tab:'Utility',max:2,st:[{n:'Bowl',cost:{pebble:4,mud:3},b:'Collects water (faster in rain). Drink +40 water near home.'}]},
 larder:{i:'🍖',n:'Food cache',tab:'Utility',max:1,home:1,st:[{n:'Cache',cost:{stick:6,bark:4,leaf:2},b:'Store up to 8 meals; hunger drains 15% slower.'}]},
 lookout:{i:'🗼',n:'Lookout post',tab:'Utility',max:1,st:[{n:'Post',cost:{stick:12,twine:2,shiny:1},b:'+20% max stamina. Perch on top to auto-scan 160 m.'}]},
 windbreak:{i:'🎋',n:'Windbreak',tab:'Utility',max:3,st:[{n:'Screen',cost:{stick:6,reed:6},b:'Storm damage halved within 12 m.'}]},
 shelter:{i:'⛺',n:'Storm shelter',tab:'Utility',max:2,st:[
  {n:'Frame',cost:{stick:6,mud:4},b:'A ground hut frame.'},
  {n:'Dome',cost:{leaf:6,grass:4},b:'Full storm shelter when standing inside (4 m).'},
  {n:'Bedding',cost:{moss:4,wool:2},b:'Heals 1 HP/s inside; +10 max health.'}]},
 trap:{i:'🪤',n:'Bait trap',tab:'Utility',max:2,st:[{n:'Trap',cost:{stick:4,twine:3,bone:1},b:'Catches a mouse every ~90 s. Collect it to eat or store.'}]},
 hoard:{i:'💎',n:'Shiny hoard',tab:'Decor',max:1,st:[{n:'Display',cost:{pebble:3,shiny:5},b:'+8% flight speed. Glitters for all to see.'}]},
 banner:{i:'🚩',n:'Feather banner',tab:'Decor',max:3,st:[{n:'Banner',cost:{feather:6,twine:2,stick:2},b:'+3 carry capacity each. Shows your colours.'}]}};
const TABS=['Here','Nests','Utility','Decor'];
function costFor(c){const S=ST();const o={};for(const k in c)o[k]=S.sp==='crow'?Math.max(1,Math.ceil(c[k]*.75)):c[k];return o}
// ---------- helpers on state
function builds(){const S=ST();return S.builds||(S.builds=[])}
function count(t){return builds().filter(b=>b.type===t).length}
function has(t,st){return builds().some(b=>b.type===t&&b.stage>=(st||1))}
function cap(){const S=ST();return (CAP[S.sp]||14)+3*builds().filter(b=>b.type==='banner').length}
function used(){const S=ST();let n=0;for(const k of KEYS)n+=S.inv[k]||0;return n}
function stash(){const S=ST();if(!S.stash)S.stash=emptyInv();if(S.nest)S.nest.store=S.stash;return S.stash}
function anchors(){const S=ST();const a=[];if(S.nest)a.push({x:S.nest.x,y:S.nest.y,z:S.nest.z});for(const b of builds())if(b.type==='outpost')a.push(b);return a}
function nearStash(r){const S=ST();for(const a of anchors())if(hyp(a.x-S.x,a.z-S.z)<(r||60))return true;return false}
function have(k){const S=ST();return (S.inv[k]||0)+(nearStash()?stash()[k]||0:0)}
function canPay(c){for(const k in c)if(have(k)<c[k])return false;return true}
function pay(c){const S=ST(),st=stash();for(const k in c){let n=c[k];const a=Math.min(n,S.inv[k]||0);S.inv[k]-=a;n-=a;if(n>0)st[k]-=n}}
let fullT=0;
function gain(k,n){const S=ST();const room=cap()-used();const t=Math.min(n,room);if(t<=0){if(fullT<=0){toast('🎒 Bag full ('+cap()+'). Fly to a nest to store, or drop items (View / I).');fullT=6}return 0}
 S.inv[k]=(S.inv[k]||0)+t;return t}
function sync(){const S=ST();if(!S)return;stash();if(!S.builds)S.builds=[];if(S.nest){const n=S.nest;n.stage=n.stage||1;n.up=n.up||{};const u=n.up;u.walls=n.stage>=3;u.lining=n.stage>=4;u.larder=has('larder');u.lookout=has('lookout');u.hoard=has('hoard');n.larder=n.larder||[]}}
// ---------- save migration
function migrate(o){const inv=emptyInv();for(const k in (o.inv||{}))if(k in inv)inv[k]=o.inv[k];o.inv=inv;o.builds=o.builds||[];
 if(o.nest){const n=o.nest,u=n.up||{};o.stash=Object.assign(emptyInv(),n.store||{});n.stage=u.walls?(u.lining?4:3):(u.lining?2:1);if(u.lining&&!u.walls)o.stash.moss+=4;
  let i=0;for(const t of ['larder','lookout','hoard'])if(u[t]){const a=i++*2.1+.6,x=n.x+Math.cos(a)*5,z=n.z+Math.sin(a)*5;o.builds.push({type:t,x,z,y:Math.max(H(x,z),0),stage:1,id:Date.now()%1e6+i})}}}
function fix(o){o.inv=Object.assign(emptyInv(),o.inv||{});o.builds=o.builds||[];o.stash=Object.assign(emptyInv(),o.stash||(o.nest&&o.nest.store)||{});if(o.nest){o.nest.stage=o.nest.stage||1;o.nest.store=o.stash}
 for(const b of o.builds){if(b.type==='bowl'&&b.water==null)b.water=.5;if(b.type==='trap'&&b.t==null)b.t=60}}
// ---------- materials & meshes
const MM={};function mat(k){if(MM[k])return MM[k];let m;
 if(k==='bark')m=new THREE.MeshStandardMaterial({map:W.T.bark,color:0x7a6a55,roughness:1});
 else if(k==='moss')m=new THREE.MeshStandardMaterial({map:W.T.moss,color:0xa0c080,roughness:1});
 else if(k==='leaf')m=new THREE.MeshStandardMaterial({color:0x4f8a34,roughness:.85,side:THREE.DoubleSide});
 else if(k==='straw')m=new THREE.MeshStandardMaterial({color:0xc8ae66,roughness:1});
 else if(k==='mud')m=new THREE.MeshStandardMaterial({color:0x5e4634,roughness:1});
 else if(k==='stone')m=new THREE.MeshStandardMaterial({color:0x8c8c86,roughness:.9});
 else if(k==='water')m=new THREE.MeshStandardMaterial({color:0x3a7ab0,roughness:.1,metalness:.2,transparent:true,opacity:.85});
 else if(k==='gold')m=new THREE.MeshStandardMaterial({color:0xffd060,emissive:0x664400,metalness:1,roughness:.25});
 else if(k==='wool')m=new THREE.MeshStandardMaterial({color:0xf0ece0,roughness:1});
 else if(k==='cloth')m=new THREE.MeshStandardMaterial({color:0xb03a2e,roughness:.9,side:THREE.DoubleSide});
 else if(k==='white')m=new THREE.MeshStandardMaterial({color:0xece6d6,roughness:.9,side:THREE.DoubleSide});
 else if(k==='bait')m=new THREE.MeshStandardMaterial({color:0xc03050,emissive:0x300010,roughness:.6});
 return MM[k]=m}
function twigRing(tw,r,R,y0,hgt,cnt,len){for(let i=0;i<cnt;i++){const a=i/cnt*TAU+r()*.3;const g=new THREE.CylinderGeometry(.02,.03,(len||.8)+r()*.5,4);g.rotateZ(Math.PI/2).rotateY(-a+Math.PI/2+(r()-.5)*.8).rotateX((r()-.5)*.5);
 const rr=R*(1+(r()-.5)*.2);g.translate(Math.cos(a)*rr,y0+r()*hgt,Math.sin(a)*rr);tw.push(g)}}
function stick(tw,x0,y0,z0,x1,y1,z1,rad){const a=new THREE.Vector3(x0,y0,z0),b=new THREE.Vector3(x1,y1,z1);const L=a.distanceTo(b);const g=new THREE.CylinderGeometry(rad||.03,(rad||.03)*1.2,L,5);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());g.applyQuaternion(q);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);tw.push(g)}
function add(o,geos,m){if(!geos.length)return;const me=new THREE.Mesh(geos.length>1?W.mergeGeos(geos):geos[0],mat(m));me.castShadow=me.receiveShadow=true;o.add(me);return me}
function sz(){const S=ST();return Math.max(.9,(SPECIES[S.sp].size||1))*1.1}
function nestMesh(stage){const o=new THREE.Group(),r=W.rng(5+stage),s=sz();const tw=[];
 twigRing(tw,r,.55*s,0,.22*s,70);twigRing(tw,r,.4*s,-.05,.1,30);
 if(stage>=2)twigRing(tw,r,.62*s,.2*s,.6*s,90);
 add(o,tw,'bark');
 if(stage>=2){const g=new THREE.CylinderGeometry(.6*s,.55*s,.5*s,20,1,true);g.translate(0,.4*s,0);add(o,[g],'straw').material.side=THREE.DoubleSide}
 if(stage>=3){const rf=[];for(let i=0;i<14;i++){const a=i/14*TAU;const g=new THREE.PlaneGeometry(.55*s,.75*s);g.translate(0,.37*s,0);g.rotateX(-1.0);g.rotateY(-a+Math.PI/2);g.translate(Math.cos(a)*.66*s,.62*s,Math.sin(a)*.66*s);if(i%7===0)continue;rf.push(g)}add(o,rf,'leaf')}
 if(stage>=4){const l=new THREE.Mesh(new THREE.SphereGeometry(.42*s,28,14,0,TAU,Math.PI*.55,Math.PI*.45),mat('moss'));l.position.y=.32*s;o.add(l);
  const f=[];for(let i=0;i<6;i++){const g=new THREE.PlaneGeometry(.06,.3);g.rotateZ(.6).rotateY(i);g.translate(Math.cos(i)*.3*s,.12,Math.sin(i)*.3*s);f.push(g)}add(o,f,'white')}
 return o}
function buildMesh(b,stage){const t=b.type,o=new THREE.Group();const r=W.rng(17+(b.id||1)%97);stage=stage==null?b.stage:stage;const tw=[];
 if(t==='home'||t==='outpost')return nestMesh(stage);
 if(t==='platform'){for(let i=0;i<14;i++){const z=(i-6.5)*.12;stick(tw,-.8,0,z,.8,0,z+(r()-.5)*.05,.035)}stick(tw,-.7,-.06,-.85,-.7,-.06,.85,.04);stick(tw,.7,-.06,-.85,.7,-.06,.85,.04);add(o,tw,'bark');
  if(stage>=2){const rl=[];for(const [x,z] of [[-.75,-.8],[.75,-.8],[-.75,.8],[.75,.8]])stick(rl,x,0,z,x,.45,z,.03);stick(rl,-.75,.45,-.8,.75,.45,-.8,.025);stick(rl,-.75,.45,.8,.75,.45,.8,.025);stick(rl,-.75,.45,-.8,-.75,.45,.8,.025);add(o,rl,'bark');
   const d=new THREE.BoxGeometry(1.6,.04,1.6);d.translate(0,.05,0);add(o,[d],'straw')}return o}
 if(t==='bowl'){const st=[];for(let i=0;i<10;i++){const a=i/10*TAU;const g=W.smoothN(new THREE.IcosahedronGeometry(.16,1));g.scale(1,.7,1);g.translate(Math.cos(a)*.42,.08,Math.sin(a)*.42);st.push(g)}add(o,st,'stone');
  const m=new THREE.CylinderGeometry(.42,.32,.12,20);m.translate(0,.05,0);add(o,[m],'mud');const w=new THREE.Mesh(new THREE.CircleGeometry(.36,24).rotateX(-Math.PI/2),mat('water'));w.position.y=.13;w.name='water';o.add(w);return o}
 if(t==='larder'){for(let y=0;y<4;y++)for(let i=0;i<5;i++){const z=(i-2)*.14;stick(tw,-.45,.08+y*.12,z+(y%2)*.05,.45,.08+y*.12,z,.04)}add(o,tw,'bark');
  const rf=[];for(const s of [-1,1]){const g=new THREE.PlaneGeometry(1.1,.6);g.rotateX(-Math.PI/2+s*.7);g.translate(0,.68,s*.2);rf.push(g)}add(o,rf,'leaf');return o}
 if(t==='lookout'){for(let i=0;i<3;i++){const a=i/3*TAU;stick(tw,Math.cos(a)*.7,0,Math.sin(a)*.7,Math.cos(a)*.15,5,Math.sin(a)*.15,.06)}for(let h=1;h<5;h+=1.3)twigRing(tw,r,.6-h*.1,h,.1,10,.6);
  twigRing(tw,r,.45,5,.12,30);add(o,tw,'bark');const d=new THREE.CylinderGeometry(.5,.45,.08,16);d.translate(0,5.05,0);add(o,[d],'straw');
  const sh=new THREE.Mesh(new THREE.OctahedronGeometry(.12),mat('gold'));sh.position.set(0,5.25,0);sh.name='spin';o.add(sh);return o}
 if(t==='windbreak'){for(let i=0;i<34;i++){const a=-.9+i/33*1.8;const x=Math.sin(a)*2.2,z=Math.cos(a)*-.6+.6;stick(tw,x,0,z,x+(r()-.5)*.2,1.1+r()*.5,z+(r()-.5)*.2,.025)}stick(tw,-2,.6,0,2,.6,0,.03);add(o,tw,'straw');return o}
 if(t==='shelter'){for(let i=0;i<8;i++){const a=i/8*TAU;stick(tw,Math.cos(a)*1.3,0,Math.sin(a)*1.3,Math.cos(a)*.1,1.5,Math.sin(a)*.1,.04)}add(o,tw,'bark');
  if(stage>=2){const g=new THREE.SphereGeometry(1.32,24,10,.6,TAU-1.2,0,Math.PI/2);g.scale(1,1.12,1);add(o,[g],'leaf').material.side=THREE.DoubleSide}
  if(stage>=3){const g=new THREE.CylinderGeometry(.8,.85,.12,20);g.translate(0,.06,0);add(o,[g],'moss');const w=W.smoothN(new THREE.IcosahedronGeometry(.25,2));w.translate(.3,.18,.2);add(o,[w],'wool')}return o}
 if(t==='trap'){for(let i=0;i<8;i++){const a=i/8*TAU;stick(tw,Math.cos(a)*.35,0,Math.sin(a)*.35,Math.cos(a)*.3,.45,Math.sin(a)*.3,.02)}twigRing(tw,r,.32,.45,.04,14,.5);stick(tw,0,.48,0,0,.85,-.2,.025);add(o,tw,'bark');
  const bt=new THREE.Mesh(W.smoothN(new THREE.IcosahedronGeometry(.08,1)),mat('bait'));bt.position.y=.08;bt.name='bait';o.add(bt);return o}
 if(t==='hoard'){const st=[];for(let i=0;i<12;i++){const a=i/12*TAU;const g=W.smoothN(new THREE.IcosahedronGeometry(.13,1));g.translate(Math.cos(a)*.6,.06,Math.sin(a)*.6);st.push(g)}add(o,st,'stone');
  for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.09+r()*.05),mat('gold'));m.position.set((r()-.5)*.7,.1+r()*.12,(r()-.5)*.7);m.rotation.set(r()*3,r()*3,0);m.name='spin';o.add(m)}return o}
 if(t==='banner'){stick(tw,0,0,0,0,2.6,0,.04);stick(tw,0,2.5,0,.9,2.5,0,.025);add(o,tw,'bark');const g=new THREE.PlaneGeometry(.85,1.2,6,4);g.translate(.45,1.88,0);const c=new THREE.Mesh(g,mat('cloth'));c.name='flag';c.castShadow=true;o.add(c);
  const f=[];for(let i=0;i<5;i++){const p=new THREE.PlaneGeometry(.08,.4);p.rotateZ(.2-.1*i);p.translate(.1+i*.18,1.15,.01);f.push(p)}add(o,f,'white');return o}
 return o}
// ---------- world material items
const items=[],grid=new Map(),CELL=24;const gk=(x,z)=>Math.floor(x/CELL)+','+Math.floor(z/CELL);
function gridAdd(it){const k=gk(it.x,it.z);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(it)}
function near(x,z,r){const out=[];const c0=Math.floor((x-r)/CELL),c1=Math.floor((x+r)/CELL),d0=Math.floor((z-r)/CELL),d1=Math.floor((z+r)/CELL);for(let i=c0;i<=c1;i++)for(let j=d0;j<=d1;j++){const a=grid.get(i+','+j);if(a)for(const it of a)if(it.alive&&hyp(it.x-x,it.z-z)<r)out.push(it)}return out}
const GEO={twig:new THREE.CylinderGeometry(.025,.035,.75,6).rotateZ(Math.PI/2),flat:W.smoothN(new THREE.IcosahedronGeometry(.2,1)).scale(1.3,.25,.9),lump:W.smoothN(new THREE.IcosahedronGeometry(.17,2)).scale(1,.65,1),shiny:new THREE.OctahedronGeometry(.13)};
const IM={};
function spawnAll(){const r=W.rng(909);const trees=W.trees.filter(t=>t.on!==false);const put=(k,x,z,lo)=>{const h=H(x,z);if(h<(lo==null?.4:lo))return false;items.push({k,x,z,y:h+.06,rot:r()*6,alive:true,t:0});return true};
 const nearTree=(k,n,f)=>{let tries=0;for(let i=0;i<n&&tries<n*30;tries++){const t=trees[Math.floor(r()*trees.length)];if(f&&!f(t))continue;const a=r()*TAU,d=1.2+r()*5;if(put(k,t.x+Math.cos(a)*d,t.z+Math.sin(a)*d))i++}};
 nearTree('stick',260);nearTree('bark',130,t=>t.type!==0);nearTree('leaf',160,t=>t.type===1);nearTree('pine',130,t=>t.type===0);nearTree('feather',45);
 const rocks=W.perches.filter(p=>p.kind==='rock');for(let i=0;i<110;i++){const p=i<80&&rocks.length?rocks[Math.floor(r()*rocks.length)]:null;if(!p){const l=W.logs[Math.floor(r()*W.logs.length)];if(l)put('moss',l.x+(r()-.5)*4,l.z+(r()-.5)*4);continue}const a=r()*TAU;put(i%2?'moss':'pebble',p.x+Math.cos(a)*2.4,p.z+Math.sin(a)*2.4)}
 const area=(c,R,k,n,lo)=>{let tries=0;for(let i=0;i<n&&tries<n*30;tries++){const a=r()*TAU,d=Math.sqrt(r())*R;if(put(k,c.x+Math.cos(a)*d,c.z+Math.sin(a)*d,lo))i++}};
 if(W.FARM){area(W.FARM,75,'wool',45);area(W.FARM,75,'twine',35);area(W.FARM,85,'grass',60);area(W.FARM,70,'feather',20)}
 const shore=(c,k,n)=>{let tries=0;for(let i=0;i<n&&tries<n*40;tries++){const a=r()*TAU,d=c.r+(r()-.3)*14;if(put(k,c.x+Math.cos(a)*d,c.z+Math.sin(a)*d,.05))i++}};
 for(const c of [W.LAKE,W.POND])if(c){shore(c,'reed',c===W.LAKE?45:20);shore(c,'mud',c===W.LAKE?35:15);shore(c,'shell',c===W.LAKE?28:12)}
 const marsh=(window.BIOMES&&BIOMES.zones||[]).filter(z=>/marsh/i.test(z.name));for(const z of marsh){area(z,z.r,'reed',30,.05);area(z,z.r,'mud',25,.05);area(z,z.r,'shell',8,.05)}
 if(W.RUINS){area(W.RUINS,40,'pebble',40);area(W.RUINS,35,'shiny',16);area(W.RUINS,40,'bone',10)}
 const HF=(W.HALF||650)*.9;for(let i=0;i<120;i++)put('grass',(r()-.5)*2*HF,(r()-.5)*2*HF);for(let i=0;i<40;i++)put('bone',(r()-.5)*2*HF,(r()-.5)*2*HF);for(let i=0;i<14;i++)put('shiny',(r()-.5)*2*HF,(r()-.5)*2*HF);
 for(const it of items)gridAdd(it);
 for(const k of KEYS){const n=items.filter(i=>i.k===k).length+30;const m=k==='shiny'?mat('gold'):new THREE.MeshStandardMaterial({color:MAT[k].c,roughness:.85,side:MAT[k].g==='flat'?THREE.DoubleSide:THREE.FrontSide});
  const im=new THREE.InstancedMesh(GEO[MAT[k].g],m,n);im.castShadow=MAT[k].g==='twig';im.count=0;im.frustumCulled=false;IM[k]={im,max:n};scene.add(im)}}
let dirty=true;const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1);
function refresh(){const c={};for(const k of KEYS)c[k]=0;for(const it of items){if(!it.alive)continue;const o=IM[it.k];if(c[it.k]>=o.max)continue;_e.set(0,it.rot,0);_q.setFromEuler(_e);_v.set(it.x,it.y+(it.k==='shiny'?.1:0),it.z);_m.compose(_v,_q,_s);o.im.setMatrixAt(c[it.k]++,_m)}
 for(const k of KEYS){IM[k].im.count=c[k];IM[k].im.instanceMatrix.needsUpdate=true}dirty=false}
function dropItem(k){const S=ST();const a=Math.random()*TAU;const x=S.x+Math.cos(a)*1.2,z=S.z+Math.sin(a)*1.2;const h=Math.max(H(x,z),.05);const it={k,x,z,y:h+.06,rot:a,alive:true,t:0,drop:1,nopick:2.5};items.push(it);gridAdd(it);dirty=true;
 const old=items.filter(i=>i.drop);if(old.length>25){const o=old[0];o.alive=false;o.gone=1;items.splice(items.indexOf(o),1)}}
// ---------- item finding: sparkles, pickup ring, scan
function cvTex(draw,w,h){const c=document.createElement('canvas');c.width=w||64;c.height=h||64;draw(c.getContext('2d'),c.width,c.height);const t=new THREE.CanvasTexture(c);return t}
const glintT=cvTex((x,w)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,240,180,.75)');g.addColorStop(1,'rgba(255,210,120,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
 x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=2.5;x.beginPath();x.moveTo(32,0);x.lineTo(32,64);x.moveTo(0,32);x.lineTo(64,32);x.stroke()});
const sparks=[];for(let i=0;i<48;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glintT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffffff}));s.visible=false;s.renderOrder=5;scene.add(s);sparks.push(s)}
const ring=new THREE.Mesh(new THREE.RingGeometry(.92,1,56).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.5,depthWrite:false}));ring.renderOrder=4;ring.visible=false;scene.add(ring);
const wave=new THREE.Mesh(new THREE.RingGeometry(.94,1,96).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x9fe8ff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));wave.visible=false;scene.add(wave);
const LT={};function labelTex(k){if(LT[k])return LT[k];return LT[k]=cvTex((x,w,h)=>{x.fillStyle='rgba(20,16,10,.65)';x.beginPath();x.arc(48,48,44,0,TAU);x.fill();x.strokeStyle='#9fe8ff';x.lineWidth=5;x.stroke();x.font='52px "Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(MAT[k].i,48,52)},96,96)}
const labels=[];for(let i=0;i<24;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex('stick'),transparent:true,depthTest:false}));s.scale.setScalar(1.6);s.visible=false;s.renderOrder=6;scene.add(s);labels.push(s)}
let scanT=0,scanCD=0,sparkT=0,shown=[];
function pickR(){const S=ST();const s=SPECIES[S.sp].size||1;return (S.mode==='ground'?1.6:2.4)+.3*s}
function scan(r,quiet){const S=ST();if(!quiet&&scanCD>0){toast('📡 Scan recharging ('+Math.ceil(scanCD)+' s)');return}
 r=r||80;scanT=10;if(!quiet)scanCD=15;wave.visible=true;wave.userData.t=0;wave.userData.r=r;sfx('nav');
 const L=near(S.x,S.z,r).sort((a,b)=>hyp(a.x-S.x,a.z-S.z)-hyp(b.x-S.x,b.z-S.z));shown=L.slice(0,labels.length);
 labels.forEach((l,i)=>{const it=shown[i];l.visible=!!it;if(it){l.material.map=labelTex(it.k);l.material.needsUpdate=true;l.position.set(it.x,it.y+2.2,it.z)}});
 const c={};for(const it of L)c[it.k]=(c[it.k]||0)+1;const s=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,n])=>MAT[k].i+'×'+n).join('  ');
 if(!quiet)toast(L.length?'📡 Within '+r+' m: '+s:'📡 Nothing to collect within '+r+' m. Try trees, the farm or the marsh.',true)}
function autoPickup(dt){const S=ST();if(S.mode==='dead'||S.mode==='perch'||S.mode==='landing')return;const low=S.mode==='ground'||(S.mode==='fly'&&S.y-Math.max(H(S.x,S.z),0)<3.2);if(!low)return;const R=pickR();
 for(const it of near(S.x,S.z,R+.5)){if(it.nopick>0)continue;if(hyp(it.x-S.x,it.z-S.z,(it.y-S.y)*.5)>R)continue;const m=MAT[it.k];const n=gain(it.k,m.amt);if(!n)break;
  it.alive=false;it.t=150+Math.random()*90;if(it.drop){it.gone=1;items.splice(items.indexOf(it),1)}dirty=true;sfx(it.k==='shiny'?'shiny':'pick');toast('+'+n+' '+m.i+' '+m.n+'  ('+used()+'/'+cap()+')');S.flags=Object.assign(S.flags||{},{gathered:1})}
 // legacy sticks/moss/shinies
 const map={stick:'stick',moss:'moss',shiny:'shiny'};for(const it of G.items){if(!it.alive)continue;if(Math.abs(it.x-S.x)>R||Math.abs(it.z-S.z)>R)continue;if(hyp(it.x-S.x,it.z-S.z,(it.y-S.y)*.5)>R)continue;const k=map[it.type];const n=gain(k,MAT[k].amt);if(!n)break;it.alive=false;it.t=150+Math.random()*90;G.refreshItems();sfx(k==='shiny'?'shiny':'pick');toast('+'+n+' '+MAT[k].i+' '+MAT[k].n+'  ('+used()+'/'+cap()+')')}}
function findTick(dt,T){const S=ST();sparkT-=dt;
 if(sparkT<=0){sparkT=.25;const L=near(S.x,S.z,48);for(const it of G.items)if(it.alive&&Math.abs(it.x-S.x)<48&&Math.abs(it.z-S.z)<48)L.push({x:it.x,y:it.y,z:it.z,k:it.type});L.sort((a,b)=>hyp(a.x-S.x,a.z-S.z)-hyp(b.x-S.x,b.z-S.z));shown2=L.slice(0,sparks.length)}
 sparks.forEach((s,i)=>{const it=shown2[i];s.visible=!!(it&&(it.alive!==false));if(!s.visible)return;const d=hyp(it.x-S.x,it.z-S.z);const ph=Math.sin(T*4+i*1.7);s.position.set(it.x,it.y+.35+.08*ph,it.z);const k=(.55+.35*ph)*(1+d/30)*(scanT>0?1.6:1);s.scale.setScalar(Math.max(.2,k));s.material.opacity=clamp(1.1-d/50,.25,1)});
 const low=S.mode==='ground'||(S.mode==='fly'&&S.y-Math.max(H(S.x,S.z),0)<3.2);ring.visible=low&&S.mode!=='dead';if(ring.visible){const R=pickR();ring.scale.set(R,1,R);ring.position.set(S.x,Math.max(H(S.x,S.z),0)+.05,S.z);ring.material.opacity=.32+.12*Math.sin(T*3)}
 if(wave.visible){const u=wave.userData;u.t+=dt;const k=u.t/1.4;if(k>=1)wave.visible=false;else{const R=Math.max(1,k*u.r);wave.scale.set(R,1,R);wave.position.set(S.x,Math.max(H(S.x,S.z),0)+.6,S.z);wave.material.opacity=.7*(1-k)}}
 if(scanT>0){scanT-=dt;labels.forEach((l,i)=>{const it=shown[i];if(!it||!it.alive){l.visible=false;return}l.visible=true;l.position.y=it.y+2.2+.15*Math.sin(T*3+i)});if(scanT<=0)labels.forEach(l=>l.visible=false)}
 if(scanCD>0)scanCD-=dt}
let shown2=[];
// ---------- structure group & rebuild
const grp=new THREE.Group();scene.add(grp);const meshOf=new Map();
function rebuild(){sync();while(grp.children.length)grp.remove(grp.children[0]);meshOf.clear();const S=ST();if(!S)return;
 if(S.nest){const m=nestMesh(S.nest.stage||1);m.position.set(S.nest.x,S.nest.y-.12,S.nest.z);grp.add(m);meshOf.set('home',m)}
 for(const b of builds()){const m=buildMesh(b);m.position.set(b.x,b.y,b.z);m.rotation.y=b.rot||0;grp.add(m);meshOf.set(b,m)}}
// ---------- placement
let place=null,ghost=null,ghostType='';const gOK=new THREE.MeshBasicMaterial({color:0x60ff70,transparent:true,opacity:.45,depthWrite:false}),gNO=new THREE.MeshBasicMaterial({color:0xff5040,transparent:true,opacity:.45,depthWrite:false});
function treePerchNear(){const S=ST();if(S.mode==='perch'&&S.perch&&(S.perch.kind==='tree'||S.perch.kind==='branch')&&!S.perch.nest&&!S.perch.bp)return S.perch;
 let best=null,bd=9;for(const p of W.nearPerches(S.x,S.z,12)){if(p.kind!=='tree'&&p.kind!=='branch')continue;const d=hyp(p.x-S.x,p.z-S.z,p.y-S.y);if(d<bd){bd=d;best=p}}return best}
function occupied(x,y,z,r){const S=ST();if(S.nest&&hyp(S.nest.x-x,S.nest.z-z,(S.nest.y-y)*.5)<r)return true;for(const b of builds())if(hyp(b.x-x,b.z-z,(b.y-y)*.5)<r)return true;return false}
function startPlace(t){const S=ST();if(!S)return;showPanel(null);place={type:t,ok:false,why:''};toast(T[t].i+' Place '+T[t].n+': move to a spot, '+(document.body.classList.contains('pad')?'X':'ACT / E')+' to build, '+(document.body.classList.contains('pad')?'B':'Q')+' to cancel',true);placeTick()}
function cancelPlace(q){place=null;if(ghost){grp.remove(ghost);ghost=null}if(!q)toast('Placement cancelled')}
function placeTick(){const S=ST(),t=T[place.type];let x,y,z,why='',tree=null,rot=0;
 if(t.tree){const p=treePerchNear();if(!p){why='Land on (or fly next to) a tree branch';x=S.x;y=S.y;z=S.z}else{x=p.x;y=p.y;z=p.z;tree=p.tree;if(occupied(x,y,z,2.5))why='Something is already built on that branch';else if(place.type==='home'&&S.nest)why='You already have a home nest'}}
 else{rot=S.yaw;x=S.x-Math.sin(S.yaw)*2.6;z=S.z-Math.cos(S.yaw)*2.6;y=H(x,z);if(S.mode!=='ground'&&!(S.mode==='fly'&&S.y-Math.max(H(S.x,S.z),0)<6))why='Land on the ground to place this';else if(y<.25)why='Too wet here';else if(Math.abs(H(x+1,z)-H(x-1,z))+Math.abs(H(x,z+1)-H(x,z-1))>1.6)why='Too steep';else if(occupied(x,y,z,2.4))why='Too close to another structure';
  else{const a=t.home?(S.nest?[S.nest]:[]):anchors();if(!a.length)why=t.home?'Needs your home nest first':'Build a nest first (home or outpost)';else if(!a.some(n=>hyp(n.x-x,n.z-z)<45))why='Must be within 45 m of '+(t.home?'your home nest':'a nest')}}
 if(!why&&count(place.type)>=t.max&&place.type!=='home')why='Limit reached ('+t.max+')';
 if(!why&&!canPay(costFor(t.st[0].cost)))why='Missing: '+missing(costFor(t.st[0].cost));
 place.x=x;place.y=y;place.z=z;place.tree=tree;place.rot=rot;place.ok=!why;place.why=why;
 if(!ghost||ghostType!==place.type){if(ghost)grp.remove(ghost);ghost=place.type==='home'?nestMesh(1):buildMesh({type:place.type,stage:1},1);ghostType=place.type;grp.add(ghost)}
 ghost.traverse(o=>{if(o.isMesh){o.material=place.ok?gOK:gNO;o.castShadow=false}});ghost.position.set(x,(t.tree?y-.12:y)+(place.ok?0:.02),z);ghost.rotation.y=rot;
}
function keyAct(){return document.body.classList.contains('pad')?'X':document.body.classList.contains('touch')?'ACT':'E'}
function keyBack(){return document.body.classList.contains('pad')?'B':document.body.classList.contains('touch')?'LAND':'Q'}
function missing(c){return Object.keys(c).filter(k=>have(k)<c[k]).map(k=>MAT[k].i+(c[k]-have(k))).join(' ')}
function confirmPlace(){if(!place||!place.ok){if(place)toast(place.why);return false}const S=ST(),t=T[place.type];pay(costFor(t.st[0].cost));
 if(place.type==='home'){const p={x:place.x,y:place.y,z:place.z,tree:place.tree};S.nest={x:p.x,y:p.y,z:p.z,tree:p.tree,up:{},stage:1,store:stash(),larder:[]};if(S.mode==='perch'){S.perch=G.nestPerch()}}
 else{const b={type:place.type,x:place.x,y:place.type==='outpost'||place.type==='platform'?place.y:place.y,z:place.z,rot:place.rot,tree:place.tree,stage:1,id:(Date.now()%1e7)+builds().length};if(b.type==='bowl')b.water=.3;if(b.type==='trap')b.t=90;builds().push(b);
  if((b.type==='outpost'||b.type==='platform')&&S.mode==='perch'){S.perch=perchOf(b)}}
 const n=t.n;cancelPlace(true);rebuild();sfx('build');B.rumble&&B.rumble(.4,.4,250);toast(t.i+' '+n+' built! '+t.st[0].b,true);G.save();return true}
function perchOf(b){const h={outpost:.15,platform:.3,lookout:5.25}[b.type]||.2;return {x:b.x,y:b.y+h,z:b.z,kind:'tree',tree:b.tree,bp:true,bid:b.id}}
function upgrade(key){const S=ST();let st,list,name;if(key==='home'){if(!S.nest)return;st=S.nest.stage;list=HOME_ST;name='Home nest'}else{const b=builds().find(b=>String(b.id)===String(key));if(!b)return;st=b.stage;list=T[b.type].st;name=T[b.type].n}
 if(st>=list.length){toast(name+' is complete');return}const nx=list[st];const c=costFor(nx.cost);if(!canPay(c)){toast('Need '+missing(c)+(nearStash()?'':' (stash only counts within 60 m of a nest)'));sfx('nav');return}
 pay(c);if(key==='home')S.nest.stage++;else builds().find(b=>String(b.id)===String(key)).stage++;sync();rebuild();sfx('build');B.rumble&&B.rumble(.3,.3,200);toast(name+': '+nx.n+' added. '+nx.b,true);G.save();renderBuild(true)}
// ---------- build panel
let tab='Nests';
function chips(c){return Object.entries(c).map(([k,v])=>`<i class="${have(k)>=v?'ok':''}">${MAT[k].i} ${have(k)}/${v}</i>`).join('')}
function nearby(){const S=ST();const L=[];if(S.nest&&hyp(S.nest.x-S.x,S.nest.z-S.z,S.nest.y-S.y)<14)L.push({key:'home',t:T.home,stage:S.nest.stage,list:HOME_ST});
 for(const b of builds())if(hyp(b.x-S.x,b.z-S.z,b.y-S.y)<14&&b.stage<T[b.type].st.length)L.push({key:b.id,t:T[b.type],stage:b.stage,list:T[b.type].st});return L.filter(o=>o.stage<o.list.length)}
function recUp(o){const nx=o.list[o.stage],c=costFor(nx.cost),ok=canPay(c);return `<button class="btn rec ${ok?'':'no'}" data-up="${o.key}"><b>${o.t.i} ${o.t.n}: add ${nx.n}<span>stage ${o.stage+1}/${o.list.length}</span></b><small>${nx.b}</small><em>${chips(c)}</em></button>`}
function recNew(k){const t=T[k],c=costFor(t.st[0].cost),S=ST();const n=k==='home'?(S.nest?1:0):count(k);const full=n>=t.max;const ok=!full&&canPay(c);
 const where=t.tree?'in a tree':t.home?'near home':'near a nest';return `<button class="btn rec ${ok?'':'no'}" data-r="${k}"><b>${t.i} ${t.n}<span>${n}/${t.max} · ${t.st.length>1?t.st.length+' stages · ':''}${where}</span></b><small>${t.st.map(s=>s.b).filter((v,i)=>i===0||t.st.length>1).join(' → ')}</small><em>${full?'<i>limit reached</i>':chips(c)}</em></button>`}
function renderBuild(keep){const S=ST();if(!S)return;const fi=keep?window.__focusI():0;const here=nearby();
 $('#bldTabs').innerHTML=TABS.map(t=>`<span class="tabb ${t===tab?'on':''}" data-t="${t}">${t}</span>`).join('');$$('#bldTabs .tabb').forEach(e=>e.onclick=()=>{tab=e.dataset.t;renderBuild()});
 $('#bldSrc').textContent='Using bag'+(nearStash()?' + nest stash':' only (stash is reachable within 60 m of a nest)')+' · '+(S.sp==='crow'?'Crow: 25% cheaper':SPECIES[S.sp].name)+' · LB/RB or ◀ ▶ switch tabs';
 let h='';if(tab==='Here')h=here.length?here.map(recUp).join(''):'<p class="empty">Nothing to upgrade within 14 m. Fly to a structure, or pick a new one from the other tabs.</p>';
 else h=Object.keys(T).filter(k=>T[k].tab===tab).map(recNew).join('');
 $('#bldList').innerHTML=h;
 $$('#bldList [data-r]').forEach(b=>b.onclick=()=>{const k=b.dataset.r;const S=ST();if(k==='home'&&S.nest){toast('You already have a home nest. Use Here to add stages.');return}if(count(k)>=T[k].max&&k!=='home'){toast('Limit reached');return}startPlace(k)});
 $$('#bldList [data-up]').forEach(b=>b.onclick=()=>upgrade(b.dataset.up));
 if(keep)window.__setFocusI(Math.min(fi,window.__btns().length-1));else window.__setFocusI(0)}
function openBuild(){if(place)cancelPlace(true);const here=nearby();tab=here.length?'Here':(ST().nest?'Utility':'Nests');window.showPanel('build');renderBuild()}
// ---------- inventory panel
let invSel=null;
function slot(k,n,src){return `<button class="btn it ${src==='stash'?'stash':''} ${invSel&&invSel.k===k&&invSel.src===src?'sel':''}" data-k="${k}" data-src="${src}"><i>${MAT[k].i}</i><b>${n}</b><small>${MAT[k].n}</small></button>`}
function renderInv(keep){const S=ST();if(!S)return;const fi=keep?window.__focusI():0;const atN=nearStash();
 $('#invCap').textContent=`${used()}/${cap()} carried · ${SPECIES[S.sp].name}${S.sp==='crow'?' (carries the most)':''}${builds().some(b=>b.type==='banner')?' · banners +'+3*count('banner'):''}`;
 const bag=KEYS.filter(k=>S.inv[k]>0);$('#invGrid').innerHTML=bag.length?bag.map(k=>slot(k,S.inv[k],'bag')).join(''):'<p class="empty">Your bag is empty. Glinting items on the ground are picked up automatically when you walk or skim over them.</p>';
 const st=stash();const sk=KEYS.filter(k=>st[k]>0);$('#stashWrap').style.display=S.nest||count('outpost')?'':'none';
 $('#stashGrid').innerHTML=!atN?'<p class="empty">Stash: '+(sk.map(k=>`<span class="chip">${MAT[k].i}${st[k]}</span>`).join(' ')||'empty')+' (reach it within 60 m of a nest)</p>':(sk.length?sk.map(k=>slot(k,st[k],'stash')).join(''):'<p class="empty">Stash is empty. Landing at a nest stores your bag here automatically.</p>');
 $('#bTake').style.display=atN&&invSel&&invSel.src==='stash'?'':'none';$('#bStoreAll').style.display=atN&&used()?'':'none';
 const sel=invSel&&(invSel.src==='bag'?S.inv[invSel.k]:st[invSel.k]);$('#bDrop1').style.display=$('#bDiscard').style.display=invSel&&invSel.src==='bag'&&sel?'':'none';
 $('#invDesc').innerHTML=invSel&&sel?`<b>${MAT[invSel.k].i} ${MAT[invSel.k].n}</b> × ${sel} ${invSel.src==='stash'?'(stash)':''}<br>${MAT[invSel.k].d}`:'Select an item to see what it is for.';
 $$('#p-inv .btn.it').forEach(b=>b.onclick=()=>{const k=b.dataset.k,src=b.dataset.src;if(invSel&&invSel.k===k&&invSel.src===src&&src==='stash'){take(k);return}invSel={k,src};renderInv(true)});
 if(keep)window.__setFocusI(Math.max(0,Math.min(fi,window.__btns().length-1)));else window.__setFocusI(0);descFromFocus()}
function descFromFocus(){const L=window.__btns();const b=L[window.__focusI()];if(b&&b.dataset.k){const S=ST();const src=b.dataset.src,k=b.dataset.k,n=src==='bag'?S.inv[k]:stash()[k];$('#invDesc').innerHTML=`<b>${MAT[k].i} ${MAT[k].n}</b> × ${n} ${src==='stash'?'(stash)':''}<br>${MAT[k].d}`;if(!invSel||invSel.k!==k||invSel.src!==src){invSel={k,src};$$('#p-inv .btn.it').forEach(e=>e.classList.toggle('sel',e===b));$('#bDrop1').style.display=$('#bDiscard').style.display=src==='bag'?'':'none';$('#bTake').style.display=src==='stash'?'':'none'}}}
function openInv(){if(place)cancelPlace(true);invSel=null;window.showPanel('inv');renderInv()}
function drop1(){const S=ST();if(!invSel||invSel.src!=='bag'||!S.inv[invSel.k])return;S.inv[invSel.k]--;dropItem(invSel.k);sfx('nav');toast('Dropped 1 '+MAT[invSel.k].i);renderInv(true)}
function discard(){const S=ST();if(!invSel||invSel.src!=='bag'||!S.inv[invSel.k])return;const n=S.inv[invSel.k];S.inv[invSel.k]=0;toast('Discarded '+n+' '+MAT[invSel.k].i);invSel=null;renderInv(true)}
function take(k){const S=ST(),st=stash();if(!nearStash())return;const n=Math.min(st[k],cap()-used());if(n<=0){toast('Bag full');return}st[k]-=n;S.inv[k]+=n;toast('Took '+n+' '+MAT[k].i);sfx('pick');renderInv(true)}
function autoStore(quiet){const S=ST(),st=stash();let d=0;for(const k of KEYS){const n=S.inv[k]||0;if(n){st[k]+=n;d+=n;S.inv[k]=0}}if(d)toast('🪺 Stored '+d+' item'+(d>1?'s':'')+' in the nest stash');return d}
// ---------- menu input
function spatial(L,i,dx,dy){const a=L[i];if(!a)return i;const ra=a.getBoundingClientRect(),ax=ra.left+ra.width/2,ay=ra.top+ra.height/2;let best=-1,bd=1e9;
 L.forEach((b,j)=>{if(j===i)return;const r=b.getBoundingClientRect(),x=r.left+r.width/2-ax,y=r.top+r.height/2-ay;const p=dx?x*dx:y*dy;if(p<=4)return;const o=dx?Math.abs(y):Math.abs(x);const s=p+o*2.2;if(s<bd){bd=s;best=j}});return best<0?i:best}
function panelInput(panel,I,L,fi){if(panel==='build'){
  if(I.buildE){window.showPanel(null);I.buildE=I.invE=I.mapE=I.pauseE=false;return true}if(I.invE){openInv();return true}
  const sw=I.lbE||I.rbE?(I.rbE?1:-1):I.leftN?-1:I.rightN?1:0;if(I.lockE&&!I.lbE)return false;
  if(sw){tab=TABS[(TABS.indexOf(tab)+sw+TABS.length)%TABS.length];sfx('nav');renderBuild();return true}
  if(I.upN||I.downN){const j=spatial(L,fi,0,I.downN?1:-1);window.__setFocusI(j===fi?(I.downN?(fi+1)%L.length:(fi+L.length-1)%L.length):j);sfx('nav');return true}
  return false}
 if(panel==='inv'){if(I.invE){window.showPanel(null);I.buildE=I.invE=I.mapE=I.pauseE=false;return true}if(I.buildE){openBuild();return true}
  if(I.actE){drop1();return true}if(I.abE){discard();return true}
  if(I.upN||I.downN||I.leftN||I.rightN){const j=spatial(L,fi,I.leftN?-1:I.rightN?1:0,I.upN?-1:I.downN?1:0);if(j!==fi){window.__setFocusI(j);sfx('nav');descFromFocus()}return true}
  return false}
 return false}
// ---------- context & actions
function within(t,r,f){const S=ST();let best=null,bd=r;for(const b of builds()){if(b.type!==t||(f&&!f(b)))continue;const d=hyp(b.x-S.x,b.z-S.z,(b.y-S.y)*.6);if(d<bd){bd=d;best=b}}return best}
function atBuild(){const S=ST();return S.mode==='perch'&&S.perch&&S.perch.bid?builds().find(b=>b.id===S.perch.bid):null}
function ctx(cur,onLand,perched,low){const S=ST();if(place)return place.ok?{k:'bplace',l:'Build '+T[place.type].n+' &nbsp;('+keyBack()+' cancel)'}:{k:'no',l:T[place.type].i+' '+place.why+' ('+keyBack()+' cancel)'};
 if(cur&&!['nobuild','full'].includes(cur.k)){if(cur.k==='eat'&&S.nest&&S.nest.up.larder){const l=within('larder',3.5);if(l&&S.nest.larder.length<larderCap())return {k:'store',l:'Store '+S.hold.name+' in the food cache'}}return null}
 const ob=atBuild();if(ob&&ob.type==='outpost')return {k:'bout',o:ob,l:'Outpost: rest & save'+(G.isNight&&G.isNight()?' (sleep)':'')};
 if(onLand||low){const bw=within('bowl',2.8);if(bw&&bw.water>.15&&S.thirst<97)return {k:'bdrink',o:bw,l:'Drink from bowl ('+Math.round(bw.water*100)+'%)'};
  const tp=within('trap',2.8,b=>b.t<=0);if(tp&&!S.hold)return {k:'btrap',o:tp,l:'Take mouse from trap'};
  const ld=within('larder',3);if(ld&&S.nest&&S.nest.larder.length&&!S.hold&&S.hunger<90)return {k:'beat',l:'Eat from food cache ('+S.nest.larder.length+')'}}
 return null}
function act(c){const S=ST();switch(c.k){
 case 'bdrink':{const v=Math.round(40*Math.min(1,c.o.water/.5));S.thirst=clamp(S.thirst+v,0,100);c.o.water=Math.max(0,c.o.water-.5);sfx('drink');S.flags=Object.assign(S.flags||{},{drank:1});toast('+'+v+' water');break}
 case 'btrap':{c.o.t=80+Math.random()*25;S.hold={type:'mouse',food:30,name:'mouse'};toast('Took a mouse from the trap. ACT to eat'+(S.nest&&S.nest.up.larder?', or store it':'')+'.');sfx('pick');rebuildBait(c.o);break}
 case 'beat':{const f=S.nest.larder.shift();if(!f)break;const v=f.food*(SPECIES[S.sp].diet[f.type==='squirrel'?'mouse':f.type]||.5);S.hunger=clamp(S.hunger+v,0,100);sfx('eat');toast('+'+Math.round(v)+' food');break}
 case 'bout':{const b=c.o;S.stam=G.maxSt();if(b.stage>=4){S.hp=G.maxHp()}else S.hp=Math.min(G.maxHp(),S.hp+15);autoStore();G.save();sfx('build');toast('Rested at the outpost'+(b.stage>=4?' (fully healed)':'')+'. Game saved.');break}}}
function rebuildBait(b){const m=meshOf.get(b);if(m){const bt=m.getObjectByName('bait');if(bt)bt.visible=b.t<=0}}
function findPerch(range){const S=ST();let best=null,bd=1e9;for(const b of builds()){if(!(b.type==='outpost'||b.type==='platform'||b.type==='lookout'))continue;const p=perchOf(b);const d=hyp(p.x-S.x,p.z-S.z,p.y-S.y);if(d<range&&d<bd){bd=d;best=p}}return best?{p:best,d:bd}:null}
function larderCap(){return 4+(has('larder')?4:0)}
function shelter(){const S=ST();const ob=atBuild();if(ob&&ob.type==='outpost'&&ob.stage>=3)return true;if(S.mode==='ground'&&within('shelter',4,b=>b.stage>=2))return true;return false}
function stormMul(){const S=ST();let m=1;const ob=atBuild();if(ob&&ob.type==='outpost'&&ob.stage>=2)m=.5;if(S.mode==='perch'&&S.perch&&S.perch.nest&&S.nest&&S.nest.stage>=2)m=.5;if(within('windbreak',12))m=Math.min(m,.5);return m}
function hpBonus(){return has('shelter',3)?10:0}
function scavenge(o){if(Math.random()<.5)gain('bone',1)&&toast('+1 🦴 bone');if(Math.random()<.4)gain('feather',1)}
// ---------- tick
let lastPerch=null,T0=0;
function tick(dt,I){const S=ST();if(!S)return;sync();T0+=dt;if(fullT>0)fullT-=dt;
 for(const it of items){if(it.nopick>0)it.nopick-=dt;if(!it.alive&&!it.gone){it.t-=dt;if(it.t<=0){it.alive=true;dirty=true}}}
 if(place){if(I.landE){cancelPlace();I.landE=false}else{placeTick();if(I.actE){confirmPlace();I.actE=false}}}
 if(I.scanE)scan();
 autoPickup(dt);if(dirty)refresh();findTick(dt,T0);
 const storm=S.storm||0;for(const b of builds()){const m=meshOf.get(b);
  if(b.type==='bowl'){b.water=Math.min(1,(b.water||0)+dt*(storm>.3?1/60:1/300));if(m){const w=m.getObjectByName('water');if(w){w.visible=b.water>.03;w.scale.setScalar(.4+.6*b.water)}}}
  else if(b.type==='trap'){if(b.t>0){b.t-=dt;if(b.t<=0){if(hyp(b.x-S.x,b.z-S.z)<150)toast('🪤 Your trap caught a mouse');}}if(m){const bt=m.getObjectByName('bait');if(bt){bt.visible=true;bt.scale.setScalar(b.t<=0?2.2+Math.sin(T0*6)*.3:1)}}}
  else if(b.type==='banner'&&m){const f=m.getObjectByName('flag');if(f){const p=f.geometry.attributes.position;if(!f.userData.b)f.userData.b=Float32Array.from(p.array);const a=f.userData.b;for(let i=0;i<p.count;i++){const x=a[i*3];p.array[i*3+2]=Math.sin(T0*4+x*5)*.12*x}p.needsUpdate=true}}
  else if((b.type==='hoard'||b.type==='lookout')&&m)m.traverse(o=>{if(o.name==='spin')o.rotation.y+=dt*1.5})}
 const ob=atBuild();if(ob&&ob.type==='platform'&&ob.stage>=2)S.stam=Math.min(G.maxSt(),S.stam+dt*14);
 if(S.mode==='ground'&&within('shelter',4,b=>b.stage>=3))S.hp=Math.min(G.maxHp(),S.hp+dt);
 const pk=S.mode==='perch'&&S.perch?(S.perch.bid||(S.perch.nest?'home':null)):null;if(pk!==lastPerch){if(pk&&ob&&ob.type==='outpost'){if(autoStore())G.save()}if(pk&&ob&&ob.type==='lookout')scan(160,false);lastPerch=pk}}
// ---------- HUD & minimap
function hudInv(){const u=used(),c=cap();return `<span class="bag">🎒 ${u}/${c}</span> <span class="scan ${scanCD>0?'cd':''}">📡${scanCD>0?' '+Math.ceil(scanCD):''}</span>`}
const CSS={};function css(k){return CSS[k]||(CSS[k]='#'+MAT[k].c.toString(16).padStart(6,'0'))}
function drawMini(x,k,s){const S=ST();const R=scanT>0?80:30;x.lineWidth=1;for(const it of near(S.x,S.z,R)){const dx=(it.x-S.x)*k,dz=(it.z-S.z)*k;if(Math.abs(dx)>s*.47||Math.abs(dz)>s*.47)continue;x.fillStyle=it.k==='shiny'?'#ffe060':scanT>0?'#9fe8ff':css(it.k);x.beginPath();x.arc(dx,dz,scanT>0?2.6:2,0,TAU);x.fill()}
 x.font='11px "Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';for(const b of builds()){const dx=clamp((b.x-S.x)*k,-s*.45,s*.45),dz=clamp((b.z-S.z)*k,-s*.45,s*.45);x.fillText(T[b.type].i,dx,dz)}}
// ---------- nest panel override
const origNest=window.openNest;
window.openNest=function(){origNest();const S=ST(),n=S.nest,st=stash();const sk=KEYS.filter(k=>st[k]>0);
 $('#nestStore').innerHTML=`Home nest stage <b>${n.stage}/4</b> (${HOME_ST.slice(0,n.stage).map(s=>s.n).join(', ')})${n.up.larder?` · Cache <b>${n.larder.length}/${larderCap()}</b>`:''}<br>Stash: ${sk.map(k=>`<span class="chip">${MAT[k].i}${st[k]}</span>`).join(' ')||'empty'}`;
 $('#upgList').innerHTML=`<button class="btn" id="bNestBuild">🔨 Build & upgrade (Y)</button><button class="btn" id="bNestBag">🎒 Bag & stash (View)</button>`;$('#bNestBuild').onclick=openBuild;$('#bNestBag').onclick=openInv;window.__setFocusI(0)};
// ---------- init
spawnAll();refresh();
window.BUILD={MAT,KEYS,T,HOME_ST,CAP,TABS,emptyInv,migrate,fix,cap,used,gain,pay,canPay,costFor,have,stash,sync,rebuild,nestMesh,buildMesh,startPlace,cancelPlace,confirmPlace,upgrade,
 get place(){return place},placing:()=>!!place,get items(){return items},near:(r)=>{const S=ST();return near(S.x,S.z,r||80)},get scanT(){return scanT},get scanCD(){return scanCD},scan,
 openBuild,openInv,renderBuild,renderInv,panelInput,ctx,act,findPerch,larderCap,shelter,stormMul,hpBonus,scavenge,autoStore,tick,hudInv,drawMini,
 _drop:drop1,_discard:discard,_take:()=>{if(invSel&&invSel.src==='stash')take(invSel.k)},_storeAll:()=>{if(nearStash()){autoStore();renderInv(true)}}};
if(ST()){sync();rebuild()}
})();
