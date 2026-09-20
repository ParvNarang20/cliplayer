# CLI MUSIC PLAYER
# CLI Music Player

A lightweight, terminal-based audio player built with Node.js and VLC media player. It provides an interactive command-line interface to browse, play, and control your local music files seamlessly.

---

## Features

- **Dynamic Track Loading:** Automatically scans and loads `.mp3` files from the `./songs` directory.
- **VLC Integration:** Plays audio in the background using VLC Remote Control interface.
- **Interactive UI:** Clean terminal interface with flickering prevention and visual progress bar.
- **Playback Controls:** Seek forward/backward (+10s / -10s), play/pause, next/previous tracks.
- **Repeat Mode:** Toggle single song repeat mode.
- **Sleep Timer:** Set automatic shutdown timers (5 min, 10 min, 15 min).
- **In-Memory History:** Tracks and displays the last 5 recently played tracks.

---

## Prerequisites

Before running the player, ensure you have the following installed on your system:

1. **Node.js** (v14 or higher)
2. **VLC Media Player** (Must be accessible from command line)
3. **macOS** (Uses native `afinfo` utility for track duration detection)

---

## Project Structure

```text
cliplayer/
├── songs/             # Directory containing MP3 audio files
│   ├── song1.mp3
│   └── song2.mp3
├── player.js          # Main application logic
├── .gitignore
└── README.md
