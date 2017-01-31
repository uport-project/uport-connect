import { Uport } from './uport'
import { QRUtil } from './util/qrdisplay'


class UportQRDisplay extends Uport {
  constructor(dappName, opts = {}) {
    super(dappName, opts)
    this.openQR = QRUtil.openQr
    this.closeQR = QRUtil.closeQr
  }

  request({uri, topic}) {
    // TODO need self reference
    console.log(this)
    this.openQR(uri)
    return new Promise((resolve, reject) => {
      this.msgServer.waitForResult(topic, (err, res) => {
        this.closeQR()
        if (err) reject(err)
        resolve(res)
      })
    })
  }
}

export { UportQRDisplay }
