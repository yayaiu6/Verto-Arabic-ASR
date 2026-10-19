import fs from 'node:fs/promises';
import path from 'node:path';
// Source redistribution for the separately licensed optional FFmpeg binary.
// These are upstream dependencies, never model-conversion tooling.
const inputs=[['FFmpeg/FFmpeg','n5.1.4'],['ffmpegwasm/x264','4-cores'],['ffmpegwasm/x265','3.4'],['ffmpegwasm/libvpx','v1.13.1'],['ffmpegwasm/lame','master'],['ffmpegwasm/Ogg','v1.3.4'],['ffmpegwasm/theora','v1.1.1'],['ffmpegwasm/opus','v1.3.1'],['ffmpegwasm/vorbis','v1.3.3'],['ffmpegwasm/zlib','v1.2.11'],['ffmpegwasm/libwebp','v1.3.2'],['ffmpegwasm/freetype2','VER-2-10-4'],['fribidi/fribidi','v1.0.9'],['harfbuzz/harfbuzz','5.2.0'],['libass/libass','0.15.0'],['sekrit-twc/zimg','release-3.0.5']];
export async function copyDependencySources(destination){
 await fs.mkdir(destination,{recursive:true});
 for(let i=0;i<inputs.length;i+=4)await Promise.all(inputs.slice(i,i+4).map(async([repo,ref])=>{
  const file=path.join(destination,repo.replace('/','-')+'.tar.gz');
  try{if((await fs.stat(file)).size>100)return;}catch{}
  const response=await fetch(`https://codeload.github.com/${repo}/tar.gz/${ref}`);
  if(!response.ok)throw new Error('Dependency source download failed: '+repo);
  await fs.writeFile(file,new Uint8Array(await response.arrayBuffer()));
 }));
}
