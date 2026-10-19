// Proposed function in the Hub's snippets module, using its existing ModelData type.
const vertoASR = (model: ModelData) =>
`// Build and serve the application first:
// https://github.com/yayaiu6/Verto-Arabic-ASR#javascript-quickstart
// Run in a browser module on the application's origin.
import { VertoASR } from './web/verto.mjs';

const response = await fetch('https://huggingface.co/api/models/${model.id}');
if (!response.ok) throw new Error('Model metadata unavailable');
const { sha: revision } = await response.json();
const asr = await VertoASR.fromPretrained('${model.id}', { revision });
try {
  const result = await asr.transcribe(fileInput.files[0]);
  console.log(result.text);
} finally {
  asr.close();
}`;
