import { GlobalSettings } from "/imports/config/GlobalSettings";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { FlashMessage } from "../../helpers/flashMessage";
import { handleError } from "../../helpers/handleError";

Template.adminRegisterUser.helpers({
  isMailEnabled() {
    return GlobalSettings.isEMailDeliveryEnabled();
  },
});

Template.adminRegisterUser.events({
  "submit #frmDlgRegisterUser"(evt) {
    evt.preventDefault();
  },

  "click #btnRegisterUserSave"(evt, tmpl) {
    if (!Meteor.user().isAdmin) {
      return;
    }

    const uName = tmpl.find("#id_newUsrName").value;
    const uLongName = tmpl.find("#id_newUsrLongName").value;
    const uMail = tmpl.find("#id_newUsrMail").value;
    const uPassword1 = tmpl.find("#id_newUsrPassword1").value;
    const uPassword2 = tmpl.find("#id_newUsrPassword2").value;

    let sendMail = false;
    let sendPassword = false;
    if (tmpl.find("#id_regUserSendMail")) {
      sendMail = tmpl.find("#id_regUserSendMail").checked;
      sendPassword = tmpl.find("#id_RegUserSendPassword").checked;
    }

    tmpl.$("#btnRegisterUserSave").prop("disabled", true);
    Meteor.call(
      "users.admin.registerUser",
      uName,
      uLongName,
      uMail,
      uPassword1,
      uPassword2,
      sendMail,
      sendPassword,
      (error) => {
        if (error) {
          tmpl.$("#btnRegisterUserSave").prop("disabled", false);
          console.log(error);
          evt.preventDefault();
          handleError(error);
        } else {
          tmpl.$("#dlgAdminRegisterUser").hide();
          new FlashMessage(
            i18n.__("FlashMessages.ok"),
            i18n.__("Admin.Register.success", { user: uName }),
            "alert-success",
            3000,
          ).show();
        }
      },
    );
  },

  "show.bs.modal #dlgAdminRegisterUser"(evt, tmpl) {
    tmpl.find("#id_newUsrName").value = "";
    tmpl.find("#id_newUsrLongName").value = "";
    tmpl.find("#id_newUsrMail").value = "";
    tmpl.find("#id_newUsrPassword1").value = "";
    tmpl.find("#id_newUsrPassword2").value = "";
    tmpl.$("#btnRegisterUserSave").prop("disabled", false);
  },

  "shown.bs.modal #dlgAdminRegisterUser"(evt, tmpl) {
    tmpl.find("#id_newUsrName").focus();
  },
});
