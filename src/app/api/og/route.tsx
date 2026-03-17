import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rank = searchParams.get('rank') || '?';
  const league = searchParams.get('league') || 'FounderLeague';
  const score = searchParams.get('score') || '0';
  const category = searchParams.get('category') || 'Readiness';
  const name = searchParams.get('name') || 'Founder';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          fontFamily: 'system-ui',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(circle at 30% 40%, rgba(99, 102, 241, 0.15), transparent 60%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '24px',
              color: '#818cf8',
              fontWeight: 700,
            }}
          >
            <span>🏆</span>
            <span>FounderLeague</span>
          </div>

          {/* Rank */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: 800,
              color: '#e2e8f0',
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
            }}
          >
            <span style={{ color: '#818cf8' }}>#{rank}</span>
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: '32px',
              color: '#e2e8f0',
              fontWeight: 600,
            }}
          >
            {name}
          </div>

          {/* Score */}
          <div
            style={{
              fontSize: '20px',
              color: '#94a3b8',
              display: 'flex',
              gap: '16px',
            }}
          >
            <span>
              {category}: {score}
            </span>
            <span>•</span>
            <span>{league}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
