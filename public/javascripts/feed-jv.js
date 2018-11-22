let accountCards = document.querySelector(".account > .card")
let accountButtons = document.querySelector(".account > .connect-with")
let dropdown = document.querySelector(".dropdown");
let dropBtn = document.querySelector("#dd-btn");
let rotateIcon = document.querySelector(".rotate");
let serviceCard = document.querySelector(".services > .card")
let serviceButton = document.querySelector(".services > .connect-with")

let titles = document.querySelector("body > h2");
let recent = document.querySelector(".section-title > h2")

// DROPDOWN

var isRotated = false;

dropBtn.onclick = function (event) {
	console.log(event);
	if (!isRotated) {
		TweenLite.fromTo(rotateIcon, 0.5, {rotation: 0}, {rotation: 180});
		TweenLite.fromTo(dropdown, 0.5, {opacity: 0, y: 0}, {opacity: 1, y: 230});
		isRotated = true;
	}
	else if (isRotated) {
		TweenLite.fromTo(rotateIcon, 0.5, {rotation: 180}, {rotation: 0});
		TweenLite.fromTo(dropdown, 0.5, {opacity: 1, y: 230}, {opacity: 0, y: 0})
		isRotated = false;
	}


}

// RESULTS

TweenLite.fromTo(".spotify-list", 0.8, {y: 1500, scale: 0.8, opacity: 0.8}, {y: 0, scale: 1, opacity: 1});
TweenLite.fromTo(".deezer-list", 0.6, {y: 800, scale: 0.8, opacity: 0.8}, {y: 0, scale: 1, opacity: 1});

// PROFILE 

if(accountCards) {
	

TweenLite.fromTo(accountCards, 0.8, {y: 1000, scale: 0.8, opacity: 0.8}, {y: 0, opacity: 1, scale: 1});
TweenLite.fromTo(accountButtons, 0.8, {y: 700, scale: 0.8, opacity: 0}, {y: -200 , opacity: 0, scale: 1});
TweenLite.fromTo(accountButtons, 0.6, {y: -200, scale: 0.8, opacity: 0.5}, {y: 0 , opacity: 1, scale: 1}).delay(0.8);
}

// SERVICES

if (serviceCard) {


TweenLite.fromTo(serviceCard, 0.8, {y: 1000, scale: 0.8, opacity: 0.8}, {y: 0, opacity: 1, scale: 1});
TweenLite.fromTo(serviceButton, 0.8, {y: 700, scale: 0.8, opacity: 0}, {y: -200 , opacity: 0, scale: 1});
TweenLite.fromTo(serviceButton, 0.6, {y: -200, scale: 0.8, opacity: 0.5}, {y: 0 , opacity: 1, scale: 1}).delay(0.8);
}

// PROFILE

TweenLite.fromTo(".user-info-profile", 0.8, {y: 1500, scale: 0.8, opacity: 0.8}, {y: 0, scale: 1, opacity: 1});
TweenLite.fromTo(".user-services", 0.8, {y: 1500, scale: 0.8, opacity: 0.8}, {y: 0, scale: 1, opacity: 1}).delay(0.1);
TweenLite.fromTo(titles, 1.3, {x: -1600, opacity: 0.8}, {x: 0, opacity: 1}).delay(0.6);



TweenLite.fromTo(".user-tracks", 0.8, {y: 800, scale: 0.8, opacity: 0.8}, {y: 0, scale: 1, opacity: 1}).delay(1.2);
TweenLite.fromTo(recent, 1, {x: -1100, opacity: 0.8}, {x: 0, opacity: 1}).delay(1.8);
