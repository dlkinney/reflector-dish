var sys           = require('sys')
var authorization = require('./lib/authorization.js')
var data          = require('./lib/data.js')
var twitter       = require('./lib/twitter.js')


var ReflectorDish = function() {
  var self = this
  
  self.username = null
  self.client = null
  self.accessToken = null
  self.accessSecret = null
  
  self.init = function(username, onComplete) {
    self.username = username
    self._loadConsumerTokens(function() {
      self._loadAccessTokens(onComplete)
    })
  }
  
  self._loadConsumerTokens = function(onComplete) {
    data.loadConsumerTokens(function(consumerKey, consumerSecret) {
      self.client = twitter.client(consumerKey, consumerSecret)
      if (onComplete) onComplete()
    })
  }
  
  self._loadAccessTokens = function(onComplete) {
    authorization.loadAccessTokens({
      username: self.username
    , client: self.client
    , callback: function(token, secret) {
        self.accessToken = token
        self.accessSecret = secret
        if (onComplete) onComplete()
      }
    })
  }
  
  self.get = function(options) {
    self.client.get(options.uri, self.accessToken, self.accessSecret, options.callback)
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
    var handler = function(err, data) {
      if (err) throw err
      
      var response = JSON.parse(data)
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