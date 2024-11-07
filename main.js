// main.js

// Utility Functions
function shuffleArray(array) {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Move Class
class Move {
  constructor(
    name,
    damage,
    staminaCost,
    moveType,
    validPositions,
    newPosition = null,
    isDefense = false,
    description = ''
  ) {
    this.name = name;
    this.damage = damage;
    this.staminaCost = staminaCost;
    this.type = moveType;
    this.validPositions = validPositions;
    this.newPosition = newPosition;
    this.isDefense = isDefense;
    this.description = description;
  }

  toString() {
    return `${this.name}`;
  }
}

// Define all possible moves
const ALL_MOVES = [
  // Moves valid in Open and Clinch positions
  new Move(
    'Punch',
    10,
    4,
    'strike',
    ['Open', 'Clinch'],
    null,
    false,
    'A quick punch to the opponent.'
  ),
  new Move(
    'Kick',
    15,
    6,
    'strike',
    ['Open', 'Clinch'],
    null,
    false,
    'A powerful kick aimed at the opponent.'
  ),
  new Move(
    'Elbow',
    8,
    7,
    'strike',
    ['Clinch'],
    null,
    false,
    'An elbow strike in close quarters.'
  ),
  new Move(
    'Knee',
    10,
    8,
    'strike',
    ['Clinch'],
    null,
    false,
    'A knee strike targeting the body.'
  ),
  // Takedowns valid in Open and Clinch positions
  new Move(
    'Takedown',
    0,
    8,
    'takedown',
    ['Open', 'Clinch'],
    'Ground',
    false,
    'Attempt a takedown to bring the fight to the ground.'
  ),
  // Position changes
  new Move(
    'Initiate Clinch',
    0,
    4,
    'position',
    ['Open'],
    'Clinch',
    false,
    'Close the distance to clinch.'
  ),
  new Move(
    'Break Clinch',
    0,
    4,
    'position',
    ['Clinch'],
    'Open',
    false,
    'Break the clinch and create distance.'
  ),
  // Ground Position Moves valid only in Ground position
  new Move(
    'Elbow Smash',
    10,
    5,
    'strike',
    ['Ground'],
    null,
    false,
    'A powerful elbow strike on the ground.'
  ),
  new Move(
    'Ground Punch',
    8,
    4,
    'strike',
    ['Ground'],
    null,
    false,
    'Punch the opponent on the ground.'
  ),
  new Move(
    'Chokehold',
    0,
    8,
    'submission',
    ['Ground'],
    null,
    false,
    'Attempt a choke submission.'
  ),
  new Move(
    'Armbar',
    0,
    8,
    'submission',
    ['Ground'],
    null,
    false,
    'Attempt an armbar submission.'
  ),
  new Move(
    'Leglock',
    0,
    8,
    'submission',
    ['Ground'],
    null,
    false,
    'Attempt a leglock submission.'
  ),
  new Move(
    'Stand Up',
    0,
    4,
    'position',
    ['Ground'],
    'Open',
    false,
    'Stand up from the ground.'
  ),
  // Defense Cards
  new Move(
    'Submission Escape',
    0,
    4,
    'defense',
    ['Open', 'Clinch', 'Ground'],
    null,
    true,
    'Escape an attempted submission.'
  ),
  new Move(
    'Position Reversal',
    0,
    6,
    'defense',
    ['Open', 'Clinch', 'Ground'],
    'Clinch',
    true,
    'Reverse the position to clinch.'
  ),
  new Move(
    'Guard',
    0,
    3,
    'defense',
    ['Open', 'Clinch', 'Ground'],
    null,
    true,
    'Defend against strikes.'
  ),
  // New Defensive Card
  new Move(
    'Full Mount',
    0,
    7,
    'defense',
    ['Ground'],
    'Ground',
    true,
    'Gain an advantageous position.'
  ),
];

const MAX_HAND_SIZE = 5;

class Fighter {
  constructor(
    name,
    deck,
    playstyle,
    colorClass,
    isHuman = false,
    difficulty = 'Medium'
  ) {
    this.name = name;
    this.health = 100; // Max health
    this.stamina = 100; // Max stamina
    this.position = 'Open';
    this.isSubmitted = false;
    this.hand = []; // Cards in hand
    this.deck = [...deck]; // Copy of the deck
    this.discardPile = []; // Discarded cards
    this.playstyle = playstyle;
    this.isHuman = isHuman;
    this.difficulty = difficulty; // For AI fighters
    this.colorClass = colorClass; // 'player-red' or 'player-blue'
    this.submissionPending = false; // New property to handle submissions

    // Draw initial hand
    this.drawHand();
  }

  drawHand() {
    while (this.hand.length < MAX_HAND_SIZE && this.deck.length > 0) {
      this.drawCard();
    }
  }

  drawCard() {
    if (this.deck.length === 0) {
      // Reshuffle discard pile into deck
      this.deck = [...this.discardPile];
      this.discardPile = [];
      shuffleArray(this.deck);
    }
    if (this.deck.length > 0) {
      const card = this.deck.pop();
      this.hand.push(card);
    }
  }

  playMove(moveIndex, opponent) {
    if (moveIndex < 0 || moveIndex >= this.hand.length) {
      console.log(`Invalid move selection.`);
      return false;
    }
    const move = this.hand[moveIndex];

    // Check if move is valid
    if (!move.validPositions.includes(this.position)) {
      console.log(
        `${this.name} cannot perform ${move.name} from ${this.position} position.`
      );
      return false;
    }

    // Adjust stamina cost for playstyles
    let staminaCost = move.staminaCost;
    if (this.playstyle === 'Takedown Artist' && move.type === 'takedown') {
      staminaCost = Math.max(staminaCost - 2, 1);
    }
    if (this.playstyle === 'Knockout Artist' && move.type === 'strike') {
      staminaCost = Math.max(staminaCost - 1, 1); // Slight stamina reduction for strikes
    }
    if (this.stamina < staminaCost) {
      console.log(
        `${this.name} does not have enough stamina to perform ${move.name}.`
      );
      return false;
    }

    // Specific logic for submissions
    if (move.type === 'submission') {
      if (this.stamina < 20 && this.playstyle !== 'Submission Artist') {
        console.log(
          `${this.name} does not have enough stamina to attempt a submission.`
        );
        return false;
      }
      opponent.submissionPending = true; // Set submission pending on opponent
    }

    // Deduct stamina
    this.stamina -= staminaCost;
    this.stamina = Math.max(0, Math.min(this.stamina, 100));

    // Apply move effects
    let moveDescription = '';
    if (move.type === 'strike') {
      let damage = move.damage;
      if (this.playstyle === 'Knockout Artist') {
        damage += 2; // Knockout Artist deals extra damage with strikes
      }
      opponent.receiveDamage(damage);
      moveDescription = `${this.name} uses ${move.name} on ${opponent.name} (-${damage})`;
    } else if (move.type === 'takedown') {
      const success = this.attemptTakedown(opponent);
      if (success) {
        const newPosition = move.newPosition;
        this.position = newPosition;
        opponent.position = newPosition;
        moveDescription = `${this.name} successfully executes ${move.name}`;
      } else {
        moveDescription = `${this.name}'s ${move.name} attempt failed`;
      }
    } else if (move.type === 'submission') {
      moveDescription = `${this.name} attempts ${move.name} on ${opponent.name}`;
      // Do not switch turns here; opponent responds
    } else if (move.type === 'position') {
      const newPosition = move.newPosition;
      this.position = newPosition;
      opponent.position = newPosition;
      moveDescription = `${this.name} changes position to ${newPosition}`;
    } else if (move.type === 'defense' && move.isDefense) {
      if (this.submissionPending && move.name === 'Submission Escape') {
        this.submissionPending = false;
        moveDescription = `${this.name} escapes the submission attempt!`;
      } else if (move.name === 'Position Reversal') {
        const newPosition = move.newPosition;
        this.position = newPosition;
        opponent.position = newPosition;
        moveDescription = `${this.name} performs ${move.name}, moving to ${newPosition}`;
      } else if (move.name === 'Guard') {
        moveDescription = `${this.name} uses Guard to defend`;
      } else if (move.name === 'Full Mount') {
        this.position = 'Ground';
        opponent.position = 'Ground';
        moveDescription = `${this.name} gains Full Mount position`;
      } else {
        console.log(`${this.name} cannot use ${move.name} right now.`);
        return false;
      }
    }
    // Discard the used card
    this.discardPile.push(this.hand.splice(moveIndex, 1)[0]);
    // Draw a new card
    this.drawCard();
    return moveDescription;
  }

  receiveDamage(damage) {
    this.health -= damage;
    this.health = Math.max(0, this.health);
    // Check for knockout immediately
    if (this.isKnockedOut()) {
      checkGameStatus();
    }
  }

  attemptSubmission(opponent) {
    const chance = Math.floor(Math.random() * 100) + 1;
    let baseThreshold =
      40 +
      Math.floor((30 - opponent.stamina) / 2) +
      Math.floor((100 - opponent.health) / 5);

    if (this.playstyle === 'Submission Artist') {
      baseThreshold += 20;
    }
    if (opponent.playstyle === 'Submission Artist') {
      baseThreshold -= 20;
    }
    baseThreshold = Math.max(5, Math.min(baseThreshold, 95));
    if (this.hasOwnProperty('submissionAttempts')) {
      this.submissionAttempts += 1;
      baseThreshold += this.submissionAttempts * 5;
    } else {
      this.submissionAttempts = 1;
    }
    return chance <= baseThreshold;
  }

  attemptTakedown(opponent) {
    const chance = Math.floor(Math.random() * 100) + 1;
    let baseThreshold =
      60 +
      Math.floor((this.stamina - opponent.stamina) / 2) +
      Math.floor((100 - opponent.health) / 10);
    if (this.playstyle === 'Takedown Artist') {
      baseThreshold += 20;
    }
    baseThreshold = Math.max(5, Math.min(baseThreshold, 95));
    return chance <= baseThreshold;
  }

  isKnockedOut() {
    return this.health <= 0;
  }

  isExhausted() {
    return this.stamina <= 0;
  }
}

// Game Variables
let player;
let opponent;
let currentPlayer;
let currentOpponent;
let gameMode;
let gameDifficulty;
let playstyles = ['Knockout Artist', 'Submission Artist', 'Takedown Artist'];
let moveHistory = [];
let playerNames = {};
let keepSettings = false;
let gameOver = false; // Added gameOver flag

// Initialize Game
function initGame() {
  // Set up the game area
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = '';
  gameOver = false; // Reset gameOver flag

  if (!keepSettings) {
    // Game mode selection
    gameArea.innerHTML = `
      <button id="single-player">SINGLE</button>
      <button id="two-player">P V P</button>
    `;

    document.getElementById('single-player').addEventListener('click', () => {
      gameMode = 'single';
      enterPlayerNames();
    });

    document.getElementById('two-player').addEventListener('click', () => {
      gameMode = 'two-player';
      enterPlayerNames();
    });
  } else {
    startGame();
  }
}

// Add event listener to the title to return to main menu
document.getElementById('title-link').addEventListener('click', (e) => {
  e.preventDefault();
  keepSettings = false;
  initGame();
});

function enterPlayerNames() {
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = `
    <input type="text" id="player1-name" placeholder="Enter Player 1's Name" required />
    ${
      gameMode === 'two-player'
        ? `<input type="text" id="player2-name" placeholder="Enter Player 2's Name" required />`
        : ''
    }
    <button id="submit-names">Continue</button>
  `;

  document.getElementById('player1-name').focus();

  document.getElementById('submit-names').addEventListener('click', () => {
    const player1Name =
      document.getElementById('player1-name').value || 'Player 1';
    const player2Name =
      gameMode === 'two-player'
        ? document.getElementById('player2-name').value || 'Player 2'
        : 'Opponent';
    playerNames = { player1: player1Name, player2: player2Name };
    selectPlaystyle();
  });
}

function selectPlaystyle() {
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = `
    <h2>${playerNames.player1}, choose your playstyle:</h2>
    <button class="playstyle-btn" data-playstyle="Knockout Artist">KNOCKOUT ARTIST</button>
    <button class="playstyle-btn" data-playstyle="Takedown Artist">TAKEDOWN ARTIST</button>
    <button class="playstyle-btn" data-playstyle="Submission Artist">SUBMISSION ARTIST</button>
  `;

  document.querySelectorAll('.playstyle-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const player1Playstyle = button.getAttribute('data-playstyle');
      if (gameMode === 'single') {
        selectDifficulty(player1Playstyle);
      } else {
        selectPlaystylePlayer2(player1Playstyle);
      }
    });
  });
}

function selectPlaystylePlayer2(player1Playstyle) {
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = `
    <h2>${playerNames.player2}, choose your playstyle:</h2>
    <button class="playstyle-btn" data-playstyle="Knockout Artist">KNOCKOUT ARTIST</button>
    <button class="playstyle-btn" data-playstyle="Takedown Artist">TAKEDOWN ARTIST</button>
    <button class="playstyle-btn" data-playstyle="Submission Artist">SUBMISSION ARTIST</button>
  `;

  document.querySelectorAll('.playstyle-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const player2Playstyle = button.getAttribute('data-playstyle');
      startGame(player1Playstyle, player2Playstyle);
    });
  });
}

function selectDifficulty(player1Playstyle) {
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = `
    <button class="difficulty-btn" data-difficulty="Easy">EASY</button>
    <button class="difficulty-btn" data-difficulty="Medium">MEDIUM</button>
    <button class="difficulty-btn" data-difficulty="Hard">HARD</button>
  `;

  document.querySelectorAll('.difficulty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      gameDifficulty = button.getAttribute('data-difficulty');
      startGame(player1Playstyle);
    });
  });
}

function startGame(player1Playstyle = null, player2Playstyle = null) {
  const playerDeck = [...ALL_MOVES];
  const opponentDeck = [...ALL_MOVES];
  shuffleArray(playerDeck);
  shuffleArray(opponentDeck);
  gameOver = false; // Reset gameOver flag

  if (gameMode === 'single') {
    // Single Player Mode
    const opponentPlaystyle =
      playstyles[Math.floor(Math.random() * playstyles.length)];
    player = new Fighter(
      playerNames.player1,
      playerDeck,
      player1Playstyle,
      'player-red',
      true
    );
    opponent = new Fighter(
      'Opponent',
      opponentDeck,
      opponentPlaystyle,
      'player-blue',
      false,
      gameDifficulty
    );
  } else {
    // Two Player Mode
    player = new Fighter(
      playerNames.player1,
      playerDeck,
      player1Playstyle,
      'player-red',
      true
    );
    opponent = new Fighter(
      playerNames.player2,
      opponentDeck,
      player2Playstyle,
      'player-blue',
      true
    );
  }

  currentPlayer = player;
  currentOpponent = opponent;
  moveHistory = [];
  setupGameInterface();
}

function setupGameInterface() {
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = `
    <div id="game-content">
      <div id="latest-move">
        <h2>Latest Move</h2>
        <div class="move-entry">No moves yet.</div>
      </div>
      <div id="main-game">
        <div class="status-bar">
          <div id="player-status" class="status"></div>
          <div id="opponent-status" class="status"></div>
        </div>
        <div id="position-display"></div>
        <div id="hand-container"></div>
        <div id="control-buttons"></div>
        <div id="message-box"></div>
      </div>
      <div id="highlights-container">
        <h2>Highlights</h2>
        <div id="move-history"></div>
      </div>
    </div>
  `;

  updateStatus();
  updatePosition();
  updateHand();
  showMessage(`${currentPlayer.name}'s turn.`);

  if (!currentPlayer.isHuman) {
    // AI's turn
    setTimeout(() => {
      aiTurn();
    }, 1000);
  } else {
    // Player's turn
    addControlButtons();
  }
}

function updateLatestMove(description) {
  const latestMoveContainer = document.getElementById('latest-move');
  latestMoveContainer.innerHTML = `
    <h2>Latest Move</h2>
    <div class="move-entry">${description}</div>
  `;
}

function updateStatus() {
  const playerStatus = document.getElementById('player-status');
  const opponentStatus = document.getElementById('opponent-status');

  playerStatus.innerHTML = `
    <h3 class="${player.colorClass}">${player.name}</h3>
    <div>Health: ${player.health}</div>
    <div class="progress">
      <div class="progress-bar red" style="width: ${player.health}%;"></div>
    </div>
    <div>Stamina: ${player.stamina}</div>
    <div class="progress">
      <div class="progress-bar red" style="width: ${player.stamina}%;"></div>
    </div>
  `;

  opponentStatus.innerHTML = `
    <h3 class="${opponent.colorClass}">${opponent.name}</h3>
    <div>Health: ${opponent.health}</div>
    <div class="progress">
      <div class="progress-bar blue" style="width: ${opponent.health}%;"></div>
    </div>
    <div>Stamina: ${opponent.stamina}</div>
    <div class="progress">
      <div class="progress-bar blue" style="width: ${opponent.stamina}%;"></div>
    </div>
  `;
}

function updatePosition() {
  const positionDisplay = document.getElementById('position-display');
  positionDisplay.innerHTML = `<h2>Position: ${currentPlayer.position}</h2>`;
}

function updateHand() {
  const handContainer = document.getElementById('hand-container');
  handContainer.innerHTML = '';

  if (gameMode === 'single') {
    // Always display player's hand
    player.hand.forEach((move, index) => {
      let isValid;
      if (currentPlayer.submissionPending) {
        isValid = move.name === 'Submission Escape';
      } else {
        isValid =
          move.validPositions.includes(currentPlayer.position) &&
          currentPlayer.stamina >= move.staminaCost &&
          (!move.isDefense || canPlayDefense(move));
      }

      const card = document.createElement('div');
      card.className = 'card';
      card.classList.add(isValid ? 'valid' : 'invalid');
      card.innerHTML = `
        <h3>${move.name}</h3>
        ${move.damage > 0 ? `<p>Damage: ${move.damage}</p>` : ''}
        <p>Stamina Cost: ${move.staminaCost}</p>
        <p>Position: ${move.validPositions.join(', ') || 'Any'}</p>
        <div class="tooltip">${move.description}</div>
      `;
      if (isValid && currentPlayer === player && !gameOver) {
        card.addEventListener('click', () => {
          if (gameOver) return;
          playMove(index);
        });
      }
      handContainer.appendChild(card);
    });
  } else if (gameMode === 'two-player') {
    if (currentPlayer.isHuman) {
      currentPlayer.hand.forEach((move, index) => {
        let isValid;
        if (currentPlayer.submissionPending) {
          isValid = move.name === 'Submission Escape';
        } else {
          isValid =
            move.validPositions.includes(currentPlayer.position) &&
            currentPlayer.stamina >= move.staminaCost &&
            (!move.isDefense || canPlayDefense(move));
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.classList.add(isValid ? 'valid' : 'invalid');
        card.innerHTML = `
          <h3>${move.name}</h3>
          ${move.damage > 0 ? `<p>Damage: ${move.damage}</p>` : ''}
          <p>Stamina Cost: ${move.staminaCost}</p>
          <p>Position: ${move.validPositions.join(', ') || 'Any'}</p>
          <div class="tooltip">${move.description}</div>
        `;
        if (isValid && !gameOver) {
          card.addEventListener('click', () => {
            if (gameOver) return;
            playMove(index);
          });
        }
        handContainer.appendChild(card);
      });
    } else {
      handContainer.innerHTML = `<p>${currentPlayer.name} is thinking...</p>`;
    }
  }
}

function canPlayDefense(move) {
  if (move.name === 'Submission Escape') {
    return currentPlayer.submissionPending;
  }
  return true;
}

function addControlButtons() {
  const controlButtons = document.getElementById('control-buttons');
  controlButtons.innerHTML = '';

  // Pass Button
  const passButton = document.createElement('button');
  passButton.textContent = 'Pass';
  passButton.addEventListener('click', () => {
    if (gameOver) return;
    if (currentPlayer.submissionPending) {
      // Accept submission
      processSubmissionResult(false);
    } else {
      currentPlayer.stamina += 20;
      currentPlayer.stamina = Math.min(100, currentPlayer.stamina);
      showMessage(`${currentPlayer.name} passes and recovers stamina.`);
      updateStatus();
      updateHand();
      logAction(`${currentPlayer.name} passes and recovers stamina.`);
      checkGameStatus();
      if (!gameOver) {
        switchTurns();
      }
    }
  });
  controlButtons.appendChild(passButton);

  // Replace Button
  if (!currentPlayer.submissionPending) {
    const replaceButton = document.createElement('button');
    replaceButton.textContent = 'Replace Up to 2 Cards (-5 Stamina per card)';
    replaceButton.addEventListener('click', () => {
      if (gameOver) return;
      replaceCards();
    });
    controlButtons.appendChild(replaceButton);
  }
}

function showMessage(message) {
  const messageBox = document.getElementById('message-box');
  messageBox.innerHTML = `<p>${message}</p>`;
}

function updateMoveHistory(description) {
  moveHistory.push(description);
  const moveHistoryContainer = document.getElementById('move-history');
  moveHistoryContainer.innerHTML = '';
  moveHistory.forEach((entry) => {
    const moveEntry = document.createElement('div');
    moveEntry.className = 'move-entry';
    moveEntry.innerHTML = entry;
    moveHistoryContainer.appendChild(moveEntry);
  });
  moveHistoryContainer.scrollTop = moveHistoryContainer.scrollHeight;
}

function formatMoveDescription(description, actor, target) {
  const actorClass = actor.colorClass;
  const targetClass = target.colorClass;

  // Replace actor and target names with colored spans
  let formattedDescription = description
    .replace(
      new RegExp(`\\b${actor.name}\\b`, 'g'),
      `<span class="${actorClass}">${actor.name}</span>`
    )
    .replace(
      new RegExp(`\\b${target.name}\\b`, 'g'),
      `<span class="${targetClass}">${target.name}</span>`
    )
    .replace(/(-\d+)/, `<span class="damage-text">$1</span>`);

  return formattedDescription;
}

function playMove(index) {
  if (gameOver) return;
  const moveDescription = currentPlayer.playMove(index, currentOpponent);
  if (moveDescription) {
    updateStatus();
    updatePosition();
    updateHand();
    const formattedDescription = formatMoveDescription(
      moveDescription,
      currentPlayer,
      currentOpponent
    );
    updateMoveHistory(formattedDescription);
    updateLatestMove(formattedDescription);
    logAction(formattedDescription);
    if (currentOpponent.submissionPending) {
      switchTurns(); // Allow opponent to respond
    } else {
      checkGameStatus();
      if (!gameOver && !currentPlayer.submissionPending) {
        switchTurns();
      }
    }
  } else {
    showMessage('Invalid move. Try again.');
  }
}

function handleSubmissionResponse() {
  if (currentPlayer.isHuman) {
    showMessage(
      `${currentPlayer.name}, you must play 'Submission Escape' or pass to accept the submission.`
    );
    updateHand();
    addControlButtons();
  } else {
    // AI's response to submission
    const submissionEscapeIndex = currentPlayer.hand.findIndex(
      (move) => move.name === 'Submission Escape'
    );
    if (submissionEscapeIndex !== -1) {
      // AI uses Submission Escape
      const moveDescription = currentPlayer.playMove(
        submissionEscapeIndex,
        currentOpponent
      );
      const formattedDescription = formatMoveDescription(
        moveDescription,
        currentPlayer,
        currentOpponent
      );
      updateMoveHistory(formattedDescription);
      updateLatestMove(formattedDescription);
      logAction(formattedDescription);
      showMessage(`${currentPlayer.name} escapes the submission!`);
      currentPlayer.submissionPending = false;
      checkGameStatus();
      if (!gameOver) {
        switchTurns();
      }
    } else {
      // AI accepts the submission attempt
      processSubmissionResult(false);
    }
  }
}

function processSubmissionResult(isEscaped) {
  if (!isEscaped) {
    const success = currentOpponent.attemptSubmission(currentPlayer);
    if (success) {
      currentPlayer.isSubmitted = true;
      const moveDescription = `${currentOpponent.name} successfully submits ${currentPlayer.name}!`;
      const formattedDescription = formatMoveDescription(
        moveDescription,
        currentOpponent,
        currentPlayer
      );
      updateMoveHistory(formattedDescription);
      updateLatestMove(formattedDescription);
      logAction(formattedDescription);
      currentPlayer.submissionPending = false;
      checkGameStatus();
    } else {
      const moveDescription = `${currentOpponent.name}'s submission attempt failed`;
      const formattedDescription = formatMoveDescription(
        moveDescription,
        currentOpponent,
        currentPlayer
      );
      updateMoveHistory(formattedDescription);
      updateLatestMove(formattedDescription);
      logAction(formattedDescription);
      showMessage(`Submission attempt failed.`);
      currentPlayer.submissionPending = false;
      checkGameStatus();
      if (!gameOver) {
        switchTurns();
      }
    }
  }
}

function aiTurn() {
  if (gameOver) return;

  if (currentPlayer.submissionPending) {
    handleSubmissionResponse();
    return;
  }

  const validMoves = currentPlayer.hand.filter((move) => {
    if (currentPlayer.submissionPending) {
      return move.name === 'Submission Escape';
    }
    return (
      move.validPositions.includes(currentPlayer.position) &&
      currentPlayer.stamina >= move.staminaCost &&
      (!move.isDefense || canPlayDefense(move))
    );
  });

  if (validMoves.length === 0 || currentPlayer.isExhausted()) {
    // AI decides to pass or replace cards
    if (Math.random() < 0.5) {
      // Pass to regain stamina
      currentPlayer.stamina += 20;
      currentPlayer.stamina = Math.min(100, currentPlayer.stamina);
      showMessage(`${currentPlayer.name} passes and recovers stamina.`);
      logAction(`${currentPlayer.name} passes and recovers stamina.`);
      updateStatus();
      updateLatestMove(`${currentPlayer.name} passes and recovers stamina.`);
    } else {
      // Replace cards
      aiReplaceCards();
    }
    checkGameStatus();
    if (!gameOver) {
      switchTurns();
    }
  } else {
    let move;
    if (currentPlayer.difficulty === 'Easy') {
      move = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else if (currentPlayer.difficulty === 'Medium') {
      if (currentOpponent.health <= 30) {
        const strikes = validMoves.filter((m) => m.type === 'strike');
        move = strikes.length > 0 ? strikes[0] : validMoves[0];
      } else {
        move = validMoves[0];
      }
    } else {
      move = aiSelectMove(currentPlayer, currentOpponent, validMoves);
    }
    const moveIndex = currentPlayer.hand.indexOf(move);
    const moveDescription = currentPlayer.playMove(moveIndex, currentOpponent);
    const formattedDescription = formatMoveDescription(
      moveDescription,
      currentPlayer,
      currentOpponent
    );
    updateMoveHistory(formattedDescription);
    updateLatestMove(formattedDescription);
    logAction(formattedDescription);
    showMessage(`${currentPlayer.name} uses ${move.name}.`);
    updateStatus();
    updatePosition();
    updateHand();
    if (currentOpponent.submissionPending) {
      switchTurns(); // Allow opponent to respond
    } else {
      checkGameStatus();
      if (!gameOver) {
        setTimeout(() => {
          switchTurns();
        }, 1000);
      }
    }
  }
}

function aiReplaceCards() {
  // AI replaces up to 2 cards
  let replaceCount = 0;
  for (let i = 0; i < currentPlayer.hand.length; i++) {
    if (replaceCount >= 2) break;
    const move = currentPlayer.hand[i];
    if (
      !move.validPositions.includes(currentPlayer.position) ||
      currentPlayer.stamina < move.staminaCost
    ) {
      currentPlayer.discardPile.push(currentPlayer.hand.splice(i, 1)[0]);
      currentPlayer.drawCard();
      replaceCount++;
      i--;
    }
  }
  currentPlayer.stamina -= replaceCount * 5;
  showMessage(`${currentPlayer.name} replaces ${replaceCount} card(s).`);
  logAction(`${currentPlayer.name} replaces ${replaceCount} card(s).`);
  updateHand();
}

function switchTurns() {
  if (gameOver) return;
  [currentPlayer, currentOpponent] = [currentOpponent, currentPlayer];
  showMessage(`${currentPlayer.name}'s turn.`);
  updateHand();

  if (!currentPlayer.isHuman) {
    // AI's turn
    const controlButtons = document.getElementById('control-buttons');
    controlButtons.innerHTML = '';
    setTimeout(() => {
      aiTurn();
    }, 1000);
  } else {
    addControlButtons();
    if (currentPlayer.submissionPending) {
      handleSubmissionResponse();
    }
  }
}

function replaceCards() {
  if (gameOver) return;
  const controlButtons = document.getElementById('control-buttons');
  showMessage('Select up to 2 cards to replace.');
  controlButtons.innerHTML = '';

  let replaceCount = 0;

  function handleCardClick(index) {
    if (replaceCount < 2) {
      currentPlayer.discardPile.push(currentPlayer.hand.splice(index, 1)[0]);
      currentPlayer.drawCard();
      replaceCount++;
      currentPlayer.stamina -= 5;
      updateHandForReplacement();
      showMessage(`${currentPlayer.name} replaced ${replaceCount} card(s).`);
      if (replaceCount === 2) {
        finalizeReplacement(replaceCount);
      }
    }
  }

  function updateHandForReplacement() {
    const handContainer = document.getElementById('hand-container');
    handContainer.innerHTML = '';
    currentPlayer.hand.forEach((move, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${move.name}</h3>
        ${move.damage > 0 ? `<p>Damage: ${move.damage}</p>` : ''}
        <p>Stamina Cost: ${move.staminaCost}</p>
        <p>Position: ${move.validPositions.join(', ') || 'Any'}</p>
        <div class="tooltip">${move.description}</div>
      `;
      card.addEventListener('click', () => handleCardClick(index));
      handContainer.appendChild(card);
    });
  }

  function finalizeReplacement(count) {
    logAction(`${currentPlayer.name} replaced ${count} card(s).`);
    updateHand();
    addControlButtons();
    checkGameStatus();
    if (!gameOver) {
      switchTurns();
    }
  }

  updateHandForReplacement();

  // Add a 'Done' button
  const doneButton = document.createElement('button');
  doneButton.textContent = 'Done';
  doneButton.addEventListener('click', () => {
    finalizeReplacement(replaceCount);
  });
  controlButtons.appendChild(doneButton);
}

function checkGameStatus() {
  if (player.isKnockedOut() || player.isSubmitted) {
    showGameOver(`${opponent.name} wins!`);
    const formattedDescription = `<span class="${opponent.colorClass}">${opponent.name}</span> wins!`;
    updateMoveHistory(formattedDescription);
    logAction(formattedDescription);
    endGame();
  } else if (opponent.isKnockedOut() || opponent.isSubmitted) {
    showGameOver(`${player.name} wins!`);
    const formattedDescription = `<span class="${player.colorClass}">${player.name}</span> wins!`;
    updateMoveHistory(formattedDescription);
    logAction(formattedDescription);
    endGame();
  }
}

function showGameOver(message) {
  const gameArea = document.getElementById('game-area');
  const overlay = document.createElement('div');
  overlay.className = 'game-over-overlay';
  overlay.innerHTML = `
    <h2>${message}</h2>
    <button id="replay-button">Replay</button>
    <button id="main-menu-button">Main Menu</button>
  `;
  gameArea.appendChild(overlay);

  document.getElementById('replay-button').addEventListener('click', () => {
    keepSettings = true;
    initGame();
  });

  document.getElementById('main-menu-button').addEventListener('click', () => {
    keepSettings = false;
    initGame();
  });
}

function endGame() {
  gameOver = true; // Set gameOver flag
  const handContainer = document.getElementById('hand-container');
  const controlButtons = document.getElementById('control-buttons');
  handContainer.innerHTML = '';
  controlButtons.innerHTML = '';
}

function logAction(action) {
  console.log(action);
}

function aiSelectMove(aiPlayer, opponent, validMoves) {
  // AI selects the best move based on various factors
  // Prioritize submissions if opponent's stamina is low and AI is a Submission Artist
  if (aiPlayer.playstyle === 'Submission Artist' && aiPlayer.stamina >= 20) {
    const submissions = validMoves.filter((move) => move.type === 'submission');
    if (submissions.length > 0) {
      return submissions[Math.floor(Math.random() * submissions.length)];
    }
  }
  // Prioritize strikes if opponent's health is low
  if (opponent.health < 30) {
    const strikes = validMoves.filter((move) => move.type === 'strike');
    if (strikes.length > 0) {
      return strikes[Math.floor(Math.random() * strikes.length)];
    }
  }
  // Use takedowns if AI is a Takedown Artist
  if (aiPlayer.playstyle === 'Takedown Artist' && aiPlayer.position !== 'Ground') {
    const takedowns = validMoves.filter((move) => move.type === 'takedown');
    if (takedowns.length > 0) {
      return takedowns[Math.floor(Math.random() * takedowns.length)];
    }
  }
  // Default to strikes
  const strikes = validMoves.filter((move) => move.type === 'strike');
  if (strikes.length > 0) {
    return strikes[Math.floor(Math.random() * strikes.length)];
  }
  // Use position changes if available
  const positions = validMoves.filter((move) => move.type === 'position');
  if (positions.length > 0) {
    return positions[Math.floor(Math.random() * positions.length)];
  }
  // Otherwise, choose any valid move
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

// Start the game
initGame();
