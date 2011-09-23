var sys = require('sys')
var oauth = require('./oauth.js')   // only for createToken()
var data = require('./data.js')

var AccessTokenManager = function(options) {
  var self = this
  
  self.username = options.username
  self.client   = options.client
  self.token    = null
  
  self.loadAccessTokens = function(callback) {
    data.loadAccessTokens({
      username: self.username
    , read: callback
    , notFound: self._onNotFound
    })
  }
  
  self._onNotFound = function(filename) {
    var requestTokenPath = 
    self.client.post({
      uri: '/oauth/request_token'
    , complete: self._onRequestToken
    })
  }
  
  self._onRequestToken = function(data) {
    self.token = oauth.createToken()
    self.token.decode(data)
    
    sys.print("Step 1: Open https://api.twitter.com/oauth/authorize?oauth_token=" + self.token.oauth_token + "\n")
    sys.print("Step 2: Login to Twitter, if necessary\n")
    sys.print("Step 3: Allow Reflector Dish access to your account by clicking ALLOW")
    sys.print("Step 4: Enter the PIN shown\n")
    sys.print("\n")
    sys.print("PIN> ")
    
    var pin = ""
    var stream = process.openStdin()
    stream.addListener('data', function(chunk) {
      pin += chunk.toString('utf-8')
      if (pin.search(/\s+/) >= 0) {
        stream.removeListener('data',arguments.callee)
        self._onPIN(pin.trim())
      }
    })
  }
  
  self._onPIN = function(pin) {
    self.token.oauth_verifier = pin.trim()
    self.client.setToken(self.token)
    self.client.post({
      uri: '/oauth/access_token'
    , complete: self._onAccessToken
    , error: self._onAccessTokenError
    })
  }
    
  self._onAccessToken = function(body) {
    self.token.decode(body)
    data.saveAccessTokens(self.username, self.token.oauth_token, self.token.oauth_token_secret)
  }
  
  self._onAccessTokenError = function(response) {
    console.log(response.statusCode)
    console.log(JSON.stringify(response.headers))
    response.addListener('data', function(chunk) { 
      console.log(chunk.toString('utf8'))
    })
    response.addListener('end', function() {
      throw response.statusCode
    })
  }
}

exports.loadAccessTokens = function(options) {
  var accessTokenMgr = new AccessTokenManager(options)
  accessTokenMgr.loadAccessTokens(options.callback)
}
