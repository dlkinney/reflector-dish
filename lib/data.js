var fs = require('fs')
var reader = require('./file_reader.js')

exports.loadPIN = function(username, callback) {
  var filename = __dirname + '/../data/verifier/' + username
  reader.read(filename, function(data) {
    scrubbed = data.split(/\n/, 2)[0]
    callback(scrubbed)
  })
}

exports.loadAccessToken = function(username, callback) {
  var filename = __dirname + '/../data/access/' + username
  reader.read(filename, function(data) {
    var lines = data.split(/\n/)
    
    var accessToken = lines[0]
    var accessTokenSecret = lines[1]
    callback(accessToken, accessTokenSecret)
  })
}

exports.saveAccessToken = function(username, accessToken, accessTokenSecret) {
  var filename = __dirname + '/../data/access/' + username
  fs.writeFile(filename, accessToken + "\n" + accessTokenSecret, function(err) {
    if (err) throw err
  })
}