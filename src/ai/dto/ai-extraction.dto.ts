export interface AiExtractedItem {
    description: string;
    quantity: number;
    unit: string;
    material_hint?: string;
    dimensions_hint?: string;
    category_hint?: string;
}

export interface AiExtractionResult {
    intent: string; // e.g. "NEW_QUOTE", "STATUS_CHECK"
    confidence: number;
    items: AiExtractedItem[];
    warnings?: string[];
}
