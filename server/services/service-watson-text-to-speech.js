const IBMCloudEnv = require('ibm-cloud-env');
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');

module.exports = function(app, serviceManager){
	const textToSpeech = new TextToSpeechV1({
		url: "https://stream.watsonplatform.net/text-to-speech/api",//IBMCloudEnv.getString('watson_text_to_speech_url'),
		username: "d1d6535d-81da-414a-b943-ddd040827c88",
		password: "kgLcw5SDSyJT"
	});
	serviceManager.set('watson-text-to-speech', textToSpeech);
};
