/*
 * Game of Knights
 * Copyright (C) 2026 TheWatermelon
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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

	getName() {
		return "STUB bot";
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

// RandomBot: self explainatory
class RandomBot extends BotController {
	getName() { return "Random bot"; }

	chooseAction() {
		const randInt = Math.floor((Math.random() * 3) + 1);

		switch(randInt) {
			case 1:
				return GameState.ATTACK;
			
			case 2:
				return GameState.SHIELD;

			case 3:
				return GameState.CHARGE;
		}
		// failsafe
		return GameState.ATTACK;
	}

	chooseTarget() {
		const targets = this.game.players.filter(player => !player.isDead());
		const randPlayerIndex = Math.floor(Math.random() * targets.length);

		return targets[randPlayerIndex];
	}
}

// AgressiveBot: will always attack, and will choose the most vulnerable opponent
class AggressiveBot extends BotController {
    getName() { return "Aggressive bot"; }

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
    getName() { return "Safe bot"; }

	chooseAction() {
        const activePlayer = this.game.getActivePlayer();
        
        if (CardManager.getValue(activePlayer.getShield()) < 10) {
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

// StrategicBot: first get good shield (greater than 7)
// if they have a good shield, will change the opponents' best shield if greater than 7
// else attack the opponent with the lowest shield
// will attack the strongest opponent if they have a charge
class StrategicBot extends BotController {
	getName() { return "Strategic bot"; }

	chooseAction() {
		const activePlayer = this.game.getActivePlayer();

		if (CardManager.getValue(activePlayer.getShield()) < 8) {
			return GameState.SHIELD;
		} else if (activePlayer.hasCharge()) {
			return GameState.ATTACK;
		} else {
			const opponents = this.getOpponents();
			const lastOppIndex = opponents.length - 1;

			const strongerOpponent = opponents.sort((a, b) =>
				CardManager.getValue(a.getShield()) - CardManager.getValue(b.getShield())
			)[lastOppIndex];

			if (CardManager.getValue(strongerOpponent.getShield()) > 7) {
				return GameState.SHIELD;
			} else {
				return GameState.ATTACK;
			}
		}
	}

	chooseTarget() {
		const activePlayer = this.game.getActivePlayer();

		if (CardManager.getValue(activePlayer.getShield()) < 8) {
			return activePlayer;
		} else {
			const opponents = this.getOpponents();
			const lastOppIndex = opponents.length - 1;

			const sortedOpponentsByShield = opponents.sort((a, b) =>
				CardManager.getValue(a.getShield()) - CardManager.getValue(b.getShield())
			);
			const strongerOpponent = sortedOpponentsByShield[lastOppIndex];
			const weakerOpponent = sortedOpponentsByShield[0];

			if (CardManager.getValue(strongerOpponent.getShield()) > 7 || activePlayer.hasCharge()) {
				return strongerOpponent;
			} else {
				return weakerOpponent;
			}
		}
	}
}

// PoliticsBot: if they have multiple opponents, will charge the next in line only once
// else they will act like SafeBot
class PoliticsBot extends BotController {
	constructor(game, inputController) {
		super(game, inputController);
		this.safeBot = new SafeBot(game, inputController);
	}

	getName() { return "Politics bot"; }

	chooseAction() {
		const opponents = this.getOpponents();
		const nextPlayerIndex = this.game.getNextPlayerIndex();

		if (opponents.length > 1 && !this.game.players[nextPlayerIndex].hasCharge()) { return GameState.CHARGE; }
		else { return this.safeBot.chooseAction(); }
	}

	chooseTarget() {
		if (this.game.getState() === GameState.CHARGE) {
			const nextPlayerIndex = this.game.getNextPlayerIndex();
			return this.game.players[nextPlayerIndex];
		} else {
			return this.safeBot.chooseTarget();
		}
	}
}
