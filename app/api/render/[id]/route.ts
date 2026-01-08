import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: render, error } = await supabase
      .from('renders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !render) {
      return NextResponse.json(
        { error: 'Render not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(render);
  } catch (error) {
    console.error('Get render error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

