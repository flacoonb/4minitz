/*
 * This helper script generates a number of test users and stores them in the
 * DB. The test users will have no eMail address and will all have the same
 * password: PwdPwd1
 *
 * If MongoDB is listening on port 3101 then this call will create 5000 unique
 * users: node createTestUsers.js -m mongodb://localhost:3101/meteor -n 5000
 */

import { faker } from "@faker-js/faker";
import { MongoClient as mongo } from "mongodb";
import random from "randomstring";

class UserFactory {
  static getUser() {
    UserFactory.counter++;
    const username = `user_${UserFactory.postfix}_${UserFactory.counter}`;
    return {
      _id: random.generate({
        length: 17,
        charset: "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz",
      }),
      username,
      createdAt: new Date(),
      isInactive: false,
      services: {
        password: {
          // PwdPwd1
          bcrypt:
            "$2a$10$mtPbwEoJmaAO01fxI/WnZepoUz4D.U6f/yYl6KG1oojxNI7JZmn.S",
        },
      },
      profile: { name: faker.person.fullName() },
      emails: [{ address: `${username}@4minitz.com`, verified: false }],
    };
  }

  static saveUsers(db, numberOfUsers) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < numberOfUsers; i++) {
        const user = UserFactory.getUser();
        db.collection("users").insert(user);
        console.log(`${i}\t${user.username}\t${user.profile.name}`);
      }
      resolve(db);
    });
  }
}
UserFactory.counter = 0;
UserFactory.postfix = random.generate({
  length: 3,
  charset: "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz",
});

const _connectMongo = function (mongoUrl) {
  return new Promise((resolve, reject) => {
    mongo.connect(mongoUrl, (error, db) => {
      if (error) {
        reject(error);
      }
      resolve(db);
    });
  });
};

const optionParser = require("node-getopt").create([
  ["n", "number=[ARG]", "Number of users to be created"],
  ["m", "mongourl=[ARG]", "Mongo DB url"],
  ["h", "help", "Display this help"],
]);
const arg = optionParser.bindHelp().parseSystem();
const mongoUrl = arg.options.mongourl || process.env.MONGO_URL;
const numberOfUsers = arg.options.number;
if (!numberOfUsers) {
  optionParser.showHelp();
  throw new Error("No --numberparameter set");
}
if (!mongoUrl) {
  optionParser.showHelp();
  throw new Error("No --mongourl parameter or MONGO_URL in env");
}

_connectMongo(mongoUrl)
  .then((db) => UserFactory.saveUsers(db, numberOfUsers))
  .then((db) => db.close())
  .catch((error) => {
    console.log(`Error: ${error}`);
  });
