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
    targetPosition = null,
    description = ''
  ) {
    this.name = name;
    this.damage = damage;
    this.staminaCost = staminaCost;
    this.type = moveType;
    this.validPositions = validPositions;
    this.targetPosition = targetPosition;
    this.description = description;
  }

  toString() {
    return `${this.name}`;
  }
}

// Define the moves according to your specifications
const ALL_MOVES = [
  // Open Position Moves
  new Move(
    'Open Elbow',
    18, // Increased damage
    5,
    'strike',
    ['Open'],
    null,
    'An elbow strike in open position.'
  ),
  new Move(
    'Open Knee',
    22, // Increased damage
    7,
    'strike',
    ['Open'],
    null,
    'A swift knee strike in open position.'
  ),
  new Move(
    'Punch',
    20, // Increased damage
    4,
    'strike',
    ['Open'],
    null,
    'A quick punch to the opponent.'
  ),
  new Move(
    'Kick',
    25, // Increased damage
    6,
    'strike',
    ['Open'],
    null,
    'A powerful kick aimed at the opponent.'
  ),
  new Move(
    'Single Leg',
    0,
    8,
    'takedown',
    ['Open'],
    'Ground',
    'Attempt a single-leg takedown.'
  ),
  new Move(
    'Blast Double',
    0,
    10,
    'takedown',
    ['Open'],
    'Ground',
    'Attempt a double-leg takedown.'
  ),
  new Move(
    'Sprawl',
    0,
    5,
    'defense',
    [], // Can be played in response to a takedown
    null,
    'Defend against a takedown attempt.'
  ),
  // Clinch Position Moves
  new Move(
    'Clinch Elbow',
    22, // Increased damage
    6,
    'strike',
    ['Clinch'],
    null,
    'A powerful elbow strike in close quarters.'
  ),
  new Move(
    'Clinch Knee',
    25, // Increased damage
    8,
    'strike',
    ['Clinch'],
    null,
    'A devastating knee to the opponent in clinch.'
  ),
  new Move(
    'Judo Throw',
    0,
    9,
    'takedown',
    ['Clinch'],
    'Ground',
    'Attempt to throw the opponent to the ground.'
  ),
  new Move(
    'Single Leg',
    0,
    8,
    'takedown',
    ['Clinch'],
    'Ground',
    'Attempt a single-leg takedown.'
  ),
  new Move(
    'Clinch Break',
    0,
    4,
    'position',
    ['Clinch'],
    'Open',
    'Break the clinch and return to open position.'
  ),
  // Ground Position Moves
  new Move(
    'Chokehold',
    0,
    10,
    'submission',
    ['Ground'],
    null,
    'Attempt a choke submission.'
  ),
  new Move(
    'Armbar',
    0,
    10,
    'submission',
    ['Ground'],
    null,
    'Attempt an armbar submission.'
  ),
  new Move(
    'Leglock',
    0,
    10,
    'submission',
    ['Ground'],
    null,
    'Attempt a leglock submission.'
  ),
  new Move(
    'Stand',
    0,
    6,
    'position',
    ['Ground'],
    'Open',
    'Stand up and return to open position.'
  ),
  // Defense Moves
  new Move(
    'Submission Escape',
    0,
    5,
    'defense',
    [], // Can be played in response to a submission
    null,
    'Escape an attempted submission.'
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
    this.submissionPending = false; // For handling submissions
    this.takedownPending = false; // For handling takedown defense

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
    if (this.submissionPending) {
      if (move.name !== 'Submission Escape') {
        console.log(`${this.name} must play 'Submission Escape' or pass.`);
        return false;
      }
    } else if (this.takedownPending) {
      if (move.name !== 'Sprawl') {
        console.log(`${this.name} must play 'Sprawl' or pass.`);
        return false;
      }
    } else {
      if (!move.validPositions.includes(this.position)) {
        console.log(
          `${this.name} cannot perform ${move.name} from ${this.position} position.`
        );
        return false;
      }
      if (
        move.name === 'Submission Escape' ||
        move.name === 'Sprawl'
      ) {
        console.log(`${this.name} cannot use ${move.name} right now.`);
        return false;
      }
    }

    // Check stamina
    if (this.stamina < move.staminaCost) {
      console.log(
        `${this.name} does not have enough stamina to perform ${move.name}.`
      );
      return false;
    }

    // Deduct stamina
    this.stamina -= move.staminaCost;
    this.stamina = Math.max(0, Math.min(this.stamina, 100));

    // Apply move effects
    let moveDescription = '';
    if (move.type === 'strike') {
      let damage = move.damage;
      opponent.receiveDamage(damage);
      moveDescription = `${this.name} uses ${move.name} on ${opponent.name} (-${damage})`;
    } else if (move.type === 'takedown') {
      opponent.takedownPending = true;
      moveDescription = `${this.name} attempts ${move.name}`;
      // Do not switch turns here; opponent responds
    } else if (move.type === 'position') {
      const newPosition = move.targetPosition;
      this.position = newPosition;
      moveDescription = `${this.name} changes position to ${newPosition}`;
    } else if (move.type === 'submission') {
      moveDescription = `${this.name} attempts ${move.name} on ${opponent.name}`;
      opponent.submissionPending = true;
      // Do not switch turns here; opponent responds
    } else if (move.type === 'defense') {
      if (move.name === 'Stand') {
        this.position = move.targetPosition;
        moveDescription = `${this.name} stands up to ${this.position} position`;
      } else if (move.name === 'Submission Escape') {
        this.submissionPending = false;
        moveDescription = `${this.name} escapes the submission attempt!`;
      } else if (move.name === 'Sprawl') {
        // Sprawl reduces opponent's takedown success
        const success = opponent.attemptTakedown(this) && Math.random() < 0.3;
        if (success) {
          this.position = 'Ground';
          opponent.position = 'Ground';
          moveDescription = `${opponent.name} overcomes the sprawl and successfully takes down ${this.name}`;
        } else {
          moveDescription = `${this.name} successfully sprawls and defends the takedown!`;
        }
        this.takedownPending = false;
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

  attemptTakedown(opponent) {
    let successChance = 60;
    successChance += (this.stamina - opponent.stamina) / 5;
    successChance = Math.max(10, Math.min(successChance, 90));
    return Math.random() * 100 < successChance;
  }

  attemptSubmission(opponent) {
    let successChance = 40;
    successChance += (this.stamina - opponent.stamina) / 5;
    successChance += (100 - opponent.health) / 10;
    successChance = Math.max(10, Math.min(successChance, 90));
    return Math.random() * 100 < successChance;
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
let moveHistory = [];
let playerNames = {};
let keepSettings = false;
let gameOver = false;

// Initialize Game
function initGame() {
  // Set up the game area
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = '';
  gameOver = false;

  if (!keepSettings) {
    // Game mode selection
    gameArea.innerHTML = `
      <button id="single-player">SINGLE</button>
      <button id="two-player">P V P</button>
      <button id="train-mode">TRAIN</button>
    `;

    document.getElementById('single-player').addEventListener('click', () => {
      gameMode = 'single';
      enterPlayerNames();
    });

    document.getElementById('two-player').addEventListener('click', () => {
      gameMode = 'two-player';
      enterPlayerNames();
    });

    document.getElementById('train-mode').addEventListener('click', () => {
      gameMode = 'train';
      startTraining();
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
  gameOver = false;

  if (gameMode === 'single' || gameMode === 'train') {
    const opponentPlaystyle = [
      'Knockout Artist',
      'Submission Artist',
      'Takedown Artist',
    ][Math.floor(Math.random() * 3)];
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
    setTimeout(() => {
      aiTurn();
    }, 1000);
  } else {
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

    if (currentOpponent.submissionPending || currentOpponent.takedownPending) {
      switchTurns(); // Allow opponent to respond
    } else {
      checkGameStatus();
      if (!gameOver) {
        switchTurns();
      }
    }
  } else {
    showMessage('Invalid move. Try again.');
  }
}

function aiTurn() {
  if (gameOver) return;

  if (currentPlayer.submissionPending) {
    handleSubmissionResponse();
    return;
  }

  if (currentPlayer.takedownPending) {
    handleTakedownDefense();
    return;
  }

  const validMoves = currentPlayer.hand.filter((move) => {
    return (
      move.validPositions.includes(currentPlayer.position) &&
      currentPlayer.stamina >= move.staminaCost &&
      move.name !== 'Submission Escape' &&
      move.name !== 'Sprawl'
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
    } else {
      // Replace cards
      aiReplaceCards();
    }
    checkGameStatus();
    if (!gameOver) {
      switchTurns();
    }
  } else {
    let move = aiSelectMove(currentPlayer, currentOpponent, validMoves);
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
    if (currentOpponent.submissionPending || currentOpponent.takedownPending) {
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

function updateHand() {
  const handContainer = document.getElementById('hand-container');
  handContainer.innerHTML = '';

  if (gameMode === 'single' || gameMode === 'train') {
    player.hand.forEach((move, index) => {
      let isValid = false;

      if (currentPlayer === player) {
        if (currentPlayer.submissionPending) {
          isValid = move.name === 'Submission Escape';
        } else if (currentPlayer.takedownPending) {
          isValid = move.name === 'Sprawl';
        } else {
          isValid =
            move.validPositions.includes(player.position) &&
            player.stamina >= move.staminaCost &&
            move.name !== 'Submission Escape' &&
            move.name !== 'Sprawl';
        }
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
        let isValid = false;

        if (currentPlayer.submissionPending) {
          isValid = move.name === 'Submission Escape';
        } else if (currentPlayer.takedownPending) {
          isValid = move.name === 'Sprawl';
        } else {
          isValid =
            move.validPositions.includes(currentPlayer.position) &&
            currentPlayer.stamina >= move.staminaCost &&
            move.name !== 'Submission Escape' &&
            move.name !== 'Sprawl';
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

function addControlButtons() {
  const controlButtons = document.getElementById('control-buttons');
  controlButtons.innerHTML = '';

  if (currentPlayer.isHuman) {
    // Pass Button
    const passButton = document.createElement('button');
    passButton.textContent = 'Pass';
    passButton.addEventListener('click', () => {
      if (gameOver) return;
      if (currentPlayer.submissionPending) {
        // Accept the submission
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
        checkGameStatus();
      } else if (currentPlayer.takedownPending) {
        // Allow takedown
        const success = currentOpponent.attemptTakedown(currentPlayer);
        if (success) {
          currentPlayer.position = 'Ground';
          currentOpponent.position = 'Ground';
          const moveDescription = `${currentOpponent.name} successfully takes down ${currentPlayer.name}`;
          const formattedDescription = formatMoveDescription(
            moveDescription,
            currentOpponent,
            currentPlayer
          );
          updateMoveHistory(formattedDescription);
          updateLatestMove(formattedDescription);
          logAction(formattedDescription);
        } else {
          const moveDescription = `${currentOpponent.name}'s takedown attempt failed`;
          const formattedDescription = formatMoveDescription(
            moveDescription,
            currentOpponent,
            currentPlayer
          );
          updateMoveHistory(formattedDescription);
          updateLatestMove(formattedDescription);
          logAction(formattedDescription);
        }
        currentPlayer.takedownPending = false;
        checkGameStatus();
        if (!gameOver) {
          switchTurns();
        }
      } else {
        // Regular pass
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

    // Replace Button (only if not pending submission or takedown)
    if (!currentPlayer.submissionPending && !currentPlayer.takedownPending) {
      const replaceButton = document.createElement('button');
      replaceButton.textContent = 'Replace Up to 2 Cards (-10 Stamina per card)';
      replaceButton.addEventListener('click', () => {
        if (gameOver) return;
        replaceCards();
      });
      controlButtons.appendChild(replaceButton);
    }
  }
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

  // Use word boundaries to match exact names
  const actorNameRegex = new RegExp(`\\b${actor.name}\\b`, 'g');
  const targetNameRegex = new RegExp(`\\b${target.name}\\b`, 'g');

  let formattedDescription = description
    .replace(actorNameRegex, `<span class="${actorClass}">${actor.name}</span>`)
    .replace(targetNameRegex, `<span class="${targetClass}">${target.name}</span>`)
    .replace(/(-\d+)/g, `<span class="damage-text">$1</span>`);

  return formattedDescription;
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
      checkGameStatus();
    }
  }
}

function handleTakedownDefense() {
  if (currentPlayer.isHuman) {
    showMessage(
      `${currentPlayer.name}, your opponent is attempting a takedown. You can play 'Sprawl' from your hand to defend or 'Pass' to allow the takedown.`
    );
    updateHand();
    addControlButtons();
  } else {
    // AI's response to takedown
    const sprawlIndex = currentPlayer.hand.findIndex(
      (move) => move.name === 'Sprawl'
    );
    if (sprawlIndex !== -1) {
      // AI uses Sprawl
      const moveDescription = currentPlayer.playMove(
        sprawlIndex,
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
    } else {
      // AI allows the takedown
      const success = currentOpponent.attemptTakedown(currentPlayer);
      if (success) {
        currentPlayer.position = 'Ground';
        currentOpponent.position = 'Ground';
        const moveDescription = `${currentOpponent.name} successfully takes down ${currentPlayer.name}`;
        const formattedDescription = formatMoveDescription(
          moveDescription,
          currentOpponent,
          currentPlayer
        );
        updateMoveHistory(formattedDescription);
        updateLatestMove(formattedDescription);
        logAction(formattedDescription);
      } else {
        const moveDescription = `${currentOpponent.name}'s takedown attempt failed`;
        const formattedDescription = formatMoveDescription(
          moveDescription,
          currentOpponent,
          currentPlayer
        );
        updateMoveHistory(formattedDescription);
        updateLatestMove(formattedDescription);
        logAction(formattedDescription);
      }
      currentPlayer.takedownPending = false;
    }
    checkGameStatus();
    if (!gameOver) {
      switchTurns();
    }
  }
}

function switchTurns() {
  if (gameOver) return;
  [currentPlayer, currentOpponent] = [currentOpponent, currentPlayer];
  showMessage(`${currentPlayer.name}'s turn.`);
  updateHand();

  if (!currentPlayer.isHuman) {
    const controlButtons = document.getElementById('control-buttons');
    controlButtons.innerHTML = '';
    setTimeout(() => {
      aiTurn();
    }, 1000);
  } else {
    addControlButtons();
    if (currentPlayer.submissionPending) {
      handleSubmissionResponse();
    } else if (currentPlayer.takedownPending) {
      handleTakedownDefense();
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
      const card = currentPlayer.hand.splice(index, 1)[0];
      currentPlayer.discardPile.push(card);
      currentPlayer.drawCard();
      replaceCount++;
      currentPlayer.stamina -= 10; // Increased cost
      currentPlayer.stamina = Math.max(0, currentPlayer.stamina); // Prevent negative stamina
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

function aiReplaceCards() {
  // AI replaces up to 2 cards
  let replaceCount = 0;
  for (let i = 0; i < currentPlayer.hand.length; i++) {
    if (replaceCount >= 2) break;
    const move = currentPlayer.hand[i];
    if (
      !move.validPositions.includes(currentPlayer.position) ||
      currentPlayer.stamina < move.staminaCost ||
      move.name === 'Submission Escape' ||
      move.name === 'Sprawl'
    ) {
      currentPlayer.discardPile.push(currentPlayer.hand.splice(i, 1)[0]);
      currentPlayer.drawCard();
      replaceCount++;
      i--;
    }
  }
  currentPlayer.stamina -= replaceCount * 10; // Increased cost
  currentPlayer.stamina = Math.max(0, currentPlayer.stamina); // Prevent negative stamina
  showMessage(`${currentPlayer.name} replaces ${replaceCount} card(s).`);
  logAction(`${currentPlayer.name} replaces ${replaceCount} card(s).`);
  updateHand();
}

function aiSelectMove(aiPlayer, opponent, validMoves) {
  // Simple AI logic based on playstyle and current position
  if (aiPlayer.playstyle === 'Knockout Artist') {
    const strikes = validMoves.filter((move) => move.type === 'strike');
    if (strikes.length > 0) {
      return strikes[Math.floor(Math.random() * strikes.length)];
    }
  }

  if (aiPlayer.playstyle === 'Takedown Artist') {
    const takedowns = validMoves.filter((move) => move.type === 'takedown');
    if (takedowns.length > 0) {
      return takedowns[Math.floor(Math.random() * takedowns.length)];
    }
  }

  if (aiPlayer.playstyle === 'Submission Artist') {
    const submissions = validMoves.filter((move) => move.type === 'submission');
    if (submissions.length > 0) {
      return submissions[Math.floor(Math.random() * submissions.length)];
    }
  }

  // Default to any valid move
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

function startTraining() {
  playerNames = { player1: 'Player', player2: 'Trainer' };
  gameDifficulty = 'Easy';
  startGame('Knockout Artist', 'Takedown Artist');
  showTrainingMessages();
}

function showTrainingMessages() {
  // Implement a simple tutorial
  const messages = [
    'Welcome to the training mode!',
    'In this game, your objective is to defeat your opponent by reducing their health to zero or submitting them.',
    'You have various moves in your hand that you can play during your turn.',
    'Let\'s start by playing a strike move like "Punch" or "Kick". Click on a valid card to play it.',
  ];
  let index = 0;
  function nextMessage() {
    if (index < messages.length) {
      showMessage(messages[index]);
      index++;
    }
  }
  nextMessage();
  // Call nextMessage() at appropriate times during the training.
}

// Start the game
initGame();
