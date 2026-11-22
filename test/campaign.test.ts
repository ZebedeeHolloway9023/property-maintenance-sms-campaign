import assert from "node:assert/strict";
import { parseCampaign } from "../src/property_sms.js";

const campaign = parseCampaign({
  campaign_id: "test-campaign",
  messages: [{ to: "+15550001111", tenant_id: "tenant-a", kind: "inspection_reminder", body: "Access reminder." }]
});

assert.equal(campaign.messages[0].kind, "inspection_reminder");
assert.throws(() => parseCampaign({ campaign_id: "", messages: [] }));
console.log("campaign boundary test passed");
