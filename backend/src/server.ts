import { env } from "./config/env";
import { connectDb } from "./db/connect";
import app from "./app";
import { generateMissingLessonAudio, syncTextbookLessons } from "./services/textbook.service";

async function main() {
  await connectDb();
  // A bad textbook seed must never take the whole API down — log and go on.
  await syncTextbookLessons().catch((err) => console.error("Textbook sync failed:", err));
  app.listen(Number(env.PORT), () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
  // Background: voice any textbook text that has no clip yet.
  generateMissingLessonAudio().catch((err) => console.error("Textbook audio job failed:", err));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
