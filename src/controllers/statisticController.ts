import type { Request, Response } from "express";
import { Role } from "../generated/prisma";
import { prisma } from "../config/db";
import { success } from "../utils/response";

// GET /api/statistics
// Ringkasan analitik toko MLBB (testcase 25):
//   - totalPlayers      : jumlah seluruh player
//   - totalHeroesOwned  : jumlah seluruh kepemilikan hero (baris PlayerHero)
//   - totalDiamond      : total diamond yang dimiliki semua player
//   - mostOwnedHero     : hero yang paling banyak dimiliki
//   - heroesPerRole     : jumlah hero untuk setiap role
export async function getStatistics(_req: Request, res: Response): Promise<void> {
  const [totalPlayers, totalHeroesOwned, diamondAggregate, mostOwnedGroup, roleGroups] =
    await prisma.$transaction([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({ _sum: { diamond: true } }),
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: { heroId: true },
        orderBy: { _count: { heroId: "desc" } },
        take: 1,
      }),
      prisma.hero.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
    ]);

  const topOwned = mostOwnedGroup[0];
  const topHero = topOwned
    ? await prisma.hero.findUnique({
        where: { id: topOwned.heroId },
        select: { id: true, name: true },
      })
    : null;

  const roleCounts = new Map(roleGroups.map((row) => [row.role, row._count.id]));
  const heroesPerRole = Object.values(Role)
    .map((role) => ({
      role,
      total: roleCounts.get(role) ?? 0,
    }))
    .sort((a, b) => b.total - a.total);

  success(res, {
    message: "Berhasil mengambil statistik",
    data: {
      totalPlayers,
      totalHeroesOwned,
      totalDiamond: diamondAggregate._sum.diamond ?? 0,
      mostOwnedHero: topOwned
        ? {
            heroId: topOwned.heroId,
            name: topHero?.name ?? null,
            owners: topOwned._count.heroId,
          }
        : null,
      heroesPerRole,
    },
  });
}
