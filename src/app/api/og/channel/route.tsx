/**
 * GET /api/og/channel — генерирует картинку для поста в Telegram-канал
 * Магия Карт (карта дня / гороскоп / фаза луны / число дня / совет).
 *
 * Рисуется сама (через next/og + Satori), без обращения к внешним
 * генераторам изображений — значит без вотемарок и в честном разрешении
 * 1080x1350, не завязана на низкокачественные ассеты карт из приложения.
 *
 * Query: type, title, subtitle, symbol (emoji/юникод-символ)
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const fontBold = fetch(new URL('../../../../assets/fonts/PT-Sans-Bold.ttf', import.meta.url)).then((r) =>
  r.arrayBuffer(),
);
const fontRegular = fetch(new URL('../../../../assets/fonts/PT-Sans-Regular.ttf', import.meta.url)).then((r) =>
  r.arrayBuffer(),
);

const WIDTH = 1080;
const HEIGHT = 1350;
const GOLD = '#d4af37';

// Детерминированный (без Math.random, чтобы не зависеть от рантайма)
// разброс "звёзд" на фоне — просто набор фиксированных координат разного
// размера и прозрачности.
const STARS = Array.from({ length: 60 }, (_, i) => {
  const x = (i * 137.5) % 100; // золотой угол — равномерный, не решётчатый разброс
  const y = (i * 71.3) % 100;
  const size = 2 + (i % 4);
  const opacity = 0.25 + ((i * 13) % 60) / 100;
  return { x, y, size, opacity };
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Магия Карт';
  const subtitle = searchParams.get('subtitle') || '';
  const symbol = searchParams.get('symbol') || '✨';

  const [boldData, regularData] = await Promise.all([fontBold, fontRegular]);

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#0d0a1f',
          backgroundImage:
            'radial-gradient(circle at 50% 15%, #2e1a5e 0%, #170f38 45%, #0a0718 100%)',
          fontFamily: 'PT Sans',
        }}
      >
        {/* звёзды */}
        {STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity: s.opacity,
              display: 'flex',
            }}
          />
        ))}

        {/* верхняя тонкая рамка */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: `2px solid ${GOLD}55`,
            borderRadius: 24,
            display: 'flex',
          }}
        />

        {/* контент по центру */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '0 90px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 190,
              height: 190,
              borderRadius: '50%',
              backgroundColor: '#1c1440',
              border: `3px solid ${GOLD}`,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 100,
              marginBottom: 56,
            }}
          >
            {symbol}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 40,
              color: GOLD,
              letterSpacing: 6,
              textTransform: 'uppercase',
              marginBottom: 24,
              fontFamily: 'PT Sans Bold',
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                display: 'flex',
                fontSize: 72,
                color: '#ffffff',
                fontFamily: 'PT Sans Bold',
                lineHeight: 1.15,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* подвал */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: 72,
          }}
        >
          <div style={{ display: 'flex', width: 120, height: 2, backgroundColor: `${GOLD}88`, marginBottom: 28 }} />
          <div
            style={{
              display: 'flex',
              fontSize: 34,
              color: GOLD,
              letterSpacing: 8,
              fontFamily: 'PT Sans Bold',
            }}
          >
            МАГИЯ КАРТ
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'PT Sans', data: regularData, weight: 400, style: 'normal' },
        { name: 'PT Sans Bold', data: boldData, weight: 700, style: 'normal' },
      ],
    },
  );
}
