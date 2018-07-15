import React from 'react';

// eslint-disable-next-line
const DESCRIPTION = 'The Text to Speech service understands text and natural language to generate synthesized audio output complete with appropriate cadence and intonation. It is available in 13 voices across 7 languages. Select voices now offer Expressive Synthesis and Voice Transformation features.';

function Layout(props) {
  return (
    <html lang="en">
         <body>
         <div className="row">
           <h4 className="text-center"> Image Captioning Web Application</h4>
          </div>
        <div id="root">
          {props.children}
        </div>
        <script type="text/javascript" src="js/bundle.js" />
      </body>
    </html>
  );
}

Layout.propTypes = {
  children: React.PropTypes.object.isRequired,
};

export default Layout;
