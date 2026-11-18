INSERT INTO notes (body) VALUES ('first; second'), ('say "hi"; ok');
UPDATE notes SET body = 'x -- not a comment' WHERE id = 1;
