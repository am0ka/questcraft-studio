import { NextResponse } from 'next/server';
import { GraphValidator } from '@/engine';
import { QuestGraph } from '@/types';

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
