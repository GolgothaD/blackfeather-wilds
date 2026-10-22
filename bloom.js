// Blackfeather Wilds — lightweight bloom (High preset only)
(function(){
'use strict';
const B=window.__BFW,{renderer,scene,camera}=B;
let rtScene=null,rtA=null,rtB=null,rtAO=null,rtS=null,w=0,h=0,ok=true;
const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));quad.frustumCulled=false;const qs=new THREE.Scene();qs.add(quad);const qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const brightM=new THREE.ShaderMaterial({uniforms:{tex:{value:null},th:{value:.85}},vertexShader:VS,toneMapped:false,depthTest:false,depthWrite:false,
 fragmentShader:'uniform sampler2D tex;uniform float th;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));gl_FragColor=vec4(c*smoothstep(th,th+.9,l),1.);}'});
const blurM=new THREE.ShaderMaterial({uniforms:{tex:{value:null},dir:{value:new THREE.Vector2()}},vertexShader:VS,toneMapped:false,depthTest:false,depthWrite:false,
 fragmentShader:'uniform sampler2D tex;uniform vec2 dir;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb*.227;c+=(texture2D(tex,vUv+dir*1.38).rgb+texture2D(tex,vUv-dir*1.38).rgb)*.316;c+=(texture2D(tex,vUv+dir*3.23).rgb+texture2D(tex,vUv-dir*3.23).rgb)*.07;gl_FragColor=vec4(c,1.);}'});

const aoM=new THREE.ShaderMaterial({uniforms:{dep:{value:null},cn:{value:.1},cf:{value:1000},px:{value:new THREE.Vector2()},pm:{value:new THREE.Vector2(1,1)}},vertexShader:VS,toneMapped:false,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D dep;uniform float cn,cf;uniform vec2 px,pm;varying vec2 vUv;
 float ld(vec2 u){float z=texture2D(dep,u).x*2.-1.;return 2.*cn*cf/(cf+cn-z*(cf-cn));}
 vec3 vp(vec2 u){float d=ld(u);return vec3((u*2.-1.)*pm*d,-d);}
 void main(){float d=ld(vUv);if(d>350.){gl_FragColor=vec4(1.);return;}vec3 p=vp(vUv);vec3 n=normalize(cross(dFdx(p),dFdy(p)));
  float rad=clamp(1.6/d,.004,.08);float ao=0.;float a0=fract(sin(dot(gl_FragCoord.xy,vec2(12.98,78.23)))*43758.5)*6.283;
  for(int i=0;i<10;i++){float t=(float(i)+.5)/10.;float a=a0+float(i)*2.4;vec2 o=vec2(cos(a),sin(a))*rad*t;vec3 q=vp(vUv+o)-p;float L=length(q);
   ao+=max(0.,dot(n,q/L)-.08)*(1./(1.+L*L*.25))*smoothstep(4.,.0,L);}
  ao=clamp(1.-ao/10.*2.2,0.,1.);gl_FragColor=vec4(vec3(ao),1.);}`});
const shM=new THREE.ShaderMaterial({uniforms:{dep:{value:null},tex:{value:null},sp:{value:new THREE.Vector2(.5,.5)},on:{value:1}},vertexShader:VS,toneMapped:false,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D dep,tex;uniform vec2 sp;uniform float on;varying vec2 vUv;void main(){vec2 dl=(vUv-sp)/28.;vec2 u=vUv;float acc=0.,w=1.;
  for(int i=0;i<28;i++){u-=dl;float sky=step(.99995,texture2D(dep,u).x);float l=dot(texture2D(tex,u).rgb,vec3(.33));acc+=sky*smoothstep(.7,1.6,l)*w;w*=.95;}
  gl_FragColor=vec4(vec3(acc/10.)*on,1.);}`});
const compM=new THREE.ShaderMaterial({uniforms:{tex:{value:null},bl:{value:null},ao:{value:null},sh:{value:null},shc:{value:new THREE.Color(1,.85,.62)},k:{value:.55}},vertexShader:VS,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tex,bl,ao,sh;uniform vec3 shc;uniform float k;varying vec2 vUv;void main(){
 float o=texture2D(ao,vUv).r;vec3 c=texture2D(tex,vUv).rgb*mix(.35,1.,o)+texture2D(bl,vUv).rgb*k+texture2D(sh,vUv).rgb*shc*.55;gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 vec3 g=gl_FragColor.rgb;float L=dot(g,vec3(.2126,.7152,.0722));g=mix(vec3(L),g,1.1);
 g+=mix(vec3(-.012,.0,.02),vec3(.025,.012,-.02),smoothstep(.15,.75,L));g=clamp(g,0.,1.);g=g*g*(3.-2.*g)*.25+g*.75;
 vec2 vc=vUv-.5;g*=1.-dot(vc,vc)*.55;gl_FragColor.rgb=g;
 #include <colorspace_fragment>
}`});
function ensure(){const s=renderer.getDrawingBufferSize(new THREE.Vector2());if(s.x===w&&s.y===h&&rtScene)return;w=s.x;h=s.y;[rtScene,rtA,rtB,rtAO,rtS].forEach(r=>r&&r.dispose());
 rtScene=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples:B.isTouch?0:4});rtScene.depthTexture=new THREE.DepthTexture(w,h);rtScene.depthTexture.type=THREE.UnsignedIntType;
 rtAO=new THREE.WebGLRenderTarget(Math.max(1,w>>1),Math.max(1,h>>1));rtS=new THREE.WebGLRenderTarget(Math.max(1,w>>2),Math.max(1,h>>2),{type:THREE.HalfFloatType});const bw=Math.max(1,w>>2),bh=Math.max(1,h>>2);
 rtA=new THREE.WebGLRenderTarget(bw,bh,{type:THREE.HalfFloatType});rtB=new THREE.WebGLRenderTarget(bw,bh,{type:THREE.HalfFloatType})}
const V3=new THREE.Vector3(),V4=new THREE.Vector3(),V5=new THREE.Vector3();
function pass(m,target){quad.material=m;renderer.setRenderTarget(target);renderer.render(qs,qc)}
function render(){if(!ok)return renderer.render(scene,camera);try{ensure();renderer.setRenderTarget(rtScene);renderer.render(scene,camera);
 brightM.uniforms.tex.value=rtScene.texture;pass(brightM,rtA);
 for(let i=0;i<2;i++){blurM.uniforms.tex.value=rtA.texture;blurM.uniforms.dir.value.set((i+1)/rtA.width,0);pass(blurM,rtB);blurM.uniforms.tex.value=rtB.texture;blurM.uniforms.dir.value.set(0,(i+1)/rtA.height);pass(blurM,rtA)}
 aoM.uniforms.dep.value=rtScene.depthTexture;aoM.uniforms.cn.value=camera.near;aoM.uniforms.cf.value=camera.far;const th=Math.tan(camera.fov*Math.PI/360);aoM.uniforms.pm.value.set(th*camera.aspect,th);pass(aoM,rtAO);
 const sv=V3.copy(B.sun.position).sub(B.sun.target.position).normalize().multiplyScalar(500).add(camera.position).project(camera);const fw=camera.getWorldDirection(V4).dot(V5.copy(B.sun.position).sub(B.sun.target.position).normalize());
 shM.uniforms.sp.value.set(sv.x*.5+.5,sv.y*.5+.5);shM.uniforms.on.value=Math.max(0,fw)*(sv.z<1?1:0);shM.uniforms.dep.value=rtScene.depthTexture;shM.uniforms.tex.value=rtScene.texture;pass(shM,rtS);
 compM.uniforms.tex.value=rtScene.texture;compM.uniforms.bl.value=rtA.texture;compM.uniforms.ao.value=rtAO.texture;compM.uniforms.sh.value=rtS.texture;pass(compM,null)}catch(e){ok=false;console.warn('bloom off',e);renderer.setRenderTarget(null);renderer.render(scene,camera)}}
window.BLOOM={setOn(){},render,get ok(){return ok}};
})();
