import React from "https://esm.sh/react@18.2.0";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "https://esm.sh/react-email@0.0.1";

interface EmailTemplateProps {
  recipientName?: string;
  senderName?: string;
  subject?: string;
  sessionTime?: string;
  sessionId?: string;
  reason?: string;
}

const baseStyles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#1a1a1a",
  },
  text: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#333",
    marginBottom: "15px",
  },
  button: {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#6366f1",
    color: "white",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    marginTop: "20px",
  },
  infoBox: {
    backgroundColor: "#f0f4ff",
    borderLeft: "4px solid #6366f1",
    padding: "16px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  footer: {
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #e9ecef",
    textAlign: "center",
    fontSize: "12px",
    color: "#999",
  },
};

export const SessionRequestEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>New Session Request from {props.senderName}</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>New Session Request</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            {props.senderName} has requested a tutoring session with you.
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            <Text style={{ margin: "0" }}>
              <strong>Requested Time:</strong> {props.sessionTime || "To be scheduled"}
            </Text>
          </Section>
          <Text style={baseStyles.text}>
            Please log in to TechConnect to review and respond to this request.
          </Text>
          <Link href="https://cit-techconnect.org/tutor/requests" style={baseStyles.button}>
            View Request
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const SessionAcceptedEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Session Accepted!</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Accepted!</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            {props.senderName} has accepted your session request!
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            <Text style={{ margin: "0" }}>
              <strong>Scheduled Time:</strong> {props.sessionTime || "To be confirmed"}
            </Text>
          </Section>
          <Text style={baseStyles.text}>
            Get ready for your tutoring session. Make sure you have a stable internet connection and your camera/microphone are working.
          </Text>
          <Link href="https://cit-techconnect.org/learner/sessions" style={baseStyles.button}>
            View Session Details
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const SessionRejectedEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Session Request Update</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Request Update</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            Unfortunately, {props.senderName} was unable to accept your session request at this time.
          </Text>
          {props.reason && (
            <Section style={baseStyles.infoBox}>
              <Text style={{ margin: "0" }}>
                <strong>Reason:</strong> {props.reason}
              </Text>
            </Section>
          )}
          <Text style={baseStyles.text}>
            You can try requesting another session or browse other available tutors.
          </Text>
          <Link href="https://cit-techconnect.org/learner/tutors" style={baseStyles.button}>
            Browse Tutors
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const SessionReminderEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Upcoming Session Reminder</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Reminder</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            This is a reminder that your tutoring session is starting soon!
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            <Text style={{ margin: "0" }}>
              <strong>Starting at:</strong> {props.sessionTime || "Soon"}
            </Text>
          </Section>
          <Text style={baseStyles.text}>Please make sure you:</Text>
          <ul style={{ color: "#333", lineHeight: "1.8" }}>
            <li>Have a stable internet connection</li>
            <li>Test your camera and microphone</li>
            <li>Are in a quiet environment</li>
            <li>Join a few minutes early</li>
          </ul>
          <Link href="https://cit-techconnect.org" style={baseStyles.button}>
            Join Session
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const SessionCancelledEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Session Cancelled</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Cancelled</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            {props.senderName} has cancelled the tutoring session.
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            {props.reason && (
              <Text style={{ margin: "0" }}>
                <strong>Reason:</strong> {props.reason}
              </Text>
            )}
          </Section>
          <Text style={baseStyles.text}>
            If you'd like to reschedule or book another session, please visit TechConnect.
          </Text>
          <Link href="https://cit-techconnect.org" style={baseStyles.button}>
            Back to TechConnect
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const InstantSessionStartingEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Session Starting Now!</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Starting Now!</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            {props.senderName} has accepted your instant session request and is ready to start!
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            <Text style={{ margin: "0" }}>
              <strong>Status:</strong> Ready to begin
            </Text>
          </Section>
          <Text style={baseStyles.text}>
            Click the button below to join the session immediately.
          </Text>
          <Link href={`https://cit-techconnect.org/video-session/${props.sessionId}`} style={baseStyles.button}>
            Join Session Now
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const SessionMissedEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Session Missed</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Missed</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            Unfortunately, {props.senderName} did not join the scheduled tutoring session.
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            <Text style={{ margin: "0" }}>
              <strong>Scheduled Time:</strong> {props.sessionTime || "Not specified"}
            </Text>
          </Section>
          <Text style={baseStyles.text}>
            If this was unintentional, you can reschedule or book another session with this tutor.
          </Text>
          <Link href="https://cit-techconnect.org" style={baseStyles.button}>
            Back to TechConnect
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const TutorCancelledEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Session Cancelled by Tutor</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Cancelled</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            {props.senderName} has cancelled your scheduled tutoring session.
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            {props.reason && (
              <Text style={{ margin: "0" }}>
                <strong>Reason:</strong> {props.reason}
              </Text>
            )}
          </Section>
          <Text style={baseStyles.text}>
            You can reschedule with this tutor or browse other available tutors on TechConnect.
          </Text>
          <Link href="https://cit-techconnect.org/learner/tutors" style={baseStyles.button}>
            Browse Tutors
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const ScheduledSessionAcceptedEmail = (props: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Session Confirmed!</Preview>
    <Body style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <Container style={baseStyles.container}>
        <Section style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px" }}>
          <Text style={baseStyles.heading}>Session Confirmed!</Text>
          <Text style={baseStyles.text}>Hello {props.recipientName},</Text>
          <Text style={baseStyles.text}>
            {props.senderName} has accepted your session request!
          </Text>
          <Section style={baseStyles.infoBox}>
            <Text style={{ margin: "0 0 10px 0" }}>
              <strong>Subject:</strong> {props.subject}
            </Text>
            <Text style={{ margin: "0" }}>
              <strong>Scheduled Time:</strong> {props.sessionTime || "To be confirmed"}
            </Text>
          </Section>
          <Text style={baseStyles.text}>
            Get ready for your tutoring session. Make sure you have a stable internet connection and your camera/microphone are working.
          </Text>
          <Link href="https://cit-techconnect.org/learner/sessions" style={baseStyles.button}>
            View Session Details
          </Link>
          <Section style={baseStyles.footer}>
            <Text>This is an automated email from TechConnect. Please do not reply to this email.</Text>
            <Text>© 2024 TechConnect. All rights reserved.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);


