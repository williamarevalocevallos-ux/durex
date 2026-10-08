/* Durexporta — motion-design fruit morph (WebGL) */
(function(){
const T=THREE;
const SRC=['img/mango-hd.webp','img/pitahaya-hd.webp','img/banano-hd.webp','img/platano-hd.webp','img/aguacate-hd.webp'];
const COLS=[[1,.72,.18],[1,.25,.55],[1,.86,.2],[.55,.85,.25],[.35,.75,.25]];
const loader=new T.TextureLoader();const ARS=SRC.map(()=>1);
const texs=SRC.map((s,i)=>{const t=loader.load(s,tx=>{ARS[i]=tx.image.width/tx.image.height;tx.needsUpdate=true});t.minFilter=T.LinearMipmapLinearFilter;t.encoding=T.sRGBEncoding;t.anisotropy=8;return t});
const VS=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FS=`
precision highp float;varying vec2 vUv;
uniform sampler2D uA,uB;uniform float uArA,uArB,uAr,uP,uT,uSA,uSB,uRA,uRB,uDA,uDB,uSh;uniform vec2 uM;uniform vec3 uCA,uCB;
float h(float n){return fract(sin(n*127.1)*43758.5453);}
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*nz(p);p=p*2.07+vec2(1.7,9.2);a*=.5;}return v;}
vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c)*v;}
vec2 fit(vec2 uv,float ar){vec2 s=uAr>ar?vec2(uAr/ar,1.):vec2(1.,ar/uAr);return (uv-.5)*s*1.75+.5;}
vec4 tx(sampler2D t,vec2 uv){if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return vec4(0);return texture2D(t,uv);}
vec3 pal(float t){return .5+.5*cos(6.2832*(t+vec3(.0,.33,.67)));}
// front f in [-.6,.6] (c.x units). side=+1 keep left of front, -1 keep right
vec4 fruit(sampler2D t,float ar,vec2 c,float s,float r,float f,float side,float seed){
  vec2 uv=fit(rot(c,r)/s+.5,ar);vec4 m=tx(t,uv);if(m.a<.01)return vec4(0);
  float j=(fbm(uv*9.+seed)-.5)*.16+(hh(floor(uv*120.))-.5)*.03; // ragged + grainy crumbling edge
  float k=smoothstep(-.004,.004,(f-c.x-j)*side);
  return vec4(m.rgb*m.a,m.a)*k;}
void main(){
  float p=uP,bell=sin(p*3.14159);
  vec2 c=vUv-.5;c.y-=sin(uT*1.3)*.006;c+=uM*.015;
  vec2 w=c;w.x*=uAr;                       // isotropic coords for smoke
  float fA=mix(.62,-.62,uDA),fB=mix(-.62,.62,1.-uDB);
  vec4 A=fruit(uA,uArA,c,uSA,uRA,fA,1.,1.7);
  vec4 B=fruit(uB,uArB,c,uSB,uRB,fB,1.,9.3);
  vec4 F=A+B*(1.-A.a);
  // ---------- ink / smoke plume ----------
  float front=mix(fA,fB,smoothstep(.35,.65,p))*uAr;
  float dx=w.x-front;                        // distance downstream of front
  vec2 s=w;s.x-=uT*.18+p*.6;
  vec2 q=vec2(fbm(s*2.2+uT*.05),fbm(s*2.2+vec2(5.2,1.3)-uT*.04));
  float d=fbm(s*2.6+q*2.2);
  float spread=.06+max(dx,0.)*.32;
  float env=smoothstep(-.06,.05,dx)*exp(-max(dx,0.)*2.4)*exp(-pow(w.y+.02-(q.y-.5)*.25,2.)/(spread*spread));
  float dens=smoothstep(.36,.62,d)*env*smoothstep(0.,.15,bell)*3.2;
  // wispy strands
  float str=pow(1.-abs(sin((w.y*9.+fbm(s*1.4)*6.+dx*3.))),18.)*env*smoothstep(.0,.4,dx)*bell;
  dens=clamp(dens+str*.9,0.,.96);
  vec3 sc=pal(dx*.9+d*.6+p*.5+.55);
  sc=pow(sc,vec3(1.6));sc=mix(sc,mix(uCA,uCB,p),.2);
  sc=pow(sc*(.55+.6*d),vec3(2.2));                              // volumetric shading
  // debris shards flying off the front
  vec3 db=vec3(0);float da=0.;
  for(int i=0;i<45;i++){float fi=float(i);
    float life=fract(p*1.3+h(fi));float yy=(h(fi+2.)-.5)*.5;
    vec2 pp=vec2(front+life*(.25+.5*h(fi+5.)),yy+(h(fi+8.)-.5)*life*.3);
    float sz=(.003+.007*h(fi+9.))*(1.-life*.7);
    float g=smoothstep(sz,sz*.3,length(w-pp))*bell;
    db+=pow(pal(h(fi+3.)),vec3(2.6))*g;da=max(da,g);}
  vec4 S=vec4(sc*dens,dens);
  S=S+vec4(db,da)*(1.-S.a);
  vec4 O=F+S*(1.-F.a);
  // soft shadow tinted by the smoke
  float sh=smoothstep(.2,0.,length((vUv-vec2(.5,.2))*vec2(1.,7.)))*.25*uSh;
  O.a=max(O.a,sh*(1.-O.a));
  gl_FragColor=O;
  #include <encodings_fragment>
}`;
function ease(t){return t<.5?4.*t*t*t:1.-Math.pow(-2.*t+2.,3.)/2.}
function back(t){const c=2.2;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
function Morph(el){
  const R=new T.WebGLRenderer({antialias:true,alpha:true,premultipliedAlpha:true});
  R.setPixelRatio(Math.min(2,devicePixelRatio));R.outputEncoding=T.sRGBEncoding;
  el.appendChild(R.domElement);Object.assign(R.domElement.style,{position:'absolute',inset:0,width:'100%',height:'100%'});
  const S=new T.Scene(),C=new T.OrthographicCamera(-.5,.5,.5,-.5,0,1);
  const U={uA:{value:texs[0]},uB:{value:texs[1]},uArA:{value:1},uArB:{value:1},uAr:{value:1},uP:{value:0},uT:{value:0},uM:{value:new T.Vector2()},
    uSA:{value:1},uSB:{value:0},uRA:{value:0},uRB:{value:0},uDA:{value:0},uDB:{value:1},uSh:{value:1},uCA:{value:new T.Vector3()},uCB:{value:new T.Vector3()}};
  const mat=new T.ShaderMaterial({vertexShader:VS,fragmentShader:FS,uniforms:U,transparent:true});
  mat.blending=T.CustomBlending;mat.blendSrc=T.OneFactor;mat.blendDst=T.OneMinusSrcAlphaFactor;
  S.add(new T.Mesh(new T.PlaneGeometry(1,1),mat));
  function size(){const w=el.clientWidth,h=el.clientHeight;R.setSize(w,h,false);U.uAr.value=w/h}
  addEventListener('resize',size);size();
  const tgt=new T.Vector2();
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();tgt.set((e.clientX-r.left)/r.width-.5,-((e.clientY-r.top)/r.height-.5))});
  el.addEventListener('pointerleave',()=>tgt.set(0,0));
  const t0=performance.now();
  return{
    set(pos){
      const N=SRC.length,a=Math.max(0,Math.min(N-1,Math.floor(pos))),b=Math.min(N-1,a+1);
      let f=pos-a;if(a===b)f=0;f=Math.max(0,Math.min(1,(f-.2)/.6));
      // A burns away into embers, B materialises from them
      const fa=Math.min(1,f/.6),fb=Math.max(0,(f-.4)/.6);
      U.uDA.value=fa;U.uDB.value=1-fb;
      U.uSA.value=1+fa*.04;U.uRA.value=fa*.05;
      U.uSB.value=.94+.06*back(fb);U.uRB.value=(1-ease(fb))*-.08;
      U.uSh.value=1;
      U.uA.value=texs[a];U.uB.value=texs[b];U.uArA.value=ARS[a];U.uArB.value=ARS[b];U.uP.value=f;
      U.uCA.value.set(...COLS[a]);U.uCB.value.set(...COLS[b]);
    },
    render(){U.uT.value=(performance.now()-t0)/1000;U.uM.value.lerp(tgt,.08);R.render(S,C)}
  };
}
window.FruitMorph={Morph,count:SRC.length};
})();
