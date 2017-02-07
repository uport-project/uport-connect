import Connect from './Connect'
import { getQRDataURI, closeQr, openQr } from './util/qrdisplay'
const QRUtil = { getQRDataURI, closeQr, openQr }
import { SimpleSigner, Credentials } from 'uport'
export { Connect, QRUtil, SimpleSigner, Credentials }
