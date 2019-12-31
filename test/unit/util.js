import { expect } from 'chai'
import sinon from 'sinon'
import { ipfsAdd } from '../../src/util'

const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MzI0NTkyNzIsImV4cCI6MTUzMjU0NTY3MiwiYXVkIjoiMm9lWHVmS' +
  'EdEcFU1MWJmS0JzWkRkdTdKZTl3ZUozcjdzVkciLCJ0eXBlIjoic2hhcmVSZXNwIiwibmFkIjoiMm91c1hUalBFRnJrZjl3NjY3YXR5R3hQY3h1R0Q' +
  'oQoAz0fETmZB7Egezs_2YPkIsbjOeXo6st3ezZeXpc7nZOW-A'

describe('util', () => {
  const xhr = sinon.useFakeXMLHttpRequest()
  let requests = []
  xhr.onCreate = xhr => {
    requests.push(xhr)
  }

  beforeEach(() => {
    requests = []
  })

  describe('ipfsAdd', () => {
    it('rejects with an error if the request fails', done => {
      ipfsAdd(jwt).catch(err => {
        expect(err).to.not.be.null
        done()
      })

      requests[0].error()
    })

    it('resolves with the IPFS hash if the request succeeds', done => {
      ipfsAdd(jwt).then(res => {
        expect(res).to.be.equal('12345')
        done()
      })

      requests[0].respond(
        200,
        {"Content-Type": "text/json"},
        "{\"Hash\": \"12345\"}"
      )
    })
  })
})