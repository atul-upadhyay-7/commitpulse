import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { requireAdmin } from '@/lib/admin-auth';

// ─── PATCH /api/reviews/[id] ─────────────────────────────────────────────────
// Approve or reject a review (admin-only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  let body: { approved?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.approved !== 'boolean') {
    return NextResponse.json({ error: 'approved field must be a boolean' }, { status: 400 });
  }

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  await dbConnect();

  const review = await Review.findByIdAndUpdate(
    id,
    { approved: body.approved },
    { new: true }
  ).lean();

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    review,
  });
}

// ─── DELETE /api/reviews/[id] ────────────────────────────────────────────────
// Delete a review (admin-only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  await dbConnect();

  const review = await Review.findByIdAndDelete(id).lean();

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Review deleted',
  });
}
