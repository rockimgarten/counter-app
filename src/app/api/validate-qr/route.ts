export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qrCode = searchParams.get('qr');

  if (!qrCode) {
    return Response.json(
      { error: 'Missing qr parameter' },
      { status: 400 }
    );
  }

  try {
    const externalUrl = `http://rock-im-garten.com/validate_qr_code_data.php?qr=${encodeURIComponent(qrCode)}`;
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
