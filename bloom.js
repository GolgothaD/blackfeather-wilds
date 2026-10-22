// Blackfeather Wilds — lightweight bloom (High preset only)
(function(){
'use strict';
const B=window.__BFW,{renderer,scene,camera}=B;
let rtScene=null,rtA=null,rtB=null,w=0,h=0,ok=true;
const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));quad.frustumCulled=false;const qs=new THREE.Scene();qs.add(quad);const qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const brightM=new THREE.ShaderMaterial({uniforms:{tex:{value:null},th:{value:.85}},vertexShader:VS,toneMapped:false,depthTest:false,depthWrite:false,
 fragmentShader:'uniform sampler2D tex;uniform float th;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));gl_FragColor=vec4(c*smoothstep(th,th+.9,l),1.);}'});
const blurM=new THREE.ShaderMaterial({uniforms:{tex:{value:null},dir:{value:new THREE.Vector2()}},vertexShader:VS,toneMapped:false,depthTest:false,depthWrite:false,
 fragmentShader:'uniform sampler2D tex;uniform vec2 dir;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb*.227;c+=(texture2D(tex,vUv+dir*1.38).rgb+texture2D(tex,vUv-dir*1.38).rgb)*.316;c+=(texture2D(tex,vUv+dir*3.23).rgb+texture2D(tex,vUv-dir*3.23).rgb)*.07;gl_FragColor=vec4(c,1.);}'});
const compM=new THREE.ShaderMaterial({uniforms:{tex:{value:null},bl:{value:null},k:{value:.55}},vertexShader:VS,depthTest:false,depthWrite:false,
 fragmentShader:'uniform sampler2D tex,bl;uniform float k;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb+texture2D(bl,vUv).rgb*k;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
function ensure(){const s=renderer.getDrawingBufferSize(new THREE.Vector2());if(s.x===w&&s.y===h&&rtScene)return;w=s.x;h=s.y;[rtScene,rtA,rtB].forEach(r=>r&&r.dispose());
 rtScene=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples:B.isTouch?0:4});const bw=Math.max(1,w>>2),bh=Math.max(1,h>>2);
 rtA=new THREE.WebGLRenderTarget(bw,bh,{type:THREE.HalfFloatType});rtB=new THREE.WebGLRenderTarget(bw,bh,{type:THREE.HalfFloatType})}
function pass(m,target){quad.material=m;renderer.setRenderTarget(target);renderer.render(qs,qc)}
function render(){if(!ok)return renderer.render(scene,camera);try{ensure();renderer.setRenderTarget(rtScene);renderer.render(scene,camera);
 brightM.uniforms.tex.value=rtScene.texture;pass(brightM,rtA);
 for(let i=0;i<2;i++){blurM.uniforms.tex.value=rtA.texture;blurM.uniforms.dir.value.set((i+1)/rtA.width,0);pass(blurM,rtB);blurM.uniforms.tex.value=rtB.texture;blurM.uniforms.dir.value.set(0,(i+1)/rtA.height);pass(blurM,rtA)}
 compM.uniforms.tex.value=rtScene.texture;compM.uniforms.bl.value=rtA.texture;pass(compM,null)}catch(e){ok=false;console.warn('bloom off',e);renderer.setRenderTarget(null);renderer.render(scene,camera)}}
window.BLOOM={setOn(){},render,get ok(){return ok}};
})();
