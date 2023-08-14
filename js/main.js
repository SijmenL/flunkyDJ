//te lui voor comments of efficiente code

window.addEventListener('load', init);

let musicPlaying;
let startMusic;
let mainMusic;
let pausedMusic;
let drinkMusic;
let stopAudio;
let fadeOutAudio;
let fadeInAudio;
let finishedMusic;
let fadeTo;
let body;

let startButton;
let mainButton;
let drinkButton;
let pausedButton;
let finishedButton;
let stopButton;

function init() {
    console.log('page loaded');

    body = document.getElementById('body');

    startMusic = document.getElementById('start-music-audio');
    mainMusic = document.getElementById('main-music-audio');
    pausedMusic = document.getElementById('paused-music-audio');
    drinkMusic = document.getElementById('drinking-music-audio');
    finishedMusic = document.getElementById('finished-music-audio');
    stopAudio = document.getElementById('stop-audio');

    startButton = document.getElementById('start-button');
    mainButton = document.getElementById('main-button');
    drinkButton = document.getElementById('drink-button');
    pausedButton = document.getElementById('paused-button');
    finishedButton = document.getElementById('finished-button');
    stopButton = document.getElementById('stop-button');

    startButton.addEventListener('click', playStartMusic);
    mainButton.addEventListener('click', playMainMusic);
    drinkButton.addEventListener('click', playDrinkMusic);
    pausedButton.addEventListener('click', playPausedMusic);
    finishedButton.addEventListener('click', playFinishedMusic);
    stopButton.addEventListener('click', stopPlaying);

    startMusic.load();
    mainMusic.load();
}

function fadeOut(selectedSong, speed) {
    console.log(`%cfade out of ${selectedSong.id} initiated`, "color:blue")
    let fadeTimer = 0;
    fadeOutAudio = setInterval(function () {
        fadeTimer++;
        if (selectedSong !== musicPlaying && fadeTimer > speed) {
            clearInterval(fadeOutAudio);
        }

        if (selectedSong.volume > 0.1) {
            selectedSong.volume -= 0.1;
        }
        if (selectedSong.volume <= 0.05) {
            clearInterval(fadeOutAudio);
            console.log('%cfade out done', "color:green");
            fadeOutDone();
        }
    }, speed);
}

function fadeIn(selectedSong, speed) {
    console.log(`%cfade in of ${selectedSong.id} initiated`, "color:blue")
    let fadeTimer = 0;
    fadeInAudio = setInterval(function () {
        fadeTimer++;
        if (selectedSong !== musicPlaying && fadeTimer > speed) {
            clearInterval(fadeInAudio);
        }


        if (selectedSong.volume < 0.9) {
            selectedSong.volume += 0.1;
        }
        if (selectedSong.volume >= 0.95) {
            clearInterval(fadeInAudio);
            console.log('%cfade in done', "color:green");
            fadeInDone(selectedSong);
        }
    }, speed);
}


function fadeOutDone() {
    if (fadeTo === "main") {
        fadeIn(mainMusic, 100);
        mainMusic.volume = 0;
        mainMusic.play();
        fadeTo = "";
    }
    if (fadeTo === "drink") {
        fadeIn(drinkMusic, 50);
        drinkMusic.volume = 0;
        drinkMusic.play();
        fadeTo = "";
    }
    if (fadeTo === "finished") {
        fadeInDone(finishedMusic);
    }


}

function fadeInDone(selectedSong) {
    if (selectedSong === mainMusic) {
        if (musicPlaying !== "main") {
            mainMusic.play();
            mainMusic.loop = true;
            mainMusic.volume = 1;
        }

        mainButton.classList.add("playing");
        drinkButton.classList.remove("playing");
        pausedButton.classList.remove("playing");
        finishedButton.classList.remove("playing");

        drinkMusic.pause();
        pausedMusic.pause();
        finishedMusic.pause();

        musicPlaying = 'main';
        console.log(`%cnow playing: ${musicPlaying}`, "color:yellow");
    }
    if (selectedSong === drinkMusic) {
        if (musicPlaying !== "drink") {
            drinkMusic.volume = 1;
            drinkMusic.loop = true;
            drinkMusic.play();

        }
        mainButton.classList.remove("playing");
        drinkButton.classList.add("playing");
        pausedButton.classList.remove("playing");
        finishedButton.classList.remove("playing");

        mainMusic.pause();
        pausedMusic.pause();
        finishedMusic.pause();


        musicPlaying = 'drink';
        console.log(`%cnow playing: ${musicPlaying}`, "color:yellow");
    }
    if (selectedSong === finishedMusic) {
        finishedMusic.volume = 1;
        finishedMusic.loop = true;
        finishedMusic.currentTime = 0;
        finishedMusic.play();
        fadeTo = "";
        mainMusic.pause();
        pausedMusic.pause();
        drinkMusic.pause();

        mainButton.classList.remove("playing");
        drinkButton.classList.remove("playing");
        pausedButton.classList.remove("playing");
        finishedButton.classList.add("playing");


        musicPlaying = 'finished';
        console.log(`%cnow playing: ${musicPlaying}`, "color:yellow");
    }
}

function playStartMusic() {
    clearInterval(fadeOutAudio);
    clearInterval(fadeInAudio);

    if (musicPlaying !== "start") {
        startMusic.volume = 0.5;
        startMusic.currentTime = 0;
        startMusic.play();
        startMusic.loop = true;

        clearInterval(fadeOutAudio);
        clearInterval(fadeInAudio);

        let style = document.createElement('style');
        style.innerHTML = '.after-start {display: flex;}';
        body.appendChild(style);


        console.log(startButton);
        startButton.remove();
    }

    musicPlaying = 'start';
    console.log(`%cnow playing: ${musicPlaying}`, "color:yellow");

}


function playMainMusic() {
    clearInterval(fadeOutAudio);
    clearInterval(fadeInAudio);

    mainButton.classList.add("selected");
    drinkButton.classList.remove("selected");
    pausedButton.classList.remove("selected");
    finishedButton.classList.remove("selected");

    fadeTo = "main";

    if (musicPlaying === "start") {
        fadeInDone(mainMusic);
        startMusic.pause();
    }
    if (musicPlaying === "paused") {
        fadeOut(pausedMusic, 250);
    }
    if (musicPlaying === "drink") {
        fadeOut(drinkMusic, 250);
    }
    if (musicPlaying === "finished") {
        fadeOut(finishedMusic, 250);
    }
    if (musicPlaying === "") {
        fadeInDone(mainMusic);
    }

    musicPlaying = "main";
    console.log(`%cnow playing: ${musicPlaying}`, "color:yellow");
}


function playPausedMusic() {
    clearInterval(fadeOutAudio);
    clearInterval(fadeInAudio);

    mainButton.classList.remove("selected");
    drinkButton.classList.remove("selected");
    pausedButton.classList.add("selected");
    finishedButton.classList.remove("selected");


    if (musicPlaying !== "paused") {
        pausedMusic.volume = 1;
        pausedMusic.currentTime = 0;
        pausedMusic.play();
        pausedMusic.loop = true;

        mainButton.classList.remove("playing");
        drinkButton.classList.remove("playing");
        pausedButton.classList.add("playing");
        finishedButton.classList.remove("playing");


        mainMusic.pause();
        drinkMusic.pause();
        startMusic.pause();
        finishedMusic.pause();

        clearInterval(fadeOutAudio);
        clearInterval(fadeInAudio);
    }

    musicPlaying = 'paused';
    console.log(`%cnow playing: ${musicPlaying}`, "color:yellow");

}

function playDrinkMusic() {
    clearInterval(fadeOutAudio);
    clearInterval(fadeInAudio);

    mainButton.classList.remove("selected");
    drinkButton.classList.add("selected");
    pausedButton.classList.remove("selected");
    finishedButton.classList.remove("selected");


    fadeTo = "drink";

    if (musicPlaying === "start") {
        fadeOut(startMusic, 50);
    }
    if (musicPlaying === "main") {
        fadeOut(mainMusic, 50);
    }
    if (musicPlaying === "paused") {
        fadeOut(pausedMusic, 50);
    }
    if (musicPlaying === "finished") {
        fadeOut(finishedMusic, 50);
    }
    if (musicPlaying === "") {
        fadeInDone(drinkMusic);
    }

    musicPlaying = "drink";

}

function playFinishedMusic() {
    clearInterval(fadeOutAudio);
    clearInterval(fadeInAudio);

    mainButton.classList.remove("selected");
    drinkButton.classList.remove("selected");
    pausedButton.classList.remove("selected");
    finishedButton.classList.add("selected");

    fadeTo = "finished";

    if (musicPlaying === "start") {
        fadeOut(startMusic, 500);
    }
    if (musicPlaying === "main") {
        fadeOut(mainMusic, 500);
    }
    if (musicPlaying === "paused") {
        fadeOut(pausedMusic, 500);
    }
    if (musicPlaying === "drink") {
        fadeOut(drinkMusic, 500);
    }
    if (musicPlaying === "") {
        fadeInDone(finishedMusic);
    }
    musicPlaying = "finished";

}

function stopPlaying() {
    if (musicPlaying !== "") {
        console.log(`%call music muted & reset`, "color:yellow");

        clearInterval(fadeOutAudio);
        clearInterval(fadeInAudio);

        mainButton.classList.remove("selected");
        drinkButton.classList.remove("selected");
        pausedButton.classList.remove("selected");
        finishedButton.classList.remove("selected");

        mainButton.classList.remove("playing");
        drinkButton.classList.remove("playing");
        pausedButton.classList.remove("playing");
        finishedButton.classList.remove("playing");


        stopAudio.play();
        stopAudio.volume = 0.25;
        stopAudio.currentTime = 0;

        musicPlaying = "";


        mainMusic.pause();
        drinkMusic.pause();
        startMusic.pause();
        finishedMusic.pause();
        pausedMusic.pause();

        mainMusic.currentTime = 0;
        drinkMusic.currentTime = 0;
    }
}
