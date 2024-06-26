/**
 * @file Action Item List Template
 * @description This file contains the template and helper functions for the
 * action item list.
 */

import { TopicSchema } from "/imports/collections/topic.schema";
import { MeetingSeries } from "/imports/meetingseries";
import { ITEM_KEYWORDS } from "/imports/search/FilterKeywords";
import { ItemsFilter } from "/imports/search/ItemsFilter";
import { QueryParser } from "/imports/search/QueryParser";
import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { FilterControlConfig } from "../globals/ui-controls/filterControl";
import { TopicInfoItemListContext } from "../topic/topicInfoItemList";

import {
  createLabelIdsReceiver,
  createUserIdsReceiver,
} from "./helpers/tabFilterDatabaseOperations";

/**
 * @template onCreated
 * @description Initializes the action item list template.
 */
Template.actionItemList.onCreated(function () {
  this.topicFilterQuery = new ReactiveVar("");
  const myTemplate = Template.instance();
  this.topicFilterHandler = (query) => {
    myTemplate.topicFilterQuery.set(query);
  };

  this.itemsFilter = new ItemsFilter();
  this.parser = new QueryParser(
    ITEM_KEYWORDS,
    createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId),
    createUserIdsReceiver,
  );

  const meetingSeriesIDs = MeetingSeries.find().map((item) => item._id);
  this.subscribe("topics", meetingSeriesIDs);
});

Template.actionItemList.helpers({
  /**
   * @function getTopicFilterConfig
   * @description Retrieves the configuration for the topic filter.
   * @returns {FilterControlConfig} The filter control configuration.
   */
  getTopicFilterConfig() {
    const FILTERS = [
      { text: i18n.__("Item.Filter.open"), value: "is:action is:open" },
      { text: i18n.__("Item.Filter.closed"), value: "is:action is:closed" },
    ];
    const tmpl = Template.instance();
    return new FilterControlConfig(
      tmpl.topicFilterHandler,
      FILTERS,
      ITEM_KEYWORDS,
      "Item-Filter",
      "is:action is:open",
    );
  },

  /**
   * @function getInfoItemListContext
   * @description Retrieves the context for the information item list.
   * @returns {TopicInfoItemListContext} The context for the information item
   *     list.
   */
  getInfoItemListContext() {
    let myActionItems = [];
    const actionItemSeriesIdMap = {};
    const actionItemTopicIdMap = {};

    const topics = TopicSchema.getCollection().find().fetch();
    topics.forEach((topic) => {
      const actionItems = topic.infoItems.filter(
        (item) =>
          item.itemType === "actionItem" &&
          item.responsibles &&
          item.responsibles.includes(Meteor.userId()),
      );
      actionItems.forEach((actionItem) => {
        myActionItems.push(actionItem);
        actionItemSeriesIdMap[actionItem._id] = topic.parentId;
        actionItemTopicIdMap[actionItem._id] = topic._id;
      });
    });

    const tmpl = Template.instance();
    const query = tmpl.topicFilterQuery.get();
    tmpl.parser.reset();
    tmpl.parser.parse(query);

    myActionItems = tmpl.itemsFilter.filter(myActionItems, tmpl.parser);

    myActionItems.sort((a, b) => new Date(a.duedate) - new Date(b.duedate));

    return TopicInfoItemListContext.createdReadonlyContextForItemsOfDifferentTopicsAndDifferentMinutes(
      myActionItems,
      (itemId) => {
        return actionItemSeriesIdMap[itemId];
      },
      (itemId) => {
        return actionItemTopicIdMap[itemId];
      },
    );
  },
});
