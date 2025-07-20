"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
async function runMigrations() {
    try {
        console.log('🚀 Iniciando migraciones de base de datos...');
        // Leer el archivo SQL de esquema
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Ejecutar el esquema completo
        await (0, connection_1.query)(schemaSql);
        console.log('✅ Migraciones completadas exitosamente');
        console.log('📊 Tablas creadas:');
        console.log('   - users (usuarios del sistema)');
        console.log('   - customers (clientes/propietarios)');
        console.log('   - vehicles (vehículos - centrado en VIN)');
        console.log('   - vehicle_plate_history (historial de placas)');
        console.log('   - service_catalog (catálogo de servicios)');
        console.log('   - services (servicios realizados)');
        console.log('   - opportunities (oportunidades por vehículo)');
        console.log('   - opportunity_notes (notas de seguimiento)');
        console.log('   - scheduled_reminders (recordatorios automáticos)');
        console.log('   - whatsapp_logs (log de mensajes WhatsApp)');
        console.log('   - maintenance_schedules (programación mantenimiento)');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map