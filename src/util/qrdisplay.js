import qrImage from 'qr-image'
import SVG from './assets.js'

/**  @module uport-connect/util/qrdisplay
 *  @description
 *  A set of QR utility functions and default displays to use with Connect.
 */

/**
 *  Given a string of data it returns a image URI which is a QR code. An image
 *  URI can be displayed in a img html tag by setting the src attrbiute to the
 *  the image URI.
 *
 *  @param    {String}     data      data string, typically a uPort URI
 *  @return   {String}               image URI
 */
const getQRDataURI = (data) => {
  let pngBuffer = qrImage.imageSync(data, {type: 'png'})
  return 'data:image/png;charset=utf-8;base64, ' + pngBuffer.toString('base64')
}

/**
 *  A default QR pop over display, which injects the neccessary html
 *
 *  @param    {String}     data      data which is displayed in QR code
 *  @param    {Function}   cancel    a function called when the cancel button is clicked
 */
const openQr = (data, cancel, appName, introModal) => {
  // in the future can change call of action based on type of request
  let wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'uport-wrapper')

  wrapper.innerHTML = introModal ? introModalDisplay(appName) : uportQRDisplay({qrImageUri: getQRDataURI(data), cancel})

  const cancelClick = (event) => { document.getElementById('uport-qr-text').innerHTML = 'Cancelling'; cancel() }
  const uportTransition = (event) => {
    wrapper.innerHTML = uportQRDisplay({qrImageUri: getQRDataURI(data), cancel})
    document.getElementById('uport-qr-cancel').addEventListener('click', cancelClick)
  }

  document.body.appendChild(wrapper)
  document.getElementById('uport-qr-cancel').addEventListener('click', cancelClick)
  document.getElementById('uport-continue-btn').addEventListener('click', uportTransition )
}

/**
 *  Closes the default QR pop over
 */
const closeQr = () => {
  const uportWrapper = document.getElementById('uport-wrapper')
  document.body.removeChild(uportWrapper)
}

/**
 *  A html pop over QR display template
 *
 *  @param    {Object}     args
 *  @param    {String}     args.qrImageUri    a image URI for the QR code
 *  @return   {String}                        a string of html
 */
const uportQRDisplay = ({qrImageUri}) => uportModal(`
  <div style="padding: 15px 45px 35px 45px;">
    <div style="background-color: #000; width: 60px; height: 60px; margin: 10px auto 25px auto;"> </div>
    <p></p>
    <p id="uport-qr-text" style="color: #7C828B; font-family: Avenir; font-size: 18px; text-align: center; margin-top: 10px;"> Scan QR code with uPort Mobile App </p>
    <img style="z-index:102;" src="${qrImageUri}"/>
  </div>`)

const introModalDisplay = (appName) => {
    let content = `
      <div style="padding: 40px 70px 40px 70px;"> `
      if (appName)  {
        content +=  `<p id="uport-qr-text" style="margin-bottom: 30px; font-size: 18px; color: #7C828B; font-family: Avenir;"> Login Into <span style="font-weight: 700;"> ${appName} </span> </p>`
      }
      content +=  `
        <div id="uport-continue-btn" style="${buttonStyleBlue}"> Continue with uPort </div>
      </div>
      <div style="background-color: #F6F7F8;; padding: 16px; min-height: 110px;">
        <p style="font-size: 14px; color: #7C828B; font-family: Avenir;"> New uPort User? </p>
        <div class="app-store-container" style="padding: 0px 42px;">
          <div style="background-color: #000; width: 128px; height: 40px; margin-right: 20px; float:left;"> </div>
          <div style="background-color: #000; width: 128px; height: 40px; float: left"> </div>
        </div>
      </div>`

    return uportModal(content)
}

// An empty modal
const uportModal = (innerHTML) => `
  <div id="uport-qr" style="position:fixed;top: 0;width:100%;height:100%;z-index:100;background-color:rgba(0,0,0,0.5);text-align:center;">
    <div style="position:relative;top:50%;display:inline-block;z-index:101;background:#fff;transform:translateY(-50%);margin:0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 12px 24px 0 rgba(0,0,0,0.1);">
      <div style="width: 100%; height: 45px;">
        <div id="uport-qr-cancel" style="float: right; background-color: #000; height: 25px; width: 25px; margin: 15px; cursor: pointer;"> </div>
      </div>
      ${innerHTML}
    </div>
  </div>`

// TODO space for logo in here already
const buttonStyleBlue = `text-align: center;padding: 17px 25px 17px 68px;border-radius: 6px;color: #fff;margin: 10px;font-family: arial, sans-serif;font-weight: 500;letter-spacing: 0.8px;border-color: #4f45af;text-shadow: none;background-color: #5C50CA;background-image:  url(${SVG.logo});background-position: left 18px bottom 11px;background-repeat: no-repeat;border: 1px solid #ccc;cursor: pointer;display: inline-block;position: relative;white-space: nowrap;box-sizing: border-box;font-size: 16px;text-decoration: noneuser-select: none;transition: border-color 0.1s linear,background 0.1s linear,color 0.1s linear;-o-transition: border-color 0.1s linear,background 0.1s linear,color 0.1s linear;-ms-transition: border-color 0.1s linear,background 0.1s linear,color 0.1s linear;`

export {
  closeQr,
  openQr,
  getQRDataURI,
  uportQRDisplay
}
