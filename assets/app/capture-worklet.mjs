class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(4096);
    this.used = 0;
    this.frames = 0;
    this.stopped = false;
    this.port.onmessage = ({data}) => {
      if (data?.type !== 'stop' || this.stopped) return;
      this.stopped = true;
      this.flush();
      this.port.postMessage({type:'stopped',frames:this.frames,sampleRate});
    };
  }
  flush() {
    if (!this.used) return;
    const samples = this.used === this.buffer.length ? this.buffer : this.buffer.slice(0,this.used);
    this.port.postMessage({type:'chunk',samples},[samples.buffer]);
    this.buffer = new Float32Array(4096);
    this.used = 0;
  }
  process(inputs) {
    if (this.stopped) return false;
    const input=inputs[0];
    if(input?.length && input[0].length){
      const count=Math.min(input[0].length,Math.max(0,Math.floor(sampleRate*30)-this.frames));
      for(let i=0;i<count;i++){
        let value=0;
        for(const channel of input)value+=(channel[i]||0)/input.length;
        this.buffer[this.used++]=value;
        this.frames++;
        if(this.used===this.buffer.length)this.flush();
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture',PcmCapture);
