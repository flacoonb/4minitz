import { BroadcastMessageSchema } from "/imports/collections/broadcastmessages.schema";
import { formatDateISO8601Time } from "/imports/helpers/date";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

Template.tabAdminMessages.onCreated(function () {
  this.subscribe("broadcastmessage");
  this.subscribe("broadcastmessageAdmin");
});

Template.tabAdminMessages.onRendered(() => {
  Template.instance().find("#id_adminMessage").focus();
});

Template.tabAdminMessages.helpers({
  messages() {
    return BroadcastMessageSchema.find({}, { sort: { createdAt: -1 } });
  },

  inactiveStateColor(message) {
    if (message.isActive) {
      return "#A2F9EA";
    }
    return "#ffced9";
  },

  formatTimeStamp(date) {
    return formatDateISO8601Time(date);
  },
});

Template.tabAdminMessages.events({
  "submit #frmAdminMessages"(evt, tmpl) {
    evt.preventDefault();
    const message = tmpl.find("#id_adminMessage").value;
    Meteor.call("broadcastmessage.show", message);
    tmpl.find("#id_adminMessage").value = "";
  },

  "click #btnRemoveMessage"(evt) {
    evt.preventDefault();
    Meteor.call("broadcastmessage.remove", this._id);
  },

  "click #btnTogglaActiveMessage"(evt) {
    evt.preventDefault();
    Meteor.call("broadcastmessage.toggleActive", this._id);
  },

  "click #btnDismissingUsers"(evt) {
    evt.preventDefault();
    const userIds = this.dismissForUserIDs;
    let userNames = i18n.__("Admin.Message.dismissingUsers", {
      number: this.dismissForUserIDs.length,
    });
    userIds.forEach((usrId) => {
      const user = Meteor.users.findOne(usrId);
      if (user) {
        userNames += `${user.username} `;
        userNames += user.profile?.name ? `${user.profile.name}\n` : "\n";
      }
    });
    alert(userNames);
  },

  "click #btnReShow"(evt, tmpl) {
    evt.preventDefault();
    tmpl.find("#id_adminMessage").value = this.text;
    tmpl.find("#id_adminMessage").focus();
  },
});
