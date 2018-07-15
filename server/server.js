const express = require('express');

const app = express();
require('./routers/index')(app);

const port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log(`The app is listening on http://localhost:${port}`);  
});
