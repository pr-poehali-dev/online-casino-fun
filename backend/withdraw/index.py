"""
Заявки на вывод средств: создание заявки и получение списка заявок игрока.
POST /?action=create — создать заявку
GET  /?action=list   — список заявок текущего пользователя
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p12938668_online_casino_fun")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
}

METHODS = ["Банковская карта", "СБП", "USDT (TRC20)", "Qiwi", "ЮMoney"]
MIN_AMOUNT = 500
MAX_AMOUNT = 500000


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user(conn, token: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"""SELECT u.id, u.balance FROM {SCHEMA}.sessions s
                JOIN {SCHEMA}.users u ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW()""",
            (token,)
        )
        return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    action = (event.get("queryStringParameters") or {}).get("action", "")
    auth_header = (event.get("headers") or {}).get("X-Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()

    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Необходима авторизация"})}

    conn = get_conn()
    try:
        user = get_user(conn, token)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}

        # POST create
        if method == "POST" and action == "create":
            body = {}
            if event.get("body"):
                body = json.loads(event["body"])

            amount = float(body.get("amount") or 0)
            pay_method = (body.get("method") or "").strip()
            requisites = (body.get("requisites") or "").strip()
            currency = (body.get("currency") or "RUB").strip()

            if amount < MIN_AMOUNT:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": f"Минимальная сумма вывода — {MIN_AMOUNT} ₽"})}
            if amount > MAX_AMOUNT:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": f"Максимальная сумма вывода — {MAX_AMOUNT:,} ₽"})}
            if float(user["balance"]) < amount:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Недостаточно средств на балансе"})}
            if pay_method not in METHODS:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Выберите способ вывода"})}
            if not requisites:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Укажите реквизиты"})}

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s",
                    (amount, user["id"])
                )
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.withdrawals (user_id, amount, currency, method, requisites)
                        VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at""",
                    (user["id"], amount, currency, pay_method, requisites)
                )
                row = cur.fetchone()
                conn.commit()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "id": row["id"],
                "message": f"Заявка №{row['id']} принята. Средства поступят в течение 15 минут."
            })}

        # GET list
        if method == "GET" and action == "list":
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"""SELECT id, amount, currency, method, requisites, status, created_at
                        FROM {SCHEMA}.withdrawals WHERE user_id = %s
                        ORDER BY created_at DESC LIMIT 20""",
                    (user["id"],)
                )
                rows = cur.fetchall()
            result = []
            for r in rows:
                r = dict(r)
                r["amount"] = float(r["amount"])
                r["created_at"] = str(r["created_at"])
                result.append(r)
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(result)}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        conn.close()
