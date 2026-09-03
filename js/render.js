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
    width: CARD_SIZE.width / 2,
    height: CARD_SIZE.height / 2
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
            x: this.box.x1 + 105 - cardSizeOnScreen.width/2,
            y: ((this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? this.box.y1 + 98 : this.box.y1 + 24),
            degrees: 90
        };
        return shieldCardPos;  
    }

    // getChargeCardPos: returns pos as {x, y, degrees} for the face down charge
    getChargeCardPos() {
        const chargeCardPos = {
            x: this.box.x1 + 180,
            y: ((this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? this.box.y1 + 98 : 24),
            degrees: 0
        };
        return chargeCardPos;            
    }

    // getAttackCardPos: returns pos as {x, y, degrees} for the attacking card in front of player shield
    getAttackCardPos() {
        const attackCardPos = {
		    x: this.box.x1 + 50, 
		    y: ((this.order === PLAYERS_ORDER.TOP_LEFT || this.order === PLAYERS_ORDER.TOP_RIGHT) ? this.box.y3 - 75 : this.box.y1 - 15), 
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

    draw(render) {
        // STUB
    }
}

class CardAnimationManager extends AnimationManager {
    constructor() {
        super();
    }

    // add: add an animation to the list
    add(cardSprite, source, destination, duration) {
        this.animations.push({
            cardSprite,
            source,
            destination,
            duration,
            elapsed: 0
        });
    }

    // draw each animation step on the list
    draw(renderer) {
        for (const animation of this.animations) {
            const progress = Math.min(
                animation.elapsed / animation.duration,
                1
            );
            // compute position step based on progress
            const position = {
                x: animation.source.x + (animation.destination.x - animation.source.x) * progress,
                y: animation.source.y + (animation.destination.y - animation.source.y) * progress,
                degrees: animation.source.degrees + (animation.destination.degrees - animation.source.degrees) * progress
            };

            renderer.drawCard(
                animation.cardSprite,
                position
            );
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
        this.spr.src = "sprites.png";
        this.isGameSpriteReady = false;
        this.spr.onload = function() { this.isGameSpriteReady = true; }

        // Main menu screen
        this.mainMenuScreen = new Image();
        this.mainMenuScreen.src = "main_menu.png";
        this.isMainMenuScreenReady = false;
        this.mainMenuScreen.onload = function() { this.isMainMenuScreenReady = true; }
        this.mainMenuScreenChoosePlayersBoxes = [
            [51,513,266,586],
            [286,513,515,586],
            [532,513,747,586]
        ];

        this.victoryScreen = new Image();
        this.victoryScreen.src = "victory_screen.png";
        this.isVictoryScreenReady = false;
        this.victoryScreen.onload = function() { this.isVictoryScreenReady = true; }

        this.logEntries = [];

        this.game = game;
    }

    // get coords as {x, y} of a card from its index
    getSpriteCoordFor(cardId) {
        const cardValue = CardManager.getValue(this.game.deck, cardId);
        const cardColorIndex = CardManager.getCardColorIndex(this.game.deck, cardId);
        const cardSpritePos = {
            x: 37 + 133 * (cardValue - 1),
            y: 26 + 170 * cardColorIndex
        };
        return cardSpritePos;
    }

    drawCard(cardSprite, position, degrees=position.degrees) {

    }

    // show the rules of the game
    showHelp(show) {
        const rulesDiv = document.getElementById("rules");	
        rulesDiv.style.display = show ? "block" : "none";
    }

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
        if (player.order === PLAYERS_ORDER.BOTTOM_LEFT || player.order === PLAYERS_ORDER.BOTTOM_RIGHT) this.context.fillRect(player.box.x1 + 10, player.box.y1, player.name.length * 10, 4);
        else this.context.fillRect(player.box.x1 + 10, player.box.y2 - 4, player.name.length * 10, 4);
        this.context.fillStyle = "black";
        // player name
        const playerNamePos = {
            x: player.box.x1 + 15,
            y: (player.order === PLAYERS_ORDER.BOTTOM_LEFT || player.order === PLAYERS_ORDER.BOTTOM_RIGHT) ? player.box.y1 + 8 : player.box.y1 + 213
        };
        this.context.fillText(player.name, playerNamePos.x, playerNamePos.y);
    }
}
