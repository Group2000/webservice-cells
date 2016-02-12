//production Configuration
"use strict";
var config={};

config.logging={
	colour:false,
	timestamp:false
};

config.service={
	name:'cells',
	description: 'API for cell related data',
    title: 'Cell measurement webservice',
};

config.server={
	useSSL : true,
	port : process.env.PORT,
	address : process.env.SERVER
};

config.ssl={
	key:'/etc/ssl/self-signed/server.key',
	certificate:'/etc/ssl/self-signed/server.crt'
};

config.zookeeper={
	servers:'localhost:2181',
};

config.providers={
	index:'providers_v1',
	type:'provider',
    createIndex:true
}

config.elasticsearch={
	hosts:[
      'localhost:9200'
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
					format: "dateOptionalTime",
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