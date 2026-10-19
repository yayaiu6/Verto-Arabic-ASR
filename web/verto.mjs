import {readAudio} from './audio.mjs';

/** Browser client. Serve this module and the runtime assets from the same origin. */
export class VertoASR {
  constructor({onProgress = () => {}} = {}) {
    this.worker = new Worker(new URL('./worker.mjs', import.meta.url), {type: 'module'});
    this.pending = null;
    this.closed = false;
    this.worker.onmessage = ({data}) => {
      if (data.type === 'progress') onProgress(data);
      if (data.type === 'error') this.finish(new Error(data.error));
      if (data.type === 'ready' || data.type === 'result') this.finish(null, data);
    };
    this.worker.onerror = event => this.finish(new Error(event.message || 'Worker failed'));
  }
  finish(error, value) {
    const pending = this.pending;
    this.pending = null;
    if (error) pending?.reject(error); else pending?.resolve(value);
  }
  request(data) {
    if (this.closed) return Promise.reject(new Error('Client is closed'));
    if (this.pending) return Promise.reject(new Error('Client is busy'));
    return new Promise((resolve, reject) => {
      this.pending = {resolve, reject};
      try { this.worker.postMessage(data); } catch (error) { this.finish(error); }
    });
  }
  load({device = 'wasm'} = {}) {
    if (!['wasm', 'webgpu'].includes(device)) return Promise.reject(new Error('Use wasm or webgpu'));
    return this.request({type: 'load', mode: device});
  }
  async transcribe(file, {pcm} = {}) {
    const audio = await readAudio(file, {pcm});
    return this.request({type: 'transcribe', samples: audio});
  }
  close() {
    this.closed = true;
    this.finish(new Error('Client closed'));
    this.worker.terminate();
  }
}
