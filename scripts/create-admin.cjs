// scripts/create-admin.cjs
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const nombre = "Admin Inicial";
    const correo = "admin@crm.local"; // cámbialo si quieres
    const cedula = "0000000000";
    const password = "TuPasswordSeguro123!"; // cámbiala por una segura

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");
    const hashed = await bcrypt.hash(password, saltRounds);

    const res = await pool.query(
      `INSERT INTO users (nombre_completo, correo, cedula, rol, permiso_ver_todo, password)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, correo`,
      [nombre, correo, cedula, "manager", true, hashed]
    );

    console.log("✅ Manager creado con éxito:");
    console.log("ID:", res.rows[0].id);
    console.log("Correo:", res.rows[0].correo);
  } catch (err) {
    if (err.message.includes("duplicate key") || err.message.includes("unique")) {
      console.error("⚠️ Ya existe un usuario con ese correo.");
    } else {
      console.error("❌ Error creando manager:", err.message);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
