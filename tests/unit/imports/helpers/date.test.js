import { expect } from "chai";

import {
  currentDatePlusDeltaDays,
  extractDateFromString,
  formatDateISO8601,
} from "../../../../imports/helpers/date";

describe("formatDateISO8601 helper", function () {
  it("formats date to string", function () {
    expect(formatDateISO8601(new Date(2016, 11, 23))).to.equal("2016-12-23");
  });
});

describe("currentDatePlusDeltaDays helper", function () {
  it("works without parameter", function () {
    const currentDate = new Date();

    expect(currentDatePlusDeltaDays()).to.equal(formatDateISO8601(currentDate));
  });

  it("works with zero offset", function () {
    const currentDate = new Date();

    expect(currentDatePlusDeltaDays(0)).to.equal(
      formatDateISO8601(currentDate),
    );
  });

  it("works with positive offset", function () {
    const currentDate = new Date();
    const nextDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1,
    );

    expect(currentDatePlusDeltaDays(1)).to.equal(formatDateISO8601(nextDay));
  });

  it("works with negative offset", function () {
    const currentDate = new Date();
    const nextDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 35,
    );

    expect(currentDatePlusDeltaDays(-35)).to.equal(formatDateISO8601(nextDay));
  });
});

describe("extractDateFromString", function () {
  it("returns the extracted date", function () {
    const stringWithDate = "Hello 2017-11-13";
    const dateString = extractDateFromString(stringWithDate);
    expect(dateString).to.equal("2017-11-13");
  });
});
