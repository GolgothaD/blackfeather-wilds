// Blackfeather Wilds — world generation (terrain, water, forest, ruins, sky)
(function(){
'use strict';
const SEED=1337;
function hash(i,j){let h=Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(SEED,144665)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967295}
function vnoise(x,z){const ix=Math.floor(x),iz=Math.floor(z);let fx=x-ix,fz=z-iz;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);
 const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz}
function fbm(x,z,o){let s=0,a=.5,f=1,t=0;for(let i=0;i<o;i++){s+=a*vnoise(x*f+i*17.3,z*f-i*9.1);t+=a;a*=.5;f*=2.03}return s/t}
const sm=(a,b,x)=>{let t=(x-a)/(b-a);t=t<0?0:t>1?1:t;return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
const SIZE=1600,HALF=800;
const LAKE={x:220,z:330,r:140},POND={x:-380,z:180,r:34};
function riverX(z){return -60+280*sm(-320,260,z)+45*Math.sin(z*.012)}
function mountain(x,z){return sm(-240,-560,z)}
function H(x,z){
 let h=(fbm(x*.0022+3,z*.0022-7,5)-.45)*62+15;
 h+=(fbm(x*.013,z*.013,3)-.5)*6;
 const m=mountain(x,z);
 if(m>0){const r=1-Math.abs(fbm(x*.006+11,z*.006+5,4)*2-1);h+=m*(r*r*150+28);
  const st=13,hs=h/st,fl=Math.floor(hs),fr=hs-fl;h=mix(h,(fl+sm(.3,.7,fr))*st,m*.75)}
 const e=Math.max(Math.abs(x),Math.abs(z));if(e>600)h+=sm(600,790,e)*(110+40*vnoise(x*.01,z*.01));
 // river
 if(z>-340&&z<300){const d=Math.abs(x-riverX(z));if(d<40){const rm=(1-sm(7,32,d))*sm(-335,-295,z);h=Math.min(h,mix(h,-2.6,rm))}}
 // lake
 let dl=Math.hypot(x-LAKE.x,z-LAKE.z)+(vnoise(x*.02,z*.02)-.5)*40;if(dl<200){h=mix(h,-8,1-sm(LAKE.r-40,LAKE.r+30,dl))}
 const dp=Math.hypot(x-POND.x,z-POND.z)+(vnoise(x*.05,z*.05)-.5)*10;if(dp<70)h=mix(h,-2.2,1-sm(POND.r-12,POND.r+18,dp));
 // flatten ruins hill top a bit
 return h}
function normalAt(x,z){const e=1.5;const hx=H(x+e,z)-H(x-e,z),hz=H(x,z+e)-H(x,z-e);const n=new THREE.Vector3(-hx,2*e,-hz);return n.normalize()}
function forestMask(x,z){return fbm(x*.004+40,z*.004+40,3)}
const W={H,fbm,vnoise,sm,normalAt,SIZE,HALF,LAKE,POND,riverX,forestMask,WATER:0};
function rng(s){return function(){s=Math.imul(s^(s>>>15),2246822507)+0x6D2B79F5|0;s^=s>>>13;return ((s>>>0)%1e9)/1e9}}
W.rng=rng;
// ----- geometry helpers
function mergeGeos(list){let n=0;const parts=list.map(g=>{g=g.index?g.toNonIndexed():g;n+=g.attributes.position.count;return g});
 const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),C=new Float32Array(n*3);let o=0;
 for(const g of parts){const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);
  if(g.attributes.uv)U.set(g.attributes.uv.array,o*2);if(g.attributes.color)C.set(g.attributes.color.array,o*3);else C.fill(1,o*3,(o+c)*3);o+=c}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(P,3));r.setAttribute('normal',new THREE.BufferAttribute(N,3));r.setAttribute('uv',new THREE.BufferAttribute(U,2));r.setAttribute('color',new THREE.BufferAttribute(C,3));return r}
function colorize(g,c,jit,r){const p=g.attributes.position,col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const k=1+(r()-.5)*jit;col[i*3]=c[0]*k;col[i*3+1]=c[1]*k;col[i*3+2]=c[2]*k}g.setAttribute('color',new THREE.BufferAttribute(col,3));return g}
function lumpy(g,amt,r,f){const p=g.attributes.position;const v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=1+(vnoise(v.x*f+9,v.y*f+v.z*f)-.5)*amt;p.setXYZ(i,v.x*k,v.y*k,v.z*k)}g.computeVertexNormals();return g}
W.mergeGeos=mergeGeos;W.colorize=colorize;
// ----- textures
const TL=new THREE.TextureLoader();
function tex(n,srgb,rep){const t=TL.load('tex/'+n+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(rep)t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return t}
W.build=function(scene,Q){ // Q: quality {seg,trees,grass,shadows}
 const r=rng(99);W.scene=scene;
 const T={grass:tex('Grass004_c',1),dirt:tex('Ground037_c',1),rock:tex('Rock030_c',1),rockN:tex('Rock030_n'),bark:tex('Bark007_c',1,[1,3]),barkN:tex('Bark007_n',0,[1,3]),moss:tex('Moss002_c',1)};
 W.T=T;
 // ---- terrain
 W.terrainMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,metalness:0});
 W.terrainMat.onBeforeCompile=sh=>{
  sh.uniforms.tG={value:T.grass};sh.uniforms.tD={value:T.dirt};sh.uniforms.tR={value:T.rock};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aMix;varying vec2 vMix;varying vec3 vWP;varying vec3 vWN;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvMix=aMix;vWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tG,tD,tR;varying vec2 vMix;varying vec3 vWP;varying vec3 vWN;')
   .replace('#include <map_fragment>',`
   vec3 gA=texture2D(tG,vWP.xz*.16).rgb,gB=texture2D(tG,vWP.xz*.031+.37).rgb;vec3 g=mix(gA,gB,.45)*vec3(.92,1.,.82);
   vec3 dd=mix(texture2D(tD,vWP.xz*.11).rgb,texture2D(tD,vWP.xz*.027).rgb,.4);
   vec3 an=abs(vWN);an/=an.x+an.y+an.z;
   vec3 rk=texture2D(tR,vWP.xz*.045).rgb*an.y+texture2D(tR,vWP.zy*.045).rgb*an.x+texture2D(tR,vWP.xy*.045).rgb*an.z;
   float slope=1.-vWN.y;float wr=max(smoothstep(.25,.45,slope),smoothstep(85.,125.,vWP.y)*.85);
   float sand=1.-smoothstep(.6,2.4,vWP.y);
   vec3 col=mix(g,dd*vec3(.9,.85,.8),clamp(vMix.x,0.,1.));col=mix(col,dd*vec3(.55,.5,.42),clamp(vMix.y,0.,1.)*.8);
   col=mix(col,dd*vec3(1.15,1.05,.85),sand);col=mix(col,rk*vec3(.95,.95,1.),wr);
   col*=mix(1.,.55,smoothstep(0.,-3.,vWP.y));
   diffuseColor.rgb*=col;`);
 };
 W.buildTerrain=function(seg){
  if(W.terrain){scene.remove(W.terrain);W.terrain.geometry.dispose()}
  const g=new THREE.PlaneGeometry(SIZE,SIZE,seg,seg);g.rotateX(-Math.PI/2);const p=g.attributes.position;const mixA=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,H(x,z));
   mixA[i*2]=sm(.58,.72,fbm(x*.01+5,z*.01+2,3));mixA[i*2+1]=sm(.55,.7,forestMask(x,z))}
  g.setAttribute('aMix',new THREE.BufferAttribute(mixA,2));g.computeVertexNormals();
  const m=new THREE.Mesh(g,W.terrainMat);m.receiveShadow=true;scene.add(m);W.terrain=m};
 W.buildTerrain(Q.seg);
 // ---- water
 const wc=document.createElement('canvas');wc.width=wc.height=256;const wx=wc.getContext('2d');const id=wx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){let nx=0,ny=0;for(let k=1;k<=4;k++){const f=k*2*Math.PI/256*(k+1);const a=1/k;nx+=a*Math.cos(x*f*1+y*f*.3*k)*.5;ny+=a*Math.cos(y*f+x*f*.2*(5-k))*.5}
  const o=(y*256+x)*4;id.data[o]=128+nx*60;id.data[o+1]=128+ny*60;id.data[o+2]=255;id.data[o+3]=255}
 wx.putImageData(id,0,0);const wn=new THREE.CanvasTexture(wc);wn.wrapS=wn.wrapT=THREE.RepeatWrapping;wn.repeat.set(160,160);
 W.waterMat=new THREE.MeshStandardMaterial({color:0x1b3640,roughness:.06,metalness:.25,transparent:true,opacity:.86,normalMap:wn,normalScale:new THREE.Vector2(.35,.35),envMapIntensity:1});
 const water=new THREE.Mesh(new THREE.PlaneGeometry(SIZE*2.2,SIZE*2.2,1,1).rotateX(-Math.PI/2),W.waterMat);water.position.y=0;water.receiveShadow=true;scene.add(water);W.water=water;
 // ---- trees
 const nearFade=m=>{m.onBeforeCompile=sh=>{sh.uniforms.uNearF=W.nearF;sh.fragmentShader=sh.fragmentShader.replace('void main() {','uniform float uNearF;\nvoid main() {\n float cdz=length(vViewPosition); if(cdz<uNearF){ float dth=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453); if(dth>(cdz-1.2)/(uNearF-1.2)) discard; }')}};W.nearF={value:5};
 const barkMat=new THREE.MeshStandardMaterial({map:T.bark,normalMap:T.barkN,roughness:.95,color:0x9a8f80});
 const leafMat=new THREE.MeshStandardMaterial({map:T.moss,vertexColors:true,roughness:.9,color:0xffffff});
 const pineMat=new THREE.MeshStandardMaterial({map:T.moss,vertexColors:true,roughness:.92,color:0xffffff});nearFade(barkMat);nearFade(leafMat);nearFade(pineMat);
 const geo={};
 geo.pineT=new THREE.CylinderGeometry(.09,.3,1,7,1).translate(0,.5,0);
 {const cs=[];for(let i=0;i<5;i++){const y=.22+i*.16,rad=.42-i*.075;const c=new THREE.ConeGeometry(rad,.32,9,2).translate(0,y+.16,0);lumpy(c,.3,r,9);colorize(c,[.16,.27,.15],.25,r);cs.push(c)}geo.pineF=mergeGeos(cs)}
 geo.broadT=mergeGeos([new THREE.CylinderGeometry(.12,.25,.62,7).translate(0,.31,0),new THREE.CylinderGeometry(.04,.08,.35,5).rotateZ(.8).translate(.12,.55,0),new THREE.CylinderGeometry(.04,.08,.32,5).rotateZ(-.9).rotateY(1.5).translate(0,.55,-.12)]);
 {const bs=[];const pts=[[0,.78,0,.3],[.2,.68,.08,.22],[-.18,.66,-.06,.23],[.05,.66,-.2,.2],[-.06,.7,.2,.21],[0,.95,0,.2]];for(const [x,y,z,s] of pts){const b=new THREE.IcosahedronGeometry(s,2);lumpy(b,.45,r,7);b.translate(x,y,z);colorize(b,[.22,.31,.14],.3,r);bs.push(b)}geo.broadF=mergeGeos(bs)}
 geo.snag=mergeGeos([new THREE.CylinderGeometry(.08,.22,1,6).translate(0,.5,0),new THREE.CylinderGeometry(.025,.05,.4,5).rotateZ(1).translate(.17,.7,0),new THREE.CylinderGeometry(.02,.045,.34,5).rotateZ(-1.1).translate(-.14,.55,0),new THREE.CylinderGeometry(.02,.04,.3,5).rotateX(1).translate(0,.82,.12)]);
 // scatter
 const trees=[];W.trees=trees;W.perches=[];
 const MAXT=2600;let tries=0;
 while(trees.length<MAXT&&tries<60000){tries++;const x=(r()-.5)*1500,z=(r()-.5)*1500;const h=H(x,z);if(h<1.6||h>120)continue;
  const n=normalAt(x,z);if(n.y<.82)continue;const f=forestMask(x,z);const dens=sm(.42,.62,f)*.95+.05;if(r()>dens)continue;
  if(Math.hypot(x-LAKE.x,z-LAKE.z)<LAKE.r+8)continue;
  const pine=h>40||f>.6&&r()<.55||r()<.3;const snag=r()<.05;const ht=snag?9+r()*7:pine?11+r()*13:9+r()*8;
  trees.push({x,z,y:h-.3,ht,type:snag?2:pine?0:1,w:snag?ht*.8:pine?ht*.55:ht*.95,rot:r()*6.28,tint:.8+r()*.4})}
 // ancient giants
 const giants=[[-120,40],[60,-120],[-300,-60],[380,60],[-520,380],[90,520]];
 for(const [x,z] of giants){const h=H(x,z);if(h<1)continue;trees.push({x,z,y:h-.5,ht:38+r()*8,type:1,w:44,rot:r()*6,tint:.85,giant:true})}
 // sort into chunks
 const CH=4,cs=SIZE/CH;W.chunks=[];
 for(let i=0;i<CH*CH;i++)W.chunks.push({list:[],meshes:[],cx:(i%CH+.5)*cs-HALF,cz:(Math.floor(i/CH)+.5)*cs-HALF});
 trees.forEach((t,i)=>{t.id=i;const ci=Math.min(CH-1,Math.floor((t.x+HALF)/cs))+Math.min(CH-1,Math.floor((t.z+HALF)/cs))*CH;W.chunks[ci].list.push(t);
  W.perches.push({x:t.x,y:t.y+t.ht*(t.type===0?1.02:t.type===2?1:.99)*(t.giant?1:1),z:t.z,tree:i,kind:'tree'});
  if(t.giant){/* branch perches */for(let k=0;k<3;k++){const a=t.rot+k*2.1;W.perches.push({x:t.x+Math.cos(a)*t.w*.22,y:t.y+t.ht*.7,z:t.z+Math.sin(a)*t.w*.22,tree:i,kind:'branch'})}}});
 const M=new THREE.Matrix4(),q=new THREE.Quaternion(),S=new THREE.Vector3(),P=new THREE.Vector3(),C=new THREE.Color(),Y=new THREE.Vector3(0,1,0);
 for(const ch of W.chunks){
  const byType=[[],[],[]];ch.list.forEach(t=>byType[t.type].push(t));
  const defs=[[geo.pineT,barkMat,0],[geo.pineF,pineMat,0],[geo.broadT,barkMat,1],[geo.broadF,leafMat,1],[geo.snag,barkMat,2]];
  for(const [g,mat,ty] of defs){const L=byType[ty];if(!L.length)continue;const im=new THREE.InstancedMesh(g,mat,L.length);
   L.forEach((t,k)=>{q.setFromAxisAngle(Y,t.rot);S.set(t.w,t.ht,t.w);if(g===geo.pineT||g===geo.broadT||g===geo.snag){const k=t.ht*(t.giant?.3:ty===0?.07:ty===2?.09:.13);S.set(k,t.ht,k)};P.set(t.x,t.y,t.z);M.compose(P,q,S);im.setMatrixAt(k,M);
    C.setRGB(t.tint,t.tint*(.95+((t.id*7)%10)/60),t.tint*.9);im.setColorAt(k,C)});
   im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();im.userData.list=L;scene.add(im);ch.meshes.push(im)}}
 W.setTreeDensity=function(frac){for(const ch of W.chunks)for(const im of ch.meshes){const L=im.userData.list;let c=0;
  // keep giants, take a prefix fraction (trees were shuffled randomly by generation)
  const keep=L.filter((t,i)=>t.giant||((t.id*2654435761>>>0)%1000)/1000<frac);c=keep.length;
  // reorder instance buffer so kept trees come first
  if(!im.userData.orig){im.userData.orig=im.instanceMatrix.array.slice();im.userData.origC=im.instanceColor.array.slice()}
  const om=im.userData.orig,oc=im.userData.origC;let k=0;L.forEach((t,i)=>{if(keep.includes(t)){im.instanceMatrix.array.set(om.subarray(i*16,i*16+16),k*16);im.instanceColor.array.set(oc.subarray(i*3,i*3+3),k*3);k++}});
  im.count=c;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;im.userData.frac=frac}
  W.treeFrac=frac;W.activePerches=W.perches.filter(p=>p.kind!=='tree'||W.trees[p.tree].giant||((W.trees[p.tree].id*2654435761>>>0)%1000)/1000<frac||p.kind==='rock'||p.kind==='stone')};
 // ---- rocks & boulders
 const rockMat=new THREE.MeshStandardMaterial({map:T.rock,normalMap:T.rockN,roughness:.9,color:0xb0aaa2});
 {const g=lumpy(new THREE.DodecahedronGeometry(1,1),.5,r,1.3);const N=260;const im=new THREE.InstancedMesh(g,rockMat,N);let k=0;
  for(let t=0;t<4000&&k<N;t++){const x=(r()-.5)*1450,z=(r()-.5)*1450;const h=H(x,z);if(h<.5)continue;const n=normalAt(x,z);if(n.y>.9&&r()<.85)continue;
   const s=1.2+r()*r()*5;q.setFromEuler(new THREE.Euler(r()*3,r()*3,r()*3));S.set(s,s*(.6+r()*.5),s*(.8+r()*.4));P.set(x,h+s*.15,z);M.compose(P,q,S);im.setMatrixAt(k++,M);
   W.perches.push({x,y:h+s*.15+s*.55*(.6+.25),z,kind:'rock'})}
  im.count=k;im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);W.rocks=im}
 // ---- ruins: ring of the Old Watchers + broken arch (ancient megastructure)
 const stoneMat=new THREE.MeshStandardMaterial({map:T.rock,normalMap:T.rockN,roughness:.85,color:0x9c978d});
 W.ruins=[];
 {const cx=-240,cz=-170;const ch=H(cx,cz);W.RUINS={x:cx,z:cz,y:ch};const g=new THREE.BoxGeometry(1,1,1,2,4,2);lumpy(g,.08,r,3);const N=14;const im=new THREE.InstancedMesh(g,stoneMat,N+3);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const x=cx+Math.cos(a)*24,z=cz+Math.sin(a)*24;const h=H(x,z);const ht=i%4===1?5:9+r()*5;
   q.setFromAxisAngle(Y,-a+(r()-.5)*.2);const tilt=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),(r()-.5)*.12);q.multiply(tilt);
   S.set(3,ht,1.8);P.set(x,h+ht/2-1,z);M.compose(P,q,S);im.setMatrixAt(i,M);W.perches.push({x,y:h+ht-1,z,kind:'stone'});W.ruins.push({x,z})}
  // central altar + lintel
  S.set(6,2,6);P.set(cx,ch+.6,cz);q.identity();M.compose(P,q,S);im.setMatrixAt(12,M);W.perches.push({x:cx,y:ch+1.6,z:cz,kind:'stone'});
  // giant arch on the cliffs
  const ax=80,az=-420;const ah=H(ax,az);W.ARCH={x:ax,z:az,y:ah};
  [[-14,0],[14,0]].forEach(([dx],j)=>{S.set(6,40,6);P.set(ax+dx,ah+18,az);q.identity();M.compose(P,q,S);im.setMatrixAt(13+j,M)});
  S.set(40,6,7);P.set(ax,ah+40,az);M.compose(P,q,S);im.setMatrixAt(15,M);W.perches.push({x:ax,y:ah+43,z:az,kind:'stone'},{x:ax-14,y:ah+43,z:az,kind:'stone'},{x:ax+14,y:ah+43,z:az,kind:'stone'});
  im.count=16;im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();scene.add(im)}
 // ---- fallen logs (grubs), bushes (berries)
 W.logs=[];W.bushes=[];
 {const g=new THREE.CylinderGeometry(.35,.4,5,8).rotateZ(Math.PI/2);const im=new THREE.InstancedMesh(g,barkMat,40);let k=0;
  for(let t=0;t<3000&&k<40;t++){const x=(r()-.5)*1300,z=(r()-.5)*1300;const h=H(x,z);if(h<2||h>60)continue;if(forestMask(x,z)<.5)continue;
   q.setFromAxisAngle(Y,r()*6);P.set(x,h+.25,z);S.set(1,1,1);M.compose(P,q,S);im.setMatrixAt(k++,M);W.logs.push({x,z,y:h+.5,grubs:1,t:0})}
  im.count=k;im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();scene.add(im)}
 {const g=lumpy(new THREE.IcosahedronGeometry(.9,2),.5,r,2);colorize(g,[.2,.3,.13],.3,r);const im=new THREE.InstancedMesh(g,leafMat,70);
  const bg=new THREE.SphereGeometry(.09,6,4);const bm=new THREE.MeshStandardMaterial({color:0x8a0e1e,roughness:.35,emissive:0x220004});const bi=new THREE.InstancedMesh(bg,bm,70*7);let k=0,bk=0;
  for(let t=0;t<4000&&k<70;t++){const x=(r()-.5)*1300,z=(r()-.5)*1300;const h=H(x,z);if(h<2||h>45)continue;if(normalAt(x,z).y<.9)continue;
   const s=.8+r()*.6;q.setFromAxisAngle(Y,r()*6);P.set(x,h+.45*s,z);S.set(s,s*.75,s);M.compose(P,q,S);im.setMatrixAt(k,M);
   const b={x,z,y:h+.5,ripe:1,t:0,bi:[]};for(let j=0;j<7;j++){const a=j*.9+r(),e=r()*.9;P.set(x+Math.cos(a)*.85*s*Math.cos(e),h+.45*s+Math.sin(e)*.6*s,z+Math.sin(a)*.85*s*Math.cos(e));M.compose(P,q.identity(),S.set(1,1,1));bi.setMatrixAt(bk,M);b.bi.push(bk++)}
   W.bushes.push(b);k++}
  im.count=k;bi.count=bk;im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();bi.computeBoundingSphere();scene.add(im,bi);W.berryMesh=bi}
 // ---- grass tufts (cosmetic)
 {const blades=[];for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const b=new THREE.PlaneGeometry(.07,.7,1,2);const p=b.attributes.position;for(let j=0;j<p.count;j++){if(p.getY(j)>.3)p.setX(j,p.getX(j)*.1)}b.translate(0,.35,0).rotateX(-.3).rotateY(a).translate(Math.cos(a)*.1,0,Math.sin(a)*.1);colorize(b,[.3,.42,.16],.4,r);blades.push(b)}
  const g=mergeGeos(blades);const gm=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});const N=9000;const im=new THREE.InstancedMesh(g,gm,N);let k=0;
  for(let t=0;t<40000&&k<N;t++){const x=(r()-.5)*1400,z=(r()-.5)*1400;const h=H(x,z);if(h<1.2||h>70)continue;if(normalAt(x,z).y<.88)continue;
   q.setFromAxisAngle(Y,r()*6);const s=.7+r()*.9;P.set(x,h-.05,z);S.set(s,s*(.7+r()*.6),s);M.compose(P,q,S);im.setMatrixAt(k++,M)}
  im.count=k;im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);W.grass=im;W.grassMax=k}
 // spatial grid for perches
 W.indexPerches=function(){const G=new Map();W.pgrid=G;for(const p of (W.activePerches||W.perches)){const k=Math.floor(p.x/40)+','+Math.floor(p.z/40);if(!G.has(k))G.set(k,[]);G.get(k).push(p)}};
 W.nearPerches=function(x,z,rad){const out=[];const r0=Math.ceil(rad/40);const ix=Math.floor(x/40),iz=Math.floor(z/40);for(let i=-r0;i<=r0;i++)for(let j=-r0;j<=r0;j++){const L=W.pgrid.get((ix+i)+','+(iz+j));if(L)for(const p of L)out.push(p)}return out};
 W.setTreeDensity(Q.trees);W.indexPerches();
 W.grass.count=Q.grass?W.grassMax:0;
 // minimap image
 const mc=document.createElement('canvas');mc.width=mc.height=200;const mx=mc.getContext('2d');const mi=mx.createImageData(200,200);
 for(let y=0;y<200;y++)for(let x=0;x<200;x++){const wx2=x/200*SIZE-HALF,wz=y/200*SIZE-HALF;const h=H(wx2,wz);let c;
  if(h<0)c=[38,70,86];else if(h<1.8)c=[150,140,100];else if(h>85)c=[130,128,124];else{const f=forestMask(wx2,wz);c=f>.55?[34,62,34]:[78,104,52];const s=normalAt(wx2,wz).y;if(s<.75)c=[110,106,98]}
  const sh=.75+Math.min(.4,h/250);const o=(y*200+x)*4;mi.data[o]=c[0]*sh;mi.data[o+1]=c[1]*sh;mi.data[o+2]=c[2]*sh;mi.data[o+3]=255}
 mx.putImageData(mi,0,0);W.mapImg=mc;
};
// ---- sky
W.makeSky=function(scene){
 const g=new THREE.SphereGeometry(4000,32,16);
 const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sunDir:{value:new THREE.Vector3(0,1,0)},top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunCol:{value:new THREE.Color()},night:{value:0},storm:{value:0}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader:`uniform vec3 sunDir,top,hor,sunCol;uniform float night,storm;varying vec3 vD;
  float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
  void main(){float y=max(vD.y,0.);vec3 c=mix(hor,top,pow(y,.55));float s=max(dot(vD,sunDir),0.);
   c+=sunCol*(pow(s,900.)*14.+pow(s,8.)*.35)*(1.-storm*.9);
   vec3 q=floor(vD*360.);float st=step(.9975,h(q))*night*smoothstep(0.,.2,vD.y)*(1.-storm);c+=vec3(st);
   if(vD.y<0.)c=hor*mix(1.,.6,clamp(-vD.y*4.,0.,1.));
   gl_FragColor=vec4(c,1.);}`});
 const s=new THREE.Mesh(g,m);s.renderOrder=-1;s.frustumCulled=false;scene.add(s);return s};
window.W=W;
})();
