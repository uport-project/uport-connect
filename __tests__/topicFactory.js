import { assert } from "chai";
import nets from "nets";
import TopicFactory from "../src/topicFactory.js";

let topicFactory;

describe("TopicFactory", function() {
  jest.setTimeout(10000);

  describe("On desktop", function() {
    beforeEach(function() {
      topicFactory = TopicFactory(false, 500);
    });

    it("Correctly polls for data", done => {
      let data = "0x123456789";
      const topic = topicFactory("access_token");
      topic
        .then(res => {
          assert.equal(res, data, "Should get correct data from server.");
          done();
        })
        .catch(err => {
          assert.equal(err, null, "Should not have error");
          done();
        });
      setTimeout(() => postData(topic.url, "access_token", data), 1000);
    });

    it("Gives error if polling yields error", done => {
      const data = "some weird error";
      const topic = topicFactory("tx");
      topic
        .then(res => {
          assert.equal(res, null, "Should not have data");
          done();
        })
        .catch(err => {
          assert.equal(err, data);
          done();
        });
      setTimeout(() => postData(topic.url, "error", data), 1000);
    });

    it("Has cleared topic", done => {
      const topic = topicFactory("access_token");
      topic.then(res => {
        setTimeout(
          () =>
            postData(topic.url, "access_token", "0x234", (e, r, b) => {
              assert.equal(b.data.id, "not found");
              done();
            }),
          500
        );
      });
      setTimeout(() => postData(topic.url, "access_token", "0x123"), 1000);
    });
  });

  describe("On Mobile", () => {
    beforeEach(function() {
      topicFactory = new TopicFactory(true);
    });

    it("Creates mobile chrome specific URI only when in Chrome on iOS", () => {
      navigator.__defineGetter__("userAgent", function() {
        return "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Chrome/61.0.3163.79 CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1";
      });
      const googleTopic = topicFactory("access_token");
      assert.equal(
        googleTopic.url,
        "googlechrome://localhost:9876/context.html",
        'Should set uri "protocol" to googleChrome'
      );

      navigator.__defineGetter__("userAgent", () => "foo");
      const topic = topicFactory("access_token");
      assert.equal(
        topic.url,
        "http://localhost:9876/context.html",
        'Should set uri "protocol" to http'
      );
    });

    it("Correctly waits for data", done => {
      let data = "0x123456789";
      const topic = topicFactory("access_token");
      topic.then(res => {
        assert.equal(res, data, "Should get correct data.");
        done();
      });
      global.window.location.hash = "#access_token=" + data;
      global.window.onhashchange();
    });

    it("Gives error if error posted", done => {
      let data = "some weird error";
      const topic = topicFactory("access_token");
      topic.catch(err => {
        assert.equal(err, data);
        done();
      });
      global.window.location.hash = "#error=" + data;
      global.window.onhashchange();
    });
  });
});

function postData(url, name, data, cb) {
  const body = {};
  body[name] = data;
  if (!cb) cb = () => {};
  nets(
    {
      url: url,
      method: "POST",
      json: body
    },
    cb
  );
}
