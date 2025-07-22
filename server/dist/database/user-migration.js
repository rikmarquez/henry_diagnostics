"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function runUserMigration() {
    console.log('🚀 Ejecutando migración del módulo de usuario...');
    try {
        const migrationSQL = fs_1.default.readFileSync(path_1.default.join(__dirname, 'user-management-migration.sql'), 'utf8');
        await (0, connection_1.query)(migrationSQL);
        console.log('✅ Migración del módulo de usuario completada exitosamente');
    }
    catch (error) {
        console.error('❌ Error ejecutando migración de usuario:', error);
        throw error;
    }
}
runUserMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=user-migration.js.map