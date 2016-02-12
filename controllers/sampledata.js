
var esClient = require('../config/elasticsearch').esClient;
var config = require('../config/config');
var logger = require('../utils/logger');
var crypto = require('crypto');

var sampleCount=10;

var defaultsample=
	{
		radio:'GSM',
		mcc:204,
		net:99,
		area:77,
		cell:1000,
		unit:null,
		azimuth:250,
		measurement:false,
		signal:null,
		band:800,
		beamwidth:120,
		channel:1,
		hdop:0,
		sattellites:0,
		serving:true,
		altitude:0,
		source:'Sample Provider',
		location:[5.9220568,52.6792915],
		timestamp:new Date().getTime(),
		measurement:false
	}


var radios=["GSM","LTE","UMTS"];
var area=""

function getRandomDate(from, to) {
    if (!from) {
        from = new Date(2015, 5, 1).getTime();
    } else {
        from = from.getTime();
    }
    if (!to) {
        to = new Date().getTime();
    } else {
        to = to.getTime();
    }
    return new Date(from + Math.random() * (to - from));
}

Array.prototype.randomElement=function(){
  return this[Math.floor(Math.random()*this.length)];
};


function createSampleData(){
  	
    //Cells
  	for(var i = 0 ;i <= sampleCount; i++){
    
	    var sample=defaultsample;
	    sample.radio=radios.randomElement();
	    sample.cell=parseInt(32768*Math.random());
	    sample.area=parseInt(100*Math.random());
	    sample.location=[(5+Math.random()),(52+Math.random())];
	    sample.timestamp=Math.round(getRandomDate().getTime());
	    var md5sum=crypto.createHash('md5');
	    var id=sample.mcc.toString()+sample.net.toString()+sample.area.toString()+sample.cell.toString()+sample.location[0].toString()+sample.location[1].toString()+sample.timestamp.toString();
	    id=md5sum.update(id).digest("hex");
	    esClient.index({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
	    	id:id,
	    	body:sample,
	    },function(err,response){
          	if(err)
            	console.log(err);
			
	    });
    
  	}

  	//measurements
	for(var i = 0 ;i <= sampleCount; i++){
    
	    var sample=defaultsample;
	    sample.radio='GSM';
	    sample.cell=1111;
	    sample.area=2222;
	    sample.measurement=true;
	    sample.signal=parseInt(100*Math.random());
	    sample.location=[(5+Math.random()),(52+Math.random())];
	    sample.timestamp=Math.round(getRandomDate().getTime());
	    var md5sum=crypto.createHash('md5');
	    var id=sample.mcc.toString()+sample.net.toString()+sample.area.toString()+sample.cell.toString()+sample.location[0].toString()+sample.location[1].toString()+sample.timestamp.toString();
	    id=md5sum.update(id).digest("hex");
	    esClient.index({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
	    	id:id,
	    	body:sample,
	    },function(err,response){
          	if(err)
            	console.log(err);
			
	    });
    
  	}


  	logger.log('info','Sample Dataset created');
}

createSampleData();