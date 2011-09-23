var sys           = require('sys')
var querystring   = require('querystring')

var oauth         = require('./lib/oauth_client.js')
var authorization = require('./lib/authorization.js')
var data          = require('./lib/data.js')
var Parser        = require('./lib/parser.js')

var merge = function(a, b) {
	var keys = Object.keys(b);

	for (var key in keys) {
		if (typeof(keys[key]) !== 'function') {
			a[keys[key]] = b[keys[key]];
		}
	}
	
	return a;
};

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
    , client: self.restClient
    , callback: function(accessToken, accessTokenSecret) {
        self.restClient.setAccess(accessToken, accessTokenSecret)
        self.streamClient.setAccess(accessToken, accessTokenSecret)
        if (onComplete) onComplete()
      }
    })
  }
  
  self._onHTTPError = function(response) {
    console.log(response.statusCode)
    console.log(sys.inspect(response.headers))
    response.addListener('data', function(chunk) {
      console.log(chunk.toString('utf8'))
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
    
    var uri = "/1/" + listURI + "/members.json?cursor=" + cursor
    var success = function(body) {
      var response = JSON.parse(body)
      
      var membersOnPage = response.users
      onMembers(membersOnPage)
      
      var nextCursor = response.next_cursor
      if (nextCursor > 0) {
        var nextOptions = merge(options, { cursor: nextCursor })
        self._getMembersOfList(nextOptions)
      } else {
        onComplete()
      }
    }
    
    self.restClient.get({ 
      uri: uri
    , error: self._onHTTPError
    , complete: success
    })
  }
  
  self.retweet = function(tweet, onComplete) {
    var uri = '/1/statuses/retweet/' + tweet.id + '.json'
    self.restClient.post({
      uri: uri
    , error: self._onHTTPError
    , complete: onComplete
    })
  }
  
  self.streamFilter = function(params, onTweet) {
    var parser = new Parser()
    parser.addListener('object', onTweet)
    
    var body = {}
    if (params.follow)    body.follow    = params.follow.join(',')
    if (params.locations) body.locations = params.locations.join(',')
    if (params.track)     body.track     = params.track.join(',')
    
    self.streamClient.post({
      uri: '/1/statuses/filter.json'
    , body: body
    , data: function(chunk) { parser.receive(chunk) }
    , error: self._onHTTPError
    })
  }
}

var username = process.argv[2]
var listURI  = process.argv[3]
var hashtag  = process.argv[4]

var tweetIDs = []
var reflectorDish = new ReflectorDish()

var processTweet = function(tweet) {
  // ignore retweets
  if (tweet.retweeted_status) return
  if (tweet.text && tweet.text.search("RT ") == 0) return
  
  // ignore tweets I've already seen
  if (tweet.id && tweetIDs.indexOf(tweet.id) >= 0) return
  if (tweet.new_id && tweetIDs.indexOf(tweet.new_id) >= 0) return
  
  if (tweet.entities && tweet.entities.hashtags) {
    var containsHashTag = tweet.entities.hashtags.some(function(ht) {
      return (ht.text == hashtag)
    })
    if (containsHashTag) {
      tweetIDs.push(tweet.id)
      tweetIDs.push(tweet.new_id)
      console.log("  Retweeting: [" + tweet.new_id + "] " + tweet.text)
      reflectorDish.retweet(tweet, function() {
        console.log("    Successfully retweeted " + tweet.new_id)
      })
    }
  }
}

reflectorDish.init(username, function() {
  console.log("Loading members of " + listURI + " ...")
  reflectorDish.getMembersOfList(listURI, function(members) {
    console.log("  Found " + members.length + " members")
    console.log("Streaming tweets from members...")
    var userIDs = members.map(function(member) {
      return member.id
    })
    var params = { follow: userIDs }
    reflectorDish.streamFilter(params, processTweet)
  })
})
