import {readAudio} from './audio.mjs?v=28ef369de2067dd52966';
import {validateConfig} from './model-cache.mjs?v=28ef369de2067dd52966';

/** Browser client. Serve this module and the runtime assets from the same origin. */
export class VertoASR {
  static async fromPretrained(repo, {revision, device = 'wasm', onProgress} = {}) {
    const config = validateConfig({repo, revision, manifest: 'manifest.json'});
    const client = new VertoASR({onProgress});
    try {await client.load({device, config}); return client;}
    catch (error) {client.close(); throw error;}
  }
  constructor({onProgress = () => {}} = {}) {
    this.onProgress=onProgress;
    this.pending = null;
    this.closed = false;
    this.attachWorker();
  }
  attachWorker(){
    const worker=this.worker=new Worker(new URL('./worker.mjs?v=28ef369de2067dd52966', import.meta.url), {type: 'module'});
    worker.onmessage = ({data}) => {
      if(this.worker!==worker)return;
      if (data.type === 'progress') this.onProgress(data);
      if (data.type === 'error') {if(this.pending?.type==='load'){this.worker=null;worker.terminate();}this.finish(new Error(data.error));}
      if (data.type === 'ready' || data.type === 'result') this.finish(null, data);
    };
    worker.onerror = event => {if(this.worker!==worker)return;this.worker=null;worker.terminate();this.finish(new Error(event.message || 'Worker failed'));};
  }
  finish(error, value) {
    const pending = this.pending;
    this.pending = null;
    if (error) pending?.reject(error); else pending?.resolve(value);
  }
  request(data) {
    if (this.closed) return Promise.reject(new Error('Client is closed'));
    if (this.pending) return Promise.reject(new Error('Client is busy'));
    if(!this.worker)this.attachWorker();
    return new Promise((resolve, reject) => {
      this.pending = {resolve, reject,type:data.type};
      try { this.worker.postMessage(data); } catch (error) { this.finish(error); }
    });
  }
  load({device = 'wasm', config} = {}) {
    if (!['wasm', 'webgpu'].includes(device)) return Promise.reject(new Error('Use wasm or webgpu'));
    if (config) validateConfig(config);
    return this.request({type: 'load', mode: device, config});
  }
  async transcribe(file, {pcm} = {}) {
    const audio = await readAudio(file, {pcm});
    return this.request({type: 'transcribe', samples: audio});
  }
  close() {
    this.closed = true;
    this.finish(new Error('Client closed'));
    this.worker?.terminate();this.worker=null;
  }
}
