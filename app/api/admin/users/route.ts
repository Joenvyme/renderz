import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Admin emails autorisés
const ADMIN_EMAILS = ['joey.montani@gmail.com'];

export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    if (!ADMIN_EMAILS.includes(session.user.email || '')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer tous les utilisateurs de Better Auth
    const { data: users, error: usersError } = await supabase
      .from('user')
      .select('id, name, email, image, emailVerified, createdAt')
      .order('createdAt', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des utilisateurs' }, { status: 500 });
    }

    // Récupérer les stats de rendus pour chaque utilisateur
    const { data: renders, error: rendersError } = await supabase
      .from('renders')
      .select('user_id, status, generated_image_url, upscaled_image_url');

    if (rendersError) {
      console.error('Error fetching renders:', rendersError);
    }

    // Calculer les stats par utilisateur
    const userStats = new Map<string, { total: number; standard: number; upscaled: number }>();
    
    if (renders) {
      renders.forEach((render) => {
        if (!userStats.has(render.user_id)) {
          userStats.set(render.user_id, { total: 0, standard: 0, upscaled: 0 });
        }
        const stats = userStats.get(render.user_id)!;
        stats.total++;
        
        if (render.upscaled_image_url && render.upscaled_image_url !== render.generated_image_url) {
          stats.upscaled++;
        } else if (render.generated_image_url) {
          stats.standard++;
        }
      });
    }

    // Combiner les données
    const usersWithStats = users?.map((user) => ({
      ...user,
      stats: userStats.get(user.id) || { total: 0, standard: 0, upscaled: 0 },
    })) || [];

    // Stats globales
    const totalUsers = users?.length || 0;
    const totalRenders = renders?.length || 0;
    const totalStandard = renders?.filter(r => r.generated_image_url && (!r.upscaled_image_url || r.upscaled_image_url === r.generated_image_url)).length || 0;
    const totalUpscaled = renders?.filter(r => r.upscaled_image_url && r.upscaled_image_url !== r.generated_image_url).length || 0;

    return NextResponse.json({
      users: usersWithStats,
      stats: {
        totalUsers,
        totalRenders,
        totalStandard,
        totalUpscaled,
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}






