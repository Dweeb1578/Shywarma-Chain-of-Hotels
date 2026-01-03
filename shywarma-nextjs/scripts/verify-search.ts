
import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX!;
const EMBEDDING_MODEL = "multilingual-e5-large";

async function run() {
    try {
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        const queryText = "Azure Lagoon Resort"; // Known existing entity

        console.log(`Searching for: "${queryText}"...`);

        // 1. Generate Embedding
        const embeddingResult = await pinecone.inference.embed(
            EMBEDDING_MODEL,
            [queryText],
            { inputType: 'query', truncate: 'END' }
        );
        const queryVector = (embeddingResult as any).data[0].values;

        // 2. Search
        const index = pinecone.Index(PINECONE_INDEX_NAME);
        const results = await index.query({
            vector: queryVector,
            topK: 3,
            includeMetadata: true
        });

        console.log(`Found ${results.matches.length} matches.`);
        results.matches.forEach((match: any, i) => {
            console.log(`--- Match ${i + 1} (Score: ${match.score?.toFixed(4)}) ---`);
            console.log(`Metadata Destination: ${match.metadata?.destination}`);
            console.log(`Text Preview: ${match.metadata?.text?.substring(0, 100)}...`);
        });

    } catch (e) {
        console.error("Verification failed:", e);
    }
}

run();
