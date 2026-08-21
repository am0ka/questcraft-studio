import { NextResponse } from 'next/server';
import { AIGenerateRequest, AIGenerateResponse } from '@questcraft/shared-types';

export async function POST(request: Request) {
    try {
        const body: AIGenerateRequest = await request.json();
        const prompt = body?.prompt || 'cyberpunk deal';
        const speaker = body?.speakerName || 'NPC';

        const scenarios: AIGenerateResponse[] = [
            {
                speaker: speaker || 'Shadowy Informant',
                message: `Regarding '${prompt}': The syndicate has already dispatched hunters to your location. Take the hidden tunnel!`,
                options: ['Take the tunnel', 'Draw weapons and fight', 'Bribe them with 100 gold'],
            },
            {
                speaker: speaker || 'Cyber-Doc',
                message: `Your neural scan indicates severe memory loss about '${prompt}'. I can repair it, but the bio-chip costs 150 credits.`,
                options: ['Pay credits', 'Refuse procedure', 'Demand answers'],
            },
            {
                speaker: speaker || 'Tavern Keeper',
                message: `Keep your voice down about '${prompt}'! The Baron's guards are listening in the corner.`,
                options: ['Lower voice and order ale', 'Confront the guards', 'Leave through the back door'],
            },
        ];

        const selected = scenarios[Math.floor(Math.random() * scenarios.length)];
        return NextResponse.json(selected);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to generate AI dialogue';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
