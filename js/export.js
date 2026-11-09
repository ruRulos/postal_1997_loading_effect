/* Exportación de video (MP4 con WebCodecs, o MediaRecorder como respaldo) y descarga. */
function say(x){$('st').textContent=x}
var exporting=false,last=null;
function getSaver(){
  function local(){return{save:function(o){var a=document.createElement('a');a.href=URL.createObjectURL(o.data);a.download=o.filename;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000);return Promise.resolve()}}}
  if(window.claude&&window.claude.use)return window.claude.use('downloads').then(function(d){return d||local()}).catch(local);
  return Promise.resolve(local());
}
function finish(blob,name){
  last={blob:blob,name:name};var b=$('dl');b.hidden=false;b.textContent=tr('dl.fmt',{fmt:name.split('.').pop().toUpperCase()});doSave();
}
function doSave(){
  if(!last)return;
  getSaver().then(function(d){return d.save({filename:last.name,data:last.blob})})
    .then(function(){say(tr('st.done'))})
    .catch(function(e){say(e&&e.code==='declined'?tr('st.cancelled'):tr('st.savefail'))});
}
function exportVideo(q){
  if(exporting)return;
  if(window.VideoEncoder&&window.VideoFrame&&window.Mp4Muxer){
    exporting=true;
    encodeMp4(q).then(function(ok){exporting=false;if(ok===false)exportRec(q)})
      .catch(function(){exporting=false;say(tr('st.mp4fail'))});
  }else exportRec(q);
}
async function encodeMp4(q){
  var p=params(),W=iw(),H=ih(),M=frameOn()?Math.round(W*V.frw/200):0,tw=W+2*M,th=H+2*M;
  var hi=q==='high',k=Math.min(hi?Math.max(1,1080/Math.min(tw,th)):1,Math.sqrt(8294400/(tw*th)));
  var ew=2*Math.round(tw*k/2),eh=2*Math.round(th*k/2),mm=Math.round(M*k),Wk=ew-2*mm,Hk=eh-2*mm;
  var fps=p.F,total=Math.max(1,Math.round(p.C*fps/1000));
  var br=Math.min(80e6,Math.max(hi?16e6:8e6,Math.round(ew*eh*fps*(hi?1:0.8))));
  var area=ew*eh,cands=area<=921600?['avc1.64001f','avc1.640028','avc1.640033']:area<=2097152?['avc1.640028','avc1.640033']:['avc1.640033','avc1.640034'];
  var cfg=null;
  for(var i=0;i<cands.length&&!cfg;i++){
    var c={codec:cands[i],width:ew,height:eh,bitrate:br,framerate:fps,latencyMode:'quality',bitrateMode:'constant',avc:{format:'avc'}};
    var r=await VideoEncoder.isConfigSupported(c);if(r&&r.supported)cfg=c;
  }
  if(!cfg)return false;
  var muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:ew,height:eh},fastStart:'in-memory'});
  var err=null,enc=new VideoEncoder({output:function(ch,meta){muxer.addVideoChunk(ch,meta)},error:function(e){err=e}});
  enc.configure(cfg);
  var ec=document.createElement('canvas');ec.width=ew;ec.height=eh;var ex=ec.getContext('2d');
  for(var f=0;f<total;f++){
    if(err)throw err;
    paint(ex,mm,mm,Wk,Hk,2*mm,f*1000/fps,p,null);
    var vf=new VideoFrame(ec,{timestamp:Math.round(f*1e6/fps),duration:Math.round(1e6/fps)});
    enc.encode(vf,{keyFrame:f%(fps*2)===0});vf.close();
    while(enc.encodeQueueSize>4)await new Promise(function(r){setTimeout(r,0)});
    if(f%4===0){say(tr('st.encoding',{p:Math.round(100*f/total)}));await new Promise(function(r){setTimeout(r,0)})}
  }
  await enc.flush();if(err)throw err;
  muxer.finalize();
  finish(new Blob([muxer.target.buffer],{type:'video/mp4'}),'postal-swirl.mp4');
  return true;
}
function exportRec(q){
  if(exporting)return;
  if(!window.MediaRecorder){say(tr('st.norec'));return}
  getSaver().then(function(d){
    var p=params(),W=iw(),H=ih(),M=frameOn()?Math.round(W*V.frw/200):0,ew=W+2*M,eh=H+2*M;
    if(ew%2)ew++;if(eh%2)eh++;
    var ec=document.createElement('canvas');ec.width=ew;ec.height=eh;var ex=ec.getContext('2d');
    var types=['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm'];
    var mt=types.filter(function(t){return MediaRecorder.isTypeSupported(t)})[0];
    if(!mt){say(tr('st.norec'));return}
    var mp4=mt.indexOf('mp4')>-1,chunks=[],stream=ec.captureStream(p.F),iv;
    var rec=new MediaRecorder(stream,{mimeType:mt,videoBitsPerSecond:Math.min(80e6,Math.max(q==='high'?16e6:8e6,Math.round(ew*eh*p.F*(q==='high'?1:0.8))))});
    var start=performance.now();
    function fr(t){paint(ex,(ew-W)/2,(eh-H)/2,W,H,2*M,t,p,null)}
    rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=function(){
      stream.getTracks().forEach(function(t){t.stop()});
      var blob=new Blob(chunks,{type:mp4?'video/mp4':'video/webm'});
      exporting=false;finish(blob,'share-the-pain.'+(mp4?'mp4':'webm'));
    };
    exporting=true;fr(0);rec.start();
    iv=setInterval(function(){
      var t=performance.now()-start;
      if(t>=p.C){clearInterval(iv);say(tr('st.processing'));rec.stop();return}
      fr(t);say(tr('st.recording',{p:Math.round(100*t/p.C)}));
    },1000/p.F);
  });
}
