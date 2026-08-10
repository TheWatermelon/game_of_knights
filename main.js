// init canvas
let c=document.getElementById('myCanvas');
c.width = 800;
c.height = 600;
let ctx=c.getContext('2d');
ctx.font = "20px serif";

// load sprites
let spr=new Image();
let sprReady=false;
spr.onload=function() { sprReady=true; };
spr.src='sprites.jpg';

// Main menu
// 2 players box: (92,928) (482,1060) -> (51,513) (266,586)
// 3 players box: (520,928) (932,1060) -> (286,513) (515,586)
// 4 players box: (962,928) (1352,1060) -> (532,513) (747,586)
let mainMenuScreen=new Image();
let mainMenuScreenReady=false;
mainMenuScreen.onload=function() { mainMenuScreenReady=true; }
mainMenuScreen.src='main_menu.png';

let victoryScreen=new Image();
let victoryScreenReady=false;
victoryScreen.onload=function() { victoryScreenReady=true; }
victoryScreen.src='victory_screen.png';

// init cards
const cardFaceDown = {x:1765, y:26}; // position of the faced down card in the sprites
const cardSize = {width:117, height:156}; // card size in the sprites
const deck = createDeck(); // creates a reference for the cards (id, value, color)
let drawPile = Array.from({ length: 52 }, (_, i) => i + 1);
let discardPile = [];

// init actions
const attackSprite = {x:1765, y:208, w:115, h:116};
const attackPos = {x:300, y:350};
const shieldSprite = {x:1770, y:378, w:108, h:120};
const shieldPos = {x:375, y:350};
const chargeSprite = {x:1786, y:542, w:78, h:128};
const chargePos = {x: 450, y:350};

// init players
let players = [];
let playersColors = ["lightsalmon", "olivedrab", "skyblue", "thistle"];
let activePlayerIndex = 0;

// init game state
const gamestates = {
	"main menu":0,
	"table view":1,
	"action:attack":21,
	"action:shield":22,
	"action:charge":23,
	"game over":4
};
let GAMESTATE = gamestates['main menu'];
let showDrawPileTopCard = false;

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
	this.hp = [];
	this.shield = [];
	this.charge = [];
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
		console.log("moved " + removedCard + " (" + getCardName(removedCard) + ")");
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

// change a knight's shield: move the original shield to the discard pile and put the new card as the shield
function changeShield(player) {
	// discarding old shield
	moveCard(player.shield, discardPile);
	// first card of the draw pile as the new shield
	moveCard(drawPile, player.shield);
}

// charge a knight
function chargeKnight(player) {
	// add the first card of drawPile to the player's charges
	moveCard(drawPile, player.charge);
}

// attack a knight
function attackKnight(attackingPlayer, defendingPlayer) {
	// totalAttack is the sum of the first card from the drawPile and potential charges
	let totalAttack = getCardValue(drawPile[0]);
	totalAttack += getTotal(attackingPlayer.charge);

	// if totalAttack goes through the shield
	const shieldValue = getCardValue(defendingPlayer.shield[0]);

	console.log("trying to attack " + shieldValue + " with " + totalAttack);

	if (totalAttack > shieldValue) {
		// losingPoints are remaining points after shield absorption
		const losingPoints = totalAttack - shieldValue;

		// remainingHp is the theoretical remaining health points
		const totalHp = getTotal(defendingPlayer.hp);
		const remainingHp = Math.max(0, totalHp - losingPoints);

		// if remainingHp is zero, that player loses the game, discarding their cards
		if (remainingHp <= 0) {
			// discard all defendingPlayer hp
			while(defendingPlayer.hp.length > 0) {
				moveCard(defendingPlayer.hp, discardPile);
			}
			checkPlayerDead(defendingPlayer);
			checkPlayerWon();
		} else {
			// try replacing only one card to match the new hp
			let replacementValue = 0;
		    for (let i = 0; i < defendingPlayer.hp.length; i++) {
				replacementValue = getCardValue(defendingPlayer.hp[i]) - losingPoints;

				// if replacementValue can be a card
				if (replacementValue >= 1 && replacementValue <= 13) {
					// discard one card from defending player hp
					moveCard(defendingPlayer.hp, discardPile, defendingPlayer.hp[i]);
					break;
				}
			}
			// one card isn't enough
			if (replacementValue <= 0) {
				// discard all defendingPlayer hp
				while(defendingPlayer.hp.length > 0) {
					moveCard(defendingPlayer.hp, discardPile);
				}
				replacementValue = remainingHp;
			}
			console.log("totalHp: " + totalHp + " losingPoints: " + losingPoints + " replacement value: " + replacementValue);

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
				moveCard(replacementCards[c][0], defendingPlayer.hp, replacementCards[c][1]);
			}
		}
	} else {
		console.log ("nothing happens...");
	}

	// discarding the attack card
	moveCard(drawPile, discardPile);

	// discarding all charges
	while(attackingPlayer.charge.length > 0) {
		moveCard(attackingPlayer.charge, discardPile);
	}

	// defending player looses all their charges on an attack
	while(defendingPlayer.charge.length > 0) {
		moveCard(defendingPlayer.charge, discardPile);
	}
}

// empty player : discard all their cards
function emptyPlayer(player) {
	while(player.shield.length > 0) { moveCard(player.shield, discardPile); }
	while(player.hp.length > 0) { moveCard(player.hp, discardPile); }
	while(player.charge.length > 0) {moveCard(player.charge, discardPile); }
	return player;
}

// check if a player has lost
function checkPlayerDead(player) {
	if(getTotal(player.hp) == 0) {
		emptyPlayer(player);
		const indexToRemove = players.indexOf(player);
		// if the dead player would have been next, jump to the next one
		if (activePlayerIndex + 1 == indexToRemove) {
			nextPLayer();
		}
		const playerRemoved = players.splice(indexToRemove, 1)[0];
		activePlayerIndex = activePlayerIndex % players.length;
		return true;
	}
	else return false;
}

// check if a player has won
function checkPlayerWon() {
	if (players.length == 1) return true;
	else return false;
}

// switch to the next player
function nextPLayer() {
	activePlayerIndex = (activePlayerIndex + 1) % players.length;
}

// init game
function initGame(numberOfPlayers) {
	// init players
	for(let p = 1; p <= numberOfPlayers; p++) {
		players.push(new Player("Player "+p));
	}
	activePlayerIndex = 0;
	// shuffle cards
	drawPile = shuffle(drawPile);
	//console.log(drawPile);
	// distribute three cards to all players
	for(let p = 0; p < players.length; p++) {
		moveCard(drawPile, players[p].hp);
		moveCard(drawPile, players[p].hp);
		moveCard(drawPile, players[p].shield);
	}
}

// check if a point (x,y) is in a box (x1, y1, x2, y2)
function isPointInBox(point, box) {
	// point is [x, y];
	// box is [x1, y1, x2, y2];
	//console.log("checking "+point+" into "+box);
	if(point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3]) return true;
	else return false;
}

// action on click
var click=function(event) {
	const clickPoint = [event.clientX, event.clientY];
	if (GAMESTATE === gamestates['main menu']) {
		// Main menu
		// 2 players box: (92,928) (482,1060) -> (51,513) (266,586)
		// 3 players box: (520,928) (932,1060) -> (286,513) (515,586)
		// 4 players box: (962,928) (1352,1060) -> (532,513) (747,586)
		const choosePlayersBoxes = [
			[51,513,266,586],
			[286,513,515,586],
			[532,513,747,586]
		];

		for (let b = 0; b < choosePlayersBoxes.length; b++) {
			if (isPointInBox(clickPoint, choosePlayersBoxes[b])) {
				initGame(b+2);
				GAMESTATE = gamestates['table view'];
				break;
			}
		}
	} else if (GAMESTATE == gamestates['table view']) {
		const attackBox = [attackPos.x, attackPos.y, attackPos.x+attackSprite.w/2, attackPos.y+attackSprite.h/2];
		const changeShieldBox = [shieldPos.x, shieldPos.y, shieldPos.x+shieldSprite.w/2, shieldPos.y+shieldSprite.h/2];
		const chargeBox = [chargePos.x, chargePos.y, chargePos.x+chargeSprite.w/2, chargePos.y+chargeSprite.h/2];

		if (isPointInBox(clickPoint, attackBox)) { GAMESTATE = gamestates['action:attack']; }
		else if (isPointInBox(clickPoint, changeShieldBox)) { GAMESTATE = gamestates['action:shield']; }
		else if (isPointInBox(clickPoint, chargeBox)) { GAMESTATE = gamestates['action:charge']; }

	} else if (GAMESTATE === gamestates['action:attack'] || 
				GAMESTATE === gamestates['action:shield'] ||
				GAMESTATE === gamestates['action:charge']) {
		if (!showDrawPileTopCard && GAMESTATE !== gamestates['action:charge']) {
			showDrawPileTopCard = true;
		} else {
			showDrawPileTopCard = false;
			for (let p=0; p < players.length; p++) {
				let offset = {x:0, y:0};
				offset.x = (p < 2) ? 50 : 550;
				offset.y = (p % 2 === 0) ? 400 : 10;
				const pBox = [offset.x, offset.y, offset.x+250, offset.y+200];

				if (isPointInBox(clickPoint, pBox)) {
					if (GAMESTATE === gamestates['action:attack']) { attackKnight(players[activePlayerIndex], players[p]); }
					else if (GAMESTATE === gamestates['action:shield']) { changeShield(players[p]); }
					else if (GAMESTATE === gamestates['action:charge']) { chargeKnight(players[p]); }
					nextPLayer();
					GAMESTATE = gamestates['table view'];
				}
			}
		}
	}
}
// make the canvas clickable
c.onclick=click;

/*
var init=function(lvl) {
	level=lvl;
	clicks=0;
	seconds=0;

	// fixed canvas size based on number of cards
	c.width=6*64;
	c.height=level*3*64;

	// setup cards
	focusedCard=-1;
	cards=[];
	// one column of 9 cards added per level
	for(var i=0; i<9*level; i++) {
		// pair of cards
		cards.push({id:i, show:false});
		cards.push({id:i, show:false});
	}
	shuffle(cards);

	// level picker on page
	if(document.getElementById('level')!==null) document.getElementById('level').remove();
	var p=document.createElement("p");
	p.setAttribute('id', 'level');
	document.body.appendChild(p);
	var txt=document.createTextNode("Level ");
	p.appendChild(txt);
	// for each level
	for(var i=1; i<9; i++) {
		// current level unclickable
		if(i==level) {
			var lvl=document.createElement("span");
			var txt=document.createTextNode(i);
			lvl.appendChild(txt);
			lvl.style.fontWeight="bold";
		} else {
			var lvl=document.createElement("a");
			lvl.setAttribute("href", "#");
			var txt=document.createTextNode(i);
			lvl.appendChild(txt);
			const l=i;
			lvl.addEventListener('click', function() { init(l); });
		}
		p.appendChild(lvl);
		p.appendChild(document.createTextNode(' '));
	}

	// show clicks number and timer on page
	var min=Math.floor(seconds/60);
	var formatMin=(min<10)?"0"+min:min;
	var sec=seconds%60;
	var formatSec=(sec<10)?"0"+sec:sec;
	if(document.getElementById('clicks')!==null) document.getElementById('clicks').remove();
	var cl = document.createElement("p");
	cl.setAttribute("id", "clicks");
	document.body.appendChild(cl);
	cl.appendChild(document.createTextNode("Clicks: "+clicks+" Time "+formatMin+":"+formatSec));
}

// match cards based on id
var matchCards=function(index1, index2) {
	if(cards[index1].id !== cards[index2].id) {
		// countdown let the cards visible for a bit before flipping them back down
		cards[index1].countdown = 50;
		cards[index1].show=false;
		cards[index2].countdown = 50;
		cards[index2].show=false;
		hasCountdown=true;
	}
	// can click a new card
	focusedCard=-1;
}

// win condition : all the cards are face-up
var checkWin=function() {
	var won=true;
	cards.forEach(function(item, index, array) {
		if(item.show!==true) { won=false; return won; }
	});
	return won;
}

// show card clicked
var click=function(event) {
	if(hasCountdown || checkWin()) return;
	// offsetX if the left margin
	var offsetX=(document.body.clientWidth-6*64)/2;
	// offsetY is the current y scroll
	var offsetY=window.scrollY;
	var index=Math.floor((event.clientX-offsetX)/64)+Math.floor((event.clientY+offsetY)/64)*6;
	//console.log(checkWin());
	if(!cards[index].show) {
		cards[index].show=true;
		// first card
		if(focusedCard==-1) focusedCard=index;
		// two cards
		else matchCards(focusedCard, index);
		clicks++;
		updateClicks();
	}
}
// make the canvas clickable
c.onclick=click;

// Counter to decrement cards countdown
var counter=function() {
	cards.forEach(function(item, index, array) {
		if(item.countdown>0) {
			item.countdown--;
			if(item.countdown==0) hasCountdown=false;
		}
	});
}

// call counter each 16ms (~60 per second)
setInterval(counter, 16);

// timer called each second
var timer=function() {
	if(!checkWin()) seconds++;
	updateClicks();
}
setInterval(timer, 1000);

// refresh clicks number on page
var updateClicks=function() {
	var cl=document.getElementById("clicks");
	cl.removeChild(cl.firstChild);
	var min=Math.floor(seconds/60);
	var formatMin=(min<10)?"0"+min:min;
	var sec=seconds%60;
	var formatSec=(sec<10)?"0"+sec:sec;
	cl.appendChild(document.createTextNode("Clicks: "+clicks+" Time "+formatMin+":"+formatSec));
}
*/

// can draw rotated images
function drawImage(ctx, image, srcX, srcY, srcW, srcH, destX, destY, destW, destH, degrees){
	ctx.save();
	ctx.translate(destX+destW/2, destY+destH/2);
	ctx.rotate(degrees*Math.PI/180.0);
	ctx.translate(-destX-destW/2, -destY-destH/2);
	ctx.drawImage(image, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
	ctx.restore();
}

// drawing cards on canvas
let render=function() {
	if(GAMESTATE === gamestates['main menu']) {
		if(mainMenuScreenReady) {
		console.log("menu screen");
		ctx.drawImage(mainMenuScreen, 0, 0, mainMenuScreen.width, mainMenuScreen.height, 0, 0, 800, 600);
		}
	} else {
		if(sprReady) {
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, 800, 600);
			ctx.fillStyle = "black";
			const cardSizeOnScreen = {width:cardSize.width/2, height:cardSize.height/2};
			// drawPile
			const drawPilePos = {x:410, y:250 - cardSizeOnScreen.height/2};
			ctx.drawImage(spr, cardFaceDown.x, cardFaceDown.y, cardSize.width, cardSize.height, drawPilePos.x, drawPilePos.y, cardSizeOnScreen.width, cardSizeOnScreen.height);
			// discardPile
			if (discardPile.length > 0) {
				const discardPilePos = {x:400 - cardSizeOnScreen.width, y:250 - cardSizeOnScreen.height/2};
				const lastDiscardPileCardSprite = getSpriteCoordFor(discardPile[discardPile.length-1]);
				ctx.drawImage(spr, lastDiscardPileCardSprite.x, lastDiscardPileCardSprite.y, cardSize.width, cardSize.height, discardPilePos.x, discardPilePos.y, cardSizeOnScreen.width, cardSizeOnScreen.height);
			}
			
			// draw actions or choose player
			if (GAMESTATE === gamestates['table view']) {
				// draw attack
				ctx.drawImage(spr, attackSprite.x, attackSprite.y, attackSprite.w, attackSprite.h, attackPos.x, attackPos.y, attackSprite.w/2, attackSprite.h/2);
				// draw shield
				ctx.drawImage(spr, shieldSprite.x, shieldSprite.y, shieldSprite.w, shieldSprite.h, shieldPos.x, shieldPos.y, shieldSprite.w/2, shieldSprite.h/2);
				// draw charge
				ctx.drawImage(spr, chargeSprite.x, chargeSprite.y, chargeSprite.w, chargeSprite.h, chargePos.x, chargePos.y, chargeSprite.w/2, chargeSprite.h/2);
				// text
				ctx.fillText("Choose an action", 330, 330);
			} else if (GAMESTATE >= gamestates['action:attack'] && GAMESTATE <= gamestates['action:charge']) {
				if (showDrawPileTopCard) {
					ctx.fillText("Showing top card", 328, 330);
					// draw drawPile top card
					const drawPileTopCardPos = {x:400-cardSizeOnScreen.width/2, y:300-cardSizeOnScreen.height};
					const drawPileTopCardSprite = getSpriteCoordFor(drawPile[0]);
					ctx.drawImage(spr, drawPileTopCardSprite.x, drawPileTopCardSprite.y, cardSize.width, cardSize.height, drawPileTopCardPos.x, drawPileTopCardPos.y, cardSizeOnScreen.width, cardSizeOnScreen.height);
				} else {
					ctx.fillText("Choose a player", 330, 330);

					if (GAMESTATE === gamestates['action:attack']) {
						// draw attack
						ctx.drawImage(spr, attackSprite.x, attackSprite.y, attackSprite.w, attackSprite.h, attackPos.x, attackPos.y, attackSprite.w/2, attackSprite.h/2);
					} else if (GAMESTATE === gamestates['action:shield']) {
						// draw shield
						ctx.drawImage(spr, shieldSprite.x, shieldSprite.y, shieldSprite.w, shieldSprite.h, shieldPos.x, shieldPos.y, shieldSprite.w/2, shieldSprite.h/2);
					} else if (GAMESTATE === gamestates['action:charge']) {
						// draw charge
						ctx.drawImage(spr, chargeSprite.x, chargeSprite.y, chargeSprite.w, chargeSprite.h, chargePos.x, chargePos.y, chargeSprite.w/2, chargeSprite.h/2);
					}
				}
			}
			
			// draw players
			for (let p = 0; p < players.length; p++) {
				let offset = {x:0, y:0};
				offset.x = (p < 2) ? 50 : 550;
				offset.y = (p % 2 === 0) ? 400 : 10;

				if(p === activePlayerIndex) {
					ctx.fillStyle = playersColors[p];
					ctx.fillRect(offset.x-5,offset.y+90,20,20);
					ctx.fillStyle = "white";
				}

				let hpCardsPos = {x:offset.x+40, y:0};
				hpCardsPos.y = (p % 2 === 0) ? offset.y + (200 - 10 - 78) : 10;

				for (let hpCard = 0; hpCard < players[p].hp.length; hpCard++) {
					const hpCardCoord = getSpriteCoordFor(players[p].hp[hpCard]);
					ctx.drawImage(spr, hpCardCoord.x, hpCardCoord.y, cardSize.width, cardSize.height, hpCardsPos.x + hpCard*71.5, hpCardsPos.y, cardSizeOnScreen.width, cardSizeOnScreen.height);
				}

				// draw shield
				let shieldCardPos = {x:offset.x + 40 + 65 - cardSizeOnScreen.width/2, y:0};
				shieldCardPos.y = (p % 2 === 0) ? offset.y + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
				const shieldCardCoord = getSpriteCoordFor(players[p].shield[0]);
				drawImage(ctx, spr, shieldCardCoord.x, shieldCardCoord.y, cardSize.width, cardSize.height, shieldCardPos.x, shieldCardPos.y, cardSizeOnScreen.width, cardSizeOnScreen.height, 90);
				//ctx.drawImage(spr, shieldCardCoord.x, shieldCardCoord.y, cardSize.width, cardSize.height, shieldCardPos.x, shieldCardPos.y, cardSizeOnScreen.width, cardSizeOnScreen.height);
					
				// draw charge
				if (players[p].charge.length > 0) {
					let chargeCardPos = {x:offset.x + 40 + 65 + 65 + 10, y:0};
					chargeCardPos.y = (p % 2 == 0) ? offset.y + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
					if (GAMESTATE === gamestates['action:attack'] && showDrawPileTopCard && p === activePlayerIndex) {
						for (let c = 0; c < players[p].charge.length; c++) {
							let chargeSpr = getSpriteCoordFor(players[p].charge[c]);
							ctx.drawImage(spr, chargeSpr.x, chargeSpr.y, cardSize.width, cardSize.height, chargeCardPos.x, chargeCardPos.y + c*20, cardSizeOnScreen.width, cardSizeOnScreen.height);
						}
					} else {
						ctx.drawImage(spr, cardFaceDown.x, cardFaceDown.y, cardSize.width, cardSize.height, chargeCardPos.x, chargeCardPos.y, cardSizeOnScreen.width, cardSizeOnScreen.height);
						ctx.fillStyle = "goldenrod";
						ctx.fillRect(chargeCardPos.x-2, chargeCardPos.y-2, 29, 29);
						ctx.fillStyle = "white";
						ctx.fillRect(chargeCardPos.x, chargeCardPos.y, 25, 25);
						ctx.fillStyle = "black";
						ctx.fillText(players[p].charge.length, chargeCardPos.x+7, chargeCardPos.y+20);
					}
				}
			}
		}
	}
}

// The main game loop
let main = function () {
	// run the render function
	render();
	// Request to do this again ASAP
	requestAnimationFrame(main);
};
// Cross-browser support for requestAnimationFrame
let w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

//initGame(2);
main();
