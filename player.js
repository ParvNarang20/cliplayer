process.stdin.setRawMode(true)
const { spawn } = require("child_process");


// CODE FOR UP AND DOWN ARROW KEY---->>
let userChoice = 0
let isPaused = true
let playerProcess = undefined

let elapsedDuration = 0;
let totalDuration = 0;

process.stdin.on('data',(data)=>{
    // if(data[0]===0x6b){
    //     console.log("User Killed The Processs")
    //     playerProcess.kill("SIGINT")
    //     return
    // }
    if (data[0]===0x6e){
        console.log("NEXT")
        userChoice += 1
        playerProcess.kill("SIGINT")
        playerProcess = spawn('vlc', ["--intf","rc",`./songs/${songMenu[userChoice]}`])
        isPaused = false;

        elapsedDuration=0;
        totalDuration = getTotalDuration(`./songs/${songMenu[userChoice]}`)

        return
    }
    if (data[0]===0x62){
        console.log("BACK")
        elapsedDuration = 0;
        userChoice -= 1
         playerProcess.kill("SIGINT")
        playerProcess = spawn('vlc', ["--intf","rc",`./songs/${songMenu[userChoice]}`])
        isPaused = false;


        elapsedDuration=0;
        totalDuration = getTotalDuration(`./songs/${songMenu[userChoice]}`)
        return
    }
    if (data[0] === 0x1b) {
        if (data[1] === 0x5b) {
            if (data[2] === 0x41){
                // console.log("Up Arrow Key")
                if (userChoice > 0){
                userChoice -= 1
                listSongs()
            }
            } else if (data[2] === 0x42){
                if (userChoice < songMenu.length - 1){
                userChoice += 1
                listSongs()
            }
                // console.log("Down Arrow Key")
            }
            // else if (data[2] === 0x44){
            //     if (userChoice > 0 ){
            //         userChoice -= 1
            //     }
            // } else if (data[2] === 0x43){
            //     if (userChoice < songMenu.length - 1){
            //         userChoice += 1
            //     }
            // }
        }
        if (data[0] === 0x03) {
            process.exit(0)
        }
    }
    if (data[0] === 0x03) {
        process.exit(0)
    }
    if (data[0] === 0x0d) {
        if(playerProcess !== undefined){
            playerProcess.kill("SIGINT")
        }
        elapsedDuration = 0
        totalDuration = getTotalDuration(`./songs/${songMenu[userChoice]}`)
        console.log(`You selected: ${songMenu[userChoice]}`)
        playerProcess = spawn('vlc', ["--intf","rc",`./songs/${songMenu[userChoice]}`])
        isPaused = false;
    }
    if (data[0] === 0x70) {
        playerProcess.stdin.write("pause\n")
        console.log("User it Play/Pause")
        isPaused = !isPaused
    //     if (isPaused) {
    //         playerProcess.kill("SIGCONT")
    //     } else {
    //         playerProcess.kill("SIGSTOP")
    //     }
    //      isPaused = !isPaused
    }
})

const songMenu = ["song1.mp3", "song2.mp3","song3.mp3","song4.mp3"]
function listSongs() {
    // process.stdout.write('\x1b[2J')
    process.stdout.write('\x1b[2;0H')
    process.stdout.write('\x1b[1;1H');
    // process.stdout.write('\x1b[2J\x1b[3J\x1b[2;1H');


    // console.clear()
    songMenu.forEach((song, ind) =>{
        if (ind == userChoice){
            process.stdout.write(`> ${ind} : ${song}\x1B[0K\n`)
            // console.log(`> ${ind} : ${song}`)
        }else{
            process.stdout.write(` ${ind} : ${song}\x1B[0K\n`)

            // console.log(`${ind} : ${song}`)
        }
    })
    const ratio = Math.min(100,elapsedDuration/Math.max(0,totalDuration))
    const filledBars=Math.round(ratio*100)
    const emptyBars = 100-filledBars

    console.log(`Elapsed Duration: ${Math.round(elapsedDuration,2)} / ${totalDuration} seconds`)
    console.log(`[ $]`)
}

function getTotalDuration(songPath) {
    console.log(`Getting total duration for ${songPath}`);
    const afinfoProcess = spawn('afinfo', [songPath]);

    afinfoProcess.stdout.on('data', (data) => {
        const output = data.toString();
        totalDuration = Number(
            output.split("estimated duration: ")[1].split(".")[0]
        );
    })}
listSongs()
setInterval(() => {
    if(isPaused=== false && playerProcess!==undefined){
        elapsedDuration += 0.05;

    }

},50)