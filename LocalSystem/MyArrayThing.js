var tdName = "MyArrayThing";
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
var myArray = [5,true,"sosos",{x:0}]

var srv = new servient_1.default();
srv.addServer(new http_server_1.default(9001));
srv.addClientFactory(new http_client_factory_1.default());
var WoT = srv.start();

WoT.createFromDescription(td).then(function(thing){
    console.log("created " + thing.name);
    timers.setInterval(function() {
        myArray[0]++;
        myArray[1]=!myArray[1];
        myArray[2]+="x";
        myArray[3].x++;
        if(myArray[0] == 50) myArray[0]=-10;
        if(myArray[2].length == 20) myArray[2] = "sds";
        if(myArray[3].x == 23) myArray[3].x = -3;
        thing.setProperty('myArray', myArray);
    }, 10000);

    thing.onUpdateProperty("myArray",function(newValue, oldValue) {
        console.log("myArray changed: ",oldValue, " -> ",newValue);
    })
    
});
