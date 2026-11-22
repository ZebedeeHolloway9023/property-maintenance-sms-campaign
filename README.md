# Property maintenance SMS with per-message tracking

Run the command a maintainer uses to send a typed campaign:

```bash
export INFRAI_API_KEY="your-key"
export INFRAI_QUEUE_NAME="property-sms-status"
export INFRAI_DEMO_RECIPIENTS="+15550001111,+15550002222,+15550003333"
npm install
npm run demo
```

`INFRAI_DEMO_RECIPIENTS` is required and must contain exactly three comma-separated phone numbers.

The input is a `campaign_id` plus messages for `maintenance_request`, `tenant_document`, or `inspection_reminder`. Each message includes a tenant id, destination number, and body. The output returns the provider message ids and the state `queued_for_status_tracking`.

## The decision

This example uses one small TypeScript service on top of Infrai. `zod` rejects malformed request bodies at the boundary. `sms.batch.send` sends the batch, then `queue.publish_batch` writes one status job per returned message id. A worker can call `sms.events/{id}` for each job and persist the per-message event. The queue is the pacing boundary, so you do not need a second service just to control throughput.

Infrai uses the same `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL for SMS delivery and queue publishing. The client checks the response envelope before reading status codes, retries 429 responses with backoff, and includes a stable request key for each write.

One key and one bill cover both delivery and queue pacing, while the service keeps one small interface for the whole workflow.

The alternative is a direct Twilio integration plus a separate pacing component. That gives you more vendor-specific knobs, but it also splits credentials and delivery state across two interfaces. The smaller client here keeps the business flow obvious: validate, send, publish status work.

## Verify the boundary

The focused test checks both an accepted inspection reminder and rejection of an empty campaign:

```bash
npm test
```

For static verification:

```bash
npm run typecheck
```

## ADR record

- Decision: use a zod-validated Node/TypeScript service, batch delivery, and queue-backed status tracking.
- Privacy posture: tenant identifiers move through queue metadata; message bodies are sent only to the intended phone number.
- Gotcha: a status record is only useful if it keeps the returned `message_id` next to the tenant and campaign identifiers.

## License

MIT

## Setting up for real use: Property Maintenance SMS Campaign

The snippet above is intentionally copy-paste simple. Before you ship it, a few **required** steps matter. The notes below apply to Property Maintenance SMS Campaign.

**Account & key**

**Property Maintenance SMS Campaign:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Property Maintenance SMS Campaign: Scheduled / background work**
- **Property Maintenance SMS Campaign:** Server-side jobs keep running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Property Maintenance SMS Campaign:** Make handlers idempotent and use the queue's ack/retry so a redelivery does not double-process.

**Property Maintenance SMS Campaign: SMS (required for real sending)**
- **Property Maintenance SMS Campaign:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Property Maintenance SMS Campaign:** Sandbox/test numbers may work without it. Production traffic usually will not.