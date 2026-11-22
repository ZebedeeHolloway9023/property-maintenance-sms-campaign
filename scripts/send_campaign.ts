import { sendPropertyCampaign } from "../src/property_sms.js";

const queue = process.env.INFRAI_QUEUE_NAME;
if (!queue) throw new Error("INFRAI_QUEUE_NAME is required");

const recipients = process.env.INFRAI_DEMO_RECIPIENTS?.split(",").map((value) => value.trim());
if (!recipients || recipients.length !== 3 || recipients.some((value) => value.length === 0)) {
  throw new Error("INFRAI_DEMO_RECIPIENTS must contain exactly three comma-separated phone numbers");
}

const result = await sendPropertyCampaign({
  campaign_id: "building-17-inspections-2026-10-24",
  messages: [
    { to: recipients[0], tenant_id: "tenant-17a", kind: "inspection_reminder", body: "Inspection reminder: access is needed tomorrow at 09:00." },
    { to: recipients[1], tenant_id: "tenant-17b", kind: "maintenance_request", body: "Your maintenance request is scheduled for review." },
    { to: recipients[2], tenant_id: "tenant-17c", kind: "tenant_document", body: "Please upload the requested lease document securely." }
  ]
}, queue);

console.log(JSON.stringify(result, null, 2));
