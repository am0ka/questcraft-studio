import { NextResponse } from 'next/server';
import { GraphSerializer } from '@questcraft/core-engine';
import { ExportRequest } from '@questcraft/shared-types';

export async function POST(request: Request) {
    try {
        const payload: ExportRequest = await request.json();
        const { graph, targetEngine, namespace } = payload;

        if (!graph) {
            return NextResponse.json(
                { error: 'Missing quest graph data' },
                { status: 400 }
            );
        }

        const result = GraphSerializer.exportCode(graph, targetEngine || 'json', namespace);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Failed to export code' },
            { status: 500 }
        );
    }
}
