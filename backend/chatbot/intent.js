// intent.js — Classify query intent to route retrieval
// Returns: { section, needsExactMatch, intentType }

const INTENT_PATTERNS = [
    {
        intentType: 'side_effects',
        section: 'side_effects',
        needsExactMatch: false,
        patterns: [/side effect/i, /adverse/i, /reaction/i, /what happens if/i, /safe to take/i]
    },
    {
        intentType: 'drug_interactions',
        section: 'drug_interactions',
        needsExactMatch: true,  // exact drug names matter here
        patterns: [/interact/i, /combine/i, /taken with/i, /mix.*with/i, /together with/i]
    },
    {
        intentType: 'description',
        section: 'description',
        needsExactMatch: false,
        patterns: [/what is/i, /used for/i, /treats/i, /purpose of/i, /what does.*do/i]
    },
    {
        intentType: 'price',
        section: 'overview',
        needsExactMatch: true,
        patterns: [/price/i, /cost/i, /how much/i, /expensive/i, /cheap/i]
    },
    {
        intentType: 'alternatives',
        section: 'overview',
        needsExactMatch: true,
        patterns: [/alternative/i, /substitute/i, /generic/i, /instead of/i, /replace/i]
    },
    {
        intentType: 'dosage',
        section: 'description',
        needsExactMatch: false,
        patterns: [/dose/i, /dosage/i, /how much/i, /how many/i, /how often/i, /when to take/i]
    }
];

export function classifyIntent(query) {
    for (const intent of INTENT_PATTERNS) {
        if (intent.patterns.some(p => p.test(query))) {
            return intent;
        }
    }
    // Default: general question, search all sections
    return { intentType: 'general', section: null, needsExactMatch: false };
}