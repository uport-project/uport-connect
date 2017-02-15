import qrImage from 'qr-image'

// TODO docs on how to use as image
const getQRDataURI = (data) => {
  let pngBuffer = qrImage.imageSync(data, {type: 'png'})
  return 'data:image/png;charset=utf-8;base64, ' + pngBuffer.toString('base64')
}

const openQr = (data, cancel) => {
  let wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'uport-wrapper')
  wrapper.innerHTML = uportQRDisplay({qrImageUri: getQRDataURI(data), cancel})
  const cancelClick =  (event) => { document.getElementById('uport-qr-text').innerHTML = 'Cancelling'; cancel() }
  document.body.appendChild(wrapper)
  document.getElementById('uport-qr-cancel').addEventListener('click', cancelClick)
}

const closeQr = () => {
  const uportWrapper = document.getElementById('uport-wrapper')
  document.body.removeChild(uportWrapper)
}

const uportQRDisplay = ({qrImageUri}) => `
  <div id="uport-qr" style="position:fixed;top: 0;width:100%;height:100%;z-index:100;background-color:rgba(0,0,0,0.5);text-align:center;">
    <div style="position:relative;top:50%;display:inline-block;z-index:101;background:#fff;transform:translateY(-50%);margin:0 auto;padding:20px">
      <img style="z-index:102;" src="${qrImageUri}"/>
      <p id="uport-qr-text"> Please scan with uPort app </p>
      <button id="uport-qr-cancel"> Cancel </button>
    </div>
  </div>
`

export {
  closeQr,
  openQr,
  getQRDataURI,
  uportQRDisplay
}
