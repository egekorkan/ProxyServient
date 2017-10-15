This servient makes a WoT Thing's Thing Description online, in a repository of choice.

## Installation Requirements:

You need to install [node-wot](https://github.com/thingweb/node-wot) in order to use the Proxy Servient. 

Then open ProxyServient.js and modify the module imports according to the installation location of your node-wot. These are found in the very beginning and marked in bold below:

var TDParser = require("**/home/eko/Code**/node-wot/packages/node-wot-td-tools/dist/td-parser");

var servient_1 = require("**/home/eko/Code**/node-wot/packages/node-wot/dist/servient");

var http_client_factory_1 = require("**/home/eko/Code**/node-wot/packages/node-wot-protocols-http-client/dist/http-client-factory");

var http_server_1 = require("**/home/eko/Code**/node-wot/packages/node-wot-protocols-http-server/dist/http-server");

var node_wot_content_serdes_1 = require("node-wot-content-serdes");

This will allow the ProxyServient to run properly but if you need to run also the Thing Description repository you can 
install it [here](https://github.com/thingweb/thingweb-directory).

You can also read the readme to understand how the ProxyServient works.

## Running ProxyServient

To run: Go to the root directory and run node ProxyServient.js

After this the ProxyServient should be running.

## Using ProxyServient

*The file formats to use are given by the Thing Description of the ProxyServient in ProxyServient.jsonld*

ProxyServient uses the actions and properties as defined by WoT. Currently there are 3 actions and 1 property to 
interact with.

The Thing Directory's address should be written into the *repositoryAddress* property. It defaults to localhost 
port 8080 with http protocol. 

**Currently there is only HTTP protocol supported.**

Send the TD by executing the action *makeMePublic*. You have to send the TD with this action. The TD will be available online in the repository.

If you want to modify the same TD, you can use the *updateMe* action and send the new TD without 
changing the name. However, this is only possible in a single instance of the proxy servient.

You can delete a TD by sending the name using the *deleteMe* action.


## TO DO

Add CoAP functionality

Address modification

Lifetime of a TD
