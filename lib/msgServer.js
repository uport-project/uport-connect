const xhr = process.browser ? require('xhr') : require('request');
const qs = require('qs');
const randomString = require('../util/randomString.js');

module.exports = MsgServer;

function MsgServer(chasquiUrl, isOnMobile){
  this.chasquiUrl = chasquiUrl;
  this.intervalIds = {};
  this.isOnMobile = isOnMobile;
}

MsgServer.prototype.newTopic = function(topicName) {
  var topic = {
    name: topicName,
    id: randomString(16)
  }
  if (this.isOnMobile) {
    topic.url = location.href;
  } else {
    topic.url = this.chasquiUrl;
    if (topicName === 'address') {
      // address url differs from topic
      topic.url += 'addr/' + topic.id;
    } else {
      topic.url += topicName + '/' + topic.id;
    }
  }
  return topic;
}

MsgServer.prototype.waitForResult = function(topic, cb) {
  if (this.isOnMobile) {
    this.waitForHashChange(topic, cb);
  } else {
    this.pollForResult(topic, cb);
  }
}
MsgServer.prototype.waitForHashChange = function(topic, cb) {
  window.onhashchange = function() {
    if (location.hash) {
      var params = qs.parse(location.hash.slice(1));
      if (params[topic.name]) {
        window.onhashchange = function(){};
        cb(null, params[topic.name]);
      }
      else if (params.error) {
        window.onhashchange = function(){};
        cb(params.error);
      }
    }
  };
}

MsgServer.prototype.pollForResult = function(topic, cb) {
  const self = this;

  self.intervalIds[topic.id] = setInterval( xhr.bind(null, {
    uri: topic.url,
    method: 'GET',
    rejectUnauthorized: false
  }, function(err, res, body) {
    if (err) return cb(err)

    // parse response into raw account
    var data
    try {
      data = JSON.parse(body)
      if (data.error) {
        clearInterval(self.intervalIds[topic.id]);
        return cb(data.error)
      }
    } catch (err) {
      console.error(err.stack)
      clearInterval(self.intervalIds[topic.id]);
      return cb(err)
    }
    // Check for param, stop polling and callback if present
    if (data[topic.name]) {
      clearInterval(self.intervalIds[topic.id]);
      self.intervalIds[topic.id] = null;
      self.clearTopic(topic.url);
      return cb(null, data[topic.name]);
    }
  }), 2000);
}

MsgServer.prototype.clearTopic = function(url) {
  const self = this

  xhr({
    uri: url,
    method: 'DELETE',
    rejectUnauthorized: false
  }, function(){});
}
