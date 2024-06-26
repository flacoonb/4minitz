import { Meteor } from "meteor/meteor";

/**
 * Represents a user in the system.
 */
export class User {
  constructor(source) {
    if (!source) {
      // Case 1: currently logged in user
      this.user = Meteor.user();
      this.id = this.user._id;
    } else if (typeof source === "string") {
      // Case 2: we assume we have a user ID here.
      this.id = source;
      this.user = Meteor.users.findOne(source);
    }
    if (typeof source === "object") {
      // Case 3: make deep copy of user object
      this.user = JSON.parse(JSON.stringify(source));
      this.id = this.user._id;
    }

    this.OK = Boolean(this.user);
  }

  /**
   * Returns the profile name of a user object with fallback to username if
   * profile name is not available. If the user object is not provided, it
   * returns an unknown identifier.
   *
   * @param {Object} userObject - The user object.
   * @returns {string} The profile name or fallback username.
   */
  static profileNameWithFallback(userObject) {
    if (userObject) {
      return userObject.profile?.name
        ? userObject.profile.name
        : userObject.username;
    } else {
      return `Unknown (${userObject._id}` ? userObject._id : `${userObject})`;
    }
  }

  /**
   * Returns the profile name with fallback.
   * @returns {string} The profile name with fallback.
   */
  profileNameWithFallback() {
    return User.profileNameWithFallback(this.user);
  }

  /**
   * Returns the username of the user, or a fallback string if the username is
   * not available.
   * @returns {string} The username of the user, or a fallback string if the
   *     username is not available.
   */
  userNameWithFallback() {
    return this.user ? this.user.username : `Unknown (${this.id})`;
  }

  /**
   * Stores a setting value for the user.
   *
   * @param {string} key - The key of the setting.
   * @param {any} value - The value to be stored.
   */
  storeSetting(key, value) {
    if (this.user.settings === undefined) {
      this.user.settings = {};
    }
    this.user.settings[key] = value;

    Meteor.call("users.saveSettings", this.user.settings);
  }

  /**
   * Retrieves a setting value from the user's settings object.
   * If the setting is not found, the default value is returned.
   *
   * @param {string} key - The key of the setting to retrieve.
   * @param {*} defaultValue - The default value to return if the setting is not
   *     found.
   * @returns {*} The value of the setting if found, otherwise the default
   *     value.
   */
  getSetting(key, defaultValue) {
    if (this.user.settings === undefined) {
      return defaultValue;
    }
    const value = this.user.settings[key];
    if (value === undefined) {
      return defaultValue;
    }
    return value;
  }
}

export const userSettings = {
  showQuickHelp: {
    meetingSeriesList: "showQuickHelp_meetingSeriesList",
    meetingSeries: "showQuickHelp_meetingSeries",
    meeting: "showQuickHelp_meeting",
    meetingUpload: "showQuickHelp_meetingUpload",
  },

  showAddDetail: "showAddDetail",
};
