/*
// init canvas
let c=document.getElementById('myCanvas');
c.width = 800;
c.height = 600;
let ctx=c.getContext('2d');
ctx.font = "20px serif";

// init log
let logEntries = [];

// load sprites
let spr=new Image();
let sprReady=false;
spr.onload=function() { sprReady=true; };
spr.src='sprites.png';

// menu:main menu
let mainMenuScreen=new Image();
let mainMenuScreenReady=false;
mainMenuScreen.onload=function() { mainMenuScreenReady=true; }
mainMenuScreen.src='main_menu.png';
// 2 players box: (92,928) (482,1060) -> (51,513) (266,586)
// 3 players box: (520,928) (932,1060) -> (286,513) (515,586)
// 4 players box: (962,928) (1352,1060) -> (532,513) (747,586)
const choosePlayersBoxes = [
	[51,513,266,586],
	[286,513,515,586],
	[532,513,747,586]
];

let victoryScreen=new Image();
let victoryScreenReady=false;
victoryScreen.onload=function() { victoryScreenReady=true; }
victoryScreen.src='victory_screen.png';

// init cards
const cardFaceDown = {x:1765, y:26}; // position of the faced down card in the sprites
const cardSize = {width:117, height:156}; // card size in the sprites
const cardSizeOnScreen = {width:cardSize.width/2, height:cardSize.height/2}; // card size on canvas
const drawPilePos = {x:410, y:300 - cardSizeOnScreen.height/2, degrees:0}; // drawPile position on canvas
const topCardPos = {x:drawPilePos.x+5, y:drawPilePos.y-5, degrees:0}; // "draw effect" with a card on top of the draw pile
const discardPilePos = {x:400 - cardSizeOnScreen.width, y:300 - cardSizeOnScreen.height/2, degrees:0}; // discardPile position on canvas
const deck = createDeck(); // creates a reference for the cards (id, value, color)
let drawPile = Array.from({ length: 52 }, (_, i) => i + 1);
let discardPile = [];

// init actions
const attackSprite = {x:1765, y:208, w:115, h:116};
const attackPos = {x:485, y:210};
const shieldSprite = {x:1770, y:378, w:108, h:120};
const shieldPos = {x:505, y:268};
const chargeSprite = {x:1786, y:542, w:78, h:128};
const chargePos = {x: 490, y:328};

// init players
let players = [];
let playersColors = ["lightsalmon", "olivedrab", "skyblue", "thistle"];
let activePlayerIndex = 0;
let selectedPlayerIndex = -1;

// init game state
const gamestates = {
	"view:table":10,
	"view:attack":11,
	"action:choose":20,
	"action:attack":21,
	"action:shield":22,
	"action:charge":23,
	"menu:main menu":40,
	"menu:game over":41
};

// Fisher-Yates Shuffle
function shuffle(array) {
	let counter = array.length;

	// While there are elements in the array
	while (counter > 0) {
		// Pick a random index
		let index = Math.floor(Math.random() * counter);

		// Decrease counter by 1
		counter--;

		// And swap the last element with it
		let temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}

// create a reference deck
function createDeck() {
    const suits = ["♣", "♥", "♠", "◆"];
    const deck = {};

    for (let i = 0; i < suits.length; i++) {
        const suit = suits[i];
        for (let value = 1; value <= 13; value++) {
            const id = i * 13 + value;
            deck[id] = { id, value, color: i, suit:suit };
        }
    }

    return deck;
}

// create a new player
function Player(playerName = "") {
	this.name = playerName;
	this.isDead = false;
	this.showHp = true;
	this.hp = [];
	this.hpCardsPos = {};
	this.shield = [];
	this.shieldCardPos = {};
	this.showCharge = [];
	this.charge = [];
	this.chargeCardPos = {};
	this.showAttack = false;
	this.attackCardPos = {};
	this.box = [];
}

// change Player toString
Player.prototype.toString = function playerToString() {
	return "{" +
		this.name + "; " +
		"shield: " + getCardName(this.shield) + "; " +
		"hp: [" + getCardName(this.hp[0]) + "," + getCardName(this.hp[1])+ "] " +
		"charges: " + this.charge.length +
		"}";
};

// create a new LogEntry
function LogEntry(msg, type) {
	this.msg = msg;
	this.type = type; 
}

// add a log entry both in the logEntries list and as a "p" element on the website
function addLogEntry(msg, type="INFO") {
	const newLog = new LogEntry(msg, type);
	let logDiv = document.getElementById("log");
	let entryElm = document.createElement("p");

	entryElm.classList.add(type);
	entryElm.append(newLog.msg);

	logDiv.insertBefore(entryElm, logDiv.firstChild);
	logEntries.push(newLog);
}

// clears logEntries both in the list and on the website
function flushEntries() {
	let logDiv = document.getElementById("log");
	for (let l = 0; l < logEntries.length; l++) {
		logDiv.firstChild.remove();
	}
	while (logEntries.length > 0) { logEntries.pop(); }
}

// refreshDrawPile : if drawPile is empty; shuffle the discardPile into a new drawPile
function refreshDrawPile() {
	if(drawPile.length === 0) {
		while(discardPile.length > 0) {
			moveCard(discardPile, drawPile);
		}
		shuffle(drawPile);
		return true;
	} else return false;
}

// move a card, if the third parameter is omitted, taking the first card of the list
function moveCard(fromPile, toPile, card=fromPile[0]) {
	const index = fromPile.indexOf(card);
	if (index !== -1) {
		const removedCard = fromPile.splice(index, 1)[0];
		toPile.push(removedCard);
		return removedCard;
	} else {
		console.log("Card not found in the origin pile");
		return false;
	}
}

// get card value from index
function getCardValue(card) {
	return deck[card].value;
}

// get card color index (0 to 3)
function getCardColorIndex(card) {
	return deck[card].color;
}

// get sum of values in a list of cards
function getTotal(cards) {
    return cards.reduce((sum, card) => sum + getCardValue(card), 0);
}

// get a string of a card based of its id
function getCardName(card) {
	return getCardValue(card) + " " + deck[card].suit;
}

// get (x, y) of a card from its index
function getSpriteCoordFor(card) {
	const cardValue = getCardValue(card);
	const cardColorIndex = getCardColorIndex(card);

	return {x:37+133*(cardValue-1), y:26+170*cardColorIndex};
}

function generatePairsFrom(value) {
	let pairs = [];
	// unique pairs means we stop at half the value
	for (let k = 1; k <= value / 2; k++) {
		// each pair must contain value-compatible cards (value from 1 to 13)
		if (value - k <= 13) {
			pairs.push([k,value-k]);
		}
	}
	return pairs;
}

// check if a card's value exists in a pile
function findReplacementCardIn(pile, value) {
	for (let c = 0; c < pile.length; c++) {
		if(getCardValue(pile[c]) == value) return pile[c];
	}
	return -1;
}

// find replacement card(s) for a specific value from 1 to 13;
// first search into the discardPile, then in the drawPile
function findReplacementCardFor(value) {
	let replacementCard = findReplacementCardIn(discardPile, value);
	return replacementCard < 0 ? [drawPile, findReplacementCardIn(drawPile, value)] : [discardPile, replacementCard];
}

// getAttackCardPosFor : return {x, y, degrees} for the top card as the attack for the defending player
function getAttackCardPosFor(player) {
	return {
		x:player.box[0]+50, 
		y:(player.box[3]<300) ? player.box[3]-75 : player.box[1]-15, 
		degrees:0
	};
}

// change a knight's shield: move the original shield to the discard pile and put the new card as the shield
function changeShield(player) {
	let totalAnimationDuration = 0;
	// shield coords
	let shieldCardPos = {x:player.box[0] + 40 + 65 - cardSizeOnScreen.width/2, y:0, degrees:90};
	shieldCardPos.y = (players.indexOf(player) % 2 === 0) ? player.box[1] + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
	const oldShieldCardCoord = getSpriteCoordFor(player.shield[0]);
	const newShieldCardCoord = getSpriteCoordFor(drawPile[0]);

	animateCard(oldShieldCardCoord, shieldCardPos, discardPilePos, 300);
	totalAnimationDuration += 300;

	// discarding old shield
	setTimeout(() => moveCard(player.shield, discardPile), totalAnimationDuration);

	animateCard(newShieldCardCoord, topCardPos, shieldCardPos, 300);
	// first card of the draw pile as the new shield
	setTimeout(() => moveCard(drawPile, player.shield), totalAnimationDuration);

	addLogEntry("Changing " + player.name + "'s shield for " + getCardName(player.shield[0]), "SHIELD");

	return totalAnimationDuration;
}

// charge a knight
function chargeKnight(player) {
	let totalAnimationDuration = 0;
	// charge coords
	let chargeCardPos = {x:player.box[0] + 40 + 65 + 65 + 10, y:0, degrees:0};
	chargeCardPos.y = (players.indexOf(player) % 2 === 0) ? player.box[1] + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
	// move the top card to charge pos
	animateCard(cardFaceDown, topCardPos, chargeCardPos, 200);
	totalAnimationDuration += 200;
	// add the first card of drawPile to the player's charges
	setTimeout(() => {
		moveCard(drawPile, player.charge);
		player.showCharge.push("false");
		//console.log(getCardName(player.charge[0]) + " " + player.showCharge[0]);
	}, totalAnimationDuration);

	addLogEntry("Charging " + player.name, "CHARGE");

	return totalAnimationDuration;
}

// attack a knight
function attackKnight(attackingPlayer, defendingPlayer) {
	// totalAttack is the sum of the first card from the drawPile and potential charges
	let totalAttack = getCardValue(drawPile[0]);
	totalAttack += getTotal(attackingPlayer.charge);

	// get shield value to find if the attack goes through
	const shieldValue = getCardValue(defendingPlayer.shield[0]);

	addLogEntry("ATTACK: " + attackingPlayer.name + " bashes " + defendingPlayer.name + "'s shield for " + totalAttack, "ATTACK");

	let totalAnimationDuration = 0;
	// ## ANIMATION 1-1 ##
	// move the top card in front of defending player shield
	const topCardSpr = getSpriteCoordFor(drawPile[0]);
	defendingPlayer.attackCardPos = getAttackCardPosFor(defendingPlayer);
	//console.log(totalAnimationDuration + "> ANIMATION 1-1 : top card in front of defending shield");
	animateCard(topCardSpr, topCardPos, defendingPlayer.attackCardPos, 200);
	totalAnimationDuration += 200;
	setTimeout(() => {
		GAMESTATE = gamestates["view:attack"];
		attackingPlayer.showAttack = true;
	}, totalAnimationDuration);

	// ## ANIMATION 1-2 ##
	// bring attacking player's charges in front of defending player's shield
	//console.log(totalAnimationDuration + "> ANIMATION 1-2 : attacking charges in front of defending shield");
	for (let c = 0; c < attackingPlayer.charge.length; c ++) {
		let chargeCardPos = {
			x: defendingPlayer.box[0] + 100 + c*15,
			y: (defendingPlayer.box[3]<300) ? defendingPlayer.box[3]-75 : defendingPlayer.box[1]-15,
			degrees: 0
		};
		let chargeCard = attackingPlayer.charge[c];
		let chargeCardSpr = getSpriteCoordFor(attackingPlayer.charge[c]);
		setTimeout(() => animateCard(chargeCardSpr, attackingPlayer.chargeCardPos, chargeCardPos, 200), totalAnimationDuration + 100*(1+c));
		setTimeout(() => {
			attackingPlayer.showCharge[c] = true;
			//console.log("showing card: " + getCardName(chargeCard + " > " + chargeCard));
		}, totalAnimationDuration + 200 + 100*(c+1));
	}
	if (attackingPlayer.charge.length > 0) {
		totalAnimationDuration += 200 + 100 * (attackingPlayer.charge.length - 1);
	}

	// wait a bit before showing the attack result
	totalAnimationDuration += 700;

	// ## ANIMATION 2-1 ##
	// the attack card bounces from the shield, a bit tilted
	// attackBounceAnimationPos, the position of the tilted card
	let attackAnimationPos = getAttackCardPosFor(defendingPlayer);
	defendingPlayer.attackCardPos = attackAnimationPos;
	let attackBounceAnimationPos = {
		x:attackAnimationPos.x,
		y:(defendingPlayer.box[3] < 300) ? attackAnimationPos.y + 50 : attackAnimationPos.y - 50,
		degrees:(defendingPlayer.box[3] < 300) ? 45 : -45
	};
	//console.log(totalAnimationDuration + "> ANIMATION 2-1 : bounce top card");
	setTimeout(() => {
		attackingPlayer.showAttack = false;
		animateCard(topCardSpr, attackAnimationPos, attackBounceAnimationPos, 400);
	}, totalAnimationDuration);

	if (totalAttack > shieldValue) {
		// losingPoints are remaining points after shield absorption
		const losingPoints = totalAttack - shieldValue;

		// remainingHp is the theoretical remaining health points
		const totalHp = getTotal(defendingPlayer.hp);
		const remainingHp = Math.max(0, totalHp - losingPoints);

		setTimeout(() => addLogEntry("HIT: " + defendingPlayer.name + " lost " + losingPoints + " points", "ATTACK"), totalAnimationDuration);

		// ## ANIMATION 2-2 ##
		// Blink defending player's hp
		//console.log(totalAnimationDuration + "> ANIMATION 2-2 : blink defending player hp");
		setTimeout(() => blinkPlayer(defendingPlayer, 400), totalAnimationDuration);
		totalAnimationDuration += 400;

		// if remainingHp is zero, that player loses the game, discarding their cards
		if (remainingHp <= 0) {
			let emptyPlayerDuration = 0;
			//console.log(totalAnimationDuration + "> discard all defending player's cards");
			setTimeout(() => {
				addLogEntry("DEAD: " + defendingPlayer.name + " has lost! Their cards are discarded.", "INFO");
				totalAnimationDuration += emptyPlayer(defendingPlayer);
			}, totalAnimationDuration);
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
	} else {
		// add bounce card animation duration if not added after defending player hp blink
		totalAnimationDuration += 400;
		addLogEntry("BING: " + defendingPlayer.name + "s shield stood still !", "ATTACK");
	}

	// ## ANIMATION 3-1 ##
	// defending player looses all their charges on an attack, they are discarded
	//console.log(totalAnimationDuration + "> ANIMATION 3-1 : discarding defending charges");
	if (defendingPlayer.charge.length > 0) {
		setTimeout(() => animateCard(cardFaceDown, defendingPlayer.chargeCardPos, discardPilePos, 200), totalAnimationDuration);
		totalAnimationDuration += 200;
		while (defendingPlayer.charge.length > 0) {
			moveCard(defendingPlayer.charge, discardPile);
			defendingPlayer.showCharge.pop();
		}
	}

	// ## ANIMATION 3-2 ##
	// discarding all attacking player's charges
	//console.log(totalAnimationDuration + "> ANIMATION 3-2 : discarding attacking charges");
	if (attackingPlayer.charge.length > 0) {
		for (let c = 0; c < attackingPlayer.charge.length; c++) {
			let reverseIndex = attackingPlayer.charge.length - 1 - c;
			let chargeCardSpr = getSpriteCoordFor(attackingPlayer.charge[reverseIndex]);
			let chargeCardPos = {
				x: defendingPlayer.box[0] + 80 + reverseIndex*10,
				y: (defendingPlayer.box[3]<300) ? defendingPlayer.box[3]-75 : defendingPlayer.box[1]-15,
				degrees: 0
			};
			setTimeout(() => {
				attackingPlayer.showCharge[reverseIndex] = false;			
				animateCard(chargeCardSpr, chargeCardPos, discardPile, 200);
			}, totalAnimationDuration);
			totalAnimationDuration += 200;
		}
		setTimeout(() => {
			while (attackingPlayer.charge.length > 0) { 
				moveCard(attackingPlayer.charge, discardPile);
			}
		}, totalAnimationDuration);
	}

	// ## ANIMATION 3-3 ##
	// the attack card is moved to the discard pile
	//console.log(totalAnimationDuration + "> ANIMATION 3-3 : top card into discard pile");
	setTimeout(() => {
		animateCard(topCardSpr, attackBounceAnimationPos, discardPilePos, 200);
	}, totalAnimationDuration);
	totalAnimationDuration += 200;
	// discarding the attack card
	setTimeout(() => moveCard(drawPile, discardPile), totalAnimationDuration);

	return totalAnimationDuration;
}

// empty player : discard all their cards
function emptyPlayer(player) {
	let totalAnimationDuration = 0;
	let shieldCardSpr = getSpriteCoordFor(player.shield[0]);
	animateCard(shieldCardSpr, player.shieldCardPos, discardPilePos, 200);
	totalAnimationDuration += 200;
	setTimeout(() => moveCard(player.shield, discardPile), totalAnimationDuration); 

	for(let chargeCard = 0; chargeCard < player.charge.length; chargeCard++) {
		let chargeCardSpr = getSpriteCoordFor(player.charge[chargeCard]);
		setTimeout(() => animateCard(chargeCardSpr, player.chargeCardPos, discardPilePos, 200), totalAnimationDuration);
		totalAnimationDuration += 200;
	}
	setTimeout(() => {
		while (player.charge.length > 0) {
			moveCard(player.charge, discardPile);
			player.showCharge.pop();
		}
	}, totalAnimationDuration);
	

	setTimeout(() => player.showHp = false, totalAnimationDuration);
	for (let hpCard = player.hp.length - 1; hpCard >= 0; hpCard--) {
		let hpCardsPosOffset = {
			x:player.hpCardsPos.x + hpCard*71.5,
			y:player.hpCardsPos.y
		};
		let hpCardSpr = getSpriteCoordFor(player.hp[hpCard]);
		setTimeout(() => animateCard(hpCardSpr, hpCardsPosOffset, discardPilePos, 200), totalAnimationDuration);
		totalAnimationDuration += 200;
		setTimeout(() => moveCard(player.hp, discardPile, player.hp[hpCard]), totalAnimationDuration);
	}

	return totalAnimationDuration;
}

// check if a player has lost, return true if its hp are 0
function isPlayerDead(player) {
	if (!player.isDead) { player.isDead = (getTotal(player.hp) === 0); } 
	return player.isDead;
}

// check if a player has won, return true if there is only one player not dead
function hasPlayerWon(player=players[activePlayerIndex]) {
	let hasWon = true;
	for (let p = 0; p < players.length; p++) {
		if (p !== players.indexOf(player)) {
			if (!isPlayerDead(players[p])) hasWon = false;
		}
	}
	return hasWon;
}

// switch to the next player
function nextPlayer() {
	// cycle through players
	activePlayerIndex = (activePlayerIndex + 1) % players.length;
	// skip "dead" player
	while (getTotal(players[activePlayerIndex].hp) === 0) {
		activePlayerIndex = (activePlayerIndex + 1) % players.length;
	}
	addLogEntry("Active Player: "+players[activePlayerIndex].name, "INFO");
}

// init game
function initGame(numberOfPlayers) {
	// rebuild the drawPile
	while(discardPile.length > 0) { moveCard(discardPile, drawPile); }
	// shuffle cards
	drawPile = shuffle(drawPile);
	// init players
	activePlayerIndex = 0;
	while (players.length > 0) { players.pop(); }
	for(let p = 0; p < numberOfPlayers; p++) {
		let newP = new Player("Player "+ (p+1));
		// create player box based on its id
		// 0 -> bottom left
		// 1 -> top left
		// 2 -> bottom right
		// 3 -> top right
		let offset = {x:0, y:0};
		offset.x = (p < 2) ? 50 : 450;
		offset.y = (p % 2 === 0) ? 400 : 0;
		const pBox = [offset.x, offset.y, offset.x+250, offset.y+200];
		newP.box = pBox;
		// hp
		let hpCardsPos = {x:newP.box[0]+40, y:0};
		hpCardsPos.y = (p % 2 === 0) ? newP.box[1] + (200 - 10 - 78) : 10;
		newP.hpCardsPos = hpCardsPos;
		// shield
		let shieldCardPos = {x:newP.box[0] + 40 + 65 - cardSizeOnScreen.width/2, y:0, degrees:90};
		shieldCardPos.y = (p % 2 === 0) ? newP.box[1] + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
		newP.shieldCardPos = shieldCardPos;
		// charge
		let chargeCardPos = {x:newP.box[0] + 40 + 65 + 65 + 10, y:0};
		chargeCardPos.y = (p % 2 === 0) ? newP.box[1] + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
		newP.chargeCardPos = chargeCardPos;

		// distribute three cards to this player
		moveCard(drawPile, newP.hp);
		moveCard(drawPile, newP.hp);
		moveCard(drawPile, newP.shield);
		// add the new player to players list
		players.push(newP);
	}
	// logs
	addLogEntry("Starting a game with " +numberOfPlayers+" players !", "INFO");
	addLogEntry("Active Player: "+players[activePlayerIndex].name, "INFO");
}

// check if a point (x,y) is in a box (x1, y1, x2, y2)
function isPointInBox(point, box) {
	// point is [x, y];
	// box is [x1, y1, x2, y2];
	if(point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3]) return true;
	else return false;
}

// action on click
var click=function(event) {
	const rect = c.getBoundingClientRect();

	const clickPoint = [
		(event.clientX - rect.left) *
            (c.width / rect.width),
		(event.clientY - rect.top) *
            (c.height / rect.height)
	];
	// menu:main menu
	if (GAMESTATE === gamestates['menu:main menu']) {
		// Check if we click on one of the boxes with the number of players
		for (let b = 0; b < choosePlayersBoxes.length; b++) {
			if (isPointInBox(clickPoint, choosePlayersBoxes[b])) {
				// Init the game with 2-4 players depending on the box we clicked on
				initGame(b+2);
				// Show the game table
				GAMESTATE = gamestates['view:table'];
				break;
			}
		}
	// Click on menu:game over screen -> Go to main screen
	} else if (GAMESTATE === gamestates['menu:game over']) {
		// reset the log
		flushEntries();
		GAMESTATE = gamestates['menu:main menu'];
	// view:table : we can only click on the draw pile
	} else if (GAMESTATE === gamestates['view:table']) {
		const drawPileBox = [drawPilePos.x, drawPilePos.y, drawPilePos.x + cardSizeOnScreen.width, drawPilePos.y + cardSizeOnScreen.height];
		if (isPointInBox(clickPoint, drawPileBox)) GAMESTATE = gamestates['action:choose'];
	// Choose action : we can click on an action box
	} else if (GAMESTATE === gamestates['action:choose']) {
		const attackBox = [attackPos.x, attackPos.y, attackPos.x+attackSprite.w/2+150, attackPos.y+attackSprite.h/2];
		const changeShieldBox = [shieldPos.x, shieldPos.y, shieldPos.x+shieldSprite.w/2+200, shieldPos.y+shieldSprite.h/2];
		const chargeBox = [chargePos.x, chargePos.y, chargePos.x+chargeSprite.w/2+170, chargePos.y+chargeSprite.h/2];

		if (isPointInBox(clickPoint, attackBox)) { GAMESTATE = gamestates['action:attack']; }
		else if (isPointInBox(clickPoint, changeShieldBox)) { GAMESTATE = gamestates['action:shield']; }
		else if (isPointInBox(clickPoint, chargeBox)) { GAMESTATE = gamestates['action:charge']; }
	// If an action has been chosen
	} else if (GAMESTATE === gamestates['action:attack'] || 
			GAMESTATE === gamestates['action:shield'] ||
			GAMESTATE === gamestates['action:charge']) {
		// We have to choose a player for the selected action
		for (let p=0; p < players.length; p++) {
			if(!isPlayerDead(players[p])) { 
				selectedPlayerIndex = p;
				const pBox = players[selectedPlayerIndex].box;
				// Click on a player
				if (isPointInBox(clickPoint, pBox)) {
					let totalAnimationDuration = 0;
					if (GAMESTATE === gamestates['action:attack']) { 
						totalAnimationDuration = attackKnight(players[activePlayerIndex], players[selectedPlayerIndex]);
					} else if (GAMESTATE === gamestates['action:shield']) {
						totalAnimationDuration = changeShield(players[selectedPlayerIndex]);
					} else if (GAMESTATE === gamestates['action:charge']) {	
						totalAnimationDuration = chargeKnight(players[selectedPlayerIndex]);
					}
					//console.log(totalAnimationDuration + "> action done, changing active player");
					setTimeout(() => {
						selectedPlayerIndex = -1;
						if (!hasPlayerWon(players[activePlayerIndex])) { 
							nextPlayer();
							GAMESTATE = gamestates['view:table'];
						}
					}, totalAnimationDuration);
					// don't bother looking at other players
					break;
				}
			}
		}
	}
}
// make the canvas clickable
c.onclick=click;

// show the rules of the game
function showHelp(show) {
	const rulesDiv = document.getElementById("rules");	
	rulesDiv.style.display = show ? "block" : "none";
}

// animateCard "moves" (sequentially draw on screen) a card sprite `cardSpr` from a `src` (x, y, degrees) to a `dest` (x, y, degrees) in `duration` milliseconds
function animateCard(cardSpr, src, dest, duration) {
	const startTime = performance.now();

	function step(now) {
		const elapsed = now - startTime;
		const t = Math.min(elapsed / duration, 1); // 0 → 1
		// Linear interpolation
		const cardPos = {
			x:src.x + (dest.x - src.x) * t,
			y:src.y + (dest.y - src.y) * t,
			degrees:src.degrees + (dest.degrees - src.degrees) * t
		};
		// draw function
		drawCard(cardSpr, cardPos, cardPos.degrees);
		// recursion
		if (t < 1) { requestAnimationFrame(step); }
	}
	// start the animation
	requestAnimationFrame(step);
}

function animateCardAsync(cardSpr, src, dest, duration) {
	return new Promise(resolve => {
		animateCard(cardSpr, src, dest, duration);
		setTimeout(resolve, duration);
	});
}

function pause(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// blinkPlayer blink player hp cards for duration in ms
function blinkPlayer(player, duration) {
	for (let t = 0; t < duration; t+=100) {
		setTimeout(() => player.showHp = !player.showHp, t);
	}
}

// draw player box
function drawPlayerBox(ctx, player) {
	const playerSize = {x: player.box[0], y:player.box[1], width:300, height:200};
	ctx.fillStyle = playersColors[players.indexOf(player)];
	// bigger rectangle
	ctx.fillRect(playerSize.x, playerSize.y, playerSize.width, playerSize.height);
	ctx.fillStyle = "white";
	// inner rectangle
	ctx.fillRect(playerSize.x+4, playerSize.y+4, playerSize.width-8, playerSize.height-8);
	// name line
	if (players.indexOf(player) % 2 === 0) ctx.fillRect(player.box[0]+10, player.box[1], player.name.length*10, 4);
	else ctx.fillRect(player.box[0]+10, player.box[3]-4, player.name.length*10, 4);
	ctx.fillStyle = "black";
	// player name
	let playerNamePos = {x:player.box[0]+15, y:player.box[1]+8};
	if (players.indexOf(player) % 2 !== 0) {
		playerNamePos.y += 195;
	}
	ctx.fillText(player.name, playerNamePos.x, playerNamePos.y);
}

// draw attack action on canvas
function drawAttackActionOnCanvas() {
	ctx.drawImage(spr, attackSprite.x, attackSprite.y, attackSprite.w, attackSprite.h, attackPos.x, attackPos.y, Math.round(attackSprite.w*0.4), Math.round(attackSprite.h*0.4));
	ctx.fillStyle = "black";
	let attackTxt = (GAMESTATE === gamestates['action:choose']) ? "Attack" : "Which knight ?";
	ctx.fillText(attackTxt, attackPos.x + 50, attackPos.y + 30);
}

// draw shield action on canvas
function drawShieldActionOnCanvas() {
	ctx.drawImage(spr, shieldSprite.x, shieldSprite.y, shieldSprite.w, shieldSprite.h, shieldPos.x, shieldPos.y, Math.round(shieldSprite.w*0.4), Math.round(shieldSprite.h*0.4));
	ctx.fillStyle = "black";
	let shieldTxt = (GAMESTATE === gamestates['action:choose']) ? "Change shield" : "Which knight ?";
	ctx.fillText(shieldTxt, shieldPos.x + 50, shieldPos.y + 30);
}

// draw charge action on canvas
function drawChargeActionOnCanvas() {
	ctx.drawImage(spr, chargeSprite.x, chargeSprite.y, chargeSprite.w, chargeSprite.h, chargePos.x, chargePos.y, Math.round(chargeSprite.w*0.4), Math.round(chargeSprite.h*0.4));
	ctx.fillStyle = "black";
	let chargeTxt = (GAMESTATE === gamestates['action:choose']) ? "Charge" : "Which knight ?";
	ctx.fillText(chargeTxt, chargePos.x + 50, chargePos.y + 30);
}

// can draw rotated images
function drawImage(ctx, image, srcX, srcY, srcW, srcH, destX, destY, destW, destH, degrees){
	ctx.save();
	ctx.translate(destX+destW/2, destY+destH/2);
	ctx.rotate(degrees*Math.PI/180.0);
	ctx.translate(-destX-destW/2, -destY-destH/2);
	ctx.drawImage(image, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
	ctx.restore();
}

// draw a card from sprites (src) to canvas (dest); coords are {x, y}
function drawCard(srcCoord, destCoord, degrees=0) {
	drawImage(ctx, spr, srcCoord.x, srcCoord.y, cardSize.width, cardSize.height, destCoord.x, destCoord.y, cardSizeOnScreen.width, cardSizeOnScreen.height, degrees);
}

// render game on canvas
let render=function() {
	if (GAMESTATE === gamestates['menu:main menu']) {
		if(mainMenuScreenReady) {
			ctx.drawImage(mainMenuScreen, 0, 0, mainMenuScreen.width, mainMenuScreen.height, 0, 0, 800, 600);
		}
	} else if (GAMESTATE === gamestates['menu:game over']) {
		if(victoryScreenReady) {
			ctx.drawImage(victoryScreen, 0, 0, victoryScreen.width, victoryScreen.height, 0, 0, 800, 600);
		}
	} else {
		if(sprReady) {
			// clean up the canvas
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, 800, 600);
			
			// drawPile
			drawCard(cardFaceDown, drawPilePos);
			// discardPile
			if (discardPile.length > 0) {
				const lastDiscardPileCardSprite = getSpriteCoordFor(discardPile[discardPile.length-1]);
				drawCard(lastDiscardPileCardSprite, discardPilePos);
			}

			// draw a face down card on top of the draw pile to mimic a "draw effect"
			if (GAMESTATE !== gamestates["view:table"] &&
				selectedPlayerIndex === -1) {
				drawCard(cardFaceDown, topCardPos);
			}
			
			// draw actions or choose player
			if (GAMESTATE === gamestates['action:choose']) {
				// draw actions
				drawAttackActionOnCanvas();
				drawShieldActionOnCanvas();
				drawChargeActionOnCanvas();
			} else if (GAMESTATE >= gamestates['action:attack'] && GAMESTATE <= gamestates['action:charge']) {
				// only draw the chosen action
				if (GAMESTATE === gamestates['action:attack']) {
					drawAttackActionOnCanvas();
				} else if (GAMESTATE === gamestates['action:shield']) {
					drawShieldActionOnCanvas();
				} else if (GAMESTATE === gamestates['action:charge']) {
					drawChargeActionOnCanvas();
				}
			}
			
			// draw players
			for (let p = 0; p < players.length; p++) {
				if(!isPlayerDead(players[p])) {
					// Show a colored box around the active player, or all players if we have to choose a player for an action
					if(p === activePlayerIndex || (GAMESTATE >= gamestates['action:attack'] && GAMESTATE <= gamestates['action:charge'])) { drawPlayerBox(ctx, players[p]); }

					// draw hp
					if(players[p].showHp && players[p].hp.length > 0) {
						let hpCardsPosOffset = {
							x:players[p].hpCardsPos.x,
							y:players[p].hpCardsPos.y
						};
						for (let hpCard = 0; hpCard < players[p].hp.length; hpCard++) {
							const hpCardCoord = getSpriteCoordFor(players[p].hp[hpCard]);
							hpCardsPosOffset.x = players[p].hpCardsPos.x + hpCard*71.5;
							drawCard(hpCardCoord,hpCardsPosOffset);
						}
					}

					// draw shield
					if(players[p].shield.length > 0) {
						const shieldCardCoord = getSpriteCoordFor(players[p].shield[0]);
						drawCard(shieldCardCoord, players[p].shieldCardPos, players[p].shieldCardPos.degrees);
					}

					// draw top card in front of defender's shield for the attack view
					if (GAMESTATE === gamestates["view:attack"]) {
						const topCardSpr = getSpriteCoordFor(drawPile[0]);
						let attackingPlayer = players[activePlayerIndex];
						let defendingPlayer = players[selectedPlayerIndex];
						
						if (attackingPlayer.showAttack) drawCard(topCardSpr, defendingPlayer.attackCardPos);
					}

					// draw charge
					if (players[p].charge.length > 0) {
						if (GAMESTATE === gamestates["view:attack"]) {
							let attackingPlayer = players[activePlayerIndex];
							let defendingPlayer = players[selectedPlayerIndex];
							
							for (let c = 0; c < attackingPlayer.charge.length; c ++) {
								//console.log(getCardName(attackingPlayer.charge[c]) + " " + attackingPlayer.showCharge[c]);
								if (attackingPlayer.showCharge[c] === true) {
									let chargeCardPos = {
										x: defendingPlayer.box[0] + 100 + c*15,
										y: (defendingPlayer.box[3]<300) ? defendingPlayer.box[3]-75 : defendingPlayer.box[1]-15,
										degrees: 0
									};
									let chargeCardSpr = getSpriteCoordFor(attackingPlayer.charge[c]);
									drawCard(chargeCardSpr, chargeCardPos);
								}
							}
						} else {
							// show a face down card with the number of charges written in a corner
							drawCard(cardFaceDown, players[p].chargeCardPos);
							ctx.fillStyle = "goldenrod";
							ctx.fillRect(players[p].chargeCardPos.x-2, players[p].chargeCardPos.y-2, 29, 29);
							ctx.fillStyle = "white";
							ctx.fillRect(players[p].chargeCardPos.x, players[p].chargeCardPos.y, 25, 25);
							ctx.fillStyle = "black";
							ctx.fillText(players[p].charge.length, players[p].chargeCardPos.x+7, players[p].chargeCardPos.y+20);
						}
					}
				}
			}
		}
	}
}

// The main game loop
let main = function () {
	for (let p = 0; p < players.length; p++) {
		if (hasPlayerWon(players[p])) { 
			addLogEntry(players[p].name + " has won the game !");
			GAMESTATE = gamestates['menu:game over'];
			while (players.length > 0) { players.pop(); }
			break;
		}
	}

	// run the render function
	render();

	// Request to do this again ASAP
	requestAnimationFrame(main);
};
// Cross-browser support for requestAnimationFrame
let w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

let GAMESTATE = gamestates["view:table"];
initGame(3); // test purposes

main();
*/

const game = new Game();
const renderer = new Renderer(game);
const input = new InputController(renderer, game);
const animationManager = new AnimationManager();

let previousTime = performance.now();

function main(now) {
    const deltaTime = now - previousTime;
    previousTime = now;

    animationManager.update(deltaTime);

    renderer.render();
    animationManager.draw(renderer);

    requestAnimationFrame(main);
}

requestAnimationFrame(main);