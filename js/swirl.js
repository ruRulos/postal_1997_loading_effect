/* Efecto CSwirl (recreación de cutscene.cpp / play.cpp) y dibujo en el canvas. */
var cv=document.getElementById('c'),ctx=cv.getContext('2d',{alpha:false});
var $=function(i){return document.getElementById(i)};
var img,mode='postal',paused=false,t0=performance.now(),tPause=0,lastDraw=0,V={};
function sample(){
  var c=document.createElement('canvas');c.width=640;c.height=480;var x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,640,480);g.addColorStop(0,'#2b1b12');g.addColorStop(1,'#7a1c14');
  x.fillStyle=g;x.fillRect(0,0,640,480);
  x.fillStyle='#000';x.fillRect(0,0,640,40);x.fillRect(0,440,640,40);
  x.fillStyle='#e8d9b5';x.font='bold 96px Georgia,serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('POSTAL',320,210);
  x.font='28px Georgia,serif';x.fillText(tr('sample.text'),320,300);
  x.strokeStyle='#e8d9b5';x.lineWidth=6;x.strokeRect(34,54,572,372);
  return c;
}
function iw(){return img.naturalWidth||img.width}
function ih(){return img.naturalHeight||img.height}
var bgc=document.createElement('canvas'),bgImg=null,defImg=new Image();
function buildBg(){
  var Sw=cv.width,Sh=cv.height;bgc.width=Sw;bgc.height=Sh;var b=bgc.getContext('2d');
  if(bgImg){var bw=bgImg.naturalWidth,bh=bgImg.naturalHeight,k=Math.max(Sw/bw,Sh/bh);b.drawImage(bgImg,(Sw-bw*k)/2,(Sh-bh*k)/2,bw*k,bh*k)}
  else{b.fillStyle='#2a2620';b.fillRect(0,0,Sw,Sh)}
}
function frameOn(){return !!(V.fr&&V.ov==='clip')}
function layout(){
  var M=frameOn()?Math.round(iw()*V.frw/200):0,tw=iw()+2*M,th=ih()+2*M;
  var Sw=Math.max(tw,Math.ceil(th*16/9)),Sh=Math.round(Sw*9/16);
  ps=Math.min(1,1280/Sw);var pw=Math.round(Sw*ps),ph=Math.round(Sh*ps);
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;buildBg()}
}

function params(){
  if(mode==='postal')return{n:2,A:0.5,R:24,sp:1,C:10000,F:15,P:'loop',rot:0,zm:1,bl:'source-over',rest:true,int:true,lead:2500};
  return{n:V.n,A:V.A,R:V.Rp*6.4,sp:V.sp,C:V.C,F:V.F,P:V.P,rot:V.rot,zm:V.zm,bl:V.bl,rest:V.rest,int:V.int,lead:0};
}
function sinD(d){return Math.sin(d*Math.PI/180)}
function cosD(d){return Math.cos(d*Math.PI/180)}

function paint(c,x0,y0,dw,dh,m,t,p,bg,src){
  src=src||img;
  x0=Math.round(x0);y0=Math.round(y0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality=(c===ctx)?'low':'high';
  var kx=dw/640,ky=dh/480;
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
  if(bg)c.drawImage(bg,0,0);else{c.fillStyle='#000';c.fillRect(0,0,c.canvas.width,c.canvas.height)}
  c.drawImage(src,x0,y0,dw,dh);
  if(!(p.P==='once'&&t>=p.C)){
    var te=t-p.lead,degS=p.sp===0?0:((360*te*p.sp/3600)%360+360)%360, degX=((360*te/p.C)%360+360)%360;
    if(p.int){degS=Math.floor(degS);degX=Math.floor(degX)}
    var sR=sinD(degX)*p.R;if(p.int)sR=Math.trunc(sR);
    sR=p.rest?Math.max(0,sR):Math.abs(sR);
    var ox,oy;
    if(p.int){ox=Math.trunc(cosD(degS)*sR)>>1;oy=(-Math.trunc(sinD(degS)*sR))>>1}
    else{ox=cosD(degS)*sR/2;oy=-sinD(degS)*sR/2}
    c.save();
    if(V.ov==='clip'){c.beginPath();c.rect(x0,y0,dw,dh);c.clip()}
    for(var i=0;i<p.n;i++){
      var a=i*2*Math.PI/p.n,vx=-ox*Math.cos(a)+oy*Math.sin(a),vy=-ox*Math.sin(a)-oy*Math.cos(a);
      c.save();
      if(i>0){c.globalAlpha=p.A;c.globalCompositeOperation=p.bl}
      if(i>0&&(p.rot||p.zm!==1)){
        c.translate(x0+dw/2+vx*kx,y0+dh/2+vy*ky);
        c.rotate(sinD(degS+i*360/p.n)*p.rot*Math.PI/180);
        c.scale(p.zm,p.zm);
        c.drawImage(src,-dw/2,-dh/2,dw,dh);
      }else c.drawImage(src,Math.round(x0+vx*kx),Math.round(y0+vy*ky),dw,dh);
      c.restore();
    }
    c.restore();
  }
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
  if(m>0){
    var h=m/2,L=Math.floor(x0-h),T=Math.floor(y0-h),R=Math.ceil(x0+dw+h),B=Math.ceil(y0+dh+h),il=Math.ceil(x0+h),it=Math.ceil(y0+h),ir=Math.floor(x0+dw-h),ib=Math.floor(y0+dh-h);
    c.fillStyle='#000';
    c.fillRect(L,T,R-L,it-T);c.fillRect(L,ib,R-L,B-ib);c.fillRect(L,it,il-L,ib-it);c.fillRect(ir,it,R-ir,ib-it);
  }
}
var ps=1,pc={};
function previewSrc(w,h){
  if(pc.img===img&&pc.w===w&&pc.h===h)return pc.c;
  var c=pc.c&&pc.c.width===w&&pc.c.height===h?pc.c:document.createElement('canvas');c.width=w;c.height=h;
  var x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(img,0,0,w,h);
  pc={img:img,w:w,h:h,c:c};return c;
}
function draw(t,p){
  var Sw=cv.width,Sh=cv.height,k=V.z/100*ps,dw=Math.max(1,Math.round(iw()*k)),dh=Math.max(1,Math.round(ih()*k));
  paint(ctx,(Sw-dw)/2,(Sh-dh)/2,dw,dh,frameOn()?dw*V.frw/100:0,t,p,bgc,previewSrc(dw,dh));
}

function curT(){return (paused?tPause:performance.now())-t0}
function redraw(){draw(curT(),params())}
function loop(now){
  requestAnimationFrame(loop);
  var p=params();
  if(paused||now-lastDraw<1000/p.F)return;
  lastDraw=now;draw(now-t0,p);
}
