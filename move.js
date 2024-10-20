// move.js

export class Move {
    constructor(name, damage, staminaCost, moveType, validPositions, newPosition = null, isDefense = false) {
      this.name = name;
      this.damage = damage;
      this.staminaCost = staminaCost;
      this.type = moveType;
      this.validPositions = validPositions;
      this.newPosition = newPosition;
      this.isDefense = isDefense;
    }
  
    toString() {
      return `${this.name}`;
    }
  }
  
  export const ALL_MOVES = [
    // Open Position Moves
    new Move('Punch', 10, 4, 'strike', ['Open']),
    new Move('Kick', 15, 6, 'strike', ['Open']),
    new Move('Elbow', 8, 7, 'strike', ['Open']),
    new Move('Knee', 10, 8, 'strike', ['Open']),
    new Move('Blast Double', 0, 8, 'takedown', ['Open'], 'Ground'),
    new Move('Single Leg', 0, 6, 'takedown', ['Open'], 'Ground'),
    new Move('Initiate Clinch', 0, 4, 'position', ['Open'], 'Clinch'),
    // Clinch Position Moves
    new Move('Elbow', 12, 5, 'strike', ['Clinch']),
    new Move('Knee', 14, 6, 'strike', ['Clinch']),
    new Move('Blast Double', 0, 8, 'takedown', ['Clinch'], 'Ground'),
    new Move('Single Leg', 0, 6, 'takedown', ['Clinch'], 'Ground'),
    new Move('Judo Throw', 0, 7, 'takedown', ['Clinch'], 'Ground'),
    new Move('Break Clinch', 0, 4, 'position', ['Clinch'], 'Open'),
    // Ground Position Moves
    new Move('Punch', 8, 4, 'strike', ['Ground']),
    new Move('Elbow', 10, 5, 'strike', ['Ground']),
    new Move('Chokehold', 0, 8, 'submission', ['Ground']),
    new Move('Armbar', 0, 8, 'submission', ['Ground']),
    new Move('Leglock', 0, 8, 'submission', ['Ground']),
    new Move('Stand Up', 0, 4, 'position', ['Ground'], 'Open'),
    // Defense Cards (multiple copies)
    new Move('Submission Escape', 0, 4, 'defense', ['Ground'], null, true),
    new Move('Submission Escape', 0, 4, 'defense', ['Ground'], null, true),
    new Move('Position Reversal', 0, 6, 'defense', ['Ground'], 'Clinch', true),
    new Move('Position Reversal', 0, 6, 'defense', ['Ground'], 'Clinch', true),
    new Move('Guard', 0, 3, 'defense', ['Ground'], null, true),
    new Move('Guard', 0, 3, 'defense', ['Ground'], null, true),
  ];
  