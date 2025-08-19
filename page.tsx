"use client";

import { useState, useEffect } from 'react';
import JSZip from 'jszip';

// Types for clarity
type GenInput = {
  businessName: string;
  description: string;
  category: string;
};

type GenResult = {
  headline: string;
  subheadline: string;
  about: string;
  services: string[];
  cta: string;
  keywords: string[];
  color: string;
  imageUrl: string;
};

const SAMPLE_INPUT: GenInput = {
  businessName: 'Peacock Salon',
  description: 'Premium hair & beauty salon in Indore. Haircuts, styling, skincare, makeup, and bridal packages.',
  category: 'salon',
};

export default function DemoPage() {
  const [input, setInput] = useState<GenInput>({ businessName: '', description: '', category: 'default' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenResult | null>(null);
  const [edit, setEdit] = useState<GenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);

  // Synchronize edit with result when result changes
  useEffect(() => {
    if (result) {
      setEdit({ ...result });
    }
  }, [result]);

  async function generate(payload: GenInput) {
    setLoading(true);
    setError(null);
    setPublishUrl(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const data = await res.json();
      setResult(data as GenResult);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function exportZip() {
    if (!edit) return;
    const zip = new JSZip();
    const html = buildHtml(edit);
    zip.file('index.html', html);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webmake-site.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Build HTML string for static site export and publishing
   */
  function buildHtml(data: GenResult): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${data.headline}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; margin:0; color:#111; }
    .hero{ background: linear-gradient(135deg, ${data.color}, #111827); color:white; padding:64px 20px; }
    .container{ max-width: 960px; margin:0 auto; padding:0 16px; }
    .card{ background:#fff; border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,.08); padding:24px; margin:16px 0; }
    .btn{ background:${data.color}; color:white; border-radius:10px; padding:12px 18px; text-decoration:none; display:inline-block; }
    .services li { margin: 6px 0; }
    .hero-img { width:100%; border-radius:16px; margin-top:16px; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <h1>${data.headline}</h1>
      <p>${data.subheadline}</p>
      <a href="https://wa.me/9580378761" class="btn">${data.cta || 'Contact Us'}</a>
      <img class="hero-img" src="${data.imageUrl}" alt="hero" />
    </div>
  </header>
  <main class="container">
    <section class="card">
      <h2>About Us</h2>
      <p>${data.about}</p>
    </section>
    <section class="card">
      <h2>Our Services</h2>
      <ul class="services">
        ${data.services.map((s) => `<li>• ${s}</li>`).join('')}
      </ul>
    </section>
  </main>
  <footer class="container" style="padding:32px 16px;opacity:.7;">
    © ${new Date().getFullYear()} ${data.headline}
  </footer>
</body>
</html>`;
  }

  async function publish(provider: 'vercel' | 'netlify') {
    if (!edit) return;
    setPublishing(provider);
    setError(null);
    setPublishUrl(null);
    try {
      const html = buildHtml(edit);
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Publish failed (${res.status})`);
      setPublishUrl(data.url);
    } catch (e: any) {
      setError(e.message || 'Publishing error.');
    } finally {
      setPublishing(null);
    }
  }

  return (
    <div className="container-custom py-12">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="mb-2 text-2xl font-semibold">Build Your Website</h2>
          <label>Business Name</label>
          <input
            placeholder="e.g., Peacock Salon"
            value={input.businessName}
            onChange={(e) => setInput({ ...input, businessName: e.target.value })}
            className="mt-1"
          />
          <label className="mt-4 block">Brief Description</label>
          <textarea
            rows={5}
            placeholder="Describe your business..."
            value={input.description}
            onChange={(e) => setInput({ ...input, description: e.target.value })}
            className="mt-1"
          />
          <label className="mt-4 block">Template Variant</label>
          <select
            value={input.category}
            onChange={(e) => setInput({ ...input, category: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="default">General Services</option>
            <option value="restaurant">Restaurant</option>
            <option value="salon">Salon</option>
          </select>
          <div className="mt-4 flex flex-wrap gap-3">
            <button disabled={loading} className="btn btn-primary" onClick={() => generate(input)}>
              {loading ? 'Generating...' : 'Generate Website'}
            </button>
            <button disabled={loading} className="btn btn-outline" onClick={() => generate(SAMPLE_INPUT)}>
              Try the Demo
            </button>
          </div>
          {error && <p className="mt-3 text-red-600">{error}</p>}
        </div>

        <div className="card">
          <h2 className="mb-4 text-2xl font-semibold">Live Preview & Editor</h2>
          {!edit && <p className="text-gray-600">Fill the form or click <strong>Try the Demo</strong> to see a generated site.</p>}
          {edit && (
            <>
              {/* Editor fields */}
              <div className="space-y-4">
                <div>
                  <label className="block">Headline</label>
                  <input
                    value={edit.headline}
                    onChange={(e) => setEdit({ ...edit!, headline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block">Subheadline</label>
                  <input
                    value={edit.subheadline}
                    onChange={(e) => setEdit({ ...edit!, subheadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block">About</label>
                  <textarea
                    rows={3}
                    value={edit.about}
                    onChange={(e) => setEdit({ ...edit!, about: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block">Services (one per line)</label>
                  <textarea
                    rows={3}
                    value={edit.services.join('\n')}
                    onChange={(e) => setEdit({ ...edit!, services: e.target.value.split('\n').filter(Boolean) })}
                  />
                </div>
                <div>
                  <label className="block">Call To Action</label>
                  <input
                    value={edit.cta}
                    onChange={(e) => setEdit({ ...edit!, cta: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block">Color (hex)</label>
                  <input
                    type="color"
                    value={edit.color}
                    onChange={(e) => setEdit({ ...edit!, color: e.target.value })}
                    className="w-16 h-10 p-0 border-none"
                  />
                </div>
              </div>
              {/* Preview */}
              <div className="mt-6 rounded-2xl overflow-hidden border">
                <div
                  className="p-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${edit.color}, #111827)` }}
                >
                  <h3 className="text-2xl font-bold">{edit.headline}</h3>
                  <p className="opacity-90">{edit.subheadline}</p>
                </div>
                <img src={edit.imageUrl} alt="Hero" className="w-full" />
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold">About Us</h4>
                    <p className="text-gray-700">{edit.about}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Our Services</h4>
                    <ul className="list-disc pl-6">
                      {edit.services.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2">
                    <a className="btn btn-primary" href="https://wa.me/9580378761" target="_blank">
                      {edit.cta || 'Contact Us'}
                    </a>
                  </div>
                </div>
              </div>
              {/* Export and Publish */}
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="btn btn-outline" onClick={exportZip}>
                  Export ZIP
                </button>
                <button
                  className="btn btn-outline"
                  disabled={publishing === 'vercel'}
                  onClick={() => publish('vercel')}
                >
                  {publishing === 'vercel' ? 'Publishing...' : 'Publish to Vercel'}
                </button>
                <button
                  className="btn btn-outline"
                  disabled={publishing === 'netlify'}
                  onClick={() => publish('netlify')}
                >
                  {publishing === 'netlify' ? 'Publishing...' : 'Publish to Netlify'}
                </button>
              </div>
              {/* Publish Result */}
              {publishUrl && (
                <p className="mt-3 text-green-700">
                  Published! Visit your site: <a href={publishUrl} target="_blank" className="underline text-green-800">{publishUrl}</a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}