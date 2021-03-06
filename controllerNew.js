//http://www.freesound.org/people/YleArkisto/sounds/316717/ - crowd sound
// in this file:
// 1. connect to web socket server
// 2. send input from html page to ws server
// 3. listen to input from wss and distribute it to html page



var ws = new WebSocket('ws://'+location.hostname+":"+location.port, 'echo-protocol');
var motionArray = [0,0,0,0,0];
var xi=yi=zi=0;
var delta =0;

var ac;
var modPartial=1;
var attack = 0.005;
var release =0.5
var freq =0.5
var crowdBufferNode;
var crowdGainVal=0;
var crowdGain;
var crowdPitch = 110; 
var melodyGain;
var osc1, osc2, osc3;

function initWebAudio(){
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	ac = new AudioContext();
	console.log("Web Audio Initialized");
}



function testWebAudio(){
	// Crowd Buffer
	crowdBufferNode = ac.createBufferSource();
	var request = new XMLHttpRequest();
	request.open('GET', 'crowd3.wav', true);
	request.responseType = 'arraybuffer';
	request.onload = function() {
	var audioData = request.response;
	ac.decodeAudioData(audioData, function(buffer) {
	    crowdBufferNode.buffer = buffer;
	    crowdBufferNode.loop = true;
	  },
	  function(e){"Error with decoding audio data" + e.err});
	}
	crowdGain = ac.createGain();
	crowdBufferNode.connect(crowdGain);
	crowdGain.gain.value = 0;
	crowdGain.connect(ac.destination);

	request.send();
	crowdBufferNode.start(0);

	// Crowd Melody
	osc1 = ac.createOscillator();
	osc2 = ac.createOscillator();
	osc3 = ac.createOscillator();

	melodyGain = ac.createGain();

	osc1.frequency.value = 1*crowdPitch;
	osc2.frequency.value = 2*crowdPitch;
	osc3.frequency.value = 3*crowdPitch;3
	melodyGain.gain.value = 0;

	osc1.connect(melodyGain);
	osc2.connect(melodyGain);
	osc3.connect(melodyGain);
	melodyGain.connect(ac.destination);

	osc1.start();
	osc2.start();
	osc3.start();
	console.log("Web Audio Test run")

	// var mod = ac.createOscillator()
	// mod.frequency.value = crowdPitch*8;
	// mod.type = 'sine'	
	// mod.start();
	// var modGain = ac.createGain()
	// modGain.gain.value = crowdPitch;
	// mod.connect(modGain)
	// var car = ac.createOscillator()
	// modGain.connect(car.frequency);
	// car.type = 'sine'
	// var melodyGain = ac.createGain();
	// car.connect(melodyGain)
	// melodyGain.connect(ac.destination)
	// car.start()
	// var now = ac.currentTime;
	// gain.gain.setValueAtTime(0,now);
	// gain.gain.linearRampToValueAtTime(1,now+attack);
}

function teamChange(){
	var team = document.getElementById('team').value;
	var msg = {
		type:'teamChange',
		value: team
	}
	ws.send(JSON.stringify(msg))
}

function initUser(){
	var team = document.getElementById('team').value;
	if (team=="Blue"){
		document.getElementById('page').innerHTML = ""
		document.getElementById('page').innerHTML = '<input type="button" onclick="cheerBlue()" value="Cheer" style="hieght:80px;width:80px"></input>'
	}
	else if (team=="Red"){
		document.getElementById('page').innerHTML = ""
		document.getElementById('page').innerHTML = '<input type="button" onclick="cheerRed()" value="Cheer" style="hieght:80px;width:80px"></input>'
	}
}


function penalty(){
	var penaltyNode = ac.createOscillator();
	penaltyNode.frequency.value =0;
	penaltyNode.type='sawtooth'
	var penaltyGain = ac.createGain();
	penaltyGain.gain.linearRampToValueAtTime(1,ac.currentTime+0.01)
	penaltyGain.gain.linearRampToValueAtTime(0,ac.currentTime+2)
	penaltyNode.frequency.value = 440;
	penaltyNode.frequency.linearRampToValueAtTime(0,ac.currentTime+1)
	penaltyGain.gain.value = 0;
	penaltyNode.connect(penaltyGain);
	penaltyGain.connect(ac.destination);
	penaltyNode.start();
}


ws.addEventListener('message', function(message){
	var msg = JSON.parse(message.data)
	switch (msg.type){
		case "cheering":
			//@ add horns too... 
			crowdGain.gain.linearRampToValueAtTime(Math.max(Math.min(msg.value,1),0)*4,ac.currentTime+2);
			break;

		case "loudness":
			melodyGain.gain.linearRampToValueAtTime(Math.max(Math.min(msg.value,1),0)*4, ac.currentTime+2)
			break;

		case "penalty":
			penalty()
			setTimeout(function(){navigator.vibrate(500)}, 900)
			break;

		case "pitch":
			osc1.frequency.linearRampToValueAtTime(msg.value, ac.currentTime+0.5)
			osc2.frequency.linearRampToValueAtTime(msg.value*2, ac.currentTime+0.5)
			osc3.frequency.linearRampToValueAtTime(msg.value*8, ac.currentTime+0.5)
			break;

		case "vibration":
			navigator.vibrate(1000*Math.min(msg.value,10))
			break;

	}
})


// @look at what data produces 
// @long window
// @Spherical coordinate system
// @controll rate at which device motion is collected and sent

var xArray = [0,0,0,0,0,0,0,0,0,0]
var yArray = [0,0,0,0,0,0,0,0,0,0]
var zArray = [0,0,0,0,0,0,0,0,0,0]
var rMedium = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] // n = 80
var rLong = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] // n = 160
var rShort = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
// @timestamp it 
// ring buffer, garbage collection
// time averages instaed of thsi
window.addEventListener('devicemotion', function(event) {
	var xf = event.accelerationIncludingGravity.x
	var yf = event.accelerationIncludingGravity.y
	var zf = event.accelerationIncludingGravity.z
	var r = Math.sqrt(xf*xf+yf*yf+zf*zf)

	rLong.push(r);
	rLong = rLong.slice(-160)
	rMedium.push(r)
	rMedium = rMedium.slice(-80)
	rShort.push(r)
	rShort = rShort.slice(-40)

	//motion -instantaneous, motion short and long are over different windows. 
	var msg = {
		type: 'motion',
		xyz: [xf,yf,zf],
		motion: r,
		motionShort: mean(rShort),
		motionMedium: mean(rMedium),
		motionLong: mean(rLong)
	}
	ws.send(JSON.stringify(msg));

// var xf = event.acceleration.x
	// var yf = event.acceleration.y
	// var zf = event.acceleration.z
	// var deltaX = Math.abs(xf-xi)
	// var deltaY = Math.abs(yf-yi)
	// var deltaZ = Math.abs(zf-zi);
});


//@there's gotta be a javascript function for this...
function mean(array){
	var result=0
	for (i in array){
		result=result+array[i]
	}
	return result/array.length
}
