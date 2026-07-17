'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Counter {
  id: string;
  serverId?: number;
  name: string;
  count: number;
  max?: number;
  category?: string;
  info?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role?: {
    type?: string;
    name?: string;
  };
}

interface AuthResponse {
  jwt: string;
  user: User;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface ApiCounter {
  id: number;
  attributes: {
    name: string;
    amount: number;
    max: number | null;
    category: string | null;
    info: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
  };
}

interface ApiResponse<T> {
  data: T;
  meta: {};
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1337/api/counter-app-rigs';
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:1337/api';

// Authentication functions
const registerUser = async (credentials: RegisterCredentials): Promise<AuthResponse | null> => {
  try {
    const response = await fetch(`${AUTH_BASE}/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Registrierung fehlgeschlagen');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration failed:', error);
    return null;
  }
};

const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
  try {
    const response = await fetch(`${AUTH_BASE}/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: credentials.email,
        password: credentials.password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Anmeldung fehlgeschlagen');
    }

    return await response.json();
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
};

const fetchUserWithRole = async (token: string): Promise<User | null> => {
  try {
    const userResponse = await fetch(`${AUTH_BASE}/users/me?populate=role`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userResponse.ok) {
      throw new Error(`HTTP error! status: ${userResponse.status}`);
    }

    const userData: User = await userResponse.json();
    return userData;
  } catch (error) {
    console.error('Failed to fetch user role:', error);
    return null;
  }
};

// API functions
const fetchCounters = async (token: string): Promise<Counter[]> => {
  try {
    const response = await fetch(API_BASE, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<ApiCounter[]> = await response.json();
    return result.data.map(apiCounter => ({
      id: apiCounter.id.toString(),
      serverId: apiCounter.id,
      name: apiCounter.attributes.name,
      count: apiCounter.attributes.amount,
      max: apiCounter.attributes.max || undefined,
      category: apiCounter.attributes.category || undefined,
      info: apiCounter.attributes.info || undefined
    }));
  } catch (error) {
    console.error('Zähler konnten nicht geladen werden:', error);
    return [];
  }
};

const createCounter = async (name: string, max?: number, category?: string, info?: string, token?: string): Promise<Counter | null> => {
  if (!token) return null;

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          name,
          amount: 0,
          max: max || null,
          category: category || null,
          info: info || null
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<ApiCounter> = await response.json();
    return {
      id: result.data.id.toString(),
      serverId: result.data.id,
      name: result.data.attributes.name,
      count: result.data.attributes.amount,
      max: result.data.attributes.max || undefined,
      category: result.data.attributes.category || undefined,
      info: result.data.attributes.info || undefined
    };
  } catch (error) {
    console.error('Zähler konnte nicht erstellt werden:', error);
    return null;
  }
};

const updateCounterDetails = async (serverId: number, name: string, max?: number, category?: string, info?: string, token?: string): Promise<boolean> => {
  if (!token) return false;

  try {
    await fetch(`${API_BASE}/${serverId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          name,
          max: max || null,
          category: category || null,
          info: info || null
        }
      })
    });
    return true;
  } catch (error) {
    console.error('Zählerdetails konnten nicht aktualisiert werden:', error);
    return false;
  }
};

const updateCounter = async (serverId: number, count: number, token?: string): Promise<boolean> => {
  if (!token) return false;

  try {
    await fetch(`${API_BASE}/${serverId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          amount: count
        }
      })
    });
    return true;
  } catch (error) {
    console.error('Zähler konnte nicht aktualisiert werden:', error);
    return false;
  }
};

const deleteCounter = async (serverId: number, token?: string): Promise<boolean> => {
  if (!token) return false;

  try {
    await fetch(`${API_BASE}/${serverId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (error) {
    console.error('Zähler konnte nicht gelöscht werden:', error);
    return false;
  }
};

export default function HomePage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterMax, setNewCounterMax] = useState('');
  const [newCounterCategory, setNewCounterCategory] = useState('');
  const [newCounterInfo, setNewCounterInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingMax, setEditingMax] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editingInfo, setEditingInfo] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasAuthenticatedRole = user?.role?.type === 'authenticated' || user?.role?.name?.toLowerCase() === 'authenticated';

  // Get unique categories from existing counters
  const existingCategories = [...new Set(counters.filter(c => c.category).map(c => c.category))];

  // Filter counters based on selected category
  const filteredCounters = selectedCategory === 'all'
    ? counters
    : counters.filter(counter => counter.category === selectedCategory);

  // Check for stored authentication on component mount
  useEffect(() => {
    // Mark as hydrated first
    setIsHydrated(true);

    // Only check localStorage after hydration
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);

        void (async () => {
          const freshUser = await fetchUserWithRole(storedToken);
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })();
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        // Clear invalid stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Load counters when user is authenticated
  useEffect(() => {
    const loadCounters = async () => {
      if (!token) return;

      setLoading(true);
      const fetchedCounters = await fetchCounters(token);
      setCounters(fetchedCounters);
      setLoading(false);
    };

    if (token) {
      loadCounters();
    }
  }, [token]);

  const startEditing = (counter: Counter) => {
    setEditingId(counter.id);
    setEditingName(counter.name);
    setEditingMax(counter.max?.toString() || '');
    setEditingCategory(counter.category || '');
    setEditingInfo(counter.info || '');
  };

  const saveEdit = async () => {
    const counter = counters.find(c => c.id === editingId);
    if (!counter || !counter.serverId || !token) return;

    const maxValue = editingMax.trim() ? parseInt(editingMax) : undefined;
    const category = editingCategory.trim() || undefined;
    const info = editingInfo.trim() || undefined;

    const success = await updateCounterDetails(counter.serverId, editingName.trim(), maxValue, category, info, token);
    if (success) {
      setCounters(counters.map(c =>
        c.id === editingId
          ? { ...c, name: editingName.trim(), max: maxValue, category, info }
          : c
      ));
      setEditingId(null);
      setEditingName('');
      setEditingMax('');
      setEditingCategory('');
      setEditingInfo('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingMax('');
    setEditingCategory('');
    setEditingInfo('');
  };

  const toggleMenu = (counterId: string) => {
    const newExpandedMenus = new Set(expandedMenus);
    if (newExpandedMenus.has(counterId)) {
      newExpandedMenus.delete(counterId);
    } else {
      newExpandedMenus.add(counterId);
    }
    setExpandedMenus(newExpandedMenus);
  };

  // Authentication handlers
  const handleLogin = async (credentials: LoginCredentials) => {
    setIsAuthenticating(true);
    setAuthError(null);

    const authData = await loginUser(credentials);

    if (authData) {
      setToken(authData.jwt);
      const userWithRole = await fetchUserWithRole(authData.jwt);
      const resolvedUser = userWithRole || authData.user;
      setUser(resolvedUser);
      localStorage.setItem('authToken', authData.jwt);
      localStorage.setItem('user', JSON.stringify(resolvedUser));
    } else {
      setAuthError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Angaben.');
    }

    setIsAuthenticating(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setCounters([]);
    setAuthError(null);
  };

  const addCounter = async () => {
    if (newCounterName.trim() && token) {
      setLoading(true);
      const maxValue = newCounterMax.trim() ? parseInt(newCounterMax) : undefined;
      const category = newCounterCategory.trim() || undefined;
      const info = newCounterInfo.trim() || undefined;
      const newCounter = await createCounter(newCounterName.trim(), maxValue, category, info, token);

      if (newCounter) {
        setCounters([...counters, newCounter]);
        setNewCounterName('');
        setNewCounterMax('');
        setNewCounterCategory('');
        setNewCounterInfo('');
      }
      setLoading(false);
    }
  };

  const handleUpdateCounter = async (id: string, delta: number) => {
    const counter = counters.find(c => c.id === id);
    if (!counter || !counter.serverId || !token) return;

    const newCount = counter.count + delta;
    const minCount = Math.max(0, newCount);
    const maxCount = counter.max ? Math.min(counter.max, minCount) : minCount;

    // Optimistic update
    setCounters(counters.map(c =>
      c.id === id ? { ...c, count: maxCount } : c
    ));

    // Update on server
    const success = await updateCounter(counter.serverId, maxCount, token);
    if (!success) {
      // Revert on failure
      setCounters(counters.map(c =>
        c.id === id ? { ...c, count: counter.count } : c
      ));
    }
  };

  const removeCounter = async (id: string) => {
    const counter = counters.find(c => c.id === id);
    if (!counter || !counter.serverId || !token) return;

    // Optimistic delete
    setCounters(counters.filter(c => c.id !== id));

    const success = await deleteCounter(counter.serverId, token);
    if (!success) {
      // Revert on failure
      setCounters([...counters, counter]);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start text-white p-8" style={{ background: 'linear-gradient(180deg, #009860, #163a4c)' }}>
      {/* Corner images */}
      <div className="absolute top-4 left-4 z-10">
        <Image
          src="/oma.png"
          alt="Oma"
          width={100}
          height={100}
          className="object-contain"
        />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Image
          src="/punk.png"
          alt="Punk"
          width={100}
          height={100}
          className="object-contain"
        />
      </div>

      <div className="container max-w-4xl">
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-full bg-white/10 p-1 backdrop-blur-sm">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-yellow-400 text-blue-800"
            >
              Counter App
            </Link>
            <Link
              href="/ticket-scanner"
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/20"
            >
              Ticket Scanner
            </Link>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/RiGlogo.png"
            alt="RiG Logo"
            width={200}
            height={100}
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-center mb-12">
          <span className="text-yellow-400">Counter</span> App
        </h1>

        {!isHydrated ? (
          /* Loading state during hydration */
          <div className="text-center text-white/70 py-12">
            <p className="text-xl">Wird geladen...</p>
          </div>
        ) : !user ? (
          /* Authentication UI */
          <div className="bg-white/10 rounded-xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Anmelden</h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const credentials = {
                email: formData.get('email') as string,
                password: formData.get('password') as string
              };
              handleLogin(credentials);
            }}>
              <div className="space-y-4">
                {/* Development notice */}
                <div className="text-yellow-300 text-sm text-center bg-yellow-400/10 p-3 rounded">
                  💡 Verwenden Sie Ihre Strapi-Anmeldedaten
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="E-Mail"
                  className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Passwort"
                  className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                  minLength={6}
                />

                {authError && (
                  <div className="text-red-400 text-sm text-center">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full px-4 py-2 bg-yellow-400 text-blue-800 font-bold rounded hover:bg-yellow-300 disabled:opacity-50 transition-colors"
                >
                  {isAuthenticating ? 'Anmelden...' : 'Anmelden'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Main Counter Interface */
          <>
            {/* User info and logout */}
            <div className="flex justify-between items-center mb-8">
              <div className="text-white/70">
                Willkommen, {user.username}!
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded transition-colors"
              >
                Abmelden
              </button>
            </div>

            {/* Add new counter form */}
            {hasAuthenticatedRole && (
              <div className="bg-white/10 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">Neuen Zähler hinzufügen</h2>
                <div className="flex gap-4 flex-wrap">
                  <input
                    type="text"
                    value={newCounterName}
                    onChange={(e) => setNewCounterName(e.target.value)}
                    placeholder="Zählername eingeben..."
                    className="flex-1 min-w-48 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && addCounter()}
                    disabled={loading}
                  />
                  <input
                    type="number"
                    value={newCounterMax}
                    onChange={(e) => setNewCounterMax(e.target.value)}
                    placeholder="Maximum (optional)"
                    min="1"
                    className="w-32 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && addCounter()}
                    disabled={loading}
                  />
                  <div className="relative">
                    <input
                      type="text"
                      value={newCounterCategory}
                      onChange={(e) => setNewCounterCategory(e.target.value)}
                      placeholder="Kategorie (optional)"
                      list="categories"
                      className="w-40 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      onKeyPress={(e) => e.key === 'Enter' && !loading && addCounter()}
                      disabled={loading}
                    />
                    {existingCategories.length > 0 && (
                      <datalist id="categories">
                        {existingCategories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newCounterInfo}
                    onChange={(e) => setNewCounterInfo(e.target.value)}
                    placeholder="Info (optional)"
                    className="w-48 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && addCounter()}
                    disabled={loading}
                  />
                  <button
                    onClick={addCounter}
                    disabled={loading}
                    className="px-6 py-2 bg-yellow-400 text-blue-800 font-bold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Wird hinzugefügt...' : 'Zähler hinzufügen'}
                  </button>
                </div>
              </div>
            )}

            {/* Category filter tabs */}
            {existingCategories.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === 'all'
                      ? 'bg-yellow-400 text-blue-800'
                      : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    Alle ({counters.length})
                  </button>
                  {existingCategories.map((category) => {
                    const categoryCount = counters.filter(c => c.category === category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => category && setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category
                          ? 'bg-yellow-400 text-blue-800'
                          : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                      >
                        {category} ({categoryCount})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && counters.length === 0 && (
              <div className="text-center text-white/70 py-12">
                <p className="text-xl">Zähler werden geladen...</p>
              </div>
            )}

            {/* Counters list */}
            <div className="grid gap-4">
              {!loading && filteredCounters.length === 0 && counters.length === 0 ? (
                <div className="text-center text-white/70 py-12">
                  <p className="text-xl">Noch keine Zähler vorhanden. Fügen Sie oben einen hinzu, um zu beginnen!</p>
                </div>
              ) : !loading && filteredCounters.length === 0 && counters.length > 0 ? (
                <div className="text-center text-white/70 py-12">
                  <p className="text-xl">Keine Zähler in dieser Kategorie.</p>
                </div>
              ) : (
                filteredCounters.map((counter) => {
                  const isCompleted = counter.max && counter.count >= counter.max;
                  const isEditing = editingId === counter.id;
                  const isMenuExpanded = expandedMenus.has(counter.id);

                  return (
                    <div
                      key={counter.id}
                      className={`rounded-xl p-4 transition-colors ${isCompleted
                        ? 'bg-green-500/20 border-2 border-green-500/50'
                        : 'bg-white/10 border-2 border-transparent'
                        }`}
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex gap-2 flex-wrap">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="Zählername"
                              className="flex-1 min-w-48 px-3 py-1 rounded bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <input
                              type="number"
                              value={editingMax}
                              onChange={(e) => setEditingMax(e.target.value)}
                              placeholder="Maximum"
                              min="1"
                              className="w-24 px-3 py-1 rounded bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <input
                              type="text"
                              value={editingCategory}
                              onChange={(e) => setEditingCategory(e.target.value)}
                              placeholder="Kategorie"
                              list="edit-categories"
                              className="w-32 px-3 py-1 rounded bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <input
                              type="text"
                              value={editingInfo}
                              onChange={(e) => setEditingInfo(e.target.value)}
                              placeholder="Info"
                              className="w-40 px-3 py-1 rounded bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            {existingCategories.length > 0 && (
                              <datalist id="edit-categories">
                                {existingCategories.map((category) => (
                                  <option key={category} value={category} />
                                ))}
                              </datalist>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="px-3 py-1 bg-green-500 hover:bg-green-400 text-white text-sm font-bold rounded transition-colors"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 bg-gray-500 hover:bg-gray-400 text-white text-sm font-bold rounded transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Main counter info - always visible */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold truncate">{counter.name}</h3>
                              </div>
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-2xl font-extrabold text-yellow-400">{counter.count}</span>
                                {counter.max && (
                                  <span className="text-sm text-white/70">/ {counter.max}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {counter.category && (
                                  <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium hidden sm:inline-block">
                                    {counter.category}
                                  </span>
                                )}
                                {counter.info && (
                                  <span className="bg-white/20 text-white px-2 py-0.5 rounded text-xs font-medium hidden sm:inline-block">
                                    {counter.info}
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                                    Abgeschlossen
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Main action buttons */}
                            <div className="flex gap-2 items-center">
                              {/* Desktop edit/delete - small icons */}
                              {hasAuthenticatedRole && (
                                <div className="hidden sm:flex gap-1 items-center opacity-70 hover:opacity-100 transition-opacity mr-2">
                                  <button
                                    onClick={() => startEditing(counter)}
                                    className="w-8 h-8 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-md transition-colors disabled:opacity-50"
                                    title="Zähler bearbeiten"
                                    disabled={loading}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => removeCounter(counter.id)}
                                    className="w-8 h-8 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-md transition-colors disabled:opacity-50"
                                    title="Zähler löschen"
                                    disabled={loading || isEditing}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}

                              {/* Mobile menu toggle */}
                              <button
                                onClick={() => toggleMenu(counter.id)}
                                className="w-8 h-8 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-md transition-colors sm:hidden"
                                title="Menü"
                              >
                                ⚙️
                              </button>

                              {/* Plus/Minus buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateCounter(counter.id, -1)}
                                  className="w-12 h-12 bg-red-500 hover:bg-red-400 text-white font-bold text-xl rounded-lg transition-colors disabled:opacity-50 shadow-lg"
                                  disabled={counter.count === 0 || loading || isEditing}
                                >
                                  −
                                </button>
                                <button
                                  onClick={() => handleUpdateCounter(counter.id, 1)}
                                  className="w-12 h-12 bg-green-500 hover:bg-green-400 text-white font-bold text-xl rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                  disabled={isCompleted || loading || isEditing}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Category on mobile when not enough space */}
                          {(counter.category || counter.info) && (
                            <div className="sm:hidden">
                              {counter.category && (
                                <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                                  {counter.category}
                                </span>
                              )}
                              {counter.info && (
                                <span className="ml-2 bg-white/20 text-white px-2 py-0.5 rounded text-xs font-medium">
                                  {counter.info}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Edit/Delete actions - mobile only */}
                          {hasAuthenticatedRole && (
                            <div className={`flex gap-2 sm:hidden ${isMenuExpanded ? 'block' : 'hidden'}`}>
                              <button
                                onClick={() => startEditing(counter)}
                                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                                title="Zähler bearbeiten"
                                disabled={loading}
                              >
                                ✏️ Bearbeiten
                              </button>
                              <button
                                onClick={() => removeCounter(counter.id)}
                                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                                title="Zähler löschen"
                                disabled={loading || isEditing}
                              >
                                🗑️ Löschen
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

