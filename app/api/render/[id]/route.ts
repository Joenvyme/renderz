import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // Log pour debug
    console.log(`[API /render/${id}] status=${render.status}, generated=${!!render.generated_image_url}`);

    // Retourner avec headers anti-cache
    return NextResponse.json(render, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Get render error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id } = params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérifier que le render appartient à l'utilisateur
    const { data: render, error: fetchError } = await supabase
      .from('renders')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !render) {
      return NextResponse.json(
        { error: 'Render not found or access denied' },
        { status: 404 }
      );
    }

    // Supprimer les images du storage si elles existent
    const filesToDelete: string[] = [];
    
    if (render.generated_image_url) {
      // Extraire le chemin du fichier depuis l'URL
      const match = render.generated_image_url.match(/generated-renders\/(.+)$/);
      if (match) filesToDelete.push(match[1]);
    }
    
    if (render.upscaled_image_url && render.upscaled_image_url !== render.generated_image_url) {
      const match = render.upscaled_image_url.match(/upscaled-renders\/(.+)$/);
      if (match) {
        await supabase.storage.from('upscaled-renders').remove([match[1]]);
      }
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from('generated-renders').remove(filesToDelete);
    }

    // Supprimer le render de la base de données
    const { error: deleteError } = await supabase
      .from('renders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete render' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete render error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
