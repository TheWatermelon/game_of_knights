# game_of_knights

# TODO

## Main game

- [ ] decks containing all the cards
    - a card in this deck has id, value (1-13) and color (clubs, hearts, spades, diamonds)
    - cards in the lists are ids
- [ ] list of players (at least 2)
    - each player has at 1-2 health cards and 1 shield, plus possible charges
- [ ] list of face down cards
- [ ] list of discard pile

## Rules

- [ ]  Game of knights is a game using a pack of 52 cards. It can be played with 2+ players.
- [ ]  Shuffle the pack of cards, then lay two cards face up vertically in front of each knights; they represent their lifepoints (sum of the values, from 1 for Ace to 13 for King)
- [ ]  Lay another card face up in front of the two other cards horizontally; it represents their shield
- [ ]  During a knight's turn, a knight choose an action before taking a card from the faced down pile
    - [ ]  change a knight's shield, either his/her or another knight's; discard the old shield into the discard pile
    - [ ]  charge a knight, putting a faced down card beside him/her
    - [ ]  attack a knight; a knight with a charge adds values of the attack card and the charge(s) card(s); the defending knight loses any charge (s)he had; if the attack value is greater than the shield, substract the difference from their life points (either by grabbing a card from the bottom of the face down pile or from the discard pile)
