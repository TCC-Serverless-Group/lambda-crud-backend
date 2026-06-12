CREATE TABLE tasks (
  id serial PRIMARY KEY,
  id_usuario uuid NOT NULL,
  descricao VARCHAR(200) NOT NULL,
  completo BOOLEAN DEFAULT FALSE,
  criada TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks
ADD CONSTRAINT id_usuario
FOREIGN KEY (id_usuario)
REFERENCES auth.users (id);