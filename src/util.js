import MobileDetect from 'mobile-detect'

/**
 *  Detects if this library is called on a mobile device or tablet.
 *
 *  @return   {Boolean} Returns true if on mobile or tablet, false otherwise.
 *  @private
 */
export const isMobile = () => {
  if (typeof navigator !== 'undefined') {
    return !!(new MobileDetect(navigator.userAgent).mobile())
  } else return false
}

/**
 * Detect whether the current window has an injected web3 instance
 * @private
 */
export function hasWeb3() {
  return (typeof web3 !== 'undefined')
}

/**
 * Post a json document to ipfs
 * @private
 */
export function ipfsAdd(jwt) {
  return new Promise((resolve, reject) => {
    // Create new FormData to hold stringified JSON
    const payload = new FormData()
    payload.append("file", new Blob([jwt]))
    const req = new XMLHttpRequest()
    // Resolve to hash on success
    req.onreadystatechange = () => {
      if (req.readyState !== 4) return
      if (req.status != 200) reject(`Error ${req.status}: ${req.responseText}`)
      else resolve(JSON.parse(req.responseText).Hash)
    }
    // Send request
    req.open('POST', 'https://ipfs.infura.io:5001/api/v0/add')
    req.setRequestHeader('accept','application/json')
    req.enctype = 'multipart/form-data'
    req.send(payload)
  })
}
