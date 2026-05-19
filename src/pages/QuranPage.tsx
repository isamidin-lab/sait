import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { QuranTafsir, QuranAyahTafsir, QuranAyahMedia } from '../lib/types';
import Spinner from '../components/Spinner';
import {
  ArrowLeft,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Languages,
  Play,
  Pause,
  Headphones,
  MessageSquare,
  Volume2,
  FileText,
  Video,
  X,
  BookMarked,
} from 'lucide-react';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  sajda: boolean;
}

interface SearchResult {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  ayahNumber: number;
  arabicText: string;
  russianText: string;
}

function getRecitationUrl(surahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
}

export default function QuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showRussian, setShowRussian] = useState(false);
  const [russianAyahs, setRussianAyahs] = useState<Record<number, string>>({});
  const [tafsirMap, setTafsirMap] = useState<Record<number, QuranTafsir>>({});
  // Per-ayah data: keyed by "surah_ayah"
  const [ayahTafsir, setAyahTafsir] = useState<Record<string, QuranAyahTafsir[]>>({});
  const [ayahMedia, setAyahMedia] = useState<Record<string, QuranAyahMedia[]>>({});
  const [expandedAyahTafsir, setExpandedAyahTafsir] = useState<Record<string, string | null>>({});
  const [playingAudio, setPlayingAudio] = useState<'recitation' | 'tafsir' | null>(null);
  const recitationRef = useRef<HTMLAudioElement>(null);
  const tafsirRef = useRef<HTMLAudioElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchSurahs();
    fetchSurahTafsir();
  }, []);

  const fetchSurahs = async () => {
    try {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await res.json();
      if (data.status === 'OK') setSurahs(data.data);
      else setError('Не удалось загрузить список сур');
    } catch {
      setError('Ошибка подключения к API');
    }
    setLoading(false);
  };

  const fetchSurahTafsir = async () => {
    const { data } = await supabase.from('quran_tafsir').select('*');
    if (data) {
      const map: Record<number, QuranTafsir> = {};
      data.forEach((t: QuranTafsir) => { map[t.surah_number] = t; });
      setTafsirMap(map);
    }
  };

  const fetchAyahData = async (surahNumber: number) => {
    const [tafsirRes, mediaRes] = await Promise.all([
      supabase.from('quran_ayah_tafsir').select('*').eq('surah_number', surahNumber),
      supabase.from('quran_ayah_media').select('*').eq('surah_number', surahNumber),
    ]);

    if (tafsirRes.data) {
      const map: Record<string, QuranAyahTafsir[]> = {};
      tafsirRes.data.forEach((t: QuranAyahTafsir) => {
        const key = `${t.surah_number}_${t.ayah_number}`;
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
      setAyahTafsir(map);
    }

    if (mediaRes.data) {
      const map: Record<string, QuranAyahMedia[]> = {};
      mediaRes.data.forEach((m: QuranAyahMedia) => {
        const key = `${m.surah_number}_${m.ayah_number}`;
        if (!map[key]) map[key] = [];
        map[key].push(m);
      });
      setAyahMedia(map);
    }
  };

  const fetchAyahs = async (surahNumber: number) => {
    if (selectedSurah === surahNumber) {
      setSelectedSurah(null);
      setAyahs([]);
      setRussianAyahs({});
      setAyahTafsir({});
      setAyahMedia({});
      stopAllAudio();
      return;
    }

    stopAllAudio();
    setSelectedSurah(surahNumber);
    setLoadingAyahs(true);
    setAyahs([]);
    setRussianAyahs({});
    setExpandedAyahTafsir({});

    try {
      const requests: Promise<Response>[] = [
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ru.kuliev`),
      ];

      const [arabicRes, russianRes] = await Promise.all(requests);
      const arabicData = await arabicRes.json();
      if (arabicData.status === 'OK') setAyahs(arabicData.data.ayahs);

      const russianData = await russianRes.json();
      if (russianData.status === 'OK') {
        const map: Record<number, string> = {};
        russianData.data.ayahs.forEach((a: { numberInSurah: number; text: string }) => {
          map[a.numberInSurah] = a.text;
        });
        setRussianAyahs(map);
      }

      await fetchAyahData(surahNumber);
    } catch {
      setError('Ошибка при загрузке аятов');
    }
    setLoadingAyahs(false);
  };

  // Global search across all 114 surahs — fetches Arabic + Russian in parallel
  const performSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setSearchMode(false);
      return;
    }
    setSearchMode(true);
    setSearchLoading(true);

    try {
      const [arabicRes, russianRes] = await Promise.all([
        fetch('https://api.alquran.cloud/v1/quran'),
        fetch('https://api.alquran.cloud/v1/quran/ru.kuliev'),
      ]);

      const [arabicData, russianData] = await Promise.all([
        arabicRes.json(),
        russianRes.json(),
      ]);

      if (arabicData.status !== 'OK' || russianData.status !== 'OK') {
        setSearchLoading(false);
        return;
      }

      const q = query.toLowerCase().trim();
      const results: SearchResult[] = [];

      const arabicSurahs: { number: number; name: string; englishName: string; ayahs: { numberInSurah: number; text: string }[] }[] =
        arabicData.data.surahs;
      const russianSurahs: { number: number; ayahs: { numberInSurah: number; text: string }[] }[] =
        russianData.data.surahs;

      // Build russian lookup map
      const russianMap: Record<string, string> = {};
      russianSurahs.forEach((s) => {
        s.ayahs.forEach((a) => {
          russianMap[`${s.number}_${a.numberInSurah}`] = a.text;
        });
      });

      arabicSurahs.forEach((surah) => {
        surah.ayahs.forEach((ayah) => {
          const russianText = russianMap[`${surah.number}_${ayah.numberInSurah}`] || '';
          const arabicMatch = ayah.text.includes(query);
          const russianMatch = russianText.toLowerCase().includes(q);
          if (arabicMatch || russianMatch) {
            results.push({
              surahNumber: surah.number,
              surahName: surah.name,
              surahEnglishName: surah.englishName,
              ayahNumber: ayah.numberInSurah,
              arabicText: ayah.text,
              russianText,
            });
          }
        });
      });

      setSearchResults(results.slice(0, 100)); // cap at 100 results
    } catch {
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim()) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => performSearch(value), 600);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchMode(false);
    setSearchResults([]);
  };

  const stopAllAudio = () => {
    recitationRef.current?.pause();
    tafsirRef.current?.pause();
    setPlayingAudio(null);
  };

  const toggleRecitation = () => {
    const audio = recitationRef.current;
    if (!audio) return;
    if (playingAudio === 'recitation') { audio.pause(); setPlayingAudio(null); }
    else { tafsirRef.current?.pause(); audio.play(); setPlayingAudio('recitation'); }
  };

  const toggleTafsirAudio = () => {
    const audio = tafsirRef.current;
    if (!audio) return;
    if (playingAudio === 'tafsir') { audio.pause(); setPlayingAudio(null); }
    else { recitationRef.current?.pause(); audio.play(); setPlayingAudio('tafsir'); }
  };

  const handleToggleRussian = () => setShowRussian((v) => !v);

  const toggleAyahScholar = (key: string, scholarId: string) => {
    setExpandedAyahTafsir((prev) => ({
      ...prev,
      [key]: prev[key] === scholarId ? null : scholarId,
    }));
  };

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim() || searchMode) return surahs;
    const q = searchQuery.toLowerCase();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(searchQuery) ||
        s.number.toString() === searchQuery
    );
  }, [surahs, searchQuery, searchMode]);

  const selectedSurahData = surahs.find((s) => s.number === selectedSurah);
  const tafsirForSelected = selectedSurah ? tafsirMap[selectedSurah] : null;

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-200 text-amber-900 rounded px-0.5">{text.slice(idx, idx + query.trim().length)}</mark>
        {text.slice(idx + query.trim().length)}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  if (error && surahs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchSurahs(); }}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Аль-Куран</h1>
          <p className="text-emerald-200/80 text-lg max-w-xl mx-auto">
            Читайте, слушайте и ищите по аятам — на арабском и в переводе на русский язык
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-emerald-300/70">
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />114 сур</span>
            <span className="flex items-center gap-1.5"><Volume2 className="w-4 h-4" />Рецитация Алафаси</span>
            <span className="flex items-center gap-1.5"><Languages className="w-4 h-4" />Перевод Кулиева</span>
            <span className="flex items-center gap-1.5"><Search className="w-4 h-4" />Поиск по тексту</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск аятов: «терпение», «люди», «свет»…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleToggleRussian}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              showRussian
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
            }`}
          >
            <Languages className="w-4 h-4" />
            Перевод
          </button>
        </div>

        {/* === SEARCH RESULTS MODE === */}
        {searchMode && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-700">
                {searchLoading ? 'Поиск по Корану…' : `Найдено аятов: ${searchResults.length}`}
              </span>
              {!searchLoading && searchResults.length === 100 && (
                <span className="text-xs text-slate-400">(показаны первые 100)</span>
              )}
            </div>

            {searchLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Spinner className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Поиск по всему тексту Корана…</p>
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Аятов по запросу не найдено</p>
                <p className="text-xs text-slate-400 mt-1">Попробуйте другое слово на русском или арабском</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-emerald-200 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.surahNumber}:{r.ayahNumber}
                        </span>
                        <span className="text-xs font-medium text-slate-600">{r.surahEnglishName}</span>
                        <span className="text-xs font-arabic text-emerald-600">{r.surahName}</span>
                      </div>
                      <button
                        onClick={() => { clearSearch(); fetchAyahs(r.surahNumber); }}
                        className="shrink-0 text-xs text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
                      >
                        Открыть суру
                      </button>
                    </div>
                    <p className="text-base leading-loose text-right font-arabic text-slate-800 mb-2" dir="rtl" lang="ar">
                      {highlightText(r.arabicText, searchQuery)}
                    </p>
                    {r.russianText && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {highlightText(r.russianText, searchQuery)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === EXPANDED SURAH === */}
        {!searchMode && selectedSurahData && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-md mb-6 overflow-hidden">
            {/* Surah header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedSurahData.number}. {selectedSurahData.englishName}
                    <span className="ml-3 font-arabic text-emerald-200">{selectedSurahData.name}</span>
                  </h2>
                  <p className="text-emerald-200/80 text-sm mt-0.5">
                    {selectedSurahData.englishNameTranslation} &mdash;{' '}
                    {selectedSurahData.numberOfAyahs} аятов &mdash;{' '}
                    {selectedSurahData.revelationType === 'Meccan' ? 'Мекканская' : 'Мединская'}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedSurah(null); setAyahs([]); setRussianAyahs({}); stopAllAudio(); }}
                  className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>

              {/* Audio row */}
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 flex-1 min-w-0">
                  <button
                    onClick={toggleRecitation}
                    className="shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-700 hover:scale-105 transition-transform shadow"
                  >
                    {playingAudio === 'recitation' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">Рецитация</p>
                    <p className="text-xs text-emerald-200/70 truncate">Мишари Алафаси</p>
                  </div>
                  <audio ref={recitationRef} src={getRecitationUrl(selectedSurahData.number)} onEnded={() => setPlayingAudio(null)} preload="none" />
                </div>

                {tafsirForSelected?.audio_url && (
                  <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2 flex-1 min-w-0">
                    <button
                      onClick={toggleTafsirAudio}
                      className="shrink-0 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow"
                    >
                      {playingAudio === 'tafsir' ? <Pause className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-amber-100 truncate">Тафсир суры</p>
                      <p className="text-xs text-amber-200/70 truncate">Аудиокомментарий</p>
                    </div>
                    <audio ref={tafsirRef} src={tafsirForSelected.audio_url} onEnded={() => setPlayingAudio(null)} preload="none" />
                  </div>
                )}
              </div>
            </div>

            {/* Surah-level notes */}
            {tafsirForSelected?.notes && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-1">Примечания к суре</p>
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{tafsirForSelected.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {loadingAyahs ? (
              <div className="flex justify-center py-12">
                <Spinner className="w-8 h-8 text-emerald-600" />
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                {selectedSurahData.number !== 9 && (
                  <div className="text-center mb-6 pb-4 border-b border-slate-100">
                    <p className="text-2xl text-emerald-800 font-arabic leading-loose" dir="rtl" lang="ar">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Во имя Аллаха, Милостивого, Милосердного</p>
                  </div>
                )}

                <div className="space-y-5">
                  {ayahs.map((ayah) => {
                    const ayahKey = `${selectedSurah}_${ayah.numberInSurah}`;
                    const scholars = ayahTafsir[ayahKey] || [];
                    const media = ayahMedia[ayahKey] || [];
                    const activeScholar = expandedAyahTafsir[ayahKey];

                    return (
                      <div key={ayah.number} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                        {/* Ayah number + Arabic text */}
                        <div className="flex items-start gap-3">
                          <span className="shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 mt-1">
                            {ayah.numberInSurah}
                          </span>
                          <div className="flex-1">
                            <p className="text-xl leading-loose text-right font-arabic" dir="rtl" lang="ar">
                              {ayah.text}
                            </p>
                            {/* Russian translation — always shown */}
                            {(showRussian || true) && russianAyahs[ayah.numberInSurah] && (
                              <p className={`text-sm text-slate-600 mt-2 leading-relaxed ${!showRussian ? 'hidden' : ''}`}>
                                {russianAyahs[ayah.numberInSurah]}
                              </p>
                            )}
                            {showRussian && russianAyahs[ayah.numberInSurah] === undefined && (
                              <p className="text-sm text-slate-400 mt-2 italic">Перевод загружается…</p>
                            )}
                          </div>
                        </div>

                        {/* Media links */}
                        {media.length > 0 && (
                          <div className="mt-3 ml-11 flex flex-wrap gap-2">
                            {media.map((m) => (
                              <a
                                key={m.id}
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                  m.media_type === 'article'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                    : m.media_type === 'audio'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {m.media_type === 'article' && <FileText className="w-3.5 h-3.5" />}
                                {m.media_type === 'audio' && <Headphones className="w-3.5 h-3.5" />}
                                {m.media_type === 'video' && <Video className="w-3.5 h-3.5" />}
                                {m.title}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Per-ayah scholar tafsir tabs */}
                        {scholars.length > 0 && (
                          <div className="mt-3 ml-11">
                            {/* Scholar toggle buttons */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {scholars.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => toggleAyahScholar(ayahKey, s.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                    activeScholar === s.id
                                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  }`}
                                >
                                  <BookMarked className="w-3 h-3" />
                                  {s.scholar_name}
                                  {activeScholar === s.id ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              ))}
                            </div>

                            {/* Active scholar commentary */}
                            {scholars
                              .filter((s) => s.id === activeScholar)
                              .map((s) => (
                                <div key={s.id} className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookMarked className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-semibold text-amber-800">
                                      Тафсир — {s.scholar_name}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {s.commentary}
                                  </p>
                                  {s.audio_url && (
                                    <div className="mt-3">
                                      <audio controls src={s.audio_url} className="w-full h-9" preload="metadata" />
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === SURAH LIST === */}
        {!searchMode && (
          <div className="grid gap-2">
            {filteredSurahs.map((surah) => {
              const hasSurahTafsir = !!tafsirMap[surah.number];
              const isActive = selectedSurah === surah.number;
              return (
                <button
                  key={surah.number}
                  onClick={() => fetchAyahs(surah.number)}
                  className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all duration-200 ${
                    isActive
                      ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {surah.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{surah.englishName}</span>
                        <span className="text-emerald-700 font-arabic">{surah.name}</span>
                        {hasSurahTafsir && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <Headphones className="w-3 h-3" />
                            Тафсир
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {surah.englishNameTranslation} &mdash; {surah.numberOfAyahs} аятов &mdash;{' '}
                        {surah.revelationType === 'Meccan' ? 'Мекканская' : 'Мединская'}
                      </p>
                    </div>
                    {isActive ? (
                      <ChevronUp className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!searchMode && filteredSurahs.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
