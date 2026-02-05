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
      .select('style')
      .order('style', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des styles' },
        { status: 500 }
      );
    }

    const styles = [...new Set((data || []).map(item => item.style))];
    return NextResponse.json({ styles });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
