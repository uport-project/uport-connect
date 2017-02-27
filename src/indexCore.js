const notSupported = (obj) => () => {
  throw new Error(`${obj} not suported in uport-connect core, use full uport-connect library or ConnectCore object`)
}

class Connect { constructor () { notSupported('Connect object') }}
const QRUtil = { getQRDataURI: notSupported('getQRDataURI'), closeQr: notSupported('closeQr'), openQr: notSupported('openQr')}
import ConnectCore from './ConnectCore'
import { SimpleSigner, Credentials } from 'uport'
export { Connect, ConnectCore, QRUtil, SimpleSigner, Credentials }
