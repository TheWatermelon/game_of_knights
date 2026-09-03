const GameState = Object.freeze({
    TABLE: "view:table",
    ATTACK_VIEW: "view:attack",

    CHOOSE_ACTION: "action:choose",
    ATTACK: "action:attack",
    SHIELD: "action:shield",
    CHARGE: "action:charge",

    MAIN_MENU: "menu:main",
    GAME_OVER: "menu:game over"
});

const DECK = Object.freeze(CardManager.createDeck());

class Player {
    constructor(name, color) {
        this.name = name;

        this.hp = []; // health points, between 1 and 3 cards
        this.shield = []; // shield, actually one card
        this.charge = []; // charge, [0;x] cards
    }

    // getHpTotal: returns the total value of this player hp cards
    getHpTotal() {
        return CardManager.getTotal(this.hp);
    }

    // hasCharge: return true if this player has at least one charge
    hasCharge() {
        return (this.charge.length > 0);
    }

    // isDead: returns true if this player has no hp
    isDead() {
        return this.getHpTotal() === 0;
    }
}

const CardManager = {
    // createDeck: creates a deck of 52 cards as a Map
    createDeck() {
        const deck = new Map();
        const suits = ["♣", "♥", "♠", "◆"];

        for (let color = 0; color < suits.length; color++) {
            for (let value = 1; value <= 13; value++) {
                const id = color * 13 + value;

                deck.set(id, {
                    id,
                    value,
                    color,
                    suit: suits[color]
                });
            }
        }

        return deck;
    },

    // get: get a card {id, value, color, suit} from its id
    get(id) {
        const card = DECK.get(id);

        if (!card) {
            throw new Error(`Unknown card id: ${id}`);
        }

        return card;
    },

    // getValue: get card value from its id
    getValue(id) {
        return this.get(id).value;
    },

    getCardColorIndex(id) {
        return this.get(id).color;
    },

    // getName: get the value and color of a card from its id
    getName(id) {
        const card = this.get(id);
        return `${card.value} ${card.suit}`;
    },

    // getTotal: get total value of cards
    getTotal(cards) {
        return cards.reduce(
            (total, cardId) => total + this.getValue(cardId),
            0
        );
    },

    // getTopCard: return the last card of a pile
    getTopCard(cards) {
        return cards[cards.length-1];
    },

    // shuffle: Fisher-Yates Shuffle
    shuffle(cards) {
        let counter = cards.length;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            let index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            let temp = cards[counter];
            cards[counter] = cards[index];
            cards[index] = temp;
        }
        return cards;
    },

    // if draw pile is empty, shuffle the discard pile into a new draw pile
    refreshDrawPile(drawPile, discardPile) {
        if (drawPile.length === 0) {
            this.move(discardPile, drawPile);
            this.shuffle(drawPile);
        }
        return drawPile;
    },

    // move: moves a card from a pile to another, if no cardId is specified, take the first one
    move(from, to, cardId = this.getTopCard(from)) {
        const index = from.indexOf(cardId);
        
        if (index === -1) { return false; } // cannot move an unknown card

        const [card] = from.splice(index, 1);
        to.push(card);

        return card;
    },

    // generatePairsFrom: generate a list of unique pairs from a given value
    generatePairsFrom(value) {
        let pairs = [];
        // unique pairs means we stop at half the value
        for (let k = 1; k <= value / 2; k++) {
            // each pair must contain value-compatible cards (value from 1 to 13)
            if (value - k <= 13) {
                pairs.push([k,value-k]);
            }
        }
        return pairs;
    },

    // findReplacementCardIn: return a matching card from the pile based on value; -1 if no card found
    findReplacementCardIn(pile, value) {
        for (let c = 0; c < pile.length; c++) {
            if(this.getValue(pile[c]) === value) return pile[c];
        }
        return -1;
    },

    // findReplacementCardFor: search discardPile and drawPile for a card matching the value
    findReplacementCardFor(value, drawPile, discardPile) {
        let replacementCard = findReplacementCardIn(discardPile, value);
        return replacementCard < 0 ? [drawPile, findReplacementCardIn(drawPile, value)] : [discardPile, replacementCard];
    }
};

class Game {
    constructor() {        
        this.drawPile = [];
        this.discardPile = [];

        this.players = [];
        this.activePlayerIndex = 0;
        this.selectedPlayerIndex = -1;

        this.state = GameState.MAIN_MENU;
    }

    // init game
    initGameFor(numberOfPlayers, playersName=[]) {
        // init card piles
        this.drawPile = Array.from({ length: 52 }, (_, index) => index + 1);
        CardManager.shuffle(this.drawPile);
        this.discardPile = [];

        // init players
        this.players = [];
        this.activePlayerIndex = 0;
        this.selectedPlayerIndex = -1;

        for(let p = 0; p < numberOfPlayers; p++) {
            let newP = new PlayerOnCanvas(playersName[p], PLAYERS_COLORS[p], p);
            
            // distribute three cards to this player
            CardManager.move(drawPile, newP.hp);
            CardManager.move(drawPile, newP.hp);
            CardManager.move(drawPile, newP.shield);
            // add the new player to players list
            this.players.push(newP);
        }
    }

    setState(state) {
        this.state = state;
    }

    getState() {
        return this.state;
    }

    getActivePlayer() {
        return this.players[this.activePlayerIndex];
    }

    setSelectedPlayer(playerIndex) {
        this.selectedPlayerIndex = playerIndex;
    }

    getSelectedPlayer() {
        return this.players[this.selectedPlayerIndex];
    }

    emptyPlayer(player) {
        while (player.hp.length > 0) {
            CardManager.move(player.hp, this.discardPile);
        }
    }

    changeShield(player=this.getSelectedPlayer()) {
        CardManager.move(player.shield, this.discardPile);
        CardManager.move(this.drawPile, player.shield);
    }

    charge(player=this.getSelectedPlayer()) {
        CardManager.move(this.drawPile, player.charge);
    }

    attack(attackingPlayer=this.getActivePlayer(), defendingPlayer=this.getSelectedPlayer()) {
        // totalAttack is the sum of the first card from the drawPile and potential charges
	    let totalAttack = CardManager.getValue(CardManager.getTopCard(this.drawPile));
	    totalAttack += CardManager.getTotal(attackingPlayer.charge);

	    // get shield value to find if the attack goes through
	    const shieldValue = CardManager.getTotal(defendingPlayer.shield);

        if (totalAttack > shieldValue) {
            // losingPoints are remaining points after shield absorption
            const losingPoints = totalAttack - shieldValue;

            // remainingHp is the remaining health points
            const totalHp = CardManager.getTotal(defendingPlayer.hp);
            const remainingHp = Math.max(0, totalHp - losingPoints);
            // if remainingHp is zero, that player loses the game, discarding their cards
            if (remainingHp <= 0) {
                this.emptyPlayer(defendingPlayer);
            } else {
                // try replacing only one card to match the new hp
                let replacementValue = 0;
                for (let i = 0; i < defendingPlayer.hp.length; i++) {
                    replacementValue = getCardValue(defendingPlayer.hp[i]) - losingPoints;

                    // if replacementValue can be a card
                    if (replacementValue >= 1 && replacementValue <= 13) {
                        // discard one card from defending player hp
                        let lostHpCardSpr = getSpriteCoordFor(defendingPlayer.hp[i]);
                        let lostHpCardPos = {
                            x:defendingPlayer.hpCardsPos.x + i*71.5,
                            y:defendingPlayer.hpCardsPos.y
                        };
                        //animateCard(lostHpCardSpr, lostHpCardPos, discardPile, 200);
                        //totalAnimationDuration += 200;
                        setTimeout(() => moveCard(defendingPlayer.hp, discardPile, defendingPlayer.hp[i]), totalAnimationDuration);
                        break;
                    }
                }
                // one card isn't enough
                if (replacementValue <= 0) {
                    // discard all defendingPlayer hp
                    for (let hpCard = defendingPlayer.hp.length - 1; hpCard >= 0; hpCard--) {
                        let hpCardsPosOffset = {
                            x:defendingPlayer.hpCardsPos.x + hpCard*71.5,
                            y:defendingPlayer.hpCardsPos.y
                        };
                        //let hpCardSpr = getSpriteCoordFor(defendingPlayer.hp[hpCard]);
                        //setTimeout(() => animateCard(hpCardSpr, hpCardsPosOffset, discardPilePos, 200), totalAnimationDuration);
                        //totalAnimationDuration += 200;
                        setTimeout(() => moveCard(defendingPlayer.hp, discardPile, defendingPlayer.hp[hpCard]), totalAnimationDuration);
                    }
                    replacementValue = remainingHp;
                }

                // find replacement card(s)
                let replacementCards = [];
                // search for a card in discardPile / drawPile
                const replacementCard = findReplacementCardFor(replacementValue);
                // replacement card hasn't been found in either discardPile or drawPile, we need to search for a pair of cards
                if (replacementCard[1] < 0) {
                    const pairs = generatePairsFrom(replacementValue);
                    for (let p = 0; p < pairs.length; p++) {
                        const firstCard = findReplacementCardFor(pairs[p]);
                        const secondCard = findReplacementCardFor(pairs[p]);
                        // this pair is a fit replacement
                        if (firstCard[1] > 0 && secondCard[1] > 0) {
                            replacementCards.push(firstCard);
                            replacementCards.push(secondCard);
                            break;
                        }
                    }
                } else {
                    replacementCards.push(replacementCard);
                }
                
                // add replacement card(s) to defendingPlayer hp
                for (let c = 0; c < replacementCards.length; c++) {
                    let replacementCardSpr = getSpriteCoordFor(replacementCards[c][1]);
                    let replacementCardPos = {
                        x:defendingPlayer.hpCardsPos.x + c*71.5,
                        y:defendingPlayer.hpCardsPos.y
                    };
                    //animateCard(replacementCardSpr, discardPilePos, replacementCardPos, 200);
                    //totalAnimationDuration += 200;
                    setTimeout(() => moveCard(replacementCards[c][0], defendingPlayer.hp, replacementCards[c][1]), totalAnimationDuration);
                }

            }
        }

        while (defendingPlayer.hasCharge()) {
			CardManager.move(defendingPlayer.charge, this.discardPile);
			defendingPlayer.showCharge.pop();
		}

        while (attackingPlayer.hasCharge()) {
            CardManager.move(attackingPlayer.charge, this.discardPile)
        }

        CardManager.move(this.drawPile, this.discardPile);
    }

    nextPlayer() {
        // cycle through players
        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
        // skip "dead" player
        while (CardManager.getTotal(this.getActivePlayer().hp) === 0) {
            this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
        }
    }
}