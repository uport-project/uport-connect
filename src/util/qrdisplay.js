import qrImage from 'qr-image'

// TODO docs on how to use as image
const getQRDataURI = (data) => {
  let pngBuffer = qrImage.imageSync(data, {type: 'png'})
  return 'data:image/png;charset=utf-8;base64, ' + pngBuffer.toString('base64')
}

const openQr = (data, cancel) => {
    let uportQR = getUportQRDisplay()
    uportQR.style.display = 'block'

    let dataUri = getQRDataURI(data)
    let qrImg = uportQR.children[0].children[0]
    let cancelButton = uportQR.children[0].children[2]
    cancelButton.addEventListener('click', (event) => { cancel() })
    qrImg.setAttribute('src', dataUri)
  }

const closeQr = () => {
    let uportQR = getUportQRDisplay()
    uportQR.style.display = 'none'
    resetQRCancellation()
  }

const resetQRCancellation = () => {
    document.getElementById('uport-qr-text').innerHTML = 'Please scan with uport app'
  }

const getUportQRDisplay = () => {
    let bg = document.getElementById('uport-qr')
    if (bg) return bg

    bg = document.createElement('div')
    bg.setAttribute('id', 'uport-qr')
    bg.setAttribute('style', 'position:fixed;top: 0;width:100%;height:100%;z-index:100;background-color:rgba(0,0,0,0.5);text-align:center;')

    let box = document.createElement('div')
    box.setAttribute('style', 'position:relative;top:50%;display:inline-block;z-index:101;background:#fff;transform:translateY(-50%);margin:0 auto;padding:20px')

    let text = document.createElement('p')
    text.innerHTML = 'Please scan with uport app'
    text.id = 'uport-qr-text'

    let cancelButton = document.createElement('button')
    cancelButton.innerHTML = 'Cancel'
    cancelButton.addEventListener('click', function(event) {
      document.getElementById('uport-qr-text').innerHTML = 'Cancelling';
    });

    let qrImg = document.createElement('img')
    qrImg.setAttribute('style', 'z-index:102;')

    box.appendChild(qrImg)
    box.appendChild(text)
    box.appendChild(cancelButton)
    bg.appendChild(box)
    document.body.appendChild(bg)

    // let test = document.getElementById('uport-qr-text')
    // test.innerHTML = 'testing...'

    return bg
  }

export {
  getUportQRDisplay,
  resetQRCancellation,
  closeQr,
  openQr,
  getQRDataURI
}
