const ServiceClient = require('../../../serviceConnector/client');

const twitchChatClient = new ServiceClient(process.env.TWITCH_CHAT_SERVICE_IP, process.env.TWITCH_CHAT_SERVICE_PORT, 'Triggered Events');

const twitchModel = require('../../../mongoose/mongooseModels/twitch');

const sendToTwitch = async (ownerID, message, channelName) => {
	const channel = channelName || (await twitchModel.findOne({owner: ownerID}, 'username').exec())?.username;

	if(!channel){
		return;
	}

	twitchChatClient.Send('send', {channel, text: message});
};

module.exports = {
	sendToTwitch
};