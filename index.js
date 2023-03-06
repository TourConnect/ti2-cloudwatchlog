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
        const detail = JSON.stringify({
          env,
          ...body,
        });
        const events = {
          Entries: [{
            Detail: detail,
            DetailType: this.event,
            Source: pluginObj.Source || 'ti2',
          }],
        };
        if (byteSize(body) < (250  * 1e3)) {
          await pluginObj.cwEvents.putEvents(events).promise();
        } else {
          console.log('unable to log to cloudwatch (size constraint)', events);
        }
      });
    });
  }
}

module.exports = Plugin;
