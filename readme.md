#Installation

1. Run `npm install`
2. create `config.js` at the root
3. Paste the following in `config.js`

```
module.exports = {
  username: 'USERNAME',
  password: 'OAUTH:PASSWORD',
  channels: ['CHANNEL_NAME']
};
```
4. Replace with your username, password and desired channel(s) to connect to

#Running

1. Run `node app.js`
2. Once connected test by joining the channel(s) specified in the config file and type `!hello` to see the response

#Commands

To setup commands create a `commands.js` file and past the following contents to start with

```
module.exports = [
  {
    trigger: '!hello',
    response: "Hello ${user.username}!",
    permission: null
  }
];
```

Follow this format for creating commands, each command should be a new object.
