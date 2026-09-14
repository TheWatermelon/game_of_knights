# Game of Knights

## TODO

- [ ] Add more bots strategies
- [ ] Main menu to choose between bots and human

## Rules

Game of knights is a tabletop game using a pack of 52 cards. It can be played with 2+ players.

Shuffle the pack of cards. Each knight starts with two face-up cards as lifepoints (sum of their values) and one face-up shield card. The rest of the deck is the draw pile.

On your turn, choose one action. Then draw the top card of the draw pile and resolve the action:
- **Change Shield**: replace any knight's shield with the drawn card. Their old shield goes to the discard pile.
- **Charge**: place the drawn card face-down next to a knight as a charge. It adds to this knight's next attack.
- **Attack**: your attack value is the drawn card plus all your charges. If your attack is higher than the defender's shield, they lose lifepoints equal to the difference. After attacking, discard the drawn card, your charges and the defending knight's charges.
    
A knight loses at 0 lifepoints. The last knight standing wins.

## License

The source code is licensed under the
[GNU General Public License v3.0 or later](https://www.gnu.org/licenses/gpl-3.0.html).

Copyright (C) 2026 TheWatermelon.