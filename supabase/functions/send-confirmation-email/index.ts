import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);
    
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));

    const {
      user,
      email_data,
    } = payload;

    if (!user || !email_data) {
      throw new Error("Missing user or email_data in payload");
    }

    const { token, token_hash, redirect_to, email_action_type } = email_data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://frozkocrdudvtqhhgqzl.supabase.co";
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Email - TechConnect</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              border-radius: 12px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              color: white;
            }
            h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              margin: 0;
            }
            .content {
              margin: 30px 0;
              color: #444;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              color: white !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
              font-size: 16px;
            }
            .button:hover {
              opacity: 0.9;
            }
            .code-box {
              background: #f8f9fa;
              border: 2px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              text-align: center;
              color: #999;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px 16px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">🎓</div>
                <h1>Welcome to TechConnect!</h1>
                <p class="subtitle">Please confirm your email address to get started</p>
              </div>
              
              <div class="content">
                <p>Hello${user.user_metadata?.full_name ? ` ${user.user_metadata.full_name}` : ''},</p>
                <p>Thank you for registering with TechConnect! To complete your registration and start connecting with tutors, please confirm your email address.</p>
                
                <div style="text-align: center;">
                  <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  Or copy and paste this link into your browser:
                </p>
                <div class="code-box">
                  <div style="word-break: break-all; font-size: 12px; color: #666;">
                    ${confirmationUrl}
                  </div>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Security Note:</strong> If you didn't create an account with TechConnect, please ignore this email.
                </div>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© ${new Date().getFullYear()} TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "TechConnect <onboarding@resend.dev>",
      to: [user.email],
      subject: "Confirm Your Email - TechConnect",
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
