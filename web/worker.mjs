import {loadModelFiles,clearModels} from './model-cache.mjs';
import * as ort from '/runtime/1.23.2/ort.webgpu.min.mjs';
import { validateSamples,logMel,ctcIds,decodePieces } from './core.mjs';

ort.env.wasm.wasmPaths='/runtime/1.23.2/';
ort.env.wasm.numThreads=self.crossOriginIsolated ? Math.min(4,navigator.hardwareConcurrency || 1) : 1;
let session, filters, pieces, modelBytes, provider, fallbackReason=null;
const post=(type,values={})=>self.postMessage({type,...values});

async function createCpu() {
  session=await ort.InferenceSession.create(modelBytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  provider='wasm';
}
async function load(mode) {
  await session?.release(); session=null; fallbackReason=null;
  const start=performance.now();
  const config=await (await fetch('/config.json',{cache:'no-cache'})).json();
  const bundle=await loadModelFiles(config,event=>post('progress',event));
  modelBytes=bundle.files['metro.int8.onnx'];
  filters=JSON.parse(new TextDecoder().decode(bundle.files['mel_filters.json']));
  pieces=JSON.parse(new TextDecoder().decode(bundle.files['tokenizer.json'])).pieces;
  if(mode==='webgpu') {
    try {
      if(!navigator.gpu || !await navigator.gpu.requestAdapter()) throw new Error('WebGPU adapter unavailable');
      // Request WebGPU, but don't infer exclusive placement from this option.
      session=await ort.InferenceSession.create(modelBytes,{executionProviders:['webgpu'],graphOptimizationLevel:'all'});
      provider='webgpu';
    } catch(error) { fallbackReason=String(error); await createCpu(); }
  } else await createCpu();
  post('ready',{provider,fallbackReason,loadMs:performance.now()-start,threads:ort.env.wasm.numThreads,
    note:provider==='webgpu'?'WebGPU requested; operator placement unverified and may be mixed':'CPU/WASM'});
}

async function infer(samples, repeats=1) {
  validateSamples(samples);
  if(!session) throw new Error('Load the model first');
  const featureStart=performance.now();
  const features=logMel(samples,filters);
  const featureMs=performance.now()-featureStart;
  const feeds={features:new ort.Tensor('float32',features.data,[1,features.frames,80]),
    feature_lengths:new ort.Tensor('int64',BigInt64Array.of(BigInt(features.frames)),[1])};
  const times=[];
  let text,ids;
  try {
    // Benchmark mode has one unmeasured warm-up and five measured runs.
    const count=repeats===5?6:1;
    for(let i=0;i<count;i++) {
      const start=performance.now();
      let output;
      try { output=await session.run(feeds); }
      catch(error) {
        if(provider!=='webgpu') throw error;
        fallbackReason=String(error); await session.release(); await createCpu();
        post('fallback',{provider,fallbackReason});
        output=await session.run(feeds);
      }
      try {
        ids=ctcIds(output.log_probs.data,output.log_probs.dims[2],Number(output.output_lengths.data[0]));
        text=decodePieces(ids,pieces);
      } finally { for(const tensor of Object.values(output)) tensor.dispose(); }
      if(count===1 || i>0) times.push(performance.now()-start);
    }
  } finally { for(const tensor of Object.values(feeds)) tensor.dispose(); }
  const sorted=[...times].sort((a,b)=>a-b),medianMs=sorted[Math.floor(sorted.length/2)];
  return {text,ids,provider,fallbackReason,featureMs,timesMs:times,medianMs,
    duration:samples.length/16000,rtf:(medianMs+featureMs)/(samples.length/16)};
}

let busy=false;
self.onmessage=async ({data})=>{
  if(busy) { post('error',{id:data.id,error:'Worker is busy'}); return; }
  busy=true;
  try {
    if(data.type==='load') await load(data.mode);
    else if(data.type==='clear-cache'){await clearModels();post('cache-cleared');}
    else if(data.type==='transcribe') post('result',{id:data.id,...await infer(data.samples,data.repeats)});
    else throw new Error('Unknown worker operation');
  } catch(error) { post('error',{id:data.id,error:String(error?.message || error)}); }
  finally { busy=false; }
};
