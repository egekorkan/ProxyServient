var tdName = "MyObjectThing";
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
var myObject = {x:"woho",
y:true,
z:5};

var srv = new servient_1.default();
srv.addServer(new http_server_1.default(9003));
srv.addClientFactory(new http_client_factory_1.default());
var WoT = srv.start();

WoT.createFromDescription(td).then(function(thing){
    console.log("created " + thing.name);

    thing.setProperty('myObject', myObject);
    
    timers.setInterval(function() {
        myObject.x+="a";
        myObject.y = !myObject.y;
        myObject.z ++;
        if(myObject.x.length > 50) myObject.x = "asd";
        if(myObject.z>50) myObject.z = -10;
        thing.setProperty('myObject', myObject);
    }, 10000);

    thing.onUpdateProperty("myObject",function(newValue, oldValue) {
        console.log("myObject changed: ",oldValue, " -> ",newValue);
        console.log("typeof object is ",typeof myObject)
        console.log("x is ",myObject.x);
        console.log("y is ",myObject.y);
        console.log("z is ",myObject.z);
    })
    
});
