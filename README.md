# Verto Arabic ASR

Transcribe Egyptian Arabic and mixed Arabic-English audio in your browser. Record or upload a clip; audio processing stays on your device. Preview release: clips from 0.5 to 30 seconds.

[Try it](https://verto-arabic-asr.yahya-mahroof.site/web/index.html) | [Model files](https://huggingface.co/yayaiu6/Verto-Arabic-ASR) | [Arabic](README.ar.md)

## Features

The application includes recording, file decoding, transcription and model caching. Model files download from Hugging Face on first use and are stored separately from the application.

- ONNX model: **69,461,736 bytes** (69.46 decimal MB).
- Model + tokenizer + audio configuration: **69,934,740 bytes** (69.93 MB).
- Four-thread CPU/WASM by default when cross-origin isolation is available; one-thread fallback otherwise. Optional WebGPU can use mixed CPU placement.
- Upload audio or WhatsApp-style OGG/Opus, or record up to 30 seconds. PCM/raw input requires original sample rate/channel/sample format. Browser codecs are attempted first; FFmpeg/WASM (~32 MB) loads only on fallback.
- Arabic/English UI, editable/copyable transcript, local preview. No audio/text upload, analytics, or inference backend.

## Run

Node 22+:

```sh
npm ci
npm test
npm run build
npm start
```

Open http://127.0.0.1:4180. All runtime libraries are served from the application origin. `public/config.json` specifies the model repo and an immutable 40-character Hub revision. The published model release is pinned in this configuration; downloaded assets are checked against its manifest before use.

[Hugging Face demo](https://huggingface.co/spaces/yayaiu6/Verto-Arabic-ASR) | [Open browser app](https://yayaiu6-verto-arabic-asr.static.hf.space/)

## JavaScript quickstart

Clone the application and serve its static build. Node.js 22 or later is required.

```sh
git clone https://github.com/yayaiu6/Verto-Arabic-ASR.git
cd Verto-Arabic-ASR
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4180/web/developer.html for a complete file-to-text example.
The browser client uses the same preprocessing, tokenizer, verified model cache and Worker as the application:

```javascript
import { VertoASR } from './web/verto.mjs';

const asr = new VertoASR({ onProgress: console.log });
await asr.load({ device: 'wasm' });
const result = await asr.transcribe(fileInput.files[0]);
console.log(result.text);
asr.close();
```

Run this in a browser module served from the built application origin. Copying the module alone is insufficient: keep /config.json, /web/, /runtime/ and /ffmpeg/ at their build paths. No CDN imports or access token are needed. Use HTTPS outside localhost. Raw PCM requires the original format, sampleRate and channels via the pcm option. WebGPU is optional; use device: 'webgpu' to request it, with CPU fallback. Call close() when finished. Calls on one client must be sequential.

### Load a specific Hub model revision

```javascript
const asr = await VertoASR.fromPretrained('yayaiu6/Verto-Arabic-ASR', {
  revision: '71640c9359520f39999079a92f0b97a6651f06c4',
  device: 'wasm',
});
try {
  console.log((await asr.transcribe(fileInput.files[0])).text);
} finally {
  asr.close();
}
```

### Hugging Face Space

A static Space serves the same browser application. To prepare an upload without a paid build service:

```sh
npm run build
node scripts/package-space.mjs ../verto-space-upload
python -m pip install huggingface_hub
hf auth login
python -c "from huggingface_hub import HfApi; HfApi().upload_folder(repo_id='yayaiu6/Verto-Arabic-ASR', repo_type='space', folder_path='../verto-space-upload', commit_message='Update browser demo')"
```

The destination must be a new directory. Create the destination Space with the static SDK before uploading. Upload only the package contents. Model files remain on the model repository. Third-party source archives accompany the runtime; user audio is not included.

The proposed Hub library registration and snippet are in [scripts/hub-integration](scripts/hub-integration). They have not been submitted or accepted; a provider deployment integration is separate.

## Model cache and offline behavior

Files are downloaded with byte progress and SHA-256/size checks, then saved in Cache Storage. Reopening reuses verified cached files. Updates keep the previous revision until the new bundle is complete. A storage failure allows memory-only inference. The settings panel can clear saved model files. Browsers can evict storage even after a persistence request.

The service worker caches the app shell and libraries actually loaded. Offline inference requires a previous complete online load on the same browser/origin, including any optional audio converter you need. New origin, incognito sessions, cleared site data or missing optional assets require downloading again. Audio recordings and transcripts are never stored in caches.

## Docker / Railway / VPS

```sh
docker build -t verto-asr:preview .
docker run --rm -p 8080:8080 -e PORT=8080 verto-asr:preview
```

Nginx runs as a non-root user. `/health` returns `ok`. PORT must be 1024–65535; override with `-e PORT=9090 -p 9090:9090`. Optional `MODEL_REPO` and `MODEL_REVISION` select another immutable compatible bundle; custom repositories require a revision. Never pass a Hub token to browser config.

Railway: connect this GitHub repository, use Dockerfile, health path `/health`, and generate a service domain when ready. VPS: run the container behind an HTTPS reverse proxy and route your domain to it. Preserve COOP/COEP headers. HTTPS is required for microphone access outside localhost. Use the public HTTPS URL without a port. Railway target port must match PORT (8080 by default).

## Preview evidence and limits

Original checkpoint 739,546,518 bytes includes optimizer state; original FP32 parameter payload 246,345,280 bytes. Exported FP32 ONNX was 247,462,020 bytes. The stored INT8 weights retain FP32 activations, so download reduction is not an all-integer-compute or RAM-reduction claim.

On Intel Core i7-10850H, Chrome headless, 4 WASM threads, 10 seconds of speech: median inference+CTC 810.51 ms plus 56.93 ms feature extraction (RTF 0.08674); WebGPU-requested mixed path 96.73 + 55.46 ms. One warm-up and five measured runs; audio decode/resample and initial loading excluded. These historical probe measurements are not universal performance guarantees.

FP32 export matched original numerical tolerance (atol 1e-4, rtol 1e-3) and transcripts across 12 demo files; browser INT8 matched native INT8 on those files. Only 7/12 INT8 transcripts matched FP32 exactly. Some demo files were duplicates. **WER/CER comparison against human references remains pending; preservation of accuracy is not claimed. Peak RAM/VRAM is unmeasured.** Egyptian dialect is the target; general Arabic/dialect coverage is not guaranteed. 0.5–30-second clips only; no long-audio chunking or KenLM. This build does not redistribute upstream audio examples; provide your own audio or use the microphone.

## Licenses

Application source: MIT. The model is an INT8 conversion of [Metro-ASR Small by Mohammed Aly](https://huggingface.co/mohammedaly22/Metro-ASR-Small). The original MIT notice is preserved in licenses/METRO-MIT.txt. ONNX Runtime and the FFmpeg wrapper have their own MIT notices. **The optional FFmpeg core is GPL-2.0-or-later, not MIT**; see [third-party notices](THIRD_PARTY_NOTICES.md) and [source material](licenses/FFMPEG-SOURCE.md). Downstream distributors must satisfy applicable dependency obligations separately.
