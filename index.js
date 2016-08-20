'use strict';
// Requires
const config = require('./config');
const MongoClient = require('mongodb').MongoClient;
const tmi = require('tmi.js');

// Vars
const channel = config.twitchChannel;
const targets = {};
let tools;

//setup tmi
const tmiOptions = {
  option: {debug: true},
  connection: {reconnect: true},
  identity: {
    username: config.twitchBotName,
    password: config.twitchOAuth
  },
  channels: [`#${channel}`]
};
const client = new tmi.client(tmiOptions);
setupListeners();
getTargets();

function getTargets() {
  MongoClient.connect(config.mongoUrl, function(err, db) {
    if (err) throw err;

    tools = db.collection('tools');
    tools.find({name:"twitch-greet", username:channel}, {targets: 1}).toArray(function(err, results) {
      if (err) throw err;
      let t = results[0].targets;
      t.forEach(tgt => {
        if (!targets[tgt]) {
          targets[tgt] = {last_greeted: 0};
        }
      });
    })
  });
}

function setupListeners() {
  client.on('connected', () => {
    console.log(`Connected to twitch!`);
  });

  client.on('message', (channel, userstate, message, self) => {
    if (self) return;
    if (
      targets[userstate.username] // Ensure user is in the list
      && targets[userstate.username].last_greeted + 43200000 <= new Date().getTime()
      && (userstate["message-type"] === "action" || userstate["message-type"] === "chat")
    ) {
      greetUser(userstate.username);
    }

    const isCasterCommand = message.match(/!caster ([\S]*)/);
    if (isMod(userstate) && isCasterCommand && isCasterCommand[0].indexOf('!caster') === 0 && isCasterCommand[1] !== channel) {
      console.log(`Adding ${isCasterCommand[1]}`);
      addUser(isCasterCommand);
    }
  });

}

function isMod(user) {
  if (user.badges.broadcaster === '1') return true;
  return user.mod;
}

function greetUser(username) {
  console.log(`Greeted ${username}`);
  client.say(channel, `OH MY GOD ITS ${username.toUpperCase()}`);
  targets[username] = {last_greeted: new Date().getTime()};
}

function addUser([,username]) {
  targets[username] = {last_greeted: new Date().getTime()};
  tools.update(
    {name:"twitch-greet", username:channel},
    {$addToSet: {targets: username}},
    (err, docs) => {
      if (err) throw(err);
      console.log(`Added ${username} to db`);
    }
  )
}

client.connect();
