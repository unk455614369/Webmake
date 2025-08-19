import { NextResponse } from 'next/server';
import JSZip from 'jszip';
// form-data is used to create multipart/form-data payloads for Netlify deployment.
import FormData from 'form-data';

// This API route handles deployment of a generated static site to either Vercel or Netlify.
// It accepts a POST request with `html` and `provider` in the body. Based on the provider, it
// either returns a zipped file (if tokens are missing) or attempts to publish directly using
// provider APIs. To publish successfully, set environment variables:
//  - For Vercel: VERCEL_TOKEN and VERCEL_PROJECT_ID (the slug of your project). Optionally
//    VERCEL_TEAM_ID if deploying under a team account.
//  - For Netlify: NETLIFY_TOKEN and NETLIFY_SITE_ID.
// The route returns JSON with either a `message` (instructions), an error, or the `url`
// of the deployed site.

export async function POST(request: Request) {
  try {
    const { html, provider } = await request.json();
    if (!html || !provider) {
      return NextResponse.json({ error: 'Missing html or provider' }, { status: 400 });
    }

    // Generate a zip archive containing index.html. Additional assets could be added here.
    const zip = new JSZip();
    zip.file('index.html', html);
    // Add a minimal package.json to allow Vercel/Netlify to detect static deployment.
    zip.file('package.json', JSON.stringify({ name: 'webmake-site', version: '1.0.0' }, null, 2));
    const zipped = await zip.generateAsync({ type: 'nodebuffer' });

    // Publish based on provider
    if (provider === 'netlify') {
      const token = process.env.NETLIFY_TOKEN;
      const siteId = process.env.NETLIFY_SITE_ID;
      if (!token || !siteId) {
        // Return base64 zip and instructions if credentials are missing
        const base64zip = Buffer.from(zipped).toString('base64');
        return NextResponse.json({
          message: 'NETLIFY_TOKEN and NETLIFY_SITE_ID must be set as environment variables to deploy.',
          zipBase64: base64zip,
        });
      }
      // Construct form data for Netlify deploy. Use form-data package since Node
      // does not provide a native FormData implementation. Append the zip
      // buffer directly. form-data will set appropriate headers.
      const formData = new FormData();
      formData.append('file', zipped, {
        filename: 'site.zip',
        contentType: 'application/zip',
      });
      const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: 'Netlify deploy failed', details: errText }, { status: 500 });
      }
      const result = await res.json();
      return NextResponse.json({ url: result.deploy_url || result.url });
    }
    if (provider === 'vercel') {
      const token = process.env.VERCEL_TOKEN;
      const projectId = process.env.VERCEL_PROJECT_ID;
      const teamId = process.env.VERCEL_TEAM_ID;
      if (!token || !projectId) {
        const base64zip = Buffer.from(zipped).toString('base64');
        return NextResponse.json({
          message: 'VERCEL_TOKEN and VERCEL_PROJECT_ID must be set as environment variables to deploy.',
          zipBase64: base64zip,
        });
      }
      // The Vercel deployment API expects an array of file definitions. Each file must include
      // a unique SHA. We generate a single file for index.html.
      const data = Buffer.from(html);
      const sha = await sha1(data);
      const files = [
        {
          file: 'index.html',
          data: data.toString('base64'),
          sha,
        },
        {
          file: 'package.json',
          data: Buffer.from(JSON.stringify({ name: 'webmake-site', version: '1.0.0' })).toString('base64'),
          sha: await sha1(Buffer.from(JSON.stringify({ name: 'webmake-site', version: '1.0.0' }))),
        },
      ];
      const body: any = {
        name: `webmake-site-${Date.now()}`,
        project: projectId,
        files,
        target: 'production',
      };
      if (teamId) body.teamId = teamId;
      const res = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: 'Vercel deploy failed', details: errText }, { status: 500 });
      }
      const result = await res.json();
      return NextResponse.json({ url: result.url || result.inspectorUrl });
    }
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

// Compute SHA1 for a Buffer. This function uses the SubtleCrypto API available in
// the edge runtime environment. If not available, fallback to Node crypto.
async function sha1(data: Buffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-1', data);
    return Buffer.from(hash).toString('hex');
  } else {
    const { createHash } = await import('crypto');
    return createHash('sha1').update(data).digest('hex');
  }
}