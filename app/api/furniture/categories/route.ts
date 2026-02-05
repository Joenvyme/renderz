import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('furniture_catalog')
      .select('category')
      .order('category', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des catégories' },
        { status: 500 }
      );
    }

    const categories = [...new Set((data || []).map(item => item.category))];
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
