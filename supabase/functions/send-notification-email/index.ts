import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth-token",
};

interface NotificationPayload {
  to?: string;
  userId?: string;
  type: "session_request" | "session_accepted" | "session_rejected" | "session_reminder" | "session_started" | "session_ended" | "session_cancelled" | "instant_session_starting" | "session_missed" | "tutor_cancelled" | "scheduled_session_accepted" | "tutor_approved" | "tutor_rejected";
  data?: {
    recipientName?: string;
    senderName?: string;
    subject?: string;
    sessionTime?: string;
    sessionId?: string;
    reason?: string;
  };
}

// Helper to safely escape and provide defaults
const safe = (value: any, defaultValue = "Not specified") => {
  if (!value) return defaultValue;
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

const emailTemplates = {
  session_request: (data: any) => ({
    subject: "New Session Request - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Session Request</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #6366f1; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #f0f4ff; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>New Session Request</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>${safe(data.senderName, 'A learner')} has requested a tutoring session with you.</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  <strong>Requested Time:</strong> ${safe(data.sessionTime, 'To be scheduled')}
                </div>
                
                <p>Please log in to TechConnect to review and respond to this request.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org/tutor/requests" class="button">View Request</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect and check your pending requests.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  session_accepted: (data: any) => ({
    subject: "Session Accepted - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Accepted</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #10b981; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981, #34d399); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Accepted!</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>${safe(data.senderName, 'Your tutor')} has accepted your session request!</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  <strong>Scheduled Time:</strong> ${safe(data.sessionTime, 'To be confirmed')}
                </div>
                
                <p>Get ready for your tutoring session. Make sure you have a stable internet connection and your camera/microphone are working.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org/learner/sessions" class="button">View Session Details</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect and check your sessions.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  session_rejected: (data: any) => ({
    subject: "Session Request Update - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Request Update</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #ef4444; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Request Update</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>Unfortunately, ${safe(data.senderName, 'your tutor')} was unable to accept your session request at this time.</p>
                
                ${data.reason ? `
                <div class="info-box">
                  <strong>Reason:</strong> ${safe(data.reason)}
                </div>
                ` : ''}
                
                <p>You can try requesting another session or browse other available tutors.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org/learner/tutors" class="button">Browse Tutors</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect and browse available tutors.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  session_reminder: (data: any) => ({
    subject: "Upcoming Session Reminder - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Reminder</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #f59e0b; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Reminder</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>This is a reminder that your tutoring session is starting soon!</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  <strong>Starting at:</strong> ${safe(data.sessionTime, 'Soon')}
                </div>
                
                <p>Please make sure you:</p>
                <ul>
                  <li>Have a stable internet connection</li>
                  <li>Test your camera and microphone</li>
                  <li>Are in a quiet environment</li>
                  <li>Join a few minutes early</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org" class="button">Join Session</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect and join from your sessions page.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  session_cancelled: (data: any) => ({
    subject: "Session Cancelled - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Cancelled</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #ef4444; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Cancelled</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>${safe(data.senderName, 'Your session partner')} has cancelled the tutoring session.</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  ${data.reason ? `<strong>Reason:</strong> ${safe(data.reason)}<br>` : ''}
                </div>
                
                <p>If you'd like to reschedule or book another session, please visit TechConnect.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org" class="button">Back to TechConnect</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect directly.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  instant_session_starting: (data: any) => ({
    subject: "Instant Session Starting Now - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Instant Session Starting</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #ec4899; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #f43f5e); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #fce7f3; border-left: 4px solid #ec4899; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Starting Now!</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>${safe(data.senderName, 'Your session partner')} has accepted your instant session request and is ready to start!</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  <strong>Status:</strong> Ready to begin
                </div>
                
                <p>Click the button below to join the session immediately.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org/video-session/${safe(data.sessionId)}" class="button">Join Session Now</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect and join from your sessions page.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  session_missed: (data: any) => ({
    subject: "Session Missed - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Missed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #8b5cf6; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Missed</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>Unfortunately, ${safe(data.senderName, 'your session partner')} did not join the scheduled tutoring session.</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  <strong>Scheduled Time:</strong> ${safe(data.sessionTime, 'Not specified')}
                </div>
                
                <p>If this was unintentional, you can reschedule or book another session with this tutor.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org" class="button">Back to TechConnect</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect directly.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  tutor_cancelled: (data: any) => ({
    subject: "Session Cancelled by Tutor - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Cancelled</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #ef4444; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Cancelled</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>${safe(data.senderName, 'Your tutor')} has cancelled your scheduled tutoring session.</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  ${data.reason ? `<strong>Reason:</strong> ${safe(data.reason)}<br>` : ''}
                </div>
                
                <p>You can reschedule with this tutor or browse other available tutors on TechConnect.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org/learner/tutors" class="button">Browse Tutors</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect and browse available tutors.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  scheduled_session_accepted: (data: any) => ({
    subject: "Session Accepted - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Accepted</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h1 { color: #10b981; font-size: 24px; margin: 0 0 10px 0; text-align: center; }
.content { margin: 30px 0; color: #444; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981, #34d399); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="content">
                <h1>Session Confirmed!</h1>
                <p>Hello ${safe(data.recipientName, 'there')},</p>
                <p>${safe(data.senderName, 'Your tutor')} has accepted your session request!</p>
                
                <div class="info-box">
                  <strong>Subject:</strong> ${safe(data.subject)}<br>
                  <strong>Scheduled Time:</strong> ${safe(data.sessionTime, 'To be confirmed')}
                </div>
                
                <p>Get ready for your tutoring session. Make sure you have a stable internet connection and your camera/microphone are working.</p>
                
                <div style="text-align: center;">
                  <a href="https://cit-techconnect.org/learner/sessions" class="button">View Session Details</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
                  If the link doesn't work, log in to TechConnect and check your sessions.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  tutor_approved: (data: any) => ({
    subject: "🎉 Your Tutor Application Has Been Approved! - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${baseStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 style="color: #10b981;">🎉 Congratulations!</h1>
              
              <p>Hello ${safe(data.recipientName)},</p>
              
              <p>Great news! Your application to become a tutor on TechConnect has been approved.</p>
              
              <div class="info-box">
                <p style="margin: 0;">You can now start accepting tutoring sessions and helping learners succeed!</p>
              </div>
              
              <p>Here's what you can do next:</p>
              <ul style="color: #333; line-height: 1.8;">
                <li>Set your availability schedule</li>
                <li>Complete your profile with subjects you can teach</li>
                <li>Start accepting session requests from learners</li>
                <li>Share educational resources with the community</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://cit-techconnect.org/tutor/dashboard" class="button">Go to Tutor Dashboard</a>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  tutor_rejected: (data: any) => ({
    subject: "Update on Your Tutor Application - TechConnect",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${baseStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1>Application Update</h1>
              
              <p>Hello ${safe(data.recipientName)},</p>
              
              <p>Thank you for your interest in becoming a tutor on TechConnect.</p>
              
              <p>After careful review, we regret to inform you that we are unable to approve your tutor application at this time.</p>
              
              ${data.reason ? `
                <div class="info-box">
                  <p style="margin: 0;"><strong>Reason:</strong> ${safe(data.reason)}</p>
                </div>
              ` : ''}
              
              <p>This decision doesn't reflect on your abilities or potential. You're welcome to reapply in the future or continue using TechConnect as a learner.</p>
              
              <p>If you have any questions, please feel free to contact our support team.</p>
              
              <div style="text-align: center;">
                <a href="https://cit-techconnect.org" class="button">Back to TechConnect</a>
              </div>
              
              <div class="footer">
                <p>This is an automated email from TechConnect. Please do not reply to this email.</p>
                <p style="margin-top: 10px;">© 2024 TechConnect. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key is set
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("RESEND_API_KEY environment variable is not configured");
    }

    const payload: NotificationPayload = await req.json();
    console.log("Received notification payload:", JSON.stringify(payload, null, 2));

    let { to, type, data = {}, userId } = payload;

    // If userId is provided instead of email, fetch email from Supabase
    if (userId && !to) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase configuration missing");
      }

      // Fetch user email and name from profiles
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=email,full_name`, {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.statusText}`);
      }

      const profiles = await profileResponse.json();
      if (profiles && profiles.length > 0) {
        to = profiles[0].email;
        data.recipientName = profiles[0].full_name || "User";
      } else {
        throw new Error(`No profile found for userId: ${userId}`);
      }
    }

    if (!to || !type) {
      throw new Error("Missing 'to' or 'type' in payload");
    }

    if (!to.includes("@")) {
      throw new Error(`Invalid email address: ${to}`);
    }

    const template = emailTemplates[type as keyof typeof emailTemplates];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    const { subject, html } = template(data);

    console.log(`Sending ${type} email to ${to}`);

    const emailResponse = await resend.emails.send({
      from: "TechConnect <noreply@cit-techconnect.org>",
      to: [to],
      subject,
      html,
    });

    console.log("Notification email sent successfully:", JSON.stringify(emailResponse, null, 2));

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        stack: error.stack,
        type: error.name,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});



