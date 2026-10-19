import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const roots=['web','public','scripts','tests','deploy','licenses','.github'];
const allowedRoot=new Set(['LICENSE','README.md','README.ar.md','THIRD_PARTY_NOTICES.md','Dockerfile','.dockerignore','.gitignore','.gitattributes','package.json','package-lock.json','PROGRESS.md','railway.json']);
const forbidden=/(?:^|\/)(?:source|artifacts|fixtures|\.venv|__pycache__|node_modules)(?:\/|$)|\.(?:onnx|pt|safetensors|py|pcm|wav|flac)$/i;
async function walk(dir){let output=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())output.push(...await walk(p));else output.push(p.replaceAll('\\','/'));}return output;}
const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))];
for(const file of files){
 if(!roots.includes(file.split('/')[0])&&!allowedRoot.has(file))throw new Error('Unexpected release file: '+file);
 if(forbidden.test(file))throw new Error('Forbidden public file: '+file);
 if(!file.endsWith('.gz')){const s=await fs.readFile(file,'utf8');if(/hf_[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|^-----BEGIN [A-Z ]*PRIVATE KEY-----$/m.test(s))throw new Error('Potential secret: '+file);}
}
console.log(`Release allowlist audit passed: ${files.length} public files. No conversion scripts, model weights, checkpoints or private audio.`);
