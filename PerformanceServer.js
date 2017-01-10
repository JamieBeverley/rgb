var http = require('http');
var express = require('express');
var server = http.createServer();
var expressServer = express();
var osc = require ('osc')

var scOSC = new osc.UDPPort({
	localAddress: "0.0.0.0", 
	localPort: 9000,
	remoteAddress: "127.0.0.1",
	remotePort: 9010
})
scOSC.open();

var wekBlueOSC = new osc.UDPPort({
	localAddress: "0.0.0.0",
	localPort: 9001, //won't use this...
	remoteAddress: "127.0.0.1",
	remotePort: 9002 // this is wat wek should listen on
})
wekBlueOSC.open();

var wekRedOSC = new osc.UDPPort({
	localAddress: "0.0.0.0",
	localPort: 9011, //won't use this...
	remoteAddress: "127.0.0.1",
	remotePort: 9004 // this is wat wek should listen on
})
wekRedOSC.open();

var wekGreenOSC = new osc.UDPPort({
	localAddress: "0.0.0.0",
	localPort: 9012, //won't use this...
	remoteAddress: "127.0.0.1",
	remotePort: 9006 // this is wat wek should listen on
})
wekGreenOSC.open();

// @ time weighted averages 


// uses current directory
expressServer.use(express.static(__dirname));
server.on('request', expressServer)


//server listening on 8000
server.listen(8000, function(){console.log("listening")})

// from this can make websocket server

var WebSocket = require('ws')
var wsServer = new WebSocket.Server({server: server});

var id=0;
var clients = {};
var close = {}
var blueTeam=0;
var redTeam=0;
var numClients=0;

wsServer.on('connection', function(r){
	id=id+1;
	console.log("_____________________ ID:  "+id)
	
	numClients++;
	
	r.identifier=id;

	blueTeam++;
	r.closingFlag=false;
	//Default setting
	clients[id]={team:"Blue", client: r, xyz:[0,0,0], motion:0, motionShort:0, motionMedium:0, motionLong:0};

	console.log((new Date())+ 'Connection accepted, id: '+ id);


	r.on('message',function(message){

		var msg = JSON.parse(message);
		if (msg.type =='motion'){
			//Sends motion messages
			try{
				clients[r.identifier].xyz = [msg.xyz[0],msg.xyz[1],msg.xyz[2]]
				// where motion = a cooked measure of jerk (change in acceleration)
				clients[r.identifier].motion = msg.motion;
				clients[r.identifier].motionShort = msg.motionShort
				clients[r.identifier].motionMedium = msg.motionMedium 
				clients[r.identifier].motionLong = msg.motionLong

				// console.log("#uncooked:  " +msg.motion)
			}
			catch(e){
				console.log("WARNING: motion update dropped for: "+id)
				console.log(e)
		}
			// try{scOSC.send(oscMsg)}
			// catch(e){console.log("error sending OSC for: " + id)}
		}

		//@Do I use the team counters for anythign?/should they be updated here again?
		else if (msg.type == 'teamChange'){
			if(msg.value == "Blue") {
				clients[r.identifier].team = "Blue"
			}
			else if (msg.value == "Red") {
				clients[r.identifier].team = "Red"
			}
			else if (msg.value == "Green") {
				clients[r.identifier].team = "Green"
			}

		}
	});//end on message

	r.on('error',function(){
		for (var a in clients){
			if (clients[a].client.identifier == r.identifier) delete clients[a]
	}
	})

	r.on('close', function(reasonCode, description){
		for (var a in clients){
			if (clients[a].client.identifier==r.identifier) {
				// if (clients[a].team=="Blue") blueTeam--; else redTeam--;
				close[a]=true;
				console.log("Client: " +a+" disconnected");
				delete clients[a]
				break;
			}
		}
		numClients--;

		//Tell SuperCollider how many clients are connected
		scOSC.send({address:"/disconnect", args: []});
	})
	//identifier of the client. also increments the counter
	
});

setInterval(function(){
	var blueMotionArray = []
	var blueMotionShortArray = []
	var blueMotionMediumArray = []
	var blueMotionLongArray = []
	// var blueXArray = []
	// var blueYArray = []
	// var blueZArray = [];
	var redMotionArray = []
	var redMotionShortArray = []
	var redMotionMediumArray = []
	var redMotionLongArray = []
	// var redXArray = []
	// var redYArray = []
	// var redZArray = [];
	var greenMotionArray = []
	var greenMotionShortArray = []
	var greenMotionMediumArray = []
	var greenMotionLongArray = []
	// var greenXArray = []
	// var greenYArray = []
	// var greenZArray = [];


	// var numClients = Object.keys(motion).length;
	for (var ids in clients){
		var i = clients[ids]
		if(i.team =="Blue"){
			blueMotionArray.push(parseFloat(i.motion));
			blueMotionShortArray.push(parseFloat(i.motionShort));
			blueMotionMediumArray.push(parseFloat(i.motionMedium));
			blueMotionLongArray.push(parseFloat(i.motionLong));
			// blueXMean = blueXMean+Math.abs(parseFloat(i.xyz[0]));
			// blueYMean = blueYMean+Math.abs(parseFloat(i.xyz[1]));
			// // blueZMean = blueZMean+Math.abs(parseFloat(i.xyz[2]));
			// blueXArray.push(Math.abs(parseFloat(i.xyz[0])));
			// blueYArray.push(Math.abs(parseFloat(i.xyz[1])));
			// blueZArray.push(Math.abs(parseFloat(i.xyz[2])));
		}
		else if (i.team =="Red"){
			console.log("red    :")
			redMotionArray.push(parseFloat(i.motion));
			redMotionShortArray.push(parseFloat(i.motionShort));
			redMotionMediumArray.push(parseFloat(i.motionMedium));
			redMotionLongArray.push(parseFloat(i.motionLong));
			// redXMean = redXMean+Math.abs(parseFloat(i.xyz[0]));
			// redYMean = redYMean+Math.abs(parseFloat(i.xyz[1]));
			// redZMean = redZMean+Math.abs(parseFloat(i.xyz[2]));
			// redXArray.push(Math.abs(parseFloat(i.xyz[0])));
			// redYArray.push(Math.abs(parseFloat(i.xyz[1])));
			// redZArray.push(Math.abs(parseFloat(i.xyz[2])));
		}
		else if (i.team=="Green"){
			greenMotionArray.push(parseFloat(i.motion));
			greenMotionShortArray.push(parseFloat(i.motionShort));
			greenMotionMediumArray.push(parseFloat(i.motionMedium));
			greenMotionLongArray.push(parseFloat(i.motionLong));
			// greenXMean = greenXMean+Math.abs(parseFloat(i.xyz[0]));
			// greenYMean = greenYMean+Math.abs(parseFloat(i.xyz[1]));
			// greenZMean = greenZMean+Math.abs(parseFloat(i.xyz[2]));
			// greenXArray.push(Math.abs(parseFloat(i.xyz[0])));
			// greenYArray.push(Math.abs(parseFloat(i.xyz[1])));
			// greenZArray.push(Math.abs(parseFloat(i.xyz[2])));
			
		}
	}	


	sendData(blueMotionArray, blueMotionShortArray, blueMotionMediumArray, blueMotionLongArray, "Blue") 
	sendData(redMotionArray, redMotionShortArray, redMotionMediumArray, redMotionLongArray, "Red") 
	sendData(greenMotionArray, greenMotionShortArray, greenMotionMediumArray, greenMotionLongArray, "Green") 


	// sendData(blueMotionArray,blueMotionShortArray,blueMotionLongArray, blueXArray, blueYArray, blueZArray, "Blue")
	// sendData(greenMotionArray, greenXArray, greenYArray, greenZArray, "Green")
	// sendData(redMotionArray, redXArray, redYArray, redZArray, "Red")
	// try{scOSC.send(blueMsg);scOSC.send(redMsg)}
	// catch(e){console.log("error sending OSC for motion")}

},50)


//@ Long dimension to variance: what kind of variance is happening over the past x Long?
// ex: mean over window, max and min over window, slope over window, etc...
//function sendData(motionArray, motionShortArray, motionMediumArray, motionLongArray, xArray, yArray, zArray, team){

function sendData(motionArray, motionShortArray, motionMediumArray, motionLongArray, team){
	var motionMean = motionVariance = motionShortMean = motionShortVariance = motionMediumMean = motionMediumVariance = motionLongMean = motionLongVariance = 0//= xMean = xVariance = yMean = yVariance = zMean = zVariance = xVarLong=yVarLong=zVarLong= xVarShort=yVarShort=zVarShort= 0;

	//Calculates mean motion
	for (var val in motionArray){
		motionMean = motionMean + motionArray[val];
		motionShortMean = motionShortMean+motionShortArray[val]
		motionMediumMean = motionMediumMean+motionMediumArray[val]
		motionLongMean = motionLongMean + motionLongArray[val]
	}
	if(motionArray.length!=0) {
		motionMean = motionMean/motionArray.length
		motionMediumMean = motionMediumMean/motionMediumArray.length
		motionShortMean = motionShortMean/motionShortArray.length
		motionLongMean = motionLongMean/motionLongArray.length
	}
	else {motionMean = motionShortMean = motionLongMean = motionMediumMean = 0;}

	//Calculates motion variance
	for (var val in motionArray){
		motionVariance = motionVariance+(motionArray[val]-motionMean)*(motionArray[val]-motionMean)
		motionShortVariance = motionShortVariance + (motionShortArray[val]-motionShortMean)*(motionShortArray[val]-motionShortMean)
		motionMediumVariance = motionMediumVariance + (motionMediumArray[val]-motionMediumMean)*(motionMediumArray[val]-motionMediumMean)
		motionLongVariance = motionLongVariance + (motionLongArray[val]-motionLongMean)*(motionLongArray[val]-motionLongMean)
	}	
	if(motionArray.length!=0) {
		motionVariance = motionVariance/motionArray.length; 
		motionShortVariance=motionShortVariance/motionShortArray.length;
		motionMediumVariance = motionMediumVariance/motionMediumArray.length;
		motionLongVariance= motionLongVariance/motionLongArray.length;
	}
	else {motionVariance = motionShortVariance = motionLongVariance = motionMediumVariance = 0;}
	
	//Normalize it.
	// motionMean = Math.min((motionMean)/30,1)
	// motionShortMean = Math.min((motionShortMean)/30,1)
	// motionLongMean = Math.min((motionLongMean)/30,1)
	motionMean = Math.round(motionMean*10)/10
	motionShortMean = Math.round(motionShortMean*10)/10
	motionMediumMean = Math.round(motionMediumMean*10)/10
	motionLongMean = Math.round(motionLongMean*10)/10


	console.log("###############     team:    "+team)
	console.log("team n:  "+motionArray.length)
	console.log("motionMean:  "+motionMean)
	console.log("motionShortMean:  "+motionShortMean)
	console.log("motionMediumMean:  "+motionMediumMean)
	console.log("motionLongMean:  "+motionLongMean)

	console.log("motion Variance: "+motionVariance)
	console.log("motionShortVariance:  "+motionShortVariance)
	console.log("motionMediumVariance:  "+motionMediumVariance)
	console.log("motionLongVariance:  "+motionLongVariance)
	console.log("---------------- Difference (long to inst.):  "+(motionLongMean-motionMean))

	// @Are we including means?
	// var coherenceMsg = {
	// 	address: "/wek/"+team,
	// 	args: [motionVariance, motionMean, motionShortMean, motionShortVariance, motionMediumMean, motionMediumVariance, motionLongMean, motionLongVariance]
	// }

//@ exclusion/expirey tag on data based on time

	var coherenceMsg = {
		address: "/wek/"+team,
		args: [motionVariance,motionShortVariance,motionMediumVariance,motionLongVariance]
	}

	var motionMsg = {
		address:"/motion/"+team,
		args: [motionMean]
	}


	try{
		if (team=="Blue") wekBlueOSC.send(coherenceMsg)
		else if (team=="Red") {wekRedOSC.send(coherenceMsg)}
		else if (team == "Green") wekGreenOSC.send(coherenceMsg)

		scOSC.send(motionMsg)
	}
	catch(e){
		console.log("error sending OSC")
		console.log(e)
		console.log("______________________")
	}
}



function mean(array){
	var result=0
	for (i in array){
		result=result+array[i]
	}
	return result/array.length
}


scOSC.on('message',function(msg){
	var msg;
	var team;
	var type;
	for (var i in clients) {
		console.log("id:  "+i+"   color:  "+clients[i].team)
	}
	
	switch (msg.address[7]){
		case 'b':
			team = "Blue"
			break;
		case 'g':
			team = "Green"
			break;
		case 'r':
			team = "Red"
			break;
	}
	if (msg.address.endsWith("cheering")) {type = "cheering";}
	else if (msg.address.endsWith("loudness")) {type = "loudness"}
	else if (msg.address.endsWith("penalty")) {type = "penalty"}
	else if (msg.address.endsWith("pitch")) {type = "pitch"}
	else if (msg.address.endsWith("vibration")) {type = "vibration"}
	else return;
	
	var val = parseFloat(msg.args);

	var wsMsg = {type: type, value: val}

	wsMsg=JSON.stringify(wsMsg)

	if (team=="Green"){
		for (var i in clients){
			clients[i].client.send(wsMsg)
			console.log("Green")
		}
	}
	else if(team=="Blue"){
		for (var i in clients){
			console.log("Blue")
			if (clients[i].team == "Blue") clients[i].client.send(wsMsg)
		}
	}

	else if(team=="Red"){
		for (var i in clients){
			console.log("Red")
			if (clients[i].team == "Red") clients[i].client.send(wsMsg)
		}
	}
})

wsServer.broadcast = function (data){
  for (i in clients)
    i.send(data)

}


