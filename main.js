// init canvas
let c=document.getElementById('myCanvas');
c.width = 800;
c.height = 600;
let ctx=c.getContext('2d');
ctx.font = "30px serif";

// load sprites
let spr=new Image();
let sprReady=false;
spr.onload=function() { sprReady=true; };
spr.src='sprites.jpg';

// init cards
const cardFaceDown = {x:1765, y:30}; // position of the faced down card in the sprites
const cardSize = {width:117, height:156}; // card size in the sprites
const deck = createDeck(); // creates a reference for the cards (id, value, color)
let drawPile = Array.from({ length: 52 }, (_, i) => i + 1);
let discardPile = [];

// init players
let players = [];

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
    const suits = ["clubs", "hearts", "spades", "diamonds"];
    const deck = {};

    for (let i = 0; i < suits.length; i++) {
        const suit = suits[i];
        for (let value = 1; value <= 13; value++) {
            const id = i * 13 + value;
            deck[id] = { id, value, color: suit };
        }
    }

    return deck;
}

// create a new player
function Player(playerName) {
	this.name = playerName;
	this.hp = [];
	this.shield = [];
	this.charge = [];
}
// change Player toString
Player.prototype.toString = function playerToString() {
	return "{" +
		this.name + "; " +
		"shield: " + getCardValue(this.shield) + "; " +
		"hp: [" + getCardValue(this.hp[0]) + "," + getCardValue(this.hp[1])+ "]" +
		"}";
};

// refreshDrawPile : if drawPile is empty; shuffle the discardPile into a new drawPile
function refreshDrawPile() {
	if(drawPile.length === 0) {
		drawPile = discardPile;
		discardPile = [];
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
		console.log("moved " + removedCard + " (" + deck[removedCard].value + " of " + deck[removedCard].color + ")");
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

// get sum of values in a list of cards
function getTotal(cards) {
    return cards.reduce((sum, card) => sum + getCardValue(card), 0);
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
	totalAttack += getTotal(defendingPlayer.charge);

	console.log("trying to attack " + defendingPlayer.toString() + " with " + totalAttack);

	// if totalAttack goes through the shield
	const shieldValue = getCardValue(defendingPlayer.shield[0]);
	if (totalAttack > shieldValue) {
		// losingPoints are remaining points after shield absorption
		const losingPoints = totalAttack - shieldValue;

		// remainingHp is the theoretical remaining health points
		const totalHp = getTotal(defendingPlayer.hp);
		const remainingHp = Math.max(0, totalHp - losingPoints);

		// if remainingHp is zero, that player loses the game, discarding their cards
		if (remainingHp == 0) {
			// discarding hp cards
			console.log(defendingPlayer.name + " loses their health points");
			while (defendingPlayer.hp.length > 0) {
				moveCard(defendingPlayer.hp, discardPile);
			}
			// discarding their shield
			console.log(defendingPlayer.name + " loses their shield");
			moveCard(defendingPlayer.shield, discardPile);
			// remove the player from the game
			console.log(defendingPlayer.name + " loses the game");
			checkPlayerDead(defendingPlayer);
		} else {
			// try replacing only one card to match the new hp
		    for (let i = 0; i < defendingPlayer.hp.length; i++) {
		        const unchangedTotal = getTotal(defendingPlayer.hp) - getCardValue(defendingPlayer.hp[i]);
		
		        const replacementValue = remainingHp - unchangedTotal;
				// if replacementValue can be a card
		        if (replacementValue >= 1 && replacementValue <= 13) {
		            let replacementCard = findReplacementCardFor(replacementValue);
					if (replacementCard[1] > 0) {
						moveCard(defendingPlayer.hp, discardPile, defendingPlayer.hp[i]);
						moveCard(replacementCard[0], defendingPlayer.hp, replacementCard[1]);
					} else {
						
					}
					break;
		        }
		    }
		}
	} else {
		console.log ("nothing happens...");
	}

	// discarding the attack card
	moveCard(drawPile, discardPile);

	// defending player looses all their charges on an attack
	while(defendingPlayer.charge.length > 0) {
		moveCard(defendingPlayer.charge, discardPile);
	}
}

// check if a player has lost
function checkPlayerDead(player) {
	if(player.hp.length == 0) {
		const indexToRemove = players.indexOf(player);
		const playerRemoved = players.splice(indexToRemove, 1)[0];
		return true;
	}
	else return false;
}

// check if a player has won
function checkPlayerWon() {
	if (players.length == 1) return true;
	else return false;
}

// init game
function initGame(numberOfPlayers) {
	// init players
	for(let p = 1; p <= numberOfPlayers; p++) {
		players.push(new Player("Player "+p));
	}
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

// drawing cards on canvas
let render=function() {
	if(sprReady) {
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, 800, 600);
		ctx.fillStyle = "black";
		//ctx.drawImage(spr, 64+64*cardX, 64*cardY, 64, 64, offsetX, offsetY, 64, 64);
		for (let p = 0; p < players.length; p++) {
			ctx.fillText(players[p].toString(), 50, 50*(p+1));
		}
		ctx.fillText("drawPile: length " + drawPile.length + ", top " + getCardValue(drawPile[0]) + " of " + deck[drawPile[0]].color, 50, 150);
		ctx.fillText("discardPile: length " + discardPile.length, 50, 200);
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

initGame(2);
main();
