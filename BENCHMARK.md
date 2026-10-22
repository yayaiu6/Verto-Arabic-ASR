# Verto Arabic ASR: INT8 benchmark

We compared the original Metro-ASR Small FP32 checkpoint with Verto's INT8 ONNX version on **6,726 recordings (7.70 hours)** from Casablanca, covering eight Arabic dialects.

**The model file is 70.92% smaller. Word error rate increased by 0.041 percentage points overall and by 0.437 percentage points on Egyptian Arabic.** These are measured differences on this dataset, not a claim of identical accuracy on other audio.

## Model size

| Version | Inference file size |
|---|---:|
| Original Metro FP32 | 238.84 MB |
| Verto ONNX INT8 | 69.46 MB |

That saves **169.38 MB (70.92%)**. MB means 1,000,000 bytes. The FP32 baseline is a saved inference state without the optimizer or auxiliary training heads; INT8 is the ONNX file. Tokenizers and runtime libraries are excluded from both figures.

## Transcription results

**Lower is better.** WER measures word errors; CER measures character errors, against the dataset's reference transcripts.

| Test | Original FP32 | Verto INT8 | Increase after quantization |
|---|---:|---:|---:|
| All dialects: WER | 75.408% | 75.449% | +0.041 percentage points |
| All dialects: CER | 41.847% | 41.875% | +0.028 percentage points |
| Egyptian Arabic: WER | 30.678% | 31.115% | +0.437 percentage points |
| Egyptian Arabic: CER | 13.385% | 13.539% | +0.154 percentage points |

The Egyptian subset contains **825 recordings**. Its WER corresponds to about **30.68 word edits per 100 reference words before quantization and 31.11 afterward**: approximately 0.44 additional edits per 100 words. Edits include substitutions, deletions and insertions; WER should not be converted directly into an accuracy percentage.

The measured quantization difference is small on this test set. However, **both versions have high error rates on several other dialects**; the small difference does not establish strong recognition across Arabic dialects generally.

## Method and limits

- Same source checkpoint, recordings, original audio features, SentencePiece tokenizer and greedy CTC decoder. No KenLM or UI transcript corrections.
- Existing Open Universal Arabic ASR Leaderboard normalization and evaluator, unchanged, using NeMo's original metric function.
- **6,726 successful recordings per version; zero failed recordings.** Membership follows the fixed leaderboard manifest. The dataset's 92 additional rows outside that manifest were not included.
- PyTorch FP32 and ONNX Runtime INT8 on CPU, batch 1, four threads. A separate FP32 ONNX check matched PyTorch on three audio fixtures.

This comparison measures error rates and file size. **Speed, memory and browser performance were not benchmarked.** It does not establish statistical equivalence, an overall leaderboard rank, or standalone English/code-switching performance. Training-data overlap has not been independently ruled out.

## Full results by dialect

All values below are percentages. Changes are in **percentage points**: positive means more errors after quantization, negative means fewer. Deltas use unrounded scores.

### Word error rate (WER)

| Dialect | Original FP32 | Verto INT8 | Change |
|---|---:|---:|---:|
| All | 75.408% | 75.449% | +0.041 |
| Algeria | 93.569% | 93.647% | +0.078 |
| Egypt | 30.678% | 31.115% | +0.437 |
| Jordan | 65.849% | 66.004% | +0.155 |
| Mauritania | 93.864% | 93.717% | -0.146 |
| Morocco | 93.868% | 93.763% | -0.105 |
| Palestine | 67.498% | 67.426% | -0.072 |
| UAE | 79.315% | 79.180% | -0.135 |
| Yemen | 77.546% | 77.683% | +0.137 |

### Character error rate (CER)

| Dialect | Original FP32 | Verto INT8 | Change |
|---|---:|---:|---:|
| All | 41.847% | 41.875% | +0.028 |
| Algeria | 55.008% | 55.136% | +0.128 |
| Egypt | 13.385% | 13.539% | +0.154 |
| Jordan | 31.489% | 31.509% | +0.019 |
| Mauritania | 61.140% | 61.164% | +0.024 |
| Morocco | 56.392% | 56.360% | -0.032 |
| Palestine | 32.040% | 32.013% | -0.027 |
| UAE | 41.750% | 41.641% | -0.108 |
| Yemen | 40.723% | 40.791% | +0.068 |

## Evaluation versions and technical details

Evaluation completed on **22 October 2026**. Corpus WER/CER aggregates errors and reference word/character counts, rather than averaging individual clip rates.

- [Original source and checkpoint](https://huggingface.co/spaces/mohammedaly22/metro-asr/tree/525644dc782b6627f1eb1f0a589407fcacbfc152).
- [Leaderboard evaluator and manifest](https://github.com/Natural-Language-Processing-Elm/open_universal_arabic_asr_leaderboard/tree/988e1723606edc9d02b17a73ea8dbaa2b6e3fc2d).
- [Casablanca test data](https://huggingface.co/datasets/UBC-NLP/Casablanca/tree/8951b1b88e28c1107142ced57967b8d16350951d), licensed CC-BY-NC-ND-4.0. Audio and reference transcripts are not redistributed.
- Python 3.11; PyTorch/Torchaudio 2.8.0 CPU; ONNX Runtime 1.23.2; SentencePiece 0.2.1; original NeMo 2.4.0 metric function extracted unchanged from its source.

Exact file sizes: FP32 **238,841,988 bytes**; INT8 **69,461,736 bytes**. FP32 tensor payload alone is 238,719,104 bytes. The historical 739.55 MB training checkpoint is not the inference-size baseline.

Complete raw transcripts were identical for **34.20% of recordings**. This is agreement, not accuracy: one changed character makes transcripts different, and matching transcripts can both contain errors.

This is an independently run comparison using the leaderboard's code, not an official leaderboard submission or endorsement.

