var sys           = require('sys')
var oauth         = require('./lib/oauth_client.js')
var authorization = require('./lib/authorization.js')
var data          = require('./lib/data.js')
var twitter       = require('./lib/twitter.js')

var ReflectorDish = function() {
  var self = this
  
  self.username = null
  self.restClient = null
  self.streamClient = null
  
  self.init = function(username, onComplete) {
    self.username = username
    
    self.restClient = oauth.client('http://api.twitter.com/')
    self.streamClient = oauth.client('http://stream.twitter.com/')
    
    self._loadConsumerTokens(function() {
      self._loadAccessTokens(onComplete)
    })
  }
  
  self._loadConsumerTokens = function(onComplete) {
    data.loadConsumerTokens(function(consumerKey, consumerSecret) {
      self.restClient.setConsumer(consumerKey, consumerSecret)
      self.streamClient.setConsumer(consumerKey, consumerSecret)
      if (onComplete) onComplete()
    })
  }
  
  self._loadAccessTokens = function(onComplete) {
    authorization.loadAccessTokens({
      username: self.username
    , client: self.client
    , callback: function(accessToken, accessTokenSecret) {
        self.restClient.setAccess(accessToken, accessTokenSecret)
        self.streamClient.setAccess(accessToken, accessTokenSecret)
        if (onComplete) onComplete()
      }
    })
  }
  
  self.getMembersOfList = function(listURI, callback) {
    var allMembers = []
    var onMembers = function(members) {
      members.forEach(function(member) {
        allMembers.push(member)
      })
    }
    var onComplete = function() {
      callback(allMembers)
    }
    
    self._getMembersOfList({
      listURI: listURI
    , members: onMembers
    , complete: onComplete
    })
  }
  
  self._getMembersOfList = function(options) {
    var listURI    = options.listURI.replace(/^[@/]/, '')
    var cursor     = options.cursor || -1
    var onMembers  = options.members
    var onComplete = options.complete
    
    var uri = "http://api.twitter.com/1/" + listURI + "/members.json?cursor=" + cursor
    var err = function(response) {
      if (response) throw new Error(sys.inspect(response))
    }
    var success = function(body) {
      var response = JSON.parse(body)
      
      var membersOnPage = response.users
      onMembers(membersOnPage)
      
      var nextCursor = response.next_cursor
      if (nextCursor > 0) {
        var nextOptions = Object.merge(options, { cursor: nextCursor })
        self._getMembersOfList(nextOptions)
      } else {
        onComplete()
      }
    }
    
    self.restClient.get({ 
      uri: uri
    , error: err
    , complete: success
    })
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
