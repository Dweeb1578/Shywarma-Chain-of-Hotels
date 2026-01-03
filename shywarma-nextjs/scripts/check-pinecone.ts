import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
    console.error("Missing env vars. Check .env.local");
    process.exit(1);
}

async function checkStats() {
    try {
        const pc = new Pinecone({ apiKey: PINECONE_API_KEY as string });
        const index = pc.Index(PINECONE_INDEX_NAME as string);

        console.log(`Checking stats for index: ${PINECONE_INDEX_NAME}...`);

        // 1. Describe Index (General Info)
        const description = await pc.describeIndex(PINECONE_INDEX_NAME as string);
        console.log("\n--- Index Description ---");
        console.log("Spec:", JSON.stringify(description.spec, null, 2));
        console.log("Status:", description.status);
        console.log("Metric:", description.metric);
        console.log("Dimension:", description.dimension);

        // 2. Index Stats (Vector Count)
        const stats = await index.describeIndexStats();
        console.log("\n--- Index Stats ---");
        console.log(JSON.stringify(stats, null, 2));

    } catch (e) {
        console.error("Error:", e);
    }
}

checkStats();
