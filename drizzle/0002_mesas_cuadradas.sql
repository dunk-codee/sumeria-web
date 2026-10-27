-- Custom SQL migration file, put your code below! --
-- Plano con mesas cuadradas del mismo tamaño (12 × 12), pedido del cliente.
-- Sueltas para 4; pegadas de a dos (1+2, 6+7, 9+10) para 3 cada una, así el par sienta 6.
-- Upsert por número de mesa: conserva las reservas que apuntan a las mesas 1–8. Misma distribución que scripts/data/plan.ts.
INSERT INTO "tables" ("n", "capacity", "shape", "x", "y", "w", "h", "location") VALUES
  (1, 3, 'square', 4, 4, 12, 12, 'Salón, contra la pared'),
  (2, 3, 'square', 16, 4, 12, 12, 'Salón, contra la pared'),
  (3, 4, 'square', 34, 4, 12, 12, 'Salón'),
  (4, 4, 'square', 50, 4, 12, 12, 'Salón'),
  (5, 4, 'square', 4, 25, 12, 12, 'Salón'),
  (6, 3, 'square', 22, 25, 12, 12, 'Centro del salón'),
  (7, 3, 'square', 34, 25, 12, 12, 'Centro del salón'),
  (8, 4, 'square', 50, 25, 12, 12, 'Cerca de la barra'),
  (9, 3, 'square', 4, 46, 12, 12, 'Junto al ventanal'),
  (10, 3, 'square', 16, 46, 12, 12, 'Junto al ventanal'),
  (11, 4, 'square', 40, 46, 12, 12, 'Salón')
ON CONFLICT ("n") DO UPDATE SET
  "capacity" = EXCLUDED."capacity",
  "shape" = EXCLUDED."shape",
  "x" = EXCLUDED."x",
  "y" = EXCLUDED."y",
  "w" = EXCLUDED."w",
  "h" = EXCLUDED."h",
  "location" = EXCLUDED."location";
