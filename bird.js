// Blackfeather Wilds — procedural bird models + species data
(function(){
'use strict';
const SPECIES={
 crow:{name:'American Crow',short:'Crow',tag:'Clever scavenger',desc:'Eats almost anything. Carries more, builds for less, and can collect shiny trinkets. Caw scares predators away and reveals shinies.',
  size:1,speed:1,turn:1.15,stam:100,hp:100,flapCost:5,glideSink:1.25,diveMax:34,thermal:.4,carry:10,buildDisc:.6,ability:'Caw',abCd:25,
  diet:{mouse:1,berries:1.6,grubs:1.5,carrion:1.4,fish:.8,songbird:.8,rabbit:.8},colors:{body:0x22242c,belly:0x1e2026,wing:0x1a1c22,head:0x24262e,beak:0x1a1a1e,tail:0x1a1c22,eye:0x2a1a10,sheen:.35},bars:[3,3,4,5,3]},
 hawk:{name:'Red-tailed Hawk',short:'Hawk',tag:'Tireless soarer',desc:'Rides thermals over open ground and regains stamina while gliding. Keen Eye marks all nearby prey.',
  size:1.25,speed:1.05,turn:1,stam:130,hp:115,flapCost:6,glideSink:.65,diveMax:40,thermal:2.2,carry:8,buildDisc:1,ability:'Keen Eye',abCd:30,
  diet:{mouse:1.2,rabbit:1.3,songbird:1,carrion:.7,fish:.6},colors:{body:0x5b3a22,belly:0xe7d8bd,wing:0x4a2f1c,head:0x5a3b25,beak:0x2a2622,tail:0xa4492a,eye:0x5a2e10,sheen:0},bars:[4,5,3,3,4]},
 falcon:{name:'Peregrine Falcon',short:'Falcon',tag:'Fastest dive on Earth',desc:'Blistering dives and mid-air strikes on songbirds. Stoop launches an instant power dive. Lower stamina.',
  size:1,speed:1.2,turn:1.3,stam:85,hp:90,flapCost:5,glideSink:1.1,diveMax:60,thermal:.6,carry:8,buildDisc:1,ability:'Stoop',abCd:12,
  diet:{songbird:1.6,mouse:1,rabbit:.8,fish:.5},colors:{body:0x4d5560,belly:0xdcd6cc,wing:0x3b434e,head:0x1c1f24,beak:0x2a2a2a,tail:0x3a414b,eye:0x140c08,sheen:.05},bars:[5,2,3,4,5]},
 owl:{name:'Great Horned Owl',short:'Owl',tag:'Silent night hunter',desc:'Prey cannot hear you coming. Sees in the dark and grows stronger at night, but tires faster in daylight.',
  size:1.2,speed:.9,turn:1,stam:110,hp:110,flapCost:5.5,glideSink:1,diveMax:32,thermal:.5,carry:8,buildDisc:1,ability:'Night Sight',abCd:2,
  diet:{mouse:1.5,rabbit:1.2,songbird:1,fish:.6},colors:{body:0x6b5640,belly:0xb39d7c,wing:0x5d4935,head:0x6e5a43,beak:0x2b2622,tail:0x5a4632,eye:0xffb21a,sheen:0},bars:[3,4,3,4,4]},
 eagle:{name:'Bald Eagle',short:'Eagle',tag:'Strongest of the sky',desc:'The toughest bird in the wild. Snatches fish from the water and scares off foxes and wolves with a Screech. Heavy to keep aloft.',
  size:1.6,speed:1,turn:.8,stam:140,hp:160,flapCost:8,glideSink:.85,diveMax:42,thermal:1.4,carry:10,buildDisc:1,ability:'Screech',abCd:30,
  diet:{fish:1.5,rabbit:1.3,carrion:1.2,mouse:.8,songbird:.7},colors:{body:0x3a2717,belly:0x34241a,wing:0x2e1f13,head:0xf4f1ea,beak:0xe8b52a,tail:0xf1eee6,eye:0xe8c43a,sheen:0},bars:[3,4,5,2,5]}
};
// bars: speed, endurance, toughness, utility, hunting (1-5)
const ORDER=['crow','hawk','falcon','owl','eagle'];
function mat(c,extra){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.72,metalness:0},extra||{}))}
const CC=new THREE.Color(),CD=new THREE.Color();
function lin(h){return new THREE.Color(h)}
// ---- low-level geometry builder: triangles with per-vertex colours and normals
function GB(){this.p=[];this.c=[];this.n=[];this.u=[]}
GB.prototype.tri=function(a,b,c,ca,cb,cc,ua,ub,uc){this.u.push(...(ua||[0,0]),...(ub||[0,0]),...(uc||[0,0]));const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
 this.p.push(...a,...b,...c);this.c.push(ca.r,ca.g,ca.b,cb.r,cb.g,cb.b,cc.r,cc.g,cc.b);for(let i=0;i<3;i++)this.n.push(nx,ny,nz)};
GB.prototype.geo=function(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));return g};
// one feather: lies in XZ, quill from origin toward +z, rotated by ang around Y, placed at (ox,oy,oz).
// top face uses colours top/tip, underside uses under/underTip. mirror=-1 builds the left wing.
function feather(gb,o){const {ox,oy,oz,len,wid,ang,mir,top,tip,under,utip,camber=.08,pointy=.25,twist=0}=o;const N=5;const L=[],Rr=[];
 const ca=Math.cos(ang),sa=Math.sin(ang);
 for(let i=0;i<=N;i++){const t=i/N;let w=wid*(t<.15?.55+t*3:1-Math.pow(Math.max(0,t-.55)/.45,1.7)*(1-pointy));w*=.5;
  const y=-camber*len*t*t;const tw=twist*t;
  // local: spine along +z, width along x
  const pl=[-w,y+w*tw,t*len],pr=[w,y-w*tw,t*len];
  const rot=v=>[(ox+v[0]*ca+v[2]*sa)*mir,oy+v[1],oz+(-v[0]*sa+v[2]*ca)];L.push(rot(pl));Rr.push(rot(pr))}
 for(let i=0;i<N;i++){const t0=i/N,t1=(i+1)/N;const c0=CC.copy(top).lerp(tip,Math.pow(t0,1.5)).clone(),c1=CD.copy(top).lerp(tip,Math.pow(t1,1.5)).clone();
  const u0=CC.copy(under).lerp(utip,Math.pow(t0,1.5)).clone(),u1=CD.copy(under).lerp(utip,Math.pow(t1,1.5)).clone();
  const a=L[i],b=Rr[i],c=L[i+1],d=Rr[i+1];const lift=v=>[v[0],v[1]+.0015,v[2]],drop=v=>[v[0],v[1]-.0015,v[2]];
  const A=[0,t0],B=[1,t0],Cu=[0,t1],D=[1,t1];
  if(mir>0){gb.tri(lift(a),lift(c),lift(b),c0,c1,c0,A,Cu,B);gb.tri(lift(b),lift(c),lift(d),c0,c1,c1,B,Cu,D);gb.tri(drop(a),drop(b),drop(c),u0,u0,u1,A,B,Cu);gb.tri(drop(b),drop(d),drop(c),u0,u1,u1,B,D,Cu)}
  else{gb.tri(lift(a),lift(b),lift(c),c0,c0,c1,A,B,Cu);gb.tri(lift(b),lift(d),lift(c),c0,c1,c1,B,D,Cu);gb.tri(drop(a),drop(c),drop(b),u0,u1,u0,A,Cu,B);gb.tri(drop(b),drop(c),drop(d),u0,u1,u1,B,Cu,D)}}}

// procedural feather textures (albedo modulation + normal map), built once
const FT=(function(){const mk=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const id=x.createImageData(w,h);const H=new Float32Array(w*h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)H[j*w+i]=fn(i/w,j/h);
  const nc=document.createElement('canvas');nc.width=w;nc.height=h;const nx=nc.getContext('2d');const nd=nx.createImageData(w,h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const o=(j*w+i)*4,v=H[j*w+i];id.data[o]=id.data[o+1]=id.data[o+2]=Math.max(0,Math.min(255,v*255));id.data[o+3]=255;
   const dx=H[j*w+(i+1)%w]-H[j*w+(i+w-1)%w],dy=H[((j+1)%h)*w+i]-H[((j+h-1)%h)*w+i];const s=3.5;let X=-dx*s,Y=-dy*s,Z=1;const l=Math.hypot(X,Y,Z);
   nd.data[o]=(X/l*.5+.5)*255;nd.data[o+1]=(Y/l*.5+.5)*255;nd.data[o+2]=(Z/l*.5+.5)*255;nd.data[o+3]=255}
  x.putImageData(id,0,0);nx.putImageData(nd,0,0);const t=new THREE.CanvasTexture(c),n=new THREE.CanvasTexture(nc);t.colorSpace=THREE.SRGBColorSpace;
  for(const q of [t,n]){q.wrapS=q.wrapT=THREE.RepeatWrapping;q.anisotropy=4}return [t,n]};
 const hs=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s)};
 // single feather in uv: u across vane (0..1), v along length. rachis at u=.5, barbs angled toward tip
 const fe=mk(64,256,(u,v)=>{const d=Math.abs(u-.5);const rach=Math.exp(-Math.pow(d/.03,2));const barb=.5+.5*Math.sin((v*2.4-d*1.1)*90+hs(Math.floor(v*40),u>.5?1:0)*2);
  const split=hs(Math.floor(v*14+(u>.5?.5:0)),u>.5?3:4)>.86&&d>.2?.55:1;const edge=1-Math.pow(d*2,6)*.35;return (.78+.12*barb)*edge*split*(1-rach*.25)+rach*.12});
 // body: overlapping contour feathers (scales), tiled
 const bo=mk(128,128,(u,v)=>{const U=u*8,V=v*8;const row=Math.floor(V),off=row%2?.5:0;const cu=U+off-Math.floor(U+off)-.5,cv=V-row;const r=Math.hypot(cu*1.1,cv*.9);
  const sc=Math.max(0,1-r)*.6+.4;const shaft=Math.exp(-Math.pow(cu/.04,2))*(1-cv)*.15;const fine=.5+.5*Math.sin((cv*3+Math.abs(cu))*40);return .72+.2*sc+.06*fine+shaft});
 return {feather:fe,body:bo}})();
// smooth deformed ellipsoid with colour function
function blob(rx,ry,rz,colf,deform,ws,hs){const g=new THREE.SphereGeometry(1,ws||22,hs||16);g.rotateX(Math.PI/2);/* poles along z */const p=g.attributes.position;const col=new Float32Array(p.count*3);const c=new THREE.Color();
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const d=deform?deform(x,y,z):[x,y,z];x=d[0];y=d[1];z=d[2];colf(c,x,y,z);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;p.setXYZ(i,x*rx,y*ry,z*rz)}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();return g}
const SM=(a,b,x)=>{let t=(x-a)/(b-a);t=t<0?0:t>1?1:t;return t*t*(3-2*t)};
// per-species plumage palette
function palette(id){const C=SPECIES[id].colors,P={back:lin(C.body),belly:lin(C.belly),wing:lin(C.wing),head:lin(C.head),tail:lin(C.tail),beak:lin(C.beak),eye:lin(C.eye)};
 P.covert=P.back.clone();P.tip=P.wing.clone().multiplyScalar(.55);P.under=P.belly.clone().lerp(P.wing,.35);P.utip=P.wing.clone().multiplyScalar(.7);P.tailTip=P.tail.clone().multiplyScalar(.75);P.tailU=P.tail.clone().lerp(P.belly,.5);
 P.leg=lin(0xd9b23a);P.talon=lin(0x151210);P.fingers=true;P.pointy=.25;
 if(id==='crow'){P.under=P.wing.clone().multiplyScalar(1.05);P.utip=P.wing.clone();P.tip=P.wing.clone().multiplyScalar(.8);P.leg=lin(0x141414);P.tailU=P.tail.clone();P.tailTip=P.tail.clone()}
 if(id==='hawk'){P.covert=lin(0x6a4528);P.under=lin(0xeee2cc);P.utip=lin(0x3a2a20);P.tailTip=lin(0x8a3820);P.tailU=lin(0xf0d8c0);P.tip=lin(0x2e2018)}
 if(id==='falcon'){P.fingers=false;P.pointy=.12;P.under=lin(0xb8b2aa);P.utip=lin(0x4a4e55);P.covert=lin(0x56606c);P.tip=lin(0x262a30);P.leg=lin(0xe7c23c)}
 if(id==='owl'){P.fingers=false;P.pointy=.55;P.under=lin(0xc8b08a);P.utip=lin(0x7a6248);P.covert=lin(0x7b6448);P.tip=lin(0x3d3024);P.leg=lin(0xbaa27e)}
 if(id==='eagle'){P.under=lin(0x2e2016);P.utip=lin(0x1c140d);P.covert=lin(0x4a3220);P.tip=lin(0x1a120b);P.tailTip=lin(0xe8e4dc);P.tailU=lin(0xf4f1ea);P.leg=lin(0xe8b52a)}
 return P}
function wingParts(id,P,mir){const owl=id==='owl',fal=id==='falcon',eag=id==='eagle';
 const span=owl?.66:fal?.62:eag?.74:id==='hawk'?.66:.62,chord=owl?.3:fal?.2:eag?.27:.25;const A=span*.42,Hn=span*.58;
 const arm=new GB(),hand=new GB();const rr=W.rng(id.length*977+(mir>0?3:7));
 const bar=(x,t)=>id==='hawk'||owl?(Math.sin(t*28+x*40)>.55?.78:1):fal?(Math.sin(t*34)>.6?.85:1):1;
 // secondaries along the arm
 const nS=owl?10:9;for(let i=0;i<nS;i++){const t=i/(nS-1);const x=.01+t*A;const len=chord*(1.02-t*.12)*(owl?1.08:1);
  feather(arm,{ox:x,oy:0,oz:-chord*.12,len,wid:A/nS*2.1,ang:-.08*t,mir,top:P.wing.clone().multiplyScalar(bar(x,.3)),tip:P.tip,under:P.under,utip:P.utip,camber:.06,pointy:.45})}
 // greater + lesser coverts
 for(let i=0;i<nS;i++){const t=i/(nS-1),x=.01+t*A;feather(arm,{ox:x,oy:.01,oz:-chord*.2,len:chord*.55,wid:A/nS*2.2,ang:-.05*t,mir,top:P.covert,tip:P.wing,under:P.under,utip:P.under,camber:.04,pointy:.6})}
 for(let i=0;i<nS;i++){const t=i/(nS-1),x=.01+t*A;feather(arm,{ox:x,oy:.018,oz:-chord*.26,len:chord*.3,wid:A/nS*2.4,ang:0,mir,top:P.covert.clone().multiplyScalar(1.08),tip:P.covert,under:P.belly,utip:P.under,camber:.02,pointy:.8})}
 // primaries from the wrist/hand
 const nP=fal?9:owl?9:8;for(let i=0;i<nP;i++){const t=i/(nP-1);const ang=(fal?.25:.18)+t*(fal?1.25:owl?1.12:1.22);const reach=fal?(.55+.45*t):owl?(.8+.2*Math.sin(t*2.6)):(.6+.4*Math.sin(Math.min(1,t*1.15)*Math.PI*.5));
  const len=chord*1.05+(Hn*.85-chord*1.05)*reach;const x=t*Hn*.32;const fingers=P.fingers&&t>.55;
  feather(hand,{ox:x,oy:-.004*t,oz:-chord*.1+t*chord*.02,len,wid:fingers?chord*.17:chord*.24*(fal?.85:1),ang,mir,top:P.wing.clone().multiplyScalar(bar(x,t)),tip:P.tip,under:P.under.clone().lerp(P.utip,.25),utip:P.utip,camber:.05,pointy:fingers?.12:P.pointy,twist:.2})}
 // primary coverts
 for(let i=0;i<6;i++){const t=i/5;feather(hand,{ox:t*Hn*.3,oy:.012,oz:-chord*.22,len:chord*.5,wid:chord*.24,ang:.2+t*.9,mir,top:P.covert,tip:P.wing,under:P.under,utip:P.under,camber:.03,pointy:.6})}
 const ga=arm.geo(),gh=hand.geo();
 // leading edge (patagium)
 const le=new THREE.CylinderGeometry(chord*.075,chord*.1,A+.02,7,1).rotateZ(Math.PI/2).translate(mir*A/2,.008,-chord*.2);const le2=new THREE.CylinderGeometry(chord*.04,chord*.07,Hn*.36,6,1).rotateZ(Math.PI/2).translate(mir*Hn*.18,.006,-chord*.16);
 [le,le2].forEach(g=>{const n=g.attributes.position.count,c=new Float32Array(n*3);for(let i=0;i<n;i++){c[i*3]=P.covert.r;c[i*3+1]=P.covert.g;c[i*3+2]=P.covert.b}g.setAttribute('color',new THREE.BufferAttribute(c,3));g.deleteAttribute('uv')});
 return {arm:merge([ga,le.toNonIndexed()]),hand:merge([gh,le2.toNonIndexed()]),A,Hn,chord}}
function merge(list){let n=0;list.forEach(g=>n+=g.attributes.position.count);const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
 for(const g of list){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(P,3));r.setAttribute('normal',new THREE.BufferAttribute(N,3));r.setAttribute('color',new THREE.BufferAttribute(C,3));return r}
function tailGeo(id,P){const owl=id==='owl';const gb=new GB();const n=12;const tl=owl?.2:id==='eagle'?.27:id==='falcon'?.28:id==='hawk'?.26:.3;const tw=id==='hawk'?.06:.045;
 for(let i=0;i<n;i++){const t=i/(n-1)-.5;const len=tl*(1-Math.abs(t)*(id==='crow'?.35:.12));const band=id==='hawk'?1:id==='owl'?(Math.floor(len*40)%2?1:.8):1;
  feather(gb,{ox:t*.06,oy:-Math.abs(t)*.01+(.5-Math.abs(t))*.006,oz:0,len,wid:tw,ang:t*.55,mir:1,top:P.tail.clone().multiplyScalar(band),tip:P.tailTip,under:P.tailU,utip:P.tailU,camber:-.02,pointy:.65})}
 return gb.geo()}
function makeBird(id){
 const sp=SPECIES[id],C=sp.colors,P=palette(id);const g=new THREE.Group();const body=new THREE.Group();g.add(body);
 const owl=id==='owl',crow=id==='crow',eag=id==='eagle',fal=id==='falcon',hawk=id==='hawk';
 const sheen={metalness:C.sheen*.6,roughness:C.sheen?.38:.82};
 const M=mat(0xffffff,Object.assign({vertexColors:true,map:FT.body[0],normalMap:FT.body[1],normalScale:new THREE.Vector2(.6,.6)},sheen));M.map.repeat.set(3,6);M.normalMap.repeat.set(3,6);
 const FM=mat(0xffffff,Object.assign({vertexColors:true,map:FT.feather[0],normalMap:FT.feather[1],normalScale:new THREE.Vector2(.8,.8)},sheen));
 // torso: teardrop, chest forward (-z), tapering to the tail (+z)
 const torso=new THREE.Mesh(blob(owl?.21:.17,owl?.22:.165,owl?.32:.36,(c,x,y,z)=>{
   const bel=SM(.15,-.45,y);c.copy(P.back).lerp(P.belly,bel);
   if(hawk){const band=SM(.25,.05,Math.abs(z+.05))*bel;if(band>0&&((Math.sin(x*30)+Math.sin(z*40))>.6))c.lerp(lin(0x4a2e1a),band*.8)}
   if(fal&&bel>.3&&Math.sin(z*60)>.4)c.lerp(lin(0x30343a),.45*bel);
   if(owl&&Math.sin(y*46+x*8)>.5)c.multiplyScalar(.72);if(owl&&z<-.6&&y>-.2)c.lerp(lin(0xe8e0d0),SM(-.6,-.9,z)*.6)},
  (x,y,z)=>{const k=z<0?1-.12*z*z:1-.6*z*z;return [x*k,y*k-(z<0?.0:.0)+(y<0?-.05*(1-z*z):0),z]}),M);
 torso.position.z=owl?.02:.04;body.add(torso);
 // head
 const head=new THREE.Group();head.position.set(0,owl?.12:.085,owl?-.26:-.34);body.add(head);
 const hr=owl?.15:crow?.105:fal?.1:.108;
 const hm=new THREE.Mesh(blob(hr,hr*(owl?.95:.92),hr*(owl?.95:1.12),(c,x,y,z)=>{c.copy(P.head);
   if(fal){const hood=SM(-.35,.2,y);c.copy(lin(0xdcd6cc)).lerp(P.head,hood);if(Math.abs(x)>.55&&y<.25&&y>-.8&&z<.3)c.copy(P.head)}
   if(hawk&&y<-.3)c.lerp(P.belly,.7);if(owl){const face=SM(-.2,-.75,z);c.lerp(lin(0xb08e66),face);if(face>.2&&Math.hypot(x,y+.05)>.82)c.copy(lin(0x2a2018));if(y<-.55&&z<-.3)c.copy(lin(0xf0eadc))}
   if(eag)c.copy(P.head)},(x,y,z)=>[x,y,z<0?z*(1+.12*(y>0?0:1)):z]),M);head.add(hm);
 if(crow||hawk||eag||fal){const brow=new THREE.Mesh(new THREE.BoxGeometry(hr*1.75,hr*.18,hr*.5),mat(P.head.getHex(),sheen));brow.position.set(0,hr*.42,-hr*.55);brow.rotation.x=.18;head.add(brow)}
 // beak: tapered, raptors hooked, crow long and stout
 const bl=owl?.06:crow?.16:eag?.15:.1,bw=owl?.032:crow?.042:eag?.05:.038;
 {const bg=new THREE.CylinderGeometry(.001,bw,bl,10,6);bg.translate(0,bl/2,0);bg.rotateX(-Math.PI/2);const p=bg.attributes.position;const hook=crow?.15:owl?.8:1.1;
  for(let i=0;i<p.count;i++){const z=p.getZ(i);const t=Math.max(0,Math.min(1,-z/bl));let y=p.getY(i);y*=crow?.95:1.25;y-=hook*bl*.55*Math.pow(t,2.4);if(y>0)y*=1+(1-t)*.25;p.setY(i,y)}bg.computeVertexNormals();
  const bk=new THREE.Mesh(bg,mat(C.beak,{roughness:.35}));bk.position.set(0,owl?-.03:-.02,-hr*(owl?.86:.95));head.add(bk);
  if(!crow){const cere=new THREE.Mesh(new THREE.CylinderGeometry(bw*1.05,bw*1.1,bl*.22,10).rotateX(Math.PI/2),mat(eag?0xe8b52a:owl?0x3a3028:0xe2b53c,{roughness:.6}));cere.position.set(0,owl?-.025:-.012,-hr*.98);head.add(cere)}
  if(crow){const br=new THREE.Mesh(new THREE.ConeGeometry(bw*.95,bl*.35,8).rotateX(-Math.PI/2),M);br.position.set(0,-.012,-hr*.98);head.add(br)}}
 // eyes
 const er=owl?.034:.019;const em=mat(C.eye,{roughness:.08,metalness:.1,emissive:owl?0x442200:0});
 for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(er,12,10),em);const ex=owl?.06:hr*.72,ez=owl?-hr*.82:-hr*.45;e.position.set(s*ex,owl?.02:hr*.18,ez);head.add(e);
  const pu=new THREE.Mesh(new THREE.SphereGeometry(er*.55,10,8),mat(0x030303,{roughness:.05}));pu.position.set(s*(ex+(owl?0:er*.45)),e.position.y,ez-(owl?er*.62:er*.3));head.add(pu);
  if(fal||hawk||eag){const ring=new THREE.Mesh(new THREE.TorusGeometry(er*1.05,er*.25,6,12),mat(fal?0xe8c040:0x6a5a40));ring.position.copy(e.position);ring.rotation.y=Math.PI/2*s*.9;head.add(ring)}}
 if(owl){for(const s of [-1,1]){const tf=new THREE.Mesh(new THREE.ConeGeometry(.032,.12,5).translate(0,.06,0),M.clone());tf.material=mat(0x4a3a28);tf.position.set(s*.085,.11,-.02);tf.rotation.set(-.2,0,-s*.38);head.add(tf)}}
 // tail fan
 const tg=new THREE.Group();tg.position.set(0,.02,owl?.26:.33);body.add(tg);const tm=new THREE.Mesh(tailGeo(id,P),FM);tg.add(tm);
 // wings: shoulder -> arm feathers ; wrist -> hand (primaries)
 const wings=[];
 for(const s of [-1,1]){const wp=wingParts(id,P,s);const sh=new THREE.Group();sh.rotation.order='YXZ';sh.position.set(s*(owl?.15:.12),owl?.09:.075,owl?-.1:-.14);body.add(sh);
  const arm=new THREE.Mesh(wp.arm,FM);sh.add(arm);const wr=new THREE.Group();wr.rotation.order='YXZ';wr.position.set(s*wp.A,0,0);sh.add(wr);const hand=new THREE.Mesh(wp.hand,FM);wr.add(hand);
  wings.push({sh,wr,s,side:sh,A:wp.A,chord:wp.chord})}
 // legs + talons
 const legs=new THREE.Group();body.add(legs);const lm=mat(P.leg.getHex(),{roughness:.55}),km=mat(0x141210,{roughness:.3});
 for(const s of [-1,1]){const thigh=new THREE.Mesh(new THREE.SphereGeometry(owl?.06:.045,8,6),M);thigh.scale.set(1,1.4,1.1);thigh.position.set(s*.07,-.13,.02);legs.add(thigh);
  const l=new THREE.Mesh(new THREE.CylinderGeometry(owl?.022:.012,owl?.026:.016,.13,6),owl?mat(0xbaa27e):lm);l.position.set(s*.07,-.21,.02);legs.add(l);
  for(const [a,len] of [[-.45,.075],[0,.085],[.45,.07],[Math.PI,.05]]){const t=new THREE.Group();t.position.set(s*.07,-.272,.02);t.rotation.y=a;legs.add(t);
   const toe=new THREE.Mesh(new THREE.CylinderGeometry(.006,.009,len,5).rotateX(Math.PI/2).translate(0,0,-len/2),lm);t.add(toe);
   const cl=new THREE.Mesh(new THREE.ConeGeometry(.007,.035,5).rotateX(-Math.PI/2-.8).translate(0,-.008,-len-.01),km);t.add(cl)}}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true}});
 g.scale.setScalar(sp.size*1.25);
 g.userData={body,head,wings,tail:tg,legs,phase:Math.random()*6,fold:1,flap:0,tuck:0,id,hop:0};
 return g}
// pose: mode 'fly'|'perch'; flap 0..1 intensity; tuck 0..1 dive; hop 0..1 (ground run cycle)
function animBird(b,dt,o){const u=b.userData;u.phase+=dt*(o.flapRate||9);
 const fold=o.mode==='fly'?0:1;u.fold+=(fold-u.fold)*Math.min(1,dt*7);u.tuck+=((o.tuck||0)-u.tuck)*Math.min(1,dt*5);u.flap+=((o.flap||0)-u.flap)*Math.min(1,dt*8);
 const f=u.fold,tk=u.tuck,fl=u.flap,br=o.brake||0;const ph=u.phase;
 // downstroke is faster than upstroke
 const w=Math.sin(ph)+.25*Math.sin(2*ph);const glide=.08+.03*Math.sin(ph*.25);
 const hop=o.hop||0;
 for(const Wg of u.wings){const s=Wg.s;
  const up=fl*(w*.85+.1)+(1-fl)*glide+br*.25;// dihedral/flap
  const sweep=tk*.95+br*-.15+(fl*Math.max(0,-Math.cos(ph))*.25);
  // folded pose: chord vertical against the flank, span pointing back
  const fx=1.25,fy=1.5;
  Wg.sh.rotation.x=f*fx+(1-f)*(fl*Math.cos(ph)*.12-br*.25);
  Wg.sh.rotation.y=-s*(f*fy+(1-f)*(sweep*.55));
  Wg.sh.rotation.z=s*((1-f)*up+f*(-.08+hop*.25*Math.max(0,Math.sin(ph*1.3))));
  // wrist: lags the shoulder; folds back on upstroke; tucked into a teardrop in a dive
  Wg.wr.rotation.z=s*(1-f)*(fl*(Math.sin(ph-1.1)*.55)+(1-fl)*-.04);
  Wg.wr.rotation.y=-s*((1-f)*(sweep*.9+fl*Math.max(0,Math.cos(ph))*.45)+f*.12);
  Wg.wr.rotation.x=(1-f)*fl*Math.cos(ph-1)*.15}
 u.body.rotation.x=f*hop*.12;
 u.tail.rotation.x=(o.mode==='fly'?-.04+tk*.05:.28)+br*.35-hop*.15;u.tail.scale.x=1+br*.9+(1-f)*(1-tk)*.25-tk*.35;u.tail.scale.z=1-tk*.1;
 u.legs.visible=o.mode!=='fly'||br>.3;u.legs.rotation.x=o.mode==='fly'?-.6+br*.6:0;
 u.head.rotation.y=o.look||0;u.head.rotation.x=(o.peck||0)-f*hop*.1}
window.BIRDS={SPECIES,ORDER,makeBird,animBird};
})();
