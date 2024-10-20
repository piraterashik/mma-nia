// fighter.js

import { shuffleArray } from './utils.js';

export class Fighter {
  constructor(name, deck, playstyle, isHuman = false, difficulty = 'Medium') {
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

    // Draw initial hand
    this.drawHand();
  }

  drawHand(handSize = 5) {
    while (this.hand.length < handSize && this.deck.length > 0) {
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
    if (move.isDefense) {
      console.log(`${this.name} cannot play ${move.name} on their turn.`);
      return false;
    }
    if (!move.validPositions.includes(this.position)) {
      console.log(`${this.name} cannot perform ${move.name} from ${this.position} position.`);
      return false;
    }
    // Adjust stamina cost for Takedown Artist
    let staminaCost = move.staminaCost;
    if (this.playstyle === 'Takedown Artist' && move.type === 'takedown') {
      staminaCost = Math.max(staminaCost - 2, 1);
    }
    if (this.playstyle === 'Knockout Artist' && move.type === 'strike') {
      staminaCost = Math.max(staminaCost - 1, 1); // Slight stamina reduction for strikes
    }
    if (this.stamina < staminaCost) {
      console.log(`${this.name} does not have enough stamina to perform ${move.name}.`);
      return false;
    }
    // Deduct stamina
    this.stamina -= staminaCost;
    if (this.stamina < 0) {
      this.stamina = 0;
    }
    // Apply move effects
    if (move.type === 'strike') {
      let damage = move.damage;
      if (this.playstyle === 'Knockout Artist') {
        damage += 2; // Knockout Artist deals extra damage with strikes
      }
      opponent.receiveDamage(damage);
      console.log(`${this.name} uses ${move.name} on ${opponent.name} causing ${damage} damage.`);
    } else if (move.type === 'takedown') {
      const success = this.attemptTakedown(opponent);
      if (success) {
        const newPosition = move.newPosition;
        this.position = newPosition;
        opponent.position = newPosition;
        console.log(`${this.name} successfully performs ${move.name}, moving the fight to ${newPosition} position.`);
      } else {
        console.log(`${this.name}'s ${move.name} attempt failed.`);
      }
    } else if (move.type === 'submission') {
      const success = this.attemptSubmission(opponent);
      if (success) {
        opponent.isSubmitted = true;
        console.log(`${this.name} successfully submits ${opponent.name} with a ${move.name}!`);
      } else {
        console.log(`${this.name}'s ${move.name} submission attempt failed.`);
      }
    } else if (move.type === 'position') {
      const newPosition = move.newPosition;
      this.position = newPosition;
      opponent.position = newPosition;
      console.log(`${this.name} changes position to ${newPosition}.`);
    }
    // Discard the used card
    this.discardPile.push(this.hand.splice(moveIndex, 1)[0]);
    // Draw a new card
    this.drawCard();
    return true;
  }

  receiveDamage(damage) {
    this.health -= damage;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  attemptSubmission(opponent, callback) {
    // Submission success depends on attacker's and defender's playstyles, stamina, health, and defense cards
    let defensePlayed = false;

    if (opponent.isHuman) {
      // Handle defense cards via UI
      callback();
    } else {
      // AI defense logic
      const defenseCards = opponent.hand.filter(
        (card) =>
          card.isDefense &&
          card.validPositions.includes(opponent.position) &&
          opponent.stamina >= card.staminaCost
      );
      if (defenseCards.length > 0) {
        let useDefense = false;
        if (opponent.difficulty === 'Easy') {
          useDefense = Math.random() < 0.33;
        } else if (opponent.difficulty === 'Medium') {
          useDefense = Math.random() < 0.5;
        } else {
          useDefense = true;
        }

        if (useDefense) {
          const selectedCard = defenseCards[Math.floor(Math.random() * defenseCards.length)];
          opponent.stamina -= selectedCard.staminaCost;
          opponent.discardPile.push(
            opponent.hand.splice(opponent.hand.indexOf(selectedCard), 1)[0]
          );
          opponent.drawCard();
          defensePlayed = true;
          console.log(`${opponent.name} plays ${selectedCard.name}!`);
          if (selectedCard.name === 'Submission Escape') {
            return false;
          } else if (selectedCard.name === 'Guard') {
            this.submissionBonus = -20;
          } else if (selectedCard.name === 'Position Reversal') {
            opponent.position = selectedCard.newPosition;
            this.position = selectedCard.newPosition;
            console.log(`The position changes to ${selectedCard.newPosition}!`);
            return false;
          }
        }
      }
    }

    // Calculate submission success
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
    if (defensePlayed && this.hasOwnProperty('submissionBonus')) {
      baseThreshold += this.submissionBonus;
      delete this.submissionBonus;
    }
    baseThreshold = Math.max(5, Math.min(baseThreshold, 95));
    if (this.hasOwnProperty('submissionAttempts')) {
      this.submissionAttempts += 1;
      baseThreshold += this.submissionAttempts * 5;
    } else {
      this.submissionAttempts = 1;
    }
    if (chance <= baseThreshold) {
      return true;
    } else {
      return false;
    }
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
    if (chance <= baseThreshold) {
      return true;
    } else {
      return false;
    }
  }

  isKnockedOut() {
    return this.health <= 0;
  }

  isExhausted() {
    return this.stamina <= 0;
  }
}
