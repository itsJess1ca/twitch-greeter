# twitch-greeter


A simple twitch greeter to automatically greet/shoutout a select list of casters.

To Setup:
- `npm install`
- create your config.json (example below)
- `npm start`


Currently, to add a caster to the list of targets, you run `!caster username` in chat

`config.json:`
```
{
  "mongoUrl":"MONGO_URI",
  "twitchOAuth": "TWITCH_OAUTH"
}

```
