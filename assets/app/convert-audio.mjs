// Loaded only after browser decoding fails. All assets are served locally.
import {FFmpeg} from '/assets/ffmpeg/0.12.15/wrapper/index.js';
export async function convertAudio(bytes,onStatus=()=>{}) {
  const ffmpeg=new FFmpeg();
  const deadline=setTimeout(()=>ffmpeg.terminate(),60000);
  try {
    onStatus('بنحمّل محوّل الصوت المحلي… حوالي 32 MB أول مرة.');
    await ffmpeg.load({coreURL:'/assets/ffmpeg/0.12.10/core/ffmpeg-core.js',wasmURL:'/assets/ffmpeg/0.12.10/core/ffmpeg-core.wasm'});
    await ffmpeg.writeFile('input.audio',new Uint8Array(bytes));
    onStatus('بنحوّل الصوت إلى PCM داخل المتصفح…');
    // Decode a little beyond the limit to detect long inputs without silently truncating them.
    const code=await ffmpeg.exec(['-hide_banner','-v','error','-protocol_whitelist','file,pipe','-i','input.audio','-map','0:a:0','-vn','-t','60.1','-ac','1','-ar','16000','-c:a','pcm_f32le','-f','f32le','output.pcm'],45000);
    if(code!==0)throw new Error('تعذر فك الصوت: الملف تالف، مش ملف صوت، أو صيغته غير مدعومة. جرّب تصديره من المصدر بصيغة OGG أو WAV.');
    const data=await ffmpeg.readFile('output.pcm');
    if(!data.length || data.length%4)throw new Error('الملف لا يحتوي على صوت قابل للتفريغ.');
    const samples=new Float32Array(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));
    if(samples.length>960000)throw new Error('مدة الصوت يجب أن تكون من 0.5 إلى 60 ثانية');
    return samples;
  } catch(error){
    if(error instanceof Error)throw error;
    throw new Error('محوّل الصوت لم يقدر يكمل. جرّب ملف أقصر أو WAV / OGG صالح، ثم أعد المحاولة.');
  } finally {clearTimeout(deadline);ffmpeg.terminate();}
}
