class BotController {
    constructor(game, inputController) {
        this.game = game;
        this.inputController = inputController;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getOpponents() {
        const activePlayer = this.game.getActivePlayer();

        return this.game.players.filter(player =>
            player !== activePlayer && !player.isDead()
        );
    }

    chooseAction() {
        // STUB
    }

    chooseTarget() {
        // STUB
    }

    async playTurn() {
        await this.sleep(500);

        this.game.setState(GameState.CHOOSE_ACTION);

        await this.sleep(1000);

        const action = this.chooseAction();
        this.game.setState(action);

        await this.sleep(500);

        const target = this.chooseTarget();

        if (!target) {
            return;
        }

        this.game.setSelectedPlayerIndex(
            this.game.players.indexOf(target)
        );

        await this.inputController.triggerAction();
    }
}

// AgressiveBot: will always attack, and will choose the most vulnerable opponent
class AggressiveBot extends BotController {
    chooseAction() {
        return GameState.ATTACK;
    }

    chooseTarget() {
        const targets = this.getOpponents();

        // Pick the opponent with the lowest shield
        return targets.sort((a, b) =>
            CardManager.getTotal(a.shield) - CardManager.getTotal(b.shield)
        )[0];
    }
}

// SafeBot: will choose a better shield before attacking the player with the lowest hp
class SafeBot extends BotController {
    chooseAction() {
        const activePlayer = this.game.getActivePlayer();
        
        if (CardManager.getValue(activePlayer.getShield()) < 9) {
            return GameState.SHIELD;
        } else {
            return GameState.ATTACK;
        }
    }

    chooseTarget() {
        switch (this.game.getState()) {
            case GameState.ATTACK:
                const targets = this.getOpponents();

                // Pick the opponent with the lowest hp
                return targets.sort((a, b) =>
                    a.getHpTotal() - b.getHpTotal()
                )[0];

            case GameState.SHIELD:
                return this.game.getActivePlayer();
        }
    }
}