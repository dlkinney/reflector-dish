var sys           = require('sys')
var oauth         = require('oauth-client')
var authorization = require('./lib/authorization.js')
var data          = require('./lib/data.js')
var twitter       = require('./lib/twitter.js')

var ReflectorDish = function() {
  var self = this
  
  self.restClient = oauth.createClient(80, 'api.twitter.com', false)
  self.streamClient = oauth.createClient(80, 'stream.twitter.com', false)
  self.username = null
  self.consumer = null
  self.signer = null
  self.access = null
  
  self.init = function(username, onComplete) {
    self.username = username
    self._loadConsumerTokens(function() {
      self._loadAccessTokens(onComplete)
    })
  }
  
  self._loadConsumerTokens = function(onComplete) {
    data.loadConsumerTokens(function(consumerKey, consumerSecret) {
      self.consumer = oauth.createConsumer(consumerKey, consumerSecret);
      if (onComplete) onComplete()
    })
  }
  
  self._loadAccessTokens = function(onComplete) {
    authorization.loadAccessTokens({
      username: self.username
    , client: self.client
    , callback: function(token, secret) {
        self.access = oauth.createToken(token, secret)
        self.signer = oauth.createHmac(self.consumer, self.access)
        if (onComplete) onComplete()
      }
    })
  }
  
  self.get = function(options) {
    request = self.restClient.request('GET', options.uri, options.headers, null, self.signer)
    request.addListener('response', function(response) {
      var data = []
      response.addListener('data', function(chunk) {
        data.push(chunk)
      })
      response.addListener('end', function() {
        options.callback(response.statusCode, response.headers, data.join(''))
      })
    })
    request.end()
  }
  
  self.getMembersOfList = function(listURI, callback) {
    var members = []
    var onData = function(membersOnPage) {
      membersOnPage.forEach(function(member) {
        members.push(member)
      })
    }
    var onComplete = function() {
      callback(members)
    }
    
    self._getMembersOfList({
      listURI: listURI
    , data: onData
    , complete: onComplete
    })
  }
  
  self._getMembersOfList = function(options) {
    var listURI    = options.listURI.replace(/^[@/]/, '')
    var cursor     = options.cursor || -1
    var onData     = options.data
    var onComplete = options.complete
    
    var uri = "http://api.twitter.com/1/" + listURI + "/members.json?cursor=" + cursor
    var handler = function(statusCode, headers, body) {
      if (statusCode != 200) throw "Unable to get member list: " + statusCode + " " + JSON.stringify(headers)
      
      var response = JSON.parse(body)
      var membersOnPage = response.users
      var nextCursor = response.next_cursor
      onData(membersOnPage)
      
      if (nextCursor > 0) {
        self._getMembersOfList({
          listURI:  listURI
        , cursor:   nextCursor
        , data:     onData
        , complete: onComplete
        })
      } else {
        onComplete()
      }
    }
    
    self.get({ uri: uri, callback: handler })
  }
  
}

var username = process.argv[2]
var listURI  = process.argv[3]

reflectorDish = new ReflectorDish()
reflectorDish.init(username, function() {
  console.log("Loading members of " + listURI + " ...")
  reflectorDish.getMembersOfList(listURI, function(members) {
    console.log("  Found " + members.length + " members")
    console.log("Streaming tweets from members...")
    // TODO implement me
  })
})
