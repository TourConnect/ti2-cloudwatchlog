const aws = require('aws-sdk');

const {
  env: {
    NODE_ENV: env,
  },
} = process;

class Plugin {
  constructor(params = {}) {
    this.onRequestStart = this.onRequestStart.bind(this);
    this.onRequestEnd = this.onRequestEnd.bind(this);
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

  async onRequestStart(body) {
    const events = {
      Entries: [{
        Detail: JSON.stringify({
          env,
          ...body
        }),
        DetailType: this.DetailType || 'userActivity',
        Source: this.Source || 'ti2',
      }],
    };
    await this.cwEvents.putEvents(events).promise();
  }

  async onRequestEnd(body) {
    const events = {
      Entries: [{
        Detail: JSON.stringify({
          env,
          ...body
        }),
        DetailType: this.DetailType || 'userActivity',
        Source: this.Source || 'ti2',
      }],
    };
    await this.cwEvents.putEvents(events).promise();
  }
}

module.exports = Plugin;
