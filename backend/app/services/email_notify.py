import os
import smtplib
from email.mime.text import MIMEText


def send_attendance_alert(
    to_email: str, student_name: str, class_name: str, status: str
) -> bool:
    host = os.getenv("SMTP_HOST", "").strip()
    if not host:
        return False
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("SMTP_FROM", user)
    msg = MIMEText(
        f"Attendance update for {student_name} in {class_name}: {status}."
    )
    msg["Subject"] = f"Attendance: {class_name}"
    msg["From"] = from_addr
    msg["To"] = to_email
    try:
        with smtplib.SMTP(host, port, timeout=15) as s:
            s.starttls()
            if user and password:
                s.login(user, password)
            s.sendmail(from_addr, [to_email], msg.as_string())
        return True
    except OSError:
        return False
