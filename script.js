const timeLimit = 20;

// Intervals for spawning moles
const easyDifficultyInterval = 1200;
const mediumDifficultyInterval = 900;
const hardDifficulyInterval = 500;

// Map 
const mapPopupMessage = "This guy here... That's you!";
const mapGeoErrorMessage = "Could not get your location. Please enable location services and refresh the page.";
const mapGeoNotSupportedMessage = "Geolocation is not supported by your browser";


// Player messages
/** 
 * Default player messages when the game is running.
 * @constant {array} */
const playerMessages = [
    "Don't be easy on them moles, ",
    "You're doing great, ",
    "Keep it up, ",
    "You're on fire, ",
    "You're unstoppable, ",
    "You're a mole whacking machine, "
];

/** 
 * Player messagess when the game is over, and the time left is less than 0.
 * @constant {array} */
const playerMessagesGameOver = [
    "Could have done better, ",
    "Better luck next time, ",
    "You can do better, ",
    "Try again, ",
    "Well, that was fun, ",
]

/** 
 * Player messages when the time left is less than 25% of the game time limit and the game is still running.
 * @constant {array} */
const playerMessagesBelowThreshold = [
    "Whack even more, ",
    "You can do better, ",
    "Try harder, ",
    "You're almost there, ",
    "You're so close, ",
]

const defaultMusicVolume = 0.3;


// Messages
const restartConfirmMessage = "Are you sure you want to restart the game?";

// Bod - OOP
class Game {
    constructor() {
        this.score = 0;
        this.timeLeft = timeLimit;
        this.timer = null;
        this.gameInterval = null;
        this.gamePaused = false;
        this.gameStarted = false;
        
        // Name section
        this.nameForm = document.getElementById("nameForm");
        this.nameSection = document.getElementById("nameSection");
        this.submitButton = document.getElementById("submitBtn");
        this.welcomeName = document.getElementById("welcomeName");
        this.playerNameInput = document.getElementById("playerName");
        this.difficultyLevel = document.getElementById("difficultySelect");
        this.mapElement = document.getElementById("map");

        // Game section
        this.gameSection = document.getElementById("gameSection");
        this.scoreDisplay = document.querySelector(".score");
        this.timeLeftDisplay = document.getElementById("timeLeft");
        this.timerElement = document.getElementById("timer");
        this.timerLeftUnitElement = document.getElementById("timerLeftUnit");
        this.holes = document.querySelectorAll(".hole");
        this.moles = document.querySelectorAll(".mole");
        this.whackSound = document.getElementById("whackSound");
        this.timerTickSound = document.getElementById("timerTickSound");    
        this.messageToPlayer = document.getElementById("messageToPlayer");
        this.playerNameDisplay = document.getElementById("playerNameDisplay");

        // Music controls
        this.bgMusic = document.getElementById("bgMusic1");
        this.volumeControl = document.getElementById("volumeControl");
        this.pauseMusicButton = document.getElementById("pauseMusicButton");
        this.muteVolumeIcon = document.getElementById("muteVolumeIcon");
        this.midVolumeIcon = document.getElementById("midVolumeIcon");
        this.maxVolumeIcon = document.getElementById("maxVolumeIcon");

        // Game controls
        this.pauseResumeButton = document.getElementById("pauseResumeButton");
        this.restartButton = document.getElementById("restartButton");
        this.playIcon = document.getElementById("playIcon");
        this.pauseIcon = document.getElementById("pauseIcon");

    }

    /** 
    * Initialize the event listeners, set the player name, and initialize the map.
    */
    initialize() {
        this.submitButton.addEventListener("click", (e) => this.startGame(e));
        this.volumeControl.addEventListener("input", (e) => this.adjustVolume(e));
        this.pauseMusicButton.addEventListener("click", () => this.toggleMusic());
        this.pauseResumeButton.addEventListener("click", () => this.toggleGamePause());
        this.restartButton.addEventListener("click", () => this.restartGame());
        this.moles.forEach(mole => mole.addEventListener("click", () => this.whackMole(mole)));

        // Volume icons
        this.setVolumeIcon();

        this.initializeMap();
        // Name and message
        this.playerNameDisplay.textContent = this.playerNameInput.value;
        this.messageToPlayer.textContent = "Whack as many moles as you can!";
    }

    // Bod - Pokrocile JS API
    /** 
    * Initialize the map and as a leaflet set the view to the user's location.  
    */
    initializeMap() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {

                // destruktualizacia
                const { latitude, longitude } = position.coords;
                const map = L.map('map').setView([latitude, longitude], 13);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                L.marker([latitude, longitude]).addTo(map)
                    .bindPopup(mapPopupMessage)
                    .openPopup();
            }, () => {
                alert(mapGeoErrorMessage);
            });
        } else {
            alert(mapGeoNotSupportedMessage);
        }
    }

    /** 
    * Start the game by hiding the name section and showing the game section. Set the player name and call the startGameLogic function. 
    * @param {Event} e - The event object.
    */
    startGame(e) {
        e.preventDefault();
        const playerName = this.playerNameInput.value.trim();
        if (playerName) {
            this.playerNameDisplay.textContent = playerName;
            this.nameSection.style.display = "none";
            this.gameSection.style.display = "block";
            this.setGameLogic();
        }
        else {
            alert("Enter a valid player name!");
        }
    }

    /** 
    * Set the music volume and update the volume control and the volume icon. 
    * @param {Number} value - The volume value to be set.  
    */
    setMusicVolume(value) {
        if (value >= 0 && value <= 1) {
            this.bgMusic.volume = value;
            this.volumeControl.value = value;
            this.setVolumeIcon();
        }
    }

    /** 
    * Start the game logic by setting the score, timer, difficulty, and the game settings. 
    */
    setGameLogic() {
        this.score = 0;
        this.timeLeft = timeLimit;
        this.scoreDisplay.textContent = this.score;
        this.timerElement.display = "block";
        this.timer = setInterval(() => this.updateTimer(), 1000);
        this.timeLeftDisplay.textContent = this.timeLeft;

        this.gameStarted = true;
        this.gamePaused = false;

        this.setMusicVolume(defaultMusicVolume);
        this.bgMusic.play();

        this.playIcon.style.display = "none";
        this.pauseIcon.style.display = "inline";

        // If the user player did not choose any difficulty, set the default difficulty to easy
        // Should be set by default in the HTML 
        // better be sure than sorry
        switch (this.difficultyLevel.value) {
            case "easy":
                this.setGameInterval(easyDifficultyInterval);
                break;
            case "medium":
                this.setGameInterval(mediumDifficultyInterval);
                break;
            case "hard":
                this.setGameInterval(hardDifficulyInterval);
                break;
            default:
                this.setGameInterval(easyDifficultyInterval);
                break;
        }
    }

    /** 
    * Set the game interval for spawning moles.
    * @param {Number} interval - The interval value for spawning moles. 
    */
    setGameInterval(interval) {
        this.gameInterval = setInterval(() => this.showMole(), interval);
    }

    /** 
    * Update the timer by decrementing the time left and updating the time left element. If the time left is less than 0, call the endGame function. If the time left is less than 25% of the game time limit, decrease the music volume, whack sound volume, play the timer tick sound, and change the text color to red. 
    */
    updateTimer() {
        if (!this.gamePaused) {
            this.timeLeft--;
            this.timeLeftDisplay.textContent = this.timeLeft;
            if (this.timeLeft < 0) {
                this.endGame();
            }
            if (this.timeLeft <= timeLimit * 0.25 && this.timeLeft > 0) {
                // Decrease music volume
                this.setMusicVolume(0.05);

                // Decrease whack sound volume
                this.whackSound.volume = 0.3;

                // Play timer tick sound
                if (this.timerTickSound.paused) {
                    this.timerTickSound.currentTime = 0;

                }
                this.timerTickSound.volume = 0.6;
                this.timerTickSound.play();
                
                // Red text effect
                this.timeLeftDisplay.style.color = "red";
            }
        }
    }

    /** 
    * Show a random player message based on the time left. If the time left is less than 25% of the game time limit, show a different set of messages defined in the playerMessagesBelowThreshold array. If the time left is less than 0, show a different set of messages defined in the playerMessagesGameOver array. Otherwise, show the default player messages defined in the playerMessages array. 
    */
    showPlayerMessage() {
        const timeLimitThreshold = timeLimit * 0.25;

        if (this.timeLeft <= 0) {
            const randomMessageIndex = Math.floor(Math.random() * playerMessagesGameOver.length);
            this.messageToPlayer.textContent = playerMessagesGameOver[randomMessageIndex];
        }
        else if (this.timeLeft < timeLimitThreshold) { 
            const randomMessageIndex = Math.floor(Math.random() * playerMessagesBelowThreshold.length);
            this.messageToPlayer.textContent = playerMessagesBelowThreshold[randomMessageIndex];
        }
        else {
            const randomMessageIndex = Math.floor(Math.random() * playerMessages.length);
            this.messageToPlayer.textContent = playerMessages[randomMessageIndex];
        }
    }

    /** 
    * Get a random hole from the holes array. 
    */
    getRandomHole() {
        return this.holes[Math.floor(Math.random() * this.holes.length)];
    }

    /** 
    * Show the mole by adding the up class to the random hole. If the hole already has the up class, remove the up class and the despawn class from the mole. 
    */
    showMole() {
        if (!this.gamePaused) {
            this.holes.forEach(hole => {
                const mole = hole.querySelector('.mole');
                if (hole.classList.contains('up')) {
                    mole.classList.add('despawn');
                    setTimeout(() => {
                        hole.classList.remove('up');
                        mole.classList.remove('despawn');
                    }, 300); // Duration of the despawn animation
                }
            });

            const randomHole = this.getRandomHole(); 
            randomHole.classList.add("up");
        }
    }

    /** 
    * Desinged for a random mole spawning. Currently not used in the game. Could be used for the default difficulty level.
    */
    showMoleRandom() {
        if (!this.gamePaused) {
            const interval = Math.random() * 1000 + 300;
            this.gameInterval = setTimeout(() => {
                this.showMole();
                this.showMoleRandom();
            }, interval);
        }
    }

    /** 
    * Whack the mole and increment the score, update the scoreboard, and remove the up class from the mole's parent element. Show the player message by calling the showPlayerMessage function. 
    * @param {mole} mole - The mole element to be whacked. 
    */
    whackMole(mole) {
        if (!this.gamePaused) {
            this.score++;
            this.scoreDisplay.textContent = this.score;
            mole.parentElement.classList.remove("up");
            
            // todo: add sound effect
            this.whackSound.play();

            // Show player messages
            this.showPlayerMessage();

        }
    }

    // Bod - ovladanie medii
    /** 
    * Adjust the volume of the background music by user. 
    * @param {Event} e - 
    */
    adjustVolume(e) {
        this.setMusicVolume(e.target.value);
    }

    // bod - JS praca s SVG
    /** 
    * Set the volume icon based on the volume level. If the volume is 0, show the mute volume icon. If the volume is less than or equal to 0.5, show the mid volume icon. Otherwise, show the max volume icon. 
    */
    setVolumeIcon() {
        if (this.bgMusic.volume == 0) {
            this.muteVolumeIcon.style.display = "inline";
            this.midVolumeIcon.style.display = "none";
            this.maxVolumeIcon.style.display = "none";
        }
        else if (this.bgMusic.volume <= 0.5) {
            this.muteVolumeIcon.style.display = "none";
            this.midVolumeIcon.style.display = "inline";
            this.maxVolumeIcon.style.display = "none";
        }
        else { 
            this.muteVolumeIcon.style.display = "none";
            this.midVolumeIcon.style.display = "none";
            this.maxVolumeIcon.style.display = "inline";
        }
    }
    
    /** 
    * Toggle the background music if the user clicked the pause music button. If the background music is paused, play the music, set the volume icon, and change the pause music button text to "Pause Music". Otherwise, pause the music, set the volume icon, and change the pause music button text to "Play Music". 
    */
    toggleMusic() {
        if (this.bgMusic.paused) {
            this.bgMusic.play();
            this.setVolumeIcon();
            this.pauseMusicButton.textContent = "Pause Music";
        } else {
            this.bgMusic.pause();
            this.setVolumeIcon();
            this.pauseMusicButton.textContent = "Play Music";
        }
    }

    /** 
    * Toggle the game pause if the user clicked the pause resume button. If the game is paused, play the background music, show the pause icon, and hide the play icon. Otherwise, pause the background music, pause the timer tick sound, show the play icon, and hide the pause icon. 
    */
    toggleGamePause() {
        if (this.gamePaused) {
            this.gamePaused = false;
            this.pauseIcon.style.display = "inline";
            this.playIcon.style.display = "none";
            this.bgMusic.play();
        } else {
            this.gamePaused = true;
            this.pauseIcon.style.display = "none";
            this.playIcon.style.display = "inline";
            this.bgMusic.pause();
            this.timerTickSound.pause();
        }
    }

    /** 
    * Restart the game by clearing the timer and game interval. Set the default game settings and logic. 
    */
    restartGame() {
        // confirmation
        if (!confirm(restartConfirmMessage)) {
            return;
        }
        // clearInterval(this.timer);
        // clearInterval(this.gameInterval);
        this.endGame(true);
        this.setGameLogic();
    }

    /** 
    * End the game by clearing the timer and game interval and despawning all moles. Show the player message and the score. Turn off the music and sound effects.  
    * @param {boolean} [restart=false] - The restart flag to determine if the game is restarted.
    */
    endGame(restart = false) {
        clearInterval(this.timer);
        clearInterval(this.gameInterval);

        // Show message
        this.showPlayerMessage();


        // Turn off music and sound effects
        this.bgMusic.pause();
        this.timerTickSound.pause();
        
        if (!restart) {
            alert(`Game Over! Your score is ${this.score}`);
        }

        this.gameStarted = false;
        this.timeLeftDisplay.textContent = 0;
        this.timerElement.display = "none";
        // this.timerElement.textContent = "Game Over!";

        
        // remove text effects
        this.timeLeftDisplay.style.color = "black";

        // Cannot whack moles after game over
        // Remove all spawned moles
        this.holes.forEach(hole => {
            const mole = hole.querySelector('.mole');
            if (hole.classList.contains('up')) {
                hole.classList.remove('up');
                mole.classList.remove('despawn');
            }
        });
    }
}

const game = new Game();
game.initialize();