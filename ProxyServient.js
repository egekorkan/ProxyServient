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
    //console.log(srv.clientFactories);
    repoClient = srv.getClientFor("http");
    // repoClient.readResource(repositoryAddress).then(function(data){
    //     console.log(data);

    // });
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
        //console.log(inputData);
        var td = inputData["description"];
        console.log("description is ", td);
        proxyThing.getProperty("repositoryAddress").then(function (address) {
            address = address + "/td"
            console.info("posting to ", address);
            postTd(address, td).then(function (location) {
                // get the id assigned by the repo and store it
                var tdLocation = location;
                var thingName = td.name;
                var toRepo = { [thingName]: tdLocation }
                repoIds.push(toRepo);
                //console.log(tdName, " ",tdLocation);
                console.log("TDs pushed are ", repoIds);
            }).catch(function (error) {
                console.log("Couldnt post TD to repo, ", error)
            });
        });
        //});
    });
    // return a response accordingly
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
        console.log("description is ", td);
        // change its IP addresses that were local with the IP of the repo

        // put its TD in the repo
        proxyThing.getProperty("repositoryAddress").then(function (address) {
            var descriptionId = findTdId(td.name);
            console.log("description id is ", descriptionId)
            if (descriptionId === -1) {
                console.log("non existing TD")
                return "NotPublicYet";
            } else {
                console.log("something");
                console.log("id in the repository is ", descriptionId);
                //var curId = 
                console.info("posting to ", address);
                updateTd(address + descriptionId, td).then(function (res) {
                    console.log("Update Succesful");
                }).catch(function(err){
                    console.log("Update NOT Succesful, error code ",err);
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
                        "RepositoryError"
                    ]
                },
                */
    proxyThing.onInvokeAction("deleteMe",function(name){
        proxyThing.getProperty("repositoryAddress").then(function (address) {
            var descriptionId = findTdId(name);
            console.log("description id is ", descriptionId)
            if (descriptionId === -1) {
                console.log("non existing TD")
                return "NotPublicYet";
            } else {
                console.log("something");
                console.log("id in the repository is ", descriptionId);
                
                deleteTd(address + descriptionId).then(function (res) {
                    var indexOfTd = repoIds.findIndex(i => i[name] === descriptionId);
                    repoIds.splice(indexOfTd,1);
                    console.log("Delete Succesful");
                    console.log("TDs are ", repoIds);
                }).catch(function(err){
                    console.log("Delete NOT Succesful, error code ",err);
                });
            }
        });
    });
});

var uriToOptions = function (uri) {
    var requestUri = url.parse(uri);
    var options = {};
    options.agent = this.agent;
    options.hostname = requestUri.hostname;
    options.port = parseInt(requestUri.port, 10);
    options.path = requestUri.path;
    return options;
};
var findTdId = function (tdName) {
    var matchedPair = repoIds.filter(pair => {
        return Object.keys(pair).indexOf(tdName) > -1;
    });
    console.log("matche pair is ", matchedPair)
    if (matchedPair.length > 0) {
        return matchedPair[0][tdName];
    } else {
        return -1;
    }

}
var postTd = function (repositoryAddress, td) {
    return new Promise(function (resolve, reject) {
        console.log("in post method", JSON.stringify(td, 4));
        var td_byte = node_wot_content_serdes_1.default.valueToBytes(td, "application/json");
        var options = uriToOptions(repositoryAddress);
        options.method = 'POST';
        if (td_byte) {
            options.headers = { 'Content-Type': td_byte.mediaType, 'Content-Length': td_byte.body.byteLength };
        }
        console.log("options is:", options);
        console.log("HttpClient sending POST to " + repositoryAddress);
        var req = http.request(options, function (res) {
            console.log("HttpClient received " + res.statusCode + " from " + repositoryAddress);
            console.log("HttpClient received headers: " + JSON.stringify(res.headers));
            //some if clause is necessary here to detect other response types
            if (res.statusCode == 500) {
                console.log("Rejecting with 500");
                reject("RepositoryError");
            } else if (res.statusCode == 400) {
                console.log("Rejecting with 400");
                reject("BadRequest");
            } else if (res.statusCode == 201) {
                console.log("resolving with 201");
                resolve(res.headers.location);
            } else {
                console.log("something else received");
                reject("RepositoryError");
            }

        });
        req.on('error', function (err) {
            console.error("Received Error");
            return reject(err);
        });
        if (td_byte) {
            req.write(td_byte.body);
        }
        req.end();
    });
}

var updateTd = function (repositoryAddress, td) {
    return new Promise(function (resolve, reject) {
        var td_byte = node_wot_content_serdes_1.default.valueToBytes(td, "application/json");
        var options = uriToOptions(repositoryAddress);
        options.method = 'PUT';
        options.headers = { 'Content-Type': td_byte.mediaType, 'Content-Length': td_byte.body.byteLength };
        console.log("HttpClient sending PUT to " + repositoryAddress);
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

var deleteTd = function (uri) {
    return new Promise(function (resolve, reject) {
        var options = uriToOptions(uri);
        options.method = 'DELETE';
        console.log("HttpClient sending DELETE to " + uri);
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
}
