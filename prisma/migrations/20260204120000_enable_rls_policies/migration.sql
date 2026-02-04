-- Enable Row Level Security on all application tables.
-- Prisma connects via the service-role DATABASE_URL and bypasses RLS,
-- so existing application queries are unaffected.  These policies
-- protect the tables if they are ever accessed through Supabase's
-- REST/GraphQL layer (anon or authenticated roles).

-- ---------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Anyone can read any user's public profile (name, ratings, etc.)
CREATE POLICY "users_public_select"
  ON "User"
  FOR SELECT
  USING (true);

-- A user can only update their own row
CREATE POLICY "users_own_update"
  ON "User"
  FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Gear
-- ---------------------------------------------------------------------------
ALTER TABLE "Gear" ENABLE ROW LEVEL SECURITY;

-- Public can browse available listings
CREATE POLICY "gear_public_select"
  ON "Gear"
  FOR SELECT
  USING ("isAvailable" = true);

-- Owner can always see their own listings (even unavailable)
CREATE POLICY "gear_owner_select"
  ON "Gear"
  FOR SELECT
  USING ("userId" = auth.uid()::text);

-- Owner can insert new gear
CREATE POLICY "gear_owner_insert"
  ON "Gear"
  FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

-- Owner can update their own gear
CREATE POLICY "gear_owner_update"
  ON "Gear"
  FOR UPDATE
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- Owner can delete their own gear
CREATE POLICY "gear_owner_delete"
  ON "Gear"
  FOR DELETE
  USING ("userId" = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Rental
-- ---------------------------------------------------------------------------
ALTER TABLE "Rental" ENABLE ROW LEVEL SECURITY;

-- Renter or owner of a rental can read it
CREATE POLICY "rental_participant_select"
  ON "Rental"
  FOR SELECT
  USING ("renterId" = auth.uid()::text OR "ownerId" = auth.uid()::text);

-- Only the renter can create a rental request
CREATE POLICY "rental_renter_insert"
  ON "Rental"
  FOR INSERT
  WITH CHECK ("renterId" = auth.uid()::text);

-- Renter or owner can update (e.g. approve, cancel, return)
CREATE POLICY "rental_participant_update"
  ON "Rental"
  FOR UPDATE
  USING ("renterId" = auth.uid()::text OR "ownerId" = auth.uid()::text)
  WITH CHECK ("renterId" = auth.uid()::text OR "ownerId" = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Review
-- ---------------------------------------------------------------------------
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

-- Reviews are public (displayed on gear detail / user profiles)
CREATE POLICY "reviews_public_select"
  ON "Review"
  FOR SELECT
  USING (true);

-- Only the reviewer can insert a review
CREATE POLICY "reviews_own_insert"
  ON "Review"
  FOR INSERT
  WITH CHECK ("reviewerId" = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- DamageClaim
-- ---------------------------------------------------------------------------
ALTER TABLE "DamageClaim" ENABLE ROW LEVEL SECURITY;

-- Renter or owner of the associated rental can see the claim
CREATE POLICY "damageclaim_participant_select"
  ON "DamageClaim"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Rental"
      WHERE "Rental".id = "DamageClaim"."rentalId"
        AND ("Rental"."renterId" = auth.uid()::text OR "Rental"."ownerId" = auth.uid()::text)
    )
  );

-- Owner of the rental can file a damage claim
CREATE POLICY "damageclaim_owner_insert"
  ON "DamageClaim"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Rental"
      WHERE "Rental".id = "DamageClaim"."rentalId"
        AND "Rental"."ownerId" = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- Conversation
-- ---------------------------------------------------------------------------
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

-- Renter or owner of the associated rental can see the conversation
CREATE POLICY "conversation_participant_select"
  ON "Conversation"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Rental"
      WHERE "Rental".id = "Conversation"."rentalId"
        AND ("Rental"."renterId" = auth.uid()::text OR "Rental"."ownerId" = auth.uid()::text)
    )
  );

-- Either rental participant can open a conversation
CREATE POLICY "conversation_participant_insert"
  ON "Conversation"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Rental"
      WHERE "Rental".id = "Conversation"."rentalId"
        AND ("Rental"."renterId" = auth.uid()::text OR "Rental"."ownerId" = auth.uid()::text)
    )
  );

-- ---------------------------------------------------------------------------
-- Message
-- ---------------------------------------------------------------------------
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Rental participants can read messages in the conversation
CREATE POLICY "message_participant_select"
  ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Conversation"
      JOIN "Rental" ON "Rental".id = "Conversation"."rentalId"
      WHERE "Conversation".id = "Message"."conversationId"
        AND ("Rental"."renterId" = auth.uid()::text OR "Rental"."ownerId" = auth.uid()::text)
    )
  );

-- Only the sender (a rental participant) can insert a message
CREATE POLICY "message_sender_insert"
  ON "Message"
  FOR INSERT
  WITH CHECK (
    "senderId" = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM "Conversation"
      JOIN "Rental" ON "Rental".id = "Conversation"."rentalId"
      WHERE "Conversation".id = "Message"."conversationId"
        AND ("Rental"."renterId" = auth.uid()::text OR "Rental"."ownerId" = auth.uid()::text)
    )
  );

-- ---------------------------------------------------------------------------
-- Dispute
-- ---------------------------------------------------------------------------
ALTER TABLE "Dispute" ENABLE ROW LEVEL SECURITY;

-- Reporter or respondent can read the dispute
CREATE POLICY "dispute_participant_select"
  ON "Dispute"
  FOR SELECT
  USING ("reporterId" = auth.uid()::text OR "respondentId" = auth.uid()::text);

-- Only the reporter can open a dispute
CREATE POLICY "dispute_reporter_insert"
  ON "Dispute"
  FOR INSERT
  WITH CHECK ("reporterId" = auth.uid()::text);

-- Participants can update (e.g. provide evidence)
CREATE POLICY "dispute_participant_update"
  ON "Dispute"
  FOR UPDATE
  USING ("reporterId" = auth.uid()::text OR "respondentId" = auth.uid()::text)
  WITH CHECK ("reporterId" = auth.uid()::text OR "respondentId" = auth.uid()::text);

-- Note: adminNotes and resolution are admin-only columns.  Application-layer
-- authorisation enforces this; RLS here prevents accidental exposure via the
-- Supabase REST layer for non-admin roles.  A future admin role policy can be
-- added when the admin role is provisioned in Supabase.

-- ---------------------------------------------------------------------------
-- DisputeResponse
-- ---------------------------------------------------------------------------
ALTER TABLE "DisputeResponse" ENABLE ROW LEVEL SECURITY;

-- Reporter or respondent of the parent dispute can read responses
CREATE POLICY "disputeresponse_participant_select"
  ON "DisputeResponse"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Dispute"
      WHERE "Dispute".id = "DisputeResponse"."disputeId"
        AND ("Dispute"."reporterId" = auth.uid()::text OR "Dispute"."respondentId" = auth.uid()::text)
    )
  );

-- A dispute participant can post a response
CREATE POLICY "disputeresponse_participant_insert"
  ON "DisputeResponse"
  FOR INSERT
  WITH CHECK (
    "userId" = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM "Dispute"
      WHERE "Dispute".id = "DisputeResponse"."disputeId"
        AND ("Dispute"."reporterId" = auth.uid()::text OR "Dispute"."respondentId" = auth.uid()::text)
    )
  );
