
import { Pinecone } from "@pinecone-database/pinecone";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
    console.error("Missing environment variables. Please check .env.local");
    process.exit(1);
}

// Configuration
const EMBEDDING_MODEL = "multilingual-e5-large";

async function run() {
    try {
        // 1. Read Knowledge Base
        const kbPath = "C:/Users/Vrishab/.gemini/antigravity/brain/83880a13-a061-4d8e-afc8-77b040eaf1ed/hotel_details.md";
        console.log(`Reading Knowledge Base from: ${kbPath}`);

        if (!fs.existsSync(kbPath)) {
            throw new Error("Knowledge base file not found at " + kbPath);
        }

        const text = fs.readFileSync(kbPath, "utf-8");

        // 2. Chunk Data
        const sections = text.split(/^## /gm).filter(s => s.trim().length > 0);
        const chunkedDocs: { id: string; text: string; metadata: any }[] = [];
        let chunkSizeTotal = 0;

        sections.forEach((section, i) => {
            const lines = section.split("\n");
            const title = lines[0].trim();
            const content = lines.slice(1).join("\n").trim();

            // Main Dest Chunk
            chunkedDocs.push({
                id: `dest-${i}`,
                text: content,
                metadata: { destination: title, type: "destination_overview" }
            });

            // Sub-chunks
            const subSections = content.split(/^### /gm).filter(s => s.trim().length > 0);
            subSections.forEach((sub, j) => {
                chunkedDocs.push({
                    id: `dest-${i}-sub-${j}`,
                    text: sub.trim(),
                    metadata: { destination: title, type: "subsection" }
                });
            });
        });

        console.log(`Prepared ${chunkedDocs.length} chunks.`);

        // 3. Initialize Pinecone
        const pc = new Pinecone({ apiKey: PINECONE_API_KEY as string });
        const index = pc.Index(PINECONE_INDEX_NAME as string);

        // 4. Generate Embeddings (Integrated Inference)
        console.log(`Generating embeddings using ${EMBEDDING_MODEL}...`);

        // Prepare inputs for inference
        const inputs = chunkedDocs.map(d => d.text);

        // Use batching if needed (Pinecone Inference usually accepts batches)
        // For simplicity with <100 docs, we send in one or small batches.

        // NOTE: pc.inference might need specific method signature depending on version.
        // Assuming v5.1.2 supports pc.inference.embed

        const embeddingResult = await pc.inference.embed(
            EMBEDDING_MODEL,
            inputs,
            { inputType: 'passage', truncate: 'END' }
        );

        // Fix: embeddingResult is likely an object with a data property
        const embeddingsData = (embeddingResult as any).data || embeddingResult;

        console.log(`Generated ${embeddingsData.length} embeddings.`);

        // 5. Upsert to Index
        const vectors = embeddingsData.map((emb: any, i: number) => ({
            id: chunkedDocs[i].id,
            values: emb.values,
            metadata: {
                ...chunkedDocs[i].metadata,
                text: chunkedDocs[i].text // Important: Store text in metadata for retrieval!
            }
        }));

        // Clear existing data first
        console.log("Clearing existing index data...");
        await index.deleteAll();

        // Batch upsert (limit is usually 100 or 2MB)
        console.log("Upserting to Pinecone...");
        await index.upsert(vectors);

        console.log("Ingestion Complete! 🚀");

    } catch (error) {
        console.error("Ingestion failed:", error);
        process.exit(1);
    }
}

run();
