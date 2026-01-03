
import { Pinecone } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
    console.error("Missing environment variables. Please check .env.local");
    process.exit(1);
}

async function run() {
    try {
        // 1. Read the Knowledge Base
        // Note: In a real app we might verify the path dynamically.
        // Assuming script is run from root or via 'npx tsx scripts/ingest-data.ts'
        const kbPath = "C:/Users/Vrishab/.gemini/antigravity/brain/83880a13-a061-4d8e-afc8-77b040eaf1ed/hotel_details.md";

        console.log(`Reading Knowledge Base from: ${kbPath}`);
        if (!fs.existsSync(kbPath)) {
            throw new Error("Knowledge base file not found at " + kbPath);
        }

        const text = fs.readFileSync(kbPath, "utf-8");

        // 2. Chunk the text
        // Simple splitting by headers for now to keep context intact per section.
        // LangChain's MarkdownSplitter is better but let's do a custom consistent split for this structure.
        const sections = text.split(/^## /gm).filter(s => s.trim().length > 0);

        const documents: Document[] = [];

        sections.forEach((section) => {
            const lines = section.split("\n");
            const title = lines[0].trim(); // e.g. "1. Maldives" or "2. Santorini"
            const content = lines.slice(1).join("\n").trim();

            // Create a main document for the destination overview
            documents.push(new Document({
                pageContent: content,
                metadata: {
                    destination: title,
                    type: "destination_overview",
                    source: "hotel_details.md"
                }
            }));

            // Attempt to split further by subheaders like "### Hotels" if they exist
            const subSections = content.split(/^### /gm).filter(s => s.trim().length > 0);
            subSections.forEach(sub => {
                documents.push(new Document({
                    pageContent: sub.trim(),
                    metadata: {
                        destination: title,
                        type: "subsection",
                        source: "hotel_details.md"
                    }
                }));
            });
        });

        console.log(`Created ${documents.length} document chunks.`);

        // 3. Initialize Pinecone
        const pinecone = new Pinecone({
            apiKey: PINECONE_API_KEY as string
        });
        const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME as string);

        // 4. Initialize Embeddings
        const embeddings = new CohereEmbeddings({
            apiKey: process.env.COHERE_API_KEY,
            model: "embed-english-v3.0", // 1024 dimensions
        });

        // 5. Upsert to Pinecone
        console.log("Upserting to Pinecone...");
        await PineconeStore.fromDocuments(documents, embeddings, {
            pineconeIndex,
            maxConcurrency: 5, // Avoid rate limits
        });

        console.log("Ingestion complete!");

    } catch (error) {
        console.error("Ingestion failed:", error);
        process.exit(1);
    }
}

run();
