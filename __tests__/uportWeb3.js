import { expect } from "chai";
import Web3 from "web3";
import { Connect } from "../src/index";
import Autosigner from "../utils/autosigner";
import testData from "./testData.json";

const addr1 = "0x9d00733ae37f34cdebe443e5cda8e9721fffa092";

function mockCredentials(receive) {
  return {
    settings: {},
    receive
  };
}
describe("uportWeb3 integration tests", function() {
  jest.setTimeout(30000);

  let autosigner, status, vanillaWeb3, web3;
  const coolStatus = "Writing some tests!";

  beforeAll(done => {
    // const testrpcProv = ganache.provider()
    const testrpcProv = new Web3.providers.HttpProvider(
      "http://localhost:8545"
    );
    vanillaWeb3 = new Web3(testrpcProv);
    // Create Autosigner
    Autosigner.load(testrpcProv, (err, as) => {
      if (err) {
        console.log("error loading autosigner");
        console.log(err);
        return done();
      }
      autosigner = as;
      vanillaWeb3.eth.getAccounts((err1, accounts) => {
        if (err1) {
          console.log("Error getting accounts");
          console.log(err1);
          return done();
        }
        // Create status contract
        const statusContractABI = vanillaWeb3.eth.contract(
          testData.statusContractAbiData
        );

        statusContractABI.new(
          {
            data: testData.statusContractBin,
            from: accounts[0],
            gas: 3000000
          },
          (err2, contract) => {
            if (err2) {
              console.log("Error creating status contract");
              console.log(err2);
              return done();
            }
            console.log("contract!");

            console.log(contract.address);
            if (!contract.address) {
              console.log("no status contract address");
              return;
            }
            // console.log(contract)

            // Send ether to Autosigner
            vanillaWeb3.eth.sendTransaction(
              {
                from: accounts[3],
                to: autosigner.address,
                value: vanillaWeb3.toWei(8)
              },
              (err3, r) => {
                if (err3) {
                  console.log("could not send eth to the autosigner");
                  console.log(err3);
                  return done();
                }
                // Change provider
                // Autosigner is a qrDisplay
                // that automatically signs transactions
                const uport = new Connect("Integration Tests", {
                  credentials: mockCredentials(() => ({
                    address: autosigner.address
                  })),
                  provider: testrpcProv,
                  uriHandler: autosigner.openQr.bind(autosigner)
                });
                web3 = uport.getWeb3();
                status = web3.eth
                  .contract(testData.statusContractAbiData)
                  .at(contract.address);
                done();
              }
            );
          }
        );
      });
    });
  });

  it("getCoinbase", done => {
    web3.eth.getCoinbase((err, address) => {
      expect(err).to.be.null;
      expect(address).to.equal(autosigner.address);
      done();
    });
  });

  it("getAccounts", done => {
    web3.eth.getAccounts((err, addressList) => {
      expect(err).to.be.null;
      expect(addressList).to.deep.equal([autosigner.address]);
      done();
    });
  });

  it("sendTransaction", done => {
    web3.eth.sendTransaction(
      { value: web3.toWei(2), to: addr1, from: autosigner.address },
      (err, txHash) => {
        expect(err).to.be.null;
        expect(txHash).to.be;
        web3.eth.getBalance(addr1, (err, balance) => {
          expect(err).to.be.null;
          expect(balance.toString()).to.equal(web3.toWei(2));
          done();
        });
      }
    );
  });

  it("use contract", done => {
    status.updateStatus(coolStatus, (err, res) => {
      expect(err).to.be.null;
      if (err) {
        throw new Error(
          `Expected updateStatus to not return error: ${err.message}`
        );
      }
      expect(res).to.be;
      web3.eth.getTransactionReceipt(res, (err, tx) => {
        expect(tx.blockNumber).to.be;
        status.getStatus.call(autosigner.address, (err, myStatus) => {
          expect(err).to.be.null;
          expect(myStatus).to.be.equal(coolStatus);
          done();
        });
      });
    });
  });

  it("handles batches", done => {
    var batch = web3.createBatch();
    batch.add(
      web3.eth.getBalance.request(
        autosigner.address,
        "latest",
        (error, balance) => {
          expect(error).to.be.null;
          expect(balance).to.be.greaterThan(0);
        }
      )
    );
    batch.add(
      web3.eth.getBalance.request(
        autosigner.address,
        "latest",
        (error, balance) => {
          expect(error).to.be.null;
          expect(balance).to.be.greaterThan(0);
        }
      )
    );
    batch.add(
      status.getStatus.request(autosigner.address, (error, myStatus) => {
        expect(error).to.be.null;
        expect(myStatus).to.be.equal(coolStatus);
      })
    );
    batch.execute();
    setTimeout(done, 1000);
  });

  it("does not handle sync calls", done => {
    expect(() => web3.eth.getBalance(autosigner.address)).to.throw(
      "Uport Web3 SubProvider does not support synchronous requests."
    );
    done();
  });
});
