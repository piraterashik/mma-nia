import random

# Positions
POSITIONS = ['Open', 'Clinch', 'Ground']

class Move:
    def __init__(self, name, damage, stamina_cost, move_type, valid_positions, new_position=None, is_defense=False):
        self.name = name
        self.damage = damage
        self.stamina_cost = stamina_cost
        self.type = move_type
        self.valid_positions = valid_positions  # Positions where the move can be used
        self.new_position = new_position  # For moves that change position
        self.is_defense = is_defense  # Indicates if the move is a defense card

    def __repr__(self):
        return f"{self.name}"

# Define all possible moves
ALL_MOVES = [
    # Open Position Moves
    Move('Punch', 10, 4, 'strike', ['Open']),
    Move('Kick', 15, 6, 'strike', ['Open']),
    Move('Elbow', 8, 7, 'strike', ['Open']),  # Less effective in Open position
    Move('Knee', 10, 8, 'strike', ['Open']),  # Less effective in Open position
    Move('Blast Double', 0, 8, 'takedown', ['Open'], new_position='Ground'),
    Move('Single Leg', 0, 6, 'takedown', ['Open'], new_position='Ground'),
    Move('Initiate Clinch', 0, 4, 'position', ['Open'], new_position='Clinch'),
    # Clinch Position Moves
    Move('Elbow', 12, 5, 'strike', ['Clinch']),
    Move('Knee', 14, 6, 'strike', ['Clinch']),
    Move('Blast Double', 0, 8, 'takedown', ['Clinch'], new_position='Ground'),
    Move('Single Leg', 0, 6, 'takedown', ['Clinch'], new_position='Ground'),
    Move('Judo Throw', 0, 7, 'takedown', ['Clinch'], new_position='Ground'),
    Move('Break Clinch', 0, 4, 'position', ['Clinch'], new_position='Open'),
    # Ground Position Moves
    Move('Punch', 8, 4, 'strike', ['Ground']),
    Move('Elbow', 10, 5, 'strike', ['Ground']),
    Move('Chokehold', 0, 8, 'submission', ['Ground']),
    Move('Armbar', 0, 8, 'submission', ['Ground']),
    Move('Leglock', 0, 8, 'submission', ['Ground']),
    Move('Stand Up', 0, 4, 'position', ['Ground'], new_position='Open'),
    # Defense Cards (multiple copies)
    Move('Submission Escape', 0, 4, 'defense', ['Ground'], is_defense=True),
    Move('Submission Escape', 0, 4, 'defense', ['Ground'], is_defense=True),
    Move('Position Reversal', 0, 6, 'defense', ['Ground'], new_position='Clinch', is_defense=True),
    Move('Position Reversal', 0, 6, 'defense', ['Ground'], new_position='Clinch', is_defense=True),
    Move('Guard', 0, 3, 'defense', ['Ground'], is_defense=True),
    Move('Guard', 0, 3, 'defense', ['Ground'], is_defense=True),
]

class Fighter:
    def __init__(self, name, deck, playstyle, is_human=False, difficulty='Medium'):
        self.name = name
        self.health = 100  # Max health
        self.stamina = 100  # Max stamina
        self.position = 'Open'
        self.is_submitted = False
        self.hand = []  # Cards in hand
        self.deck = deck.copy()  # Fighter's deck of move cards
        self.discard_pile = []  # Discarded cards
        self.playstyle = playstyle  # Fighter's playstyle
        self.is_human = is_human
        self.difficulty = difficulty  # For AI fighters

        # Draw initial hand
        self.draw_hand()

    def draw_hand(self, hand_size=5):
        while len(self.hand) < hand_size and self.deck:
            self.draw_card()

    def draw_card(self):
        if not self.deck:
            # Reshuffle discard pile into deck
            self.deck = self.discard_pile.copy()
            self.discard_pile = []
            random.shuffle(self.deck)
        if self.deck:
            card = self.deck.pop()
            self.hand.append(card)

    def play_move(self, move_index, opponent):
        if move_index < 0 or move_index >= len(self.hand):
            print(f"Invalid move selection.")
            return False
        move = self.hand[move_index]
        if move.is_defense:
            print(f"{self.name} cannot play {move.name} on their turn.")
            return False
        if self.position not in move.valid_positions:
            print(f"{self.name} cannot perform {move.name} from {self.position} position.")
            return False
        # Adjust stamina cost for Takedown Artist
        stamina_cost = move.stamina_cost
        if self.playstyle == 'Takedown Artist' and move.type == 'takedown':
            stamina_cost = max(stamina_cost - 2, 1)
        if self.playstyle == 'Knockout Artist' and move.type == 'strike':
            stamina_cost = max(stamina_cost - 1, 1)  # Slight stamina reduction for strikes
        if self.stamina < stamina_cost:
            print(f"{self.name} does not have enough stamina to perform {move.name}.")
            return False
        # Deduct stamina
        self.stamina -= stamina_cost
        if self.stamina < 0:
            self.stamina = 0
        # Apply move effects
        if move.type == 'strike':
            damage = move.damage
            if self.playstyle == 'Knockout Artist':
                damage += 2  # Knockout Artist deals extra damage with strikes
            opponent.receive_damage(damage)
            print(f"{self.name} uses {move.name} on {opponent.name} causing {damage} damage.")
        elif move.type == 'takedown':
            success = self.attempt_takedown(opponent)
            if success:
                new_position = move.new_position
                self.position = new_position
                opponent.position = new_position
                print(f"{self.name} successfully performs {move.name}, moving the fight to {new_position} position.")
            else:
                print(f"{self.name}'s {move.name} attempt failed.")
        elif move.type == 'submission':
            success = self.attempt_submission(opponent)
            if success:
                opponent.is_submitted = True
                print(f"{self.name} successfully submits {opponent.name} with a {move.name}!")
            else:
                print(f"{self.name}'s {move.name} submission attempt failed.")
        elif move.type == 'position':
            new_position = move.new_position
            self.position = new_position
            opponent.position = new_position
            print(f"{self.name} changes position to {new_position}.")
        # Discard the used card
        self.discard_pile.append(self.hand.pop(move_index))
        # Draw a new card
        self.draw_card()
        return True

    def receive_damage(self, damage):
        self.health -= damage
        if self.health < 0:
            self.health = 0

    def attempt_submission(self, opponent):
        # Submission success depends on attacker's and defender's playstyles, stamina, health, and defense cards
        print(f"{opponent.name}, do you want to play a defense card? (Yes/No)")
        defense_played = False
        if opponent.is_human:
            response = input().strip().lower()
            if response == 'yes':
                defense_cards = [card for card in opponent.hand if card.is_defense and opponent.position in card.valid_positions]
                if defense_cards:
                    print("Your defense cards:")
                    for idx, card in enumerate(defense_cards):
                        print(f"{idx+1}. {card.name} (Stamina Cost: {card.stamina_cost})")
                    while True:
                        try:
                            choice = int(input("Choose a defense card to play (or 0 to cancel): ")) - 1
                            if choice == -1:
                                break
                            selected_card = defense_cards[choice]
                            if opponent.stamina >= selected_card.stamina_cost:
                                opponent.stamina -= selected_card.stamina_cost
                                opponent.discard_pile.append(opponent.hand.pop(opponent.hand.index(selected_card)))
                                opponent.draw_card()
                                defense_played = True
                                print(f"{opponent.name} plays {selected_card.name}!")
                                # Adjust success threshold based on defense card
                                if selected_card.name == 'Submission Escape':
                                    return False  # Automatically escape submission
                                elif selected_card.name == 'Guard':
                                    # Reduce attacker's success chance
                                    self.submission_bonus = -20
                                elif selected_card.name == 'Position Reversal':
                                    opponent.position = selected_card.new_position
                                    self.position = selected_card.new_position
                                    print(f"The position changes to {selected_card.new_position}!")
                                    return False  # Submission attempt fails
                                break
                            else:
                                print("Not enough stamina to play this card.")
                        except (ValueError, IndexError):
                            print("Invalid choice.")
                else:
                    print("No defense cards available.")
        else:
            # AI defense logic
            defense_cards = [card for card in opponent.hand if card.is_defense and opponent.position in card.valid_positions and opponent.stamina >= card.stamina_cost]
            if defense_cards:
                # Decide whether to play a defense card based on difficulty and circumstances
                if opponent.difficulty == 'Easy':
                    # Less likely to play defense cards
                    use_defense = random.choice([True, False, False])
                elif opponent.difficulty == 'Medium':
                    use_defense = random.choice([True, False])
                else:  # Hard
                    use_defense = True  # Always use defense if possible

                if use_defense:
                    selected_card = random.choice(defense_cards)
                    opponent.stamina -= selected_card.stamina_cost
                    opponent.discard_pile.append(opponent.hand.pop(opponent.hand.index(selected_card)))
                    opponent.draw_card()
                    defense_played = True
                    print(f"{opponent.name} plays {selected_card.name}!")
                    if selected_card.name == 'Submission Escape':
                        return False
                    elif selected_card.name == 'Guard':
                        self.submission_bonus = -20
                    elif selected_card.name == 'Position Reversal':
                        opponent.position = selected_card.new_position
                        self.position = selected_card.new_position
                        print(f"The position changes to {selected_card.new_position}!")
                        return False
        # Calculate submission success
        chance = random.randint(1, 100)
        base_threshold = 40 + (30 - opponent.stamina) // 2 + (100 - opponent.health) // 5
        # Adjust for Submission Artist
        if self.playstyle == 'Submission Artist':
            base_threshold += 20  # Higher chance to succeed
        if opponent.playstyle == 'Submission Artist':
            base_threshold -= 20  # Harder to submit
        # Adjust for defense card
        if defense_played and hasattr(self, 'submission_bonus'):
            base_threshold += self.submission_bonus
            del self.submission_bonus
        base_threshold = max(5, min(base_threshold, 95))  # Keep within 5-95%
        # Adjust for cumulative submission attempts
        if hasattr(self, 'submission_attempts'):
            self.submission_attempts += 1
            base_threshold += self.submission_attempts * 5  # Increase success chance with each attempt
        else:
            self.submission_attempts = 1
        if chance <= base_threshold:
            return True
        else:
            return False

    def attempt_takedown(self, opponent):
        # Takedown success depends on both fighters' stamina, playstyles, and health
        chance = random.randint(1, 100)
        base_threshold = 60 + (self.stamina - opponent.stamina) // 2 + (100 - opponent.health) // 10
        # Adjust for Takedown Artist
        if self.playstyle == 'Takedown Artist':
            base_threshold += 20  # Higher chance to succeed
        base_threshold = max(5, min(base_threshold, 95))  # Keep within 5-95%
        if chance <= base_threshold:
            return True
        else:
            return False

    def is_knocked_out(self):
        return self.health <= 0

    def is_exhausted(self):
        return self.stamina <= 0

def mma_game():
    # Create decks for each fighter
    player_deck = ALL_MOVES.copy()
    opponent_deck = ALL_MOVES.copy()
    random.shuffle(player_deck)
    random.shuffle(opponent_deck)

    # Select game mode
    print("Select game mode:")
    print("1. Single Player vs AI")
    print("2. Player vs Player")
    while True:
        try:
            mode_choice = int(input("Enter the number of your choice: "))
            if mode_choice in [1, 2]:
                break
            else:
                print("Invalid selection.")
        except ValueError:
            print("Please enter 1 or 2.")

    # Select playstyles
    playstyles = ['Knockout Artist', 'Submission Artist', 'Takedown Artist']
    print("\nPlayer 1: Select your playstyle:")
    for idx, style in enumerate(playstyles):
        print(f"{idx+1}. {style}")
    while True:
        try:
            choice = int(input("Enter the number of your choice: ")) -1
            if choice in range(len(playstyles)):
                player1_playstyle = playstyles[choice]
                break
            else:
                print("Invalid selection.")
        except ValueError:
            print("Please enter a valid number.")

    if mode_choice == 1:
        # Single Player Mode
        # Select difficulty
        difficulties = ['Easy', 'Medium', 'Hard']
        print("\nSelect AI difficulty:")
        for idx, diff in enumerate(difficulties):
            print(f"{idx+1}. {diff}")
        while True:
            try:
                diff_choice = int(input("Enter the number of your choice: ")) -1
                if diff_choice in range(len(difficulties)):
                    ai_difficulty = difficulties[diff_choice]
                    break
                else:
                    print("Invalid selection.")
            except ValueError:
                print("Please enter a valid number.")
        # Assign a random playstyle to the opponent
        opponent_playstyle = random.choice(playstyles)
        print(f"\nYour playstyle: {player1_playstyle}")
        print(f"Opponent's playstyle: {opponent_playstyle}")

        player1 = Fighter('Player', player_deck, player1_playstyle, is_human=True)
        opponent = Fighter('Opponent', opponent_deck, opponent_playstyle, difficulty=ai_difficulty)
        players = [player1, opponent]
    else:
        # PvP Mode
        print("\nPlayer 2: Select your playstyle:")
        for idx, style in enumerate(playstyles):
            print(f"{idx+1}. {style}")
        while True:
            try:
                choice = int(input("Enter the number of your choice: ")) -1
                if choice in range(len(playstyles)):
                    player2_playstyle = playstyles[choice]
                    break
                else:
                    print("Invalid selection.")
            except ValueError:
                print("Please enter a valid number.")
        print(f"\nPlayer 1's playstyle: {player1_playstyle}")
        print(f"Player 2's playstyle: {player2_playstyle}")

        player1 = Fighter('Player 1', player_deck, player1_playstyle, is_human=True)
        player2 = Fighter('Player 2', opponent_deck, player2_playstyle, is_human=True)
        players = [player1, player2]

    total_rounds = 3
    turns_per_round = 10
    current_round = 1
    while current_round <= total_rounds:
        print(f"\n--- Round {current_round} ---")
        current_turn = 1
        while current_turn <= turns_per_round:
            for player in players:
                opponent = players[1] if player == players[0] else players[0]
                print(f"\nTurn {current_turn} - Position: {player.position}")
                # Display health and stamina bars
                print(f"{player.name} - Health: {player.health}, Stamina: {player.stamina}")
                print(f"{opponent.name} - Health: {opponent.health}, Stamina: {opponent.stamina}")
                # Check for exhaustion
                if player.is_exhausted():
                    print(f"{player.name} is exhausted and cannot perform a move.")
                    # Player recovers stamina when exhausted
                    player.stamina += 15
                else:
                    # Player's turn
                    if player.is_human:
                        print("Your turn.")
                        # Display hand with valid moves
                        valid_moves = [move for move in player.hand if not move.is_defense and player.position in move.valid_positions and player.stamina >= move.stamina_cost]
                        if not valid_moves:
                            print("No valid moves in your hand or insufficient stamina. You pass this turn and recover stamina.")
                            player.stamina += 15  # Recover stamina when passing
                        else:
                            while True:
                                print("Your hand:")
                                for idx, move in enumerate(player.hand):
                                    positions = ', '.join(move.valid_positions)
                                    move_type = 'Defense' if move.is_defense else move.type.capitalize()
                                    print(f"{idx+1}. {move.name} (Type: {move_type}, Stamina Cost: {move.stamina_cost}, Positions: {positions})")
                                try:
                                    move_choice = int(input("Choose your move (or 0 to pass): ")) - 1
                                    if move_choice == -1:
                                        print(f"{player.name} decides to pass and recover stamina.")
                                        player.stamina += 15
                                        break
                                    else:
                                        result = player.play_move(move_choice, opponent)
                                        if result:
                                            # Valid move performed
                                            break
                                        else:
                                            # Invalid move, inform player and let them choose again
                                            pass  # The play_move method already prints the error message
                                except ValueError:
                                    print("Invalid input. Please enter a number corresponding to your move or 0 to pass.")
                                except IndexError:
                                    print("Invalid choice. Please choose a move from your hand or 0 to pass.")
                    else:
                        # AI's turn
                        print(f"{player.name}'s turn.")
                        # AI selects move based on difficulty
                        if player.difficulty == 'Easy':
                            # Random move
                            valid_moves = [move for move in player.hand if not move.is_defense and player.position in move.valid_positions and player.stamina >= move.stamina_cost]
                            if not valid_moves:
                                print(f"{player.name} has no valid moves or insufficient stamina and passes the turn.")
                                player.stamina += 15
                            else:
                                move = random.choice(valid_moves)
                                move_index = player.hand.index(move)
                                player.play_move(move_index, opponent)
                        elif player.difficulty == 'Medium':
                            # Consider stamina and position
                            valid_moves = [move for move in player.hand if not move.is_defense and player.position in move.valid_positions and player.stamina >= move.stamina_cost]
                            if not valid_moves:
                                print(f"{player.name} has no valid moves or insufficient stamina and passes the turn.")
                                player.stamina += 15
                            else:
                                # Prioritize strikes if opponent's health is low
                                if opponent.health <= 30:
                                    strikes = [move for move in valid_moves if move.type == 'strike']
                                    if strikes:
                                        move = random.choice(strikes)
                                    else:
                                        move = random.choice(valid_moves)
                                else:
                                    move = random.choice(valid_moves)
                                move_index = player.hand.index(move)
                                player.play_move(move_index, opponent)
                        else:  # Hard difficulty
                            # Strategic selection
                            valid_moves = [move for move in player.hand if not move.is_defense and player.position in move.valid_positions and player.stamina >= move.stamina_cost]
                            if not valid_moves:
                                print(f"{player.name} has no valid moves or insufficient stamina and passes the turn.")
                                player.stamina += 15
                            else:
                                move = ai_select_move(player, opponent, valid_moves)
                                move_index = player.hand.index(move)
                                player.play_move(move_index, opponent)
                # Ensure stamina doesn't exceed max
                if player.stamina > 100:
                    player.stamina = 100
                # Check if opponent is knocked out or submitted
                if opponent.is_knocked_out():
                    print(f"{opponent.name} is knocked out! {player.name} wins!")
                    return
                if opponent.is_submitted:
                    print(f"{player.name} wins by submission!")
                    return
                # Check if player is knocked out or submitted (in case of self-damage or special moves)
                if player.is_knocked_out():
                    print(f"{player.name} is knocked out! {opponent.name} wins!")
                    return
                if player.is_submitted:
                    print(f"{opponent.name} wins by submission!")
                    return
            # End of turn
            current_turn += 1
        # End of round, recover stamina
        for player in players:
            player.stamina += 30
            if player.stamina > 100:
                player.stamina = 100
        current_round += 1
    # Decision based on remaining health
    print("\nTime's up! The fight goes to decision.")
    player1, player2 = players
    if player1.health > player2.health:
        print(f"{player1.name} wins by decision!")
    elif player2.health > player1.health:
        print(f"{player2.name} wins by decision!")
    else:
        print("It's a draw!")

def ai_select_move(ai_player, opponent, valid_moves):
    # AI selects the best move based on various factors
    # Prioritize submissions if opponent's stamina is low
    if ai_player.position == 'Ground':
        if opponent.stamina < 30:
            submissions = [move for move in valid_moves if move.type == 'submission']
            if submissions:
                return random.choice(submissions)
    # Prioritize strikes if opponent's health is low
    if opponent.health < 30:
        strikes = [move for move in valid_moves if move.type == 'strike']
        if strikes:
            return random.choice(strikes)
    # Use takedowns if AI is a Takedown Artist
    if ai_player.playstyle == 'Takedown Artist' and ai_player.position != 'Ground':
        takedowns = [move for move in valid_moves if move.type == 'takedown']
        if takedowns:
            return random.choice(takedowns)
    # Default to strikes
    strikes = [move for move in valid_moves if move.type == 'strike']
    if strikes:
        return random.choice(strikes)
    # Otherwise, choose any valid move
    return random.choice(valid_moves)

mma_game()
