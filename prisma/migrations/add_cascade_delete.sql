-- Manual migration to add CASCADE DELETE to existing foreign keys
-- This preserves all existing data while updating the constraints

-- Drop existing foreign key constraints
ALTER TABLE "public"."MealSlot" DROP CONSTRAINT IF EXISTS "MealSlot_tripId_fkey";
ALTER TABLE "public"."Participant" DROP CONSTRAINT IF EXISTS "Participant_tripId_fkey";
ALTER TABLE "public"."Participant" DROP CONSTRAINT IF EXISTS "Participant_userId_fkey";
ALTER TABLE "public"."ParticipantAvailability" DROP CONSTRAINT IF EXISTS "ParticipantAvailability_participantId_fkey";
ALTER TABLE "public"."Assignment" DROP CONSTRAINT IF EXISTS "Assignment_mealSlotId_fkey";
ALTER TABLE "public"."Assignment" DROP CONSTRAINT IF EXISTS "Assignment_participantId_fkey";
ALTER TABLE "public"."Recipe" DROP CONSTRAINT IF EXISTS "Recipe_tripId_fkey";
ALTER TABLE "public"."RecipeAssignment" DROP CONSTRAINT IF EXISTS "RecipeAssignment_mealSlotId_fkey";
ALTER TABLE "public"."RecipeAssignment" DROP CONSTRAINT IF EXISTS "RecipeAssignment_recipeId_fkey";
ALTER TABLE "public"."GroceryList" DROP CONSTRAINT IF EXISTS "GroceryList_tripId_fkey";
ALTER TABLE "public"."Invite" DROP CONSTRAINT IF EXISTS "Invite_tripId_fkey";
ALTER TABLE "public"."Trip" DROP CONSTRAINT IF EXISTS "Trip_createdBy_fkey";

-- Add foreign key constraints with CASCADE DELETE
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."MealSlot" ADD CONSTRAINT "MealSlot_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."ParticipantAvailability" ADD CONSTRAINT "ParticipantAvailability_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES "public"."MealSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."RecipeAssignment" ADD CONSTRAINT "RecipeAssignment_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES "public"."MealSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."RecipeAssignment" ADD CONSTRAINT "RecipeAssignment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."GroceryList" ADD CONSTRAINT "GroceryList_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;