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
4. Run `node app.js`
5. Once connected test by joining the channel(s) specified in the config file and type `!hello` to see the response
