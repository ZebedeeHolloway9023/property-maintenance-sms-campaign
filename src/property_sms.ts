import { z } from "zod";
import { infrai } from "./infrai.js";

const requestSchema = z.object({
  campaign_id: z.string().min(1),
  messages: z.array(z.object({
    to: z.string().min(7),
    tenant_id: z.string().min(1),
    kind: z.enum(["maintenance_request", "tenant_document", "inspection_reminder"]),
    body: z.string().min(1).max(640)
  })).min(1)
});

export type PropertyCampaign = z.infer<typeof requestSchema>;

export function parseCampaign(input: unknown): PropertyCampaign {
  return requestSchema.parse(input);
}

export async function sendPropertyCampaign(input: unknown, queue: string) {
  const campaign = parseCampaign(input);
  const messages = campaign.messages.map(({ to, body }) => ({ to, body }));
  const ids = await infrai.sms.batch.send({ messages }, `sms:${campaign.campaign_id}`);

  await infrai.queue.publish_batch({
    queue,
    messages: ids.message_ids.map((message_id, index) => ({
      message_id,
      campaign_id: campaign.campaign_id,
      tenant_id: campaign.messages[index].tenant_id,
      kind: campaign.messages[index].kind
    }))
  }, `queue:${campaign.campaign_id}`);

  return {
    campaign_id: campaign.campaign_id,
    message_ids: ids.message_ids,
    status: "queued_for_status_tracking"
  };
}
