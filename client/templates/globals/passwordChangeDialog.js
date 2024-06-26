import { handleError } from "/client/helpers/handleError";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { addCustomValidator } from "../../helpers/customFieldValidator";
import { FlashMessage } from "../../helpers/flashMessage";

const showError = (evt, error) => {
  handleError(error);
  evt.preventDefault();
};

const checkPasswordsIdentical = (password1, password2) => {
  return password1 === password2;
};

const checkPasswordMatchesPattern = (password) => {
  return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password);
};

Template.passwordChangeDialog.onRendered(() => {
  addCustomValidator(
    "#id_newPassword1",
    (value) => {
      return checkPasswordMatchesPattern(value);
    },
    "Password: min. 6 chars (at least 1 digit, 1 lowercase and 1 uppercase)",
  );

  addCustomValidator(
    "#id_newPassword2",
    (value) => {
      return checkPasswordsIdentical(
        value,
        document.querySelector("#id_newPassword1").value,
      );
    },
    "New Passwords are not identical",
  );
});

Template.passwordChangeDialog.events({
  "submit #frmDlgChangePassword"(evt, tmpl) {
    evt.preventDefault();
    if (!Meteor.user()) {
      return;
    }
    if (Meteor.user().isDemoUser) {
      return;
    }

    const uOldPassword = tmpl.find("#id_oldPassword").value;
    const uPassword1 = tmpl.find("#id_newPassword1").value;
    const uPassword2 = tmpl.find("#id_newPassword2").value;

    if (!checkPasswordsIdentical(uPassword1, uPassword2)) {
      showError(evt, { reason: "New Passwords are not identical" });
      return;
    }
    if (!checkPasswordMatchesPattern(uPassword1)) {
      showError(evt, {
        reason:
          "Password: min. 6 chars (at least 1 digit, 1 lowercase and 1 uppercase)",
      });
      return;
    }

    tmpl.$("#btnChangePasswordSave").prop("disabled", true);
    Accounts.changePassword(uOldPassword, uPassword1, (error) => {
      if (error) {
        tmpl.$("#btnChangePasswordSave").prop("disabled", false);
        console.log(error);
        showError(evt, error);
        return;
      }
      new FlashMessage(
        i18n.__("FlashMessages.ok"),
        i18n.__("FlashMessages.passwordChangeOK"),
        "alert-success",
        2000,
      ).show();
      tmpl.find("#id_oldPassword").value = "";
      tmpl.find("#id_newPassword1").value = "";
      tmpl.find("#id_newPassword2").value = "";
      document.querySelector("#dlgChangePassword").classList.remove("show");
    });
  },

  "show.bs.modal #dlgChangePassword"(evt, tmpl) {
    tmpl.find("#id_oldPassword").value = "";
    tmpl.find("#id_newPassword1").value = "";
    tmpl.find("#id_newPassword2").value = "";
    tmpl.$("#btnChangePasswordSave").prop("disabled", false);
  },

  "shown.bs.modal #dlgChangePassword"(evt, tmpl) {
    tmpl.find("#id_oldPassword").focus();
  },
});
