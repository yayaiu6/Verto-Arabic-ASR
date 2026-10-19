# Verto Preview release ledger

Approved user plan: public browser app + HF model package; Docker/Nginx. Private conversion code excluded.

- Public repository cloned with existing MIT license/history. Only explicit web modules and three JS tests copied from approved browser probe.
- HF CLI authentication missing; user notified to log in locally, never send tokens in chat.
- Docker CLI not installed. Prepare/test equivalent static serving locally and record container verification limitation until a build service is available.
- No upstream audio examples copied. Use an original synthetic signal as a pipeline check; speech examples require distributable recordings.
- Deployment provider/domain question pending. Railway connected workspace belongs to yahya mahrouf.
- User chose GitHub + Hugging Face only now; no deployment or domain changes authorized for this release turn.
- Cold/warm/offline speech passed in new static app, both isolated (four threads) and non-isolated (one thread). Warm reload made zero HF requests. Bilingual/RTL/mobile smoke passed.
- Cache tests passed deduplication, corruption repair, failed size/hash rejection, quota memory fallback and clear. SW review fixes: build-specific cache, network succeeds despite storage failures, clean dist builds, audit rejects unexpected indexed/untracked files.
- FFmpeg source recipe + linked dependency archives accompany static image build; no conversion tools or original speech examples in public tree.
- Docker CLI unavailable locally; GitHub Actions builds container and checks custom port, health, headers and non-root UID. Public model loading is pending upload/authentication and final revision pin; tests fulfilled HF responses from the separate approved release bundle.

- HF authentication completed and the nine-file public model package was published at revision 71640c9359520f39999079a92f0b97a6651f06c4. Application configuration now pins this immutable release.
- Live Hugging Face test passed under COOP/COEP: real public download and hash verification, CPU/WASM four threads, identical transcript after reload with zero HF requests, and identical offline inference. Arabic mobile layout passed with no page errors. Docker CI remains queued.
