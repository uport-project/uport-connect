import nets from 'nets'
import qs from 'qs'
import randomString from './util/randomString'
const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'

// TODO may want return function named still for readability.
const TopicFactory = (isOnMobile, pollingInterval = 2000, chasquiUrl = CHASQUI_URL) => (topicName) => {

    const url = isOnMobile ? window.location.href : chasquiUrl + randomString(16)

    return (() => {
      let stopBool = false

      const clearTopic = (url) => {
        nets({
          uri: url,
          method: 'DELETE',
          rejectUnauthorized: false
        }, (err) => { if (err) { throw err } /* Errors withouth this cb */ })
      }

      const waitForHashChange = (topicName, cb) => {
        window.onhashchange = () => {
          if (window.location.hash) {
            const params = qs.parse(window.location.hash.slice(1))
            if (params[topicName]) {
              window.onhashchange = () => {}
              window.location.hash = ''
              cb(null, params[topicName])
            } else if (params.error) {
              window.onhashchange = () => {}
              window.location.hash = ''
              cb(params.error)
            }
          }
        }
      }

      const pollForResult = (topicName, url, cb) => {
        let interval = setInterval(

          () => {
            nets({
              uri: url,
              method: 'GET',
              rejectUnauthorized: false
            },

           (err, res, body) => {
              if (err) return cb(err)
              // TODO what is good error message
              if (stopBool) return cb(new Error('Request Cancelled'))
              // parse response into raw account
              let data

              try {
                data = JSON.parse(body).message
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

      return {
        stop: () => {
          stopBool = true
        },
        url: url,
        stopBool: stopBool,
        listen:  () => (
          new Promise((resolve, reject) => {
            const cb = (error, response) => {
              if (error) return reject(error)
              resolve(response)
            }
            if (isOnMobile) {
              waitForHashChange(topicName, cb)
            } else {
              pollForResult(topicName, url, cb)
            }
          })
        )
      }
    })()
  }



export default TopicFactory
