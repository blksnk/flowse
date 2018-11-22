const deezerAPI = require('node-deezer');
const deezer = new deezerAPI({
	clientID: process.env.DEEZER_KEY,
    clientSecret: process.env.DEEZER_SECRET,
    redirectURL: "http://localhost:4000/auth/deezer/link",
});

console.log(deezer.getLoginUrl(312844, "http://localhost:5000/auth/deezer/link"))