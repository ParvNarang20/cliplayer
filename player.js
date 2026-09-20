const fs = require("fs");
const { spawn } = require("child_process");

process.stdin.setRawMode(true);
process.stdin.resume();

let userChoice = 0;
let isPaused = true;
let playerProcess = undefined;

let elapsedDuration = 0;
let totalDuration = 0;
let isRepeat = false;
let sleepTimer = 0; // seconds me (0 = OFF)

// recent played songs 
let history = [];

// Dynamic folder reading: ./songs folder se saare songs load honge
let songMenu = [];
try {
    songMenu = fs.readdirSync("./songs").filter(file => !file.startsWith("."));
    if (songMenu.length === 0) {
        console.log("Error: ./songs folder me koi song nahi hai!");
        process.exit(1);
    }
} catch (err) {
    console.log("Error: ./songs folder nahi mila!");
    process.exit(1);
}

// VLC Playback with --start-time support
function playSong(startTime = 0) {
    if (playerProcess !== undefined) {
        playerProcess.kill("SIGKILL");
    }

    const currentSong = songMenu[userChoice];

    // Recent history update
    if (history[history.length - 1] !== currentSong) {
        history.push(currentSong);
        if (history.length > 5) history.shift();
    }

    elapsedDuration = startTime;
    totalDuration = 0;
    getTotalDuration(`./songs/${currentSong}`);

    // Dummy mode without GUI + custom start-time for instant seeking
    const args = ['-I', 'dummy', '--no-video'];
    if (startTime > 0) {
        args.push(`--start-time=${Math.floor(startTime)}`);
    }
    args.push(`./songs/${currentSong}`);

    playerProcess = spawn("vlc", args, { stdio: 'ignore' });

    isPaused = false;
    listSongs();
}

function nextSong() {
    userChoice = (userChoice + 1) % songMenu.length;
    playSong(0);
}

function prevSong() {
    userChoice = (userChoice - 1 + songMenu.length) % songMenu.length;
    playSong(0);
}

// macOS afinfo command se total duration
function getTotalDuration(songPath) {
    const afinfoProcess = spawn('afinfo', [songPath]);
    afinfoProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const duration = output.split("estimated duration: ")[1];
        if (duration) {
            totalDuration = Number(duration.split(".")[0]);
            listSongs();
        }
    });
}

// Terminal UI Screen
function listSongs() {
    // Screen clear ansi sequence
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H');

    console.log("--- CLI Music Player ---\n");

    songMenu.forEach((song, ind) => {
        if (ind === userChoice) {
            console.log(`> ${ind} : ${song}`);
        } else {
            console.log(`  ${ind} : ${song}`);
        }
    });

    console.log("");

    // Progress Bar
    const ratio = totalDuration > 0 ? Math.min(1, elapsedDuration / totalDuration) : 0;
    const barLength = 30;
    const filled = Math.round(ratio * barLength);
    const empty = barLength - filled;
    const bar = "=".repeat(filled) + "-".repeat(empty);

    console.log(`[${bar}]`);
    console.log(`Time: ${Math.round(elapsedDuration)}s / ${totalDuration}s`);
    console.log(`Status: ${isPaused ? "Paused" : "Playing"} | Repeat (r): ${isRepeat ? "ON" : "OFF"}`);

    if (sleepTimer > 0) {
        console.log(`Sleep Timer (t): ${Math.ceil(sleepTimer / 60)} min remaining`);
    } else {
        console.log(`Sleep Timer (t): OFF`);
    }

    if (history.length > 0) {
        console.log("\nRecently Played:");
        history.forEach((song, index) => {
            console.log(`  ${index + 1}. ${song}`);
        });
    }

    console.log("\n[ $]");
}

// Keyboard Input Logic
process.stdin.on('data', (data) => {
    // Exit (Ctrl + C)
    if (data[0] === 0x03) {
        if (playerProcess) playerProcess.kill("SIGKILL");
        process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
        process.exit(0);
    }

    // Arrow Keys Navigation & Seeking
    if (data[0] === 0x1b && data[1] === 0x5b) {
        if (data[2] === 0x41) { // Up Arrow
            if (userChoice > 0) {
                userChoice -= 1;
                listSongs();
            }
        } else if (data[2] === 0x42) { // Down Arrow
            if (userChoice < songMenu.length - 1) {
                userChoice += 1;
                listSongs();
            }
        } else if (data[2] === 0x43) { // Right Arrow (+10s Seek)
            let newTime = elapsedDuration + 10;
            if (totalDuration > 0 && newTime > totalDuration) {
                newTime = totalDuration;
            }
            playSong(newTime);
        } else if (data[2] === 0x44) { // Left Arrow (-10s Seek)
            let newTime = elapsedDuration - 10;
            if (newTime < 0) {
                newTime = 0;
            }
            playSong(newTime);
        }
        // seek Fix: VLC ke stdin pipe ki jagah ab Right/Left arrow dabane par song --start-time flag ke saath new position par instantly respawn hota hai, jisse audio freeze hona band ho gaya.
        return;
    }

    // Enter Key -> Song start karo
    if (data[0] === 0x0d) {
        playSong(0);
        return;
    }

    // p: Play / Pause toggle via OS POSIX Signals
    if (data[0] === 0x70) {
        if (playerProcess) {
            if (isPaused) {
                playerProcess.kill("SIGCONT"); // Unfreeze process
                isPaused = false;
            } else {
                playerProcess.kill("SIGSTOP"); // Freeze process
                isPaused = true;
            }
            listSongs();
        }
        return;
    }

    // n: Next Song
    if (data[0] === 0x6e) {
        nextSong();
        return;
    }

    // b: Back Song
    if (data[0] === 0x62) {
        prevSong();
        return;
    }

    // r: Repeat Toggle
    if (data[0] === 0x72) {
        isRepeat = !isRepeat;
        listSongs();
        return;
    }

    // t: Sleep Timer Cycle (OFF -> 5m -> 10m -> 15m -> OFF)
    if (data[0] === 0x74) {
        if (sleepTimer === 0) sleepTimer = 300;
        else if (sleepTimer === 300) sleepTimer = 600;
        else if (sleepTimer === 600) sleepTimer = 900;
        else sleepTimer = 0;
        listSongs();
        return;
    }
});

// Updates in every 1sec
setInterval(() => {
    if (!isPaused && playerProcess !== undefined) {
        elapsedDuration += 1;

        if (totalDuration > 0 && elapsedDuration >= totalDuration) {
            if (isRepeat) {
                playSong(0);
            } else {
                nextSong();
            }
        }
    }

    if (sleepTimer > 0) {
        sleepTimer -= 1;
        if (sleepTimer <= 0) {
            if (playerProcess) playerProcess.kill("SIGKILL");
            process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
            console.log("Sleep timer ended. Player stopped.");
            process.exit(0);
        }
    }

    listSongs();
}, 1000);

listSongs();