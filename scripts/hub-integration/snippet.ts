// Proposed function in the Hub's snippets module, using its existing ModelData type.
const vertoASR = (model: ModelData) =>
`// Build and serve the application first:
// https://github.com/yayaiu6/Verto-Arabic-ASR#javascript-quickstart
// Run in a browser module on the application's origin.
import { VertoASR } from './web/verto.mjs';

const asr = await VertoASR.fromPretrained('${model.id}', {
  revision: '71640c9359520f39999079a92f0b97a6651f06c4',
});
try {
  const result = await asr.transcribe(fileInput.files[0]);
  console.log(result.text);
} finally {
  asr.close();
}`;
