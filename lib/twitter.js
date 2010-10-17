var OAuth = require('../vendor/node-oauth').OAuth

exports.client = function(consumer_key, consumer_secret) {
  return new OAuth("https://api.twitter.com/oauth/request_token",
                   "https://api.twitter.com/oauth/access_token",
                   consumer_key,
                   consumer_secret,
                   "1.0",
                   "oob",
                   "HMAC-SHA1")
}