import React from 'react';
import { Icon, Tabs, Pane } from 'watson-react-components';
import 'whatwg-fetch'
import voices from './voices';
import Dropzone from 'react-dropzone'

const synthesizeUrl = `/api/synthesize?voice={this.state.voice.name}&text={encodeURIComponent(this.state.text)}`;

/**
 * @return {Function} A polyfill for URLSearchParams
 */
const getSearchParams = () => {
  if (typeof URLSearchParams === 'function') {
    return new URLSearchParams();
  } 

  //simple polyfill for URLSearchparams
  var searchParams = function () {
  };

  searchParams.prototype.set = function (key, value) {
    this[key] = value;
  };

  searchParams.prototype.toString = function () {
    return Object.keys(this).map(function (v) {
      return `${encodeURI(v)}=${encodeURI(this[v])}`;
    }.bind(this)).join("&");
  };
  return new searchParams();
};

/**
 * Validates that the mimetype is: audio/wav, audio/mpeg;codecs=mp3 or audio/ogg;codecs=opus
 * @param  {String} mimeType The audio mimetype
 * @return {bool} Returns true if the mimetype can be played.
 */
const canPlayAudioFormat = (mimeType) => {
  var audio = document.createElement('audio');
  if (audio) {
    return (typeof audio.canPlayType === 'function' && audio.canPlayType(mimeType) !== '');
  } else {
    return false
  }
};

class ConditionalSpeakButton extends React.Component {
  componentDidMount() {
    if (canPlayAudioFormat('audio/ogg;codecs=opus')) {
      this.setState({canPlay: true});
    } else {
      this.setState({canPlay: false});
    }
  }

  render() {
    if (this.state && this.state.canPlay) {
      return (
        <button disabled={this.props.disabled} onClick={this.props.onClick} className={ this.props.loading ? "base--button speak-button loading" : "base--button speak-button"}>
          Speak
        </button>
      );
    } else {
      return (
        <span>
          <button
            onClick={this.props.onClick}
            className="base--button speak-button speak-disabled"
            title="Only available on Chrome and Firefox"
            disabled={true}
          >
            Speak
          </button>
        </span>
      );
    }
  }
}

export default React.createClass({

  getInitialState() {
    return {
      voice: voices[3], // Alisson is the first voice
      error: null, // the error from calling /classify
      text: voices[3].demo.text, // default text
      ssml: voices[3].demo.ssml, // SSML text
      ssml_voice: voices[3].demo.ssml_voice, // Voice SSML text, only some voices support this
      ssmlLabel: "Expressive SSML",
      current_tab: 0,
      loading_caption: false,
      loading_word: false,
      image: [],
      words: [],
      caption: null
    };
  },

  onTabChange(idx) {
    this.setState({current_tab: idx});
  },

  onTextChange(event) {
    this.setState({text: event.target.value});
  },

  onSsmlChange(event) {
    this.setState({ssml: event.target.value});
  },

  onVoiceSsmlChange(event) {
    this.setState({ssml_voice: event.target.value});
  },

  downloadAllowed() {
    return ((this.state.ssml_voice && this.state.current_tab === 2) || (this.state.ssml && this.state.current_tab === 1) || this.state.current_tab === 0);
  },
  downloadDisabled() {
    return !this.downloadAllowed();
  },
  speakDisabled() {
    return this.downloadDisabled();
  },
  setupParamsFromState(do_download, caption) {
    var params = getSearchParams();

    params.set('text', caption);
    // if (this.state && this.state.current_tab === 0) {
    //   params.set('text', this.state.text);
    params.set('voice', this.state.voice.name);
    // } else if (this.state && this.state.current_tab === 1) {
    //   params.set('text', this.state.ssml);
    //   params.set('voice', this.state.voice.name);
      params.set('ssmlLabel', this.state.ssmlLabel);
    // } else if (this.state && this.state.current_tab === 2) {
    //   params.set('text', this.state.ssml_voice);
    //   params.set('voice', this.state.voice.name);
    // }
    params.set('download', do_download);

    if (!canPlayAudioFormat('audio/ogg;codec=opus') && canPlayAudioFormat('audio/wav')) {
      params.set('accept', 'audio/wav');
    }
    console.log(JSON.stringify(params));
    return params
  },

  onDownload(event) {
    event.target.blur();
    const params = this.setupParamsFromState(true);
    window.location.href = `/api/synthesize?${params.toString()}`
  },

  onSpeak(event, caption) {
    event.target.blur();
    const params = this.setupParamsFromState(true, caption);
    const audio = document.getElementById('audio');
    audio.setAttribute('src', '');


    this.setState({ loading: true, hasAudio: false });
    fetch(`/api/synthesize?${params.toString()}`).then((response) => {
      if (response.ok) {
        response.blob().then((blob) => {
          const url = window.URL.createObjectURL(blob);
          this.setState({ loading: false, hasAudio: true });

          audio.setAttribute('src', url);
          audio.setAttribute('type', 'audio/ogg;codecs=opus');
        });
      } else {
        this.setState({ loading: false });
        response.json().then((json) => {
          this.setState({ error: json });
          setTimeout(() => this.setState({ error: null, loading: false }), 5000);
        });
      }
    })
  },


  onResetClick() {
    // pause audio, if it's playing.
    document.querySelector('audio#audio').pause();
    const currentVoice = this.state.voice;
    this.setState({
      error: null,
      hasAudio: false,
      text: currentVoice.demo.text,
      ssml: currentVoice.demo.ssml,
      ssml_voice: currentVoice.demo.ssml_voice,
    });
  },

  onVoiceChange(event) {
    const voice = voices[voices.map(v => v.name).indexOf(event.target.value)];
    var label = "SSML"
    if (voice.name === "en-US_AllisonVoice")        
       label = "Expressive SSML"
    this.setState({
      voice,
      error: null,
      text: voice.demo.text,
      ssml: voice.demo.ssml,
      ssml_voice: voice.demo.ssml_voice,
      ssmlLabel: label
    });
  },

  componentDidMount() {
  },

  speakWord(caption) {
    const params = this.setupParamsFromState(true, caption);
    const audioWord = document.getElementById('audioWord');
    audioWord.setAttribute('src', '');


    this.setState({ loading: true, hasAudioWord: false });
    fetch(`/api/synthesize?${params.toString()}`).then((response) => {
      if (response.ok) {
        response.blob().then((blob) => {
          const url = window.URL.createObjectURL(blob);
          this.setState({ loading: false, hasAudioWord: true });

          audioWord.setAttribute('src', url);
          audioWord.setAttribute('type', 'audio/ogg;codecs=opus');
        });
      } else {
        this.setState({ loading: false });
        response.json().then((json) => {
          this.setState({ error: json });
          setTimeout(() => this.setState({ error: null, loading: false }), 5000);
        });
      }
    })
  },

  speakCaption(caption) {
    const params = this.setupParamsFromState(true, caption);
    const audioCaption = document.getElementById('audioCaption');
    audioCaption.setAttribute('src', '');


    this.setState({ loading: true, hasAudioCaption: false });
    fetch(`/api/synthesize?${params.toString()}`).then((response) => {
      if (response.ok) {
        response.blob().then((blob) => {
          const url = window.URL.createObjectURL(blob);
          this.setState({ loading: false, hasAudioCaption: true });

          audioCaption.setAttribute('src', url);
          audioCaption.setAttribute('type', 'audio/ogg;codecs=opus');
        });
      } else {
        this.setState({ loading: false });
        response.json().then((json) => {
          this.setState({ error: json });
          setTimeout(() => this.setState({ error: null, loading: false }), 5000);
        });
      }
    })
  },


  getVisualRecognitionResult(imageFile) {

    $ = require('jquery');

    var formData = new FormData($('#upload_form')[0]);

    formData.append('image', imageFile);

    var that = this;

    this.setState({loading_word: true});
    this.setState({words: []});

    $.ajax({
      url: "/api/caption",
      data: formData,
      processData: false,
      contentType: false,
      type: 'POST',
      success: function(response) {
        var response = JSON.parse(response);

        var words = response.images[0].classifiers[0].classes; 

        that.setState({
            words: words,
            loading_word: false
        });

        // that.speak(response['caption']);
        var string = [];
        words.forEach(function(word){
          string.push(word.class);
        });

        that.speakWord('<speak>The image tags are ' + "<break time='0.5s'/>" + string.join(" <break time='0.5s'/> ") + "</speak>");

        }
    });
  

  },

  getCaption(imageFile) {
    $ = require('jquery');

    var formData = new FormData($('#upload_form')[0]);

    formData.append('image', imageFile);


    var that = this;

    this.setState({loading_caption: true});
    this.setState({caption: null});

    $.ajax({
      url: "https://n12halki.cs.ntua.gr:3000/caption",
      data: formData,
      processData: false,
      contentType: false,
      type: 'POST',
      success: function(response) {
        that.setState({
            caption: response.caption,
            loading_caption: false
        });

        that.speakCaption("<speak>The caption I saw is <break time='0.5s'/>" + response.caption + " </speak>");

        }
    });
  },


  onDrop(imageFile) {
    // console.log(imageFile[0])
    this.setState({image: imageFile[0]});

    this.getVisualRecognitionResult(imageFile[0]);

    this.getCaption(imageFile[0]);


  },

  render() {
    return (
      <section className="_container _container_large">
        <div className="row">
          <h2 className="base--h2 title">Input Image</h2>
          <p className="base--p normalfont">
          </p>
{/*
          <div className="voice-input">
            <select name="voice" className="base--select" onChange={this.onVoiceChange} value={this.state.voice.name}>
              {voices.map(voice => (
                <option key={voice.name} value={voice.name}>{voice.option}</option>
              ))}
            </select>
          </div>
*/}


          <form id="upload_form" enctype="multipart/form-data"></form>

          <Dropzone
            onDrop={this.onDrop.bind(this)}>
              <div>Drag and drop an image!</div>
          </Dropzone>


              <div>
                <table className="captionsTable">

{/*                {this.state.imageFiles.slice(0).reverse().map((file) => */ }

                  <tr>
                    <td>
                      <img src={this.state.image.preview} /> 
                    </td>
                    <td>
                      
                      <p>

                      <div className={`text-center loading ${this.state.loading_word ? '' : 'hidden'}`}>
                        <Icon type="loader" />
                      </div>

                      <div className={`text-center loading ${!this.state.loading_word ? '' : 'hidden'}`}>

                        <div className={`text-center  ${this.state.words.length > 0  ? '' : 'hidden'}`}>

                                                <tr><td>Word</td><td>Score</td></tr>
                        {this.state.words.map((word) => 
                          <tr><td>{word.class}</td><td>{word.score}</td></tr>
                          )}
                        </div>


            <audio autoPlay="true" id="audioWord" className={`audio ${this.state.hasAudioWord ? '' : 'hidden'}`} controls="controls">
              Your browser does not support the audio element.
            </audio>

                      </div>

                      </p>
                    </td>

                    <td>
<p>
            <div className={`text-center  ${this.state.loading_caption ? '' : 'hidden'}`}>
              <Icon type="loader" />
            </div>  
                      {this.state.caption} 

            <audio id="audioCaption" className={`audio ${this.state.hasAudioCaption ? '' : 'hidden'}`} controls="controls">
              Your browser does not support the audio element.
            </audio>


                      </p>
                    </td>
                  </tr>


                </table>
              </div>

{/*
          <Tabs selected={0} onChange={this.onTabChange}>
            <Pane label="Text">
              <textarea onChange={this.onTextChange} className="base--textarea textarea" spellCheck="false" value={this.state.text || ''}/>
            </Pane>
            <Pane label={this.state.ssmlLabel}>
              <textarea onChange={this.onSsmlChange} className="base--textarea textarea" spellCheck="false" value={this.state.ssml || ''}/>
            </Pane>
            <Pane label="Voice Transformation SSML">
              <textarea readOnly={!this.state.ssml_voice} onChange={this.onVoiceSsmlChange} className="base--textarea textarea" spellCheck="false" value={this.state.ssml_voice || 'Voice Transformation not currently supported for this language.'}/>
            </Pane>
          </Tabs>
          <div className="output-container">
            <div className="controls-container">
              <div className="buttons-container">
                <button onClick={this.onDownload} disabled={this.downloadDisabled()} className="base--button download-button">Download</button>
                <ConditionalSpeakButton loading={this.state.loading} onClick={this.onSpeak} disabled={this.speakDisabled()}/>
              </div>
              <div className={!this.state.loading && this.state.hasAudio ? "reset-container" : "reset-container dimmed"}>
                <Icon type="reset" />
                <a className="base--a reset-button" onClick={this.onResetClick}>Reset</a>
              </div>
            </div>
            <div className={`errorMessage ${this.state.error ? '' : 'hidden'}`}>
              <Icon type="error" />
              <p className="base--p service-error--message">{this.state.error ? this.state.error.error : ''}</p>
            </div>
            <div className={`text-center loading ${this.state.loading ? '' : 'hidden'}`}>
              <Icon type="loader" />
            </div>
          </div>*/}


          <div className="disclaimer--message">
            * This system is for demonstration purposes only and is not intended to process
            Personal Data. No Personal Data is to be entered into this system as it may not
            have the necessary controls in place to meet the requirements of the General Data
            Protection Regulation (EU) 2016/679.
          </div>
        </div>
      </section>
    );
  }
});
