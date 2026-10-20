# FFmpeg distribution source references

The JavaScript wrapper is MIT. `@ffmpeg/core` 0.12.10 declares GPL-2.0-or-later and is a separate, lazy-loaded worker binary. Our model-conversion scripts are unrelated and are not distributed.

Build scripts, bindings and patches are included in `ffmpeg-source.tar.gz` (upstream ffmpeg.wasm commit `c3a763857c5e615ae8674715ad5e4f63ff469e9d`, tag v0.12.10). This archive alone is not the full corresponding source for all linked libraries. The upstream Dockerfile identifies these source trees:

- FFmpeg n5.1.4: https://github.com/FFmpeg/FFmpeg/tree/n5.1.4
- x264 4-cores: https://github.com/ffmpegwasm/x264/tree/4-cores
- x265 3.4: https://github.com/ffmpegwasm/x265/tree/3.4
- libvpx v1.13.1: https://github.com/ffmpegwasm/libvpx/tree/v1.13.1
- LAME: https://github.com/ffmpegwasm/lame
- Ogg v1.3.4: https://github.com/ffmpegwasm/Ogg/tree/v1.3.4
- Theora v1.1.1: https://github.com/ffmpegwasm/theora/tree/v1.1.1
- Opus v1.3.1: https://github.com/ffmpegwasm/opus/tree/v1.3.1
- Vorbis v1.3.3: https://github.com/ffmpegwasm/vorbis/tree/v1.3.3
- zlib v1.2.11: https://github.com/ffmpegwasm/zlib/tree/v1.2.11
- WebP v1.3.2: https://github.com/ffmpegwasm/libwebp/tree/v1.3.2
- FreeType VER-2-10-4: https://github.com/ffmpegwasm/freetype2/tree/VER-2-10-4
- FriBidi v1.0.9: https://github.com/fribidi/fribidi/tree/v1.0.9
- HarfBuzz 5.2.0: https://github.com/harfbuzz/harfbuzz/tree/5.2.0
- libass 0.15.0: https://github.com/libass/libass/tree/0.15.0
- zimg release-3.0.5: https://github.com/sekrit-twc/zimg/tree/release-3.0.5
- Emscripten toolchain 3.1.40: https://github.com/emscripten-core/emsdk/tree/3.1.40

The container/build artifact must be accompanied by the applicable source and license material when redistributed. Review this requirement for your distribution; do not relabel FFmpeg as MIT or assume the build-script archive alone meets it.
