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

// Main menu
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
const drawPilePos = {x:410, y:300 - cardSizeOnScreen.height/2}; // drawPile position on canvas
const drawEffetPos = {x:drawPilePos.x+5, y:drawPilePos.y-5}; // "draw effect" with a card on top of the draw pile
const discardPilePos = {x:400 - cardSizeOnScreen.width, y:300 - cardSizeOnScreen.height/2}; // discardPile position on canvas
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
let selectedPlayer = -1;

// init game state
const gamestates = {
	"main menu":0,
	"table view":1,
	"action:choose":20,
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

// change a knight's shield: move the original shield to the discard pile and put the new card as the shield
function changeShield(player) {
	// discarding old shield
	moveCard(player.shield, discardPile);
	// first card of the draw pile as the new shield
	moveCard(drawPile, player.shield);

	addLogEntry("Changing " + player.name + "'s shield for " + getCardName(player.shield[0]), "SHIELD");
}

// charge a knight
function chargeKnight(player) {
	// add the first card of drawPile to the player's charges
	moveCard(drawPile, player.charge);

	addLogEntry("Charging " + player.name, "CHARGE");
}

// attack a knight
function attackKnight(attackingPlayer, defendingPlayer) {
	// totalAttack is the sum of the first card from the drawPile and potential charges
	let totalAttack = getCardValue(drawPile[0]);
	totalAttack += getTotal(attackingPlayer.charge);

	// if totalAttack goes through the shield
	const shieldValue = getCardValue(defendingPlayer.shield[0]);

	addLogEntry("Trying to attack " + defendingPlayer.name + " with a total attack value of " + totalAttack, "ATTACK");

	if (totalAttack > shieldValue) {
		// losingPoints are remaining points after shield absorption
		const losingPoints = totalAttack - shieldValue;

		// remainingHp is the theoretical remaining health points
		const totalHp = getTotal(defendingPlayer.hp);
		const remainingHp = Math.max(0, totalHp - losingPoints);

		// if remainingHp is zero, that player loses the game, discarding their cards
		if (remainingHp <= 0) {
			emptyPlayer(defendingPlayer);
			addLogEntry(defendingPlayer.name + " has lost! Their cards are discarded.", "INFO");
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

			addLogEntry(defendingPlayer.name + " has lost " + losingPoints + " points", "ATTACK");
		}
	} else {
		addLogEntry(defendingPlayer.name + " stood still !", "ATTACK");
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
function isPlayerDead(player) {
	return (getTotal(player.hp) === 0);
}

// check if a player has won
function hasPlayerWon() {
	let hasWon = true;
	for (let p = 0; p < players.length; p++) {
		if (p !== activePlayerIndex) {
			if (!isPlayerDead(players[p])) hasWon = false;
		}
	}
	return hasWon;
}

// switch to the next player
function nextPLayer() {
	activePlayerIndex = (activePlayerIndex + 1) % players.length;
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

		let offset = {x:0, y:0};
		offset.x = (p < 2) ? 50 : 450;
		offset.y = (p % 2 === 0) ? 400 : 0;
		const pBox = [offset.x, offset.y, offset.x+250, offset.y+200];
		newP.box = pBox;
		console.log((p+1)+ ": " +pBox);

		// distribute three cards to this player
		moveCard(drawPile, newP.hp);
		moveCard(drawPile, newP.hp);
		moveCard(drawPile, newP.shield);

		players.push(newP);
	}

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
	const clickPoint = [event.clientX, event.clientY];
	// Main menu
	if (GAMESTATE === gamestates['main menu']) {
		// Check if we click on one of the boxes with the number of players
		for (let b = 0; b < choosePlayersBoxes.length; b++) {
			if (isPointInBox(clickPoint, choosePlayersBoxes[b])) {
				// Init the game with 2-4 players depending on the box we clicked on
				initGame(b+2);
				// Show the game table
				GAMESTATE = gamestates['table view'];
				break;
			}
		}
	// Click on Game over screen -> Go to main screen
	} else if (GAMESTATE === gamestates['game over']) {
		flushEntries();
		GAMESTATE = gamestates['main menu'];
	// Table view : we can only click on the draw pile
	} else if (GAMESTATE === gamestates['table view']) {
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
		// If we show the top card, it means we have selected a player
		if (selectedPlayer >= 0) {
			if (GAMESTATE === gamestates['action:attack']) { attackKnight(players[activePlayerIndex], players[selectedPlayer]); }
			else if (GAMESTATE === gamestates['action:shield']) { changeShield(players[selectedPlayer]); }
			else if (GAMESTATE === gamestates['action:charge']) { chargeKnight(players[selectedPlayer]); }

			selectedPlayer = -1;
			showDrawPileTopCard = false;

			if (hasPlayerWon()) { 
				addLogEntry(players[activePlayerIndex].name + " has won the game !");
				GAMESTATE = gamestates['game over']; 
			} else {
				nextPLayer();
				GAMESTATE = gamestates['table view'];
			}
		// We have to choose a player for the selected action
		} else {
			for (let p=0; p < players.length; p++) {
				if(!isPlayerDead(players[p])) { 
					const pBox = players[p].box;
					// Click on a player
					if (isPointInBox(clickPoint, pBox)) {
						if (GAMESTATE !== gamestates['action:charge']) showDrawPileTopCard = true;
						selectedPlayer = p;
						break;
					}
				}
			}
		}
	}
}
// make the canvas clickable
c.onclick=click;

// show the rules of the game
function showHelp() {
	alert("RULES\n \
Game of knights is a tabletop game using a pack of 52 cards. It can be played with 2+ players.\n \
Shuffle the pack of cards. Each knight starts with two face-up cards as lifepoints (sum of their values) and one face-up shield card.\n \
The rest of the deck is the draw pile.\n \
On your turn, choose one action. Then draw the top card of the draw pile and resolve the action:\n \
- Change Shield: replace any knight's shield with the drawn card. Their old shield goes to the discard pile.\n \
- Charge: place the drawn card face-down next to a knight as a charge. It adds to this knight's next attack.\n \
- Attack: your attack value is the drawn card plus all your charges. If your attack is higher than the defender's shield, they lose lifepoints equal to the difference. After attacking, discard the drawn card, your charges and the defending knight's charges.\n \
A knight loses at 0 lifepoints. The last knight standing wins.");
}

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
	ctx.fillText("Attack a knight", attackPos.x + 50, attackPos.y + 30);
}

// draw shield action on canvas
function drawShieldActionOnCanvas() {
	ctx.drawImage(spr, shieldSprite.x, shieldSprite.y, shieldSprite.w, shieldSprite.h, shieldPos.x, shieldPos.y, Math.round(shieldSprite.w*0.4), Math.round(shieldSprite.h*0.4));
	ctx.fillStyle = "black";
	ctx.fillText("Change a knight's shield", shieldPos.x + 50, shieldPos.y + 30);
}

// draw charge action on canvas
function drawChargeActionOnCanvas() {
	ctx.drawImage(spr, chargeSprite.x, chargeSprite.y, chargeSprite.w, chargeSprite.h, chargePos.x, chargePos.y, Math.round(chargeSprite.w*0.4), Math.round(chargeSprite.h*0.4));
	ctx.fillStyle = "black";
	ctx.fillText("Charge a knight", chargePos.x + 50, chargePos.y + 30);
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
	if (GAMESTATE === gamestates['main menu']) {
		if(mainMenuScreenReady) {
			ctx.drawImage(mainMenuScreen, 0, 0, mainMenuScreen.width, mainMenuScreen.height, 0, 0, 800, 600);
		}
	} else if (GAMESTATE === gamestates['game over']) {
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
			
			// draw actions or choose player
			if (GAMESTATE === gamestates['action:choose']) {
				// draw a face down card on top of the draw pile to mimic a "draw effect"
				drawCard(cardFaceDown, drawEffetPos);
				// draw actions
				drawAttackActionOnCanvas();
				drawShieldActionOnCanvas();
				drawChargeActionOnCanvas();
			} else if (GAMESTATE >= gamestates['action:attack'] && GAMESTATE <= gamestates['action:charge']) {
				if (showDrawPileTopCard) {
					// draw drawPile top card
					const drawPileTopCardSprite = getSpriteCoordFor(drawPile[0]);
					drawCard(drawPileTopCardSprite, drawEffetPos);
				} else {
					// draw a face down card on top of the draw pile to mimic a "draw effect"
					drawCard(cardFaceDown, drawEffetPos);
					// only draw the chosen action
					if (GAMESTATE === gamestates['action:attack']) {
						drawAttackActionOnCanvas();
					} else if (GAMESTATE === gamestates['action:shield']) {
						drawShieldActionOnCanvas();
					} else if (GAMESTATE === gamestates['action:charge']) {
						drawChargeActionOnCanvas();
					}
				}
			}
			
			// draw players
			for (let p = 0; p < players.length; p++) {
				if(!isPlayerDead(players[p])) {
					// Show a colored box around the active player, or all players if we have to choose a player for an action
					if(p === activePlayerIndex || (GAMESTATE >= gamestates['action:attack'] && GAMESTATE <= gamestates['action:charge'] && !showDrawPileTopCard)) {
						drawPlayerBox(ctx, players[p]);
					}

					// draw hp
					let hpCardsPos = {x:players[p].box[0]+40, y:0};
					hpCardsPos.y = (p % 2 === 0) ? players[p].box[1] + (200 - 10 - 78) : 10;
					for (let hpCard = 0; hpCard < players[p].hp.length; hpCard++) {
						const hpCardCoord = getSpriteCoordFor(players[p].hp[hpCard]);
						hpCardsPos.x = hpCardsPos.x + hpCard*71.5;
						drawCard(hpCardCoord,hpCardsPos);
					}

					// draw shield
					let shieldCardPos = {x:players[p].box[0] + 40 + 65 - cardSizeOnScreen.width/2, y:0};
					shieldCardPos.y = (p % 2 === 0) ? players[p].box[1] + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
					const shieldCardCoord = getSpriteCoordFor(players[p].shield[0]);
					drawCard(shieldCardCoord, shieldCardPos, 90);
					
					// draw charge
					if (players[p].charge.length > 0) {
						let chargeCardPos = {x:players[p].box[0] + 40 + 65 + 65 + 10, y:0};
						chargeCardPos.y = (p % 2 === 0) ? players[p].box[1] + (200 - 10 - 78 - 10 - 78) : 10 + (78 + 10);
						// if the active player is attacking
						if (GAMESTATE === gamestates['action:attack'] && showDrawPileTopCard && p === activePlayerIndex) {
							// showing charges in a cascade
							for (let c = 0; c < players[p].charge.length; c++) {
								let chargeSpr = getSpriteCoordFor(players[p].charge[c]);
								let chargeCascadeOffset = c*26;
								let chargeCascade = {x:chargeCardPos.x, y:chargeCardPos.y};
								chargeCascade.y += (p % 2 === 0) ? chargeCascadeOffset : (-1)*chargeCascadeOffset;
								drawCard(chargeSpr, chargeCascade);
							}
						} else {
							// show a face down card with the number of charges written in a corner
							drawCard(cardFaceDown, chargeCardPos);
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

main();
