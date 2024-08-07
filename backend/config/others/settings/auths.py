import os


TOKEN_TTL = 7  # days
LOGIN_OTP_EXPIRE = 15  # 15 Minutes
ALLOW_TIME_RESEND_OTP = 1  # 1 Minutes
FORGOT_PASSWORD_OTP_EXPIRE = 5  # 5 Minutes

JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', "HS256")
TIME_LIVE_TOKEN = 120  # 120 Minutes / 2 hours
