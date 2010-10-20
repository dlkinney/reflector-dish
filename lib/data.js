var fs = require('fs')
var reader = require('./file_reader.js')

exports.consumerTokensFile = function() {
  return __dirname + '/../data/consumer_tokens'
}

exports.accessTokensFile = function(username) {
  return __dirname + '/../data/access/' + username
}

exports.loadConsumerTokens = function(callback) {
  var filename = __dirname + '/../data/consumer_tokens'
  reader.readFile(filename, function(data) {
    var lines = data.split(/\n/)
    var consumerToken = lines[0]
    var consumerTokenSecret = lines[1]
    callback(consumerToken, consumerTokenSecret)
  })
}

exports.loadAccessTokens = function(options) {
  var username   = options.username
  var onRead     = options.read
  var onNotFound = options.notFound
  var filename = __dirname + '/../data/access/' + username
  
  reader.read({
    filename: filename
  , notFound: onNotFound
  , read: function(data) {
      var lines = data.split(/\n/)
      var accessToken = lines[0]
      var accessTokenSecret = lines[1]
      onRead(accessToken, accessTokenSecret)
    }
  })
}

exports.saveAccessTokens = function(username, accessToken, accessTokenSecret) {
  var filename = __dirname + '/../data/access/' + username
  fs.writeFile(filename, accessToken + "\n" + accessTokenSecret, function(err) {
    if (err) throw err
  })
}