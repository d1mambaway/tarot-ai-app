-- Internal user number, seen only by admins: d1mamba = 1, everyone else from 10000
-- in sign-up order; new users get the next number automatically.

CREATE SEQUENCE "User_userNo_seq" AS INTEGER START WITH 10000 MINVALUE 1;
ALTER TABLE "User" ADD COLUMN "userNo" INTEGER;

UPDATE "User" SET "userNo" = 1
WHERE "id" = (SELECT "id" FROM "User" WHERE lower("username") = 'd1mamba' ORDER BY "createdAt" LIMIT 1);

WITH ordered AS (
  SELECT "id", row_number() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "User" WHERE "userNo" IS NULL
)
UPDATE "User" u SET "userNo" = 9999 + ordered.rn FROM ordered WHERE u."id" = ordered."id";

SELECT setval('"User_userNo_seq"', GREATEST((SELECT MAX("userNo") FROM "User"), 9999));

ALTER TABLE "User" ALTER COLUMN "userNo" SET DEFAULT nextval('"User_userNo_seq"');
ALTER TABLE "User" ALTER COLUMN "userNo" SET NOT NULL;
ALTER SEQUENCE "User_userNo_seq" OWNED BY "User"."userNo";
CREATE UNIQUE INDEX "User_userNo_key" ON "User"("userNo");
