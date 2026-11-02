import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`🚀 MLBB Shop API (Kelompok A16) berjalan di http://localhost:${PORT}`);
  console.log(`   - Health check : http://localhost:${PORT}/health`);
  console.log(`   - Katalog hero : http://localhost:${PORT}/api/heroes`);
  console.log(`   - Katalog skin : http://localhost:${PORT}/api/skins`);
  console.log(`   - MLBB Store   : http://localhost:${PORT}/`);
});
