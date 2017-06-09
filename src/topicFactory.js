import nets from 'nets'
import MobileDetect from 'mobile-detect'
import qs from 'qs'
import randomString from './util/randomString'
const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'

/**  @module uport-connect/topicFactory
  *  @description
  *  Manages the communication channel between the uport-connect library and a
  *  uPort mobile app. The functionality is dependent on the context. If on a
  *  desktop device the communication channel is through a server. uPort offers a
  *  server called chasqui to implement this, but you may also run you own server.
  *  If on a mobile device the communication channel between the broswer and app
  *  is managed by passing data with URIs/URLs
  */

/**
 *  Returns a function enclosed with the necessary settings which creates topics
 *  (or communication channels).
 *
 *  @param    {Boolean}    isOnMobile           true if in on mobile device, false otherwise
 *  @param    {String}     pollingInterval      the rate at which the messaging server is polled
 *  @param    {String}     chasquiUrl           the url of the message server
 *  @return   {Function}
 */
function TopicFactory (isOnMobile, pollingInterval = 2000, chasquiUrl = CHASQUI_URL) {
  /**
   *  Waits for a window.onhashchange event, which occurs when control is returned
   *  from the mobile uPort app to the mobile browser.
   *
   *  @param    {String}     topicName     the topic you are waiting for a response
   *  @param    {Function}   cb            a callback which receives a response or error
   */
  function waitForHashChange (topicName, cb) {
    window.onhashchange = function () {
      if (window.location.hash) {
        const params = qs.parse(window.location.hash.slice(1))
        if (params[topicName]) {
          window.onhashchange = function () {}
          window.location.hash = ''
          cb(null, params[topicName])
        } else if (params.error) {
          window.onhashchange = function () {}
          window.location.hash = ''
          cb(params.error)
        }
      }
    }
  }

  /**
   *  Polls a given url (messaging server) for given topic response
   *  from the mobile uPort app to the mobile browser.
   *
   *  @param    {String}     topicName     the topic you are waiting for a response
   *  @param    {String}     url           url to poll for a response
   *  @param    {Function}   cb            function which is called with a response or error
   *  @param    {Function}   cancelled     function which returns true if the polling has been cancelled
   */
  function pollForResult (topicName, url, cb, cancelled) {
    let interval = setInterval(
      () => {
        nets({
          uri: url,
          json: true,
          method: 'GET',
          withCredentials: false,
          rejectUnauthorized: false
        },
        function (err, res, body) {
          if (err) return cb(err)

          if (cancelled()) {
            clearInterval(interval)
            return cb(new Error('Request Cancelled'))
          }

          // parse response into raw account
          const data = body.message
          try {
            if (data.error) {
              clearInterval(interval)
              return cb(data.error)
            }
          } catch (err) {
            console.error(err.stack)
            clearInterval(interval)
            return cb(err)
          }
          // Check for param, stop polling and callback if present
          if (data && data[topicName]) {
            clearInterval(interval)
            clearTopic(url)
            return cb(null, data[topicName])
          }
        })
      }, pollingInterval)
  }

  /**
   *  Clear a topic on the messaging server, typically used to remove data after a response is received
   *
   *  @param    {String}     url           url endpoint which to clear topic
   */
  function clearTopic (url) {
    nets({
      uri: url,
      method: 'DELETE',
      withCredentials: false,
      rejectUnauthorized: false
    }, function (err) { if (err) { throw err } /* Errors without this cb */ })
  }

  /**
   *  Creates a topic and random url endpoint on the messaging server. Passes this
   *  url in requests to the mobile app. Starts polling for a response from the
   *  mobile app at that url. Returns a promise which resolves a response or rejects
   *  an error (or timeout).
   *
   *  @param    {String}     topicName     the topic you are waiting for a response
   *  @return   {Promise<Object, Error>}   a promise which resolves with a response or rejects with an error.
   */
  function newTopic (topicName) {
    let isCancelled = false

    let url
    if (isOnMobile) {
      const md = new MobileDetect(navigator.userAgent)
      if( md.userAgent() === 'Chrome' && md.os() === 'iOS' ) {
        url = 'googlechrome:' + window.location.href.substring(window.location.protocol.length)
      } else {
        url = window.location.href
      }
    } else {
      url = chasquiUrl + randomString(16)
    }
    const topic = new Promise((resolve, reject) => {
      const cb = (error, response) => {
        if (error) return reject(error)
        resolve(response)
      }
      if (isOnMobile) {
        waitForHashChange(topicName, cb)
      } else {
        pollForResult(topicName, url, cb, () => isCancelled)
      }
    })
    topic.url = url
    topic.cancel = () => { isCancelled = true }
    return topic
  }

  return newTopic
}

export default TopicFactory
