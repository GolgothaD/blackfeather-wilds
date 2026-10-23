// Blackfeather Wilds — ambient wildlife & nature sounds
(function(){
'use strict';
const B=window.__BFW,{scene,camera,SET}=B;const H=W.H;const TAU=Math.PI*2,rnd=Math.random,hyp=Math.hypot,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const G=()=>window.__G;let DENS=B.getQ().life||.75;
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o||{}));
function ellG(r,sx,sy,sz,x,y,z){const g=new THREE.SphereGeometry(r,22,16);g.scale(sx,sy,sz);g.translate(x||0,y||0,z||0);return g}
const night=()=>{const S=G()&&G().S;return S?(S.t<.23||S.t>.78):false},storm=()=>{const S=G()&&G().S;return S?S.storm:0};
const meadow=(x,z)=>{const h=H(x,z);return h>1.5&&h<60&&W.normalAt(x,z).y>.86&&W.forestMask(x,z)<.56};
const P=new THREE.Vector3(),Q=new THREE.Quaternion(),Sc=new THREE.Vector3(),Mx=new THREE.Matrix4(),E=new THREE.Euler(0,0,0,'YXZ'),C=new THREE.Color();
function player(){const S=G()&&G().S;if(S)return S;return {x:camera.position.x,y:camera.position.y,z:camera.position.z,mode:'menu'}}
// ================= deer herds
function mkDeer(stag){const g=new THREE.Group();const coat=M(0x8a5a36),pale=M(0xd9c7a8),dk=M(0x2a1e16);
 const parts=[ellG(.32,1,1,2.1,0,1.05,0),ellG(.13,1,1.1,1,0,1.45,-.62),ellG(.1,1,.95,1.6,0,1.62,-.78)];
 const neck=new THREE.CylinderGeometry(.09,.13,.55,16,3);neck.rotateX(-.75);neck.translate(0,1.3,-.48);parts.push(neck);
 for(const s of[-1,1]){const e=new THREE.ConeGeometry(.05,.18,12);e.rotateZ(s*1.1);e.translate(s*.11,1.75,-.7);parts.push(e)}
 const body=new THREE.Mesh(W.mergeGeos(parts),coat);body.castShadow=true;g.add(body);
 const belly=new THREE.Mesh(ellG(.25,.9,.6,1.7,0,.92,0),pale);g.add(belly);const tail=new THREE.Mesh(ellG(.06,1,1.4,.6,0,1.15,.66),pale);g.add(tail);
 const nose=new THREE.Mesh(ellG(.035,1,1,1,0,1.6,-.94),dk);g.add(nose);
 if(stag){const an=[];for(const s of[-1,1]){const a=new THREE.CylinderGeometry(.015,.025,.5,8);a.rotateZ(s*.5);a.rotateX(.3);a.translate(s*.15,1.95,-.68);an.push(a);
   for(let k=0;k<3;k++){const t=new THREE.CylinderGeometry(.01,.016,.22,8);t.rotateX(-.6);t.translate(s*(.12+k*.06),1.86+k*.11,-.74);an.push(t)}}
  g.add(new THREE.Mesh(W.mergeGeos(an),M(0xcbb898)))}
 const legs=[];for(const [x,z] of [[-.13,-.45],[.13,-.45],[-.13,.45],[.13,.45]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.04,.025,.9,12,3).translate(0,-.45,0),coat);l.position.set(x,.92,z);g.add(l);legs.push(l)}
 g.userData.legs=legs;return g}
const herds=[];
function placeHerd(h,px,pz){for(let k=0;k<40;k++){const a=rnd()*TAU,d=35+rnd()*95;const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;if(Math.abs(x)>680||Math.abs(z)>680)continue;if(meadow(x,z)){h.x=x;h.z=z;h.tx=x;h.tz=z;
  for(const d of h.deer){d.x=x+(rnd()-.5)*10;d.z=z+(rnd()-.5)*10}return true}}return false}
function buildHerds(){for(const h of herds)for(const d of h.deer)scene.remove(d.m);herds.length=0;const nh=DENS<.6?1:DENS<.9?2:3;
 for(let i=0;i<nh;i++){const h={x:0,z:0,tx:0,tz:0,t:0,flee:0,deer:[]};const n=3+Math.round(rnd()*2*DENS);
  for(let j=0;j<n;j++){const m=mkDeer(j===0);scene.add(m);h.deer.push({m,x:0,z:0,yaw:rnd()*TAU,ph:rnd()*9,graze:rnd()*4,spd:0})}herds.push(h);h.placed=false}}
function tickHerds(dt,p,T){for(const h of herds){if(!h.placed||hyp(h.x-p.x,h.z-p.z)>420){h.placed=placeHerd(h,p.x,p.z)}
 const dp=hyp(h.x-p.x,h.z-p.z),low=(p.y-Math.max(0,H(p.x,p.z)))<9;
 if(dp<26&&low&&p.mode!=='menu'&&h.flee<=0){h.flee=6;const a=Math.atan2(h.x-p.x,h.z-p.z);h.tx=h.x+Math.sin(a)*70;h.tz=h.z+Math.cos(a)*70}
 h.flee-=dt;h.t-=dt;if(h.t<=0&&h.flee<=0){h.t=8+rnd()*12;const a=rnd()*TAU;const x=h.x+Math.cos(a)*20,z=h.z+Math.sin(a)*20;if(meadow(x,z)){h.tx=x;h.tz=z}}
 const hs=h.flee>0?9:1.1;const dx=h.tx-h.x,dz=h.tz-h.z,dl=hyp(dx,dz);if(dl>1){const nx=h.x+dx/dl*hs*dt,nz=h.z+dz/dl*hs*dt;if(H(nx,nz)>.8){h.x=nx;h.z=nz}else{h.tx=h.x;h.tz=h.z}}
 for(const d of h.deer){const vis=hyp(d.x-p.x,d.z-p.z)<320;d.m.visible=vis;if(!vis){d.x=lerp(d.x,h.x,dt);d.z=lerp(d.z,h.z,dt);continue}
  const ox=h.x+Math.sin(d.ph)*5,oz=h.z+Math.cos(d.ph*1.3)*5;const ex=ox-d.x,ez=oz-d.z,el=hyp(ex,ez);let sp=0;
  if(el>.6){sp=Math.min(h.flee>0?10:1.6,el*1.2);const nx=d.x+ex/el*sp*dt,nz=d.z+ez/el*sp*dt;if(H(nx,nz)>.8){d.x=nx;d.z=nz}let ty=Math.atan2(-ex,-ez),df=Math.atan2(Math.sin(ty-d.yaw),Math.cos(ty-d.yaw));d.yaw+=df*Math.min(1,dt*4)}
  d.graze-=dt;if(d.graze<-3)d.graze=2+rnd()*6;const grazing=sp<.3&&d.graze>0;
  const y=H(d.x,d.z);const bound=sp>5?Math.abs(Math.sin(T*7+d.ph))*.45:0;d.m.position.set(d.x,y-.05+bound,d.z);d.m.rotation.set(grazing?.32:sp>5?-.08*Math.sin(T*7+d.ph):0,d.yaw,0);
  const L=d.m.userData.legs,f=sp>5?7:3.2,am=Math.min(.7,sp*.18);L.forEach((l,i)=>l.rotation.x=Math.sin(T*f+d.ph+(i%2?Math.PI:0)+(i>1?.9:0))*am)}}}
// ================= instanced small fliers (songbird flocks, crows overhead)
function wingBirdGeo(span,len){const parts=[ellG(len*.28,1,.85,1.9)];const w=new THREE.BufferGeometry();
 w.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-len*.25, span,0,len*.05, 0,0,len*.25, 0,0,-len*.25, 0,0,len*.25, -span,0,len*.05],3));w.computeVertexNormals();w.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(12).fill(0),2));parts.push(w);
 const t=new THREE.BufferGeometry();t.setAttribute('position',new THREE.Float32BufferAttribute([0,0,len*.2, len*.18,0,len*.6, -len*.18,0,len*.6],3));t.computeVertexNormals();t.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(6).fill(0),2));parts.push(t);return W.mergeGeos(parts)}
function mkFlockSet(n,geo,mat){const im=new THREE.InstancedMesh(geo,mat,n);im.frustumCulled=false;scene.add(im);return {im,b:[],n}}
const song=mkFlockSet(60,wingBirdGeo(.16,.18),M(0xffffff,{side:THREE.DoubleSide,roughness:.9}));song.im.visible=false;song.im.count=0;
const crows=mkFlockSet(14,wingBirdGeo(.55,.5),M(0x15161a,{side:THREE.DoubleSide,roughness:.6,metalness:.2}));
for(let i=0;i<song.n;i++){song.im.setColorAt(i,C.set([0x7a5a3a,0x8a6a42,0x5a4a3a,0x6a7a8a,0xa08050][i%5]));song.b.push({ph:rnd()*TAU,o:rnd()*TAU,r:4+rnd()*9,h:rnd()*4,f:i%3})}
for(let i=0;i<crows.n;i++)crows.b.push({ph:rnd()*TAU,o:rnd()*TAU,r:3+rnd()*10,h:rnd()*6});
const flocks=[{x:0,z:0,y:20,vx:0,vz:0,t:0,set:song,from:0,to:20},{x:0,z:0,y:20,vx:0,vz:0,t:0,set:song,from:20,to:40},{x:0,z:0,y:20,vx:0,vz:0,t:0,set:song,from:40,to:60}];
const crowF={x:0,z:0,y:60,vx:0,vz:0,t:0,set:crows,from:0,to:14,caw:3};
function tickFlock(F,dt,p,T,hi,spd){const live=Math.round((F.to-F.from)*DENS);if(hyp(F.x-p.x,F.z-p.z)>260||!F.init){F.init=1;const a=rnd()*TAU,d=60+rnd()*100;F.x=p.x+Math.cos(a)*d;F.z=p.z+Math.sin(a)*d;const b=rnd()*TAU;F.vx=Math.cos(b)*spd;F.vz=Math.sin(b)*spd}
 F.t-=dt;if(F.t<=0){F.t=5+rnd()*8;const b=Math.atan2(F.vz,F.vx)+(rnd()-.5)*1.6;F.vx=Math.cos(b)*spd;F.vz=Math.sin(b)*spd}
 const scare=hyp(F.x-p.x,F.z-p.z,F.y-p.y)<18;F.x+=F.vx*dt*(scare?2.2:1);F.z+=F.vz*dt*(scare?2.2:1);F.y=lerp(F.y,Math.max(H(F.x,F.z),0)+hi+(scare?12:0),dt*.5);
 const im=F.set.im;for(let i=F.from;i<F.to;i++){const b=F.set.b[i];if(i-F.from>=live){Mx.makeScale(0,0,0);im.setMatrixAt(i,Mx);continue}
  b.o+=dt*(.8+b.r*.02);const x=F.x+Math.cos(b.o)*b.r,z=F.z+Math.sin(b.o*1.1)*b.r,y=F.y+b.h+Math.sin(T*1.3+b.ph)*1.2;
  const yaw=Math.atan2(-(F.vx-Math.sin(b.o)*b.r*.8),-(F.vz+Math.cos(b.o*1.1)*b.r*.9));E.set(0,yaw,Math.sin(b.o)*.3);Q.setFromEuler(E);
  const fl=Math.sin(T*(F===crowF?7:22)+b.ph);Sc.set(.35+.65*Math.abs(fl),1,1);P.set(x,y,z);Mx.compose(P,Q,Sc);im.setMatrixAt(i,Mx)}
 im.instanceMatrix.needsUpdate=true}
// ================= ducks
const ducks=[];function mkDuck(i){const g=new THREE.Group();const drake=i%2===0;const b=new THREE.Mesh(W.mergeGeos([ellG(.16,1,.7,1.6,0,.06,0),ellG(.06,1,1.6,1,0,.12,.22)]),M(drake?0x8a8a86:0x7a5a3c));g.add(b);
 const h=new THREE.Mesh(ellG(.075,1,1,1.1,0,.24,-.2),M(drake?0x1f5a32:0x6a4a2c,{roughness:.4}));g.add(h);const bl=new THREE.Mesh(ellG(.035,1,.5,1.7,0,.22,-.3),M(0xd8a020));g.add(bl);g.castShadow=true;return g}
function buildDucks(){for(const d of ducks)scene.remove(d.m);ducks.length=0;const n=Math.round(10*DENS);for(let i=0;i<n;i++){const L=i%3===2?W.POND:W.LAKE;const m=mkDuck(i);scene.add(m);ducks.push({m,L,a:rnd()*TAU,r:L.r*(.25+rnd()*.5),w:(rnd()<.5?-1:1)*(.02+rnd()*.03),ph:rnd()*9,dash:0})}}
function tickDucks(dt,p,T){for(const d of ducks){const L=d.L;const vis=hyp(L.x-p.x,L.z-p.z)<L.r+260;d.m.visible=vis;if(!vis)continue;
 let x=L.x+Math.cos(d.a)*d.r,z=L.z+Math.sin(d.a)*d.r;const dp=hyp(x-p.x,z-p.z);if(dp<10&&d.dash<=0)d.dash=3;d.dash-=dt;
 const w=d.w*(d.dash>0?6:1)*(30/d.r);let na=d.a+w*dt;const nx=L.x+Math.cos(na)*d.r,nz=L.z+Math.sin(na)*d.r;if(H(nx,nz)<-.3)d.a=na;else d.w*=-1;
 x=L.x+Math.cos(d.a)*d.r;z=L.z+Math.sin(d.a)*d.r;d.m.position.set(x,Math.sin(T*2+d.ph)*.03,z);d.m.rotation.y=-d.a+(d.w>0?Math.PI:0);d.m.rotation.z=Math.sin(T*1.7+d.ph)*.05}}
// ================= rival raptors
const raptors=[];function buildRaptors(){for(const r of raptors)scene.remove(r.m);raptors.length=0;const n=DENS<.6?1:DENS<.9?2:3;const kinds=['hawk','eagle','falcon'];
 for(let i=0;i<n;i++){const m=BIRDS.makeBird(kinds[i%3]);m.traverse(o=>{o.castShadow=false});scene.add(m);raptors.push({m,cx:0,cz:0,a:rnd()*TAU,r:30+rnd()*30,h:55+rnd()*35,init:0,cry:5+rnd()*20,kind:kinds[i%3]})}}
function tickRaptors(dt,p,T){for(const r of raptors){if(!r.init||hyp(r.cx-p.x,r.cz-p.z)>300){r.init=1;const a=rnd()*TAU,d=50+rnd()*120;r.cx=p.x+Math.cos(a)*d;r.cz=p.z+Math.sin(a)*d}
 r.a+=dt*9/r.r;r.cx+=Math.sin(T*.05+r.r)*dt*2;const x=r.cx+Math.cos(r.a)*r.r,z=r.cz+Math.sin(r.a)*r.r,y=Math.max(H(r.cx,r.cz),0)+r.h+Math.sin(T*.2+r.r)*6;
 r.m.position.set(x,y,z);r.m.rotation.set(0,-r.a,-.35,'YXZ');BIRDS.animBird(r.m,dt,{mode:'fly',flap:Math.sin(T*.3+r.r)>.85?1:0,flapRate:7});r.m.visible=!night()||r.kind!=='falcon';
 r.cry-=dt;if(r.cry<=0){r.cry=18+rnd()*30;const d=hyp(x-p.x,z-p.z,y-p.y);if(d<150&&!night())snd.raptor(1-d/150)}}}
// ================= butterflies / fireflies / leaves
const bfGeo=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.05, .09,0,-.07, .07,0,.05, 0,0,-.05, .07,0,.05, 0,0,.04, 0,0,-.05, -.09,0,-.07, -.07,0,.05, 0,0,-.05, -.07,0,.05, 0,0,.04],3));g.computeVertexNormals();return g})();
const bfly=new THREE.InstancedMesh(bfGeo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide,color:0xffffff}),40);bfly.frustumCulled=false;scene.add(bfly);const bfs=[];
for(let i=0;i<40;i++){bfly.setColorAt(i,C.set([0xffb030,0xfff2a0,0x7fb8ff,0xffffff,0xff7a30][i%5]));bfs.push({x:0,z:0,y:0,ph:rnd()*9,init:0,yaw:0})}
function tickButterflies(dt,p,T){const on=!night()&&storm()<.4;const n=on?Math.round(40*DENS):0;for(let i=0;i<40;i++){const b=bfs[i];if(i>=n){Mx.makeScale(0,0,0);bfly.setMatrixAt(i,Mx);continue}
 if(!b.init||hyp(b.x-p.x,b.z-p.z)>45){b.init=1;for(let k=0;k<6;k++){const a=rnd()*TAU,d=6+rnd()*34;b.x=p.x+Math.cos(a)*d;b.z=p.z+Math.sin(a)*d;if(meadow(b.x,b.z))break}}
 b.yaw+=Math.sin(T*.7+b.ph)*dt*2;b.x+=-Math.sin(b.yaw)*dt*1.2;b.z+=-Math.cos(b.yaw)*dt*1.2;b.y=Math.max(H(b.x,b.z),0)+.5+Math.abs(Math.sin(T*1.1+b.ph))*1.1;
 E.set(0,b.yaw,0);Q.setFromEuler(E);const f=Math.sin(T*16+b.ph);Sc.set(.15+.85*Math.abs(f),1,1);P.set(b.x,b.y,b.z);Mx.compose(P,Q,Sc);bfly.setMatrixAt(i,Mx)}bfly.instanceMatrix.needsUpdate=true}
const FFN=160;const ffG=new THREE.BufferGeometry();const ffP=new Float32Array(FFN*3);ffG.setAttribute('position',new THREE.BufferAttribute(ffP,3));const ffD=[];for(let i=0;i<FFN;i++)ffD.push({x:0,y:-999,z:0,ph:rnd()*9,init:0});
const ffM=new THREE.PointsMaterial({map:W.softTex||null,color:0xd8ff70,size:.55,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0,fog:false});
const ff=new THREE.Points(ffG,ffM);ff.frustumCulled=false;scene.add(ff);
function tickFireflies(dt,p,T){const on=night()&&storm()<.5;ffM.opacity=lerp(ffM.opacity,on?1:0,dt);ff.visible=ffM.opacity>.02;if(!ff.visible)return;const n=Math.round(FFN*DENS);
 for(let i=0;i<FFN;i++){const f=ffD[i];if(i>=n){ffP[i*3+1]=-999;continue}if(!f.init||hyp(f.x-p.x,f.z-p.z)>40){f.init=1;const a=rnd()*TAU,d=3+rnd()*36;f.x=p.x+Math.cos(a)*d;f.z=p.z+Math.sin(a)*d}
  f.x+=Math.sin(T*.5+f.ph)*dt*.6;f.z+=Math.cos(T*.43+f.ph*1.3)*dt*.6;const blink=Math.max(0,Math.sin(T*1.7+f.ph*3));const g=Math.max(H(f.x,f.z),0);
  ffP[i*3]=f.x;ffP[i*3+1]=blink>.15?g+.6+Math.sin(T*.8+f.ph)*.9+1.2*((f.ph*7)%1):-999;ffP[i*3+2]=f.z}ffG.attributes.position.needsUpdate=true}
const LVN=140;const lvG=new THREE.BufferGeometry();const lvP=new Float32Array(LVN*3),lvC=new Float32Array(LVN*3);lvG.setAttribute('position',new THREE.BufferAttribute(lvP,3));lvG.setAttribute('color',new THREE.BufferAttribute(lvC,3));
const leafTex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.fillStyle='#fff';x.beginPath();x.ellipse(16,16,6,13,.6,0,TAU);x.fill();return new THREE.CanvasTexture(c)})();
const lvM=new THREE.PointsMaterial({map:leafTex,size:.22,vertexColors:true,transparent:true,alphaTest:.4,depthWrite:false});const lv=new THREE.Points(lvG,lvM);lv.frustumCulled=false;scene.add(lv);const lvD=[];
for(let i=0;i<LVN;i++){lvD.push({x:0,y:-999,z:0,vy:.6+rnd()*.6,ph:rnd()*9,init:0});C.set([0xc8902a,0xa85a20,0x8a9a30,0xd8b040,0x6a8a2a][i%5]);lvC.set([C.r,C.g,C.b],i*3)}
function tickLeaves(dt,p,T){const n=Math.round(LVN*DENS);const cx=camera.position.x,cz=camera.position.z;const wind=1+storm()*3;
 for(let i=0;i<LVN;i++){const l=lvD[i];if(i>=n){lvP[i*3+1]=-999;continue}const g=Math.max(H(l.x,l.z),0);
  if(!l.init||l.y<g||hyp(l.x-cx,l.z-cz)>30){l.init=1;let ok=false;for(let k=0;k<4&&!ok;k++){const a=rnd()*TAU,d=2+rnd()*26;l.x=cx+Math.cos(a)*d;l.z=cz+Math.sin(a)*d;ok=W.forestMask(l.x,l.z)>.5}
   l.y=ok?Math.max(H(l.x,l.z),0)+5+rnd()*12:-999;if(!ok){l.init=1;lvP[i*3+1]=-999;l.x=cx+999;continue}}
  l.y-=l.vy*dt;l.x+=(Math.sin(T*1.3+l.ph)*.8+.5*wind)*dt;l.z+=Math.cos(T*1.1+l.ph)*.6*dt;lvP[i*3]=l.x;lvP[i*3+1]=l.y;lvP[i*3+2]=l.z}lvG.attributes.position.needsUpdate=true}
// ================= ambient nature sounds
function tone(type,f0,f1,dur,vol,delay){const c=B.AU.ctx;if(!c||!SET.sound)return;const t=c.currentTime+(delay||0);const o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0004,t+dur);o.connect(g).connect(B.AU.m);o.start(t);o.stop(t+dur+.05)}
function knock(f,vol,delay){const c=B.AU.ctx;if(!c||!SET.sound)return;const t=c.currentTime+delay;const s=c.createBufferSource();s.buffer=B.AU.nb;const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;fl.Q.value=6;const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0004,t+.05);s.connect(fl).connect(g).connect(B.AU.m);s.start(t,rnd());s.stop(t+.08)}
const snd={
 woodpecker(){const n=12+Math.floor(rnd()*8);for(let i=0;i<n;i++)knock(1400,.12*(1-i/n*.5),i*.045)},
 caw(v){const n=2+Math.floor(rnd()*3);for(let i=0;i<n;i++){tone('sawtooth',560,400,.24,.05*v,i*.32);tone('square',1100,700,.2,.012*v,i*.32)}},
 cuckoo(){tone('sine',740,720,.25,.05);tone('sine',590,580,.35,.05,.32)},
 warble(){let t=0;for(let i=0;i<6+rnd()*6;i++){const f=2400+rnd()*2200;tone('sine',f,f*(.8+rnd()*.5),.07,.03,t);t+=.06+rnd()*.05}},
 frog(){const n=3+Math.floor(rnd()*4);for(let i=0;i<n;i++)tone('square',180+rnd()*30,140,.12,.03,i*.18)},
 owl(){tone('sine',380,340,.3,.06);tone('sine',360,320,.5,.06,.45);tone('sine',360,320,.5,.05,1.1)},
 raptor(v){tone('sawtooth',2600,1500,.9,.05*v);tone('sine',3100,1900,.8,.04*v)},
 quack(){for(let i=0;i<3;i++){tone('sawtooth',420,300,.13,.04,i*.2)}},
 wolf(){tone('sine',380,560,1.2,.035);tone('sine',560,420,1.4,.035,1.2)}};
let sndT=3;function tickSound(dt,p){if(!B.AU.ctx||!SET.sound||p.mode==='menu')return;sndT-=dt;if(sndT>0)return;sndT=2.5+rnd()*5;const n=night(),st=storm();if(st>.5)return;
 const fm=W.forestMask(p.x,p.z),nearW=Math.min(hyp(p.x-W.LAKE.x,p.z-W.LAKE.z)-W.LAKE.r,hyp(p.x-W.POND.x,p.z-W.POND.z)-W.POND.r)<40||Math.abs(p.x-W.riverX(p.z))<25;const r=rnd();
 if(n){if(nearW&&r<.5)snd.frog();else if(r<.75)snd.owl();else if(r<.82)snd.wolf()}
 else{if(fm>.5&&r<.3)snd.woodpecker();else if(r<.55)snd.warble();else if(r<.7)snd.caw(.7);else if(r<.8)snd.cuckoo();else if(nearW&&r<.95)snd.quack()}}
// ================= main
let T=0;function tick(dt){T+=dt;const p=player();tickHerds(dt,p,T);/* v5: decorative songbird flocks replaced by catchable songbirds in game.js */
 song.im.visible=!night();crows.im.visible=!night();tickFlock(crowF,dt,p,T,55,7);if(!night()){crowF.caw-=dt;if(crowF.caw<=0){crowF.caw=14+rnd()*20;const d=hyp(crowF.x-p.x,crowF.z-p.z);if(d<160)snd.caw(1-d/160)}}
 tickDucks(dt,p,T);tickRaptors(dt,p,T);tickButterflies(dt,p,T);tickFireflies(dt,p,T);tickLeaves(dt,p,T);tickSound(dt,p)}
function setDensity(d){DENS=d;buildHerds();buildDucks();buildRaptors()}
setDensity(DENS);
window.LIFE={tick,setDensity,snd,herds,ducks,raptors,get density(){return DENS}};
})();
