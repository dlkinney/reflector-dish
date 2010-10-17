var fs = require('fs')
var sys = require('sys')
var reader = require('./file_reader.js')

exports.pinFile = function(username) {
  return __dirname + '/../data/verifier/' + username
}

exports.accessTokensFile = function(username) {
  return __dirname + '/../data/access/' + username
}

exports.loadPIN = function(username, callback) {
  var filename = __dirname + '/../data/verifier/' + username
  reader.readFile(filename, function(data) {
    scrubbed = data.split(/\n/, 2)[0]
    callback(scrubbed)
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