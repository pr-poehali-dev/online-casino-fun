"""
Авторизация игроков казино: регистрация, вход, получение профиля, выход.
Эндпоинты: POST /register, POST /login, GET /me, POST /logout
"""
import json
import os
import secrets
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p12938668_online_casino_fun")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_user_by_token(conn, token: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"""
            SELECT u.id, u.username, u.email, u.balance, u.currency,
                   u.vip_level, u.total_bets, u.total_wins, u.max_win, u.created_at
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
            """,
            (token,)
        )
        return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    auth_header = event.get("headers", {}).get("X-Authorization", "")
    token = auth_header.replace("Bearer ", "").strip() if auth_header else ""

    action = (event.get("queryStringParameters") or {}).get("action", "")

    conn = get_conn()
    try:
        # POST register
        if method == "POST" and action == "register":
            username = (body.get("username") or "").strip()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not username or not email or not password:
                return {"statusCode": 400, "headers": CORS_HEADERS,
                        "body": json.dumps({"error": "Заполните все поля"})}
            if len(password) < 6:
                return {"statusCode": 400, "headers": CORS_HEADERS,
                        "body": json.dumps({"error": "Пароль минимум 6 символов"})}

            pw_hash = hash_password(password)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.users WHERE email = %s OR username = %s",
                    (email, username)
                )
                if cur.fetchone():
                    return {"statusCode": 409, "headers": CORS_HEADERS,
                            "body": json.dumps({"error": "Пользователь с таким email или именем уже существует"})}

                cur.execute(
                    f"""INSERT INTO {SCHEMA}.users (username, email, password_hash, balance)
                        VALUES (%s, %s, %s, 1000.00) RETURNING id""",
                    (username, email, pw_hash)
                )
                user_id = cur.fetchone()["id"]
                new_token = secrets.token_hex(32)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
                    (user_id, new_token)
                )
                conn.commit()

            return {"statusCode": 200, "headers": CORS_HEADERS,
                    "body": json.dumps({"token": new_token, "message": "Регистрация успешна! Бонус 1000 ₽ зачислен."})}

        # POST login
        if method == "POST" and action == "login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not email or not password:
                return {"statusCode": 400, "headers": CORS_HEADERS,
                        "body": json.dumps({"error": "Введите email и пароль"})}

            pw_hash = hash_password(password)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
                    (email, pw_hash)
                )
                user = cur.fetchone()
                if not user:
                    return {"statusCode": 401, "headers": CORS_HEADERS,
                            "body": json.dumps({"error": "Неверный email или пароль"})}

                new_token = secrets.token_hex(32)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
                    (user["id"], new_token)
                )
                conn.commit()

            return {"statusCode": 200, "headers": CORS_HEADERS,
                    "body": json.dumps({"token": new_token})}

        # GET me
        if method == "GET" and action == "me":
            if not token:
                return {"statusCode": 401, "headers": CORS_HEADERS,
                        "body": json.dumps({"error": "Не авторизован"})}
            user = get_user_by_token(conn, token)
            if not user:
                return {"statusCode": 401, "headers": CORS_HEADERS,
                        "body": json.dumps({"error": "Сессия истекла"})}
            user["created_at"] = str(user["created_at"])
            user["balance"] = float(user["balance"])
            user["max_win"] = float(user["max_win"])
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps(dict(user))}

        # POST logout
        if method == "POST" and action == "logout":
            if token:
                with conn.cursor() as cur:
                    cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                    conn.commit()
            return {"statusCode": 200, "headers": CORS_HEADERS,
                    "body": json.dumps({"message": "Выход выполнен"})}

        return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Not found"})}

    finally:
        conn.close()