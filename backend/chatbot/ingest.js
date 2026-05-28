// ingest.js — Hierarchical chunking
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
import Database from 'better-sqlite3';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';

const db = new Database('./drugs.db');

// ─── Split one medicine row into multiple focused section chunks ───────────────
function createSectionChunks(row) {
    const base = {
        product_name: row.product_name,
        sub_category: row.sub_category,
        salt_composition: row.salt_composition,
        product_price: String(row.product_price ?? ''),
        product_manufactured: row.product_manufactured ?? '',
    };

    const chunks = [];

    // 1. Overview chunk (always created)
    chunks.push({
        id: `${row.product_name}__overview`,
        section: 'overview',
        text: `Medicine: ${row.product_name}
    Category: ${row.sub_category}
Composition: ${row.salt_composition}
Manufacturer: ${row.product_manufactured}
Price: ${row.product_price}`,
        metadata: { ...base, section: 'overview' }
    });

    // 2. Description chunk
    if (row.medicine_desc?.trim()) {
        chunks.push({
            id: `${row.product_name}__description`,
            section: 'description',
            text: `Medicine: ${row.product_name}
Section: Description
${row.medicine_desc.substring(0, 400)}`,
            metadata: { ...base, section: 'description' }
        });
    }

    // 3. Side effects chunk
    if (row.side_effects?.trim()) {
        chunks.push({
            id: `${row.product_name}__side_effects`,
            section: 'side_effects',
            text: `Medicine: ${row.product_name}
Section: Side Effects
${row.side_effects.substring(0, 300)}`,
            metadata: { ...base, section: 'side_effects' }
        });
    }

    // 4. Drug interactions chunk
    if (row.drug_interactions?.trim() && row.drug_interactions !== '{}') {
        // Parse JSON interactions into readable text
        let interactionText = row.drug_interactions;
        try {
            const parsed = JSON.parse(row.drug_interactions);
            const drugs = parsed.drug ?? [];
            const brands = parsed.brand ?? [];
            const effects = parsed.effect ?? [];
            interactionText = drugs.map((d, i) =>
                `${d}${brands[i] ? ` (${brands[i]})` : ''}: ${effects[i] ?? 'interaction noted'}`
            ).join('\n');
        } catch { }

        chunks.push({
            id: `${row.product_name}__interactions`,
            section: 'drug_interactions',
            text: `Medicine: ${row.product_name}
Section: Drug Interactions
${interactionText.substring(0, 400)}`,
            metadata: { ...base, section: 'drug_interactions' }
        });
    }

    return chunks;
}

async function ingest() {
    console.log('⏳ Loading embedder...');
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

    const existingIndexes = await pc.listIndexes();
    const indexNames = existingIndexes.indexes?.map(i => i.name) ?? [];

    if (!indexNames.includes(process.env.PINECONE_INDEX)) {
        await pc.createIndex({
            name: process.env.PINECONE_INDEX,
            dimension: 384,
            metric: 'cosine',
            spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
        });
        console.log('🆕 Index created, waiting 30s...');
        await new Promise(r => setTimeout(r, 30000));
    }

    const index = pc.index(process.env.PINECONE_INDEX);

    // Deduplicate by product_name
    const rows = db.prepare(`
    SELECT sub_category, product_name, salt_composition,
           product_price, product_manufactured,
           medicine_desc, side_effects, drug_interactions
    FROM medicines
    GROUP BY product_name
  `).all();

    console.log(`📦 ${rows.length} unique medicines → building section chunks...`);

    const allChunks = rows.flatMap(createSectionChunks);
    console.log(`📄 Total chunks to embed: ${allChunks.length}`);

    if (allChunks.length === 0) {
        console.log('⚠️ No chunks created. Check if database has content.');
        return;
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
        const batch = allChunks.slice(i, i + BATCH_SIZE);
        const vectors = [];

        for (const chunk of batch) {
            const output = await embedder(chunk.text, { pooling: 'mean', normalize: true });
            vectors.push({
                id: chunk.id.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 512),
                values: Array.from(output.data),
                metadata: { ...chunk.metadata, chunk: chunk.text }
            });
        }

        if (vectors.length > 0) {
            await index.upsert({ records: vectors });
            console.log(`✅ ${Math.min(i + BATCH_SIZE, allChunks.length)} / ${allChunks.length}`);
        } else {
            console.warn(`⚠️ Warning: Batch starting at ${i} produced no vectors. Skipping upsert.`);
        }
    }

    console.log('🎉 Ingestion complete!');
}

ingest().catch(console.error);