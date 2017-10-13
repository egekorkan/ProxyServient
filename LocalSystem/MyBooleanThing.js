var tdName = "MyBooleanThing";
var TDParser = require("/home/eko/Code/node-wot/packages/node-wot-td-tools/dist/td-parser");
var servient_1 = require("/home/eko/Code/node-wot/packages/node-wot/dist/servient");
var http_client_factory_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-client/dist/http-client-factory");
var http_server_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-server/dist/http-server");
var fs = require("fs");
var fs = require("fs");
var timers = require('timers')
//getting the TD
var tdString = fs.readFileSync("./TDs/"+tdName+'.jsonld', "utf8");
var td = TDParser.parseTDString(tdString);
//creating a Thing
var myBool = false;

var srv = new servient_1.default();
srv.addServer(new http_server_1.default(9004));
srv.addClientFactory(new http_client_factory_1.default());
var WoT = srv.start();

WoT.createFromDescription(td).then(function(thing){
	console.log("created " + thing.name);

	thing.setProperty('myBool', myBool);
	timers.setInterval(function() {
		myBool=!myBool;
		thing.setProperty('myBool', myBool);
	}, 10000);

	thing.onUpdateProperty("myBool",function(newValue, oldValue) {
		console.log("myBool changed: ",oldValue + " -> " + newValue);
	})

});
