const xhr = process.browser ? require('xhr') : require('request')
const randomString = require('../util/randomString.js');

module.exports = MsgServer;

function MsgServer(chasquiUrl){
  const self = this;
  self.chasquiUrl = chasquiUrl;
  self.intervalIds = {};
}

MsgServer.prototype.newTopic = function(topicName) {
  const self = this;
  var topic = {
    name: topicName,
    id: randomString(16)
  }
  topic.url = self.chasquiUrl;
  if (topicName === 'address') {
    // address url differs from topic
    topic.url += 'addr/' + topic.id
  } else {
    topic.url += topicName + '/' + topic.id
  }
  return topic;
}

MsgServer.prototype.pollForResult = function(topic, cb) {
  const self = this

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
      if (data.error) return cb(data.error)
    } catch (err) {
      console.error(err.stack)
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
