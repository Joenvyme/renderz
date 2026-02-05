import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/furniture
 * Récupère le catalogue de mobilier avec filtres optionnels
 * 
 * Query params:
 * - category: filtre par catégorie (sofa, chair, table, etc.)
 * - style: filtre par style (modern, scandinavian, etc.)
 * - supplier: filtre par fournisseur (nunc, etc.)
 * - search: recherche textuelle dans le nom
 * - limit: limite de résultats (défaut: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const style = searchParams.get('style');
    const supplier = searchParams.get('supplier');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Construire la requête
    let query = supabase
      .from('furniture_catalog')
      .select('*')
      .limit(limit);

    // Appliquer les filtres
    if (category) {
      query = query.eq('category', category);
    }
    if (style) {
      query = query.eq('style', style);
    }
    if (supplier) {
      query = query.eq('supplier_id', supplier);
    }
    if (search) {
      // Recherche textuelle dans le nom (utilise l'index GIN)
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du catalogue' },
        { status: 500 }
      );
    }

    // Transformer les données pour correspondre au format attendu par le frontend
    const items = (data || []).map(item => ({
      id: item.id,
      supplierId: item.supplier_id,
      name: item.name,
      category: item.category,
      style: item.style,
      imageUrl: item.image_url || '',
      promptEnhancement: item.prompt_enhancement,
      metadata: item.metadata || {},
    }));

    return NextResponse.json({
      items,
      total: items.length,
      filters: {
        category: category || null,
        style: style || null,
        supplier: supplier || null,
        search: search || null,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
