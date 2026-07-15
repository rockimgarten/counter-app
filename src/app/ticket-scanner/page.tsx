'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import Image from 'next/image';
import Link from 'next/link';

export default function TicketScannerPage() {
    const [qrCode, setQrCode] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState<'qr' | 'order'>('qr');
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const validateOrderNumber = async () => {
        if (!orderNumber.trim()) {
            setError('Please enter a bestellnummer');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch(`/api/validate-qr?bestellnummer=${encodeURIComponent(orderNumber)}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to validate order number');
            } else {
                setResponse(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to validate order number');
        } finally {
            setLoading(false);
        }
    };

    const matchedOrder = response?.matched_bestellung;
    const qrCodes = matchedOrder?.qr_codes || response?.qr_codes || [];
    const orderQrCodes = response?.matched_qr_codes_by_bestellnummer || [];

    useEffect(() => {
        if (!isScanning) return;

        let stream: MediaStream | null = null;
        let cancelled = false;
        let intervalId: number | undefined;

        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error('Your browser does not support camera access.');
                }

                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

                if (cancelled || !videoRef.current) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraError(null);

                const scanFrame = () => {
                    if (cancelled || !videoRef.current || !canvasRef.current) return;

                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');

                    if (!context || video.readyState < 2) {
                        intervalId = window.setTimeout(scanFrame, 200);
                        return;
                    }

                    const width = video.videoWidth;
                    const height = video.videoHeight;

                    if (!width || !height) {
                        intervalId = window.setTimeout(scanFrame, 200);
                        return;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    context.drawImage(video, 0, 0, width, height);

                    const imageData = context.getImageData(0, 0, width, height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code) {
                        setQrCode(code.data);
                        setSearchMode('qr');
                        setIsScanning(false);
                        setCameraError(null);
                        cancelled = true;
                        return;
                    }

                    intervalId = window.setTimeout(scanFrame, 200);
                };

                scanFrame();
            } catch (err) {
                if (!cancelled) {
                    setCameraError(err instanceof Error ? err.message : 'Camera access failed');
                    setIsScanning(false);
                }
            }
        };

        startCamera();

        return () => {
            cancelled = true;
            if (intervalId) {
                window.clearTimeout(intervalId);
            }
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isScanning]);

    const startCameraScan = async () => {
        setError(null);
        setCameraError(null);
        setIsScanning(true);
    };

    const stopCameraScan = () => {
        setIsScanning(false);
        setCameraError(null);
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

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

                    <div className="mb-6 flex rounded-full bg-white/10 p-1">
                        <button
                            onClick={() => setSearchMode('qr')}
                            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${searchMode === 'qr' ? 'bg-yellow-400 text-blue-800' : 'text-white/80 hover:bg-white/20'}`}
                        >
                            Via QR Code
                        </button>
                        <button
                            onClick={() => setSearchMode('order')}
                            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${searchMode === 'order' ? 'bg-yellow-400 text-blue-800' : 'text-white/80 hover:bg-white/20'}`}
                        >
                            Via Bestellnummer
                        </button>
                    </div>

                    <div className="space-y-4">
                        {searchMode === 'qr' ? (
                            <>
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

                                <div className="flex gap-3">
                                    <button
                                        onClick={validateQrCode}
                                        disabled={loading}
                                        className="flex-1 px-4 py-3 bg-yellow-400 text-blue-800 font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Validating...' : 'Validate Code'}
                                    </button>
                                    <button
                                        onClick={isScanning ? stopCameraScan : startCameraScan}
                                        className="px-4 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
                                    >
                                        {isScanning ? 'Stop Camera' : 'Scan with Camera'}
                                    </button>
                                </div>

                                <div className="rounded-lg border border-white/20 bg-black/20 p-3">
                                    {isScanning ? (
                                        <>
                                            <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted />
                                            <canvas ref={canvasRef} className="hidden" />
                                            <p className="mt-2 text-sm text-white/70">Point your camera at the QR code and hold still.</p>
                                        </>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-white/20 p-4 text-center text-sm text-white/70">
                                            Use the camera button to scan a QR code directly from your phone.
                                        </div>
                                    )}
                                </div>

                                {cameraError && (
                                    <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                                        {cameraError}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div>
                                    <input
                                        type="text"
                                        value={orderNumber}
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !loading && validateOrderNumber()}
                                        placeholder="Enter bestellnummer..."
                                        className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    onClick={validateOrderNumber}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-yellow-400 text-blue-800 font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Searching...' : 'Search Order'}
                                </button>
                            </>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                                {error}
                            </div>
                        )}

                        {response && (
                            <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
                                {orderQrCodes.length > 0 ? (
                                    <div className="space-y-4 text-left">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">QR-Codes für Bestellnummer gefunden</h3>
                                            <p className="mt-1 text-sm text-white/80">
                                                Klicken Sie auf einen Eintrag, um den Code im oberen Feld zu verwenden.
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-white/10 p-4">
                                            <div className="mt-3 space-y-2">
                                                {orderQrCodes.map((qr: any, index: number) => (
                                                    <button
                                                        key={`${qr.qr_code_data || qr.ticket_no}-${index}`}
                                                        type="button"
                                                        onClick={() => {
                                                            setQrCode(qr.qr_code_data);
                                                            setSearchMode('qr');
                                                        }}
                                                        className="w-full rounded bg-black/10 p-3 text-left text-sm transition-colors hover:bg-black/20"
                                                    >
                                                        <div className="font-medium text-white">{qr.qr_code_data}</div>
                                                        <div className="text-white/70">
                                                            Ticket Nr.: {qr.ticket_no} · Produkt-ID: {qr.productId} · HMAC: {qr.hmac}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : matchedOrder ? (
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
