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
  firstMinutesResult: undefined,
  firstMinutesOfMeetingSeries() {
    return this.firstMinutesResult;
  },
  nextMinutesResult: {},
  nextMinutes(minutes) {
    return this.nextMinutesResult[minutes._id];
  },
  previousMinutesResult: {},
  previousMinutes(minutes) {
    return this.previousMinutesResult[minutes._id];
  },
};
class MeteorError {}
const Meteor = { Error: MeteorError };

const Random = {
  i: 1,
  id: function () {
    return this.i++;
  },
};

const { MigrateV12 } = proxyquire("../../../../server/migrations/migrate_v12", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "meteor/random": { Random, "@noCallThru": true },
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/services/minutesFinder": { MinutesFinder, "@noCallThru": true },
});

describe("Migrate Version 12", () => {
  let firstFakeMinute, sndFakeMinute, fakeMeetingSeries;

  beforeEach(() => {
    sndFakeMinute = {
      _id: SND_MIN_ID,
      topics: [
        {
          _id: "#T01",
          infoItems: [
            {
              _id: "#I01",
              details: [{ text: "d1" }, { text: "d22" }, { text: "d6" }],
            },
            { _id: "#I02", details: [{ text: "d3" }, { text: "d4" }] },
          ],
        },
        {
          _id: "#T02",
          infoItems: [
            { _id: "#I03", details: [{ text: "d5" }] },
            { _id: "#I04" },
          ],
        },
      ],
    };

    firstFakeMinute = {
      _id: FIRST_MIN_ID,
      topics: [
        {
          _id: "#T01",
          infoItems: [
            { _id: "#I01", details: [{ text: "d1" }, { text: "d22" }] },
            { _id: "#I02", details: [{ text: "d3" }, { text: "d4" }] },
          ],
        },
      ],
    };

    MinutesFinder.firstMinutesResult = firstFakeMinute;
    MinutesFinder.nextMinutesResult[SND_MIN_ID] = false;
    MinutesFinder.nextMinutesResult[FIRST_MIN_ID] = sndFakeMinute;
    MinutesFinder.previousMinutesResult[SND_MIN_ID] = firstFakeMinute;
    MinutesFinder.previousMinutesResult[FIRST_MIN_ID] = false;

    fakeMeetingSeries = {
      _id: "#MS01",
      topics: [
        {
          _id: "#T01",
          infoItems: [
            {
              _id: "#I01",
              details: [{ text: "d1" }, { text: "d22" }, { text: "d6" }],
            },
            { _id: "#I02", details: [{ text: "d3" }, { text: "d4" }] },
          ],
        },
        {
          _id: "#T02",
          infoItems: [
            { _id: "#I03", details: [{ text: "d5" }] },
            { _id: "#I04" },
          ],
        },
      ],
      openTopics: [
        {
          _id: "#T02",
          infoItems: [
            { _id: "#I03", details: [{ text: "d5" }] },
            { _id: "#I04" },
          ],
        },
        {
          _id: "#T01",
          infoItems: [
            {
              _id: "#I01",
              details: [{ text: "d1" }, { text: "d22" }, { text: "d6" }],
            },
            { _id: "#I02", details: [{ text: "d3" }, { text: "d4" }] },
          ],
        },
      ],
    };

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
    const checkDetailHasProperties = (detail) => {
      expect(detail).to.have.ownProperty("createdInMinute");
      expect(detail).to.have.ownProperty("_id");
    };

    it("sets the createdInMinutes and _id attribute for all topics in all minutes", () => {
      MigrateV12.up();
      firstFakeMinute.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasProperties);
          }
        });
      });
      sndFakeMinute.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasProperties);
          }
        });
      });
    });

    it("sets the createdInMinutes and _id attribute for all topics in the meeting series", () => {
      MigrateV12.up();
      fakeMeetingSeries.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasProperties);
          }
        });
      });
      fakeMeetingSeries.openTopics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasProperties);
          }
        });
      });
    });

    it("sets the correct createdInMinute-attribute for all details in minutes and meetingSeries", () => {
      MigrateV12.up();
      // detail was created in 1st minute => createdInMinute = 1st Minute
      expect(
        firstFakeMinute.topics[0].infoItems[0].details[0].createdInMinute,
      ).to.equal(FIRST_MIN_ID);
      // detail created in 1st minute occured in 2nd Minute =>
      // createdInMinute = 1st Minute
      expect(
        sndFakeMinute.topics[0].infoItems[0].details[0].createdInMinute,
      ).to.equal(FIRST_MIN_ID);
      expect(
        fakeMeetingSeries.topics[0].infoItems[0].details[0].createdInMinute,
      ).to.equal(FIRST_MIN_ID);
      expect(
        fakeMeetingSeries.openTopics[1].infoItems[0].details[0].createdInMinute,
      ).to.equal(FIRST_MIN_ID);
      // detail created in 2nd minute => createdInMinute = 2nd Minute
      expect(
        sndFakeMinute.topics[1].infoItems[0].details[0].createdInMinute,
      ).to.equal(SND_MIN_ID);
      expect(
        fakeMeetingSeries.topics[1].infoItems[0].details[0].createdInMinute,
      ).to.equal(SND_MIN_ID);
      expect(
        fakeMeetingSeries.openTopics[0].infoItems[0].details[0].createdInMinute,
      ).to.equal(SND_MIN_ID);
      // a new detail was added to an infoItem from an old minute in a new
      // minute => createdInMinute = 2nd Minute
      expect(
        sndFakeMinute.topics[0].infoItems[0].details[2].createdInMinute,
      ).to.equal(SND_MIN_ID);
    });

    it("sets the correct _id attribute for all details in minutes and meetingSeries", () => {
      MigrateV12.up();
      const detailIdInFirstMinute =
        firstFakeMinute.topics[0].infoItems[0].details[0]._id;
      expect(sndFakeMinute.topics[0].infoItems[0].details[0]._id).to.equal(
        detailIdInFirstMinute,
      );
      expect(fakeMeetingSeries.topics[0].infoItems[0].details[0]._id).to.equal(
        detailIdInFirstMinute,
      );
      expect(
        fakeMeetingSeries.openTopics[1].infoItems[0].details[0]._id,
      ).to.equal(detailIdInFirstMinute);
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

    it("removes the createdInMinute and _id-attribute", () => {
      MigrateV12.down();
      const checkDetailHasNoProperties = (detail) => {
        expect(detail).not.have.ownProperty("createdInMinute");
        expect(detail).not.have.ownProperty("_id");
      };

      firstFakeMinute.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasNoProperties);
          }
        });
      });
      sndFakeMinute.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasNoProperties);
          }
        });
      });
      fakeMeetingSeries.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasNoProperties);
          }
        });
      });
      fakeMeetingSeries.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasNoProperties);
          }
        });
      });
    });
  });
});
