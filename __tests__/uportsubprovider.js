import { assert, expect } from "chai";
import UportSubprovider from "../src/uportSubprovider.js";
import ganache from "ganache-cli";
import { isMNID, encode, decode } from "mnid";

const MSG_DATA =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL0lySGVsNTA0MmlwWlk3Q04iLCJ0eXBlIjoic2hhcmVSZXNwIiwiaXNzIjoiMHg4MTkzMjBjZTJmNzI3NjgwNTRhYzAxMjQ4NzM0YzdkNGY5OTI5ZjZjIiwiaWF0IjoxNDgyNDI2MjEzMTk0LCJleHAiOjE0ODI1MTI2MTMxOTR9.WDVC7Rl9lyeGzoNyxbJ7SRAyTIqLKu2bmYvO5I0DmEs5XWVGKsn16B9o6Zp0O5huX7StRRY3ujDoI1ofFoRf2A";
const UPORT_ID = "0x819320ce2f72768054ac01248734c7d4f9929f6c";

const rinkebyMNID = "2ocuXMaz4pJPtzkbqeaAeJUvGRdVGm2MJth";
const mainMNID = "2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX";
const mindDecoded = "0x00521965e7bd230323c423d96c657db5b79d099f";

const mockFetchAddress = () => {
  return new Promise((resolve, reject) => {
    resolve(UPORT_ID);
  });
};

const mockFetchMNID = mnid => () => {
  return new Promise((resolve, reject) => {
    resolve(mnid);
  });
};

const failingFetchAddress = () => {
  return new Promise((resolve, reject) => {
    reject(Error("Polling error"));
  });
};

const dontConnect = () => {
  assert.fail();
};

const mockSendTransaction = txparams => {
  return new Promise((resolve, reject) => {
    resolve(MSG_DATA);
  });
};

const failingSendTransaction = txparams => {
  return new Promise((resolve, reject) => {
    reject(Error("Polling error"));
  });
};

describe("UportSubprovider", () => {
  describe("getAddress", () => {
    //TODO
    it("Use connect to get address first time", done => {
      const subprovider = new UportSubprovider({
        requestAddress: mockFetchAddress,
        newtorkId: "0x4"
      });
      subprovider.getAddress((err, address) => {
        assert.isNull(err);
        assert.equal(address, UPORT_ID);
        // assert.equal(subprovider.address, UPORT_ID)
        done();
      });
    });

    it("Should throw an error if given an MNID from a network it is not configured for", done => {
      const subprovider = new UportSubprovider({
        requestAddress: mockFetchMNID(mainMNID),
        networkId: "0x4"
      });
      subprovider.getAddress((err, address) => {
        expect(err).to.match(/does not match the network/);
        done();
      });
    });

    it("Should handle MNIDs and decode them to hex", done => {
      const subprovider = new UportSubprovider({
        requestAddress: mockFetchMNID(rinkebyMNID),
        networkId: "0x4"
      });
      subprovider.getAddress((err, address) => {
        assert.isNull(err);
        assert.equal(subprovider.address, mindDecoded);
        done();
      });
    });

    it("Should return address directly if present", done => {
      const subprovider = new UportSubprovider({ requestAddress: dontConnect });
      subprovider.address = UPORT_ID;
      subprovider.getAddress((err, address) => {
        assert.isNull(err);
        assert.equal(address, UPORT_ID);
        done();
      });
    });

    it("Error should propagate from requestAddress", done => {
      const subprovider = new UportSubprovider({
        requestAddress: failingFetchAddress
      });
      subprovider.getAddress((err, address) => {
        assert.isUndefined(address);
        assert.equal(err.message, "Polling error");
        done();
      });
    });
  });

  describe("sendTransaction", () => {
    it("Use uport.sendTransaction to send successfull transaction", done => {
      const subprovider = new UportSubprovider({
        sendTransaction: mockSendTransaction
      });
      subprovider.sendTransaction({}, (err, txHash) => {
        assert.isNull(err);
        assert.equal(txHash, MSG_DATA);
        done();
      });
    });

    it("Error should propagate from uport.sendTransaction", done => {
      const subprovider = new UportSubprovider({
        sendTransaction: failingSendTransaction
      });
      subprovider.sendTransaction({}, (err, txHash) => {
        assert.isUndefined(txHash);
        assert.equal(err.message, "Polling error");
        done();
      });
    });
  });

  describe("sendAsync", () => {
    const subprovider = new UportSubprovider({
      requestAddress: mockFetchAddress,
      sendTransaction: mockSendTransaction,
      provider: { sendAsync: (payload, callback) => callback(null, payload) }
    });

    it("Should pass on request not handled", done => {
      const request = { method: "eth_sendRawTransaction" };
      subprovider.sendAsync(request, (err, payload) => {
        expect(err).to.be.null;
        expect(payload).to.eq(request);
        done();
      });
    });

    it("eth_coinbase should return address", done => {
      const request = { method: "eth_coinbase" };
      subprovider.sendAsync(request, (err, { result }) => {
        expect(err).to.be.null;
        expect(result).to.equal(UPORT_ID);
        done();
      });
    });

    it("eth_accounts should return list with one address", done => {
      const request = {
        method: "eth_accounts"
      };
      subprovider.sendAsync(request, (err, { result }) => {
        expect(err).to.be.null;
        expect(result).to.deep.equal([UPORT_ID]);
        done();
      });
    });

    it("eth_sendTransaction should return txHash", done => {
      const request = {
        method: "eth_sendTransaction",
        params: [
          {
            to: "0x032f23",
            value: "0x03fad4c3"
          }
        ]
      };
      subprovider.sendAsync(request, (err, { result }) => {
        expect(err).to.be.null;
        expect(result).to.equal(MSG_DATA);
        done();
      });
    });
  });
});
