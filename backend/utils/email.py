
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Configuration (Env vars or config file)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "tu_correo@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "tu_app_password")

def send_notification_email(to_email: str, subject: str, body: str):
    """
    Sends an email notification.
    If credentials are not set, it mocks the sending by printing to console.
    """
    if not to_email:
        print("Warning: No email provided for notification.")
        return False

    if SMTP_USER == "tu_correo@gmail.com":
        # Mock Mode
        print(f"--- MOCK EMAIL ---")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print(f"------------------")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, to_email, text)
        server.quit()
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
