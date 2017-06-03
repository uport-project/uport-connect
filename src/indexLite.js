const notSupported = (obj) => () => {
  throw new Error(`${obj} not suported in uport-connect lite, use full uport-connect library or ConnectCore object`)
}

class Connect { constructor () { notSupported('Connect object') }}
const QRUtil = { getQRDataURI: notSupported('getQRDataURI'), closeQr: notSupported('closeQr'), openQr: notSupported('openQr')}
class SimpleSigner { constructor(){ notSupported('SimpleSigner object') }}
class Credentials { constructor(){ notSupported('Credentials object') }}
class ConnectCore { constructor () { notSupported('ConnectCore object') }}
import ConnectLite from './ConnectLite'
export { Connect, ConnectCore, ConnectLite, QRUtil, SimpleSigner, Credentials }
