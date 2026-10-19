# Hub library integration

Registration was submitted in [huggingface/huggingface.js#2688](https://github.com/huggingface/huggingface.js/pull/2688). The upstream PR contains the adapted registry entry, exported snippet and tests; the files here are initial proposal references, not an installed integration.
The Hub maintainers must review and accept a library integration before its generated usage menu is available.

1. The model card declares `library_name: verto-asr`.
2. Add the entry from `library.ts` to `packages/tasks/src/model-libraries.ts` in alphabetical order.
3. Add the function from `snippet.ts` to `packages/tasks/src/model-libraries-snippets.ts`, following that file's export conventions.
4. Run that repository's required checks and open a PR titled `Add Verto ASR integration`.

The snippet requires the built application assets on the same origin. It does not claim an npm package, Transformers.js compatibility, provider inference or a server deployment integration.

Reference: https://huggingface.co/docs/hub/models-adding-libraries#register-your-library
