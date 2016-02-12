"use strict";
var restify = require('restify');
var restifySwagger = require('node-restify-swagger');
var restifyValidation = require('node-restify-validation');
var zookeeper = require('node-zookeeper-client');
var nodeuuid = require('node-uuid');
var url = require('url');
var fs = require('fs');
var logger = require('./utils/logger');

var config = require('./config/config');

var curTime = new Date().getTime()
var uuid = nodeuuid.v1();
var zoopathService = '/dropwizard/services/prod_v1_' + config.service.name;
var zoopathInstance = '/dropwizard/services/prod_v1_'+ config.service.name  + '/' +uuid;
var https_options={}

var zkClient = zookeeper.createClient(config.zookeeper.servers);




var zoodata = {
    "name" : "prod_v1_" + config.service.name,
    "id" : uuid,
    "address" : config.server.address,
    "port" : config.server.port,
    "sslPort" : null,
    "payload" :
    {
        "instanceId" : uuid,
        "listenAddress" : config.server.address,
        "listenPort" : config.server.port
    },
    "registrationTimeUTC":curTime,
    "serviceType":"DYNAMIC",
    "uriSpec":null
}




    logger.log('info','process root: ' + process.cwd());
    
    logger.log('info','server: ' + process.env.SERVER);
    logger.log('info','port: ' + process.env.PORT);



process.on('SIGINT',function(code){
    logger.log('status','Ending process');
   logger.log('info','Removing Zookeeper registration');
    zkClient.close();
    process.exit();
});


function addZookeeperInstance(){
    zkClient.transaction().
        create(zoopathInstance,zookeeper.CreateMode.EPHEMERAL).
        setData(zoopathInstance,new Buffer(JSON.stringify(zoodata)),-1).
        commit(function(error,results){
            if(error){
                console.log(error);
                return;
            }
             logger.log('info','Zookeeper registration completed');
        })  
}

function addZookeeper(callback){
    //adds Service to zookeeper under <servicename>/UUID
     logger.log('info','Creating Zookeeper service '  + config.service.name+ '/' +uuid ); 
    zkClient.exists(zoopathService,function(err,ret){
        if(!ret){
            zkClient.create(zoopathService,function(err,ret){
                addZookeeperInstance();
            });
        }else
        {
            addZookeeperInstance();
        }
    });
    
}

//Start with zookeeper registration
zkClient.once('connected',function(){
        addZookeeper();
});
zkClient.connect();


//Configure Restify webserver
if(config.server.useSSL === true){
    https_options={
        key: fs.readFileSync(config.ssl.key),
        certificate: fs.readFileSync(config.ssl.certificate),
    };
}
var server = restify.createServer(https_options);
server.use(restify.queryParser());
server.use(restify.bodyParser());
restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());

server.use(restifyValidation.validationPlugin({
    errorsAsArray: false,
}));



server.defaultResponseHeaders = function(data){
  this.header('Access-Control-Allow-Origin','*');
}


fs.readdirSync('./routes/').forEach(function(curFile){
    if(curFile.substr(-3) === '.js') {
        var route=require('./routes/' + curFile);
        route.routes(server)
    }
});

//Configure swagger
restifySwagger.configure(server, {
    description: config.service.description,
    title: config.service.title,
    allowMethodInModelNames: true,
    basePath:'https://' + config.server.address + ':' + config.server.port
});
restifySwagger.loadRestifyRoutes();

 
//RUN SERVER
server.listen(config.server.port, function() {
  logger.log('status',server.name + ' listening at ' + server.url);
});

