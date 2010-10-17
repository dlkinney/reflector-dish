var data = require('./data.js')

var AccessTokenManager = function(options) {
  var self = this
  
  self.username = options.username
  self.client   = options.client
  
  self.loadAccessTokens = function(callback) {
    data.loadAccessTokens({
      username: self.username
    , read: callback
    , notFound: self._onNotFound
    })
  }
  
  self._onNotFound = function(filename) {
    self.client.getOAuthRequestToken(function(err, oauthToken, oauthTokenSecret, results) {
      if (err) throw err
      
      pinFile = data.pinFile(self.username)
      
      console.log("Step 1: Open https://api.twitter.com/oauth/authorize?oauth_token=" + oauthToken)
      console.log("Step 2: Login to Twitter, if necessary")
      console.log("Step 3: Allow Reflector Dish access to your account by clicking ALLOW")
      console.log("Step 4: Copy the PIN shown")
      console.log("Step 5: echo [PIN] > " + pinFile)
      
      data.loadPIN(self.username, function(pin) {
        self.client.getOAuthAccessToken(oauthToken, oauthTokenSecret, pin, self._onAccessToken)
      })
    })
  }
  
  self._onPIN = function(pin) {
    self.client.getOAuthAccessToken(oauth_token, oauth_token_secret, pin, self._onAccessToken)
  }
  
  self._onAccessToken = function(err, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (err) throw err
    
    data.saveAccessTokens(self.username, oauthAccessToken, oauthAccessTokenSecret)
  }
}

exports.loadAccessTokens = function(options) {
  var accessTokenMgr = new AccessTokenManager(options)
  accessTokenMgr.loadAccessTokens(options.callback)
}
