// init canvas
var c=document.getElementById('myCanvas');
var ctx=c.getContext('2d');

// load sprites
var spr=new Image();
var sprReady=false;
spr.onload=function() { sprReady=true; };
spr.src='sprites64.png';

// init cards
var cards;
var cardFaceDown={x:0, y:0};
var focusedCard=-1;
var hasCountdown=false;

// misc
var level=1;
var clicks=0;
var seconds=0;

// Fisher-Yates Shuffle
var shuffle=function(array) {
	var counter = array.length;

	// While there are elements in the array
	while (counter > 0) {
		// Pick a random index
		var index = Math.floor(Math.random() * counter);

		// Decrease counter by 1
		counter--;

		// And swap the last element with it
		var temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}

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

// drawing cards on canvas
var render=function() {
	if(sprReady) {
		var offsetX=0;
		var offsetY=0;
		for(var i=0; i<3*level; i++) {
			for(var j=0; j<6; j++) {
				var index=i*6+j;
				// card face up
				if(cards[index].show || cards[index].countdown>0) {
					// cardX and cardY are coordinates on the sprite
					var cardY=cards[index].id%9;
					var cardX=Math.floor(cards[index].id/9);
					ctx.drawImage(spr, 64+64*cardX, 64*cardY, 64, 64, offsetX, offsetY, 64, 64);
				}
				// card face down
				else ctx.drawImage(spr, cardFaceDown.x, cardFaceDown.y, 64, 64, offsetX, offsetY, 64, 64);
			
				offsetX+=64;
			}
			offsetX=0;
			offsetY+=64;
		}
	}
}

// The main game loop
var main = function () {
	// run the render function
	render();
	// Request to do this again ASAP
	requestAnimationFrame(main);
};
// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

init(level);
main();
