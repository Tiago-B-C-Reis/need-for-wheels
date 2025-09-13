-- Create table for experiments metadata
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY,
    brand TEXT,
    model TEXT,
    year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

