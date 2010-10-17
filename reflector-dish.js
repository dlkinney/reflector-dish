var authorization = require('./lib/authorization.js')
var twitter       = require('./lib/twitter.js')

var username       = process.argv[2]
var consumerKey    = process.argv[3]
var consumerSecret = process.argv[4]

var client = twitter.client(consumerKey, consumerSecret)

var accessToken = null;
var accessSecret = null;


authorization.loadAccessTokens({
  username: username
, client: client
, callback: function(token, secret) {
    accessToken = token
    accessSecret = secret
    console.log("accessToken  = " + accessToken)
    console.log("accessSecret = " + accessSecret)
  }
})