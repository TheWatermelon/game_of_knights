// init canvas
let c=document.getElementById('myCanvas');
let ctx=c.getContext('2d');

// load sprites
let spr=new Image();
let sprReady=false;
spr.onload=function() { sprReady=true; };
spr.src='sprites.png';

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
function newPlayer(playerName) {
	return {name: playerName, hp = [], shield = [], charge: []}
}

// move a card
function moveCard(fromPile, toPile, card) {
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

// change a knight's shield: move the original shield to the discard pile and put the new card as the shield
function changeShield(player) {
	// first card of the draw pile as the new shield
	let newCard = drawPile[0];
	moveCard(player.shield, discardPile, player.shield[0]);
	moveCard(drawPile, player.shield, newCard);
}

// charge a knight
function chargeKnight(player) {
	let newCard = drawPile[0];
	moveCard(drawPile, player.charge, newCard);
}

// attack a knight
function attackKnight(attackingPlayer, defendingPlayer) {
	// compare total attack with defender's shield
	let totalAttack = deck[drawPile[0]].value;
	for (let c = 0; c < attackingPlayer.charge.length; c++) {
		totalAttack += deck[attackingPlayer.charge[c]].value;
	}
	if (totalAttack > deck[defendingPlayer.shield[0]].value) {
		let losingPoints = totalAttack - deck[defendingPlayer.shield[0]].value;

		let totalHp = 0;
		for (let point = 0; point < defendingPlayer.hp; point++) {
			totalHp += deck[defendingPlayer.hp[point]].value;
		}
		
		let remainingHp = Math.max(0, totalHp - losingPoints);
		if (remainingHp == 0) then {
			for (let point = 0; point < defendingPlayer.hp; point++) {
				moveCard(defendingPlayer.hp, discardPile, defendingPlayer.hp[point]);
			}
			checkPlayerDead(defendingPlayer);
		} else {
			// convert the remainingHp into card values [13, x]
			// check discardPile then drawPile for compatible pairs
			// get the compatible pair as new hp
		}
	}
}

// check if a player has lost
function checkPlayerDead(player) {
	if(player.hp.length == 0) then {
		const indexToRemove = players.indexOf(player);
		const playerRemoved = players.splice(indexToRemove, 1)[0];
		return true;
	}
	else return false;
}

// check if a player has won
function checkPlayerWon() {
	if (players.length == 1) then return true;
	else return false;
}

// init game
function initGame(numberOfPlayers) {
	// init players
	for(let p = 0; p < numberOfPlayers; p++) {
		players.push(newPlayer("Player "+p));
	}
	// shuffle cards
	drawPile = shuffle(drawPile);
	// distribute three cards to all players
	for(let p = 0; p < players.length; p++) {
		moveCard(drawPile, p.hp, drawPile[0]);
		moveCard(drawPile, p.hp, drawPile[0]);
		moveCard(drawPile, p.shield, drawPile[0]);
	}
}

// game loop
function gameLoop() {
	initGame();

	// while nobody has won
	while(!checkPlayerWon()) {
		// for each player
		for(let p = 0; p < players.length; p++) {
			// choose an action
		}
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
		let offsetX=0;
		let offsetY=0;
		for(let i=0; i<3*level; i++) {
			for(let j=0; j<6; j++) {
				let index=i*6+j;
				// card face up
				if(cards[index].show || cards[index].countdown>0) {
					// cardX and cardY are coordinates on the sprite
					let cardY=cards[index].id%9;
					let cardX=Math.floor(cards[index].id/9);
					ctx.drawImage(spr, 64+64*cardX, 64*cardY, 64, 64, offsetX, offsetY, 64, 64);
				}
				// card face down
				else ctx.drawImage(spr, cardFaceDown.x, cardFaceDown.y, cardSize.width, cardSize.height, offsetX, offsetY, cardSize.width, cardSize.height);
			
				offsetX+=64;
			}
			offsetX=0;
			offsetY+=64;
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

//init(level);
main();
