const ServiceClient = require('../../../serviceConnector/client');
const textParser = require('../../../tools/textParser').ParseText;
const twitchFunctions = require('./twitchFunctions');

const twitchEventSubClient = new ServiceClient(process.env.EVENTSUB_SERVICE_IP, process.env.EVENTSUB_SERVICE_PORT, 'Triggered Events');

const triggeredEventModel = require('../../../mongoose/mongooseModels/triggeredEvents');
const twitchModel = require('../../../mongoose/mongooseModels/twitch');
const userModel = require('../../../mongoose/mongooseModels/user');

const handleCheer = async data => {
	const userDoc = await userModel.findOne({twitchID: data.broadcaster_user_id}, '_id').exec();
	if(!userDoc){
		return;
	}
	
	const eventDoc = await triggeredEventModel.findOne({eventType: 'cheer', owner: userDoc._id}).exec();
	if(!eventDoc){
		return;
	}

	const parameters = {
		username: data.user_name,
		amount: data.bits,
		message: data.message
	};

	const message = await textParser(eventDoc.text, parameters, {});

	if(eventDoc.outputLocation === 'twitch'){
		twitchFunctions.sendToTwitch(userDoc._id, message);
	}
};

const handleTwitchStreamStart = async twitchID => {
	const userDoc = await userModel.findOne({twitchID: twitchID}, '_id').exec();
	if(!userDoc){
		return;
	}
	
	const eventDoc = await triggeredEventModel.findOne({eventType: 'streamStart', owner: userDoc._id}).exec();
	if(!eventDoc){
		return;
	}
	
	const twitchDoc = await twitchModel.findOne({owner: userDoc._id}, 'username lastTitle lastPlayedGameName').exec();
	if(!twitchDoc){
		return;
	}
	
	const parameters = {
		username: twitchDoc.username,
		title: twitchDoc.lastTitle,
		game: twitchDoc.lastPlayedGameName
	};

	const message = await textParser(eventDoc.text, parameters, {});
	if(eventDoc.outputLocation === 'twitch'){
		twitchFunctions.sendToTwitch(userDoc._id, message, twitchDoc.username);
	}
};

twitchEventSubClient.Listen('cheer', handleCheer);
twitchEventSubClient.Listen('streamStart', handleTwitchStreamStart);