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

    // get: get a card {id, value, color, suit} from its id in a specified deck
    get(deck, id) {
        const card = deck.get(id);

        if (!card) {
            throw new Error(`Unknown card id: ${id}`);
        }

        return card;
    },

    // getValue: get card value from its id in a specified deck
    getValue(deck, id) {
        return this.get(deck, id).value;
    },

    // getName: get the value and color of a card from its id in a specified deck
    getName(deck, id) {
        const card = this.get(deck, id);
        return `${card.value} ${card.suit}`;
    },

    // getTotal: get total value of cards in a specified deck
    getTotal(deck, cards) {
        return cards.reduce(
            (total, cardId) => total + this.getValue(deck, cardId),
            0
        );
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

    // move: moves a card from a pile to another, if no cardId is specified, take the first one
    move(from, to, cardId = from[0]) {
        const index = from.indexOf(cardId);

        if (index === -1) {
            return false;
        }

        const [card] = from.splice(index, 1);
        to.push(card);

        return card;
    }
};