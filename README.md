# clip-scheduler

Small personal hobby script. Batches a few short vertical clips and drops them into a
scheduler queue. Nothing special under the hood — grabs a random stock clip, adds a quick
text-to-speech voice, burns default subtitles. Was an experiment, mostly idle now.

Not documented, not supported, kept only for personal archival. Results were mediocre so
it's on the back burner.

## run
```
cp config.example.json config.json   # fill your own keys
python generate_batch.py
```
