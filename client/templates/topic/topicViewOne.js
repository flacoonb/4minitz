// TopicViewOne
//
// This is a "view only" for one single topic
// Triggered by the route /topic/:id
// It grabs the topic by ID from the Topics collection
// And displays it with "isEditable: false"

import { TopicSchema } from "/imports/collections/topic.schema";
import { UserRoles } from "/imports/userroles";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

import { MeetingSeries } from "../../../imports/meetingseries";
import { MinutesFinder } from "../../../imports/services/minutesFinder";

let _topicID = undefined; // this topic ID
let _parentSeriesId = undefined;
Template.topicViewOne.onCreated(function () {
  this.topicReady = new ReactiveVar();

  this.autorun(() => {
    _topicID = FlowRouter.getParam("_id");
    this.subscribe("topicOnlyOne", _topicID, () => {
      // perform the inner subscription after the outer one is ready
      const aTopic = TopicSchema.getCollection().findOne({ _id: _topicID });
      if (aTopic) {
        _parentSeriesId = aTopic.parentId;
        if (_parentSeriesId) {
          this.subscribe("minutes", _parentSeriesId);
        }
      }
    });
    this.subscribe("meetingSeriesOverview");
    this.topicReady.set(this.subscriptionsReady());
  });
});

Template.topicViewOne.onRendered(() => {
  // add your statement here
});

Template.topicViewOne.onDestroyed(() => {
  // add your statement here
});

Template.topicViewOne.helpers({
  authenticating() {
    const topicReady = Template.instance().topicReady.get();
    return Meteor.loggingIn() || !topicReady;
  },

  redirectIfNotAllowed() {
    const usrRoles = new UserRoles();
    if (_parentSeriesId && !usrRoles.hasViewRoleFor(_parentSeriesId)) {
      FlowRouter.go("/");
    }
  },

  theMeetingSeries() {
    return new MeetingSeries(_parentSeriesId);
  },

  theTopic() {
    const theTopic = TopicSchema.getCollection().findOne({ _id: _topicID });
    if (!_topicID || !theTopic) {
      return undefined;
    }
    return {
      topic: theTopic,
      isEditable: false,
      minutesID: null,
      currentCollapseId: 1, // each topic item gets its own collapseID,
      parentMeetingSeriesId: _parentSeriesId,
    };
  },

  dateOfLastFinalizedMinutes() {
    const ms = new MeetingSeries(_parentSeriesId);
    const aMin = MinutesFinder.lastFinalizedMinutesOfMeetingSeries(ms);
    if (aMin) {
      return aMin.date;
    }
    return "Never";
  },

  idOfLastFinalizedMinutes() {
    const ms = new MeetingSeries(_parentSeriesId);
    const aMin = MinutesFinder.lastFinalizedMinutesOfMeetingSeries(ms);
    if (aMin) {
      return aMin._id;
    }
    return "unknown";
  },
});

Template.topicViewOne.events({
  "click #btnGoBack"() {
    // tell previous tabbed view to restore the last tab
    Session.set("restoreTabAfterBackButton", true);
    window.history.back();
  },
});
