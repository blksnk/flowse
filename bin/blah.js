require("dotenv").config();

const spotifyAPI = require('spotify-web-api-node');
const spotify = new spotifyAPI({
  clientId: process.env.SPOTIFY_KEY,
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: "http://localhost:5000/auth/spotify/link"
});


spotify.setAccessToken("BQAIKnI-u6_XlkbbszyOR9HFtRBne17_xcc3FyS66t4A7FtL0pK9P6Dgc6tF79bO2kBnl1lVodcjFLkZFph7GI8KUh5KMAJPGfGXlUeBowU7MiVRzjckJMYtEz25akXrzbZWBuevgUwEwWLs626yMO4joBPitEY1yqSXh4ZLNjLtFTXbVNc");
spotify.setRefreshToken("AQDxwcvlSrdKEmVGZakufEHC0k-6Tk4oaIbIzEaIUVeDpAPHheAh2PaXBfpWP-28zbw700LjLgJtBr9d8TeOAyOnY0BrZINeVffC2OZpJupBw8TC-tpfrsxFmwWdbc6jyIq_wg");
spotify.refreshAccessToken()
    .then(data => console.log(data.body.access_token))
    .catch(err => console.error(err))
 