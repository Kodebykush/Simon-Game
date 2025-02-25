const colors = ["red", "blue", "green", "yellow"];
let sequence = [];
let userSequence = [];
let level = 0;
let clickable = false;

// Initialize Web Audio API for sound generation
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Musical frequencies for each color button (in Hz)
const frequencies = {
    red: 329.63,    // E4
    blue: 261.63,   // C4
    green: 392.00,  // G4
    yellow: 440.00  // A4
};

// Configuration for different difficulty levels
const difficultySettings = {
    easy: {
        sequenceDelay: 800,
        flashDuration: 500,
        maxLevel: 20
    },
    medium: {
        sequenceDelay: 600,
        flashDuration: 300,
        maxLevel: 30
    },
    hard: {
        sequenceDelay: 400,
        flashDuration: 200,
        maxLevel: 50
    }
};

// Current difficulty level, defaults to 'easy'
let currentDifficulty = 'easy';

function playSound(color) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequencies[color], audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

// DOM element references
const buttons = document.querySelectorAll(".button");
const startButton = document.getElementById("start-btn");
const statusText = document.getElementById("status");
const difficultySelect = document.getElementById("difficulty-select");

// Visual and audio feedback when a button is pressed or sequence is playing
function flash(button) {
    const color = button.dataset.color;
    button.classList.add("flash");
    playSound(color);
    setTimeout(() => button.classList.remove("flash"), difficultySettings[currentDifficulty].flashDuration);
}

// High score management functions
// Saves the current score if it's in the top 5 for the current difficulty
function saveHighScore() {
    const scores = JSON.parse(localStorage.getItem(`${currentDifficulty}Scores`) || '[]');
    // Only save if it's a new high score or there are less than 5 scores
    if (scores.length < 5 || level > scores[scores.length - 1]) {
        scores.push(level);
        scores.sort((a, b) => b - a);
        scores.splice(5); // Keep only top 5 scores
        localStorage.setItem(`${currentDifficulty}Scores`, JSON.stringify(scores));
        updateHighScores();
    }
}

// Updates the display of high scores for all difficulty levels
function updateHighScores() {
    ['easy', 'medium', 'hard'].forEach(difficulty => {
        const scores = JSON.parse(localStorage.getItem(`${difficulty}Scores`) || '[]');
        const scoreList = document.getElementById(`${difficulty}-scores`);
        scoreList.innerHTML = scores
            .map(score => `<li>Level ${score}</li>`)
            .join('');
    });
}

// Generates and plays the next sequence
// Increments level, adds a random color, and plays the sequence
function nextSequence() {
    userSequence = [];
    level++;
    statusText.textContent = `Level ${level}`;

    // Check if player has reached max level for current difficulty
    if (level > difficultySettings[currentDifficulty].maxLevel) {
        statusText.textContent = `Congratulations! You've mastered ${currentDifficulty} mode!`;
        sequence = [];
        level = 0;
        clickable = false;
        return;
    }

    let randomColor = colors[Math.floor(Math.random() * 4)];
    sequence.push(randomColor);

    sequence.forEach((color, index) => {
        setTimeout(() => {
            const button = document.querySelector(`.${color}`);
            flash(button);
        }, (index + 1) * difficultySettings[currentDifficulty].sequenceDelay);
    });

    setTimeout(() => { clickable = true; }, sequence.length * difficultySettings[currentDifficulty].sequenceDelay);
}

// Event handler for button clicks during gameplay
// Handles user input validation and game progression
buttons.forEach(button => {
    button.addEventListener("click", (event) => {
        if (!clickable) return;

        let color = event.target.dataset.color;
        userSequence.push(color);
        flash(event.target);

        if (userSequence[userSequence.length - 1] !== sequence[userSequence.length - 1]) {
            statusText.textContent = "Game Over! Click Start to Try Again.";
            saveHighScore();
            sequence = [];
            level = 0;
            clickable = false;
            return;
        }

        if (userSequence.length === sequence.length) {
            clickable = false;
            setTimeout(nextSequence, difficultySettings[currentDifficulty].sequenceDelay);
        }
    });
});

// Event handler for the start button
// Initializes/resumes audio context and starts a new game
startButton.addEventListener("click", () => {
    // Initialize audio context on first user interaction
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    sequence = [];
    level = 0;
    clickable = false;
    statusText.textContent = "Starting...";
    setTimeout(nextSequence, 1000);
});

// Event handler for difficulty selection
// Resets the game state when difficulty is changed
difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    sequence = [];
    level = 0;
    clickable = false;
    statusText.textContent = `Difficulty set to ${currentDifficulty}. Click Start to play!`;
});

// Theme switching functionality
const themeSelect = document.getElementById('theme-select');

// Set initial theme
document.documentElement.setAttribute('data-theme', 'light');

// Initialize high scores display
updateHighScores();

// Theme change handler
themeSelect.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
});

// Instructions modal functionality
// Handles showing/hiding the game instructions
const infoIcon = document.getElementById('info-icon');
const instructionsModal = document.getElementById('instructions-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeModal = document.getElementById('close-modal');

infoIcon.addEventListener('click', () => {
    instructionsModal.classList.add('show');
    modalOverlay.classList.add('show');
});

closeModal.addEventListener('click', () => {
    instructionsModal.classList.remove('show');
    modalOverlay.classList.remove('show');
});

modalOverlay.addEventListener('click', () => {
    instructionsModal.classList.remove('show');
    modalOverlay.classList.remove('show');
});
