const  { Blob } = require('buffer');

const { limitObjectSize } = require('./utils/limit-object-size.js');
const OBJECT_SIZE_LIMIT = 200 * 1e3 // in bytes
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
    const aws = require('aws-sdk');
    return (async () => {
      aws.config.update({
        accessKeyId: this['AWS-ACCESS-KEY'],
        secretAccessKey: this['AWS-SECRET-KEY'],
        region: this['AWS-REGION'] || 'us-east-1',
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
            Detail: JSON.stringify(limitObjectSize({
              env,
              ...body,
            }, (OBJECT_SIZE_LIMIT - 75))),
            DetailType: this.event,
            Source: pluginObj.Source || 'ti2',
          }],
        };
        if (byteSize(JSON.stringify(events)) < OBJECT_SIZE_LIMIT) {
          await pluginObj.cwEvents.putEvents(events).promise();
        } else {
          console.log('unable to log to cloudwatch (size constraint)', events);
        }
      });
    });
  }
}

module.exports = Plugin;
