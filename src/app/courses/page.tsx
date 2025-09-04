'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/api';

type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null;
  author: number | { id: number; username: string };
  author_username?: string;
  rating?: number | string | null;
  price?: number | string | null;

  // язык может приходить id | строкой | объектом
  language?: number | string | { id: number; name?: string; title?: string; code?: string; slug?: string };

  topic?: string;
  category?: number | { id: number; name: string } | null;
};

type Profile = { id: number; username: string; is_superuser: boolean; is_teacher: boolean };
type Category = { id: number; name: string };

// для выпадающего списка языков
type LangOption = { value: string; label: string };
// мапа id -> имя
type LanguagesMap = Record<number, string>;

const pageSize = 6;
const PURCHASED_URL = '/courses/me/purchased/'; // якщо інше — заміни

// ====== СТАТИЧНІ TOP-ФЛАГМАНСЬКІ КУРСИ (унікальні сторінки) ======
const FEATURED = [
  {
    href: '/flagmanCourses/design',
    title: 'Графічний дизайн',
    desc: 'Отримувані навички: Graphic Design, Adobe Photoshop, Adobe Illustrator, Creativity...',
    image: '/images/graphicdesigncard.png',
  },
  {
    href: '/flagmanCourses/marketing',
    title: 'Маркетинг',
    desc: 'Отримувані навички: Стратегія бренду, розуміння клієнтів, стратегічний маркетінг...',
    image: '/images/marketingcard.png',
  },
  {
    href: '/flagmanCourses/programming',
    title: 'Програмування в Python',
    desc: 'Отримувані навички: Програмування на мові Python, Відкладення, Середовище розробк...',
    image: '/images/programmingcard.png',
  },
] as const;

export default function CourseListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL → initial state
  const initialCategory = searchParams.get('category') ?? 'all';
  const initialLanguageRaw = searchParams.get('language') ?? 'all';
  const initialOrdering = searchParams.get('ordering') ?? 'title';
  const initialSearch = searchParams.get('search') ?? '';
  const initialPage = Number(searchParams.get('page') ?? '1') || 1;

  // state
  const [me, setMe] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // ЯЗЫКИ
  const [languagesMap, setLanguagesMap] = useState<LanguagesMap>({});
  const [languageOptions, setLanguageOptions] = useState<LangOption[]>([{ value: 'all', label: 'Усі мови' }]);

  // выбранные фильтры/сортировка
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState(initialOrdering);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);

  // храним «значение» фильтра по языку строго как строку.
  // если это id — это будет "2", если имя — "English".
  const [languageFilter, setLanguageFilter] = useState<string>(initialLanguageRaw);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [error, setError] = useState<string | null>(null);

  // Рекомендации (кнопкой показываем 3-й и 4-й курсы)
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [purchasedCount, setPurchasedCount] = useState<number | null>(null);

  // abort refs
  const initAbortRef = useRef<AbortController | null>(null);

  function isOwner(course: Course) {
    const authorId = typeof course.author === 'number' ? course.author : course.author?.id;
    return !!me && !!authorId && me.id === authorId;
  }

  // ===== helpers for languages =====

  // вытянуть красивую метку языка из поля курса
  function extractLanguageLabel(lang: Course['language']): string {
    if (lang == null) return '—';
    if (typeof lang === 'object') {
      const obj = lang as any;
      const fromObj = obj.name || obj.title || obj.code || obj.slug;
      if (fromObj) return String(fromObj);
      if (typeof obj.id === 'number') return languagesMap[obj.id] || `#${obj.id}`;
      return '—';
    }
    if (typeof lang === 'number') {
      return languagesMap[lang] || `#${lang}`;
    }
    const asNum = Number(lang);
    if (!Number.isNaN(asNum) && String(asNum) === String(lang)) {
      return languagesMap[asNum] || `#${asNum}`;
    }
    return String(lang); // уже человекочитаемая строка
  }

  // загрузка словаря языков с возможных эндпоинтов
  async function loadLanguagesDict(): Promise<LanguagesMap> {
    const endpoints = [
      '/courses/languages/',
      '/api/languages/',
      '/courses/language/',
      '/course/languages/',
    ];
    for (const ep of endpoints) {
      try {
        const r = await http.get(ep);
        const raw = Array.isArray(r.data?.results) ? r.data.results : r.data;
        const arr: Array<{ id: number; name?: string; title?: string; code?: string; slug?: string }> =
          Array.isArray(raw) ? raw : [];
        if (!arr.length) continue;
        const map: LanguagesMap = {};
        for (const it of arr) {
          if (typeof it?.id === 'number') {
            map[it.id] = (it.name || it.title || it.code || it.slug || String(it.id)).toString();
          }
        }
        if (Object.keys(map).length) return map;
      } catch {
        // попробуем следующий
      }
    }
    return {};
  }

  // из словаря соберём options
  function buildLangOptionsFromMap(map: LanguagesMap): LangOption[] {
    const opts = Object.entries(map)
      .sort((a, b) => a[1].localeCompare(b[1], 'uk'))
      .map(([id, label]) => ({ value: String(id), label }));
    return [{ value: 'all', label: 'Усі мови' }, ...opts];
  }

  // дополнительно расширим options уникальными строковыми значениями из курсов (если бэкенд не дал словарь)
  function mergeOptionsWithAdHocStrings(base: LangOption[], list: Course[]): LangOption[] {
    const setVals = new Set(base.map((o) => o.value));
    const setLabels = new Set(base.map((o) => o.label));
    const extras: LangOption[] = [];
    for (const c of list) {
      const l = c.language;
      if (l == null) continue;
      // берём красивую метку (вдруг объект)
      const label = extractLanguageLabel(l);
      // а значение — как есть: если число или числовая строка — остаётся, если чисто строка — пусть будет строка
      let value: string;
      if (typeof l === 'object') {
        value = typeof (l as any).id === 'number' ? String((l as any).id) : label;
      } else {
        value = String(l);
      }
      if (!setVals.has(value) && !setLabels.has(label)) {
        extras.push({ value, label });
        setVals.add(value);
        setLabels.add(label);
      }
    }
    // оставляем "Усі мови" первым
    const first = base.find((o) => o.value === 'all')!;
    const rest = [...base.filter((o) => o.value !== 'all'), ...extras].filter(
      (v, i, arr) => arr.findIndex((x) => x.value === v.value) === i,
    );
    // отсортируем остальное по лейблу
    rest.sort((a, b) => a.label.localeCompare(b.label, 'uk'));
    return [first, ...rest];
  }

  // найти «value» для выпадашки по пришедшему из URL initialLanguageRaw
  function normalizeInitialLanguageValue(
    initial: string,
    options: LangOption[],
    map: LanguagesMap,
  ): string {
    if (initial === 'all') return 'all';
    // если initial числовой id — оставляем
    const n = Number(initial);
    if (!Number.isNaN(n) && String(n) === initial) return initial;

    // если initial — имя языка: попробуем найти id по имени
    const entry = Object.entries(map).find(([, label]) => label === initial);
    if (entry) return entry[0]; // id как строка

    // иначе, если в options уже есть такой value (строка-имя), оставим как есть
    if (options.some((o) => o.value === initial)) return initial;

    // ну или попробуем сопоставление по label
    const byLabel = options.find((o) => o.label === initial);
    if (byLabel) return byLabel.value;

    return 'all';
  }

  // оновити URL
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (languageFilter !== 'all') params.set('language', languageFilter);
    if (sortBy && sortBy !== 'title') params.set('ordering', sortBy);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (currentPage > 1) params.set('page', String(currentPage));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // profile + categories + languages (initial)
  useEffect(() => {
    initAbortRef.current?.abort();
    const controller = new AbortController();
    initAbortRef.current = controller;

    (async () => {
      try {
        const r = await http.get('/accounts/api/profile/', { signal: controller.signal as any });
        setMe(r.data as Profile);
      } catch {
        setMe(null);
      }
      try {
        const r2 = await http.get('/courses/categories/', { signal: controller.signal as any });
        const arr = Array.isArray(r2.data?.results) ? r2.data.results : r2.data;
        setCategories(arr || []);
      } catch {}

      // языки: сначала словарь, потом — подстрахуемся курсами
      try {
        const [dictRes, coursesRes] = await Promise.all([
          loadLanguagesDict(),
          http.get('/courses/', { params: { page_size: 200 }, signal: controller.signal as any }),
        ]);
        const list: Course[] = (coursesRes.data?.results || coursesRes.data || []) as Course[];

        const dict = dictRes;
        setLanguagesMap(dict);

        const baseOptions = buildLangOptionsFromMap(dict);
        const mergedOptions = mergeOptionsWithAdHocStrings(baseOptions, list);
        setLanguageOptions(mergedOptions);

        // нормализуем первоначальное значение фильтра языка
        setLanguageFilter((prev) => normalizeInitialLanguageValue(prev, mergedOptions, dict));
      } catch {
        // если упали — хотя бы вытащим из курсов строки
        try {
          const r = await http.get('/courses/', { params: { page_size: 200 }, signal: controller.signal as any });
          const list: Course[] = (r.data?.results || r.data || []) as Course[];
          const unique = new Map<string, string>(); // value -> label
          for (const c of list) {
            if (c.language == null) continue;
            const label = extractLanguageLabel(c.language);
            let value: string;
            if (typeof c.language === 'object') {
              value = typeof (c.language as any).id === 'number' ? String((c.language as any).id) : label;
            } else {
              value = String(c.language);
            }
            if (!unique.has(value)) unique.set(value, label);
          }
          const opts: LangOption[] = [{ value: 'all', label: 'Усі мови' }];
          for (const [value, label] of [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1], 'uk'))) {
            opts.push({ value, label });
          }
          setLanguageOptions(opts);
          setLanguageFilter((prev) => normalizeInitialLanguageValue(prev, opts, {}));
        } catch {
          setLanguageOptions([{ value: 'all', label: 'Усі мови' }]);
          setLanguageFilter('all');
        }
      }
    })();

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // придбані курси → для повідомлення про відсутність рекомендацій
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    http
      .get(PURCHASED_URL)
      .then((r) => {
        if (cancelled) return;
        const arr = Array.isArray(r.data?.results) ? r.data.results : r.data;
        setPurchasedCount(Array.isArray(arr) ? arr.length : 0);
      })
      .catch(() => {
        if (!cancelled) setPurchasedCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [me]);

  // (повторная подстраховка категорий)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r2 = await http.get('/courses/categories/');
        const arr = Array.isArray(r2.data?.results) ? r2.data.results : r2.data;
        if (!cancelled) setCategories(arr || []);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== courses =====
  useEffect(() => {
    let cancelled = false;
    setError(null);

    const controller = new AbortController();
    const params: Record<string, string | number | undefined> = {
      ordering: sortBy,
      page: currentPage,
      page_size: pageSize,
      search: searchTerm.trim() || undefined,
    };
    if (categoryFilter !== 'all') params['category__name'] = categoryFilter;

    // язык: если выбран не 'all', прокинем как есть (id или имя).
    if (languageFilter !== 'all') {
      params['language'] = languageFilter;
      // если твой бэкенд ожидает именно ID — легко заменить на:
      // const asId = Number(languageFilter);
      // params['language'] = !Number.isNaN(asId) ? asId : languageFilter;
    }

    http
      .get('/courses/', { params, signal: controller.signal as any })
      .then((r) => {
        const list: Course[] = r.data?.results ?? r.data ?? [];
        const normalized = list.map((c) => ({ ...c, image: c.image ? mediaUrl(c.image) : null }));
        setCourses(normalized);

        const count = Number(r.data?.count ?? normalized.length);
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
      })
      .catch(() => !cancelled && setError('Не вдалося завантажити курси'));

    updateUrl();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, categoryFilter, languageFilter, searchTerm, currentPage]);

  // прості рекомендації, щоб не падало (вибираємо перші 6)
  const recommended = useMemo(() => courses.slice(0, 6), [courses]);

  const renderStars = (ratingVal: number | string | null | undefined) => {
    const rating = Number(ratingVal) || 0;
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <span className="stars">
        {'★'.repeat(full)}
        {half && '⯪'}
        {'☆'.repeat(empty)}
      </span>
    );
  };

  // удобный геттер метки языка для карточки (если захочешь показывать язык на карточке)
  const getLangLabel = (c: Course) => extractLanguageLabel(c.language);

  // ===== JSX =====
  return (
    <div className="wrap">
      <div className="container">
        {/* ======= Бейдж заголовка «Курси від нас» ======= */}
        <div className="badgeTitle">Курси від нас</div>

        <div className="content">
          {/* ======= Фильтры ======= */}
          <aside className="sidebar">
            <h2>Фільтри</h2>

            <div className="filter">
              <label htmlFor="search">Пошук за назвою:</label>
              <input
                id="search"
                type="text"
                placeholder="Введіть назву…"
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearchTerm(e.target.value);
                }}
                autoComplete="off"
              />
            </div>

            <div className="filter">
              <label>Категорія:</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setCategoryFilter(e.target.value);
                }}
              >
                <option value="all">Усі категорії</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter">
              <label>Мова:</label>
              <select
                value={languageFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setLanguageFilter(e.target.value);
                }}
              >
                {languageOptions.map((opt) => (
                  <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter">
              <label>Сортування:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSortBy(e.target.value);
                }}
              >
                <option value="title">Назва</option>
                <option value="price">Ціна (зростання)</option>
                <option value="-price">Ціна (спадання)</option>
                <option value="rating">Рейтинг (зростання)</option>
                <option value="-rating">Рейтинг (спадання)</option>
                <option value="-created_at">Новіші</option>
                <option value="created_at">Старіші</option>
              </select>
            </div>
          </aside>

          {/* ======= Плейсхолдер «Курси від нас» ======= */}
          <section className="featured">
            <ul className="cards">
              {FEATURED.map((f, idx) => (
                <li key={idx} className="card">
                  <Link href={f.href} className="cardLink" prefetch={false}>
                    <div className="imgBox imgBox--tall">
                      {f.image && <img src={f.image} alt={f.title} />}
                    </div>
                    <div className="cardBody">
                      <h3 className="cardTitle">{f.title}</h3>
                      <p className="cardDesc">{f.desc}</p>
                      <div className="btnRow">
                        <span className="btn">Деталі</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Кнопка «Рекомендації від ШІ» */}
            <div className="center aiSpacer">
              <button
                onClick={() => setShowRecommendations((v) => !v)}
                className="pillBtn pillBtn--violet"
                aria-expanded={showRecommendations}
              >
                Рекомендації від ШІ
              </button>
            </div>

            {showRecommendations && (
              <section className="recommended">
                <ul className="cards">
                  {recommended.map((c) => (
                    <li key={c.id} className="card">
                      <div className="imgBox imgBox--tall">
                        {c.image && <img src={String(c.image)} alt={c.title} />}
                      </div>
                      <div className="cardBody">
                        <h3 className="cardTitle">{c.title}</h3>
                        <p className="cardDesc">
                          {c.description?.slice(0, 120)}
                          {c.description && c.description.length > 120 ? '…' : ''}
                        </p>
                        <div className="btnRow">
                          <Link href={`/courses/${c.id}/details`} className="btn">
                            Деталі
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
        </div>

        {/* ======= Бейдж «Всі курси» ======= */}
        <div className="badgeTitle second">Всі курси</div>

        {/* ======= Основной список ======= */}
        <div className="container container--tight">
          <main className="main">
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <ul className="cards">
              {courses.map((c) => {
                const price = Number(c.price ?? 0);
                const rating = Number(c.rating ?? 0);
                const isOwnerOrAdmin = !!me && (me.is_superuser || isOwner(c));
                return (
                  <li key={c.id} className="card">
                    <div className="imgBox">
                      {c.image && <img src={String(c.image)} alt={c.title} />}
                    </div>
                    <div className="cardBody">
                      <h3 className="cardTitle">{c.title}</h3>
                      <p className="cardDesc">
                        {c.description?.slice(0, 120)}
                        {c.description && c.description.length > 120 ? '…' : ''}
                      </p>
                      <div className="meta">
                        <span className="price">${price.toFixed(2)}</span>
                        <span className="rating">
                          {renderStars(rating)} <span className="ratingNum">({rating.toFixed(1)})</span>
                        </span>
                      </div>
                      <div className="btnRow">
                        <Link href={`/courses/${c.id}/details`} className="btn">Деталі</Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <section className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Попередня сторінка"
              >
                ←
              </button>
              <span>
                Сторінка {currentPage} з {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Наступна сторінка"
              >
                →
              </button>
            </section>
          </main>
        </div>
      </div>

      {/* ======= Стили ======= */}
      <style jsx>{`
        .wrap {
          min-height: 100dvh;
          background: linear-gradient(180deg, #E8F2FF 0%, #EBF3FF 40%, #EEF6FF 100%);
          padding: 28px 0 48px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto 24px;
          padding: 18px 22px;
          border-radius: 18px;
          background: rgba(207, 224, 255, 0.35);
          box-shadow: 0 8px 28px rgba(67, 97, 238, 0.12);
          border: 1px solid rgba(67, 97, 238, 0.25);
        }
        .container--tight {
          max-width: 1180px;
          padding: 0 12px 8px;
          background: transparent;
          box-shadow: none;
          border: 0;
          margin-top: 8px;
        }

        .badgeTitle {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 auto 24px;
          padding: 10px 28px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 22px;
          color: #fff;
          background: linear-gradient(90deg, #1E3A8A 0%, #3B82F6 100%);
          box-shadow: 0 6px 18px rgba(59, 130, 246, 0.3);
          width: fit-content;
        }
        .badgeTitle.second { margin-top: 6px; }

        .content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
        }

        /* Sidebar (filters) */
        .sidebar {
          background: #fff;
          border-radius: 16px;
          padding: 16px 16px 18px;
          box-shadow: 0 8px 22px rgba(29, 63, 219, 0.18);
          border: 1px solid rgba(29, 63, 219, 0.12);
          height: fit-content;
        }
        .sidebar h2 {
          margin: 4px 0 12px;
          text-align: center;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .filter { display: grid; gap: 6px; margin-bottom: 12px; }
        .filter label { font-size: 13px; font-weight: 700; color: #334155; }
        .filter input, .filter select {
          border: 1px solid #D2DAFF;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: box-shadow .2s ease;
          background: #fff;
        }
        .filter input:focus, .filter select:focus {
          box-shadow: 0 0 0 3px rgba(35, 71, 245, .12);
        }

        /* Cards grid */
        .cards {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        /* Card */
        .card {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(29, 63, 219, 0.1);
          border: 1px solid rgba(29, 63, 219, 0.12);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cardLink { display: block; color: inherit; text-decoration: none; }
        .imgBox {
          height: 220px;
          background: #F3F6FF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 14px;
        }
        .imgBox--tall { height: 150px; }
        .imgBox img { width: 100%; height: 100%; object-fit: cover; }

        .cardBody { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 8px; }
        .cardTitle { font-size: 16px; font-weight: 800; color: #0f172a; }
        .cardDesc { font-size: 13px; color: #475569; line-height: 1.45; min-height: 36px; }

        .meta { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .price { font-weight: 800; color: #0f172a; }
        .rating { display: inline-flex; align-items: center; gap: 6px; color: #475569; }
        .ratingNum { color: #64748b; }
        .stars { color: #f59e0b; user-select: none; }

        .btnRow { margin-top: 4px; }
        .btn {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          background: #2347F5;
          box-shadow: 0 8px 18px rgba(29, 63, 219, 0.25);
          text-decoration: none;
        }
        .btn:hover { background: #1D3FDB; }
        .btn--ghost { color: #1D3FDB; background: #E9EEFF; box-shadow: none; margin-left: 8px; }

        .center { text-align: center; }
        .aiSpacer { margin-top: 16px; }
        .pillBtn {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 14px;
        }
        .pillBtn--violet { background: linear-gradient(45deg, #D946EF, #7C3AED); color: #fff; box-shadow: 0 10px 24px rgba(124, 58, 237, .28); }

        .container--tight { max-width: 1180px; padding: 0 12px 8px; background: transparent; box-shadow: none; border: 0; margin-top: 8px; }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin: 22px 0 10px;
          color: #0f172a;
          font-weight: 700;
        }
        .pagination button {
          background: #2347F5;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
        }
        .pagination button:disabled { background: #cbd5e1; cursor: default; }

        @media (max-width: 1024px) {
          .content { grid-template-columns: 1fr; }
          .sidebar { order: -1; }
          .cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .cards { grid-template-columns: 1fr; }
          .badgeTitle { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}
