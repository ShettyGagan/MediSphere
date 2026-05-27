// query.js — Production RAG: vector search + metadata filter + citations + hallucination guard
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import Groq from 'groq-sdk';
import { Langfuse } from 'langfuse';
import { classifyIntent } from './intent.js';

// Initialize environment variables first
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Clients & Constants ──────────────────────────────────────────────────────
const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_HOST
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = 'llama-3.1-8b-instant';

// Pre-compiled regex patterns for input guardrails
const INJECTION_PATTERNS = [
    /ignore previous/i,
    /you are now/i,
    /disregard.*instructions/i,
    /jailbreak/i
];

const OFF_TOPIC_PATTERNS = [
    /write.*poem/i,
    /tell.*joke/i,
    /recipe for/i,
    /weather/i
];

// Common terms exempt from hallucination checks
const HALLUCINATION_EXEMPTIONS = new Set([
    'please', 'consult', 'doctor', 'section', 'medicine', 'source',
    'always', 'never', 'however', 'therefore', 'important'
]);

let _embedder = null;
let _reranker = null;
let _pineconeIndex = null;

// ─── Service Providers ────────────────────────────────────────────────────────
async function getEmbedder() {
    if (!_embedder) {
        _embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return _embedder;
}

async function getReranker() {
    if (!_reranker) {
        _reranker = await pipeline('text-classification', 'Xenova/ms-marco-MiniLM-L-6-v2');
    }
    return _reranker;
}

async function getPineconeIndex() {
    if (!_pineconeIndex) {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        _pineconeIndex = pc.index(process.env.PINECONE_INDEX);
    }
    return _pineconeIndex;
}

// ─── Guardrails ───────────────────────────────────────────────────────────────
function guardInput(query) {
    const q = query.trim();
    if (q.length < 5) {
        return { blocked: true, reason: 'Query too short.' };
    }
    if (q.length > 500) {
        return { blocked: true, reason: 'Query too long. Keep it under 500 characters.' };
    }
    
    if (INJECTION_PATTERNS.some(p => p.test(q))) {
        return { blocked: true, reason: 'Invalid query.' };
    }
    if (OFF_TOPIC_PATTERNS.some(p => p.test(q))) {
        return { blocked: true, reason: 'I only answer medical questions.' };
    }
    
    return { blocked: false };
}

// ─── Vector Search ────────────────────────────────────────────────────────────
async function vectorSearch(query, intent, topK = 10) {
    // 1. Embed query
    const embedder = await getEmbedder();
    const output = await embedder(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    // 2. Pinecone vector search with optional metadata filter
    const index = await getPineconeIndex();
    const filter = intent.section ? { section: { $eq: intent.section } } : undefined;

    const vectorResults = await index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter
    });

    // 3. Map directly to the format expected by the reranker
    return vectorResults.matches.map(m => ({
        vectorScore: m.score,
        metadata: m.metadata,
        chunk: m.metadata?.chunk ?? ''
    }));
}

// ─── Rerank ───────────────────────────────────────────────────────────────────
async function rerank(query, candidates, topN = 3) {
    const reranker = await getReranker();
    const scored = await Promise.all(
        candidates.map(async (c) => {
            const text = c.chunk || c.metadata?.chunk || '';
            const result = await reranker(`${query} [SEP] ${text}`, { topk: 1 });
            const score = Array.isArray(result) ? result[0].score : result.score;
            return { ...c, rerankerScore: score };
        })
    );
    return scored.sort((a, b) => b.rerankerScore - a.rerankerScore).slice(0, topN);
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────
function buildPrompt(query, topChunks) {
    const context = topChunks
        .map((c, i) => {
            const name = c.metadata?.product_name ?? `Source ${i + 1}`;
            const sec = c.metadata?.section ?? 'general';
            return `[${i + 1}] ${name} — ${sec}\n${c.chunk || c.metadata?.chunk}`;
        })
        .join('\n\n---\n\n');

    return {
        system: `You are HealthConnect's medical information assistant.
Answer questions about medications using ONLY the provided context.

CITATION RULES (mandatory):
- After every factual claim, add a citation like [1], [2], or [3] referencing the source number.
- Example: "Metformin is used to treat diabetes [1]. Common side effects include nausea [2]."
- Never state facts without a citation.

SAFETY RULES:
- If the context doesn't contain the answer, say exactly: "I don't have verified information about that."
- Never suggest dosages without a doctor consultation note.
- Always end with the disclaimer if the question involves dosage, diagnosis, or interactions.

Context:
${context}`,
        user: query
    };
}

// ─── Inference ────────────────────────────────────────────────────────────────
async function generate(prompt) {
    const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
        ],
        temperature: 0.2, // lower = more faithful to context
        max_tokens: 600
    });
    return {
        answer: completion.choices[0].message.content,
        usage: completion.usage
    };
}

// ─── Hallucination Guard ──────────────────────────────────────────────────────
function hallucinationCheck(answer, topChunks) {
    const retrievedNames = topChunks
        .map(c => c.metadata?.product_name?.toLowerCase())
        .filter(Boolean);

    // Extract drug-like capitalized words from the answer (simple heuristic)
    const mentionedWords = [...answer.matchAll(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g)]
        .map(m => m[0].toLowerCase());

    const suspicious = mentionedWords.filter(word =>
        word.length > 4 &&
        !retrievedNames.some(name => name.includes(word)) &&
        !HALLUCINATION_EXEMPTIONS.has(word)
    );

    // Flag if more than 2 unrecognized drug-like terms appear
    return { passed: suspicious.length <= 2, suspicious };
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
export async function ragQuery(query, patientId = null) {
    const trace = langfuse.trace({
        name: 'rag-query',
        userId: patientId ?? 'anonymous',
        input: { query },
        metadata: { timestamp: new Date().toISOString() }
    });

    try {
        // 1. Guardrails
        const guardSpan = trace.span({ name: 'guardrails', input: { query } });
        const guard = guardInput(query);
        guardSpan.end({ output: guard });
        if (guard.blocked) {
            trace.update({ output: { blocked: true } });
            await langfuse.flushAsync();
            return { answer: guard.reason, blocked: true, traceId: trace.id };
        }

        // 2. Intent classification
        const intentSpan = trace.span({ name: 'intent-classification', input: { query } });
        const intent = classifyIntent(query);
        intentSpan.end({ output: intent });

        // 3. Vector search
        const searchSpan = trace.span({ name: 'vector-search', input: { intent } });
        const t1 = Date.now();
        const candidates = await vectorSearch(query, intent, 10);
        searchSpan.end({ output: { count: candidates.length }, latencyMs: Date.now() - t1 });

        if (candidates.length === 0) {
            await langfuse.flushAsync();
            return { answer: "I couldn't find relevant information. Please rephrase.", traceId: trace.id };
        }

        // 4. Rerank
        const rerankSpan = trace.span({ name: 'reranker', input: { count: candidates.length } });
        const t2 = Date.now();
        const topChunks = await rerank(query, candidates, 3);
        rerankSpan.end({
            output: { top: topChunks.map(c => ({ name: c.metadata?.product_name, score: c.rerankerScore })) },
            latencyMs: Date.now() - t2
        });

        // 5. Build prompt
        const prompt = buildPrompt(query, topChunks);

        // 6. Generate
        const generation = trace.generation({
            name: 'groq-llama3',
            model: GROQ_MODEL,
            input: prompt,
            modelParameters: { temperature: 0.2, maxTokens: 600 }
        });
        const t3 = Date.now();
        const { answer, usage } = await generate(prompt);
        generation.end({
            output: answer,
            usage: { 
                promptTokens: usage.prompt_tokens, 
                completionTokens: usage.completion_tokens, 
                totalTokens: usage.total_tokens 
            },
            latencyMs: Date.now() - t3
        });

        // 7. Hallucination check
        const hallucinationSpan = trace.span({ name: 'hallucination-check', input: { answer } });
        const hallCheck = hallucinationCheck(answer, topChunks);
        hallucinationSpan.end({ output: hallCheck });

        // Append disclaimer
        const DISCLAIMER = "\n\n⚕️ *Please consult your doctor before making any changes to your medication.*";
        const finalAnswer = answer.includes('consult your doctor') ? answer : answer + DISCLAIMER;

        // Build structured citations
        const citations = topChunks.map((c, i) => ({
            index: i + 1,
            name: c.metadata?.product_name ?? 'Unknown',
            section: c.metadata?.section ?? 'general',
            score: c.rerankerScore?.toFixed(3)
        }));

        trace.update({ output: { answer: finalAnswer, citations, hallucinationPassed: hallCheck.passed } });
        await langfuse.flushAsync();

        return {
            answer: finalAnswer,
            citations,
            hallucinationPassed: hallCheck.passed,
            intentDetected: intent.intentType,
            traceId: trace.id
        };

    } catch (err) {
        trace.update({ output: { error: err.message }, level: 'ERROR' });
        await langfuse.flushAsync();
        throw err;
    }
}