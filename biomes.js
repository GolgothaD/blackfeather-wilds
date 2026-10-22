// Blackfeather Wilds — v3 biomes, landmarks, ground clutter & near-player critters
(function(){
'use strict';
const B=window.__BFW,{scene,camera}=B;const H=W.H,NA=W.normalAt,FM=W.forestMask;const r=W.rng(4242);const TAU=Math.PI*2;
const LAKE={x:220,z:330,r:140};
const Mx=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),P=new THREE.Vector3(),S=new THREE.Vector3(),C=new THREE.Color();
const std=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.9},o||{}));
function inst(geo,mat,list,shadow){if(!list.length)return null;const im=new THREE.InstancedMesh(geo,mat,list.length);
 list.forEach((t,i)=>{E.set(t.rx||0,t.ry||0,t.rz||0);Q.setFromEuler(E);P.set(t.x,t.y,t.z);S.set(t.sx||t.s||1,t.sy||t.s||1,t.sz||t.s||1);Mx.compose(P,Q,S);im.setMatrixAt(i,Mx);
  C.set(t.c===undefined?0xffffff:t.c);if(t.v)C.multiplyScalar(t.v);im.setColorAt(i,C)});
 im.castShadow=!!shadow;im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);return im}
function canvasTex(w,h,fn,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
function find(test,n,tries){const out=[];for(let i=0;i<(tries||20000)&&out.length<n;i++){const x=(r()-.5)*1400,z=(r()-.5)*1400;const h=H(x,z);if(test(x,z,h))out.push([x,z,h])}return out}
const flat=(x,z,k)=>NA(x,z).y>(k||.88);
function addTree(x,z,y,ht,w){const t={x,z,y,ht,w,type:1,rot:0,tint:1,id:W.trees.length,on:true,v3:true};W.trees.push(t);const k=Math.floor(x/20)+','+Math.floor(z/20);if(!W.tgrid.has(k))W.tgrid.set(k,[]);W.tgrid.get(k).push(t);return t}
const perch=(x,y,z,kind)=>{const p={x,y,z,kind:kind||'rock'};W.perches.push(p);if(W.activePerches)W.activePerches.push(p)};
const BI={zones:[]};window.BIOMES=BI;
// ---------- zone centres
const zone=(name,test)=>{const c=find(test,1,40000)[0];if(c){BI.zones.push({name,x:c[0],z:c[1],r:name==='marsh'?60:90});}return c};
zone('Birch Grove',(x,z,h)=>h>4&&h<35&&flat(x,z)&&FM(x,z)>.3&&FM(x,z)<.5&&Math.hypot(x,z)>120);
zone('Old-Growth',(x,z,h)=>h>3&&h<45&&FM(x,z)>.72&&flat(x,z,.85));
zone('Wildflower Meadow',(x,z,h)=>h>2&&h<30&&FM(x,z)<.3&&flat(x,z,.93)&&Math.hypot(x-LAKE.x,z-LAKE.z)>LAKE.r+40);
{const a=r()*TAU;for(let k=0;k<60;k++){const aa=a+k*.21,x=LAKE.x+Math.cos(aa)*(LAKE.r+8),z=LAKE.z+Math.sin(aa)*(LAKE.r+8);const h=H(x,z);if(h>.2&&h<3){BI.zones.push({name:'Reed Marsh',x,z,r:55});break}}}
zone('Nesting Cliffs',(x,z,h)=>h>22&&h<90&&NA(x,z).y<.72);
const Z=n=>BI.zones.find(q=>q.name===n);
const inZone=(zn,x,z)=>zn&&Math.hypot(x-zn.x,z-zn.z)<zn.r;
const around=(zn,n,test,spread)=>{const out=[];if(!zn)return out;for(let i=0;i<n*8&&out.length<n;i++){const a=r()*TAU,d=Math.sqrt(r())*(spread||zn.r);const x=zn.x+Math.cos(a)*d,z=zn.z+Math.sin(a)*d;const h=H(x,z);if(test(x,z,h))out.push([x,z,h])}return out};
const D=B.getQ().life||.75;const isLow=!B.getQ().grass;
// ---------- birch grove
const birchTex=canvasTex(64,256,(x,w,h)=>{x.fillStyle='#e9e6dc';x.fillRect(0,0,w,h);for(let i=0;i<46;i++){x.fillStyle=`rgba(${20+r()*30|0},${20+r()*25|0},20,${.5+r()*.5})`;const y=r()*h;x.fillRect(r()*w,y,6+r()*26,1+r()*4)}
 for(let i=0;i<300;i++){x.fillStyle='rgba(120,110,95,.25)';x.fillRect(r()*w,r()*h,1,1+r()*3)}});
const birchMat=std(0xffffff,{map:birchTex,roughness:.8});
const birchCrown=new THREE.MeshStandardMaterial({map:W.leafTex,alphaTest:.45,side:THREE.DoubleSide,roughness:.8,color:0xffffff});W.sway(birchCrown,.04);
{const bz=Z('Birch Grove');const pts=around(bz,isLow?40:90,(x,z,h)=>h>1.5&&flat(x,z,.84));
 const trunk=new THREE.CylinderGeometry(.13,.2,1,8).translate(0,.5,0);
 const cards=[];for(let i=0;i<44;i++){const y=.45+r()*.55,a=r()*TAU,d=(1-(y-.45)/.6)*.22+.05;const g=new THREE.PlaneGeometry(.3,.3);g.rotateY(a+1.57+(r()-.5));g.rotateX((r()-.5)*.8);
  g.translate(Math.cos(a)*d,y,Math.sin(a)*d);const uv=g.attributes.uv;for(let j=0;j<uv.count;j++)uv.setX(j,uv.getX(j)*.5);const nn=g.attributes.normal;for(let j=0;j<nn.count;j++){const v=new THREE.Vector3(Math.cos(a),.6,Math.sin(a)).normalize();nn.setXYZ(j,v.x,v.y,v.z)}cards.push(g)}
 const crown=W.mergeGeos(cards);const T=[],Cr=[];
 for(const [x,z,h] of pts){const ht=10+r()*8,lean=(r()-.5)*.12;T.push({x,y:h-.2,z,sx:ht*.022,sy:ht,sz:ht*.022,rz:lean,ry:r()*6});Cr.push({x,y:h-.2,z,sx:ht*.55,sy:ht,sz:ht*.55,ry:r()*6,rz:lean,c:0xd8ec88,v:.85+r()*.3});addTree(x,z,h,ht,ht*.3)}
 inst(trunk,birchMat,T,true);inst(crown,birchCrown,Cr,false);
 // golden understory
 inst(new THREE.IcosahedronGeometry(.6,0),std(0xb4a040),around(bz,60,(x,z,h)=>h>1.5).map(([x,z,h])=>({x,y:h+.1,z,s:.5+r()*.6,sy:.35,c:0xc0b050,v:.7+r()*.5})))}
// ---------- old-growth: huge dark mossy firs + ferns
{const oz=Z('Old-Growth');const pts=around(oz,isLow?18:36,(x,z,h)=>h>1.5&&flat(x,z,.8));
 const bark=std(0x6a5a4a,{map:W.T.bark,normalMap:W.T.barkN});const trunk=new THREE.CylinderGeometry(.08,.16,1,9).translate(0,.5,0);
 const tiers=[];for(let i=0;i<8;i++){const y=.18+i*.1,rad=.3-i*.032;const c=new THREE.ConeGeometry(rad,.22,10,1,true).translate(0,y+.11,0);W.colorize(c,[.09,.17,.1],.3,r);tiers.push(c)}
 const crown=W.mergeGeos(tiers);const fol=std(0xffffff,{vertexColors:true,map:W.T.moss,side:THREE.DoubleSide});W.sway(fol,.012);const T=[],Cr=[];
 for(const [x,z,h] of pts){const ht=30+r()*16;T.push({x,y:h-.4,z,sx:ht*.06,sy:ht,sz:ht*.06,ry:r()*6});Cr.push({x,y:h-.4,z,sx:ht*.5,sy:ht,sz:ht*.5,ry:r()*6,v:.7+r()*.3});addTree(x,z,h,ht,ht*.35);perch(x,h+ht*.95,z,'rock')}
 inst(trunk,bark,T,true);inst(crown,fol,Cr,true);
 const fern=new THREE.Group();const fg=[];for(let i=0;i<7;i++){const g=new THREE.PlaneGeometry(.18,.9,1,3);const p=g.attributes.position;for(let j=0;j<p.count;j++){const y=p.getY(j)+.45;p.setZ(j,-y*y*.5);p.setX(j,p.getX(j)*(1-y*.9))}g.translate(0,.45,0);g.rotateX(-.7);g.rotateY(i/7*TAU);W.colorize(g,[.16,.32,.1],.3,r);fg.push(g)}
 const fernM=std(0xffffff,{vertexColors:true,side:THREE.DoubleSide});W.sway(fernM,.25);
 inst(W.mergeGeos(fg),fernM,around(oz,isLow?80:260,(x,z,h)=>h>1.4,oz?oz.r*1.2:0).map(([x,z,h])=>({x,y:h-.05,z,s:.8+r()*1.2,ry:r()*6,v:.8+r()*.4})))}
// ---------- wildflowers (meadow dense + scattered world-wide)
{const mz=Z('Wildflower Meadow');const cols=[0xf2e14a,0xffffff,0xb07ce8,0xe8505a,0x6b9cf0,0xf5a23c];
 const fg=[];{const stem=new THREE.CylinderGeometry(.008,.01,.32,3).translate(0,.16,0);W.colorize(stem,[.2,.38,.12],.1,r);fg.push(stem);
  const head=new THREE.IcosahedronGeometry(.045,0).translate(0,.33,0);const c=head.attributes.position.count;head.setAttribute('color',new THREE.Float32BufferAttribute(new Array(c*3).fill(1),3));fg.push(head)}
 const fgeo=W.mergeGeos(fg);const fmat=std(0xffffff,{vertexColors:true,roughness:.7});W.sway(fmat,.4);
 const L=[];const nM=isLow?600:2400,nW=isLow?500:1800;
 for(const [x,z,h] of around(mz,nM,(x,z,h)=>h>1.4&&flat(x,z,.85)))L.push({x,y:h-.03,z,s:.8+r()*.9,ry:r()*6,c:cols[(r()*cols.length)|0]});
 for(const [x,z,h] of find((x,z,h)=>h>1.6&&h<60&&FM(x,z)<.55&&flat(x,z),nW,30000))L.push({x,y:h-.03,z,s:.7+r()*.7,ry:r()*6,c:cols[(r()*cols.length)|0]});
 inst(fgeo,fmat,L);BI.flowers=L}
// ---------- marsh: reeds + cattails + lily pads
{const kz=Z('Reed Marsh');const rg=[];for(let i=0;i<9;i++){const a=i/9*TAU;const g=new THREE.PlaneGeometry(.03,1.6,1,3);const p=g.attributes.position;for(let j=0;j<p.count;j++)if(p.getY(j)>.2)p.setX(j,p.getX(j)*.3);
  g.translate(Math.cos(a)*.08,.8,Math.sin(a)*.08);g.rotateY(a);g.rotateX((r()-.5)*.25);W.colorize(g,[.36,.4,.18],.35,r);rg.push(g)}
 for(let i=0;i<3;i++){const c=new THREE.CylinderGeometry(.03,.03,.18,6).translate(Math.cos(i*2)*.1,1.55+r()*.2,Math.sin(i*2)*.1);W.colorize(c,[.25,.15,.08],.1,r);rg.push(c)}
 const rm=std(0xffffff,{vertexColors:true,side:THREE.DoubleSide});W.sway(rm,.18);
 const reeds=[];for(let i=0;i<(isLow?260:800);i++){let x,z,h,ok=false;for(let j=0;j<12&&!ok;j++){const a=r()*TAU,d=LAKE.r-40+r()*60;x=LAKE.x+Math.cos(a)*d;z=LAKE.z+Math.sin(a)*d;h=H(x,z);ok=h>-1.1&&h<1.6}if(!ok)continue;if(r()>(inZone(kz,x,z)?1:.25))continue;reeds.push({x,y:Math.max(h,-1.4)-.1,z,s:.7+r()*.6,ry:r()*6})}
 inst(W.mergeGeos(rg),rm,reeds);
 const pad=new THREE.CircleGeometry(.5,10,.3,TAU-.3).rotateX(-Math.PI/2);const pads=[];
 if(kz)for(let i=0;i<120;i++){const a=r()*TAU,d=r()*kz.r;const x=kz.x+Math.cos(a)*d,z=kz.z+Math.sin(a)*d;if(H(x,z)>-.4)continue;pads.push({x,y:.03,z,s:.6+r()*.8,ry:r()*6,c:r()<.12?0xf0d0e0:0x4f7a35})}
 inst(pad,std(0xffffff,{roughness:.5}),pads)}
// ---------- cliffs: rock stacks with nesting ledges
const rockMat=std(0xa8a298,{map:W.T.rock,normalMap:W.T.rockN});
function lumpy(g,amt){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=1+amt*(Math.sin(x*3.1+y*1.7)*.5+Math.sin(z*2.3-x*1.3)*.5);p.setXYZ(i,x*n,y*n,z*n)}g.computeVertexNormals();return g}
{const cz=Z('Nesting Cliffs');const stacks=[],ledges=[],nests=[];
 const sp=around(cz,14,(x,z,h)=>h>8);for(const [x,z,h] of sp){const ht=10+r()*18;stacks.push({x,y:h-1,z,sx:3+r()*3,sy:ht,sz:3+r()*3,ry:r()*6});
  for(let k=0;k<3;k++){const a=r()*TAU,y=h+ht*(.35+k*.25);const lx=x+Math.cos(a)*3.4,lz=z+Math.sin(a)*3.4;ledges.push({x:lx,y,z:lz,sx:2.2,sy:.35,sz:1.6,ry:-a});perch(lx,y+.3,lz,'rock');if(r()<.5)nests.push({x:lx,y:y+.25,z:lz,s:.6})}
  perch(x,h-1+ht*1.0,z,'rock')}
 inst(lumpy(new THREE.CylinderGeometry(.85,1,1,9,4).translate(0,.5,0),.12),rockMat,stacks,true);inst(new THREE.BoxGeometry(1,1,1),rockMat,ledges,true);
 inst(new THREE.TorusGeometry(.45,.16,5,10).rotateX(Math.PI/2),std(0x6a5236),nests)}
// ---------- landmarks
{const lm=[];BI.landmarks=lm;
 // standing stone circle in meadow
 const mz=Z('Wildflower Meadow');if(mz){const cx=mz.x+20,cz=mz.z-10,ch=H(cx,cz);const st=[];for(let i=0;i<9;i++){const a=i/9*TAU,x=cx+Math.cos(a)*9,z=cz+Math.sin(a)*9,h=H(x,z);st.push({x,y:h-.3,z,sx:1.1,sy:3+r()*1.5,sz:.6,ry:-a+r()*.2,rz:(r()-.5)*.1});perch(x,h+3.5,z,'stone')}
  st.push({x:cx,y:ch-.2,z:cz,sx:2.2,sy:.7,sz:1.4,ry:r()});inst(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),std(0xc4c0b6,{map:W.T.rock,normalMap:W.T.rockN}),st,true);lm.push({name:'Stone Circle',x:cx,z:cz})}
 // ruined watchtower
 const tw=find((x,z,h)=>h>30&&h<70&&flat(x,z,.9),1,30000)[0];if(tw){const [x,z,h]=tw;const g=new THREE.CylinderGeometry(3,3.4,14,12,1,true);const p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>0){const a=Math.atan2(p.getZ(i),p.getX(i));p.setY(i,p.getY(i)-(Math.sin(a*3)*.5+.5)*4)}g.computeVertexNormals();
  const m=new THREE.Mesh(g,std(0x9a958c,{map:W.T.rock,normalMap:W.T.rockN,side:THREE.DoubleSide}));m.position.set(x,h+6.5,z);m.castShadow=m.receiveShadow=true;scene.add(m);perch(x+3,h+12.5,z,'stone');lm.push({name:'Old Watchtower',x,z})}
 // rock arch
 const ar=find((x,z,h)=>h>6&&h<40&&flat(x,z,.85)&&FM(x,z)<.5,1,30000)[0];if(ar){const [x,z,h]=ar;const g=lumpy(new THREE.TorusGeometry(7,1.6,8,18,Math.PI),.1);const m=new THREE.Mesh(g,rockMat);m.position.set(x,h-1,z);m.rotation.y=r()*3;m.castShadow=m.receiveShadow=true;scene.add(m);perch(x,h+7.4,z,'stone');lm.push({name:'Sky Arch',x,z})}
 // great dead oak (snag) with nest
 const dz=find((x,z,h)=>h>3&&h<40&&FM(x,z)<.35&&flat(x,z),1,30000)[0];if(dz){const [x,z,h]=dz;const parts=[new THREE.CylinderGeometry(.9,1.8,16,9).translate(0,8,0)];for(let i=0;i<6;i++){const c=new THREE.CylinderGeometry(.15,.45,7,6).translate(0,3.5,0);c.rotateZ(.7+r()*.5);c.rotateY(i*1.05);c.translate(0,8+i*1.3,0);parts.push(c)}
  const m=new THREE.Mesh(W.mergeGeos(parts),std(0x7a6e62,{map:W.T.bark,normalMap:W.T.barkN}));m.position.set(x,h-.5,z);m.castShadow=true;scene.add(m);addTree(x,z,h,16,4);perch(x,h+15.5,z,'stone');lm.push({name:'Lightning Oak',x,z})}}
// ---------- ground clutter world-wide: rocks, stumps, logs, mushrooms
{const n=isLow?.4:1;
 inst(lumpy(new THREE.DodecahedronGeometry(1,0),.25),rockMat,find((x,z,h)=>h>1.2&&h<110,(420*n)|0,20000).map(([x,z,h])=>({x,y:h-.1,z,sx:.3+r()*1.2,sy:.2+r()*.7,sz:.3+r()*1.1,ry:r()*6,rx:r()*.4,v:.75+r()*.4})),true);
 const stump=W.mergeGeos([new THREE.CylinderGeometry(.35,.48,.6,9).translate(0,.3,0)]);const sm=std(0x6b5a48,{map:W.T.bark,normalMap:W.T.barkN});
 const nearForest=(x,z,h)=>h>1.4&&FM(x,z)>.45&&flat(x,z,.82);
 const stumps=find(nearForest,(160*n)|0,20000).map(([x,z,h])=>({x,y:h-.05,z,s:.7+r()*.8,ry:r()*6}));inst(stump,sm,stumps,true);stumps.forEach(t=>perch(t.x,t.y+.6*t.s,t.z,'stone'));
 inst(new THREE.CylinderGeometry(.3,.35,1,8).rotateZ(Math.PI/2),sm,find(nearForest,(120*n)|0,20000).map(([x,z,h])=>({x,y:h+.2,z,sx:4+r()*5,sy:1,sz:1,ry:r()*6,v:.8+r()*.3})),true);
 const mg=[new THREE.CylinderGeometry(.03,.04,.14,5).translate(0,.07,0)];W.colorize(mg[0],[.85,.82,.72],.05,r);const cap=new THREE.SphereGeometry(.09,8,5,0,TAU,0,1.5).scale(1,.6,1).translate(0,.13,0);const cc=cap.attributes.position.count;cap.setAttribute('color',new THREE.Float32BufferAttribute(new Array(cc*3).fill(1),3));mg.push(cap);
 const mush=[];for(const [x,z,h] of find(nearForest,(220*n)|0,20000)){const c=r()<.35?0xc8302a:r()<.5?0xb08a5a:0xe8dcc0;for(let k=0;k<3+r()*4;k++)mush.push({x:x+(r()-.5)*1.5,y:h-.02,z:z+(r()-.5)*1.5,s:.6+r()*1.2,ry:r()*6,c})}
 inst(W.mergeGeos(mg),std(0xffffff,{vertexColors:true,roughness:.6}),mush)}
W.indexPerches&&W.indexPerches();
// ---------- near-player critters: rabbits, squirrels, butterflies, frogs
const crit=[];const cm=(c)=>std(c,{roughness:.85});
function rabbit(){const g=new THREE.Group();const m=cm(0x8a7258);const b=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8).scale(1,.9,1.4),m);b.position.y=.16;g.add(b);
 const hd=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),m);hd.position.set(0,.27,-.18);g.add(hd);for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.CapsuleGeometry(.022,.13,2,5),m);e.position.set(s*.03,.4,-.15);e.rotation.x=.25;g.add(e)}
 const t=new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),cm(0xf0ece2));t.position.set(0,.2,.22);g.add(t);return g}
function squirrel(){const g=new THREE.Group();const m=cm(0x9a4a22);const b=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6).scale(1,1,1.5),m);b.position.y=.1;g.add(b);const hd=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),m);hd.position.set(0,.16,-.12);g.add(hd);
 const t=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6).scale(.8,1.8,.8),m);t.position.set(0,.22,.14);t.rotation.x=-.3;g.add(t);return g}
function butterfly(c){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide,roughness:.6});for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.CircleGeometry(.07,8).translate(s*.07,0,0),m);w.rotation.x=-Math.PI/2;const p=new THREE.Group();p.add(w);g.add(p);(g.userData.w=g.userData.w||[]).push([p,s])}return g}
const NC=Math.round(4+8*D),NB=Math.round(4+10*D);
for(let i=0;i<NC;i++){const sq=i%3===2;const m=sq?squirrel():rabbit();m.scale.setScalar(sq?1.3:1.4);scene.add(m);crit.push({m,kind:sq?'sq':'rab',x:0,z:0,y:0,yaw:0,t:r()*5,hop:0,flee:0,placed:false})}
for(let i=0;i<NB;i++){const m=butterfly([0xf5d040,0xf08a30,0xffffff,0x80a8ff][i%4]);m.scale.setScalar(.65);scene.add(m);crit.push({m,kind:'bf',x:0,z:0,y:0,t:r()*9,placed:false})}
function place(c,px,pz){for(let k=0;k<20;k++){const a=r()*TAU,d=12+r()*30;const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;const h=H(x,z);if(h<1.2||NA(x,z).y<.85)continue;c.x=x;c.z=z;c.y=h;c.placed=true;c.flee=0;return}}
BI.critters=crit;
function tick(dt){const S=window.__G&&window.__G.S;const px=S?S.x:camera.position.x,pz=S?S.z:camera.position.z;
 for(const c of crit){const dx=c.x-px,dz=c.z-pz,d=Math.hypot(dx,dz);if(!c.placed||d>70){place(c,px,pz);if(!c.placed){c.m.visible=false;continue}}
  c.m.visible=true;c.t+=dt;
  if(c.kind==='bf'){c.x+=Math.sin(c.t*.7+c.y)*dt*1.4;c.z+=Math.cos(c.t*.55)*dt*1.4;const fy=H(c.x,c.z)+.6+Math.sin(c.t*1.3)*.35;c.m.position.set(c.x,fy,c.z);c.m.rotation.y=c.t*.4;
   for(const [p,s] of c.m.userData.w)p.rotation.z=s*Math.sin(c.t*22)*.9;continue}
  const near=S&&d<6&&S.mode!=='perch'&&(S.y-H(px,pz))<6;if(near)c.flee=2.5;
  let spd=0;if(c.flee>0){c.flee-=dt;c.yaw=Math.atan2(dx,dz);spd=c.kind==='sq'?6:7}else if(c.hop<=0){if(r()<dt*.6){c.hop=.35;c.yaw+=(r()-.5)*2}}
  if(c.hop>0){c.hop-=dt;spd=Math.max(spd,2.2)}
  c.x+=Math.sin(c.yaw)*spd*dt;c.z+=Math.cos(c.yaw)*spd*dt;const h=H(c.x,c.z);const hopY=spd>0?Math.abs(Math.sin(c.t*14))*.18:0;
  c.m.position.set(c.x,h+hopY,c.z);c.m.rotation.y=c.yaw+Math.PI}}
BI.tick=tick;
if(window.LIFE){const prev=LIFE.tick;LIFE.tick=function(dt){prev.apply(this,arguments);try{tick(dt)}catch(e){}}}
})();
