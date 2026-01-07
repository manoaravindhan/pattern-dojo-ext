import * as vscode from 'vscode';
import { PatternProvider, PatternViolation } from '../types';

/**
 * A composite pattern provider that delegates to the appropriate provider based on the document language.
 * This allows using specialized providers for specific languages (e.g. TypeScript) and generic ones for others.
 */
export class CompositePatternProvider implements PatternProvider {
    readonly name: string;
    readonly description: string;
    readonly patternName: string;
    private providers: Map<string, PatternProvider> = new Map();
    private defaultProvider?: PatternProvider;

    constructor(
        name: string,
        description: string,
        patternName: string,
        providers: { language: string | string[], provider: PatternProvider }[],
        defaultProvider?: PatternProvider
    ) {
        this.name = name;
        this.description = description;
        this.patternName = patternName;
        this.defaultProvider = defaultProvider;

        for (const entry of providers) {
            const langs = Array.isArray(entry.language) ? entry.language : [entry.language];
            for (const lang of langs) {
                this.providers.set(lang, entry.provider);
            }
        }
    }

    async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
        const provider = this.providers.get(document.languageId) || this.defaultProvider;
        if (provider) {
            const result = provider.analyze(document);
            return result instanceof Promise ? await result : result;
        }
        return [];
    }
}
