var oauth = require('oauth-client')
var sys = require('sys')
var url = require('url')

/**
 * === Usage ===
 * 
 *   client = new OAuthClient()
 *   client.setHostURL('http://api.twitter.com/')
 *   client.setConsumer(oauth_consumer_token, oauth_consumer_secret)
 *   client.setAccess(oauth_access_token, oauth_access_token_secret)
 *   client.get({
 *     uri: '/1/pinkhop/employees/members.json?cursor=-1'
 *   , complete: function(data) {
 *       console.log(data)
 *     }
 *   , error: function(response) {
 *       console.log(response.statusCode)
 *       console.log(JSON.stringify(response.headers))
 *     }
 *   })
 */
var OAuthClient = function() {
  var self = this
  
  self._client   = null
  self._consumer = null
  self._token    = null
  self._signer   = null
  
  self.setHostURL = function(hostURL) {
    var parsedURL = url.parse(hostURL)
    var protocol = parsedURL.protocol
    var ssl = (protocol == 'https:')
    var host = parsedURL.hostname
    var port = parsedURL.port || (ssl) ? 443 : 80
    
    self._client = oauth.createClient(port, host, ssl)
  }
  
  self.setConsumer = function(token, secret) {
    self._consumer = oauth.createConsumer(token, secret)
    self._generateSigner()
  }
  self.setToken = function(token, secret) {
    if (secret) {
      self._token = oauth.createToken(token, secret)
    } else {
      self._token = token
    }
    self._generateSigner()
  }
  self.setAccess = self.setToken
  
  self._generateSigner = function() {
    if (self._consumer) {
      if (self._token) {
        self._signer = oauth.createHmac(self._consumer, self._token)
      } else {
        self._signer = oauth.createHmac(self._consumer)
      }
    }
  }
  
  self.get = function(options) {
    self._request('GET', options)
  }
  
  self.post = function(options) {
    self._request('POST', options)
  }
  
  self._request = function(method, options) {
    var uri = options.uri
    var headers = options.headers
    var body = options.body
    var onData = options.data
    var onError = options.error
    var onComplete = options.complete
    
    request = self._client.request(method, uri, headers, body, self._signer)
    request.addListener('response', function(response) {
      var data = []
      
      if (onError && response.statusCode >= 400) {
        onError(response)
        return
      }
      
      response.addListener('data', onData || function(chunk) {
        data.push(chunk)
      })
      if (onComplete) response.addListener('end', function() { 
        onComplete(data.join('')) 
      })
    })
    if (body) request.write(body)
    request.end()
  }
}

exports.client = function(hostURL) {
  var client = new OAuthClient()
  client.setHostURL(hostURL)
  return client
}