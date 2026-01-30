import { Injectable, Logger } from '@nestjs/common';
import { Rule } from '@prisma/client';

@Injectable()
export class RulesEngine {
    private readonly logger = new Logger(RulesEngine.name);

    /**
     * Applies a set of rules to a given context (e.g. a Quote Item).
     * Returns the modified context.
     */
    applyRules(context: Record<string, any>, rules: Rule[]): Record<string, any> {
        const modifiedContext = { ...context };

        for (const rule of rules) {
            if (this.evaluateCondition(rule.conditions, modifiedContext)) {
                this.logger.log(`Rule matched: ${rule.name}`);
                this.executeAction(rule.actions, modifiedContext);
            }
        }

        return modifiedContext;
    }

    private evaluateCondition(condition: any, context: any): boolean {
        // Simple implementation: { "field": "quantity", "operator": "gte", "value": 10 }
        const { field, operator, value } = condition;
        const actualValue = context[field];

        if (actualValue === undefined) return false;

        switch (operator) {
            case 'gte': return actualValue >= value;
            case 'lte': return actualValue <= value;
            case 'eq': return actualValue === value;
            case 'gt': return actualValue > value;
            case 'lt': return actualValue < value;
            default: return false;
        }
    }

    private executeAction(action: any, context: any) {
        // Simple implementation: { "type": "DISCOUNT_PERCENT", "value": 0.1 }
        const { type, value } = action;

        switch (type) {
            case 'DISCOUNT_PERCENT':
                if (context.price) {
                    context.price = context.price * (1 - value);
                    context.appliedRules = [...(context.appliedRules || []), `DISCOUNT_PERCENT_${value}`];
                }
                break;
            // Add more actions here
        }
    }
}
