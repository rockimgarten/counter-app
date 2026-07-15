'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function TicketScannerPage() {
    const [qrCode, setQrCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const validateQrCode = async () => {
        if (!qrCode.trim()) {
            setError('Please enter a code');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch(`/api/validate-qr?qr=${encodeURIComponent(qrCode)}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to validate code');
            } else {
                setResponse(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to validate code');
        } finally {
            setLoading(false);
        }
    };

    const matchedOrder = response?.matched_bestellung;
    const qrCodes = matchedOrder?.qr_codes || response?.qr_codes || [];

    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-8 text-white" style={{ background: 'linear-gradient(180deg, #009860, #163a4c)' }}>
            {/* Navigation tabs */}
            <div className="flex justify-center mb-8">
                <div className="inline-flex rounded-full bg-white/10 p-1 backdrop-blur-sm">
                    <Link
                        href="/"
                        className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/20"
                    >
                        Counter App
                    </Link>
                    <Link
                        href="/ticket-scanner"
                        className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-yellow-400 text-blue-800"
                    >
                        Ticket Scanner
                    </Link>
                </div>
            </div>

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
                    <span className="text-yellow-400">Ticket</span> Scanner
                </h1>

                {/* Content placeholder */}
                <div className="bg-white/10 rounded-xl p-8 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 text-center">Validate QR Code</h2>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={qrCode}
                                onChange={(e) => setQrCode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !loading && validateQrCode()}
                                placeholder="Enter QR code or ticket code..."
                                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={validateQrCode}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-yellow-400 text-blue-800 font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Validating...' : 'Validate Code'}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                                {error}
                            </div>
                        )}

                        {response && (
                            <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
                                {matchedOrder ? (
                                    <div className="space-y-4 text-left">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Bestellung gefunden</h3>
                                            <p className="mt-1 text-sm text-white/80">
                                                Die angegebene Ticket-Nummer wurde erfolgreich zugeordnet.
                                            </p>
                                        </div>

                                        <div className="grid gap-3 rounded-lg bg-white/10 p-4 sm:grid-cols-2">
                                            <div>
                                                <div className="text-xs uppercase tracking-wide text-white/60">Bestellnummer</div>
                                                <div className="font-semibold text-white">{matchedOrder.attributes?.bestellnummer || matchedOrder.bestellnummer}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wide text-white/60">Bestell-ID</div>
                                                <div className="font-semibold text-white">#{matchedOrder.id}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wide text-white/60">Erstellt</div>
                                                <div className="font-semibold text-white">{matchedOrder.attributes?.erstellt || '—'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wide text-white/60">Summe</div>
                                                <div className="font-semibold text-white">{matchedOrder.attributes?.summe ?? 0} €</div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-white/10 p-4">
                                            <h4 className="font-semibold text-white">Positionen</h4>
                                            <div className="mt-3 space-y-2">
                                                {(matchedOrder.attributes?.posten || []).map((item: any, index: number) => (
                                                    <div key={`${item.name}-${index}`} className="rounded bg-black/10 p-2 text-sm">
                                                        <div className="font-medium text-white">{item.name}</div>
                                                        <div className="text-white/70">
                                                            Anzahl: {item.anzahl} · Preis: {item.preis} € · Ticket-Nr.: {item.countSoFar}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-3 rounded-lg bg-white/10 p-4 md:grid-cols-2">
                                            <div>
                                                <h4 className="font-semibold text-white">Käufer</h4>
                                                <div className="mt-2 space-y-1 text-sm text-white/80">
                                                    <div>{matchedOrder.attributes?.Besteller?.vorname} {matchedOrder.attributes?.Besteller?.name}</div>
                                                    <div>{matchedOrder.attributes?.Besteller?.email}</div>
                                                    <div>Newsletter: {matchedOrder.attributes?.Besteller?.Newsletter ? 'Ja' : 'Nein'}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white">Adresse</h4>
                                                <div className="mt-2 space-y-1 text-sm text-white/80">
                                                    <div>Versand: {matchedOrder.attributes?.ShippingAddress?.address_line_1 || '—'}</div>
                                                    <div>Rechnung: {matchedOrder.attributes?.billing_address?.address_line_1 || '—'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-white/10 p-4">
                                            <h4 className="font-semibold text-white">QR-Codes</h4>
                                            <div className="mt-3 space-y-2">
                                                {qrCodes.map((qr: any, index: number) => (
                                                    <div key={`${qr.qr_code_data || qr.ticket_no}-${index}`} className="rounded bg-black/10 p-2 text-sm">
                                                        <div className="font-medium text-white">{qr.qr_code_data}</div>
                                                        <div className="text-white/70">
                                                            Ticket Nr.: {qr.ticket_no} · Produkt-ID: {qr.productId} · HMAC: {qr.hmac}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-white/80">
                                        <div className="font-semibold text-white">Antwort:</div>
                                        <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-sm text-white/80">
                                            {JSON.stringify(response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
