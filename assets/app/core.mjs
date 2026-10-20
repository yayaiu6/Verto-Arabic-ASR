export function validateSamples(samples) {
  if (!(samples instanceof Float32Array)) throw new Error('Expected mono Float32 PCM at 16000 Hz');
  if (samples.length < 8000 || samples.length > 960000) throw new Error('Choose 0.5 to 60 seconds of audio');
  if (!samples.every(Number.isFinite)) throw new Error('Audio must contain finite samples');
}

export function ctcIds(logProbs, vocab, length) {
  if (length < 0 || length*vocab > logProbs.length) throw new Error('Invalid output length');
  const result = [];
  let previous = -1;
  for (let t=0;t<length;t++) {
    let best=0, value=-Infinity;
    for(let j=0;j<vocab;j++) {
      const v=logProbs[t*vocab+j];
      if (!Number.isFinite(v)) throw new Error('Non-finite model output');
      if(v>value) { value=v; best=j; }
    }
    if (best!==previous && best!==0) result.push(best);
    previous=best;
  }
  return result;
}

export function decodePieces(ids, pieces) {
  return ids.filter(id=>id>=3).map(id=>pieces[id-3]==='<unk>'?' ⁇ ':pieces[id-3] ?? '')
    .join('').replace(/^▁/,'').replaceAll('▁',' ');
}

function fft(re,im) {
  const n=re.length;
  for(let i=1,j=0;i<n;i++) {
    let bit=n>>1;
    for(;j&bit;bit>>=1) j^=bit;
    j^=bit;
    if(i<j) { [re[i],re[j]]=[re[j],re[i]]; [im[i],im[j]]=[im[j],im[i]]; }
  }
  for(let size=2;size<=n;size<<=1) {
    const angle=-2*Math.PI/size, wr=Math.cos(angle), wi=Math.sin(angle);
    for(let start=0;start<n;start+=size) {
      let ur=1,ui=0;
      for(let j=0;j<size/2;j++) {
        const a=start+j,b=a+size/2;
        const tr=ur*re[b]-ui*im[b],ti=ur*im[b]+ui*re[b];
        re[b]=re[a]-tr; im[b]=im[a]-ti; re[a]+=tr; im[a]+=ti;
        const next=ur*wr-ui*wi; ui=ur*wi+ui*wr; ur=next;
      }
    }
  }
}

export function logMel(samples, filters) {
  const frames=Math.floor(samples.length/160)+1;
  const data=new Float32Array(frames*80);
  const window=new Float32Array(512);
  for(let j=0;j<400;j++) window[j+56]=.5-.5*Math.cos(2*Math.PI*j/400);
  const re=new Float64Array(512),im=new Float64Array(512),power=new Float32Array(257);
  for(let t=0;t<frames;t++) {
    im.fill(0);
    for(let j=0;j<512;j++) {
      let i=t*160+j-256;
      if(i<0) i=-i;
      if(i>=samples.length) i=2*samples.length-2-i;
      re[j]=Math.fround(samples[i]*window[j]);
    }
    fft(re,im);
    for(let k=0;k<257;k++) power[k]=re[k]*re[k]+im[k]*im[k];
    for(let m=0;m<80;m++) {
      let sum=0;
      for(let k=0;k<257;k++) sum+=power[k]*filters[k][m];
      data[t*80+m]=Math.log(Math.max(sum,1e-10));
    }
  }
  let mean=0;
  for(const x of data) mean+=x;
  mean/=data.length;
  let variance=0;
  for(const x of data) variance+=(x-mean)**2;
  const std=Math.sqrt(variance/(data.length-1));
  for(let i=0;i<data.length;i++) data[i]=(data[i]-mean)/(std+1e-6);
  return {data,frames};
}
