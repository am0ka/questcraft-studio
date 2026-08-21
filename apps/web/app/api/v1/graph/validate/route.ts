import { NextResponse } from 'next/server';
import { GraphValidator } from '@questcraft/core-engine';
import { QuestGraph } from '@questcraft/shared-types';

export async function POST(request: Request) {
    try {
        const payload: QuestGraph = await request.json();
        const result = GraphValidator.validate(payload);
        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to validate graph';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
