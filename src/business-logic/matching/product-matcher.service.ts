import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface ProductMatch {
    product: any;
    score: number; // 0 to 1
    reason: string;
}

@Injectable()
export class ProductMatcherService {
    private readonly logger = new Logger(ProductMatcherService.name);

    constructor(private prisma: PrismaService) { }

    async findBestMatch(companyId: string, hint: string, category?: string): Promise<ProductMatch | null> {
        // 1. Get Candidates (optionally filter by category to speed up)
        const where: any = { companyId };
        if (category) {
            // where.category = category; // Strict category match? Or fuzzy? 
            // Better to fetch all and score if dataset is small (<1000). 
            // For MVP (50 items), strict is risky if AI hallucinates category.
        }

        const products = await this.prisma.product.findMany({
            where,
            include: { unit: true }
        });

        // 2. Score Candidates
        const matches: ProductMatch[] = products.map(p => {
            const score = this.calculateScore(hint, p);
            return { product: p, score, reason: 'scored' };
        });

        // 3. Sort by Score
        matches.sort((a, b) => b.score - a.score);

        // 4. Return Top if reliable
        if (matches.length > 0 && matches[0].score > 0.4) {
            return matches[0];
        }

        return null;
    }

    private calculateScore(hint: string, product: any): number {
        const queryTerms = hint.toLowerCase().split(' ');
        const productText = `${product.name} ${product.material || ''} ${product.category || ''} ${product.tags || ''}`.toLowerCase();

        let matchedTerms = 0;
        for (const term of queryTerms) {
            if (productText.includes(term)) matchedTerms++;
        }

        return matchedTerms / queryTerms.length;
    }
}
