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

    async update(id: string, data: any) {
        // Handle JSON stringification if part of update
        const updateData = { ...data };
        if (data.conditions && typeof data.conditions !== 'string') updateData.conditions = JSON.stringify(data.conditions);
        if (data.actions && typeof data.actions !== 'string') updateData.actions = JSON.stringify(data.actions);

        return this.prisma.rule.update({
            where: { id },
            data: updateData
        });
    }

    async remove(id: string) {
        return this.prisma.rule.delete({ where: { id } });
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
            case 'contains_all':
                if (!Array.isArray(valueToCheck) || !Array.isArray(targetValue)) return false;
                return targetValue.every(v => valueToCheck.includes(v));
            default:
                // Handle special hardware conditions (require_categories)
                if (condition.require_categories && context.allCategories) {
                    return (condition.require_categories as string[]).every((cat: string) => (context.allCategories as string[]).includes(cat));
                }
                return false;
        }
    }
}
