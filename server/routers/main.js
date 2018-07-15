const IBMCloudEnv = require('ibm-cloud-env');
const bodyParser = require('body-parser');
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const vcapServices = require('vcap_services');

const credsFromEnv = vcapServices.getCredentials('text_to_speech');
if (credsFromEnv.apikey) {
  credsFromEnv['iam_apikey'] = credsFromEnv.apikey;
}

let credsFromFile = {};
if (!process.env.VCAP_SERVICES) {
  credsFromFile = IBMCloudEnv.getCredentialsForService(
    'watson',
    'text_to_speech',
    require('./../localdev-config.json')
  );
}

const params = Object.assign(credsFromEnv, credsFromFile);
//const textToSpeech = new TextToSpeechV1(params);

module.exports = function(app) {
  app.use(bodyParser.json());

  const fileUpload = require('express-fileupload');
   
  app.use(fileUpload());

  var cors = require('cors')

  app.use(cors())

  /**
   * Pipe the synthesize method.
   */
  app.get('/api/synthesize', (req, res, next) => {
    if (!req.query.accept)
      req.query.accept = 'audio/ogg;codecs=opus';

	var textToSpeech = new TextToSpeechV1({
		url: "{URL}",
		username: "{USERNAME}",
		password: "{PASSWORD}"
	});


    const transcript = textToSpeech.synthesize(req.query);

    console.log(transcript);
    transcript.on('response', (response) => {
      if (req.query.download) {
        if (req.query.accept && req.query.accept === 'audio/wav') {
          response.headers['content-disposition'] = 'attachment; filename=transcript.wav';
        } else {
          response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
        }
      }
    });
    transcript.on('error', next);
    transcript.pipe(res);
  });

  /**
   * Return the list of voices.
   */
  app.get('/api/voices', (req, res) => {
    textToSpeech.listVoices(null, (error, voices) => {
      if (error) {
        const error = {
          code: err.code || 500,
          error: err.error || err.message,
        };
        return res.status(error.code).json(error);
      }
      res.json(voices);
    });
  });


  /**
   * Pipe the synthesize method.
   */
  app.post('/api/caption', (req, res) => {

    var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');

      var visualRecognition = new VisualRecognitionV3({
        version: '{VERSION}',
        iam_apikey: '{IAM_API_KEY}',
        url: "{URL}"
      });

      // var images_file= fs.createReadStream('./fruitbowl.jpg');
      // var classifier_ids = ["food"];
      // var threshold = 0.6;

      // console.log(req.files)
      var fs = require('fs');
      var sampleFile = req.files.image;

      var filename = Math.random().toString(36).substr(2, 5) + '.jpg';

      sampleFile.mv(filename, function(err) {

        var params = {
          images_file: fs.createReadStream(filename)
        };

        visualRecognition.classify(params, function(err, response) {
          if (err)
            console.log(err);
          else
            console.log(JSON.stringify(response, null, 2))
            res.send(JSON.stringify(response, null, 2))
            fs.unlink(filename, (err) => {
              if (err) throw err;
              console.log('path/file.txt was deleted');
            });
        });

      });


  });


}
