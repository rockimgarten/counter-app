const getErrorMessage = (payload: unknown): string => {
    if (typeof payload === 'string') {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        const maybeError = record.error;

        if (typeof maybeError === 'string') {
            return maybeError;
        }

        if (maybeError && typeof maybeError === 'object') {
            const errorRecord = maybeError as Record<string, unknown>;
            const message = errorRecord.message;
            const details = errorRecord.details;

            if (typeof message === 'string') {
                return message;
            }

            if (details && typeof details === 'object') {
                const errors = (details as { errors?: Array<{ message?: string }> }).errors;
                const firstErrorMessage = errors?.find((entry) => typeof entry?.message === 'string')?.message;
                if (firstErrorMessage) {
                    return firstErrorMessage;
                }
            }
        }

        if (typeof record.message === 'string') {
            return record.message;
        }
    }

    return 'Failed to sync with Strapi';
};

const findExistingQrCode = async (code: string, authHeader: string | null) => {
    const response = await fetch(
        `https://strapi-3tgn.onrender.com/api/e-ticket-app-data-rigs?filters[qr_code_data][$eq]=${encodeURIComponent(code)}&pagination[pageSize]=1`,
        {
            method: 'GET',
            headers: {
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
        }
    );

    if (!response.ok) {
        return false;
    }

    const payload = await response.json().catch(() => null);
    const entries = Array.isArray(payload?.data) ? payload.data : [];

    return entries.some((entry: any) => {
        const storedValue = entry?.attributes?.qr_code_data ?? entry?.qr_code_data;
        return typeof storedValue === 'string' && storedValue.trim().toLowerCase() === code.trim().toLowerCase();
    });
};

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body?.qr_code_data) {
            return Response.json(
                { error: 'Missing qr_code_data' },
                { status: 400 }
            );
        }

        const authHeader = request.headers.get('authorization');
        const existingQrCode = await findExistingQrCode(body.qr_code_data, authHeader);

        if (existingQrCode) {
            return Response.json(
                { error: 'This QR code is already used.' },
                { status: 409 }
            );
        }

        const payload = {
            data: {
                qr_code_data: body.qr_code_data,
                name: body.name ?? null,
                bestellung: body.bestellung ?? null,
                valid: Boolean(body.valid),
            },
        };

        const response = await fetch('https://strapi-3tgn.onrender.com/api/e-ticket-app-data-rigs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify(payload),
        });

        const rawBody = await response.text();
        let parsedBody: unknown = null;

        if (rawBody) {
            try {
                parsedBody = JSON.parse(rawBody);
            } catch {
                parsedBody = rawBody;
            }
        }

        const message = getErrorMessage(parsedBody);
        const isDuplicate = /already exists|already used|duplicate|unique/i.test(message);

        if (!response.ok) {
            return Response.json(
                { error: isDuplicate ? 'This QR code is already used.' : message },
                { status: response.status }
            );
        }

        return new Response(rawBody || JSON.stringify(parsedBody || {}), {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/json',
            },
        });
    } catch (error) {
        console.error('Strapi sync error:', error);
        return Response.json(
            { error: error instanceof Error ? error.message : 'Failed to sync with Strapi' },
            { status: 500 }
        );
    }
}
