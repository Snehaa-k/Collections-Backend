-- Add geographic fields to accounts table
ALTER TABLE accounts 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN address TEXT,
ADD COLUMN city VARCHAR(100),
ADD COLUMN state VARCHAR(50),
ADD COLUMN zip_code VARCHAR(20);

-- Create index for geographic queries
CREATE INDEX idx_accounts_location ON accounts(latitude, longitude);