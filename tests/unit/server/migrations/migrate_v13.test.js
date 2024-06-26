import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

require("../../../../imports/helpers/date");

const FIRST_MIN_ID = "#Min01";
const SND_MIN_ID = "#Min02";

const MinutesSchema = { update: sinon.stub() };
MinutesSchema.getCollection = (_) => MinutesSchema;

const MeetingSeriesSchema = { update: sinon.stub() };
MeetingSeriesSchema.getCollection = (_) => MeetingSeriesSchema;

const MinutesFinder = {
  result: undefined,
  firstMinutesOfMeetingSeries() {
    return this.result;
  },
};

const { MigrateV13 } = proxyquire("../../../../server/migrations/migrate_v13", {
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/services/minutesFinder": { MinutesFinder, "@noCallThru": true },
});

describe("Migrate Version 13", () => {
  let firstFakeMinute, sndFakeMinute, fakeMeetingSeries;

  beforeEach(() => {
    sndFakeMinute = {
      _id: SND_MIN_ID,
      topics: [{ _id: "#T01" }, { _id: "#T02" }],
      nextMinutes: () => {
        return false;
      },
    };

    firstFakeMinute = {
      _id: FIRST_MIN_ID,
      topics: [{ _id: "#T01" }],
      nextMinutes: () => {
        return sndFakeMinute;
      },
    };

    fakeMeetingSeries = {
      _id: "#MS01",
      topics: [{ _id: "#T01" }, { _id: "#T02" }],
      openTopics: [{ _id: "#T02" }, { _id: "#T01" }],
    };

    MinutesFinder.result = firstFakeMinute;

    MeetingSeriesSchema.find = () => {
      return [fakeMeetingSeries];
    };

    MinutesSchema.find = () => {
      return [firstFakeMinute, sndFakeMinute];
    };
  });

  afterEach(() => {
    MinutesSchema.update.resetHistory();
    MeetingSeriesSchema.update.resetHistory();
  });

  describe("#up", () => {
    const checkTopicHasProperty = (topic) => {
      expect(topic).to.have.ownProperty("isSkipped");
      expect(topic.isSkipped).to.be.false;
    };

    it("sets the isSkipped attribute for all topics in all minutes", () => {
      MigrateV13.up();
      firstFakeMinute.topics.forEach(checkTopicHasProperty);
      sndFakeMinute.topics.forEach(checkTopicHasProperty);
    });

    it("sets the isSkipped attribute for all topics in the meeting series", () => {
      MigrateV13.up();
      fakeMeetingSeries.topics.forEach(checkTopicHasProperty);
      fakeMeetingSeries.openTopics.forEach(checkTopicHasProperty);
    });
  });

  describe("#down", () => {
    beforeEach(() => {
      const addCreatedInMinuteFakeAttribute = (topic) => {
        topic.createdInMinute = "fakeID";
      };
      firstFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
      sndFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
      fakeMeetingSeries.topics.forEach(addCreatedInMinuteFakeAttribute);
      fakeMeetingSeries.openTopics.forEach(addCreatedInMinuteFakeAttribute);
    });

    it("removes the isSkipped-attribute", () => {
      MigrateV13.down();

      const checkTopicHasNoAttribute = (topic) => {
        expect(topic).not.have.ownProperty("isSkipped");
      };

      firstFakeMinute.topics.forEach(checkTopicHasNoAttribute);
      sndFakeMinute.topics.forEach(checkTopicHasNoAttribute);
      fakeMeetingSeries.topics.forEach(checkTopicHasNoAttribute);
      fakeMeetingSeries.openTopics.forEach(checkTopicHasNoAttribute);
    });
  });
});
