import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const topics = await prisma.topic.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { snippets: true }
                }
            }
        });
        
        return NextResponse.json({ topics });
    } catch (error: any) {
        console.error('Error fetching topics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, description } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Topic name is required' }, { status: 400 });
        }

        const topic = await prisma.topic.create({
            data: { 
                name,
                description
            }
        });

        return NextResponse.json({ topic }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating topic:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
