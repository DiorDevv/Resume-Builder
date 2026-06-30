import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings
from app.core.logging import logger


def send_password_reset_email(to_email: str, user_name: str, reset_token: str) -> None:
    if not settings.SMTP_HOST:
        logger.warning(f"SMTP not configured. Would send reset email to {to_email} with token: {reset_token[:10]}...")
        return

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    subject = "Resume Builder — Parolni tiklash"
    html = f"""
    <div style="max-width:480px;margin:0 auto;font-family:Inter,sans-serif;">
        <div style="background:#0A0A0F;padding:24px;border-radius:8px;border:1px solid #1E1E2E;">
            <div style="margin-bottom:24px;">
                <span style="font-size:24px;font-weight:700;color:#F8FAFC;">Resume<span style="color:#6366F1;">Builder</span></span>
            </div>
            <h2 style="color:#F8FAFC;font-size:18px;margin:0 0 8px;">Salom, {user_name}</h2>
            <p style="color:#94A3B8;font-size:14px;line-height:1.6;">
                Parolingizni tiklash uchun quyidagi tugmani bosing:
            </p>
            <div style="text-align:center;margin:24px 0;">
                <a href="{reset_url}" style="display:inline-block;background:#6366F1;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
                    Parolni tiklash
                </a>
            </div>
            <p style="color:#94A3B8;font-size:12px;line-height:1.6;">
                Agar siz parolni tiklashni so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
                <br><br>
                Bu link <strong>15 daqiqa</strong> davomida amal qiladi.
            </p>
            <hr style="border:none;border-top:1px solid #1E1E2E;margin:24px 0;">
            <p style="color:#64748B;font-size:11px;text-align:center;">
                &copy; 2026 Resume Builder. O'zbekiston IT bozori uchun.
            </p>
        </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Password reset email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        raise
