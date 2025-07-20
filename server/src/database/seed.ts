import bcrypt from 'bcryptjs';
import { query } from './connection';

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando datos semilla...');

    // Insertar usuario administrador por defecto
    const adminPasswordHash = await bcrypt.hash('HenryDiag2024$', 12);
    
    await query(`
      INSERT INTO users (email, password_hash, nombre, rol, telefono, activo) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [
      'rik@rikmarquez.com',
      adminPasswordHash,
      'Administrador Henry Diagnostics',
      'administrador',
      '+5215512345678',
      true
    ]);

    // Insertar usuarios de ejemplo
    const mecanicoPasswordHash = await bcrypt.hash('MecanicoHD2024!', 12);
    const ventasPasswordHash = await bcrypt.hash('VentasHD2024!', 12);

    await query(`
      INSERT INTO users (email, password_hash, nombre, rol, telefono, activo) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [
      'mecanico@henrydiagnostics.com',
      mecanicoPasswordHash,
      'Técnico Henry',
      'mecanico',
      '+5215587654321',
      true
    ]);

    await query(`
      INSERT INTO users (email, password_hash, nombre, rol, telefono, activo) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [
      'ventas@henrydiagnostics.com',
      ventasPasswordHash,
      'Personal de Seguimiento',
      'seguimiento',
      '+5215598765432',
      true
    ]);

    // Insertar catálogo de servicios comunes en México
    const servicios = [
      ['Cambio de aceite y filtro', 'Cambio de aceite motor 5W-30 y filtro de aceite', 450.00, 30, 'mantenimiento', 5000, 3, true],
      ['Afinación menor', 'Cambio de bujías, filtros de aire y combustible', 850.00, 90, 'mantenimiento', 10000, 6, true],
      ['Afinación mayor', 'Afinación completa con cambio de cables, bobinas y limpieza de inyectores', 1500.00, 150, 'mantenimiento', 20000, 12, true],
      ['Balanceo y rotación', 'Balanceo de 4 llantas y rotación por desgaste', 300.00, 45, 'mantenimiento', 10000, 6, true],
      ['Cambio de frenos delanteros', 'Cambio de balatas delanteras y revisión de discos', 800.00, 60, 'reparacion', null, null, true],
      ['Cambio de frenos traseros', 'Cambio de balatas traseras y revisión de tambores', 600.00, 45, 'reparacion', null, null, true],
      ['Servicio de transmisión', 'Cambio de aceite ATF y filtro de transmisión', 900.00, 75, 'mantenimiento', 40000, 24, true],
      ['Revisión de suspensión', 'Diagnóstico completo de amortiguadores y resortes', 400.00, 60, 'diagnostico', null, null, true],
      ['Cambio de banda de distribución', 'Cambio de banda/cadena de distribución con tensores', 2500.00, 240, 'reparacion', 80000, null, true],
      ['Servicio de aire acondicionado', 'Carga de gas refrigerante y revisión del sistema', 650.00, 45, 'mantenimiento', null, 12, true]
    ];

    for (const servicio of servicios) {
      await query(`
        INSERT INTO service_catalog (nombre, descripcion, precio_base, duracion_estimada, categoria, kilometraje_sugerido, meses_sugeridos, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, servicio);
    }

    // Insertar marcas y modelos comunes en México para programación de mantenimiento
    const mantenimientos = [
      ['Nissan', 'Tsuru', 2000, 2017, 'Cambio de aceite', 5000, 3, 'Aceite 5W-30 para motor A15'],
      ['Nissan', 'Versa', 2012, null, 'Cambio de aceite', 7500, 4, 'Aceite 5W-30 sintético'],
      ['Volkswagen', 'Jetta', 2000, null, 'Cambio de aceite', 10000, 6, 'Aceite 5W-40 sintético'],
      ['Chevrolet', 'Aveo', 2006, null, 'Cambio de aceite', 7500, 4, 'Aceite 5W-30'],
      ['Ford', 'Focus', 2000, null, 'Cambio de aceite', 8000, 5, 'Aceite 5W-20'],
      ['Honda', 'Civic', 2000, null, 'Cambio de aceite', 7500, 4, 'Aceite 0W-20'],
      ['Toyota', 'Corolla', 2000, null, 'Cambio de aceite', 10000, 6, 'Aceite 0W-20 sintético'],
    ];

    for (const mantenimiento of mantenimientos) {
      await query(`
        INSERT INTO maintenance_schedules (marca, modelo, año_inicio, año_fin, servicio, kilometraje_intervalo, meses_intervalo, descripcion, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [...mantenimiento, true]);
    }

    // Insertar clientes de ejemplo
    const clientesEjemplo = [
      ['Juan Pérez García', '+5215512345678', '+5215512345678', 'juan.perez@email.com', 'Av. Insurgentes Sur 1234, Col. Del Valle', '03100', 'PEGJ801215ABC', 'Cliente frecuente'],
      ['María González López', '+5215587654321', '+5215587654321', 'maria.gonzalez@email.com', 'Calle Reforma 567, Col. Centro', '06000', null, 'Nueva cliente'],
      ['Carlos Rodríguez Méndez', '+5215598765432', '+5215598765432', null, 'Av. Universidad 890, Col. Copilco', '04360', null, 'Cliente empresarial']
    ];

    for (const cliente of clientesEjemplo) {
      await query(`
        INSERT INTO customers (nombre, telefono, whatsapp, email, direccion, codigo_postal, rfc, notas)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, cliente);
    }

    // Insertar vehículos de ejemplo
    const vehiculosEjemplo = [
      ['1N4BL11D85C123456', 'Nissan', 'Tsuru', 2008, 'ABC-123-A', 1, 180000, 'Azul', 'A15123456', 'gasolina', 'manual', 'Vehículo en buen estado'],
      ['3VWD17AJ9FM654321', 'Volkswagen', 'Jetta', 2015, 'DEF-456-B', 1, 95000, 'Blanco', 'TSI987654', 'gasolina', 'automatica', 'Mantenimiento al día'],
      ['KL1TD66E98B789012', 'Chevrolet', 'Aveo', 2018, 'GHI-789-C', 2, 45000, 'Rojo', 'ECHO456789', 'gasolina', 'manual', 'Vehículo nuevo'],
      ['1HGBH41JXMN345678', 'Honda', 'Civic', 2020, 'JKL-012-D', 3, 25000, 'Gris', 'VTEC123456', 'gasolina', 'automatica', 'Garantía vigente']
    ];

    for (const vehiculo of vehiculosEjemplo) {
      await query(`
        INSERT INTO vehicles (vin, marca, modelo, año, placa_actual, customer_id, kilometraje_actual, color, numero_motor, tipo_combustible, transmision, notas)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (vin) DO NOTHING
      `, vehiculo);
    }

    console.log('✅ Datos semilla insertados exitosamente');
    console.log('');
    console.log('👤 CREDENCIALES DE ACCESO:');
    console.log('');
    console.log('🔑 ADMINISTRADOR:');
    console.log('   Email: rik@rikmarquez.com');
    console.log('   Contraseña: HenryDiag2024$');
    console.log('');
    console.log('🔧 MECÁNICO:');
    console.log('   Email: mecanico@henrydiagnostics.com');
    console.log('   Contraseña: MecanicoHD2024!');
    console.log('');
    console.log('📞 SEGUIMIENTO/VENTAS:');
    console.log('   Email: ventas@henrydiagnostics.com');
    console.log('   Contraseña: VentasHD2024!');
    console.log('');
    console.log('📊 DATOS DE EJEMPLO:');
    console.log('   - 3 clientes de ejemplo');
    console.log('   - 4 vehículos registrados');
    console.log('   - 10 servicios en catálogo');
    console.log('   - Programación de mantenimiento por marca/modelo');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambiar contraseñas en el primer acceso');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error insertando datos semilla:', error);
    process.exit(1);
  }
}

seedDatabase();