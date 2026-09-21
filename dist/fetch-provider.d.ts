import { Type } from "typebox";
export declare function normalizeFetch(payload: any): {
    results: any;
    errors: any;
} | {
    results: any;
    errors?: undefined;
};
export declare function createFetchProvider(): {
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
            urls: Type.TArray<Type.TString>;
            format: Type.TOptional<Type.TUnion<[Type.TLiteral<"markdown">, Type.TLiteral<"html">, Type.TLiteral<"json">]>>;
            ttl: Type.TOptional<Type.TNumber>;
            purpose: Type.TOptional<Type.TString>;
        }>;
        execute: (args: any, execution?: {
            signal?: AbortSignal;
        }) => Promise<{
            results: any;
            errors: any;
        } | {
            results: any;
            errors?: undefined;
        }>;
    };
};
