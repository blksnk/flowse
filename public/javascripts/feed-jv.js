var box = document.getElementsByClassName("message-box");

TweenLite.to(box, 1.8, {width:"900", height:"300px", padding: "20px"});


// ###########################################################################
// OVERVIEW


var card = document.getElementsByClassName("card");

TweenLite.fromTo(card, 1, {y: 1000}, {y: 0, immediateRender: false}, 1);