const EventEmitter = require('eventemitter2');
const Plugin = require('./index.js');

describe('Plugin', () => {
  describe('eventHandler', () => {
    it('should log events to CloudWatch', async () => {
      const ti2Events = new EventEmitter({ captureRejections: true, wildcard: true });
      const cwEventsMock = {
        putEvents: jest.fn().mockReturnValue({ promise: () => Promise.resolve() }),
      };
      const mockAWS = {
        config: {
          update: jest.fn(),
        },
        CloudWatchEvents: jest.fn().mockReturnValue(cwEventsMock),
      };
      jest.mock('aws-sdk', () => mockAWS);
      const eventEmitterMock = {
        on: (eventName, callback) => callback({ foo: 'bar' }),
      };
      const plugin = await (new Plugin({
        events2log: 'request.*',
        'AWS-ACCESS-KEY': 'ACCESS-KEY',
        'AWS-SECRET-KEY': 'SECRET-KEY',
        'AWS-REGION': 'us-west-2',
        'Source': 'test'
      }));
      plugin.eventHandler(ti2Events);
      ti2Events.emit('request.something', { foo: 'bar' });
      await new Promise(resolve => setTimeout(resolve, 100)); // wait for async operations to complete
      expect(cwEventsMock.putEvents).toHaveBeenCalled();
      expect(cwEventsMock.putEvents.mock.calls[0][0]).toEqual({
        Entries: [
          {
            Detail: JSON.stringify({
              env: process.env.NODE_ENV,
              foo: 'bar',
            }),
            DetailType: 'request.something',
            Source: 'test',
          },
        ],
      });
    });
  });
});
