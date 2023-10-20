import {GlobalSettings} from "/imports/config/GlobalSettings";
import {Template} from "meteor/templating";

Template.appLayout.helpers({
  showGitHubCorner() { return GlobalSettings.showGithubCorner(); },
});
