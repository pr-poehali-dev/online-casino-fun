
CREATE TABLE IF NOT EXISTS t_p12938668_online_casino_fun.withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p12938668_online_casino_fun.users(id),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    method VARCHAR(50) NOT NULL,
    requisites VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON t_p12938668_online_casino_fun.withdrawals(user_id);
