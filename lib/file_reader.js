var fs  = require('fs')
var sys = require('sys')

function FileReader(filename) {
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments)
  }
  
  var self = this
  
  self.filename = filename
  
  self.read = function(callback) {
    fs.stat(self.filename, function(err, stats) {
      if (err) {
        if (err.errno == 2) {   // file does not exist
          self._watchFile(callback)
        } else {
          throw err;
        }
      } else {
        self._readFile(callback)
      }
    })
  }
  
  self._watchFile = function(callback) {
    fs.watchFile(self.filename, function() {
      fs.unwatchFile(self.filename)
      self._readFile(callback)
    })
  }
  
  self._readFile = function(callback) {
    fs.readFile(self.filename, function(err, data) {
      if (err) throw err
      callback(data.toString())
    })
  }
}

exports.read = function(filename, callback) {
  var reader = new FileReader(filename)
  reader.read(callback)
}
