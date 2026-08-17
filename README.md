# game_of_knights

# TODO

## Menus

### Game

- [x] choose number of players (2-4)
- [x] button to see the rules
- [x] button to start game
- [ ] IA

### Rules

- [x] List of rules, possibly with images
- [x] button to start game

## Game

- [x] deck containing all the cards
    - a card in this deck has `id`, `value` (1-13) and `color` (clubs, hearts, spades, diamonds)
    - cards in the lists are ids
- [x] `players`: list of players (at least 2)
    - each player has a `player.name` at 1-2 `player.hp`cards and 1 `player.shield`, plus possible charges `player.charge`
- [x] `drawPile`: list of face down cards
    - shuffle the ids 1-52
- [x] `discardPile`: list of discard pile
- [x] distributing cards between players
    - take 3 cards from the face down list to add to players' hp and shield
- [x] taking turns (beginning from player1), each player `currentPlayer` can choose an action between **attack, change shield, charge** and a `targetKnight`
    - **attack**: choose a knight, then take a card from drawPile (`drawCard`), reveal it. If `drawCard` + `currentPlayer.charge` (sum of charge(s) value(s)) > defending player.shield, subtract the difference from the life point, then find a way to represent their new life points (put `defendingPlayer.hp` card(s) in `discardPile` then pick from first `discardPile` then bottom of `drawPile` cards corresponding `defendingPlayer.hp`)
    - **change shield**: put `targetPlayer.shield` in `discardPile` then put `drawCard` in `targetPlayer.shield``
    - **charge**: add `drawCard` to `targetPlayer.charge`
- [x] check loose condition: a player has no hp
- [x] check win condition: only one player remaining
- [ ] action animation/information before resolving

## Rules

- [x]  Game of knights is a game using a pack of 52 cards. It can be played with 2+ players.
- [x]  Shuffle the pack of cards, then lay two cards face up vertically in front of each knights; they represent their lifepoints (sum of the values, from 1 for Ace to 13 for King)
- [x]  Lay another card face up in front of the two other cards horizontally; it represents their shield
- [x]  During a knight's turn, a knight choose an action before taking a card from the faced down pile
    - [x]  change a knight's shield, either his/her or another knight's; discard the old shield into the discard pile
    - [x]  charge a knight, putting a faced down card beside him/her
    - [x]  attack a knight; a knight with a charge adds values of the attack card and the charge(s) card(s); the defending knight loses any charge (s)he had; if the attack value is greater than the shield, subtract the difference from their life points (either by grabbing a card from the bottom of the face down pile or from the discard pile)
