import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common email styles
const emailStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
    line-height: 1.6;
    color: #1f2937;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .email-wrapper {
    padding: 40px 20px;
  }
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  .email-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 30px;
    text-align: center;
  }
  .logo {
    width: 80px;
    height: 80px;
    background: white;
    border-radius: 20px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  .brand-name {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.5px;
  }
  .tagline {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin: 8px 0 0 0;
  }
  .email-body {
    padding: 40px 30px;
  }
  h1 {
    color: #111827;
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 16px 0;
  }
  .greeting {
    color: #374151;
    font-size: 16px;
    margin: 0 0 24px 0;
  }
  .message {
    color: #4b5563;
    font-size: 15px;
    line-height: 1.7;
    margin: 0 0 32px 0;
  }
  .button-container {
    text-align: center;
    margin: 32px 0;
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white !important;
    text-decoration: none;
    padding: 16px 40px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
    transition: transform 0.2s;
  }
  .button:hover {
    transform: translateY(-2px);
  }
  .info-box {
    background: #f3f4f6;
    border-left: 4px solid #667eea;
    padding: 16px 20px;
    border-radius: 8px;
    margin: 24px 0;
  }
  .info-box-title {
    color: #111827;
    font-weight: 600;
    font-size: 14px;
    margin: 0 0 8px 0;
  }
  .info-box-text {
    color: #6b7280;
    font-size: 13px;
    margin: 0;
    line-height: 1.6;
  }
  .link-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin: 24px 0;
  }
  .link-label {
    color: #6b7280;
    font-size: 12px;
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .link-text {
    color: #667eea;
    font-size: 13px;
    word-break: break-all;
    margin: 0;
  }
  .email-footer {
    background: #f9fafb;
    padding: 30px;
    text-align: center;
    border-top: 1px solid #e5e7eb;
  }
  .footer-text {
    color: #9ca3af;
    font-size: 13px;
    margin: 0 0 8px 0;
  }
  .footer-links {
    margin: 16px 0 0 0;
  }
  .footer-link {
    color: #667eea;
    text-decoration: none;
    font-size: 13px;
    margin: 0 12px;
  }
  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 32px 0;
  }
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received email request");

    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type },
    } = payload as {
      user: {
        email: string;
        user_metadata?: {
          full_name?: string;
        };
      };
      email_data: {
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    const isPasswordReset = email_action_type === "recovery";
    const actionUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
    const userName = user.user_metadata?.full_name || "there";

    let subject: string;
    let emailHtml: string;

    if (isPasswordReset) {
      subject = "Reset Your Password - TechConnect";
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>${emailStyles}</style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="email-container">
                <div class="email-header">
                  <div class="logo">🎓</div>
                  <h2 class="brand-name">TechConnect</h2>
                  <p class="tagline">Peer-to-Peer Learning Platform</p>
                </div>
                
                <div class="email-body">
                  <h1>Reset Your Password</h1>
                  <p class="greeting">Hello ${userName},</p>
                  <p class="message">
                    We received a request to reset your password for your TechConnect account. 
                    Click the button below to create a new password.
                  </p>
                  
                  <div class="button-container">
                    <a href="${actionUrl}" class="button">Reset Password</a>
                  </div>
                  
                  <div class="info-box">
                    <p class="info-box-title">⏱️ Important</p>
                    <p class="info-box-text">
                      This password reset link will expire in 1 hour for security reasons.
                      If you didn't request this reset, you can safely ignore this email.
                    </p>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="link-box">
                    <p class="link-label">Or copy and paste this link:</p>
                    <p class="link-text">${actionUrl}</p>
                  </div>
                </div>
                
                <div class="email-footer">
                  <p class="footer-text">
                    This is an automated email from TechConnect. Please do not reply.
                  </p>
                  <p class="footer-text">
                    © ${new Date().getFullYear()} TechConnect. All rights reserved.
                  </p>
                  <div class="footer-links">
                    <a href="${redirect_to.split('/reset-password')[0]}" class="footer-link">Visit TechConnect</a>
                    <span style="color: #d1d5db;">•</span>
                    <a href="${redirect_to.split('/reset-password')[0]}/login" class="footer-link">Login</a>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = "Welcome to TechConnect! Confirm Your Email";
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>${emailStyles}</style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="email-container">
                <div class="email-header">
                  <div class="logo">🎓</div>
                  <h2 class="brand-name">TechConnect</h2>
                  <p class="tagline">Peer-to-Peer Learning Platform</p>
                </div>
                
                <div class="email-body">
                  <h1>Welcome to TechConnect!</h1>
                  <p class="greeting">Hello ${userName},</p>
                  <p class="message">
                    Thank you for joining TechConnect, where students help students succeed! 
                    We're excited to have you as part of our learning community.
                  </p>
                  <p class="message">
                    To get started and access all features, please confirm your email address by clicking the button below.
                  </p>
                  
                  <div class="button-container">
                    <a href="${actionUrl}" class="button">Confirm Email Address</a>
                  </div>
                  
                  <div class="info-box">
                    <p class="info-box-title">🚀 What's Next?</p>
                    <p class="info-box-text">
                      After confirming your email, you'll be able to connect with tutors, 
                      schedule sessions, and start your learning journey!
                    </p>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="link-box">
                    <p class="link-label">Or copy and paste this link:</p>
                    <p class="link-text">${actionUrl}</p>
                  </div>
                  
                  <div class="info-box" style="background: #fef3c7; border-left-color: #f59e0b;">
                    <p class="info-box-title">⚠️ Security Note</p>
                    <p class="info-box-text">
                      If you didn't create an account with TechConnect, please ignore this email.
                    </p>
                  </div>
                </div>
                
                <div class="email-footer">
                  <p class="footer-text">
                    This is an automated email from TechConnect. Please do not reply.
                  </p>
                  <p class="footer-text">
                    © ${new Date().getFullYear()} TechConnect. All rights reserved.
                  </p>
                  <div class="footer-links">
                    <a href="${redirect_to.split('/confirm-email')[0]}" class="footer-link">Visit TechConnect</a>
                    <span style="color: #d1d5db;">•</span>
                    <a href="${redirect_to.split('/confirm-email')[0]}/login" class="footer-link">Login</a>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "TechConnect <onboarding@resend.dev>",
      to: [user.email],
      subject: subject,
      html: emailHtml,
    });

    console.log(`${isPasswordReset ? 'Password reset' : 'Confirmation'} email sent successfully:`, emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
