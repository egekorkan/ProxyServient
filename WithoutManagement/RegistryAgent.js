var TDParser = require("/home/eko/Code/node-wot/packages/node-wot-td-tools/dist/td-parser");
var servient_1 = require("/home/eko/Code/node-wot/packages/node-wot/dist/servient");
var http_client_factory_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocol-http/dist/http-client-factory");
var http_server_1 = require("/home/eko/Code/node-wot/packages/node-wot-protocol-http/dist/http-server");
var ContentSerdes_1 = "/home/eko/Code/node-wot/packages/node-wot/dist/content-serdes";

var http = require('http');
var url = require('url');
var fs = require("fs");


//some constants
var tdName = "RegistryAgent";
var directoryAddress = "http://localhost:8080";
var gatewayAddress = "http://localhost:8081";

//getting the TD 
var tdString = fs.readFileSync("./" + tdName + '.jsonld', "utf8");
var td = TDParser.parseTDString(tdString);

//starting the registryAgent
var srv = new servient_1.default();
srv.addServer(new http_server_1.default(9000));
srv.addClientFactory(new http_client_factory_1.default());
var WoT = srv.start();

WoT.createFromDescription(td).then(function(registryAgent) {

    // setting directory address
    registryAgent.setProperty("directoryAddress", directoryAddress);
    registryAgent.onUpdateProperty("directoryAddress", function(oldAddress, newAddress) {
        directoryAddress = newAddress;
    });

    registryAgent.onUpdateProperty("gatewayAddress", function(oldAddress, newAddress) {
        gatewayAddress = newAddress;
    });

    //handling action to make a TD online
    registryAgent.onInvokeAction("makeMePublic", function(inputData) {
        return new Promise(function(resolve, reject) {
            // inputData has the TD, getting it
            var td = inputData["description"];
            var lifetime = 86400;
            try {
                lifetime = inputData["publicTime"];
            } catch {
                //do nothing
            }

            // posting the TD to directory address
            var address = directoryAddress + "/td";

            // change its IP addresses that were local with the IP of the repo
            td = transformTdPublic(td, gatewayAddress);

            postTd(address + "?lt=" + lifetime, td).then(function(location) {

                // get the id assigned by the repo
                // this value is given in the header of the response
                var outputData = { "status": "Created", "location": location }
                resolve(outputData);

            }).catch(function(error) {
                console.log("Couldnt post TD to repo, ", error)
                var outputData = { "status": error }
                resolve(outputData);
            });
        })
    });


    //handling action to update an online TD with a local one
    registryAgent.onInvokeAction("updateMe", function(inputData) {
        return new Promise(function(resolve, reject) {
            var td = inputData["description"];
            var descriptionId = inputData["descriptionId"];
            var lifetime = 86400;
            try {
                lifetime = inputData["publicTime"];
            } catch {
                //do nothing
            }
            // put its TD in the repo
            // change its IP addresses that were local with the IP of the repo
            td = transformTdPublic(td, gatewayAddress);

            // put the new TD in the directory
            updateTd(directoryAddress + "/td/" + descriptionId + "?lt=" + lifetime, td).then(function(res) {
                console.log("Update Succesful");
                resolve("Updated")
            }).catch(function(err) {
                console.log("Update NOT Succesful, error code ", err);
                resolve(err);
            });

        });
    });

    registryAgent.onInvokeAction("deleteMe", function(descriptionId) {
        return new Promise(function(resolve, reject) {
            var descriptionId = inputData["descriptionId"];
            deleteTd(directoryAddress + "/td/" + descriptionId).then(function(res) {
                resolve("Deleted");
            }).catch(function(err) {
                console.log("Delete NOT Succesful, error code ", err);
                resolve(err);
            });

        });
    });
});


// copied from node wot. This parses a uri string to get the parameters
var uriToOptions = function(uri) {
    var requestUri = url.parse(uri);
    var options = {};
    options.agent = this.agent;
    options.hostname = requestUri.hostname;
    options.port = parseInt(requestUri.port, 10);
    options.path = requestUri.path;
    return options;
};

// this function does a simple POST  request but it returns id given by the directory.
var postTd = function(directoryAddress, td) {
    return new Promise(function(resolve, reject) {
        // convert the TD to bytes
        var td_byte = node_wot_content_serdes_1.default.valueToBytes(td, "application/json");

        // parse the uri
        var options = uriToOptions(directoryAddress);
        options.method = 'POST';
        if (td_byte) {
            options.headers = { 'Content-Type': td_byte.mediaType, 'Content-Length': td_byte.body.byteLength };
        }

        // do the post and get the response
        var req = http.request(options, function(res) {
            console.log("HttpClient received " + res.statusCode + " from " + directoryAddress);
            console.log("HttpClient received headers: " + JSON.stringify(res.headers));

            // 500 return code means the directory had a problem in itself, there is nothing wrong with our request
            if (res.statusCode == 500) {
                console.log("Rejecting with 500");
                reject("DirectoryError");

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
                reject("DirectoryError");
            }

        });
        req.on('error', function(err) {
            console.error("Received Error");
            return reject("RegistryAgentError");
        });

        // where the actual write is done
        if (td_byte) { req.write(td_byte.body); }
        req.end();
    });
}

// this function does a simple PUT  request but it returns the proper error codes sent by the directory.
// This is uncommented since it is the same as the previous request but there isnt an address being returned
var updateTd = function(directoryAddress, td) {
    return new Promise(function(resolve, reject) {
        var td_byte = node_wot_content_serdes_1.default.valueToBytes(td, "application/json");
        var options = uriToOptions(directoryAddress);
        options.method = 'PUT';
        options.headers = { 'Content-Type': td_byte.mediaType, 'Content-Length': td_byte.body.byteLength };
        var req = http.request(options, function(res) {
            console.log("HttpClient received " + res.statusCode + " from " + directoryAddress);
            console.log("HttpClient received headers: " + JSON.stringify(res.headers));
            if (res.statusCode == 500) {
                console.log("Rejecting with 500");
                reject("DirectoryError");
            } else if (res.statusCode == 400) {
                console.log("Rejecting with 400");
                reject("BadRequest");
            } else if (res.statusCode == 200) {
                console.log("resolving with 200");
                resolve("Updated");
            } else {
                console.log("something else received");
                reject("DirectoryError");
            }
        });
        req.on('error', function(err) { return reject("RegistryAgentError"); });
        req.write(td_byte.body);
        req.end();
    });
}

// this function does a simple DELETE  request but it returns the proper error codes sent by the directory.
// This is uncommented since it is the same as the previous request but there isnt an address being returned
var deleteTd = function(uri) {
    return new Promise(function(resolve, reject) {
        var options = uriToOptions(uri);
        options.method = 'DELETE';
        var req = http.request(options, function(res) {
            console.log("HttpClient received " + res.statusCode + " from " + uri);
            console.log("HttpClient received headers: " + JSON.stringify(res.headers));
            if (res.statusCode == 500) {
                console.log("Rejecting with 500");
                reject("DirectoryError");
            } else if (res.statusCode == 400) {
                console.log("Rejecting with 400");
                reject("BadRequest");
            } else if (res.statusCode == 200) {
                console.log("resolving with 200");
                resolve("Updated");
            } else {
                console.log("something else received");
                reject("DirectoryError");
            }
        });
        req.on('error', function(err) { return reject("RegistryAgentError"); });
        req.end();
    });
}
var transformTdPublic = function(td, publicAddress) {

    // change the base. Changing occurs only between .// and the next /
    // for example http://localhost:9004/MyBooleanThing will become http://myrepo.com/MyBooleanThing
    try {
        var base = td.base;
        base = transformLink(base, publicAddress)
        td.base = base;
    } catch (error) {

        //no problem, base is optional
    }

    //change each href
    var interactions = td.interaction;
    interactions.forEach(function(interaction, index) {
        var links = interaction.link;
        links.forEach(function(link, index2) {
            var href = link.href;
            if (href.indexOf("://") > -1) {
                href = transformLink(href, publicAddress);
            }
            link.href = href;
            links[index2] = link;
        });
        interaction.link = links;
        interactions[index] = interaction;
    });
    td.interaction = interactions;
    return td;
}

var transformLink = function(link, address) {
    var startLocation = link.indexOf("://") + 3;
    var endLocation = link.indexOf("/", startLocation);
    var localAddress = link.substring(startLocation, endLocation);

    var startLocationRepo = address.indexOf("://") + 3;
    var trimmedPublicAddress = address.slice(startLocationRepo);
    link = link.replace(localAddress, trimmedPublicAddress);
    return link;
}