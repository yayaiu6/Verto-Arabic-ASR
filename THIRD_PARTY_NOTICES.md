# Attribution and third-party licenses

Verto application source: MIT, copyright 2026 yahya mahrouf (see LICENSE).
Original model and portions of audio/CTC algorithm implementation: Metro-ASR Small, copyright 2025 Mohammed Aly, MIT (licenses/METRO-MIT.txt).
The conversion/quantization tooling is not part of this repository or distribution.

ONNX Runtime Web 1.23.2: MIT. Upstream source and notices: https://github.com/microsoft/onnxruntime/tree/v1.23.2 .
FFmpeg JavaScript wrapper @ffmpeg/ffmpeg 0.12.15: MIT, Jerome Wu; https://github.com/ffmpegwasm/ffmpeg.wasm .
The separately loaded @ffmpeg/core 0.12.10 binary is GPL-2.0-or-later, **not MIT**. It contains FFmpeg and enabled codec libraries. Build source, dependency versions, patches and instructions are in https://github.com/ffmpegwasm/ffmpeg.wasm/tree/v0.12.10 . The release source bundle is distributed alongside this application's release assets under /licenses/ffmpeg-source.tar.gz. See licenses/FFMPEG-GPL.txt and licenses/FFMPEG-SOURCE.md. No warranty is provided.

The static build additionally distributes linked-library source archives at `/licenses/sources/` using the versions identified by the upstream build recipe. These are fetched at build time; builds fail if they cannot be fetched. They are not precached or downloaded during normal inference. Preserve these notices when redistributing the static bundle or container.
