const aws = require('aws-sdk');
const  { Blob } = require('buffer');

const {
  env: {
    NODE_ENV: env,
  },
} = process;

const byteSize = str => new Blob([str]).size;

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
              ...body,
            }),
            DetailType: this.event,
            Source: pluginObj.Source || 'ti2',
          }],
        };
        if (byteSize(JSON.stringify(events)) < (200  * 1e3)) {
          await pluginObj.cwEvents.putEvents(events).promise();
        } else {
          console.log('unable to log to cloudwatch (size constraint)', events);
        }
      });
    });
  }
}

module.exports = Plugin;
