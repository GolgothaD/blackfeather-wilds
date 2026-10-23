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
const WF={x:riverX(-306),z:-309,top:27};
function mountain(x,z){return sm(-240,-560,z)}
function H(x,z){
 let h=(fbm(x*.0022+3,z*.0022-7,5)-.45)*62+15;
 h+=(fbm(x*.013,z*.013,3)-.5)*6;
 const m=mountain(x,z);
 if(m>0){const r=1-Math.abs(fbm(x*.006+11,z*.006+5,4)*2-1);h+=m*(r*r*150+28);
  const st=13,hs=h/st,fl=Math.floor(hs),fr=hs-fl;h=mix(h,(fl+sm(.3,.7,fr))*st,m*.75)}
 const e=Math.max(Math.abs(x),Math.abs(z));if(e>600)h+=sm(600,790,e)*(110+40*vnoise(x*.01,z*.01));
 // waterfall cliff at river head
 {const dwx=x-WF.x;if(Math.abs(dwx)<60&&z>-352&&z<-296){const side=1-sm(28,58,Math.abs(dwx));const top=WF.top;
  if(z<-310){h=mix(h,Math.max(h,top),side);if(Math.abs(dwx)<7)h=Math.min(h,top-1.8+sm(2,7,Math.abs(dwx))*1.8)}
  else{const k=sm(-310,-306,z);h=mix(h,mix(Math.max(h,top),h,k),side)}}}
 // river
 if(z>-340&&z<300){const d=Math.abs(x-riverX(z));if(d<40){const rm=(1-sm(7,32,d))*sm(-335,-295,z);h=Math.min(h,mix(h,-2.6,rm))}}
 // lake
 let dl=Math.hypot(x-LAKE.x,z-LAKE.z)+(vnoise(x*.02,z*.02)-.5)*40;if(dl<200){h=mix(h,-8,1-sm(LAKE.r-40,LAKE.r+30,dl))}
 const dp=Math.hypot(x-POND.x,z-POND.z)+(vnoise(x*.05,z*.05)-.5)*10;if(dp<70)h=mix(h,-2.2,1-sm(POND.r-12,POND.r+18,dp));
 // flatten ruins hill top a bit
 return h}
function normalAt(x,z){const e=1.5;const hx=H(x+e,z)-H(x-e,z),hz=H(x,z+e)-H(x,z-e);const n=new THREE.Vector3(-hx,2*e,-hz);return n.normalize()}
function forestMask(x,z){return fbm(x*.004+40,z*.004+40,3)}
const W={WF,H,fbm,vnoise,sm,normalAt,SIZE,HALF,LAKE,POND,riverX,forestMask,WATER:0};
function rng(s){return function(){s=Math.imul(s^(s>>>15),2246822507)+0x6D2B79F5|0;s^=s>>>13;return ((s>>>0)%1e9)/1e9}}
W.rng=rng;
// ----- geometry helpers
function mergeGeos(list){let n=0;const parts=list.map(g=>{g=g.index?g.toNonIndexed():g;n+=g.attributes.position.count;return g});
 const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),C=new Float32Array(n*3);let o=0;
 for(const g of parts){const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);
  if(g.attributes.uv)U.set(g.attributes.uv.array,o*2);if(g.attributes.color)C.set(g.attributes.color.array,o*3);else C.fill(1,o*3,(o+c)*3);o+=c}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(P,3));r.setAttribute('normal',new THREE.BufferAttribute(N,3));r.setAttribute('uv',new THREE.BufferAttribute(U,2));r.setAttribute('color',new THREE.BufferAttribute(C,3));return r}
function colorize(g,c,jit,r){const p=g.attributes.position,col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const k=1+(r()-.5)*jit;col[i*3]=c[0]*k;col[i*3+1]=c[1]*k;col[i*3+2]=c[2]*k}g.setAttribute('color',new THREE.BufferAttribute(col,3));return g}
function lumpy(g,amt,r,f){const p=g.attributes.position;const v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=1+(vnoise(v.x*f+9,v.y*f+v.z*f)-.5)*amt;p.setXYZ(i,v.x*k,v.y*k,v.z*k)}g.computeVertexNormals();if(g.type!=='BoxGeometry')smoothN(g);return g}
// position-welded smooth normals (kills the flat facets of Icosa/Dodeca/Cone, keeps UVs)
function smoothN(g){const p=g.attributes.position,ix=g.index,n=p.count;const key=new Array(n),acc=new Map();for(let i=0;i<n;i++)key[i]=Math.round(p.getX(i)*2e3)+','+Math.round(p.getY(i)*2e3)+','+Math.round(p.getZ(i)*2e3);
 const A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3(),F=new THREE.Vector3();const T=ix?ix.count/3:n/3;
 for(let t=0;t<T;t++){const a=ix?ix.getX(t*3):t*3,b=ix?ix.getX(t*3+1):t*3+1,c=ix?ix.getX(t*3+2):t*3+2;A.fromBufferAttribute(p,a);B.fromBufferAttribute(p,b);C.fromBufferAttribute(p,c);F.subVectors(C,B).cross(A.sub(B));
  for(const v of [a,b,c]){let s=acc.get(key[v]);if(!s){s=[0,0,0];acc.set(key[v],s)}s[0]+=F.x;s[1]+=F.y;s[2]+=F.z}}
 const N=new Float32Array(n*3);for(let i=0;i<n;i++){const s=acc.get(key[i]);const l=Math.hypot(s[0],s[1],s[2])||1;N[i*3]=s[0]/l;N[i*3+1]=s[1]/l;N[i*3+2]=s[2]/l}
 g.setAttribute('normal',new THREE.BufferAttribute(N,3));return g}
// world-space triplanar texturing for meshes without good UVs (rocks, stones)
function triplanar(m,sc){const prev=m.onBeforeCompile;m.onBeforeCompile=sh=>{prev&&prev(sh);sh.uniforms.uTS={value:sc};
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTP;varying vec3 vTN;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n{vec4 tw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\ntw=instanceMatrix*tw;\n#endif\nvTP=(modelMatrix*tw).xyz;vTN=normalize(mat3(modelMatrix)*objectNormal);\n#ifdef USE_INSTANCING\nvTN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*objectNormal);\n#endif\n}');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTP;varying vec3 vTN;uniform float uTS;')
  .replace('#include <map_fragment>','{vec3 bw=pow(abs(normalize(vTN)),vec3(4.));bw/=bw.x+bw.y+bw.z;vec3 tc=texture2D(map,vTP.zy*uTS).rgb*bw.x+texture2D(map,vTP.xz*uTS).rgb*bw.y+texture2D(map,vTP.xy*uTS).rgb*bw.z;diffuseColor.rgb*=tc;}')
  .replace('#include <normal_fragment_maps>','{vec3 bw=pow(abs(normalize(vTN)),vec3(4.));bw/=bw.x+bw.y+bw.z;vec3 a=texture2D(normalMap,vTP.zy*uTS).xyz*2.-1.,b2=texture2D(normalMap,vTP.xz*uTS).xyz*2.-1.,c2=texture2D(normalMap,vTP.xy*uTS).xyz*2.-1.;\n vec3 wn=normalize(vTN);wn=normalize(wn+(vec3(0.,a.y,a.x)*bw.x+vec3(b2.x,0.,b2.y)*bw.y+vec3(c2.x,c2.y,0.)*bw.z)*.55);normal=normalize((viewMatrix*vec4(wn,0.)).xyz);}')};
 m.customProgramCacheKey=()=>'tri'+sc}

W.mergeGeos=mergeGeos;W.colorize=colorize;W.smoothN=smoothN;W.triplanar=triplanar;W.lumpy=lumpy;
// ----- textures
const TL=new THREE.TextureLoader();
function tex(n,srgb,rep){const t=TL.load('tex/'+n+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(rep)t.repeat.set(rep[0],rep[1]);t.anisotropy=W.maxAniso||4;return t}
W.build=function(scene,Q){ // Q: quality {seg,trees,grass,shadows}
 const r=rng(99);W.scene=scene;
 const T={grass:tex('Grass004_c',1),dirt:tex('Ground037_c',1),rock:tex('Rock030_c',1),rockN:tex('Rock030_n'),bark:tex('Bark007_c',1,[1,3]),barkN:tex('Bark007_n',0,[1,3]),moss:tex('Moss002_c',1),grassN:tex('Grass004_n'),dirtN:tex('Ground037_n'),mossN:tex('Moss002_n')};
 W.T=T;
 // ---- terrain
 W.terrainMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,metalness:0});
 W.terrainMat.onBeforeCompile=sh=>{
  sh.uniforms.tG={value:T.grass};sh.uniforms.tD={value:T.dirt};sh.uniforms.tR={value:T.rock};sh.uniforms.tGN={value:T.grassN};sh.uniforms.tDN={value:T.dirtN};sh.uniforms.tRN={value:T.rockN};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aMix;varying vec2 vMix;varying vec3 vWP;varying vec3 vWN;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvMix=aMix;vWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tG,tD,tR,tGN,tDN,tRN;varying vec2 vMix;varying vec3 vWP;varying vec3 vWN;')
   .replace('#include <map_fragment>',`
   vec3 gA=texture2D(tG,vWP.xz*.16).rgb,gB=texture2D(tG,vWP.xz*.031+.37).rgb;vec3 g=mix(gA,gB,.45)*vec3(.92,1.,.82);
   vec3 dd=mix(texture2D(tD,vWP.xz*.11).rgb,texture2D(tD,vWP.xz*.027).rgb,.4);
   vec3 an=abs(vWN);an/=an.x+an.y+an.z;
   vec3 rk=texture2D(tR,vWP.xz*.045).rgb*an.y+texture2D(tR,vWP.zy*.045).rgb*an.x+texture2D(tR,vWP.xy*.045).rgb*an.z;
   float slope=1.-vWN.y;float wr=max(smoothstep(.25,.45,slope),smoothstep(85.,125.,vWP.y)*.85);
   float sand=1.-smoothstep(.6,2.4,vWP.y);
   vec3 col=mix(g,dd*vec3(.9,.85,.8),clamp(vMix.x,0.,1.));col=mix(col,dd*vec3(.55,.5,.42),clamp(vMix.y,0.,1.)*.8);
   col=mix(col,dd*vec3(1.15,1.05,.85),sand);col=mix(col,rk*vec3(.95,.95,1.),wr);
   float var=texture2D(tD,vWP.xz*.0047+.31).r;float var2=texture2D(tG,vWP.xz*.0021).g;
   col*=mix(.8,1.15,var);col=mix(col,col*vec3(1.12,.98,.66),smoothstep(.5,.72,var2)*(1.-wr)*(1.-clamp(vMix.y,0.,1.))*.55);
   col=mix(col,col*vec3(.78,.9,.7),clamp(vMix.y,0.,1.)*.35);
   col*=mix(1.,.55,smoothstep(0.,-3.,vWP.y));
   float wDirt=clamp(max(max(vMix.x,vMix.y*.8),sand),0.,1.);
   diffuseColor.rgb*=col;`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   { vec3 nG=texture2D(tGN,vWP.xz*.16).xyz*2.-1.; vec3 nD=texture2D(tDN,vWP.xz*.11).xyz*2.-1.; vec3 nR=texture2D(tRN,vWP.xz*.045).xyz*2.-1.;
     vec3 nt=mix(mix(nG,nD,wDirt),nR,wr); float fd=1.-smoothstep(30.,140.,length(vViewPosition));
     vec3 wn=normalize(vWN+vec3(nt.x,0.,-nt.y)*.9*fd);
     normal=normalize((viewMatrix*vec4(wn,0.)).xyz); }`);
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
 W.wT={value:0};W.waterMat.onBeforeCompile=sh=>{sh.uniforms.uWT=W.wT;
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uWT;')
  .replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;','vec3 mapN = normalize(texture2D( normalMap, vNormalMapUv+vec2(uWT*.004,uWT*.0025) ).xyz*2.-1. + texture2D( normalMap, vNormalMapUv*1.73+vec2(-uWT*.0031,uWT*.0047) ).xyz*2.-1. + (texture2D( normalMap, vNormalMapUv*.23+vec2(uWT*.0009,-uWT*.0006) ).xyz*2.-1.)*.6);')
  .replace('#include <opaque_fragment>','float fres=pow(1.-clamp(dot(normalize(vViewPosition),normal),0.,1.),3.);diffuseColor.a=mix(diffuseColor.a,1.,fres*.8);outgoingLight+=vec3(.05,.07,.08)*fres;\n#include <opaque_fragment>')};
 W.waterMat.customProgramCacheKey=()=>'bfwWater';
 const water=new THREE.Mesh(new THREE.PlaneGeometry(SIZE*2.2,SIZE*2.2,1,1).rotateX(-Math.PI/2),W.waterMat);water.position.y=0;water.receiveShadow=true;scene.add(water);W.water=water;
 // ---- trees
 const nearFade=m=>{m.onBeforeCompile=sh=>{sh.uniforms.uNearF=W.nearF;sh.fragmentShader=sh.fragmentShader.replace('void main() {','uniform float uNearF;\nvoid main() {\n float cdz=length(vViewPosition); if(cdz<uNearF){ float dth=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453); if(dth>(cdz-1.2)/(uNearF-1.2)) discard; }')}};W.nearF={value:7};
 W.windT={value:0};
 const sway=(m,amp)=>{const prev=m.onBeforeCompile;const U={value:amp};m.onBeforeCompile=sh=>{prev&&prev(sh);sh.uniforms.uWT=W.windT;sh.uniforms.uSA=U;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uWT,uSA;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  vec2 ip=vec2(instanceMatrix[3][0],instanceMatrix[3][2]);
  #else
  vec2 ip=(modelMatrix*vec4(transformed,1.)).xz;
  #endif
  float ww=sin(uWT*1.6+ip.x*.31+ip.y*.23)*.6+sin(uWT*2.7+ip.x*.83-ip.y*.5)*.25+sin(uWT*5.3+ip.y*1.7)*.1;
  float hk=max(transformed.y,0.);transformed.x+=ww*hk*hk*uSA;transformed.z+=ww*hk*hk*uSA*.55;`)};m.customProgramCacheKey=()=>'sway'+(prev?'n':'')};
 W.sway=sway;
 const barkMat=new THREE.MeshStandardMaterial({map:T.bark,normalMap:T.barkN,roughness:.95,color:0x9a8f80});
 const leafMat=new THREE.MeshStandardMaterial({map:T.moss,vertexColors:true,roughness:.9,color:0xffffff});
 const pineMat=new THREE.MeshStandardMaterial({map:T.moss,vertexColors:true,roughness:.92,color:0xffffff});nearFade(barkMat);nearFade(leafMat);nearFade(pineMat);sway(leafMat,.03);sway(pineMat,.022);W.leafMat=leafMat;W.barkMat=barkMat;
 const geo={};const DQ=Q.detail??1;const ts=[8,14,20][DQ],cSeg=[10,18,26][DQ],ico=[2,3,3][DQ];
 geo.pineT=new THREE.CylinderGeometry(.09,.3,1,ts,4).translate(0,.5,0);
 {const cs=[];for(let i=0;i<5;i++){const y=.22+i*.16,rad=.42-i*.075;const c=new THREE.ConeGeometry(rad,.32,cSeg,4).translate(0,y+.16,0);lumpy(c,.3,r,9);colorize(c,[.16,.27,.15],.25,r);cs.push(c)}geo.pineF=mergeGeos(cs)}
 geo.broadT=mergeGeos([new THREE.CylinderGeometry(.12,.25,.62,ts,3).translate(0,.31,0),new THREE.CylinderGeometry(.04,.08,.35,ts>>1).rotateZ(.8).translate(.12,.55,0),new THREE.CylinderGeometry(.04,.08,.32,ts>>1).rotateZ(-.9).rotateY(1.5).translate(0,.55,-.12)]);
 {const bs=[];const pts=[[0,.78,0,.3],[.2,.68,.08,.22],[-.18,.66,-.06,.23],[.05,.66,-.2,.2],[-.06,.7,.2,.21],[0,.95,0,.2]];for(const [x,y,z,s] of pts){const b=new THREE.IcosahedronGeometry(s,ico);lumpy(b,.45,r,7);b.translate(x,y,z);colorize(b,[.22,.31,.14],.3,r);bs.push(b)}geo.broadF=mergeGeos(bs)}
 // ---- alpha leaf cards (Med/High): procedural leaf atlas, left=broadleaf right=needles
 {const cv=document.createElement('canvas');cv.width=512;cv.height=256;const x=cv.getContext('2d');
  for(let i=0;i<260;i++){const px=8+r()*240,py=8+r()*240;const d=Math.hypot(px-128,py-128);if(d>118)continue;const a=r()*6.28,L=9+r()*9;
   const g=60+r()*70|0;x.fillStyle=`rgb(${g*.55|0},${g},${g*.35|0})`;x.save();x.translate(px,py);x.rotate(a);x.beginPath();x.ellipse(0,0,L,L*.45,0,0,6.28);x.fill();
   x.strokeStyle=`rgba(20,30,10,.5)`;x.lineWidth=1;x.beginPath();x.moveTo(-L,0);x.lineTo(L,0);x.stroke();x.restore()}
  for(let b=0;b<7;b++){const bx=256+20+b*32,by=20;x.strokeStyle='#3b2b1c';x.lineWidth=2;x.beginPath();x.moveTo(bx+8,by);x.lineTo(bx+14,by+220);x.stroke();
   for(let k=0;k<70;k++){const t=k/70,cx=bx+8+t*6,cy=by+t*220;const sd=k%2?1:-1;const L=16*(1-t*.4)*(.7+r()*.5);const g=50+r()*50|0;
    x.strokeStyle=`rgb(${g*.45|0},${g*.95|0},${g*.5|0})`;x.lineWidth=1.6;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+sd*L,cy+L*.55);x.stroke()}}
  const lt=new THREE.CanvasTexture(cv);lt.colorSpace=THREE.SRGBColorSpace;lt.anisotropy=W.maxAniso||4;lt.generateMipmaps=true;W.leafTex=lt;
  const cardMat=new THREE.MeshStandardMaterial({map:lt,alphaTest:.45,side:THREE.DoubleSide,vertexColors:true,roughness:.85});nearFade(cardMat);sway(cardMat,.03);W.cardMat=cardMat;
  const quads=(list,half)=>{const P=[],N=[],U=[],Cc=[],I=[];let v=0;const tmp=new THREE.Vector3();
   for(const [c,d,sz,yaw,tilt] of list){const n=new THREE.Vector3(...d).normalize();
    const ax=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw)),ay=new THREE.Vector3(0,1,0).applyAxisAngle(ax,tilt);
    const cr=[[-1,-1],[1,-1],[1,1],[-1,1]];const u0=half?.5:0;const sh=.75+r()*.35;
    for(const [a,b] of cr){tmp.set(c[0],c[1],c[2]).addScaledVector(ax,a*sz).addScaledVector(ay,b*sz*(half?1.4:1));P.push(tmp.x,tmp.y,tmp.z);
     const nn=n.clone().multiplyScalar(.8).add(new THREE.Vector3(a*.25,b*.2,0).applyAxisAngle(new THREE.Vector3(0,1,0),-yaw)).normalize();N.push(nn.x,nn.y,nn.z);
     U.push(u0+(a+1)*.25,(b+1)*.5);Cc.push(sh*.95,sh,sh*.9)}
    I.push(v,v+1,v+2,v,v+2,v+3);v+=4}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
   g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setIndex(I);return g};
  const bl=[];const pts=[[0,.78,0,.3],[.2,.68,.08,.22],[-.18,.66,-.06,.23],[.05,.66,-.2,.2],[-.06,.7,.2,.21],[0,.95,0,.2]];
  for(const [cx,cy,cz,s] of pts)for(let k=0;k<[14,22,30][DQ];k++){const th=r()*6.28,ph=Math.acos(r()*1.6-.6);const d=[Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th)];
   bl.push([[cx+d[0]*s*1.02,cy+d[1]*s*1.02,cz+d[2]*s*1.02],d,s*.42,th+1.57+(r()-.5),(r()-.5)*1.2])}
  geo.broadC=quads(bl,0);
  const pl=[];for(let i=0;i<5;i++){const y=.22+i*.16,rad=.42-i*.075;const PK=[12,18,24][DQ];for(let k=0;k<PK;k++){const th=k/PK*6.28+r()*.4;const d=[Math.cos(th),.35,Math.sin(th)];
   pl.push([[Math.cos(th)*rad*.75,y+.12,Math.sin(th)*rad*.75],d,rad*.42,th+1.57,.55+r()*.3])}}
  geo.pineC=quads(pl,1);
  geo.broadF.scale(.9,.94,.9);geo.pineF.scale(.88,1,.88);}
 geo.snag=mergeGeos([new THREE.CylinderGeometry(.08,.22,1,ts,4).translate(0,.5,0),new THREE.CylinderGeometry(.025,.05,.4,5).rotateZ(1).translate(.17,.7,0),new THREE.CylinderGeometry(.02,.045,.34,5).rotateZ(-1.1).translate(-.14,.55,0),new THREE.CylinderGeometry(.02,.04,.3,5).rotateX(1).translate(0,.82,.12)]);
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
 W.tgrid=new Map();for(const t of trees){const k=Math.floor(t.x/20)+','+Math.floor(t.z/20);if(!W.tgrid.has(k))W.tgrid.set(k,[]);W.tgrid.get(k).push(t)}
 W.nearTrees=function(x,z,rad){const out=[];const r0=Math.ceil(rad/20),ix=Math.floor(x/20),iz=Math.floor(z/20);for(let i=-r0;i<=r0;i++)for(let j=-r0;j<=r0;j++){const L=W.tgrid.get((ix+i)+','+(iz+j));if(L)for(const t of L)if(t.on!==false)out.push(t)}return out};
 const M=new THREE.Matrix4(),q=new THREE.Quaternion(),S=new THREE.Vector3(),P=new THREE.Vector3(),C=new THREE.Color(),Y=new THREE.Vector3(0,1,0);
 for(const ch of W.chunks){
  const byType=[[],[],[]];ch.list.forEach(t=>byType[t.type].push(t));
  const defs=[[geo.pineT,barkMat,0],[geo.pineF,pineMat,0],[geo.broadT,barkMat,1],[geo.broadF,leafMat,1],[geo.broadC,W.cardMat,1],[geo.pineC,W.cardMat,0],[geo.snag,barkMat,2]];
  for(const [g,mat,ty] of defs){const L=byType[ty];if(!L.length)continue;const im=new THREE.InstancedMesh(g,mat,L.length);
   L.forEach((t,k)=>{q.setFromAxisAngle(Y,t.rot);S.set(t.w,t.ht,t.w);if(g===geo.pineT||g===geo.broadT||g===geo.snag){const k=t.ht*(t.giant?.3:ty===0?.07:ty===2?.09:.13);S.set(k,t.ht,k)};P.set(t.x,t.y,t.z);M.compose(P,q,S);im.setMatrixAt(k,M);
    C.setRGB(t.tint,t.tint*(.95+((t.id*7)%10)/60),t.tint*.9);im.setColorAt(k,C)});
   im.castShadow=mat!==W.cardMat;im.receiveShadow=true;im.computeBoundingSphere();im.userData.list=L;if(mat===W.cardMat)im.userData.card=true;scene.add(im);ch.meshes.push(im)}}
 W.setCards=on=>{for(const ch of W.chunks)for(const im of ch.meshes)if(im.userData.card)im.visible=on};
 W.setTreeDensity=function(frac){for(const ch of W.chunks)for(const im of ch.meshes){const L=im.userData.list;let c=0;
  // keep giants, take a prefix fraction (trees were shuffled randomly by generation)
  const keep=L.filter((t,i)=>t.giant||((t.id*2654435761>>>0)%1000)/1000<frac);c=keep.length;
  // reorder instance buffer so kept trees come first
  if(!im.userData.orig){im.userData.orig=im.instanceMatrix.array.slice();im.userData.origC=im.instanceColor.array.slice()}
  const om=im.userData.orig,oc=im.userData.origC;let k=0;L.forEach((t,i)=>{if(keep.includes(t)){im.instanceMatrix.array.set(om.subarray(i*16,i*16+16),k*16);im.instanceColor.array.set(oc.subarray(i*3,i*3+3),k*3);k++}});
  L.forEach(t=>{t.on=t.giant||keep.includes(t)});im.count=c;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;im.userData.frac=frac}
  W.treeFrac=frac;W.activePerches=W.perches.filter(p=>p.kind!=='tree'||W.trees[p.tree].giant||((W.trees[p.tree].id*2654435761>>>0)%1000)/1000<frac||p.kind==='rock'||p.kind==='stone')};
 // ---- rocks & boulders
 const rockMat=new THREE.MeshStandardMaterial({map:T.rock,normalMap:T.rockN,roughness:.9,color:0xb0aaa2});triplanar(rockMat,.32);W.rockMat=rockMat;
 {const g=lumpy(lumpy(new THREE.IcosahedronGeometry(1,[3,4,5][DQ]),.55,r,1.3),.14,r,4.2);const N=260;const im=new THREE.InstancedMesh(g,rockMat,N);let k=0;
  for(let t=0;t<4000&&k<N;t++){const x=(r()-.5)*1450,z=(r()-.5)*1450;const h=H(x,z);if(h<.5)continue;const n=normalAt(x,z);if(n.y>.9&&r()<.85)continue;
   const s=1.2+r()*r()*5;q.setFromEuler(new THREE.Euler(r()*3,r()*3,r()*3));S.set(s,s*(.6+r()*.5),s*(.8+r()*.4));P.set(x,h+s*.15,z);M.compose(P,q,S);im.setMatrixAt(k++,M);
   W.perches.push({x,y:h+s*.15+s*.55*(.6+.25),z,kind:'rock'})}
  im.count=k;im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);W.rocks=im}
 // ---- ruins: ring of the Old Watchers + broken arch (ancient megastructure)
 const stoneMat=new THREE.MeshStandardMaterial({map:T.rock,normalMap:T.rockN,roughness:.85,color:0x9c978d});triplanar(stoneMat,.22);
 W.ruins=[];
 {const cx=-240,cz=-170;const ch=H(cx,cz);W.RUINS={x:cx,z:cz,y:ch};const g=new THREE.BoxGeometry(1,1,1,6,12,6);lumpy(g,.08,r,3);const N=14;const im=new THREE.InstancedMesh(g,stoneMat,N+3);
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
 {const g=new THREE.CylinderGeometry(.35,.4,5,[10,18,24][DQ],3).rotateZ(Math.PI/2);const im=new THREE.InstancedMesh(g,barkMat,40);let k=0;
  for(let t=0;t<3000&&k<40;t++){const x=(r()-.5)*1300,z=(r()-.5)*1300;const h=H(x,z);if(h<2||h>60)continue;if(forestMask(x,z)<.5)continue;
   q.setFromAxisAngle(Y,r()*6);P.set(x,h+.25,z);S.set(1,1,1);M.compose(P,q,S);im.setMatrixAt(k++,M);W.logs.push({x,z,y:h+.5,grubs:1,t:0})}
  im.count=k;im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();scene.add(im)}
 {const g=lumpy(new THREE.IcosahedronGeometry(.9,[2,3,4][DQ]),.5,r,2);colorize(g,[.2,.3,.13],.3,r);const im=new THREE.InstancedMesh(g,leafMat,150);
  const bg=new THREE.SphereGeometry(.09,12,8);const bm=new THREE.MeshStandardMaterial({color:0x8a0e1e,roughness:.35,emissive:0x220004});const bi=new THREE.InstancedMesh(bg,bm,150*7);let k=0,bk=0;
  for(let t=0;t<8000&&k<150;t++){const x=(r()-.5)*1300,z=(r()-.5)*1300;const h=H(x,z);if(h<2||h>45)continue;if(normalAt(x,z).y<.9)continue;
   const s=.8+r()*.6;q.setFromAxisAngle(Y,r()*6);P.set(x,h+.45*s,z);S.set(s,s*.75,s);M.compose(P,q,S);im.setMatrixAt(k,M);
   const b={x,z,y:h+.5,ripe:1,t:0,bi:[]};for(let j=0;j<7;j++){const a=j*.9+r(),e=r()*.9;P.set(x+Math.cos(a)*.85*s*Math.cos(e),h+.45*s+Math.sin(e)*.6*s,z+Math.sin(a)*.85*s*Math.cos(e));M.compose(P,q.identity(),S.set(1,1,1));bi.setMatrixAt(bk,M);b.bi.push(bk++)}
   W.bushes.push(b);k++}
  im.count=k;bi.count=bk;im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();bi.computeBoundingSphere();scene.add(im,bi);W.berryMesh=bi}
 // ---- grass tufts (cosmetic)
 {const blades=[];for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const b=new THREE.PlaneGeometry(.07,.7,1,2);const p=b.attributes.position;for(let j=0;j<p.count;j++){if(p.getY(j)>.3)p.setX(j,p.getX(j)*.1)}b.translate(0,.35,0).rotateX(-.3).rotateY(a).translate(Math.cos(a)*.1,0,Math.sin(a)*.1);colorize(b,[.3,.42,.16],.4,r);blades.push(b)}
  const g=mergeGeos(blades);const gm=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});sway(gm,.5);W.grassGeo=g;W.grassMat=gm;const N=9000;const im=new THREE.InstancedMesh(g,gm,N);let k=0;
  for(let t=0;t<40000&&k<N;t++){const x=(r()-.5)*1400,z=(r()-.5)*1400;const h=H(x,z);if(h<1.2||h>70)continue;if(normalAt(x,z).y<.88)continue;
   q.setFromAxisAngle(Y,r()*6);const s=.7+r()*.9;P.set(x,h-.05,z);S.set(s,s*(.7+r()*.6),s);M.compose(P,q,S);im.setMatrixAt(k++,M)}
  im.count=k;im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);W.grass=im;W.grassMax=k}
 W.buildFeatures(scene,r,{q,S,P,M,Y,stoneMat,barkMat,leafMat});
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
// ---- landmarks: waterfall, abandoned farm, shiny caches, near grass field, distant mountains
W.buildFeatures=function(scene,r,K){const {q,S,P,M,Y}=K;const E=new THREE.Euler();
 // ---------- waterfall
 {const wf=W.WF;const top=wf.top-1.2;const fc=document.createElement('canvas');fc.width=64;fc.height=256;const fx=fc.getContext('2d');
  for(let i=0;i<900;i++){const x=Math.random()*64,y=Math.random()*256,l=8+Math.random()*40;const a=.15+Math.random()*.5;fx.fillStyle=`rgba(255,255,255,${a})`;fx.fillRect(x,y,1+Math.random()*2,l)}
  const ft=new THREE.CanvasTexture(fc);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(3,2);
  const fm=new THREE.MeshStandardMaterial({color:0xcfe3ec,map:ft,alphaMap:ft,transparent:true,opacity:.92,roughness:.3,depthWrite:false,side:THREE.DoubleSide,emissive:0x203038});
  // curved sheet from lip down to pool
  const g=new THREE.PlaneGeometry(9,1,6,12);const pa=g.attributes.position;
  for(let i=0;i<pa.count;i++){const u=pa.getY(i)+.5;/*1 top ->0 bottom*/const xx=pa.getX(i);const y=-.3+u*(top+.3);const zz=-310+(1-u)*(1-u)*-0+ (1-u)*3.2 - Math.pow(u,6)*1.5;pa.setXYZ(i,wf.x+xx*(1+.15*(1-u)),y,zz)}
  g.computeVertexNormals();const fall=new THREE.Mesh(g,fm);fall.renderOrder=2;scene.add(fall);
  // upstream channel water
  const cg=new THREE.PlaneGeometry(10,42,1,1).rotateX(-Math.PI/2);const ch=new THREE.Mesh(cg,W.waterMat);ch.position.set(W.riverX(-330),top+.05,-331);scene.add(ch);
  // mist sprites
  const mc=document.createElement('canvas');mc.width=mc.height=64;const mx=mc.getContext('2d');const gr=mx.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');mx.fillStyle=gr;mx.fillRect(0,0,64,64);
  const mt=new THREE.CanvasTexture(mc);W.softTex=mt;const mists=[];for(let i=0;i<10;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:mt,transparent:true,depthWrite:false,opacity:.5,color:0xeef6fa}));s.userData.o=Math.random()*6;scene.add(s);mists.push(s)}
  // rocks around the pool
  W.WATERFALL={x:wf.x,z:wf.z+5,y:0,top:top,mesh:fall,tex:ft,mists};
  W.perches.push({x:wf.x-7,y:top+.6,z:wf.z-3,kind:'rock'},{x:wf.x+7,y:top+.6,z:wf.z-3,kind:'rock'})}
 // ---------- abandoned farm
 {const fx=460,fz=-130;const fy=W.H(fx,fz);W.FARM={x:fx,z:fz,y:fy};const parts=[];
  const wood=new THREE.MeshStandardMaterial({map:W.T.bark,color:0x8a4a38,roughness:.95});const grey=new THREE.MeshStandardMaterial({map:W.T.bark,color:0x8a8478,roughness:.95});
  const roofM=new THREE.MeshStandardMaterial({color:0x5b4a40,roughness:.8,metalness:.2,side:THREE.DoubleSide});const hay=new THREE.MeshStandardMaterial({map:W.T.grass,color:0xd9b860,roughness:1});
  const grp=new THREE.Group();grp.position.set(fx,fy-.2,fz);grp.rotation.y=.4;scene.add(grp);
  const box=(w,h,d,x,y,z,m,rx,rz)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);if(rx)b.rotation.x=rx;if(rz)b.rotation.z=rz;b.castShadow=b.receiveShadow=true;grp.add(b);return b};
  // barn walls (one broken)
  box(12,7,.5,0,3.5,-8,wood);box(.5,7,16,-6,3.5,0,wood);box(.5,7,16,6,3.5,0,wood);box(12,4,.5,-0,2,8,wood);box(4,3,.5,-4,5.5,8,wood);
  // gables
  const gab=new THREE.Shape();gab.moveTo(-6,0);gab.lineTo(6,0);gab.lineTo(0,4.2);gab.lineTo(-6,0);const gg=new THREE.ExtrudeGeometry(gab,{depth:.5,bevelEnabled:false});
  [-8.25,7.75].forEach(z=>{const m=new THREE.Mesh(gg,wood);m.position.set(0,7,z);m.castShadow=true;grp.add(m)});
  // roof: one side intact, the other collapsed
  box(6.9,.25,17,-3.1,9.1,0,roofM,0,.6);const rb=box(6.9,.25,9,3.4,7.2,-4,roofM,.15,-.9);
  box(.4,.4,17,0,11.15,0,grey);
  // silo
  const silo=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,14,16,1,true),grey);silo.material=silo.material.clone();silo.material.side=THREE.DoubleSide;silo.position.set(10,7,-4);silo.castShadow=true;grp.add(silo);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(2.7,16,8,0,Math.PI*2,0,Math.PI/2),roofM);dome.position.set(10,14,-4);grp.add(dome);
  // fence
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2;if(i%7===3)continue;const x=Math.cos(a)*24,z=Math.sin(a)*20;const lean=(r()-.5)*.3;box(.25,1.6,.25,x,.8,z,grey,lean,lean);if(i%5!==1){const a2=(i+1)/22*Math.PI*2;const x2=Math.cos(a2)*24,z2=Math.sin(a2)*20;const rail=box(Math.hypot(x2-x,z2-z),.15,.12,(x+x2)/2,1.2,(z+z2)/2,grey);rail.rotation.y=-Math.atan2(z2-z,x2-x)}}
  // hay bales + cart
  [[-12,0,6],[-13.5,0,4],[-12.6,1.2,5],[8,0,9],[14,0,6]].forEach(([x,y,z])=>{const h=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,1.3,12).rotateZ(Math.PI/2),hay);h.position.set(x,.8+y*1.3,z);h.castShadow=h.receiveShadow=true;grp.add(h)});
  box(3,.2,1.8,-10,1,-9,grey,0,.25);[[-11,-8],[-9,-8],[-11,-10],[-9,-10]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.TorusGeometry(.5,.08,6,12),grey);w.position.set(x,.5,z+(z<-9?-.2:.2));grp.add(w)});
  grp.updateMatrixWorld(true);const wp=v=>new THREE.Vector3(...v).applyMatrix4(grp.matrixWorld);
  [[0,11.4,-6],[0,11.4,6],[10,14.6,-4],[-6,7.1,0],[6,7.1,-6]].forEach(v=>{const p=wp(v);W.perches.push({x:p.x,y:p.y,z:p.z,kind:'stone'})});
  W.FARM.cache=wp([2,.4,-5]);W.FARM.solid=[{x:fx,z:fz,r:9}]}
 // ---------- shiny caches (glittering hoards)
 W.CACHES=[{x:W.RUINS.x,z:W.RUINS.z,y:W.RUINS.y+1.7,name:'Altar hoard'},{x:W.FARM.cache.x,z:W.FARM.cache.z,y:W.FARM.cache.y,name:'Barn hoard'},{x:W.WF.x+7,z:W.WF.z-3,y:W.WF.top+.3,name:'Falls hoard'},{x:W.ARCH.x,z:W.ARCH.z,y:W.ARCH.y+43.2,name:'Arch hoard'},{x:W.POND.x+30,z:W.POND.z-26,y:W.H(W.POND.x+30,W.POND.z-26)+.2,name:'Pond hoard'}];
 {const cm=new THREE.MeshStandardMaterial({color:0xd8b45a,metalness:1,roughness:.25,emissive:0x2a1d00});const g=new THREE.CylinderGeometry(.09,.09,.02,10);
  for(const c of W.CACHES){const im=new THREE.InstancedMesh(g,cm,26);for(let i=0;i<26;i++){const a=r()*6.28,d=r()*.55;E.set((r()-.5)*1.2,0,(r()-.5)*1.2);q.setFromEuler(E);P.set(c.x+Math.cos(a)*d,c.y+r()*.12*(1-d),c.z+Math.sin(a)*d);M.compose(P,q,S.set(1,1,1));im.setMatrixAt(i,M)}scene.add(im)}}
 // ---------- near grass field (dense, recycled around the player)
 {const fl=[];for(let i=0;i<4;i++){const b=new THREE.PlaneGeometry(.16,.16).rotateY(i*.8);b.translate(0,.45,0);fl.push(b)}
  W.gfield=null;W.setGrassField=function(n,R){if(W.gfield){scene.remove(W.gfield);W.gfield.dispose();W.gfield=null}if(!n)return;
   const im=new THREE.InstancedMesh(W.grassGeo,W.grassMat,n);im.frustumCulled=false;im.receiveShadow=true;const loc=new Float32Array(n*4);const rr=rng(7);const C=new THREE.Color();
   for(let i=0;i<n;i++){loc[i*4]=rr()*R*2;loc[i*4+1]=rr()*R*2;loc[i*4+2]=rr()*6.28;loc[i*4+3]=.22+rr()*.3;{const dry=rr()<.25;C.setHSL(dry?.13+rr()*.04:.22+rr()*.07,dry?.3+rr()*.15:.22+rr()*.2,.26+rr()*.16)};C.multiplyScalar(1.6);im.setColorAt(i,C)}
   im.userData={loc,R,key:new Int32Array(n*2).fill(-99999)};scene.add(im);W.gfield=im};
  const Mx=new THREE.Matrix4(),Qx=new THREE.Quaternion(),Sx=new THREE.Vector3(),Px=new THREE.Vector3(),Yx=new THREE.Vector3(0,1,0);
  W.updateGrassField=function(px,pz){const im=W.gfield;if(!im)return;const {loc,R,key}=im.userData;const T=R*2;let dirty=false;
   for(let i=0,n=im.count;i<n;i++){const kx=Math.floor((px-loc[i*4]+R)/T),kz=Math.floor((pz-loc[i*4+1]+R)/T);if(kx===key[i*2]&&kz===key[i*2+1])continue;key[i*2]=kx;key[i*2+1]=kz;dirty=true;
    const x=loc[i*4]+kx*T,z=loc[i*4+1]+kz*T;const h=H(x,z);let s=loc[i*4+3];
    if(h<1.1||h>75||forestMask(x,z)>.66&&((i*13)%4)!==0)s=0;else{const n2=normalAt(x,z);if(n2.y<.86)s=0}
    if(s&&W.FARM&&Math.hypot(x-W.FARM.x,z-W.FARM.z)<10)s=0;
    Qx.setFromAxisAngle(Yx,loc[i*4+2]);Px.set(x,h-.06,z);Sx.set(s,s*(.75+(i%5)*.12),s);Mx.compose(Px,Qx,Sx);im.setMatrixAt(i,Mx)}
   if(dirty)im.instanceMatrix.needsUpdate=true}}
 // ---------- distant mountain ring (beyond the play area, blends into haze)
 {const mk=(R,seg,base,amp,seed,lay)=>{const pos=[],col=[],idx=[];const rr=rng(seed);
   for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;let h=0;const u=i/seg*24;
    h=fbm(u+seed,seed*.3,5);h=1-Math.abs(h*2-1);h=Math.pow(h,1.6);const big=fbm(u*.18+seed,1,3);let H2=base+amp*(h*.7+big*.6);
    // lower the ring behind the lake/south a bit for variety
    const x=Math.cos(a)*R,z=Math.sin(a)*R;pos.push(x,-60,z, x*1.002,H2*.55,z*1.002, x*1.004,H2,z*1.004);col.push(0,0,0, .55,0,0, 1,H2,0)}
   for(let i=0;i<seg;i++){const o=i*3,n=o+3;idx.push(o,n,o+1, n,n+1,o+1, o+1,n+1,o+2, n+1,n+2,o+2)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aH',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);return g};
  const mat=lay=>new THREE.ShaderMaterial({fog:false,depthWrite:true,side:THREE.DoubleSide,uniforms:{hor:{value:new THREE.Color()},tint:{value:new THREE.Color(lay?0x55606e:0x3e4a44)},sunCol:{value:new THREE.Color()},haze:{value:lay?.72:.5},snow:{value:lay?520.:470.},night:{value:0}},
   vertexShader:'attribute vec3 aH;varying vec3 vH;varying vec3 vP;void main(){vH=aH;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`uniform vec3 hor,tint,sunCol;uniform float haze,snow,night;varying vec3 vH;varying vec3 vP;
    float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){float f=clamp(vH.x,0.,1.);vec3 c=tint*mix(.75,1.15,f);
     float sn=smoothstep(snow-60.,snow+40.,vP.y+hs(floor(vP.xz*.05))*40.);c=mix(c,vec3(.92,.94,1.)*(.6+.4*sunCol),sn*.85);
     c*=mix(vec3(1.),sunCol*.9+.25,.35);c=mix(c,hor,mix(1.,haze,smoothstep(0.,.9,f)));c*=1.-night*.6;
     gl_FragColor=vec4(c,1.);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  const far=new THREE.Mesh(mk(2900,240,180,820,23,1),mat(1)),near=new THREE.Mesh(mk(2150,200,90,560,57,0),mat(0));
  far.frustumCulled=near.frustumCulled=false;far.renderOrder=-.5;near.renderOrder=-.4;scene.add(far,near);W.mtns=[far,near]}
};
// ---- sky
W.makeSky=function(scene){
 const g=new THREE.SphereGeometry(4000,32,16);
 const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sunDir:{value:new THREE.Vector3(0,1,0)},top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunCol:{value:new THREE.Color()},night:{value:0},storm:{value:0},uT:{value:0},uCQ:{value:2},tH:{value:null},uH:{value:0}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader:`uniform vec3 sunDir,top,hor,sunCol;uniform float night,storm,uT,uCQ,uH;uniform sampler2D tH;varying vec3 vD;
  float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
  float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
  float fb(vec2 p,int o){float s=0.,a=.5;for(int i=0;i<5;i++){if(i>=o)break;s+=a*n2(p);p=p*2.07+vec2(1.7,9.2);a*=.5;}return s;}
  void main(){float y=max(vD.y,0.);vec3 c=mix(hor,top,pow(y,.55));float s=max(dot(vD,sunDir),0.);float hcl=0.;
   if(uH>0.){vec3 d=normalize(vD);vec2 eu=vec2(atan(d.z,d.x)*.1591549+.5,asin(clamp(d.y,-1.,1.))*.3183099+.5);
    vec3 hz=texture2D(tH,vec2(.5,.985)).rgb,hh=texture2D(tH,vec2(.5,.52)).rgb;vec3 hc=texture2D(tH,eu).rgb;hc=min(hc,max(hz,hh)*2.6);
    vec3 L=vec3(.2126,.7152,.0722);float lz=dot(hz,L)+1e-4,lh=dot(hh,L)+1e-4;float lt=dot(top,L),lo=dot(hor,L);
    float gy=pow(clamp(d.y,0.,1.),.55);vec3 base=mix(hh/lh*lo,hz/lz*lt,gy);vec3 grad=mix(hh,hz,gy);
    hc=hc/max(grad,vec3(1e-4))*base;hcl=clamp(dot(hc-base,L)/(dot(base,L)+1e-3)*2.,0.,1.);
    c=mix(c,mix(c,hc,.9),uH*smoothstep(-.02,.05,d.y));}
   c+=sunCol*(pow(s,900.)*14.+pow(s,8.)*.35+pow(s,2.)*.08)*(1.-storm*.9);
   vec3 q=floor(vD*360.);float st=step(.9975,h(q))*night*smoothstep(0.,.2,vD.y)*(1.-storm);
   if(vD.y>0.&&uCQ>0.){vec2 cp=vD.xz/(vD.y+.08)*1.6+vec2(uT*.006,uT*.0025);int oc=uCQ>1.5?5:3;
    float n=fb(cp,oc);float cov=mix(.56,.34,storm)+uH*.1;float cl=smoothstep(cov,cov+.22,n)*smoothstep(0.,.18,vD.y);
    float lit=clamp(.6+(fb(cp+sunDir.xz*.06,oc)-n)*-3.,0.,1.);
    vec3 cc=mix(mix(hor*.75,vec3(.62,.64,.68),.4),mix(vec3(1.),sunCol,.35)*1.15,lit)*mix(1.,.45,storm);cc=mix(cc,cc*.12+hor*.15,night);
    cc+=sunCol*pow(s,6.)*.6*(1.-cl*.5)*(1.-night);
    c=mix(c,cc,cl*.92);st*=1.-cl;}
   c+=vec3(st);
   if(vD.y<0.)c=hor*mix(1.,.6,clamp(-vD.y*4.,0.,1.));
   gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 if(THREE.RGBELoader&&(W.Q0?W.Q0.hdr:1)){new THREE.RGBELoader().load('hdr/sky_1k.hdr',t=>{t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;m.uniforms.tH.value=t;W.hdr=t},undefined,e=>console.warn('hdr',e))}
 const s=new THREE.Mesh(g,m);s.renderOrder=-1;s.frustumCulled=false;scene.add(s);return s};
window.W=W;
})();
