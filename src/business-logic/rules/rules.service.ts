import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';

@Injectable()
export class RulesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateRuleDto) {
        return this.prisma.rule.create({
            data: {
                ...data,
                conditions: JSON.stringify(data.conditions), // SQLite Compat
                actions: JSON.stringify(data.actions),       // SQLite Compat
            }
        });
    }

    async findAll(companyId: string) {
        return this.prisma.rule.findMany({
            where: { companyId },
            orderBy: { priority: 'desc' },
        });
    }

    /**
     * Evaluates a list of rules against a context (e.g. quantity, totalAmount).
     */
    evaluate(rules: any[], context: any): any[] {
        const applied = [];
        for (const rule of rules) {
            try {
                const condition = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
                if (this.checkCondition(condition, context)) {
                    applied.push({
                        ruleId: rule.id,
                        name: rule.name,
                        action: typeof rule.actions === 'string' ? JSON.parse(rule.actions) : rule.actions
                    });
                }
            } catch (e) {
                console.error(`Failed to evaluate rule ${rule.id}`, e);
            }
        }
        return applied;
    }

    private checkCondition(condition: any, context: any): boolean {
        // Simple evaluator: field, operator, value
        // Ex: { field: "quantity", operator: "gte", value: 50 }
        if (!condition || !condition.field) return true; // No condition = always apply?

        const valueToCheck = context[condition.field];
        const targetValue = condition.value;

        switch (condition.operator) {
            case 'gte': return valueToCheck >= targetValue;
            case 'gt': return valueToCheck > targetValue;
            case 'lte': return valueToCheck <= targetValue;
            case 'lt': return valueToCheck < targetValue;
            case 'eq': return valueToCheck == targetValue;
            default: return false;
        }
    }
}
