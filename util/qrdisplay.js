var qr = require('qr-js');

//var test = qr.canvas('asdf');

module.exports = QRDisplay;

function QRDisplay() {
}

QRDisplay.prototype.openQr = function(data) {
  console.log("QR with data: " + data);
}

QRDisplay.prototype.closeQr = function() {
  console.log("Closing QR-code");
}
