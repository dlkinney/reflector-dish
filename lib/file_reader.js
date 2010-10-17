var fs  = require('fs')
var sys = require('sys')

function FileReader(filename) {
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments)
  }
  
  var self = this
  
  self.filename = filename
  
  self.read = function(onRead, onNotFound) {
    
    fs.stat(self.filename, function(err, stats) {
      if (err) {
        if (err.errno == 2) {   // file does not exist
          if (onNotFound) onNotFound(self.filename)
          self._watchFile(onRead)
        } else {
          throw err;
        }
      } else {
        self._readFile(onRead)
      }
    })
  }
  
  self._watchFile = function(onRead) {
    fs.watchFile(self.filename, function() {
      fs.unwatchFile(self.filename)
      self._readFile(onRead)
    })
  }
  
  self._readFile = function(onRead) {
    fs.readFile(self.filename, function(err, data) {
      if (err) throw err
      onRead(data.toString())
    })
  }
}

exports.readFile = function(filename, callback) {
  var reader = new FileReader(filename)
  reader.read(callback)
}

exports.read = function(options) {
  var filename   = options.filename
  var onRead     = options.read
  var onNotFound = options.notFound
  
  var reader = new FileReader(filename)
  reader.read(onRead, onNotFound)
}
