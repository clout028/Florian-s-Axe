# Kids Piano Learning Game — Design Plan

An iPad-first web app (PWA, later wrapped with Capacitor) that **listens to a real piano through the microphone** and teaches a child to play through lessons and play-along songs.

This plan comes from research into Simply Piano and similar apps (Flowkey, Playground Sessions, Piano Maestro). We borrow proven *mechanics* (listen-and-score, guided steps, star ratings, unlocks) but the world, characters, art, music and structure below are our own.

---

## 1. Research summary

### How Simply Piano works (from public reviews)
| Area | What it does |
|---|---|
| **Structure** | ~33 courses. Two foundation courses ("Piano Basics"), then it splits into two paths: **Soloist** (melodies, note range, technique, sight reading) and **Chords** (accompaniment, chord basics, styles). Learners can switch paths or do both. |
| **Lesson flow** | Each course has an overview, then short videos introducing a concept, then play-along exercises. The screen is split: staff on top, keyboard guide on the bottom. |
| **Feedback** | Listens through the mic (or MIDI). Highlights the current note. If the learner hesitates, it shows where the note is on the keyboard. |
| **Adaptive help** | After repeated mistakes in a section it switches to a **Practice Mode**: slows the tempo and adds a metronome click. |
| **Scoring** | At the end of a song it shows notes correct plus rhythm/tempo accuracy, and gives a **1–3 star** rating. |
| **Unlocks** | The song library (thousands of songs, simplified arrangements) unlocks after the basics course, with more added as the learner advances. |
| **Extras** | Short daily "workouts", songs that can be slowed down, and a community. |

### What reviewers and parents criticize (our opportunities)
1. **Note recognition is unreliable.** Notes register too early, or don't register at all. This was the #1 complaint from a piano teacher who reviewed it. → *Our detection must be forgiving and tuned for the expected note (see §6).*
2. **It can't see hands.** It can't teach posture or fingering, so bad habits form. → *We teach fingering through visuals and finger numbers, and remind about posture.*
3. **Rote over understanding.** Kids follow highlighted notes without really learning to read music or rhythm. → *Separate reading and rhythm mini-games, and gradually remove visual hints.*
4. **Missing controls:** no adjustable count-in, no notation zoom, unskippable videos. → *Let the user control count-in, zoom and tempo, and allow skipping.*
5. **Young kids (≤5) struggle** because they can't read text. The sweet spot is ages 6–9. → *Use few words, audio narration and icons everywhere.*
6. **Motivation fades.** Some kids quit after a week. → *Short sessions, visible progress, collectibles, and parent involvement.*

### Ideas from other apps
- **Flowkey:** a "wait for you" mode (the music pauses until the right note is played), slow-down controls, and a placement test.
- **Playground Sessions:** badges/achievements and credits to unlock songs.
- **Piano Maestro:** quizzes and mini-games alongside play-along lessons.

---

## 2. Design principles
1. **Never punish, always guide.** Wrong notes produce a gentle cue, not a buzzer. Every lesson can be finished.
2. **Short and complete.** One lesson takes 3–5 minutes. A daily session is about 10–15 minutes.
3. **Read, don't just follow.** Colored keys and letter names are training wheels that gradually come off.
4. **Real music, early.** Within the first session the child plays something recognizable (public-domain melodies).
5. **Listen-first tech honesty.** Design every mode so imperfect mic detection still feels fair (§6).
6. **Kid-safe by design.** Audio is processed on the device and never uploaded. No ads, no chat, no external links in kid mode.

---

## 3. Game modes

### A. Learn (guided lesson)
A short sequence of steps that introduces **one** new concept:
1. **Meet it** – a 10–20 s animated intro, narrated, skippable. Example: "This is Middle C. It lives just left of the two black keys."
2. **Find it** – the child plays the note when asked. Wait mode, no timing.
3. **Practice it** – a short pattern using the new note plus known notes. Wait mode.
4. **Play it** – the same pattern with a moving playhead at a slow tempo, scored for timing.
5. **Song moment** – a tiny musical phrase that uses the concept, with a backing accompaniment.

### B. Play-Along (core song mode)
Sheet music scrolls (or a cursor moves) while a **timing bar** sweeps across it. The child plays each note as the bar reaches it.
- **Difficulty settings:** tempo 50% / 75% / 100%, hints on/off, one hand or both hands.
- **Wait mode toggle:** the bar pauses on each note until it is heard (default for new songs).
- **Auto-practice:** if 3+ misses happen in one section, offer "Let's practice this part": loop it at a slower tempo with a metronome, then return.
- **Section loop:** the child or parent can choose bars to repeat.
- **End screen:** 1–3 stars from note accuracy plus timing, with a short, specific tip ("Your left hand rushed in bar 4").

### C. Note Quest (reading game)
A pure note-reading game with gentle arcade pressure. A note appears on the staff and the child plays it before a friendly creature reaches the end of its path. Correct notes feed or help the creature. It speeds up as accuracy improves and teaches treble then bass clef by note groups. *Directly targets the "rote over reading" weakness.*

### D. Rhythm Drum (rhythm game)
Rhythm patterns are shown in notation. The child plays **any key** (or claps — the mic detects onsets) on the beat. It teaches quarter notes, half notes, whole notes, rests, eighths and dotted rhythms. Because pitch doesn't matter, detection is very reliable, which makes it a great early win.

### E. Ear Echo (listening game)
The app plays a short phrase (2–5 notes) and the child plays it back. It starts with 2 notes in a 3-note range and grows from there. It builds ear training and memory.

### F. Daily Warm-up
A 3-minute mixed session that is generated automatically: 1 review song section, 1 Note Quest round, 1 rhythm round and 1 ear round, weighted toward the child's weak spots. Completing it keeps the **streak** going.

### G. Free Play / Stage
No scoring. The app shows on screen which notes the child is playing (a "magic staff") with fun visuals. A "Stage" option records a performance (on-device only) for the child to play back for the family.

### H. Placement Check (one-time)
A 2-minute check for kids who can already play. It skips them ahead to the right unit.

---

## 4. Progression

### World map
An original illustrated **map of islands**. Each island is a unit and each stop on the path is a lesson or song. A friendly guide character travels with the child. Finishing a unit unlocks a boat to the next island.

### Curriculum (units)
| # | Island / Unit | New skills | Hands | Detection need |
|---|---|---|---|---|
| 1 | **Keyboard Explorer** | Black-key groups, finding C, high vs low, finger numbers, posture | RH | Single notes, very forgiving |
| 2 | **Middle C Home** | C D E (RH), quarter and half notes, steady beat | RH | Single notes |
| 3 | **Left Hand Land** | C B A (LH), whole notes, rests | LH | Single notes |
| 4 | **Five-Finger Forest** | C position C–G both hands, hands taking turns | Alternating | Single notes |
| 5 | **Staff Bridge** | Reading treble/bass staff, landmark notes, steps vs skips | Alternating | Single notes |
| 6 | **Rhythm River** | Eighth notes, dotted half, 3/4 time, dynamics (f/p) | Alternating | Single + onset |
| 7 | **G Mountain** | G position, sharps (F#), moving hand positions | Alternating | Single notes |
| 8 | **Together Town** | Hands together: simple LH held notes under a RH melody | Both | **2 notes at once** |
| 9 | **Chord Castle** | C, F, G triads, chord accompaniment | Both | **3 notes at once** |
| 10+ | **Beyond** | Scales, new keys, longer pieces | Both | Polyphonic |

Units 1–7 only need single-note detection, which is the reliable kind. That gives months of content before we need to solve chords.

### Two branches after Unit 7 (like Simply Piano's paths, but our own)
- **Melody Trail** – reading, range, technique, sight-reading.
- **Chord Trail** – accompaniment, playing with backing tracks, simple pop and folk patterns.
The child can switch freely, and both trails feed the same map.

### Gating rules
- A lesson unlocks when the previous one is **completed** (any stars). Stars are never a hard gate, so kids never get stuck.
- Island "treasure chests" need a total star count. Kids can go back and replay for stars, which is optional mastery.
- Songs in the **Song Shelf** unlock by unit: the songs on each shelf only use skills already learned.

### Mastery tracking (under the hood)
For each child the app tracks accuracy per **note**, per **rhythm value** and per **skill**, with a recent-performance weighting. This drives:
- Daily Warm-up content (spaced review of weak notes and rhythms)
- Hint fading (letter names disappear once a note is ≥90% accurate across 3 sessions)
- "Ready for the next island?" suggestions

---

## 5. Motivation and rewards
| Mechanic | Detail |
|---|---|
| **Stars** | 1–3 per lesson or song. ★ = finished, ★★ = good accuracy, ★★★ = accuracy plus timing. |
| **Collectibles** | Each island has stickers or creatures to collect for the guide's "sticker book". |
| **Streak** | A daily streak, with a **freeze** that is earned automatically once a week (no guilt). |
| **Badges** | Milestones: first song, 10 days of practice, every note in treble clef mastered, first hands-together song… |
| **Customization** | Unlockable outfits for the guide character and keyboard skins. |
| **Concert** | At the end of each unit the child performs a "concert" piece and an animated audience cheers. |

Avoid: loot boxes, purchasable currency, lives or energy systems, and leaderboards against strangers.

---

## 6. Listening and detection strategy per mode
The **expected-note** approach: the game always knows what should be played next, so it checks *"is this note sounding?"* rather than transcribing audio from scratch.

| Mode | Detection | Why it's reliable |
|---|---|---|
| Learn / Note Quest / Ear Echo (units 1–7) | Monophonic pitch detection (YIN/MPM via `pitchy`) plus expected-note matching, allowing octave and harmonic confusions near the target | Single notes are easy to detect |
| Rhythm Drum | Onset detection (spectral flux / energy jump) | Pitch doesn't matter |
| Play-Along timing | Onset time minus a **calibrated latency offset**, with a timing window of ±150 ms (kids) | Generous windows hide mic latency |
| Hands together / chords (units 8+) | Expected-note matching using energy at each expected note's fundamental plus harmonics (chroma / constant-Q) | Checking known notes is much easier than open transcription |
| Free Play "magic staff" | Best-effort pitch plus possibly Basic Pitch (TF.js) later | No scoring, so errors don't matter |

Other rules:
- **Calibration** on first launch: "Play Middle C 4 times." This measures latency and the piano's tuning (old home pianos are often flat).
- **Echo guard:** ignore the notes the app itself just played through the speaker, or suggest headphones for backing tracks.
- **Forgiveness:** a note counts if it is heard anywhere inside the window. "Extra" notes are never punished in early units.
- **MIDI later:** add MIDI keyboard input after the Capacitor wrap (Safari has no Web MIDI).

---

## 7. Parent area (behind a "grown-up" gate)
- Practice time per day/week, streak, current island
- Strong and weak notes and rhythms, in plain language
- Settings: daily goal, child profiles (siblings), handedness, hint level, audio narration language
- Tips: "Ready for hands together — sit nearby for this one!"

---

## 8. Content pipeline
- Songs and exercises are written as **MusicXML** (editable in MuseScore) or a compact JSON format we define.
- Each lesson is a small JSON file: steps, the concept it introduces, the notes and rhythms allowed, and the backing track.
- Start with **public-domain** melodies (folk songs, nursery tunes, classical themes). Licensed pop songs come much later, if ever.

---

## 9. Technical architecture (web, iPad-first)
| Layer | Choice |
|---|---|
| App shell | Vite + TypeScript, PWA (Home Screen, full-screen, offline) |
| UI | Lightweight framework (Svelte or React); canvas/SVG for the game screens |
| Notation | VexFlow (custom scrolling staff) or OpenSheetMusicDisplay (MusicXML) |
| Audio in | `getUserMedia` with echoCancellation, noiseSuppression and autoGainControl **off**, then an AudioWorklet that does pitch and onset analysis |
| Audio out | Web Audio: piano samples, metronome, backing tracks; `navigator.audioSession.type` set as needed |
| Data | IndexedDB on the device (profiles, progress, mastery). Optional cloud sync later. |
| Native later | Capacitor wrapper → App Store, native MIDI plugin, AVAudioSession control |

---

## 10. Build phases
| Phase | Goal | Contents |
|---|---|---|
| **0. Tech spike** | Prove the mic works on a real iPad and piano | Mic setup, single-note detection, latency calibration, a debug screen showing the detected note |
| **1. Core loop MVP** | One fun playable song | Scrolling staff plus timing bar, wait mode and timed mode, stars, 3 songs from Unit 2 |
| **2. First islands** | A real learning path | Learn mode, world map, Units 1–3, progress saved, Note Quest |
| **3. Engagement** | Kids come back | Rhythm Drum, Ear Echo, Daily Warm-up, stickers, streaks, parent area |
| **4. Mid curriculum** | Months of content | Units 4–7, auto-practice, hint fading, placement check |
| **5. Hands together** | Polyphonic detection | Units 8–9, chord matching, Chord Trail |
| **6. Native** | App Store and MIDI | Capacitor, MIDI, audio session tuning |

---

## 11. Open questions
1. **Child's age?** It changes how much text, narration and time pressure to use.
2. **Acoustic piano or digital keyboard at home?** A digital keyboard may make MIDI worth doing earlier.
3. **Personal use or publishing?** Publishing adds privacy compliance (COPPA/GDPR-K), accounts and payments.
4. **Art direction:** what theme for the world? Islands are the placeholder. Space, animals or a favorite theme of the child are alternatives.
5. **Narration voice:** recorded human voice or text-to-speech?
