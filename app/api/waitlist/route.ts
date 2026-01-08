import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Limite d'utilisateurs actifs
const MAX_ACTIVE_USERS = 10;

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Compter le nombre d'utilisateurs actifs (table "user" de Better Auth)
    const { count: userCount, error: userError } = await supabase
      .from('user')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.error('Error counting users:', userError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification' },
        { status: 500 }
      );
    }

    const isOpen = (userCount ?? 0) < MAX_ACTIVE_USERS;
    const spotsLeft = Math.max(0, MAX_ACTIVE_USERS - (userCount ?? 0));

    return NextResponse.json({
      isOpen,
      spotsLeft,
      maxUsers: MAX_ACTIVE_USERS,
      currentUsers: userCount ?? 0,
    });
  } catch (error) {
    console.error('Waitlist check error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérifier si l'email est déjà dans la liste d'attente
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'You are already on the waitlist!',
        alreadyExists: true,
      });
    }

    // Check if email is already a user
    const { data: existingUser } = await supabase
      .from('user')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'This email is already associated with an account.',
        alreadyUser: true,
      });
    }

    // Add to waitlist
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase(),
      });

    if (insertError) {
      console.error('Waitlist insert error:', insertError);
      return NextResponse.json(
        { error: 'Error joining the waitlist' },
        { status: 500 }
      );
    }

    // Count position in queue
    const { count: position } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('notified', false);

    return NextResponse.json({
      success: true,
      message: 'You have been added to the waitlist!',
      position: position ?? 1,
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

