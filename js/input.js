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

class InputController {
    constructor(view, animationManager, game) {
        this.view = view;
        this.animationManager = animationManager;
        this.game = game;

        this.botController = new SafeBot(this.game, this);

        this.view.canvas.addEventListener("click", event => {
            this.handleClick(event);
        });
    }

    getCanvasPoint(event) {
        const rect = this.view.canvas.getBoundingClientRect();

        return {
            x:(event.clientX - rect.left) *
                (this.view.canvas.width / rect.width),

            y:(event.clientY - rect.top) *
                (this.view.canvas.height / rect.height)
        };
    }

    // check if a point {x,y} is in a box {x1, y1, x2, y2}
    isPointInBox(point, box) {
	    return (point.x >= box.x1 && 
            point.x <= box.x2 &&
            point.y >= box.y1 &&
            point.y <= box.y2);
    }

    handleClick(event) {
        const point = this.getCanvasPoint(event);

        switch (this.game.getState()) {
            case GameState.MAIN_MENU:
                this.handleMainMenuClick(point);
                break;

            case GameState.TABLE:
                this.handleTableClick(point);
                break;

            case GameState.CHOOSE_ACTION:
                this.handleActionClick(point);
                break;

            case GameState.ATTACK:
                this.handleChoosePlayerClick(point);
                break;

            case GameState.SHIELD:
                this.handleChoosePlayerClick(point);
                break;

            case GameState.CHARGE:
                this.handleChoosePlayerClick(point);
                break;

            case GameState.GAME_OVER:
                this.game.setState(GameState.MAIN_MENU);
                break;
        }
    }

    // handleMainMenuClick: start the game if we click on a button
    handleMainMenuClick(point) {
        // Check if we click on one of the boxes with the number of players
		for (let b = 0; b < this.view.mainMenuScreenChoosePlayersBoxes.length; b++) {
			if (this.isPointInBox(point, this.view.mainMenuScreenChoosePlayersBoxes[b])) {
				// Init the game with 2-4 players depending on the box we clicked on
				this.game.initGameFor(b+2, ["Player 1", "Player 2", "Player 3", "Player 4"]);
				// Show the game table
				this.game.setState(GameState.TABLE);
				return;
			}
		}
    }

    // handleTableClick: show actions if we click on the draw pile
    handleTableClick(point) {
        const drawPileBox = {
            x1: DRAW_PILE_POS.x,
            y1: DRAW_PILE_POS.y,
            x2: DRAW_PILE_POS.x + CARD_SIZE_CANVAS.width,
            y2: DRAW_PILE_POS.y + CARD_SIZE_CANVAS.height
        };
		if (this.isPointInBox(point, drawPileBox)) {
            this.game.setState(GameState.CHOOSE_ACTION);
        }
    }

    // handleActionClick: trigger an action if we clicked on its icon
    handleActionClick(point) {
        const attackBox = {
            x1: ATTACK_ICON_POS.x,
            y1: ATTACK_ICON_POS.y,
            x2: ATTACK_ICON_POS.x + ATTACK_SPR.w / 2 + 150,
            y2: ATTACK_ICON_POS.y + ATTACK_SPR.h / 2
        };
		const changeShieldBox = {
            x1: SHIELD_ICON_POS.x,
            y1: SHIELD_ICON_POS.y,
            x2: SHIELD_ICON_POS.x + SHIELD_SPR.w / 2 + 200,
            y2: SHIELD_ICON_POS.y + SHIELD_SPR.h / 2
        };
		const chargeBox = {
            x1: CHARGE_ICON_POS.x,
            y1: CHARGE_ICON_POS.y,
            x2: CHARGE_ICON_POS.x + CHARGE_SPR.w / 2 + 170,
            y2: CHARGE_ICON_POS.y + CHARGE_SPR.h / 2
        };

		if (this.isPointInBox(point, attackBox)) { this.game.setState(GameState.ATTACK); }
		else if (this.isPointInBox(point, changeShieldBox)) { this.game.setState(GameState.SHIELD); }
		else if (this.isPointInBox(point, chargeBox)) { this.game.setState(GameState.CHARGE); }
    }

    async attackAction() {
        let attackingPlayer = this.game.getActivePlayer();
        let defendingPlayer = this.game.getSelectedPlayer();
        const losingPoints = this.game.attackGoesThrough(attackingPlayer, defendingPlayer);
        
        /*
        * ANIMATION 1 : bring charge from player box to front of defender's shield
        */
        let attackCardPos = defendingPlayer.getAttackCardPos();
        // start from attacking player charge pos
        let currentChargeCardPos = attackingPlayer.getChargeCardPos();
        const chargeCount = attackingPlayer.charge.length;
        const lastChargeIndex = chargeCount - 1;

        if (chargeCount > 0) {
            // we only need the last charge spr for the animation
            const lastChargeSpr = this.view.getSpriteCoordFor(CardManager.getTopCard(attackingPlayer.charge));
            // go next to the attacking card in front of defending player
            let nextChargeCardPos = this.view.copyPosition(attackCardPos);
            nextChargeCardPos.x += 50;

            for (let c = 0; c < chargeCount; c++) {
                // move the last charge
                await this.animationManager.add(
                    lastChargeSpr,
                    currentChargeCardPos,
                    nextChargeCardPos,
                    200
                );
                // show the charge behind the last charge
                attackingPlayer.setShowCharge(c, true);
                // update current pos
                currentChargeCardPos = this.view.copyPosition(nextChargeCardPos);
                // move next pos
                nextChargeCardPos.x += 20;
            }
            await this.view.sleep(200);
        }

        /*
        * ANIMATION 2 : bring top card (attack card) in front of defending player's shield
        */
        const attackCardSpr = this.view.getSpriteCoordFor(CardManager.getTopCard(this.game.drawPile));
        await this.animationManager.add(
            attackCardSpr,
            TOP_CARD_POS,
            attackCardPos,
            200
        );
        
        // showAttack tells the render to keep showing the attackCard and attack charges
        attackingPlayer.showAttack = true;

        if (losingPoints > 0) {
            /*
            * ANIMATION 3 : blink defendingPlayer hp
            */
            await this.view.blinkPlayer(defendingPlayer, 400);

            const remainingHp = this.game.getRemainingHpAfterAttack(defendingPlayer, losingPoints);
            if (remainingHp > 0)  {
                const cardsToChange = this.game.changeHpFor(defendingPlayer, losingPoints, remainingHp);
                // discard old hp cards
                for (let i = 0; i < cardsToChange["oldHp"].length; i++) {
                    CardManager.move(cardsToChange["oldHp"][i][0], this.game.discardPile, cardsToChange["oldHp"][i][1]);
                }
                // put new hp cards into defendingPlayer hp
                for (let j = 0; j < cardsToChange["newHp"].length; j++) {
                    CardManager.move(cardsToChange["newHp"][j][0], defendingPlayer.hp, cardsToChange["newHp"][j][1]);
                }
            } else { // defendingPlayer lost all their hp
                this.game.discardPlayerHp(defendingPlayer);
            }
        }

        /*
        * ANIMATION 4 : discard attacking charge
        */
        if (chargeCount > 0) {
            // we only animate the last charge
            const lastChargeSpr = this.view.getSpriteCoordFor(CardManager.getTopCard(attackingPlayer.charge));
            let nextChargeCardPos = this.view.copyPosition(currentChargeCardPos);;

            for (let c = 0; c < chargeCount; c++) {
                // move the last charge
                await this.animationManager.add(
                    lastChargeSpr,
                    currentChargeCardPos,
                    nextChargeCardPos,
                    200
                );

                // hide charge behind top charge
                let hidingCharge = lastChargeIndex - c;
                attackingPlayer.setShowCharge(hidingCharge, false);

                // update current charge pos
                currentChargeCardPos.x = nextChargeCardPos.x;
                //get next position
                nextChargeCardPos.x -= 20;
            }

            // discard last charge
            await this.animationManager.add(
                lastChargeSpr,
                currentChargeCardPos,
                DISCARD_PILE_POS,
                200
            );
        }

        // discard player charges
        this.game.discardPlayerCharge(defendingPlayer);
        defendingPlayer.emptyShowCharge();
        this.game.discardPlayerCharge(attackingPlayer);
        attackingPlayer.emptyShowCharge();

        // showAttack tells the render to keep showing the attackCard and attack charges
        attackingPlayer.showAttack = false;

        /*
        * ANIMATION 5 : tilt the attack card (bouncing from the shield)
        */
        const tiltedAttackCardPos = {
            x: attackCardPos.x - 15,
            y: (defendingPlayer.box.y1 < 300) ? attackCardPos.y + 50 : attackCardPos.y - 50,
            degrees: 45
        }
        await this.animationManager.add(
            attackCardSpr,
            attackCardPos,
            tiltedAttackCardPos,
            200
        );
        attackCardPos = this.view.copyPosition(tiltedAttackCardPos);
        /*
        * ANIMATION 6 : discard attack card
        */
        await this.animationManager.add(
            attackCardSpr,
            attackCardPos,
            DISCARD_PILE_POS,
            300
        );

        // discard top card
        CardManager.move(this.game.drawPile, this.game.discardPile);
    }

    async changeShieldAction() {
        const topCardId = CardManager.getTopCard(this.game.drawPile);
        const topCardSpr = this.view.getSpriteCoordFor(topCardId);
        const shieldCardId = this.game.getSelectedPlayer().getShield();
        const shieldCardSpr = this.view.getSpriteCoordFor(shieldCardId);
        const shieldCardPos = this.game.getSelectedPlayer().getShieldCardPos();

        let buffer = [];
        CardManager.move(this.game.getSelectedPlayer().shield, buffer);

        await this.animationManager.add(
            shieldCardSpr,
            shieldCardPos,
            DISCARD_PILE_POS,
            200
        );

        CardManager.move(buffer, this.game.discardPile);

        await this.animationManager.add(
            topCardSpr,
            TOP_CARD_POS,
            shieldCardPos,
            200
        );

        CardManager.move(this.game.drawPile, this.game.getSelectedPlayer().shield);
    }

    async chargeAction() {
        await this.animationManager.add(
            CARD_FACE_DOWN_SPR,
            TOP_CARD_POS,
            this.game.getSelectedPlayer().getChargeCardPos(),
            200
        );
        this.game.charge();
        this.game.getSelectedPlayer().showCharge.push(false);
    }

    // triggerAction: trigger an action based on the chosen player
    async triggerAction() {
        // do the corresponding action
        switch (this.game.getState()) {
            case GameState.ATTACK:
                this.game.setState(GameState.ATTACK_VIEW);
                await this.attackAction();
                break;

            case GameState.SHIELD:
                await this.changeShieldAction();
                break;

            case GameState.CHARGE:
                await this.chargeAction();
                break;
        }
        this.game.nextPlayer();
        // win condition check
        if (this.game.checkHasPlayerWon()) {
            this.game.setState(GameState.GAME_OVER);
        } else {
            await this.startTurn();
        }
    }

    // handleChoosePlayerClick: trigger an action based on the chosen player
    handleChoosePlayerClick(point) {
        for (let p=0; p < this.game.players.length; p++) {
			if(!this.game.players[p].isDead()) {
				const pBox = this.game.players[p].box;
				if (this.isPointInBox(point, pBox)) {
				    // click on a player, set as the selected player
                    this.game.setSelectedPlayerIndex(p);
                    this.triggerAction();
				}
			}
		}
    }

    async startTurn() {
        const player = this.game.getActivePlayer();
        
        this.game.setState(GameState.TABLE);

        if (player.isBot) {
            await this.botController.playTurn();
        }
    }
}