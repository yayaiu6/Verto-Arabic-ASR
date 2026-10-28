# Verto Arabic ASR

Browser transcription for Egyptian Arabic and mixed Arabic–English audio. Record or upload a 0.5–60 second clip. Processing stays on your device.

**Preview.** Evaluated against Casablanca reference transcripts; results and limits are summarized below. WebGPU is optional and may use mixed CPU placement. CPU/WASM is the default.

[Model files](https://huggingface.co/yayaiu6/Verto-Arabic-ASR) · [Source](https://github.com/yayaiu6/Verto-Arabic-ASR)

## Benchmark

Compared with the original Metro FP32 checkpoint on **6,726 Casablanca recordings (7.70 hours)**, using the Open Universal Arabic ASR Leaderboard's evaluator and greedy CTC without KenLM. Lower error rates are better.

| Metric | Original FP32 | Verto INT8 |
|---|---:|---:|
| WER — all eight dialects | 75.408% | 75.449% |
| CER — all eight dialects | 41.847% | 41.875% |
| WER — Egyptian Arabic (825 recordings) | 30.678% | 31.115% |
| Inference file size | 238.84 MB | 69.46 MB |

The file is **70.92% smaller**, with WER increases of **0.041 percentage points overall** and **0.437 on Egyptian Arabic**. Both versions have high error rates on several other dialects. These results do not establish equal accuracy on other audio; speed, memory and browser performance were not benchmarked.

[Full benchmark and methodology](BENCHMARK.md) · [Results CSV](benchmark-results.csv)

## Deploy

The application is ready-to-serve static files. Docker uses Nginx; Node, npm and a JavaScript build are not required.

```sh
docker build -t verto-asr .
docker run --rm -p 8080:8080 verto-asr
```

The three bundled audio examples come from the original Metro-ASR Space. Their source URLs and checksums are recorded in `assets/examples.json`; publication was authorized by the project owner. An independent license for the recordings has not been verified.

For Railway or a VPS, deploy this Dockerfile, route your domain through HTTPS and use the container's `PORT` (default `8080`, supported range `1024–65535`). `/health` returns `ok`. The proxy terminates HTTPS. Keep COOP/COEP headers intact. There is no inference backend.

`assets/config.json` pins the public model repository and immutable revision. To override both at startup, set `MODEL_REPO` and `MODEL_REVISION` (40 lowercase hexadecimal characters). Never put access tokens in these files.

## JavaScript quickstart

Serve the complete application at the origin root:

```javascript
import { VertoASR } from '/assets/app/verto.mjs';
const asr = new VertoASR({ onProgress: console.log });
try {
  await asr.load({ device: 'wasm' });
  const result = await asr.transcribe(file);
  console.log(result.text);
} finally {
  asr.close();
}
```

`VertoASR.fromPretrained(repo, {revision, device, onProgress})` is also supported. Calls on one instance must be sequential. Raw PCM requires `{pcm: {sampleRate, channels, format}}`. See `/assets/app/developer.html`. Existing `/web/verto.mjs` integrations remain available through redirects.

## Files and maintenance

- `index.html`: markup, styles and UI interaction, in that order.
- `assets/app`: audio decoding, features/CTC, model Worker, verified cache, examples, translations and the browser client.
- `assets/runtime`, `assets/ffmpeg`, `assets/fonts`: pinned browser dependencies. No runtime CDN imports.
- `assets/server`: Nginx configuration and container entrypoint; blocked from HTTP access.
- `assets/manifest.json`: dependency versions and file SHA-256 values. Configuration can change at container startup; its listed hash describes the packaged default.

Tests and preparation tools are maintained outside this public application package. Runtime updates must replace the matching JS/WASM files together, retain notices and refresh the application version, asset manifest and precache list. Do not edit vendored binaries. The container serves the files directly.

WASM runtime downloads are checked against pinned sizes, binary headers and SHA-256 values before inference. A failed download gets one fresh, cache-bypassing attempt. Retry after initialization failure creates a new Worker without clearing model weights. Update the pinned inventory in `assets/app/runtime-integrity.js` deliberately when changing runtime dependencies; private tests verify it against the shipped files and selected glue module.

## Storage and limits

The model is 69,461,736 bytes; the complete inference assets are 69,934,740 bytes. The model downloads automatically on entry, is checked against its size and SHA-256, and is cached when storage permits. Browsers or users may clear stored data. Playback/decoding libraries load as needed; source archives are not precached.

Recording needs HTTPS or localhost. CPU uses up to four threads when cross-origin isolation is available, otherwise one. WebGPU falls back to CPU on failure. Browser decoding is tried first; FFmpeg loads for unsupported audio. PCM requires its original format metadata. Long recordings and streaming are outside this demo.

Audio and transcripts are not uploaded or saved. Network requests download application files and public model assets. Advanced details show the execution device and timings; there is no analytics or remote logging. Report failures with browser/version, file format and the visible error, without sharing private recordings.

## Credits and licenses

Original model: Metro-ASR Small by Mohammed Aly. Verto's contribution is INT8 conversion and browser execution, by Yahya Mahroof. Application code retains its existing MIT [LICENSE](LICENSE). Third-party components have their own terms, including the FFmpeg binary; see [notices and sources](assets/licenses/NOTICES.md).
