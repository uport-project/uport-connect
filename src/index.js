import Connect from './Connect'
import ConnectCore from './ConnectCore'
import { getQRDataURI, closeQr, openQr } from './util/qrdisplay'
const QRUtil = { getQRDataURI, closeQr, openQr }
import { SimpleSigner, Credentials } from 'uport'
export { Connect, ConnectCore, QRUtil, SimpleSigner, Credentials }
