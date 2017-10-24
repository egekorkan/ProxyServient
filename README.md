This servient makes a WoT Thing's Thing Description online, in a Thing Directory of choice.

## Installation Requirements:

You need to install [node-wot](https://github.com/thingweb/node-wot) in order to run the RegistryAgent. 

Then open RegistryAgent.js in WithoutManagement and WithManagement folders and modify the module imports according to the installation location of your node-wot. These are found in the very beginning and marked in bold below:

var TDParser = require("**/home/eko/Code**/node-wot/packages/node-wot-td-tools/dist/td-parser");
var servient_1 = require("**/home/eko/Code**/node-wot/packages/node-wot/dist/servient");
var http_client_factory_1 = require("**/home/eko/Code**/node-wot/packages/node-wot-protocol-http/dist/http-client-factory");
var http_server_1 = require("**/home/eko/Code**/node-wot/packages/node-wot-protocol-http/dist/http-server");
var ContentSerdes_1 = require("**/home/eko/Code**/node-wot/packages/node-wot/dist/content-serdes");

This will allow the RegistryAgent to run properly but if you need to run also the Thing Description directory you can install it [here](https://github.com/thingweb/thingweb-directory).

You can also read their readme to understand how the RegistryAgent works internally.

## Two Modes of Operation

There are two different Registry Agents in folders WithoutManagement and WithManagement. 

WithoutManagement gives the Thing client the control over all the relevant information being sent and received to the Thing Directory. For example, upon registration of the Thing Description the id number will be forwarded to the client and the client has to manage this id number itself for the future requests.

WithManagement is seen simpler from the outside. The client only get status messages and never has to worry about the id numbers. *IMPORTANT* This requires more management from the RegistryAgent and the lifetime management is not properly implemented at the moment.

# Without Management

## Running RegistryAgent

To run: Go to folder `WithoutManagement` and run `node RegistryAgent.js`

After this the RegistryAgent should be running.

## Using RegistryAgent

*The variable types to use are given by the Thing Description of the RegistryAgent in RegistryAgent.jsonld*

RegistryAgent uses the actions and properties as defined by WoT. Currently there are 3 actions and 2 properties to interact with.

The Thing Directory's address should be written into the *directoryAddress* property. It defaults to localhost port 8080 with http protocol. 

The gateway address of the local system's gateway should be written into the *gatewayAddress* property. It defaults to localhost port 8081 with http protocol. **You shouldn't put a / at the end of the uri.** This address will be used to modify the Thing Descriptions received with *makeMePublic* and *updateMe* requests.

Send the TD by executing the action *makeMePublic*. You have to send the TD with this action. The TD will be available online in the directory. You can also send the time the TD should be public. This is done with the *publicTime* by writing the time in seconds. It defaults to 24 hours if not sent and the client has to take this time into account for further requests. The id assigned by the directory is returned in the return object which should also be stored in the client.

If you want to modify the same TD, you can use the *updateMe* action and send the new TD and the id that was returned by the *makeMePublic* request. You can also send the time the TD should be public. This is done with the *publicTime* by writing the time in seconds. It defaults to 24 hours if not sent and the client has to take this time into account for further requests.

You can delete a TD by sending the id using the *deleteMe* action.

In *makeMePublic* action the description Id returned in output data will have */td/* in the beginning. This should be kept when using the id in *updateMe* and *deleteMe* actions.

# With Management

## Running RegistryAgent

To run: Go to folder `WithManagement` and run `node RegistryAgent.js`

After this the RegistryAgent should be running.

## Using RegistryAgent

*The variable types to use are given by the Thing Description of the RegistryAgent in RegistryAgent.jsonld*

RegistryAgent uses the actions and properties as defined by WoT. Currently there are 3 actions and 3 properties to interact with.

The Thing Directory's address should be written into the *directoryAddress* property. It defaults to localhost port 8080 with http protocol. 

The gateway address of the local system's gateway should be written into the *gatewayAddress* property. It defaults to localhost port 8081 with http protocol. **You shouldn't put a / at the very end of the uri.** This address will be used to modify the Thing Descriptions received with *makeMePublic* and *updateMe* requests.

**Currently there is only HTTP protocol supported.**

Send the TD by executing the action *makeMePublic*. You have to send the TD with this action. The TD will be available online in the directory. You can also send the time the TD should be public. This is done with the *publicTime* by writing the time in seconds. It defaults to 24 hours if not sent.

If you want to modify the same TD, you can use the *updateMe* action and send the new TD without 
changing the name.

You can delete a TD by sending the name using the *deleteMe* action.

While using these interactions, you can see the TDs that are public by using the property *publicDescriptions*. If your Thing's name is already in this list, use the *updateMe* action instead of *makeMePublic* action.

# NO GOs
You cannot update or delete before making a TD public. If you try you will get "NotPublic" message.

You cannot make two TDs with the same name public. If you try you will get "AlreadyExists" message.

If another client modifies the Thing Directory (deleting your TD for example), you will get a "DirectoryError" when you try to update or delete that TD. So do not modify other people's Thing Descriptions.


## TO DOs

Add CoAP functionality

?? Check if the gateway and Thing have the same protocols => This is because if we put a gateway address with CoAP to a Thing that doesn't support CoAP, we have problems!
