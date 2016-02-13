var http = require('http');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({
    ws: true //Set exports to allow for websocket proxy
});
proxy.on('error', function(e) {
    console.log(e);
}); 
var url = require('url');
var https = require('https');

var Route = function (host, port, path) {
    path = (typeof(path) === 'undefined') ? '/' : path;
    this.host = host;
    this[path] = port;
    this.port = port;
}

exports = module.exports = {};
//Default Values
exports.httpPort = 80;
exports.httpsPort = 443;
exports.defaultPagePort = 12000;
exports.localPath = "http://localhost"
exports.httpsOptions = false;
exports._function = {};

//Variables that will be constructed.
exports.httpRoutes = {};
exports.httpsRoutes = {};



exports.newRoute = function (host, port, path, protocall){
    path = (typeof(path) === "undefined") ? "/" : path;
    switch (protocall) {
        case "http":
            if (typeof(exports.httpRoutes[host]) === 'undefined')
                exports.httpRoutes[host] = {};
            exports.httpRoutes[host][path] = (new Route(host, port, path));
            break;
        case "https":
            if (typeof(exports.httpsRoutes[host]) === 'undefined')
                exports.httpsRoutes[host] = {};
            exports.httpsRoutes[host][path] =(new Route(host, port, path));
            break;
        default:
            if (typeof(exports.httpRoutes[host]) === 'undefined')
                exports.httpRoutes[host] = {};
            if (typeof(exports.httpsRoutes[host]) === 'undefined')
                exports.httpsRoutes[host] = {};
            exports.httpRoutes[host][path] =(new Route(host, port, path));
            exports.httpsRoutes[host][path] =(new Route(host, port, path));
    }
}

exports.router = function(req, res, routes, protocall){
    protocall = (typeof(protocall) === "string") ? protocall : "web"; 
    var hostname = req.headers.host.split(":")[0];
    var pathname = url.parse(req.url).pathname;
    console.log(pathname);
    var end = true;
    var port = exports.defaultPagePort;
    console.log(routes[hostname]);
    if (typeof(routes[hostname]) !== "undefined") {
        if (typeof(routes[hostname][pathname]) !== "undefined")
            port = routes[hostname][pathname].port;
        else if (typeof(routes[hostname]["/"]) !== "undefined")
            port = routes[hostname]["/"].port;
    }
    console.log(port);
    proxy[protocall](req, res, {target: exports.localPath + ":"+port});
}

exports.startHttp = function (port, name, filter){
    port = (typeof(port) === 'undefined') ? exports.httsPort : port;
    name = (typeof(name) === 'undefined') ? "http_server" : name;
    if (typeof(filter) != "undefined")
        exports._function[name] = filter;
    
    exports[name] = http.createServer(function(req, res) {
        if (typeof(exports._function[name]) === "function")
            exports._function[name](req, res);
        exports.router(req, res, exports.httpRoutes)
    }).listen(port, function(){
        console.log("Http server started on port "+port);
    })
    exports[name].on("upgrade", function(req, res) {
        exports.router(req, res, exports.httpRoutes, "ws")
    })
}
exports.startHttps = function (option, port, name, filter) {
    options = (typeof(options) === 'undefined') ? exports.httpsOptions : options;
    port = (typeof(port) === 'undefined') ? exports.httpsPort : port;
    name = (typeof(name) === 'undefined') ? "https_server" : name;
    if (typeof(filter) != "undefined")
        exports._function[name] = filter;
    console.log("https started on: "+port);
    if (options === false) {
        console.log("You must declare a key & cert to start the https server");
        return false;
    }
    exports[name] = https.createServer(options, function(req, res) {
        if (typeof(exports._function[name]) === "function")
            exports._function[name]();  
        exports.router(req, res, exports.httpsRoutes);
    }).listen(port, function(){
        console.log("Https server started on port "+port);
    })
    exports[name].on('upgrade', function(req, res){
        exports.router(req, res, exports.httpsRoutes);
    })
}

exports.startDefault = function () {
    var app2 = require('express')();
    var http2 = require('http').Server(app2);
    app2.get('/', function(req, res){
      var hostname = req.headers.host.split(":")[0];
      res.send('<h1>Hello world from '+hostname+'</h1>');
    });
    http2.listen(exports.defaultPagePort, function(){
      console.log('Started default page at: '+exports.defaultPagePort);
    }); 
}
exports.start = function (){
    exports.startHttp();
    exports.startHttps();
    exports.startDefault();
}