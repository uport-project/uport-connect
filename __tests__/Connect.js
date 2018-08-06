import { Connect } from "../src/index";
import { Credentials } from "uport";
import { openQr, closeQr } from "../src/util/qrdisplay";

describe("Connect", () => {
  describe("config", () => {
    it("defaults", () => {
      const uport = new Connect("test app");
      expect(uport.appName).toEqual("test app");
      expect(uport.infuraApiKey).toEqual("test-app");
      expect(uport.uriHandler.name).toEqual("openQr");
      expect(uport.network.id).toEqual("0x4");
      expect(uport.closeUriHandler.name).toEqual("closeQr");
      expect(uport.credentials).toBeInstanceOf(Credentials);
      expect(uport.canSign).toBeFalsy();
      expect(uport.getWeb3).toBeDefined();
    });

    it("does not have a closeUriHandler if not using built in openQr", () => {
      const noop = uri => null;
      const uport = new Connect("test", { uriHandler: noop });
      expect(uport.uriHandler).toEqual(noop);
      expect(uport.closeUriHandler).toBeUndefined();
    });
  });
});
