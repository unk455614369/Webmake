import {NextResponse} from 'next/server'; import {z} from 'zod'; import {generateWebsite} from '@/lib/agent';
const schema=z.object({name:z.string(),category:z.string(),audience:z.string(),goal:z.string(),voice:z.string(),colors:z.array(z.string()),services:z.array(z.string()),proof:z.array(z.string()),contacts:z.array(z.string()),summary:z.string()});
export async function POST(req:Request){try{return NextResponse.json(await generateWebsite(schema.parse(await req.json())))}catch(e:any){return NextResponse.json({error:e?.message||'Generation failed'},{status:400})}}
