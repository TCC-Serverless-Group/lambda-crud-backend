CREATE TABLE tasks (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  descricao VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks
ADD CONSTRAINT user_id
FOREIGN KEY (user_id)
REFERENCES auth.users (id);