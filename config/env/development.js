//dev Configuration
"use strict";
var config={};

config.logging={
	colour:true,
	timestamp:true
};

config.service={
	name:'cellmeasurements-dev',
	description: 'API for cell related data',
    title: 'Cell measurement webservice (development)',
};

config.server={
	useSSL:false,
	port:3001,
	address:'127.0.0.1'
};

config.ssl={
	key:'/etc/ssl/self-signed/server.key',
	certificate:'/etc/ssl/self-signed/server.crt'
};

config.zookeeper={
	servers:'zookeeper:2181',
};

config.providers={
	index:'providers_v1-dev',
	type:'provider',
    createIndex:true
    
};

config.elasticsearch={
	hosts:[
      'database:9200',
    ],
    index:'cell_measurements_v1',
    type:'measurement',
    mapping:{
		measurement:{
			properties:{
				radio:{
					type:"string",
					index: "not_analyzed"
				},
				mcc:{type:"integer"},
				net:{type:"integer"},
				area:{type:"integer"},
				cell:{type:"integer"},
				provider:{
					type:"string",
					index: "not_analyzed"
				},
				uuid:{
					type:"string",
					index: "not_analyzed"
				},
				unit:{type:"integer"},
				signal:{type:"float"},
				azimuth:{type:"integer"},
				beamwidth:{type:"integer"},
				band:{type:"integer"},
				channel:{type:"integer"},
				hdop:{type:"float"},
				sattellites:{type:"integer"},
				serving:{type:"boolean"},
				altitude:{type:"integer"},
				source:{
					type:"string",
					index: "not_analyzed"
				},

				measurement:{type:"boolean"},
				timestamp:{
					format: "dateOptionalTime||epoch_millis",
					type:"date",
				},
				location:{
					type:"geo_point",
					geohash:true,
					geohash_prefix:true
				}
			}
		}
    },
    createIndex:true,
    deleteIndex:false,
    loadSampleData:false
};

module.exports=config;
