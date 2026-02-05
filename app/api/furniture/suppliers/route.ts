import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/furniture/suppliers
 * Récupère la liste des fournisseurs disponibles
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('furniture_catalog')
      .select('supplier_id')
      .order('supplier_id', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des fournisseurs' },
        { status: 500 }
      );
    }

    const suppliers = Array.from(new Set((data || [])
      .map(item => item.supplier_id)
      .filter(id => id && id.trim() !== ''))); // Filtrer les valeurs nulles ou vides
    
    console.log('Fournisseurs trouvés:', suppliers);
    console.log('Nombre de fournisseurs:', suppliers.length);
    
    return NextResponse.json({ suppliers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
