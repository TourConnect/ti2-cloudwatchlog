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
      const plugin = await (new Plugin({
        events2log: 'request.*',
        'AWS-ACCESS-KEY': 'ACCESS-KEY',
        'AWS-SECRET-KEY': 'SECRET-KEY',
        'AWS-REGION': 'us-west-2',
        'Source': 'test'
      }));
      plugin.eventHandler(ti2Events);
      const widePayload = Object.fromEntries(Array.from(
        { length: 8000 },
        (_, index) => [`field${index}`, 'x'],
      ));
      const admissionToken = `reservation-owner-${'x'.repeat(80 * 1024)}`;
      const payload = {
        ...widePayload,
        foo: 'bar',
        fullSyncAdmissionToken: admissionToken,
        body: { fullSyncAdmissionToken: 'request-reservation-owner' },
        items: [{ fullSyncAdmissionToken: 'array-reservation-owner' }],
        createdAt: new Date('2026-09-12T12:34:56.000Z'),
        attachment: Buffer.from('abc'),
        serialized: {
          toJSON: () => ({
            fullSyncAdmissionToken: 'serialized-reservation-owner',
            retained: true,
          }),
        },
      };
      const startedAt = Date.now();
      ti2Events.emit('request.something', payload);
      expect(Date.now() - startedAt).toBeLessThan(2000);
      await new Promise(resolve => setTimeout(resolve, 100)); // wait for async operations to complete
      expect(cwEventsMock.putEvents).toHaveBeenCalled();
      const loggedEntry = cwEventsMock.putEvents.mock.calls[0][0].Entries[0];
      const loggedDetail = JSON.parse(loggedEntry.Detail);
      expect(loggedEntry).toEqual({
        Detail: expect.any(String),
        DetailType: 'request.something',
        Source: 'test',
      });
      expect(loggedDetail.fullSyncAdmissionToken).toBe('[REDACTED]');
      expect(loggedDetail.body.fullSyncAdmissionToken).toBe('[REDACTED]');
      expect(loggedDetail.items[0].fullSyncAdmissionToken).toBe('[REDACTED]');
      expect(loggedDetail.createdAt).toBe('2026-09-12T12:34:56.000Z');
      expect(loggedDetail.attachment).toEqual({
        type: 'Buffer',
        data: [97, 98, 99],
      });
      expect(loggedDetail.serialized).toEqual({
        fullSyncAdmissionToken: '[REDACTED]',
        retained: true,
      });
      expect(loggedDetail.field7999).toBe('x');
      expect(payload.fullSyncAdmissionToken).toBe(admissionToken);
    });
  });
});
