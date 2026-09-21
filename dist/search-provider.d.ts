import { Type } from "typebox";
export declare function normalizeSearch(payload: any): {
    results: any;
};
export declare function createSearchProvider(): {
    id: string;
    label: string;
    hint: string;
    envVars: string[];
    placeholder: string;
    signupUrl: string;
    credentialPath: string;
    requiresCredential: boolean;
    getCredentialValue: (config?: Record<string, unknown>) => unknown;
    setCredentialValue: (target: Record<string, unknown>, value: unknown) => void;
    createTool: (ctx: any) => {
        description: string;
        parameters: Type.TObject<{
            query: Type.TString;
            count: Type.TOptional<Type.TNumber>;
            language: Type.TOptional<Type.TString>;
            country: Type.TOptional<Type.TString>;
            freshness: Type.TOptional<Type.TString>;
            domains: Type.TOptional<Type.TArray<Type.TString>>;
        }>;
        execute: (args: any, execution?: {
            signal?: AbortSignal;
        }) => Promise<{
            results: any;
        }>;
    };
};
