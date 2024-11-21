// load the env vars from the os, into nodejs
require('dotenv').config() 
// load the filesystem tools
const fs = require('fs')
// load in the exisiting json settings in our data object
const config = require(process.env.WISE_INTERNAL_JOBS_FOLDER + "/config.json")

console.log("before:", config);


//modify the data object values with the ENV values
config.mqtt.hostname=process.env.WISE_BUILDER_MQTT_HOST
config.mqtt.port=process.env.WISE_BUILDER_MQTT_PORT
config.mqtt.password=process.env.WISE_BUILDER_MQTT_PASS
config.mqtt.username=process.env.WISE_BUILDER_MQTT_USER
config.mqtt.topic=process.env.WISE_BUILDER_MQTT_TOPIC
config.mqtt.qos=process.env.WISE_BUILDER_MQTT_QOS
console.log("after:", config);
// convert our data object back to readble JSON text
let data = JSON.stringify(config,null,4); 
// write the config file back to the 
fs.writeFileSync(process.env.WISE_INTERNAL_JOBS_FOLDER + "/config.json", data);