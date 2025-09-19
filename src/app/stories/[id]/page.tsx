'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/media';

type Story = {
  id: number;
  title: string;
  content?: string | null;
  cover?: string | null;
  published_at?: string | null;
  author_name?: string | null;
};

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [story, setStory] = React.useState<Story | null>(null);
  const [more, setMore] = React.useState<Story[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [sharing, setSharing] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const r = await http.get(`/api/stories/${id}/`);
        if (!cancelled) {
          const s: Story = r.data;
          setStory({ ...s, cover: s.cover ? mediaUrl(s.cover) : null });
        }
        const r2 = await http.get('/api/stories/', { params: { limit: 4 } });
        if (!cancelled) {
          const list: Story[] = (r2.data?.results ?? r2.data ?? []) as Story[];
          const normalized = list
            .filter((x) => String(x.id) !== String(id))
            .slice(0, 3)
            .map((x) => ({ ...x, cover: x.cover ? mediaUrl(x.cover) : null }));
          setMore(normalized);
        }
      } catch {
        if (!cancelled) setErr('Не вдалося завантажити історію');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
    } catch {
      return iso;
    }
  };

  const onShare = async () => {
    try {
      setSharing(true);
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if ((navigator as any).share) {
        await (navigator as any).share({ title: story?.title ?? 'Історія', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Посилання скопійовано в буфер обміну');
      }
    } catch {
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <main className="wrap">
        <div className="container">
          <div className="skeleton hero" />
          <div className="skeleton title" />
          <div className="skeleton meta" />
          <div className="skeleton p" />
          <div className="skeleton p" />
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (err || !story) {
    return (
      <main className="wrap">
        <div className="container err">
          <p>{err ?? 'Історію не знайдено'}</p>
          <button className="btn" onClick={() => router.back()}>← Назад</button>
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  const contentBlocks = (story.content || '').trim()
    ? story.content!.split(/\n{2,}/g)
    : ['Наразі докладний текст цієї історії відсутній. Ми доповнимо її найближчим часом.'];

  return (
    <main className="wrap">
      {/* HERO */}
      <section className="heroSec">
        <div className="hero">
          {story.cover && <div className="heroBg" style={{ backgroundImage: `url("${story.cover}")` }} />}
          <div className="overlay" />
          <div className="heroInner">
            <button className="ghost back" onClick={() => router.back()} aria-label="Назад">← Назад</button>

            {story.cover ? (
              <div className="heroImg">
                <img src={story.cover} alt={story.title} />
              </div>
            ) : (
              <div className="heroPlaceholder">Історія</div>
            )}

            <h1 className="title">{story.title}</h1>
            <div className="meta">
              {story.author_name ? <span className="chip">Автор: {story.author_name}</span> : null}
              {story.published_at ? <span className="dot" /> : null}
              {story.published_at ? <span className="chip">{fmtDate(story.published_at)}</span> : null}
            </div>
            <div className="actions">
              <button className="btn share" onClick={onShare} disabled={sharing}>{sharing ? '...' : 'Поділитись'}</button>
              <Link href="/" className="btn ghost">Всі історії</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="container content">
        {contentBlocks.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>

      {/* MORE */}
      {more.length > 0 && (
        <section className="container more">
          <h2>Ще історії</h2>
          <ul className="grid">
            {more.map((s) => (
              <li key={s.id} className="card">
                <Link href={`/stories/${s.id}`} className="link">
                  <div className="imgWrap">
                    {s.cover ? <img src={s.cover} alt={s.title} /> : <div className="imgPh">Без зображення</div>}
                  </div>
                  <div className="cardBody">
                    <div className="cardTitle">{s.title}</div>
                    <div className="cardMeta">
                      {s.author_name ? <span>{s.author_name}</span> : <span>&nbsp;</span>}
                      {s.published_at ? <span className="date">{fmtDate(s.published_at)}</span> : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
/* ====== базові фікси адаптивності ====== */
html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
img { max-width: 100%; height: auto; display: block; }

/* фон на всю ширину */
.wrap{
  background: linear-gradient(180deg,#E8F2FF 0%, #EBF3FF 40%, #EEF6FF 100%);
  min-height: 100dvh;
}

/* контейнер тепер еластичний:
   ширина = вся ширина мінус відступи, але не більше 1100px */
.container{
  width: min(1100px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 0 0; /* контент сам має внутрішні відступи */
}

/* HERO */
.heroSec{ padding: 0 0 24px; }
.hero{
  position: relative;
  width: 100%;
  min-height: clamp(380px, 56vh, 620px);
  background: #0A2578;
  display: grid;
  place-items: end start;
  overflow: hidden;
}

/* розмитий бекграунд */
.heroBg{
  position:absolute; inset:-10px;
  background-size: cover; background-position: center;
  filter: blur(16px) saturate(110%);
  transform: scale(1.06);
  opacity: .35;
}

/* затемнення знизу */
.overlay{
  position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(2,28,78,.0) 35%, rgba(2,28,78,.70) 100%);
}

/* внутрішній контейнер герою: теж еластичний */
.heroInner{
  position:relative; z-index:2;
  width: min(1100px, calc(100vw - 32px));
  padding: 28px 0 32px;
  margin: 0 auto;
}

/* назад */
.back{
  margin-bottom: 12px;
  background: rgba(255,255,255,.12);
  color:#fff;
  border:1px solid rgba(255,255,255,.25);
}

/* обкладинка, що «вписується» без обрізки */
.heroImg{
  width: 100%;
  display:flex; justify-content: center;
  margin: 4px 0 18px;
  padding: 0 0; /* немає зайвих полів */
}
.heroImg img{
  width: auto; height: auto;
  max-width: 100%;
  max-height: clamp(220px, 40vh, 460px);
  object-fit: contain;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,.25);
}

/* плейсхолдер якщо обкладинки немає */
.heroPlaceholder{
  display:grid; place-items:center;
  height: clamp(160px, 32vh, 260px);
  color:#fff; font-weight:800; font-size: clamp(24px, 5vw, 40px); font-family: Afacad, system-ui, sans-serif;
  opacity:.85;
  margin-bottom: 12px;
  background: linear-gradient(135deg,rgba(255,255,255,.08), rgba(255,255,255,.02));
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 16px;
}

.title{
  margin: 0 0 8px 0;
  color:#fff;
  font-family: Afacad, system-ui, sans-serif;
  font-weight: 800;
  font-size: clamp(22px, 5.2vw, 56px);
  line-height: 1.1;
  text-shadow: 0 4px 18px rgba(0,0,0,.35);
}
.meta{
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  color:#e5edff;
  margin-bottom: 16px;
}
.chip{
  padding: 6px 10px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 9999px;
  font-size: clamp(12px, 1.8vw, 14px);
  font-weight: 700;
}
.dot{ width:6px; height:6px; border-radius:9999px; background:#e5edff; opacity:.8; }
.actions{ display:flex; gap:10px; flex-wrap:wrap; }
.btn{
  height: 40px; padding: 0 14px; border-radius: 10px; border: none; cursor: pointer;
  font-weight: 800; font-size: 14px; text-decoration: none; display:inline-flex; align-items:center; justify-content:center;
  transition: transform .15s ease, box-shadow .15s ease;
}
.btn:hover{ transform: translateY(-1px); }
.btn.share{ background: #2347F5; color:#fff; box-shadow: 0 10px 20px rgba(35,71,245,.25); }
.btn.ghost{ background: #E9EEFF; color:#1D3FDB; }

/* ОСНОВНИЙ ТЕКСТ */
.content{
  width: min(1100px, calc(100vw - 32px));
  margin: 26px auto 10px;
  color:#0f172a;
  font: 400 clamp(15px, 1.6vw, 17px)/1.75 Mulish, system-ui, sans-serif;
}
.content p{ margin: 0 0 18px; }
.content p + p{ text-indent: 1.25em; }

/* ЩЕ ІСТОРІЇ */
.more{
  width: min(1100px, calc(100vw - 32px));
  margin: 12px auto 40px;
}
.more h2{
  font: 800 clamp(20px, 3vw, 26px)/1.25 Afacad, system-ui, sans-serif; color:#0A2578; margin: 0 0 14px;
}
.grid{
  list-style:none; padding:0; margin:0;
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); /* адаптивна сітка */
  gap:14px;
}
.card{
  background: #fff; border: 1px solid rgba(29,63,219,.12); border-radius: 14px; overflow:hidden;
  box-shadow: 0 14px 36px rgba(29,63,219,.10);
}
.link{ display:block; color:inherit; text-decoration:none; }
.imgWrap{ height: clamp(160px, 26vw, 200px); background:#f3f6ff; }
.imgWrap img{ width:100%; height:100%; object-fit:cover; display:block; }
.imgPh{ height:100%; display:grid; place-items:center; color:#6b7280; font-weight:700; }
.cardBody{ padding: 12px 14px 14px; }
.cardTitle{
  font: 800 16px/1.3 Mulish, system-ui, sans-serif; color:#0f172a;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:42px;
}
.cardMeta{ margin-top:8px; display:flex; justify-content:space-between; font-size:12px; color:#64748b; }
.date{ opacity:.9; }

/* SKELETON */
.skeleton{ background: linear-gradient(90deg,#eef2ff 0%, #e0e7ff 45%, #eef2ff 100%); background-size: 200% 100%; animation: sh 1.1s infinite linear; border-radius: 12px; }
.skeleton.hero{ height: clamp(300px, 44vh, 520px); margin-bottom: 22px; }
.skeleton.title{ height: 28px; width: 70%; margin: 8px 0; }
.skeleton.meta{ height: 18px; width: 40%; margin: 8px 0; border-radius: 9999px; }
.skeleton.p{ height: 16px; margin: 10px 0; }
@keyframes sh{ 0%{ background-position: 0 0;} 100%{ background-position: 200% 0;} }

/* UTILS */
.ghost{
  padding: 0 12px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,.3);
  background: rgba(255,255,255,.12); color:#fff; font-weight: 800; cursor: pointer;
}

/* ДОДАТКОВІ БРЕЙКПОІНТИ ДЛЯ ДРІБНИХ ЕКРАНІВ */
@media (max-width: 640px){
  .heroInner{ width: min(1100px, calc(100vw - 24px)); }
  .btn{ height: 38px; font-size: 13px; }
  .chip{ font-size: 12px; }
}
`;
