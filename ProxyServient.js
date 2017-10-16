var TDParser = require("/home/eko/Code/node-wot/packages/node-wot-td-tools/dist/td-parser");
var servient_1 = require("/home/eko/Code/node-wot/packages/node-wot/dist/servient");
var http_client_factory_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-client/dist/http-client-factory");
var http_server_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocols-http-server/dist/http-server");
//var ContentSerdes_1 = "/home/eko/Code/node-wot/packages/node-wot-content-serdes/dist/content-serdes";
var node_wot_content_serdes_1 = require("node-wot-content-serdes");
var http = require('http');
var url = require('url');
var fs = require("fs");


//some constants
var tdName = "ProxyServient";
var repositoryAddress = "http://localhost:8080";
var repoIds = []; // tdname and its associated id

//getting the TD 
var tdString = fs.readFileSync("./" + tdName + '.jsonld', "utf8");
var td = TDParser.parseTDString(tdString);

//starting the proxyThing
var srv = new servient_1.default();
srv.addServer(new http_server_1.default(9000));
srv.addClientFactory(new http_client_factory_1.default());
var WoT = srv.start();

WoT.createFromDescription(td).then(function (proxyThing) {

    // setting repository address
    proxyThing.setProperty("repositoryAddress", repositoryAddress);

    //handling action to make a TD online
	/*
"name": "makeMePublic",
            "inputData": {
                "type": "object",
                "properties": {
                    "address": {
                        "type": "string"
                    },
                    "publicTime": {
                        "type": "number",
                        "minimum": 60,
                        "default": 86400
                    }
                },
                "required": ["address"],
                "additionalProperties": false
            },
            "outputData": {
                "type": "string",
                "enum": [
                    "Created",
                    "AlreadyExists",
                    "RepositoryError",
                    "ProxyServientError"
                ]
            },
            */
    proxyThing.onInvokeAction("makeMePublic", function (inputData) {
        // inputData has the TD, getting it
        var td = inputData["description"];
        //console.log("description is ", td);

        // change its IP addresses that were local with the IP of the repo

        // if the repository address has been modified by the user
        proxyThing.getProperty("repositoryAddress").then(function (address) {
            // posting the TD to repository address
            address = address + "/td";
            postTd(address, td).then(function (location) {

                // get the id assigned by the repo and store it
                // this value is given in the header of the response
                var tdLocation = location;
                var thingName = td.name;
                var toRepo = { [thingName]: tdLocation }

                // it is stored in an array in this servient. This is done to keep a record of TDs in order to update or delete them later
                repoIds.push(toRepo);
                console.log("Currently managed TDs are ", repoIds);
            }).catch(function (error) {
                console.log("Couldnt post TD to repo, ", error)
                // returning a response value
            });
        });
    });

    //handling action to update an online TD with a local one
    /*
                "name": "updateMe",
                "inputData": {
                    "type": "object",
                    "properties": {
                        "address": {
                            "type": "string"
                        },
                        "publicTime": {
                            "type": "number",
                            "minimum": 60,
                            "default": 86400
                        }
                    },
                    "required": ["address"],
                    "additionalProperties": false
                },
                "outputData": {
                    "type": "string",
                    "enum": [
                        "Updated",
                        "BadRequest",
                        "RepositoryError",
                        "NotPublicYet"
                    ]
                },*/
    proxyThing.onInvokeAction("updateMe", function (inputData) {
        var td = inputData["description"];

        // change its IP addresses that were local with the IP of the repo

        // put its TD in the repo
        proxyThing.getProperty("repositoryAddress").then(function (address) {
            // first the id returned by the repo in the makeMePublic request needs to be found
            // according to the id stored, the request is composed
            var descriptionId = findTdId(td.name);

            // if the id didnt match:
            if (descriptionId === -1) {
                console.log("Non existing TD");
                // return "NotPublicYet";
            } else {
                
                // put the new TD in the repository
                updateTd(address + descriptionId, td).then(function (res) {
                    console.log("Update Succesful");
                    // return Updated
                }).catch(function(err){
                    console.log("Update NOT Succesful, error code ",err);
                    // return the error code
                });
            }
        });
    });

    //handling action to delete an online TD
    /*
            "name": "deleteMe",
                "inputData": {
                    "type": "string"
                },
                "outputData": {
                    "type": "string",
                    "enum": [
                        "Deleted",
                        "BadRequest",
                        "RepositoryError",
                        "NotPublicYet"
                    ]
                },
                */
    proxyThing.onInvokeAction("deleteMe",function(name){
        proxyThing.getProperty("repositoryAddress").then(function (address) {
            var descriptionId = findTdId(name);
            if (descriptionId === -1) {
                // return "NotPublicYet";
            } else {
                deleteTd(address + descriptionId).then(function (res) {
                    var indexOfTd = repoIds.findIndex(i => i[name] === descriptionId);
                    repoIds.splice(indexOfTd,1);
                    // return Deleted
                }).catch(function(err){
                    console.log("Delete NOT Succesful, error code ",err);
                    // return the error code
                });
            }
        });
    });
});

// copied from node wot. This parses a uri string to get the parameters
var uriToOptions = function (uri) {
    var requestUri = url.parse(uri);
    var options = {};
    options.agent = this.agent;
    options.hostname = requestUri.hostname;
    options.port = parseInt(requestUri.port, 10);
    options.path = requestUri.path;
    return options;
};

// this function finds the id of the Td based on the name
var findTdId = function (tdName) {
    // filter the array to find a matching pair 
    var matchedPair = repoIds.filter(pair => {
        return Object.keys(pair).indexOf(tdName) > -1;
    });
    // return the id if there is a match, -1 otherwise
    if (matchedPair.length > 0) {
        return matchedPair[0][tdName];
    } else {
        return -1;
    }
}

// this function does a simple POST  request but it returns id given by the repository.
var postTd = function (repositoryAddress, td) {
    return new Promise(function (resolve, reject) {
        // convert the TD to bytes
        var td_byte = node_wot_content_serdes_1.default.valueToBytes(td, "application/json");

        // parse the uri
        var options = uriToOptions(repositoryAddress);
        options.method = 'POST';
        if (td_byte) {
            options.headers = { 'Content-Type': td_byte.mediaType, 'Content-Length': td_byte.body.byteLength };
        }
        // do the post and get the response
        var req = http.request(options, function (res) {
            console.log("HttpClient received " + res.statusCode + " from " + repositoryAddress);
            console.log("HttpClient received headers: " + JSON.stringify(res.headers));

            // 500 return code means the repository had a problem in itself, there is nothing wrong with our request
            if (res.statusCode == 500) {
                console.log("Rejecting with 500");
                reject("RepositoryError");

            // 400 return code means the request was poorly written. This can be because of invalid TD, an already existing TD or bad uri
            } else if (res.statusCode == 400) {
                console.log("Rejecting with 400");
                reject("BadRequest");

            // 201 is a succesful request
            } else if (res.statusCode == 201) {
                console.log("Resolving with 201");
                resolve(res.headers.location);

            // in case there is another problem
            } else {
                console.log("something else received");
                reject("RepositoryError");
            }

        });
        req.on('error', function (err) {
            console.error("Received Error");
            return reject(err);
        });

        // where the actual write is done
        if (td_byte) { req.write(td_byte.body);}
        req.end();
    });
}

// this function does a simple PUT  request but it returns the proper error codes sent by the repository.
// This is uncommented since it is the same as the previous request but there isnt an address being returned
var updateTd = function (repositoryAddress, td) {
    return new Promise(function (resolve, reject) {
        var td_byte = node_wot_content_serdes_1.default.valueToBytes(td, "application/json");
        var options = uriToOptions(repositoryAddress);
        options.method = 'PUT';
        options.headers = { 'Content-Type': td_byte.mediaType, 'Content-Length': td_byte.body.byteLength };
        var req = http.request(options, function (res) {
            console.log("HttpClient received " + res.statusCode + " from " + repositoryAddress);
            console.log("HttpClient received headers: " + JSON.stringify(res.headers));
            if (res.statusCode == 500) {
                console.log("Rejecting with 500");
                reject("RepositoryError");
            } else if (res.statusCode == 400) {
                console.log("Rejecting with 400");
                reject("BadRequest");
            } else if (res.statusCode == 200) {
                console.log("resolving with 200");
                resolve("Updated");
            } else {
                console.log("something else received");
                reject("RepositoryError");
            }
        });
        req.on('error', function (err) { return reject(err); });
        req.write(td_byte.body);
        req.end();
    });
}

// this function does a simple DELETE  request but it returns the proper error codes sent by the repository.
// This is uncommented since it is the same as the previous request but there isnt an address being returned
var deleteTd = function (uri) {
    return new Promise(function (resolve, reject) {
        var options = uriToOptions(uri);
        options.method = 'DELETE';
        var req = http.request(options, function (res) {
            console.log("HttpClient received " + res.statusCode + " from " + uri);
            console.log("HttpClient received headers: " + JSON.stringify(res.headers));
            if (res.statusCode == 500) {
                console.log("Rejecting with 500");
                reject("RepositoryError");
            } else if (res.statusCode == 400) {
                console.log("Rejecting with 400");
                reject("BadRequest");
            } else if (res.statusCode == 200) {
                console.log("resolving with 200");
                resolve("Updated");
            } else {
                console.log("something else received");
                reject("RepositoryError");
            }
        });
        req.on('error', function (err) { return reject(err); });
        req.end();
    });

    var transformTdPublic = function(td,repositoryAddress){

    }
}
