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

  wrapper.innerHTML = 
    introModal 
      ? introModalDisplay(appName)
      : uportQRDisplay({qrImageUri: getQRDataURI(data), cancel})

  const cancelClick = (event) => { 
    document.getElementById('uport-qr-text').innerHTML = 'Cancelling'; cancel() 
  }
  
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

const introModalDisplay = (appName) => {
  let content = `
    <div style="${uportModalIntroWrapper}">`
      if (appName)  {
        content +=  `
          <div>
            <p id="uport-qr-text" style="${uportQRTextWithAppName}">
              <span>Login Into</span>
              <span> </span>
              <span style="${uportAppName}">${appName}</span>
            </p>
          </div>`
      }
      content +=  `
        <div id="uport-continue-btn" style="${uportModalContinueBtn}"> 
          <span style="${uportModalLogo}">${SVG.logo}</span>
          <span>&nbsp;&nbsp;</span>
          <span>Continue with uPort</span>
        </div>

    </div>

    <div style="${uportModalNewUserFooterCSS}">
      <p style="${uportModalNewUserFooterTitleCSS}">New uPort User?</p>
      <div style="${uportModalNewUserFooterAppStoresCSS}">
        <div style="${uportModalNewUserFooterAppStoresAndroidCSS}">${SVG.androidApp}</div>
        <div style="${uportModalNewUserFooterAppStoresiOSCSS}">${SVG.appleApp}</div>
      </div>
    </div>
  `

  return uportModal(content)
}

/**
 *  A html pop over QR display template
 *
 *  @param    {Object}     args
 *  @param    {String}     args.qrImageUri    a image URI for the QR code
 *  @return   {String}                        a string of html
 */
const uportQRDisplay = ({qrImageUri}) => uportModal(`
  <div>
    <div style="${uportLogoWithBg}">${SVG.logowithBG}</div>
    <p id="uport-qr-text" style="${uportQRInstructions}">Scan QR code with uPort Mobile App</p>
    <img src="${qrImageUri}" style="${uportQRIMG}" />
  </div>
`)

// An empty modal
const uportModal = (innerHTML) => `
  <div id="uport-qr" style="${uportQRCSS}">
    <div style="${uportModalCSS}" class="animated fadeIn">
      <div style="${uportModalHeaderCSS}">
        <div id="uport-qr-cancel" style="${uportModalHeaderCloseCSS}">
          ${SVG.close}
        </div>
      </div>
      <div style="${uportModalConentCSS}">
        ${innerHTML}
      </div>
    </div>
    ${animateCSS}
  </div>
`
const animateCSS = `
<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animated {
    animation-duration: 1s;
    animation-fill-mode: both;
  }
  .fadeIn {
    animation-name: fadeIn;
  }
</style>
`

const uportQRCSS = `
  position:fixed;
  top: 0;
  width:100%;
  height:100%;
  z-index:100;
  background-color:rgba(0,0,0,0.5);
  text-align:center;
`

const uportModalCSS = `
  position:relative;
  top:50%;
  display:inline-block;
  z-index:101;
  background:#fff;
  transform:translateY(-50%);
  margin:0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 24px 0 rgba(0,0,0,0.1);
  min-width: 400px;
`

const uportModalHeaderCSS = `
  width: 100%;
  height: 45px;
`

const uportModalHeaderCloseCSS = `
  float: right;
  height: 25px;
  width: 25px;
  margin: 15px;
  cursor: pointer;
`

const uportModalConentCSS = `
`

const uportModalNewUserFooterCSS = `
  background-color: #F6F7F8;
  padding: 26px 0;
  min-height: 110px;
`
const uportModalNewUserFooterTitleCSS = `
  font-size: 14px;
  color: #7C828B;
  font-family: Avenir;
`

const uportModalNewUserFooterAppStoresCSS = `
  padding: 10px 42px;
`

const uportModalNewUserFooterAppStoresAndroidCSS = `
  width: 128px;
  height: 40px;
  margin-right: 20px;
  display: inline-block;
`

const uportModalNewUserFooterAppStoresiOSCSS = `
  width: 128px;
  height: 40px;
  display: inline-block;
`

const uportModalLogo = `
  display:inline-block;
  max-width: 50px;
  vertical-align: middle;
`

const uportAppName = `
  font-weight: 700;
`

const uportQRTextWithAppName = `
  font-size: 18px;
  color: #7C828B;
  font-family: Avenir;
`

const uportLogoWithBg = `
  width: 60px;
  height: 60px;
  margin: 0 auto 0 auto;
`

const uportQRInstructions = `
  color: #7C828B;
  font-family: Avenir;
  font-size: 18px;
  text-align: center;
  margin-top: 0;
`

const uportModalIntroWrapper = `
  text-align: center;
  display: inline-block;
  width: 100%;"
`

const uportQRIMG = `
  z-index:102;
  margin-bottom: 35px;
`

// TODO space for logo in here already
const uportModalContinueBtn = `
  text-align: center;
  padding: 17px 25px 17px 25px;
  border-radius: 6px;
  color: #fff;
  margin: 75px auto 80px 0;
  font-family: arial, sans-serif;
  font-weight: 500;
  letter-spacing: 0.8px;
  border-color: #4f45af;
  text-shadow: none;
  background-color: #5C50CA;
  background-position: left 18px bottom 11px;
  background-repeat: no-repeat;
  border: 1px solid #ccc;
  cursor: pointer;
  display: inline-block;
  position: relative;
  white-space: nowrap;
  box-sizing: border-box;
  font-size: 16px;
  text-decoration: noneuser-select: none;
  transition: border-color 0.1s linear,background 0.1s linear,color 0.1s linear;
  -o-transition: border-color 0.1s linear,background 0.1s linear,color 0.1s linear;
  -ms-transition: border-color 0.1s linear,background 0.1s linear,color 0.1s linear;
`

export {
  closeQr,
  openQr,
  getQRDataURI,
  uportQRDisplay
}
