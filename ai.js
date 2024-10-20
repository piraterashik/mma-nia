// ai.js

export function aiSelectMove(aiPlayer, opponent, validMoves) {
    // AI selects the best move based on various factors
    // Prioritize submissions if opponent's stamina is low
    if (aiPlayer.position === 'Ground') {
      if (opponent.stamina < 30) {
        const submissions = validMoves.filter((move) => move.type === 'submission');
        if (submissions.length > 0) {
          return submissions[Math.floor(Math.random() * submissions.length)];
        }
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
    // Otherwise, choose any valid move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
  