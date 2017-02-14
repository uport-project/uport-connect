class Connect {
  constructor(){
    throw new Error('Connect object not suported in uport-connect core, use full uport-connect library or ConnectCore object')
  }
}

import ConnectCore from './ConnectCore'
import { getQRDataURI, closeQr, openQr } from './util/qrdisplay'
const QRUtil = { getQRDataURI, closeQr, openQr }
import { SimpleSigner, Credentials } from 'uport'
export { Connect, ConnectCore, QRUtil, SimpleSigner, Credentials }
