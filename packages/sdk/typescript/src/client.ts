import { RouteResponse, CandidateResult } from './types';

export class ToonForgeClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async health(): Promise<{ status: string; project: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }

  async route(payload: unknown): Promise<RouteResponse> {
    const res = await fetch(`${this.baseUrl}/api/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (!res.ok) throw new Error(`Routing failed: ${res.statusText}`);
    return res.json();
  }

  async serialize(payload: unknown, formatId: string): Promise<CandidateResult> {
    const res = await fetch(`${this.baseUrl}/api/serialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, format: formatId }),
    });
    if (!res.ok) throw new Error(`Serialization failed: ${res.statusText}`);
    return res.json();
  }
}
