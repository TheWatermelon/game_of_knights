class InputController {
    constructor(view, game) {
        this.view = view;
        this.game = game;

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

    // handleChoosePlayerClick: trigger an action based on the chosen player
    handleChoosePlayerClick(point) {
        for (let p=0; p < this.game.players.length; p++) {
			if(!this.game.players[p].isDead()) {
				const pBox = this.game.players[p].box;
				// Click on a player
				if (this.isPointInBox(point, pBox)) {
                    this.game.setSelectedPlayer(p);

					switch (this.game.getState()) {
                        case GameState.ATTACK:
                            this.game.attack();
                            break;

                        case GameState.SHIELD:
                            this.game.changeShield();
                            break;

                        case GameState.CHARGE:
                            this.game.charge();
                            break;
                    }

                    this.game.setSelectedPlayer(-1);
                    this.game.setState(GameState.TABLE);
				}
			}
		}
    }
}