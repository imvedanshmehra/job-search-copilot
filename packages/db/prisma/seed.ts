import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The one MVP user everything else points to. Fixed and literal so Phase 2's
// packages/core "current user" constant can copy this ID verbatim, instead of
// querying the DB or re-deriving it.
export const MVP_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: MVP_USER_ID },
    update: {},
    create: {
      id: MVP_USER_ID,
      email: "you@example.com",
      name: "MVP User",
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
