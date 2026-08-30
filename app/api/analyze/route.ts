import {NextResponse} from 'next/server'; import {z} from 'zod'; import {analyzeBusiness} from '@/lib/agent';
export const runtime='nodejs';
const httpUrl=z.string().url().refine(v=>{try{return ['http:','https:'].includes(new URL(v).protocol)}catch{return false}},{message:'Only http/https URLs are supported'});
const schema=z.object({urls:z.array(httpUrl).max(6),notes:z.string().max(12000).default('')});
export async function POST(req:Request){try{const data=schema.parse(await req.json()); return NextResponse.json(await analyzeBusiness(data));}catch(e:any){return NextResponse.json({error:e?.issues?.[0]?.message||e?.message||'Analysis failed'},{status:400})}}
