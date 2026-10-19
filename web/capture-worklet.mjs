class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const input=inputs[0];
    if(input?.length && input[0].length){const mono=new Float32Array(input[0].length);for(const channel of input)for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/input.length;this.port.postMessage(mono,[mono.buffer]);}
    return true;
  }
}
registerProcessor('pcm-capture',PcmCapture);
