export function audioError(e) {
  if(/Choose 0.5/.test(e?.message||''))return 'مدة الصوت يجب أن تكون من 0.5 إلى 60 ثانية. سجّل مقطع أطول أو اختار مثال جاهز.';
  if(['NotAllowedError','SecurityError'].includes(e?.name)) return 'اسمح باستخدام الميكروفون من علامة القفل جنب العنوان، ثم جرّب التسجيل مرة تانية.';
  if(e?.name==='NotFoundError') return 'مش لاقيين ميكروفون متصل. وصّل ميكروفون أو جرّب مثال جاهز.';
  if(e?.name==='NotReadableError') return 'الميكروفون مش متاح. اقفل أي برنامج تاني بيستخدمه وجرّب تاني.';
  if(e?.name==='EncodingError' || /unable to decode|decode audio/i.test(e?.message||'')) return 'المتصفح مش قادر يفك صيغة الملف. جرّب WAV بصيغة PCM أو MP3، أو سجّل مباشرة بالميكروفون. تغيير امتداد الملف لوحده مش بيحوّل صيغته.';
  return e?.message || String(e);
}
export function encodeWav(samples,sampleRate=16000) {
  const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);
  const str=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);
  v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  str(36,'data');v.setUint32(40,samples.length*2,true);
  samples.forEach((x,i)=>v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true));
  return buffer;
}
export function parseWav(buffer) {
  const v=new DataView(buffer),tag=at=>String.fromCharCode(...new Uint8Array(buffer,at,4));
  if(buffer.byteLength<12 || tag(0)!=='RIFF' || tag(8)!=='WAVE') return null;
  let format,channels,rate,bits,align,data;
  for(let at=12;at+8<=v.byteLength;) {
    const kind=tag(at),size=v.getUint32(at+4,true),start=at+8;
    if(start+size>v.byteLength) throw new Error('ملف WAV ناقص أو تالف. جرّب تصديره من جديد أو استخدم التسجيل المباشر.');
    if(kind==='fmt ') {
      if(size<16) throw new Error('Invalid WAV format');
      format=v.getUint16(start,true);channels=v.getUint16(start+2,true);rate=v.getUint32(start+4,true);
      align=v.getUint16(start+12,true);bits=v.getUint16(start+14,true);
      if(format===65534 && size>=40) format=v.getUint16(start+24,true);
    }
    if(kind==='data') data={start,size};
    at=start+size+(size%2);
  }
  if(!data || !channels || !rate || !align) throw new Error('ملف WAV لا يحتوي على صوت صالح.');
  if(![1,3].includes(format)) return null;
  if(![8,16,24,32].includes(bits) || format===3&&bits!==32 || align!==channels*bits/8) return null;
  if(channels>32 || rate<8000 || rate>384000) throw new Error('Unsupported WAV sample rate or channels');
  const frames=Math.floor(data.size/align);
  if(frames/rate>60) throw new Error('مدة الصوت يجب أن تكون من 0.5 إلى 60 ثانية');
  const samples=new Float32Array(frames);
  for(let i=0;i<frames;i++) for(let c=0;c<channels;c++) {
    const at=data.start+i*align+c*bits/8;let x;
    if(format===3) x=v.getFloat32(at,true);
    else if(bits===8) x=(v.getUint8(at)-128)/128;
    else if(bits===16) x=v.getInt16(at,true)/32768;
    else if(bits===32) x=v.getInt32(at,true)/2147483648;
    else {let n=v.getUint8(at)|(v.getUint8(at+1)<<8)|(v.getUint8(at+2)<<16);if(n&0x800000)n-=0x1000000;x=n/8388608;}
    samples[i]+=x/channels;
  }
  return {samples,sampleRate:rate};
}
export async function resample(samples,rate) {
  if(rate===16000) return samples;
  const context=new OfflineAudioContext(1,Math.round(samples.length*16000/rate),16000);
  const buffer=context.createBuffer(1,samples.length,rate);buffer.copyToChannel(samples,0);
  const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);source.start();
  return (await context.startRendering()).getChannelData(0).slice();
}
export function parseRawPcm(buffer,{format,sampleRate,channels}={}) {
  const sizes={s16le:2,s24le:3,s32le:4,f32le:4,u8:1};
  if(!sizes[format] || !Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000 || !Number.isInteger(channels)||channels<1||channels>8)throw new Error('ملف PCM خام محتاج تحديد معدل العينة وعدد القنوات ونوع العينات الصحيح.');
  const width=sizes[format],stride=width*channels;
  if(!buffer.byteLength||buffer.byteLength%stride)throw new Error('حجم ملف PCM لا يطابق إعدادات العينات والقنوات.');
  const frames=buffer.byteLength/stride;
  if(frames/sampleRate<.5||frames/sampleRate>60)throw new Error('مدة الصوت يجب أن تكون من 0.5 إلى 60 ثانية');
  const v=new DataView(buffer),samples=new Float32Array(frames);
  for(let i=0;i<frames;i++)for(let c=0;c<channels;c++){
    const at=i*stride+c*width;let x;
    if(format==='s16le')x=v.getInt16(at,true)/32768;
    else if(format==='s32le')x=v.getInt32(at,true)/2147483648;
    else if(format==='f32le')x=v.getFloat32(at,true);
    else if(format==='u8')x=(v.getUint8(at)-128)/128;
    else{let n=v.getUint8(at)|(v.getUint8(at+1)<<8)|(v.getUint8(at+2)<<16);if(n&0x800000)n-=0x1000000;x=n/8388608;}
    if(!Number.isFinite(x))throw new Error('بيانات PCM غير صالحة. راجع نوع العينات.');samples[i]+=x/channels;
  }
  return {samples,sampleRate};
}
export async function readAudio(file,{pcm,onStatus=()=>{}}={}) {
  if(!file.size) throw new Error('الملف فاضي. اختار تسجيل فيه صوت أو جرّب مثال جاهز.');
  if(file.size>100*1024*1024) throw new Error('الملف كبير جدًا. اختار مقطع صوت لا يتجاوز 60 ثانية.');
  const bytes=await file.arrayBuffer(),wav=parseWav(bytes);
  if(wav) return resample(wav.samples,wav.sampleRate);
  if(/\.(pcm|raw)$/i.test(file.name)){const raw=parseRawPcm(bytes,pcm);return resample(raw.samples,raw.sampleRate);}
  let decoded;
  try{const context=new OfflineAudioContext(1,1,16000);decoded=await context.decodeAudioData(bytes.slice(0));}
  catch{
    onStatus('المتصفح مش بيفك الصيغة دي مباشرة. بنجهز التحويل المحلي…');
    const {convertAudio}=await import('./convert-audio.mjs?v=28ef369de2067dd52966');
    return convertAudio(bytes,onStatus);
  }
  if(decoded.duration<.5 || decoded.duration>60) throw new Error('مدة الصوت يجب أن تكون من 0.5 إلى 60 ثانية');
  const samples=new Float32Array(decoded.length);
  for(let c=0;c<decoded.numberOfChannels;c++){const channel=decoded.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]+=channel[i]/decoded.numberOfChannels;}
  return samples;
}
export async function recordMicrophone(onLevel) {
  if(!navigator.mediaDevices?.getUserMedia) throw new Error('التسجيل يحتاج متصفح حديث على localhost أو HTTPS. جرّب مثال جاهز أو ارفع ملف.');
  const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  const settings=stream.getAudioTracks()[0]?.getSettings?.()||{};
  const captureSettings=Object.fromEntries(['sampleRate','channelCount','echoCancellation','noiseSuppression','autoGainControl'].filter(key=>key in settings).map(key=>[key,settings[key]]));
  let context;
  try {
    // Capture at the device's preferred rate; resample once after recording.
    context=new AudioContext({latencyHint:'playback'});await context.audioWorklet.addModule('/assets/app/capture-worklet.mjs?v=28ef369de2067dd52966');
    const chunks=[],source=context.createMediaStreamSource(stream),node=new AudioWorkletNode(context,'pcm-capture');
    let stopped=false,interrupted=false,captureError=null,finishCapture=null,chunkCount=0,diagnostics=null;
    node.port.onmessage=({data})=>{
      if(data.type==='stopped'){finishCapture?.(data);return;}
      if(data.type!=='chunk')return;
      const samples=data.samples;chunks.push(samples);chunkCount++;
      let sum=0;for(const x of samples)sum+=x*x;
      onLevel?.(Math.min(1,Math.sqrt(sum/samples.length)*5));
    };
    node.onprocessorerror=()=>{captureError=new Error('تعذر تسجيل الصوت بشكل سليم. أعد التسجيل.');};
    source.connect(node);node.connect(context.destination);await context.resume();
    if(context.state!=='running')throw new Error('تعذر بدء تسجيل الصوت. أعد المحاولة.');
    context.onstatechange=()=>{if(!stopped&&context.state!=='running')interrupted=true;};
    for(const track of stream.getTracks())track.onended=()=>{if(!stopped)interrupted=true;};
    return {get diagnostics(){return diagnostics;},async stop(){
      if(stopped) throw new Error('Recording already stopped');stopped=true;
      source.disconnect();stream.getTracks().forEach(track=>track.stop());
      let timeout;
      try{
        if(interrupted||captureError)throw captureError||new Error('التسجيل اتقطع أثناء التقاط الصوت. خلي الصفحة مفتوحة وأعد التسجيل.');
        const ended=await new Promise((resolve,reject)=>{
          finishCapture=resolve;
          timeout=setTimeout(()=>reject(new Error('تعذر استلام التسجيل كاملًا. أعد التسجيل.')),2500);
          node.port.postMessage({type:'stop'});
        });
        const count=chunks.reduce((n,c)=>n+c.length,0),rate=context.sampleRate;
        if(captureError||count!==ended.frames||rate!==ended.sampleRate)throw captureError||new Error('التسجيل غير مكتمل. أعد التسجيل.');
        if(count/rate<.5)throw new Error('مدة الصوت يجب أن تكون من 0.5 إلى 60 ثانية');
        const samples=new Float32Array(count);let at=0;
        for(const chunk of chunks){samples.set(chunk,at);at+=chunk.length;}
        diagnostics={sampleRate:rate,capturedFrames:count,chunks:chunkCount,seconds:count/rate,outputSampleRate:16000,captureSettings};
        return (await resample(samples,rate)).slice(0,960000);
      }finally{
        clearTimeout(timeout);finishCapture=null;node.port.onmessage=null;node.onprocessorerror=null;
        context.onstatechange=null;node.disconnect();await context.close();
      }
    }};
  } catch(e){stream.getTracks().forEach(t=>t.stop());await context?.close();throw e;}
}
