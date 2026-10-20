# Attribution and third-party licenses

Transcript font: IBM Plex Sans Arabic, copyright IBM Corp., SIL Open Font License 1.1. See [./IBM-PLEX-OFL.txt](./IBM-PLEX-OFL.txt). Font source: https://github.com/google/fonts/tree/main/ofl/ibmplexsansarabic. The font is served locally.

Verto application source: MIT, copyright 2026 yahya mahrouf (see /LICENSE).
Original model and portions of audio/CTC algorithm implementation: Metro-ASR Small, copyright 2025 Mohammed Aly, MIT (./METRO-MIT.txt).
The conversion/quantization tooling is not part of this repository or distribution.

ONNX Runtime Web 1.23.2: MIT. Upstream source and notices: https://github.com/microsoft/onnxruntime/tree/v1.23.2 .
FFmpeg JavaScript wrapper @ffmpeg/ffmpeg 0.12.15: MIT, Jerome Wu; https://github.com/ffmpegwasm/ffmpeg.wasm .
The separately loaded @ffmpeg/core 0.12.10 binary is GPL-2.0-or-later, **not MIT**. It contains FFmpeg and enabled codec libraries. Build source, dependency versions, patches and instructions are in https://github.com/ffmpegwasm/ffmpeg.wasm/tree/v0.12.10 . The release source bundle is distributed alongside this application's release assets under /assets/licenses/ffmpeg-source.tar.gz. See ./FFMPEG-GPL.txt and ./FFMPEG-SOURCE.md. No warranty is provided.

This package also includes linked-library source archives at `/assets/licenses/sources/` using the versions identified by the upstream build recipe. The source archives accompany the ready-to-serve files; Docker does not download or compile them. They are not precached or downloaded during normal inference. Preserve these notices when redistributing the static bundle or container.

Audio examples: ar_1, cs_1 and En_3 are reproduced from the source URLs in /assets/examples.json at the project owner’s explicit request. The original repository declares MIT; an independent license for these recordings has not been verified. No claim is made that the application MIT license licenses all audio recordings.
