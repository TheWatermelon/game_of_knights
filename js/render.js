const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PLAYERS_COLORS = [
    "lightsalmon",
    "olivedrab",
    "skyblue",
    "thistle"
];

const PLAYERS_ORDER = Object.freeze({
    BOTTOM_LEFT: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_RIGHT: 3
});

// size of a card in the sprites
const CARD_SIZE_SPR = Object.freeze({
    width: 117,
    height: 156
});

// position of the faced down card in the sprites
const CARD_FACE_DOWN_SPR = Object.freeze({
    x: 1765,
    y: 26,
    w: CARD_SIZE_SPR.width,
    h: CARD_SIZE_SPR.height
});

// position of the attack sprite
const ATTACK_SPR = Object.freeze({
    x: 1765,
    y: 208,
    w: 115,
    h: 116
});

// position of the shield sprite
const SHIELD_SPR = Object.freeze({
    x: 1770,
    y: 378,
    w: 108,
    h: 120
});

// position of the charge sprite
const CHARGE_SPR = Object.freeze({
    x: 1786,
    y: 542,
    w: 78,
    h: 128
});

// size of a displayed card on canvas
const CARD_SIZE_CANVAS = Object.freeze({
    width: CARD_SIZE_SPR.width / 2,
    height: CARD_SIZE_SPR.height / 2
});

// discard card position on the canvas
const DISCARD_PILE_POS = Object.freeze({
    x: 400 - CARD_SIZE_CANVAS.width,
    y: 300 - CARD_SIZE_CANVAS.height / 2,
    degrees: 0
});

// draw pile position on the canvas
const DRAW_PILE_POS = Object.freeze({
    x: 410,
    y: 300 - CARD_SIZE_CANVAS.height / 2,
    degrees: 0
});

// top card slightly shifted from draw pile
const TOP_CARD_POS = Object.freeze({
    x: DRAW_PILE_POS.x + 5,
    y: DRAW_PILE_POS.y - 5,
    degrees: 0
});

// position of the attack icon on canvas
const ATTACK_ICON_POS = Object.freeze({x: 485, y: 210});

// position of the shield icon on canvas
const SHIELD_ICON_POS = Object.freeze({x: 505, y: 268});

// position of the charge icon on canvas
const CHARGE_ICON_POS = Object.freeze({x: 490, y: 328});

class PlayerOnCanvas extends Player {
    constructor(name, color, order) {
        super(name);

        this.color = color;
        this.order = order;
        this.box = this.getBox();

        this.showHp = true; 
        this.showCharge = []; 
        this.showAttack = false; 

        this.hpCardsPos = this.getHpCardsPos();
        this.shieldCardPos = this.getShieldCardPos();
        this.chargeCardPos = this.getChargeCardPos();
        this.attackCardPos = this.getAttackCardPos();
    }

    // getBox: returns player box as {x1, y1, x2, y2} based on player order
    getBox() {
        // create player box
        let offset = {x:0, y:0};
        offset.x = (this.order === PLAYERS_ORDER.BOTTOM_LEFT || this.order === PLAYERS_ORDER.TOP_LEFT) ? 50 : 450;
        offset.y = (this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? 0 : 400;
        const pBox = {
            x1: offset.x,
            y1: offset.y,
            x2: offset.x+250,
            y2: offset.y+200
        };
        return pBox;
    }

    // getHpCardsPos: returns pos as {x, y} for the first hp card
    getHpCardsPos() {
        const hpCardsPos = {
            x: this.box.x1+40, 
            y: ((this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? this.box.y1 + 10 : this.box.y1 + 112),
            degrees: 0
        };
        return hpCardsPos;
    }

    // getShieldCardPos: returns pos as {x, y, degrees} for the shield card
    getShieldCardPos() {
        const shieldCardPos = {
            x: this.box.x1 + 105 - CARD_SIZE_CANVAS.width/2,
            y: ((this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? this.box.y1 + 98 : this.box.y1 + 24),
            degrees: 90
        };
        return shieldCardPos;  
    }

    // getChargeCardPos: returns pos as {x, y, degrees} for the face down charge
    getChargeCardPos() {
        const chargeCardPos = {
            x: this.box.x1 + 180,
            y: ((this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? 24 : this.box.y1 + 98),
            degrees: 0
        };
        return chargeCardPos;            
    }

    // getAttackCardPos: returns pos as {x, y, degrees} for the attacking card in front of player shield
    getAttackCardPos() {
        const attackCardPos = {
		    x: this.box.x1 + 50, 
		    y: ((this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? this.box.y2 - 75 : this.box.y1 - 15), 
		    degrees:0
	    };
        return attackCardPos;
    }
}

class AnimationManager {
    constructor() {
        this.animations = [];
    }

    update(deltaTime) {
        for (const animation of this.animations) {
            animation.elapsed += deltaTime;
        }

        this.animations = this.animations.filter(
            animation => animation.elapsed < animation.duration
        );
    }

    drawAsync(render) {
        // STUB
    }
}

class CardAnimationManager extends AnimationManager {
    add(cardSprite, source, destination, duration) {
        return new Promise(resolve => {
            this.animations.push({
                cardSprite,
                source,
                destination,
                duration,
                elapsed: 0,
                resolve
            });
        });
    }

    update(deltaTime) {
        for (const animation of this.animations) {
            animation.elapsed += deltaTime;
        }

        const finished = this.animations.filter(
            animation => animation.elapsed >= animation.duration
        );

        for (const animation of finished) {
            animation.resolve();
        }

        this.animations = this.animations.filter(
            animation => animation.elapsed < animation.duration
        );
    }

    draw(renderer) {
        for (const animation of this.animations) {
            const progress = Math.min(
                animation.elapsed / animation.duration,
                1
            );

            const position = {
                x: animation.source.x +
                    (animation.destination.x - animation.source.x) * progress,

                y: animation.source.y +
                    (animation.destination.y - animation.source.y) * progress,

                degrees: animation.source.degrees +
                    (animation.destination.degrees -
                     animation.source.degrees) * progress
            };

            renderer.drawCard(animation.cardSprite, position, position.degrees);
        }
    }
}

class Renderer {
    constructor(game) {
        // Canvas
        this.canvas = document.getElementById('myCanvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.context = this.canvas.getContext('2d');
        this.context.font = "20px serif";

        // Game sprite
        this.spr = new Image();
        this.spr.isGameSpriteReady = false;
        this.spr.onload = () => {
            this.isGameSpriteReady = true;
            console.log("Sprites loaded");
        };
        this.spr.onerror = () => {
            console.error("Could not load sprites: ", this.spr.src);
        };
        this.spr.src = "resources/sprites.png";

        // Main menu screen
        this.mainMenuScreen = new Image();
        this.isMainMenuScreenReady = false;
        this.mainMenuScreen.onload = () => {
            this.isMainMenuScreenReady = true;
            console.log("Main menu screen loaded");
        };
        this.mainMenuScreen.onerror = () => {
            console.error("Could not load screen: ", this.mainMenuScreen.src);
        };
        this.mainMenuScreen.src = "resources/main_menu.png";
        this.mainMenuScreenChoosePlayersBoxes = [
            {x1: 51, y1: 513, x2: 266, y2: 586},
            {x1: 286, y1: 513,x2: 515, y2: 586},
            {x1: 532,y1: 513,x2: 747, y2: 586}
        ];

        // Game over screen
        this.victoryScreen = new Image();
        this.isVictoryScreenReady = false;
        this.victoryScreen.onload = () => {
            this.isVictoryScreenReady = true;
            console.log("Game over screen loaded");
        };
        this.victoryScreen.onerror = () => {
            console.error("Could not load screen: ", this.victoryScreen.src);
        };
        this.victoryScreen.src = "resources/victory_screen.png";

        this.logEntries = [];

        this.game = game;
    }

    // get coords as {x, y} of a card from its index
    getSpriteCoordFor(cardId) {
        const cardValue = CardManager.getValue(cardId);
        const cardColorIndex = CardManager.getCardColorIndex(cardId);
        const cardSpritePos = {
            x: 37 + 133 * (cardValue - 1),
            y: 26 + 170 * cardColorIndex
        };
        return cardSpritePos;
    }

    // showHelp: show the rules of the game
    showHelp(show) {
        const rulesDiv = document.getElementById("rules");	
        rulesDiv.style.display = show ? "block" : "none";
    }

    // can draw rotated images
    drawImage(image, srcX, srcY, srcW, srcH, destX, destY, destW, destH, degrees=0){
        if (!image.complete) return;

        if (degrees === 0) {
            this.context.drawImage(image, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
        } else {
            this.context.save();
            this.context.translate(destX+destW/2, destY+destH/2);
            this.context.rotate(degrees*Math.PI/180.0);
            this.context.translate(-destX-destW/2, -destY-destH/2);
            this.context.drawImage(image, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
            this.context.restore();
        }
    }

    // draw a card from sprites (src) to canvas (dest); coords are {x, y}
    drawCard(srcCoord, destCoord, degrees=0) {
        this.drawImage(this.spr, srcCoord.x, srcCoord.y, CARD_SIZE_SPR.width, CARD_SIZE_SPR.height, destCoord.x, destCoord.y, CARD_SIZE_CANVAS.width, CARD_SIZE_CANVAS.height, degrees);
    }

    
    // draw hp
    drawHpCardsFor(player) {
        if (player.showHp && player.hp.length > 0) {
            let hpCardsPosOffset = {
                x: player.hpCardsPos.x,
                y: player.hpCardsPos.y
            };
            for (let hpCard = 0; hpCard < player.hp.length; hpCard++) {
                const hpCardCoord = this.getSpriteCoordFor(player.hp[hpCard]);
                hpCardsPosOffset.x = player.hpCardsPos.x + hpCard*71.5;
                this.drawCard(hpCardCoord, hpCardsPosOffset);
            }
        }
    }

    // draw shield for a player
    drawShieldFor(player) {
        if (player.shield.length > 0) {
            const shieldCardCoord = this.getSpriteCoordFor(CardManager.getTopCard(player.shield));
            this.drawCard(shieldCardCoord, player.shieldCardPos, player.shieldCardPos.degrees);
        }
    }

    // drawChargeFor: draw charge for a player
    // show a face down card with the number of charges written in a corner
    drawChargeFor(player) {
        if (player.charge.length === 0) { return; }
        this.drawCard(CARD_FACE_DOWN_SPR, player.chargeCardPos);
        this.context.fillStyle = "goldenrod";
        this.context.fillRect(player.chargeCardPos.x-2, player.chargeCardPos.y-2, 29, 29);
        this.context.fillStyle = "white";
        this.context.fillRect(player.chargeCardPos.x, player.chargeCardPos.y, 25, 25);
        this.context.fillStyle = "black";
        this.context.fillText(player.charge.length, player.chargeCardPos.x+7, player.chargeCardPos.y+20);
    }

    // draw cards for all players
    drawPlayers() {
        for (const player in this.game.players) {
            if (!this.game.players[player].isDead()) {
                this.drawHpCardsFor(this.game.players[player]);
                this.drawShieldFor(this.game.players[player]);
                this.drawChargeFor(this.game.players[player]);
            }
        }
    }

	// drawPlayerBox: draw a colored rectangle around a player
    drawPlayerBox(player) {
        const playerSize = {
            x: player.box.x1,
            y: player.box.y1,
            width: player.box.x2 - player.box.x1,
            height: player.box.y2 - player.box.y1
        };
        this.context.fillStyle = player.color;
        // bigger rectangle
        this.context.fillRect(playerSize.x, playerSize.y, playerSize.width, playerSize.height);
        this.context.fillStyle = "white";
        // inner rectangle
        this.context.fillRect(playerSize.x+4, playerSize.y+4, playerSize.width-8, playerSize.height-8);
        // name line
        if (player.order === PLAYERS_ORDER.BOTTOM_LEFT || player.order === PLAYERS_ORDER.BOTTOM_RIGHT) {
            this.context.fillRect(player.box.x1 + 10, player.box.y1, player.name.length * 10, 4);
        } else {
            this.context.fillRect(player.box.x1 + 10, player.box.y2 - 4, player.name.length * 10, 4);
        }
        this.context.fillStyle = "black";
        // player name
        const playerNamePos = {
            x: player.box.x1 + 15,
            y: (player.order === PLAYERS_ORDER.BOTTOM_LEFT || player.order === PLAYERS_ORDER.BOTTOM_RIGHT) ? player.box.y1 + 8 : player.box.y1 + 213
        };
        this.context.fillText(player.name, playerNamePos.x, playerNamePos.y);
    }

	// draw attack action on canvas
	drawAttackActionOnCanvas() {
		this.drawImage(this.spr, ATTACK_SPR.x, ATTACK_SPR.y, ATTACK_SPR.w, ATTACK_SPR.h, ATTACK_ICON_POS.x, ATTACK_ICON_POS.y, Math.round(ATTACK_SPR.w*0.4), Math.round(ATTACK_SPR.h*0.4));
		this.context.fillStyle = "black";
		let attackTxt = (this.game.getState() === GameState.CHOOSE_ACTION) ? "Attack" : "Which knight ?";
		this.context.fillText(attackTxt, ATTACK_ICON_POS.x + 50, ATTACK_ICON_POS.y + 30);
	}

    // draw shield action on canvas
    drawShieldActionOnCanvas() {
        this.drawImage(this.spr, SHIELD_SPR.x, SHIELD_SPR.y, SHIELD_SPR.w, SHIELD_SPR.h, SHIELD_ICON_POS.x, SHIELD_ICON_POS.y, Math.round(SHIELD_SPR.w*0.4), Math.round(SHIELD_SPR.h*0.4));
        this.context.fillStyle = "black";
        let shieldTxt = (this.game.getState() === GameState.CHOOSE_ACTION) ? "Change shield" : "Which knight ?";
        this.context.fillText(shieldTxt, SHIELD_ICON_POS.x + 50, SHIELD_ICON_POS.y + 30);
    }

    // draw charge action on canvas
    drawChargeActionOnCanvas() {
        this.drawImage(this.spr, CHARGE_SPR.x, CHARGE_SPR.y, CHARGE_SPR.w, CHARGE_SPR.h, CHARGE_ICON_POS.x, CHARGE_ICON_POS.y, Math.round(CHARGE_SPR.w*0.4), Math.round(CHARGE_SPR.h*0.4));
        this.context.fillStyle = "black";
        let chargeTxt = (this.game.getState() === GameState.CHOOSE_ACTION) ? "Charge" : "Which knight ?";
        this.context.fillText(chargeTxt, CHARGE_ICON_POS.x + 50, CHARGE_ICON_POS.y + 30);
    }

    // clean canvas
    cleanCanvas() {
        this.context.fillStyle = "white";
        this.context.fillRect(0, 0, 800, 600);
    }

    // drawPile
    drawDrawPile() {
        this.drawCard(CARD_FACE_DOWN_SPR, DRAW_PILE_POS);
    }
                
    // discardPile
    drawDiscardPile() {
        if (this.game.discardPile.length > 0) {
            const lastDiscardPileCardSprite = this.getSpriteCoordFor(CardManager.getTopCard(this.game.discardPile));
            this.drawCard(lastDiscardPileCardSprite, DISCARD_PILE_POS);
        }
    }

    // top card of the drawPile
    drawTopCard() {
        this.drawCard(CARD_FACE_DOWN_SPR, TOP_CARD_POS);
    }

    // draw attacking card in front of defender shield
    drawAttackerTopCard() {
        if (this.getActivePlayer().showAttack) {
            const topCardSpr = this.getSpriteCoordFor(CardManager.getTopCard(this.game.drawPile));
            this.drawCard(topCardSpr, this.game.getSelectedPlayer().attackCardPos);
        }
    }

    // draw attacker charges next to the attacking card in front of defender shield
    drawAttackerCharges() {
        const attackingPlayer = this.game.getActivePlayer();
        const defendingPlayer = this.game.getSelectedPlayer();
        for (let c = 0; c < attackingPlayer.charge.length; c ++) {
            if (attackingPlayer.showCharge[c] === true) {
                let chargeCardPos = {
                    x: defendingPlayer.box.x1 + 100 + c*15,
                    y: (defendingPlayer.box.y2 < 300) ? defendingPlayer.box.y2 - 75 : defendingPlayer.box.y1 - 15,
                    degrees: 0
                };
                let chargeCardSpr = this.getSpriteCoordFor(attackingPlayer.charge[c]);
                this.drawCard(chargeCardSpr, chargeCardPos);
            }
        }
    }

    // draw a basic table setup with piles
    drawTable() {
        this.cleanCanvas();
        this.drawDiscardPile();
        this.drawDrawPile();
    }

    // render game on canvas
    render() {
        switch(this.game.getState()) {
            case GameState.MAIN_MENU:
                if (this.isMainMenuScreenReady) {
                    this.drawImage(this.mainMenuScreen, 0, 0, this.mainMenuScreen.width, this.mainMenuScreen.height, 0, 0, 800, 600);
                }
                break;

            case GameState.GAME_OVER:
                if(this.isVictoryScreenReady) {
                    this.drawImage(this.victoryScreen, 0, 0, this.victoryScreen.width, this.victoryScreen.height, 0, 0, 800, 600);
                }
                break;

            case GameState.TABLE:
                this.drawTable();
                this.drawPlayerBox(this.game.getActivePlayer());
                this.drawPlayers();
                break;

            case GameState.CHOOSE_ACTION:
                this.drawTable();
                this.drawTopCard();
                this.drawPlayerBox(this.game.getActivePlayer());
                this.drawPlayers();
                this.drawAttackActionOnCanvas();
                this.drawShieldActionOnCanvas();
                this.drawChargeActionOnCanvas();
                break;

            case GameState.ATTACK:
                this.drawTable();
                this.drawTopCard();
                for (const player in this.game.players) { this.drawPlayerBox(this.game.players[player]); }
                this.drawPlayers();
                this.drawAttackActionOnCanvas();
                break;

            case GameState.SHIELD:
                this.drawTable();
                this.drawTopCard();
                for (const player in this.game.players) { this.drawPlayerBox(this.game.players[player]); }
                this.drawPlayers();
                this.drawShieldActionOnCanvas();
                break;

            case GameState.CHARGE:
                this.drawTable();
                this.drawTopCard();
                for (const player in this.game.players) { this.drawPlayerBox(this.game.players[player]); }
                this.drawPlayers();
                this.drawChargeActionOnCanvas();
                break;

            case GameState.ATTACK_VIEW:
                this.drawTable();
                this.drawPlayerBox(this.game.getActivePlayer());
                this.drawPlayers();
                this.drawAttackActionOnCanvas();
                this.drawAttackerTopCard();
                this.drawAttackerCharges();
                break;
        }
    }
}
