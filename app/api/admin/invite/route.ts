import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { sendEmail, getInvitationEmailHtml } from '@/lib/email';

// Admin emails autorisés
const ADMIN_EMAILS = ['joey.montani@gmail.com'];

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { email, name } = body as { email: string; name?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
    }

    // Envoyer l'invitation
    const appUrl = process.env.BETTER_AUTH_URL || 'https://renderz.ch';
    
    await sendEmail({
      to: email,
      subject: "You're invited to RENDERZ! 🎨",
      html: getInvitationEmailHtml(appUrl, name),
      text: `You've been invited to join RENDERZ! Create your account here: ${appUrl}`,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Invitation envoyée à ${email}` 
    });
  } catch (error) {
    console.error('Admin invite error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'invitation' }, { status: 500 });
  }
}




