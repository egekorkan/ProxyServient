var servient_1 = require("/home/eko/Code/node-wot/packages/node-wot/dist/servient");
var http_client_factory_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-client/dist/http-client-factory");
var http_server_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-server/dist/http-server");


var coap_server_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-coap-server/dist/coap-server");
var coap_client_factory_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-coap-client/dist/coap-client-factory");

var srv = new servient_1.default();
srv.addServer(new http_server_1.default(9002));
srv.addClientFactory(new http_client_factory_1.default());

srv.addServer(new coap_server_1.default(5685));
srv.addClientFactory(new coap_client_factory_1.default());

var WoT = srv.start();

 WoT.createThing("counter")
    .then(function(thing) {
        console.log("created " + thing.name);

        thing
        .addProperty("count", { type: "integer" })
        .setProperty("count",0);
        
        thing
        .onUpdateProperty("count",
            function(newValue, oldValue) {
                console.log(oldValue + " -> " + newValue);
                var message = (oldValue < newValue)? "increased " : "decreased";
                console.log("counter " + message + " to " + newValue);
            }
         );

         thing
         .addAction("increment")
         .onInvokeAction("increment", function() {
            console.log("incrementing counter");
            return thing.getProperty("count").then(function(count){
                var value = count + 1;
                thing.setProperty("count", value);
                return value;
            })
         });

        thing
        .addAction("decrement")
        .onInvokeAction("decrement", function() {
             console.log("decrementing counter");
             return thing.getProperty("count").then(function(count){
                var value = count - 1;
                thing.setProperty("count", value);
                return value;
            })
        });
    });
