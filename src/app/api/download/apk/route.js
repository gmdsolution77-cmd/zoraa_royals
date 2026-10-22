import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'download', 'zorra-royals.apk'),
      path.join(process.cwd(), 'public', 'download', 'zoraaroyal.apk'),
      path.join(process.cwd(), 'public', 'zorra-royals.apk'),
      path.join(process.cwd(), 'public', 'zoraaroyal.apk'),
    ];

    let apkPath = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        apkPath = p;
        break;
      }
    }

    if (!apkPath) {
      return NextResponse.json(
        {
          success: false,
          error: 'Official Zorra Royals APK is currently being synchronized. Please retry in a moment.',
        },
        { status: 404 }
      );
    }

    const stat = fs.statSync(apkPath);
    const fileStream = fs.createReadStream(apkPath);

    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="zorra-royals.apk"',
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error) {
    console.error('APK stream error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download APK.' },
      { status: 500 }
    );
  }
}
