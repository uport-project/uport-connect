import Connect from './Connect'
import ConnectCore from './ConnectCore'
import { getQRDataURI, closeQr, openQr } from './util/qrdisplay'
const QRUtil = { getQRDataURI, closeQr, openQr }
import { SimpleSigner, Credentials } from 'uport'
export { Connect, ConnectCore, QRUtil, SimpleSigner, Credentials }

const injectWeb3 = () => {
  // possibly pass some args in
  const connect = new Connect('MyDapp')
  window.web3 = connect.getWeb3()
}

window.addEventListener('load', () => {
  const activateButton = document.getElementById('uport-activate')

  const buttonStyle = "background-color: #1da1f2;border: 1px solid #1da1f2;color: #fff;-webkit-appearance: none;border-radius: 4px;cursor: pointer;display: inline-block;font: inherit;margin: 0;padding: 6px 13px;"
  activateButton.setAttribute('style', buttonStyle)

  // maybe store already set web3 to de activate uport
  activateButton.addEventListener('click', injectWeb3)
})
