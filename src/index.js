import Connect from './Connect'
import ConnectCore from './ConnectCore'
import ConnectLite from './ConnectLite'
import { getQRDataURI, closeQr, openQr } from './util/qrdisplay'
const QRUtil = { getQRDataURI, closeQr, openQr }
import { SimpleSigner, Credentials } from 'uport'
export { Connect, ConnectCore, ConnectLite, QRUtil, SimpleSigner, Credentials }
