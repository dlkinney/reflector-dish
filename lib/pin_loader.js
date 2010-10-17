var fs  = require('fs')
var sys = require('sys')

function PINLoader(username, callback) {
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments)
  }
  
  var self = this
  
  self.filename = __dirname + '/../data/verifier/' + username
  self.callback = callback
  
  self._init = function() {
    fs.stat(self.filename, self._onStat);
  }
  
  self._onStat = function(err, stats) {
    if (err) {
      if (err.errno == 2) {
        self.watchFile()
      } else {
        throw err
      }
    } else {
      self.loadPINAndMakeCallback()
    }
  }
  
  self.watchFile = function() {
    fs.watchFile(self.filename, self._onFileChange)
  }
  
  self._onFileChange = function(currStats, prevStats) {
    console.log("File changed")
    
    console.log("Unwatching file " + self.filename)
    fs.unwatchFile(self.filename)
    
    self.loadPINAndMakeCallback()
  }
  
  self.loadPINAndMakeCallback = function() {
    var self = this
    
    fs.readFile(self.filename, function(err, data) {
      if (err) throw err
      trimmed = self.trim(data.toString())
      self.callback(trimmed)
    })
  }
  
  self.trim = function(str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '')
  }
  
  self._init()
}
