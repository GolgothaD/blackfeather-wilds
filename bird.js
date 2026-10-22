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
function wingGeo(len,chord,spikes){ // feathered planar wing in XZ plane, root at x=0, extends +x, trailing edge toward +z
 const s=new THREE.Shape();s.moveTo(0,-chord*.35);
 s.bezierCurveTo(len*.35,-chord*.55,len*.7,-chord*.45,len,-chord*.05);
 // trailing edge with primaries
 const n=spikes;for(let i=0;i<=n;i++){const t=1-i/n;const x=len*t;const base=chord*(.25+.55*Math.sin(Math.min(1,(1-t)*1.6+.15)*Math.PI*.5));
  s.lineTo(x+len*.02,base+chord*.18*(i<5?1:.4));s.lineTo(x-len*.03,base*.92)}
 s.lineTo(0,chord*.55);s.lineTo(0,-chord*.35);
 const g=new THREE.ShapeGeometry(s);g.rotateX(Math.PI/2);return g}
function makeBird(id){
 const sp=SPECIES[id],C=sp.colors;const g=new THREE.Group();const body=new THREE.Group();g.add(body);
 const sheen={metalness:C.sheen,roughness:C.sheen?.45:.75};
 const mb=mat(C.body,sheen),mbel=mat(C.belly,sheen),mw=mat(C.wing,Object.assign({side:THREE.DoubleSide},sheen)),mh=mat(C.head,sheen),mk=mat(C.beak,{roughness:.4}),mt=mat(C.tail,Object.assign({side:THREE.DoubleSide},sheen));
 const owl=id==='owl';
 const torso=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),mb);torso.scale.set(owl?1.15:1,owl?1.1:.95,owl?1.7:2.1);body.add(torso);
 const bel=new THREE.Mesh(new THREE.SphereGeometry(.19,14,10),mbel);bel.scale.set(owl?1.1:.92,.85,owl?1.6:1.9);bel.position.set(0,-.035,-.01);body.add(bel);
 const head=new THREE.Group();head.position.set(0,.07,-(owl?.33:.4));body.add(head);
 const hm=new THREE.Mesh(new THREE.SphereGeometry(owl?.16:.13,16,12),mh);hm.scale.set(1,owl?1:.95,1.1);head.add(hm);
 if(id==='falcon'){const mo=mat(0xdcd6cc);const ch=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),mo);ch.position.set(0,-.045,-.06);ch.scale.set(1.1,.7,1);head.add(ch)}
 const beakL=owl?.07:id==='crow'?.17:.12;const bk=new THREE.Mesh(new THREE.ConeGeometry(owl?.03:.045,beakL,8),mk);bk.rotation.x=-Math.PI/2-(id==='crow'?0:.35);bk.position.set(0,owl?-.03:-.01,-(owl?.16:.12)-beakL*.45);head.add(bk);
 const em=mat(C.eye,{roughness:.15,emissive:owl?0x553300:0x000000});
 for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(owl?.038:.022,10,8),em);e.position.set(s*(owl?.065:.085),.025,owl?-.13:-.07);head.add(e);
  const pu=new THREE.Mesh(new THREE.SphereGeometry(owl?.02:.012,8,6),mat(0x050505,{roughness:.1}));pu.position.set(s*(owl?.07:.093),.027,owl?-.162:-.08);head.add(pu)}
 if(owl){for(const s of [-1,1]){const t=new THREE.Mesh(new THREE.ConeGeometry(.035,.13,6),mh);t.position.set(s*.08,.15,-.02);t.rotation.z=-s*.35;head.add(t)}
  const disc=new THREE.Mesh(new THREE.CircleGeometry(.13,18),mat(0xa58660,{side:THREE.DoubleSide}));disc.position.set(0,0,-.135);disc.rotation.y=Math.PI;head.add(disc)}
 // tail
 const tg=new THREE.Group();tg.position.set(0,.02,.36*(owl?.8:1));body.add(tg);
 const ts=new THREE.Shape();const tw=id==='crow'?.12:id==='hawk'?.16:.11,tl=owl?.2:id==='eagle'?.3:.32;ts.moveTo(-.05,0);ts.lineTo(-tw,tl);ts.quadraticCurveTo(0,tl*1.12,tw,tl);ts.lineTo(.05,0);
 const tm=new THREE.Mesh(new THREE.ShapeGeometry(ts).rotateX(Math.PI/2),mt);tg.add(tm);
 // wings: shoulder pivot -> inner -> outer (wrist)
 const wings=[];const span=(owl?.62:id==='falcon'?.58:id==='eagle'?.7:.6),chord=owl?.36:id==='falcon'?.24:.3;
 for(const s of [-1,1]){const sh=new THREE.Group();sh.position.set(s*.12,.06,-.07);body.add(sh);
  const inner=new THREE.Mesh(wingGeo(span*.48,chord,3),mw);const wr=new THREE.Group();wr.position.set(span*.46,0,0);
  const outer=new THREE.Mesh(wingGeo(span*.6,chord*.92,7),mw);outer.position.set(-.01,0,-.01);wr.add(outer);
  const side=new THREE.Group();sh.scale.x=s;side.add(inner);side.add(wr);sh.add(side);
  // underside belly-colored covert stripe for raptors
  wings.push({sh,wr,s,side})}
 // legs
 const legs=new THREE.Group();body.add(legs);const lm=mat(id==='crow'?0x111111:0xd9b23a,{roughness:.5});
 for(const s of [-1,1]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.012,.015,.16,5),lm);l.position.set(s*.06,-.2,.02);legs.add(l);
  for(const a of [-.5,0,.5]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.006,.008,.08,4),lm);t.rotation.x=Math.PI/2;t.rotation.y=a;t.position.set(s*.06+Math.sin(a)*.03,-.275,-.02-Math.cos(a)*.03);legs.add(t)}}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true}});
 g.scale.setScalar(sp.size*1.25);
 g.userData={body,head,wings,tail:tg,legs,phase:0,fold:1,flap:0,tuck:0,id};
 return g}
// pose: mode 'fly'|'perch'; flap 0..1 intensity; tuck 0..1 dive
function animBird(b,dt,o){const u=b.userData;u.phase+=dt*(o.flapRate||9);
 const fold=o.mode==='fly'?0:1;u.fold+=(fold-u.fold)*Math.min(1,dt*6);u.tuck+=((o.tuck||0)-u.tuck)*Math.min(1,dt*5);u.flap+=((o.flap||0)-u.flap)*Math.min(1,dt*8);
 const f=u.fold,tk=u.tuck,fl=u.flap;const w=Math.sin(u.phase);
 for(const W of u.wings){const a=(fl*(w*.9+.15))+(1-fl)*.06*Math.sin(u.phase*.3)+tk*.1;
  // spread: z rotation (dihedral). folded: wings swing back along body
  W.side.rotation.z=(a*(1-f))*1-f*.45;W.sh.rotation.z=0;
  W.side.rotation.y=-(f*1.5+tk*.75);W.side.rotation.x=f*.1;
  W.wr.rotation.y=-(f*.22+tk*.6)+fl*Math.cos(u.phase)*.25*(1-f);W.wr.rotation.z=(1-f)*fl*w*.35;
}
 u.tail.rotation.x=(o.mode==='fly'?-.05:.35)+(o.brake||0)*.4;u.tail.scale.x=1+(o.brake||0)*.6-tk*.3;
 u.legs.visible=o.mode!=='fly'||(o.brake||0)>.3;
 u.head.rotation.y=o.look||0;u.head.rotation.x=o.peck||0}
window.BIRDS={SPECIES,ORDER,makeBird,animBird};
})();
