import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/7955341e-aee5-44bd-b659-58a4c1f3cbbc";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/89dca4ac-9333-4669-b19a-dbcf8b70cf3e/files/c78843c2-e020-4d83-8861-584774fdbca3.jpg";

const GAMES = [
  { id: 1, name: "Блэкджек Роял", icon: "♠", category: "Карты", minBet: 100, maxBet: 50000, rtp: "99.5%", hot: true, currencies: ["RUB", "USD", "EUR"] },
  { id: 2, name: "Рулетка Монако", icon: "⚫", category: "Рулетка", minBet: 50, maxBet: 100000, rtp: "97.3%", hot: true, currencies: ["RUB", "USD", "EUR"] },
  { id: 3, name: "Покер Классик", icon: "♦", category: "Покер", minBet: 500, maxBet: 200000, rtp: "98.1%", hot: false, currencies: ["RUB", "USD"] },
  { id: 4, name: "Баккара VIP", icon: "♥", category: "Карты", minBet: 1000, maxBet: 500000, rtp: "98.9%", hot: false, currencies: ["RUB", "USD", "EUR"] },
  { id: 5, name: "Слот Удача", icon: "🎰", category: "Слоты", minBet: 10, maxBet: 10000, rtp: "96.5%", hot: true, currencies: ["RUB"] },
  { id: 6, name: "Кости Дьявола", icon: "🎲", category: "Кости", minBet: 100, maxBet: 75000, rtp: "98.6%", hot: false, currencies: ["RUB", "EUR"] },
];

const CURRENCIES = ["RUB", "USD", "EUR"];
const CURRENCY_SYMBOLS: Record<string, string> = { RUB: "₽", USD: "$", EUR: "€" };
const RATES: Record<string, number> = { RUB: 1, USD: 0.011, EUR: 0.010 };

function formatCurrency(amount: number, currency: string): string {
  const converted = amount * RATES[currency];
  const sym = CURRENCY_SYMBOLS[currency];
  if (currency === "RUB") return `${converted.toLocaleString("ru-RU")} ${sym}`;
  return `${sym}${converted.toFixed(2)}`;
}

interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  currency: string;
  vip_level: string;
  total_bets: number;
  total_wins: number;
  max_win: number;
  created_at: string;
}

type AuthMode = "login" | "register";

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const body = mode === "register"
        ? { username, email, password }
        : { email, password };

      const res = await fetch(`${AUTH_URL}/?action=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); setLoading(false); return; }

      const token = data.token;
      localStorage.setItem("casino_token", token);

      const meRes = await fetch(`${AUTH_URL}/?action=me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await meRes.json();
      onSuccess(token, user);
    } catch {
      setError("Нет связи с сервером");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded p-8 animate-scale-in"
        style={{ background: "#141414", border: "1px solid rgba(201,162,39,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="text-3xl mb-2 animate-flicker">♠</div>
          <h2 className="font-display text-3xl font-bold" style={{ color: "#c9a227" }}>
            {mode === "login" ? "Вход" : "Регистрация"}
          </h2>
          {mode === "register" && (
            <p className="font-casino text-xs mt-2" style={{ color: "rgba(201,162,39,0.5)" }}>
              Бонус 1 000 ₽ при регистрации!
            </p>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {mode === "register" && (
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Имя игрока"
              className="w-full px-4 py-3 rounded font-casino text-sm outline-none"
              style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.2)", color: "#e8d5a0" }}
            />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" type="email"
            className="w-full px-4 py-3 rounded font-casino text-sm outline-none"
            style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.2)", color: "#e8d5a0" }}
          />
          <input value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Пароль" type="password"
            className="w-full px-4 py-3 rounded font-casino text-sm outline-none"
            style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.2)", color: "#e8d5a0" }}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded text-sm font-casino text-center"
            style={{ background: "rgba(139,0,0,0.2)", border: "1px solid rgba(178,34,34,0.3)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <button className="btn-gold w-full py-3 rounded text-sm tracking-widest mb-3"
          onClick={submit} disabled={loading}>
          {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>

        <button className="w-full text-center font-casino text-xs py-1"
          style={{ color: "rgba(201,162,39,0.45)" }}
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<"home" | "games" | "profile">("home");
  const [currency, setCurrency] = useState("RUB");
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("1000");
  const [betPlaced, setBetPlaced] = useState(false);
  const [filterCat, setFilterCat] = useState("Все");
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("casino_token");
    if (!token) { setAuthLoading(false); return; }
    fetch(`${AUTH_URL}/?action=me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.id) setUser(data); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  const handleAuthSuccess = (_token: string, u: User) => {
    setUser(u);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("casino_token");
    if (token) {
      await fetch(`${AUTH_URL}/?action=logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("casino_token");
    setUser(null);
    setSection("home");
  };

  const handleBet = () => {
    if (!user) { setShowAuth(true); return; }
    setBetPlaced(true);
    setTimeout(() => setBetPlaced(false), 2000);
  };

  const balance = user ? user.balance : 0;
  const categories = ["Все", "Карты", "Рулетка", "Покер", "Слоты", "Кости"];
  const filtered = filterCat === "Все" ? GAMES : GAMES.filter(g => g.category === filterCat);

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d" }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "linear-gradient(180deg, rgba(13,13,13,0.98) 0%, rgba(13,13,13,0.0) 100%)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSection("home")}>
          <div className="text-2xl animate-flicker">♠</div>
          <span className="font-display text-xl tracking-widest" style={{ color: "#c9a227" }}>ROYAL CASINO</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {(["home", "games", "profile"] as const).map((s) => (
            <button key={s}
              onClick={() => { if (s === "profile" && !user) { setShowAuth(true); return; } setSection(s); }}
              className={`nav-link ${section === s ? "active" : ""}`}>
              {s === "home" ? "Главная" : s === "games" ? "Игры" : "Профиль"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded"
                  style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)" }}>
                  <Icon name="Wallet" size={14} className="text-yellow-500" />
                  <span className="font-casino text-sm" style={{ color: "#c9a227" }}>
                    {formatCurrency(balance, currency)}
                  </span>
                </div>
                <button onClick={handleLogout}
                  className="font-casino text-xs px-3 py-1.5 rounded"
                  style={{ border: "1px solid rgba(201,162,39,0.2)", color: "rgba(201,162,39,0.5)" }}>
                  Выйти
                </button>
              </div>
            ) : (
              <button className="btn-gold px-5 py-2 rounded text-xs tracking-widest"
                onClick={() => setShowAuth(true)}>
                Войти
              </button>
            )
          )}
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="font-casino text-xs px-2 py-1.5 rounded outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(201,162,39,0.2)", color: "#c9a227" }}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center py-3 px-4"
        style={{ background: "rgba(13,13,13,0.97)", borderTop: "1px solid rgba(201,162,39,0.15)" }}>
        {([
          { id: "home" as const, icon: "Home" as const, label: "Главная" },
          { id: "games" as const, icon: "Gamepad2" as const, label: "Игры" },
          { id: "profile" as const, icon: "User" as const, label: "Профиль" },
        ]).map(({ id, icon, label }) => (
          <button key={id} onClick={() => { if (id === "profile" && !user) { setShowAuth(true); return; } setSection(id); }}
            className="flex flex-col items-center gap-1">
            <Icon name={icon} size={20} style={{ color: section === id ? "#c9a227" : "#555" }} />
            <span className="font-casino" style={{ color: section === id ? "#c9a227" : "#555", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ======================== HOME ======================== */}
      {section === "home" && (
        <div className="animate-fade-in">
          <div className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
              <img src={HERO_IMAGE} alt="Casino" className="w-full h-full object-cover opacity-25" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,13,13,0.3) 0%, rgba(13,13,13,0.7) 60%, #0d0d0d 100%)" }} />
            </div>
            <div className="absolute top-1/4 left-12 hidden lg:flex gap-2 opacity-60" style={{ transform: "rotate(-12deg)" }}>
              {["A", "K", "Q"].map((v, i) => (
                <div key={i} className="playing-card red w-10 h-14 text-sm" style={{ transform: `rotate(${i * 5}deg)` }}>
                  <span>{v}</span><span>♥</span>
                </div>
              ))}
            </div>
            <div className="absolute top-1/3 right-12 hidden lg:flex gap-2 opacity-60" style={{ transform: "rotate(8deg)" }}>
              {["A", "J", "10"].map((v, i) => (
                <div key={i} className="playing-card black w-10 h-14 text-sm" style={{ transform: `rotate(${-i * 4}deg)` }}>
                  <span>{v}</span><span>♠</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <div className="mb-4 flex justify-center gap-3 opacity-70">
                {["♠", "♥", "♦", "♣"].map((s, i) => (
                  <span key={i} className="font-display text-2xl" style={{ color: i % 2 === 0 ? "#c9a227" : "#b22222" }}>{s}</span>
                ))}
              </div>
              <p className="font-casino text-xs tracking-[0.4em] uppercase mb-4" style={{ color: "rgba(201,162,39,0.6)" }}>
                Добро пожаловать в
              </p>
              <h1 className="font-display text-6xl md:text-8xl font-bold mb-2 leading-none" style={{ color: "#c9a227" }}>
                Royal Casino
              </h1>
              <p className="font-display text-xl md:text-2xl italic mb-8" style={{ color: "rgba(240,208,96,0.6)" }}>
                Где рождаются легенды
              </p>
              <div className="section-divider max-w-xs mx-auto mb-8" />
              <p className="font-casino text-sm tracking-wide mb-10" style={{ color: "rgba(201,162,39,0.5)", letterSpacing: "0.2em" }}>
                СТАВКИ ОТ 10 ₽ · 6 ИГРОВЫХ СТОЛОВ · RUB / USD / EUR
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="btn-gold px-10 py-4 text-sm font-semibold tracking-widest"
                  onClick={() => setSection("games")}>
                  Начать игру
                </button>
                {user ? (
                  <button className="px-10 py-4 text-sm font-casino tracking-widest border"
                    style={{ borderColor: "rgba(201,162,39,0.3)", color: "rgba(201,162,39,0.7)", background: "transparent" }}
                    onClick={() => setSection("profile")}>
                    Мой профиль
                  </button>
                ) : (
                  <button className="px-10 py-4 text-sm font-casino tracking-widest border"
                    style={{ borderColor: "rgba(201,162,39,0.3)", color: "rgba(201,162,39,0.7)", background: "transparent" }}
                    onClick={() => setShowAuth(true)}>
                    Войти / Регистрация
                  </button>
                )}
              </div>
            </div>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-40">
              <Icon name="ChevronsDown" size={20} style={{ color: "#c9a227" }} />
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Игроков онлайн", value: "1 284", icon: "Users" },
                { label: "Выплачено сегодня", value: "₽2.4 млн", icon: "TrendingUp" },
                { label: "Игровых столов", value: "6", icon: "Gamepad2" },
                { label: "Мин. ставка", value: "от ₽10", icon: "Coins" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="card-casino p-5 text-center rounded transition-all duration-300">
                  <Icon name={icon as "Users"} size={22} className="mx-auto mb-3" style={{ color: "#8b0000" }} />
                  <div className="font-display text-2xl font-bold mb-1" style={{ color: "#c9a227" }}>{value}</div>
                  <div className="font-casino text-xs tracking-widest uppercase" style={{ color: "rgba(201,162,39,0.45)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 pb-24">
            <div className="text-center mb-12">
              <div className="section-divider max-w-sm mx-auto mb-8" />
              <h2 className="font-display text-4xl font-bold mb-3" style={{ color: "#c9a227" }}>Почему выбирают нас</h2>
              <p className="font-casino text-sm tracking-widest" style={{ color: "rgba(201,162,39,0.4)" }}>ТРАДИЦИИ · ЧЕСТНОСТЬ · ВЫИГРЫШИ</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "Shield", title: "Честная игра", desc: "Сертифицированный генератор случайных чисел. Проверенные алгоритмы, RTP от 96% до 99.5%" },
                { icon: "Zap", title: "Быстрые выплаты", desc: "Вывод средств в течение 15 минут. Поддерживаем все основные платёжные системы" },
                { icon: "Crown", title: "VIP программа", desc: "Эксклюзивные столы, персональный менеджер и увеличенные лимиты ставок для наших лучших игроков" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="card-casino p-7 rounded transition-all duration-300 cursor-default">
                  <div className="w-12 h-12 rounded mb-5 flex items-center justify-center"
                    style={{ background: "rgba(139,0,0,0.2)", border: "1px solid rgba(139,0,0,0.3)" }}>
                    <Icon name={icon as "Shield"} size={22} style={{ color: "#b22222" }} />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3" style={{ color: "#c9a227" }}>{title}</h3>
                  <p className="font-casino text-sm leading-relaxed" style={{ color: "rgba(201,162,39,0.5)", letterSpacing: "0.02em" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================== GAMES ======================== */}
      {section === "games" && (
        <div className="animate-fade-in pt-24 pb-24 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-casino text-xs tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(201,162,39,0.45)" }}>Зал игр</p>
            <h2 className="font-display text-5xl font-bold mb-2" style={{ color: "#c9a227" }}>Игровые столы</h2>
            <div className="section-divider max-w-xs mx-auto mt-5" />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className="font-casino text-xs tracking-widest uppercase px-5 py-2 rounded transition-all"
                style={{
                  background: filterCat === cat ? "linear-gradient(135deg, #c9a227, #f0d060)" : "rgba(201,162,39,0.06)",
                  color: filterCat === cat ? "#0d0d0d" : "rgba(201,162,39,0.55)",
                  border: filterCat === cat ? "none" : "1px solid rgba(201,162,39,0.15)",
                }}>
                {cat}
              </button>
            ))}
          </div>

          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-2">
              <span className="font-casino text-xs tracking-widest uppercase" style={{ color: "rgba(201,162,39,0.4)" }}>Валюта:</span>
              {CURRENCIES.map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  className="font-casino text-xs px-3 py-1.5 rounded transition-all"
                  style={{
                    background: currency === c ? "rgba(201,162,39,0.15)" : "transparent",
                    border: `1px solid ${currency === c ? "rgba(201,162,39,0.5)" : "rgba(201,162,39,0.15)"}`,
                    color: currency === c ? "#c9a227" : "rgba(201,162,39,0.4)",
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(game => (
              <div key={game.id}
                className="card-casino rounded overflow-hidden cursor-pointer transition-all duration-300"
                style={{ boxShadow: selectedGame === game.id ? "0 0 30px rgba(139,0,0,0.4)" : undefined }}
                onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}>
                <div className="table-green p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{game.icon}</span>
                    <div>
                      <div className="font-display text-lg font-bold" style={{ color: "#c9a227" }}>{game.name}</div>
                      <div className="font-casino text-xs uppercase tracking-widest mt-0.5" style={{ color: "rgba(201,162,39,0.45)" }}>{game.category}</div>
                    </div>
                  </div>
                  {game.hot && (
                    <div className="px-2 py-0.5 rounded text-xs font-casino tracking-widest"
                      style={{ background: "rgba(139,0,0,0.5)", border: "1px solid rgba(178,34,34,0.5)", color: "#f0d060" }}>
                      HOT
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-center">
                      <div className="font-casino text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(201,162,39,0.35)" }}>Мин.</div>
                      <div className="font-display text-lg font-bold" style={{ color: "#c9a227" }}>{formatCurrency(game.minBet, currency)}</div>
                    </div>
                    <div className="h-8 w-px" style={{ background: "rgba(201,162,39,0.15)" }} />
                    <div className="text-center">
                      <div className="font-casino text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(201,162,39,0.35)" }}>Макс.</div>
                      <div className="font-display text-lg font-bold" style={{ color: "#c9a227" }}>{formatCurrency(game.maxBet, currency)}</div>
                    </div>
                    <div className="h-8 w-px" style={{ background: "rgba(201,162,39,0.15)" }} />
                    <div className="text-center">
                      <div className="font-casino text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(201,162,39,0.35)" }}>RTP</div>
                      <div className="font-display text-lg font-bold" style={{ color: "#b22222" }}>{game.rtp}</div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mb-4">
                    {game.currencies.map(c => (
                      <span key={c} className="font-casino text-xs px-2 py-0.5 rounded"
                        style={{ background: "rgba(201,162,39,0.08)", color: "rgba(201,162,39,0.5)", border: "1px solid rgba(201,162,39,0.1)" }}>
                        {c}
                      </span>
                    ))}
                  </div>

                  {selectedGame === game.id ? (
                    <div className="animate-scale-in mt-4 pt-4" style={{ borderTop: "1px solid rgba(201,162,39,0.1)" }}>
                      <label className="font-casino text-xs tracking-widest uppercase block mb-2" style={{ color: "rgba(201,162,39,0.5)" }}>
                        Ставка ({currency})
                      </label>
                      <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded font-casino text-sm outline-none mb-3"
                        style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.2)", color: "#c9a227" }}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex gap-2 flex-wrap mb-3">
                        {[100, 500, 1000, 5000].map(v => (
                          <button key={v} onClick={e => { e.stopPropagation(); setBetAmount(String(v)); }}
                            className="chip text-yellow-400"
                            style={{ background: v >= 5000 ? "rgba(139,0,0,0.8)" : v >= 1000 ? "rgba(80,0,0,0.8)" : "rgba(30,15,0,0.8)", borderColor: v >= 5000 ? "#b22222" : "#c9a227" }}>
                            {v >= 1000 ? `${v / 1000}К` : v}
                          </button>
                        ))}
                      </div>
                      <button className="btn-crimson w-full py-3 rounded text-sm"
                        style={{ opacity: betPlaced ? 0.5 : 1 }}
                        onClick={e => { e.stopPropagation(); handleBet(); }}
                        disabled={betPlaced}>
                        {betPlaced ? "✓ Ставка принята!" : user ? "Сделать ставку" : "Войти для ставки"}
                      </button>
                    </div>
                  ) : (
                    <button className="w-full py-2.5 rounded font-casino text-xs tracking-widest uppercase transition-all"
                      style={{ border: "1px solid rgba(201,162,39,0.2)", color: "rgba(201,162,39,0.5)", background: "transparent" }}>
                      Открыть стол
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================== PROFILE ======================== */}
      {section === "profile" && user && (
        <div className="animate-fade-in pt-24 pb-24 px-4 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-casino text-xs tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(201,162,39,0.45)" }}>Личный кабинет</p>
            <h2 className="font-display text-5xl font-bold mb-2" style={{ color: "#c9a227" }}>Профиль</h2>
            <div className="section-divider max-w-xs mx-auto mt-5" />
          </div>

          <div className="card-casino rounded p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display"
                  style={{ background: "linear-gradient(135deg, #8b0000, #1a0000)", border: "2px solid rgba(201,162,39,0.4)" }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "#c9a227" }}>
                  <Icon name="Crown" size={12} style={{ color: "#0d0d0d" }} />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-display text-2xl font-bold mb-1" style={{ color: "#c9a227" }}>{user.username}</h3>
                <p className="font-casino text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(201,162,39,0.4)" }}>
                  {user.email}
                </p>
                <p className="font-casino text-xs tracking-widest uppercase mb-4" style={{ color: "rgba(201,162,39,0.3)" }}>
                  {user.vip_level.toUpperCase()} · Участник с {new Date(user.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {[
                    { label: "Всего ставок", value: String(user.total_bets) },
                    { label: "Выигрышей", value: user.total_bets > 0 ? `${Math.round((user.total_wins / user.total_bets) * 100)}%` : "—" },
                    { label: "Макс. выигрыш", value: formatCurrency(user.max_win, currency) },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center px-4 py-2 rounded"
                      style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.1)" }}>
                      <div className="font-display text-xl font-bold" style={{ color: "#c9a227" }}>{value}</div>
                      <div className="font-casino" style={{ color: "rgba(201,162,39,0.35)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { label: "Текущий баланс", value: user.balance, icon: "Wallet", highlight: true },
              { label: "Макс. выигрыш", value: user.max_win, icon: "TrendingUp", highlight: false },
            ].map(({ label, value, icon, highlight }) => (
              <div key={label} className="card-casino rounded p-5 text-center transition-all duration-300"
                style={highlight ? { border: "1px solid rgba(201,162,39,0.4)", boxShadow: "0 0 20px rgba(201,162,39,0.08)" } : {}}>
                <Icon name={icon as "Wallet"} size={20} className="mx-auto mb-3"
                  style={{ color: highlight ? "#c9a227" : "#8b0000" }} />
                <div className="font-display text-2xl font-bold mb-1" style={{ color: "#c9a227" }}>
                  {formatCurrency(value, currency)}
                </div>
                <div className="font-casino text-xs tracking-widest uppercase" style={{ color: "rgba(201,162,39,0.35)" }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button className="btn-gold py-3 rounded text-sm font-semibold tracking-widest">
              Пополнить баланс
            </button>
            <button className="btn-crimson py-3 rounded text-sm font-semibold tracking-widest"
              onClick={handleLogout}>
              Выйти из аккаунта
            </button>
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold mb-4" style={{ color: "#c9a227" }}>История операций</h3>
            <div className="card-casino rounded p-8 text-center">
              <Icon name="Clock" size={32} className="mx-auto mb-3" style={{ color: "rgba(201,162,39,0.2)" }} />
              <p className="font-display text-xl mb-1" style={{ color: "rgba(201,162,39,0.4)" }}>История пуста</p>
              <p className="font-casino text-xs tracking-widest uppercase" style={{ color: "rgba(201,162,39,0.2)" }}>
                Сделайте первую ставку — и она появится здесь
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
