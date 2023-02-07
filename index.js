const aws = require('aws-sdk');

const {
  env: {
    NODE_ENV: env,
  },
} = process;

class Plugin {
  constructor(params = {}) {
    Object.entries(params).forEach(([attr, value]) => {
      this[attr] = value;
    });
    return (async () => {
      if (!aws) return this;
      aws.config.update({
        accessKeyId: this['AWS-ACCESS-KEY'],
        secretAccessKey: this['AWS-SECRET-KEY'],
        region: this['AWS-REGIOn'] || 'us-east-1',
      });
      this.cwEvents = new aws.CloudWatchEvents({ version: 'latest' });
      return this;
    })();
  }

  eventHandler(eventEmmiter) {
    const eventsArr = (this.events2log || 'request.*').split(',');
    const pluginObj = this;
    eventsArr.forEach(eventName => {
      eventEmmiter.on(eventName, async function (body) {
        const events = {
          Entries: [{
            Detail: JSON.stringify({
              env,
              ...body
            }),
            DetailType: this.event,
            Source: pluginObj.Source || 'ti2',
          }],
        };
        await pluginObj.cwEvents.putEvents(events).promise();
      });
    });
  }
}

module.exports = Plugin;
