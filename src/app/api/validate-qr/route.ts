export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get('qr');
    const orderNumber = searchParams.get('bestellnummer');

    if (!qrCode && !orderNumber) {
        return Response.json(
            { error: 'Missing qr or bestellnummer parameter' },
            { status: 400 }
        );
    }

    try {
        const queryParam = qrCode ? `qr=${encodeURIComponent(qrCode)}` : `bestellnummer=${encodeURIComponent(orderNumber || '')}`;
        const externalUrl = `http://rock-im-garten.com/validate_qr_code_data.php?${queryParam}`;
        const response = await fetch(externalUrl);
        const data = await response.json();

        return Response.json(data);
    } catch (error) {
        console.error('Validation error:', error);
        return Response.json(
            { error: error instanceof Error ? error.message : 'Failed to validate code' },
            { status: 500 }
        );
    }
}
