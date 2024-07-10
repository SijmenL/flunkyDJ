window.addEventListener('load', init);

let context;
let bufferLoader;
let musicFiles;
let musicButtons = [];
let buttonDisplay;
let loadingDisplay;
let musicPlaying;
let currentSource;
let gainNode;
let elapsedTimes;
let currentlyPlayingElement = null;
let playingAudio = []
let timeSinceButtonPressed = -10;
let fadeToSong = []
let waitingTime;
let stopButton;
let debug = false;
let previousSong = 0
let soundEffects = [];
let selectedSong;
let pauseTime = 0;
let paused;
let newSource;
let isStopping = false
let decreasePlaybackRate;
let stopAudio;
let loadingAnimation;

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array(urlList.length);
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url, index) {
    // Load buffer asynchronously
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    let loader = this;

    request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function (buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount === loader.urlList.length) {
                    loader.onload(loader.bufferList);
                }
            },
            function (error) {
                console.error('decodeAudioData error', error);
            }
        );
    };

    request.onerror = function () {
        alert('BufferLoader: XHR error');
    };

    request.send();
};

BufferLoader.prototype.load = function () {
    for (let i = 0; i < this.urlList.length; ++i) {
        this.loadBuffer(this.urlList[i], i);
    }
};

function init() {
    console.info('Javascript loaded.')
    console.log(`Debug ${debug}`)
    context = new AudioContext();
    musicFiles = [];
    buttonDisplay = document.getElementById('button-display');
    loadingDisplay = document.getElementById('loading');
    loadingAnimation = document.getElementById('buttons-loading')
    gainNode = context.createGain();

    stopAudio = document.getElementById('stop-audio');

    if ('wakeLock' in navigator) {
        let wakeLock = null;

        // Function to request a wake lock
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock is active!');
            } catch (err) {
                console.error(`Failed to request wake lock: ${err.message}`);
            }
        };

        // Request the wake lock when the page is opened
        requestWakeLock();

        // Release the wake lock when the page is closed or unloaded
        window.addEventListener('unload', async () => {
            if (wakeLock !== null) {
                try {
                    await wakeLock.release();
                    console.log('Wake lock released.');
                } catch (err) {
                    console.error(`Failed to release wake lock: ${err.message}`);
                }
            }
        });
    } else {
        console.warn('Wake Lock API is not supported by this browser.');
    }


    let allSources = document.querySelectorAll('a[class^=music-button]');

    stopButton = document.getElementById('stop-music');
    stopButton.addEventListener('click', function (e) {
        stop(allSources);
    })

    for (let i = 0; i < allSources.length; i++) {
        allSources[i].addEventListener('click', function (e) {
            if (isStopping === false) {
                if (allSources[i].getAttribute('data-play-type') !== '3') {

                    // Clear the 'selected' class from all buttons
                    for (let j = 0; j < allSources.length; j++) {
                        allSources[j].classList.remove('selected');
                    }

                    // Add the 'selected' class to the clicked button
                    allSources[i].classList.add('selected');
                    selectedSong = bufferLoader.bufferList[i];
                    // timeSinceButtonPressed = context.currentTime - timeSinceButtonPressed; // Set the start time when the button is pressed

                    paused = false;
                    if (!musicPlaying) {
                        crossfadeToNewSong(bufferLoader.bufferList[i], i, 0, 0, allSources[i], allSources[i].getAttribute('data-play-type'));
                    } else {
                        crossfadeToNewSong(bufferLoader.bufferList[i], i, allSources[i].getAttribute('data-fade-out'), allSources[i].getAttribute('data-fade-in'), allSources[i], allSources[i].getAttribute('data-play-type'));
                    }
                    fadeToSong.push(bufferLoader.bufferList[i], i, allSources[i].getAttribute('data-fade-out'), allSources[i].getAttribute('data-fade-in'), allSources[i], allSources[i].getAttribute('data-play-type'))
                    timeSinceButtonPressed = 0;
                } else {
                    soundEffect(bufferLoader.bufferList[i], allSources[i])
                }
            }
        });
        musicFiles.push(allSources[i].getAttribute('data-audio'));
        musicButtons.push(allSources[i]);
    }


    bufferLoader = new BufferLoader(
        context,
        musicFiles,
        finishedLoading
    );
    bufferLoader.load();

    elapsedTimes = new Array(musicFiles.length).fill(0);

    if (musicFiles.length < 1) {

        finishedLoading();
        stopButton.remove()

        let error = document.createElement('div');
        error.classList.add('alert')
        error.classList.add('alert-danger')
        error.innerText = 'Geen muziek gevonden'
        buttonDisplay.style.display = 'block'
        loadingAnimation.style.display = 'none'
        buttonDisplay.appendChild(error)
    }

    setInterval(function () {
        if (timeSinceButtonPressed >= 0) {
            timeSinceButtonPressed++
        }
        if (paused === true) {
            pauseTime++
        }
    }, 10)

    if (debug) {
        setInterval(function () {
            console.log(`${timeSinceButtonPressed / 100}, ${context.currentTime}`)
            // console.log(currentSource ? context.currentTime - timeSinceButtonPressed - 1 : 0)
        }, 10)
    }
}

function stop(allSources) {
    if (isStopping === true) {
        clearInterval(decreasePlaybackRate)
        clear(allSources);
        stopButton.classList.remove('is-stopping');

        stopAudio.play();
        stopAudio.volume = 0.25;
        stopAudio.currentTime = 0;
    }
    if (isStopping === false && paused === false) {
        stopButton.classList.add('is-stopping');
        isStopping = true;
        console.log(gainNode.playbackRate)

        let playbackRate = 1;

        decreasePlaybackRate = setInterval(function () {
            if (playbackRate >= 0) {
                newSource.playbackRate.value = playbackRate;
                if (gainNode.gain.value > playbackRate) {
                    gainNode.gain.value = playbackRate;
                }
                playbackRate -= 0.015;
                console.log(playbackRate);
            } else {
                console.log("Playback rate reached 0");
                clearInterval(decreasePlaybackRate);
                clear(allSources)
            }
        }, 100);
    }
}

function clear(allSources) {
    console.log('paused')
    paused = true;
    isStopping = false;

    // Stop all playing audio
    while (playingAudio.length > 0) {
        let stopAudio = playingAudio.shift();  // Remove the first item from the array
        stopAudio.stop();
    }

    // Clear selected and playing classes from all sources
    for (let j = 0; j < allSources.length; j++) {
        allSources[j].classList.remove('selected');
        allSources[j].classList.remove('playing');
        allSources[j].classList.remove('playing-no-remember');
        allSources[j].classList.remove('sound-effect');
    }

    // Stop all sound effects
    while (soundEffects.length > 0) {
        let stopAudio = soundEffects.shift();  // Remove the first item from the array
        stopAudio.stop();
    }

    currentSource = null
    musicPlaying = null
    setPlayingClass(null)
    timeSinceButtonPressed = -10
    elapsedTimes = null
    elapsedTimes = new Array(musicFiles.length).fill(0);
    stopButton.classList.remove('is-stopping')
}

function finishedLoading() {
    buttonDisplay.style.display = 'flex';
    loadingAnimation.style.display = 'none'
    loadingDisplay.remove();

    console.log(buttonDisplay.getAttribute('data-stop-button'))
}

// Callback function to set or remove the 'playing' class
function setPlayingClass(element) {
    currentlyPlayingElement = element
    // Remove 'playing' class from all buttons
    for (let j = 0; j < musicButtons.length; j++) {
        musicButtons[j].classList.remove('playing');
        musicButtons[j].classList.remove('playing-no-remember');
    }

    if (element !== null) {
        // Add 'playing' class to the current button
        if (element === currentlyPlayingElement) {
            if (element.getAttribute('data-play-type') === '1') {
                element.classList.add('playing');
            }
            if (element.getAttribute('data-play-type') === '2') {
                element.classList.add('playing-no-remember');
            }
        } else {
            currentlyPlayingElement = null;
        }
    }
}

function crossfadeToNewSong(newBuffer, index, fadeOut, fadeIn, element, playType) {
    if (musicPlaying === newBuffer) {
        // If the clicked song is the same as the currently playing song, ignore the click
        console.log('Same song pressed')
        console.log(musicPlaying)
        console.log(newBuffer)

        fadeOut = 0;
        fadeIn = 0;
    }

    console.log('Fade started')

    for (let i = 1; i < playingAudio.length - 1; i++) {
        let stopAudio = playingAudio.shift();  // Remove the first item from the array
        stopAudio.stop();
    }

    let fadeOutTime = parseFloat(fadeOut) / 1000; // Convert milliseconds to seconds
    let fadeInTime = parseFloat(fadeIn) / 1000; // Convert milliseconds to seconds

    // Calculate the current time
    const currentTime = context.currentTime;

    if (playType === '1') {
        if (timeSinceButtonPressed < 0) {
            timeSinceButtonPressed = 0;
        }
        if (elapsedTimes[previousSong] >= 0) {
            elapsedTimes[previousSong] += (timeSinceButtonPressed / 100) - fadeInTime
        } else {
            elapsedTimes[previousSong] = 0;
        }
        previousSong = index;


        while (elapsedTimes[previousSong] >= bufferLoader.bufferList[index].duration) {
            elapsedTimes[previousSong] = elapsedTimes[previousSong] - bufferLoader.bufferList[index].duration;
            console.warn('song looped')
        }
        console.warn(`${elapsedTimes[previousSong]} < ${bufferLoader.bufferList[index].duration}`)
        for (let i = 0; i < elapsedTimes.length; i++) {
            console.log(`${musicFiles[i]} = ${elapsedTimes[i]}`)
        }
    }
    const newGainNode = context.createGain();
    newGainNode.gain.value = 0;

    // Create a new audio source for the new song
    newSource = undefined;
    newSource = context.createBufferSource();
    playingAudio.push(newSource);  // Add the new source to the array
    newSource.buffer = newBuffer;
    newSource.loop = true;

    let elapsedTime;
    // Calculate the elapsed time for the new song
    if (playType === '1') {
        elapsedTime = elapsedTimes[index];
    }
    if (playType === '2') {
        elapsedTime = 0
    }

    if (elapsedTime < 0 && elapsedTime) {
        elapsedTime = 0
    }

    // Connect the new source to the new gain node
    newSource.connect(newGainNode);

    // Connect the new gain node to the destination
    newGainNode.connect(context.destination);

    // Start the new source immediately with the new gain node
    newSource.start(0, elapsedTime);

    // Start fade out
    console.info(`Fade out: CT:${currentTime} FT:${fadeOutTime}`)

    for (let i = 0; i < playingAudio.length; i++) {
        if (playingAudio[i] !== undefined && playingAudio[i].buffer !== selectedSong) {
            playingAudio[i].connect(gainNode)
            if (gainNode.gain < 0.8) {
                gainNode.gain.setValueAtTime(1, currentTime);
            }
            gainNode.gain.setValueAtTime(1, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutTime); // Adjusted to 0 for complete fade-out
        }
    }


    for (let i = 0; i < playingAudio.length; i++) {
        if (playingAudio[i] !== undefined && playingAudio[i] !== playingAudio[playingAudio.length - 1] && playingAudio[i] !== musicPlaying && playingAudio[i].buffer === selectedSong) {
            console.warn('Spam detected')
            playingAudio[i].stop();
        }
    }

    if (fadeOutTime === 0) {
        for (let i = 0; i < playingAudio.length; i++) {
            if (playingAudio[i] !== undefined && playingAudio[i] !== playingAudio[playingAudio.length - 1]) {
                console.warn('Previous fade in aborted.')
                playingAudio[i].stop();
            }
        }
    }

    if (element !== currentlyPlayingElement && fadeIn !== 0) {
        if (selectedSong === newBuffer) {
            // Schedule a linear fade-in for the new source
            console.info(`Fade in: CT:${currentTime + fadeOutTime} FT:${fadeInTime}`)
            newGainNode.gain.setValueAtTime(0, currentTime + fadeOutTime); // Adjusted to start from 0 after fade-out
            newGainNode.gain.linearRampToValueAtTime(1, currentTime + fadeOutTime + fadeInTime); // Adjusted the time for fade-in
        }
    } else {console.info(`Fade in: CT:${currentTime + fadeOutTime} FT:${fadeInTime}`)
        console.error('spam prevented')

        console.log(currentSource)
        if (currentSource !== null && currentSource !== undefined) {
            currentSource.disconnect();
        }

        newGainNode.gain.linearRampToValueAtTime(1, currentTime + fadeInTime + fadeOutTime);



        for (let i = 1; i < playingAudio.length; i++) {
            let stopAudio = playingAudio.shift();  // Remove the first item from the array
            stopAudio.stop();
        }
    }

    displaySelectedSong(element, fadeOutTime, fadeInTime);

    // Set a timeout to call the callback function after the crossfade is complete
    setTimeout(() => {
        // Update the current gain node to the new gain node
        gainNode = newGainNode;

        // Update the current source to the new source
        currentSource = newSource;
        musicPlaying = newBuffer;

        fadeToSong = [];
    }, (fadeInTime + fadeOutTime));
}


function displaySelectedSong(element, fadeOutTime, fadeInTime) {

    if (waitingTime !== null) {
        clearTimeout(waitingTime)
    }

    let stopOldSong = setTimeout(() => {
        for (let i = 1; i < playingAudio.length; i++) {
            let stopAudio = playingAudio.shift();  // Remove the first item from the array
            stopAudio.stop();
        }
    }, (fadeOutTime + fadeInTime) * 1000);

    waitingTime = setTimeout(() => {
        console.log('Fade out complete')
        setPlayingClass(element);
    }, (fadeOutTime + fadeInTime) * 1000);

}

function soundEffect(newBuffer, element) {
    const newGainNode = context.createGain();
    newGainNode.gain.value = 1;

    // Create a new audio source for the new song
    const effectSource = context.createBufferSource();
    effectSource.buffer = newBuffer;
    effectSource.loop = false;

    // Connect the new source to the new gain node
    effectSource.connect(newGainNode);

    // Connect the new gain node to the destination
    newGainNode.connect(context.destination);

    // Start the new source immediately with the new gain node
    effectSource.start(0);

    soundEffects.push(effectSource)

    element.classList.add('sound-effect')

    console.log(effectSource.buffer.duration)

    displaySoundEffect(element, effectSource.buffer.duration)
}

function displaySoundEffect(element, duration) {
    let soundEffectTime;

    clearTimeout(soundEffectTime);

    soundEffectTime = setTimeout(() => {
        element.classList.remove('sound-effect')
    }, duration * 1000);
}
