'use strict';
// The sample files of the Open Sample commands. All data is invented for this product; it names no real company, person or system.

const SAMPLES = {
 "openSample": {
  "title": "Open Sample File",
  "fileName": "V214__order_notes.sql",
  "languageId": "sql",
  "text": "-- Release 2.14: order notes, account e-mail rules, clean-up (invented example).\nBEGIN;\n\nCREATE TABLE order_notes (\n  id bigserial PRIMARY KEY,\n  order_id bigint NOT NULL REFERENCES orders (id),\n  body text NOT NULL,\n  created_at timestamptz NOT NULL DEFAULT now()\n);\n\nCREATE INDEX idx_order_notes_order ON order_notes (order_id);\n\nALTER TABLE orders ADD COLUMN gift_message text;\nALTER TABLE orders ADD COLUMN priority integer NOT NULL;\nALTER TABLE orders ALTER COLUMN total_cents TYPE bigint;\n\nALTER TABLE accounts ADD CONSTRAINT accounts_email_key UNIQUE (email);\nALTER TABLE accounts ADD CONSTRAINT accounts_plan_fk FOREIGN KEY (plan_id) REFERENCES plans (id);\nALTER TABLE accounts RENAME COLUMN name TO display_name;\n\nCREATE INDEX idx_orders_status ON orders (status);\n\nUPDATE orders SET priority = 0;\nDELETE FROM sessions WHERE expires_at < now();\nDROP TABLE legacy_coupons;\n\nCOMMIT;\n"
 }
};

/** The sample with the given id, or null. */
function sampleFor(id) { return SAMPLES[id] || null; }

module.exports = { sampleFor: sampleFor, SAMPLE_IDS: Object.keys(SAMPLES) };
