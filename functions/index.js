// functions/index.js

const {onSchedule} = require("firebase-functions/v2/scheduler");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");
const {initializeApp} = require("firebase-admin/app");
const logger = require("firebase-functions/logger");

// Initialize the Firebase Admin SDK.
initializeApp();

/**
 * A scheduled Cloud Function that runs periodically to update event statuses.
 * It finds events that are 'Upcoming' or 'Ongoing' whose end time has passed
 * and updates their status to 'Completed'.
 *
 * This function is scheduled to run every 60 minutes.
 */
exports.updateEventStatusToCompleted = onSchedule(
    "every 60 minutes", async (event) => {
      logger.info("Running scheduled function to update event statuses...");

      const db = getFirestore();
      const now = Timestamp.now();

      // Query for events that are still marked as 'Upcoming' or 'Ongoing'
      // but their 'endDate' is in the past. If an event has no 'endDate',
      // it is not considered for automatic completion by this function.
      const eventsToCompleteQuery = db.collection("events")
          .where("status", "in", ["Upcoming", "Ongoing"])
          .where("endDate", "<=", now);

      try {
        const querySnapshot = await eventsToCompleteQuery.get();

        if (querySnapshot.empty) {
          logger.info("No events found that need to be marked as completed.");
          return null;
        }

        const batch = db.batch();
        let updatedCount = 0;

        querySnapshot.forEach((doc) => {
          logger.info(
              `Updating event ${doc.id} (${doc.data().name}) to 'Completed'.`,
          );
          const eventRef = db.collection("events").doc(doc.id);
          batch.update(eventRef, {status: "Completed", updatedAt: now});
          updatedCount++;
        });

        await batch.commit();
        logger.info(
            `Successfully updated ${updatedCount} events to 'Completed'.`,
        );
        return null;
      } catch (error) {
        logger.error("Error updating event statuses to completed:", error);
        return null;
      }
    });

// IMPORTANT: For this function to work correctly, your event documents MUST
// have an 'endDate' field that is a Firestore Timestamp.
// If an event is a single-day event, 'endDate' should be the same day
// as 'startDate', but with the end time.