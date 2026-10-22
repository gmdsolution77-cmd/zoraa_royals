import { getDb, initDb, isValidHexId, ObjectId } from '@/lib/mongodb';
import { getSessionUser, ROLES } from '@/lib/auth';

export async function GET(req) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true';

    const db = await getDb();
    const query = all ? {} : { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    let games = await db.collection('games').find(query).toArray();

    if (search && search.trim()) {
      const q = search.toLowerCase();
      games = games.filter(g =>
        g.title?.toLowerCase().includes(q) ||
        g.provider?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q)
      );
    }

    const mapped = games.map(g => ({
      id: g._id?.toString() || g.id || g.gameId,
      _id: g._id?.toString() || g.id || g.gameId,
      gameId: g.gameId || g.id || g._id?.toString(),
      title: g.title,
      name: g.title,
      provider: g.provider || 'Zorra Royal Studio',
      category: g.category || 'slots',
      thumbnail: g.thumbnail || g.image || '/images/vegas-777.webp',
      image: g.thumbnail || g.image || '/images/vegas-777.webp',
      badge: g.badge || '',
      url: g.url || '',
      isActive: g.isActive !== false,
      isHot: g.isHot || g.badge === 'HOT',
      isFeatured: g.isFeatured || g.badge === 'EXCLUSIVE' || g.badge === 'POPULAR',
      createdAt: g.createdAt || new Date(),
    }));

    return Response.json({ success: true, games: mapped });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || session.role === ROLES.PLAYER) {
      return Response.json({ success: false, error: 'Unauthorized staff action' }, { status: 403 });
    }

    const body = await req.json();
    const { title, provider, thumbnail, badge, url, category, isActive } = body;

    if (!title || !title.trim()) {
      return Response.json({ success: false, error: 'Game title is required' }, { status: 400 });
    }

    const db = await getDb();
    const gameId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    const newGame = {
      gameId,
      title: title.trim(),
      provider: (provider || 'Zorra Royal Studio').trim(),
      thumbnail: thumbnail || '/images/vegas-777.webp',
      badge: badge || 'HOT',
      url: url ? url.trim() : '',
      category: category || 'slots',
      isActive: isActive !== false,
      isHot: badge === 'HOT',
      isFeatured: badge === 'EXCLUSIVE' || badge === 'POPULAR',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection('games').insertOne(newGame);
    return Response.json({
      success: true,
      id: res.insertedId.toString(),
      game: { ...newGame, id: res.insertedId.toString(), _id: res.insertedId.toString() },
      message: 'Game added successfully',
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || session.role === ROLES.PLAYER) {
      return Response.json({ success: false, error: 'Unauthorized staff action' }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, provider, thumbnail, badge, url, category, isActive, isFeatured, isHot } = body;

    if (!id) {
      return Response.json({ success: false, error: 'Game ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const updateFields = {};

    if (title !== undefined) updateFields.title = title.trim();
    if (provider !== undefined) updateFields.provider = provider.trim();
    if (thumbnail !== undefined) updateFields.thumbnail = thumbnail;
    if (badge !== undefined) updateFields.badge = badge;
    if (url !== undefined) updateFields.url = url ? url.trim() : '';
    if (category !== undefined) updateFields.category = category;
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);
    if (isFeatured !== undefined) updateFields.isFeatured = Boolean(isFeatured);
    if (isHot !== undefined) updateFields.isHot = Boolean(isHot);
    updateFields.updatedAt = new Date();

    const query = isValidHexId(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }, { gameId: id }, { id }] }
      : { $or: [{ _id: id }, { gameId: id }, { id }] };

    const result = await db.collection('games').updateOne(query, { $set: updateFields });

    return Response.json({
      success: true,
      message: 'Game updated successfully',
      matchedCount: result.matchedCount,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || session.role === ROLES.PLAYER) {
      return Response.json({ success: false, error: 'Unauthorized staff action' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, error: 'Game ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const query = isValidHexId(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }, { gameId: id }, { id }] }
      : { $or: [{ _id: id }, { gameId: id }, { id }] };

    await db.collection('games').deleteOne(query);

    return Response.json({ success: true, message: 'Game deleted successfully' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
