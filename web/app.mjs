import {readAudio,audioError,recordMicrophone,encodeWav} from './audio.mjs';
import {validateSamples} from './core.mjs';
import {initLanguage} from './i18n.mjs';
const $=id=>document.getElementById(id);
let worker;
let ready=false,loadedMode=null,working=false,samples=null,recorder=null,tick=null,previewUrl=null,loadTask=null;
const sampleNames={ar_1:'مثال عربي',cs_1:'عربي + English',En_3:'مثال إنجليزي'};

function status(title,detail='',error=false){$('status').textContent=title;$('status-detail').textContent=detail;$('status-icon').textContent=error?'!':working?'◌':'✓';$('status').closest('section').classList.toggle('error',error);}
function controls(){
  const locked=working||!!recorder;
  $('run').disabled=locked||(!samples&&!$('audio').files[0]);$('load').disabled=locked;$('mode').disabled=locked;
  $('audio').disabled=locked;$('record').disabled=working;
  document.querySelectorAll('.sample').forEach(b=>b.disabled=locked);
}
function finishError(error){working=false;$('progress').hidden=true;status('محتاجين نجرب تاني',audioError(error),true);controls();}
function clearResult(){
  $('text').value='';$('copy').disabled=true;$('metrics').textContent='';
  $('result-summary').textContent='النص هيظهر هنا بعد تفريغ الصوت الجديد.';
}
function attachWorker(){worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});worker.onmessage=handleMessage;worker.onerror=handleWorkerError;}
function setAudio(pcm,name){
  validateSamples(pcm);samples=pcm;
  $('selected').hidden=false;$('filename').textContent=name;$('duration').textContent=`${(pcm.length/16000).toFixed(1)} ثانية`;
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(new Blob([encodeWav(pcm)],{type:'audio/wav'}));$('preview').src=previewUrl;
  status('الصوت جاهز','اضغط «فرّغ الصوت» لعرض النص.');controls();
}
async function ensureModel(force=false){
  if(ready && loadedMode===$('mode').value && !force)return;
  if(loadTask)return loadTask.promise;
  ready=false;status('جاري تحميل الموديل…','ملف الموديل حوالي 70 ميجابايت. التحميل من جهازك، مش رفع للصوت.');
  $('progress').hidden=false;$('progress').removeAttribute('value');
  let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});loadTask={promise,resolve,reject};
  if(!worker)attachWorker();worker.postMessage({type:'load',mode:$('mode').value});return promise;
}
function handleMessage({data}){
  if(data.type==='progress'){
    const states={verifying:'جاري التحقق من ملفات الموديل…',cached:'تم تحميل الموديل من جهازك',saved:'الموديل محفوظ على جهازك','storage-unavailable':'تعذر حفظ الموديل؛ هنكمل في الذاكرة'};
    if(states[data.phase]){status(states[data.phase],'قد يعيد المتصفح التنزيل إذا تم مسح بيانات الموقع.');return;}
    if(data.total){$('progress').value=100*data.loaded/data.total;$('status-detail').textContent=`تحميل الموديل: ${Math.round(data.loaded/1e6)} / ${Math.round(data.total/1e6)} MB`;}
    else status('جاري تجهيز الموديل…','بنجهز محرك التشغيل على جهازك.');return;
  }
  if(data.type==='ready'){
    ready=true;loadedMode=$('mode').value;$('progress').hidden=true;$('device').textContent=JSON.stringify(data,null,2);
    status('الموديل جاهز',data.provider==='wasm'?'التشغيل على CPU.':'WebGPU جاهز؛ بعض العمليات قد تستخدم CPU.');
    const pending=loadTask;loadTask=null;pending?.resolve(data);return;
  }
  if(data.type==='fallback'){status('التشغيل على CPU','تعذر مسار GPU؛ بنكمل على المعالج.');$('device').textContent=JSON.stringify(data,null,2);return;}
  if(data.type==='result'){
    $('text').value=data.text;$('copy').disabled=!data.text;
    const {ids,text,type,...metrics}=data;$('metrics').textContent=JSON.stringify({...metrics,outputTokens:ids.length},null,2);
    $('result-summary').textContent=`${data.duration.toFixed(1)} ثانية صوت · ${((data.featureMs+data.medianMs)/1000).toFixed(2)} ثانية معالجة · ${data.provider==='wasm'?'CPU':'WebGPU / CPU'}`;
    working=false;$('progress').hidden=true;
    status(data.text?'انتهى التفريغ':'لم نلتقط كلامًا واضحًا',data.text?'تقدر تعدّل النص أو تضغط «نسخ النص».':'جرّب تتكلم أقرب للميكروفون، أو اختار مثال جاهز.');controls();return;
  }
  if(data.type==='error'){
    const pending=loadTask;loadTask=null;
    if(pending){ready=false;pending.reject(new Error(data.error));}else finishError(new Error(data.error));
  }
  if(data.type==='cache-cleared'){working=false;ready=false;status('تم مسح ملفات الموديل المحفوظة');controls();}
};
function handleWorkerError(event){
  event.preventDefault();ready=false;worker?.terminate();worker=null;
  const pending=loadTask;loadTask=null;const error=new Error('تعذر تشغيل محرك الصوت. جرّب المثال مرة تانية، أو أعد تحميل الصفحة لو المشكلة مستمرة.');
  pending?.reject(error);if(!pending)finishError(error);
}

async function transcribe(){
  if(working||recorder)return;working=true;clearResult();controls();
  try {
    if(!samples){const file=$('audio').files[0];if(!file)throw new Error('اختار ملف صوت أو سجّل مقطع أولًا.');
      status('جاري قراءة الصوت…','بنحدد الصيغة ونجهز الصوت محليًا.');
      setAudio(await readAudio(file,{pcm:{sampleRate:Number($('pcm-rate').value),channels:Number($('pcm-channels').value),format:$('pcm-format').value},onStatus:message=>status('جاري تجهيز الصوت…',message)}),file.name);}
    await ensureModel();status('جاري تفريغ الصوت…','استخراج الكلام من التسجيل على جهازك.');$('progress').hidden=false;$('progress').removeAttribute('value');
    worker.postMessage({type:'transcribe',samples:samples.slice(),repeats:$('benchmark').checked?5:1});
  }catch(e){finishError(e);}
}
$('run').onclick=transcribe;
$('load').onclick=async()=>{working=true;controls();try{await ensureModel(true);working=false;controls();}catch(e){finishError(e);}};
$('audio').onchange=()=>{
  samples=null;$('selected').hidden=true;clearResult();
  const file=$('audio').files[0];status(file?'الملف اتحدد':'جاهز للتجربة',file?`${file.name} — اضغط «فرّغ الصوت» لفك الملف وتجربته.`:'اختار ملف صوت أو جرّب مثال جاهز.');controls();
  $('pcm-options').hidden=!/\.(pcm|raw)$/i.test(file?.name||'');
};
document.querySelectorAll('.sample').forEach(button=>button.onclick=async()=>{
  working=true;clearResult();controls();status('بنجهز المثال…');
  try{
    const name=button.dataset.sample,response=await fetch(`/fixtures/${name}.pcm.f32`);if(!response.ok)throw new Error('المثال غير متاح. جرّب التسجيل أو رفع ملف.');
    $('audio').value='';setAudio(new Float32Array(await response.arrayBuffer()),sampleNames[name]);working=false;await transcribe();
  }catch(e){finishError(e);}
});
async function stopRecording(){
  if(!recorder)return;
  const active=recorder;recorder=null;clearInterval(tick);tick=null;working=true;controls();
  $('record').classList.remove('recording');$('record-label').textContent='ابدأ التسجيل';$('record-hint').textContent='اسمح بالميكروفون واتكلم لحد 30 ثانية';$('recording-panel').hidden=true;
  try{setAudio(await active.stop(),'تسجيل الميكروفون');working=false;await transcribe();}catch(e){finishError(e);}
}
$('record').onclick=async()=>{
  if(recorder){await stopRecording();return;}
  working=true;controls();status('اسمح باستخدام الميكروفون','لو ظهرت رسالة من المتصفح، اضغط Allow / سماح.');
  try{
    recorder=await recordMicrophone(level=>{$('level').value=level;});working=false;$('audio').value='';samples=null;clearResult();$('selected').hidden=true;
    $('record').classList.add('recording');$('record-label').textContent='إيقاف وتفريغ التسجيل';$('record-hint').textContent='اتكلم… ولما تخلص اضغط هنا';$('recording-panel').hidden=false;$('timer').textContent='00:00';
    const start=performance.now();tick=setInterval(()=>{const sec=Math.floor((performance.now()-start)/1000);$('timer').textContent=`00:${String(Math.min(30,sec)).padStart(2,'0')}`;if(sec>=30)stopRecording();},100);
    status('بنسجل صوتك…','شريط الصوت بيتحرك لما الميكروفون يلتقط صوت. اضغط إيقاف لما تخلص.');controls();
  }catch(e){finishError(e);}
};
$('text').oninput=()=>{$('copy').disabled=!$('text').value;};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('text').value);$('copy').textContent='اتنسخ ✓';setTimeout(()=>{$('copy').textContent='نسخ النص';},1600);}catch{$('text').select();status('حددنا النص ليك','اضغط Ctrl+C لنسخه.');}};
window.addEventListener('pagehide',()=>{if(recorder)recorder.stop().catch(()=>{});if(tick)clearInterval(tick);});
$('clear-cache').onclick=()=>{if(working||recorder)return;working=true;controls();worker?.postMessage({type:'clear-cache'});if(!worker){attachWorker();worker.postMessage({type:'clear-cache'});}};
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
navigator.storage?.persist?.().catch(()=>{});
attachWorker();controls();initLanguage();
