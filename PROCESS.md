# Pro video pipeline (shared base)

This factory runs autonomously daily: generate_topics (its niche + trend-scan) -> generate_batch -> make_video -> push_to_buffer.

## Shared engine base (identical across ALL factories; only the NICHE differs)
- **B-roll**: pooled multi-query Pexels search in get_broll -> picks best by topic-match (url slug) + resolution.
- **Captions**: POP animated (config caption_renderer=pop) - each word pops in (scale), key words/numbers yellow.
- **Voice**: Kokoro (local, free). **Music**: cinematic (cine_*). **Motion**: hook zoom + Ken Burns. Color grade per brand.
- Per-segment `asset` (local image/video) supported for screenshots / micro-montages / animated logos.

Each factory keeps its own niche (topics_bank + brand colors/hashtags) but the make_video.py engine is identical.
