var TDParser = require("/home/eko/Code/node-wot/packages/node-wot-td-tools/dist/td-parser");
var servient_1 = require("/home/eko/Code/node-wot/packages/node-wot/dist/servient");
var http_client_factory_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-client/dist/http-client-factory");
var http_server_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-server/dist/http-server");


//var coap_server_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-coap-server/dist/coap-server");
//var coap_client_factory_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-coap-client/dist/coap-client-factory");

var fs = require("fs");
var timers = require('timers')

//getting the TD 
var tdName = "MyTemperatureThing"; 
var tdString = fs.readFileSync("./TDs/"+tdName+'.jsonld', "utf8");
var td = TDParser.parseTDString(tdString);

//creating a Thing
var temperature = 0;
var proxyAddress = "http://localhost:9000/";
var proxyMethods = {
  GET: "GET",
  UPDATE: "PUT",
  DELETE: "DELETE",
};

var srv = new servient_1.default();
srv.addServer(new http_server_1.default(9002));
srv.addClientFactory(new http_client_factory_1.default());

//srv.addServer(new coap_server_1.default(5685));
//srv.addClientFactory(new coap_client_factory_1.default());

var WoT = srv.start();

WoT.createFromDescription(td).then(function(thing){
    console.log("created " + thing.name);

    thing.setProperty('temperature', temperature);
    timers.setInterval(function() {
        temperature++;
        if(temperature > 50){
            temperature = 10;
        }
        thing.setProperty('temperature', temperature);
    }, 10000);

    thing.onUpdateProperty("temperature",function(newValue, oldValue) {
        console.log(oldValue + " -> " + newValue);
        var message = (oldValue < newValue)? "increased " : "decreased";
        console.log("temperature " + message + " to " + newValue);
    });

    thing.onInvokeAction("test1",function(input){
        console.log(input);
        return 2;
    })
    
});
