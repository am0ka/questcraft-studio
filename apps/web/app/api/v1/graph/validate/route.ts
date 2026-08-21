import { NextResponse } from 'next/server';
import { GraphValidator } from '@questcraft/core-engine';
import { QuestGraph } from '@questcraft/shared-types';

export async function POST(request: Request) {
    try {
        const payload: QuestGraph = await request.json();
        const result = GraphValidator.validate(payload);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Failed to validate graph' },
            { status: 500 }
        );
    }
}
