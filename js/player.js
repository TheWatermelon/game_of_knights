class Player {
    constructor(name, color) {
        this.name = name;
        this.color = color;

        this.hp = [];
        this.shield = [];
        this.charge = [];

        this.isDead = false;
        this.showHp = true;
        this.showCharge = [];
        this.showAttack = false;

        this.box = null;
        this.hpCardsPos = null;
        this.shieldCardPos = null;
        this.chargeCardPos = null;
        this.attackCardPos = null;
    }

    // getHpTotal: returns the total value of this player hp cards
    getHpTotal(deck) {
        return CardManager.getTotal(deck, this.hp);
    }

    // isDead: returns true if this player has no hp
    isDead(deck) {
        return this.getHpTotal(deck) === 0;
    }
}