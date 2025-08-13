"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAppointmentToService = exports.getAppointmentsByDateRange = exports.getTodayAppointments = void 0;
const connection_1 = __importDefault(require("../database/connection"));
// Obtener citas del día actual
const getTodayAppointments = async (req, res) => {
    try {
        console.log('📅 Obteniendo citas del día...');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const query = `
      SELECT 
        o.opportunity_id,
        o.cita_fecha,
        o.cita_hora,
        o.cita_nombre_contacto,
        o.cita_telefono_contacto,
        o.cita_descripcion_breve,
        o.converted_to_service_id,
        o.origen_cita,
        s.service_id as existing_service_id,
        s.estado as service_status
      FROM opportunities o
      LEFT JOIN services s ON o.converted_to_service_id = s.service_id
      WHERE o.tiene_cita = true 
        AND o.cita_fecha = $1
      ORDER BY o.cita_hora ASC
    `;
        const result = await connection_1.default.query(query, [today]);
        console.log(`✅ Encontradas ${result.rows.length} citas para el día ${today}`);
        res.json({
            success: true,
            appointments: result.rows,
            date: today
        });
    }
    catch (error) {
        console.error('❌ Error obteniendo citas del día:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.getTodayAppointments = getTodayAppointments;
// Obtener citas por rango de fechas
const getAppointmentsByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren las fechas start_date y end_date'
            });
        }
        console.log(`📅 Obteniendo citas del ${start_date} al ${end_date}...`);
        const query = `
      SELECT 
        o.opportunity_id,
        o.cita_fecha,
        o.cita_hora,
        o.cita_nombre_contacto,
        o.cita_telefono_contacto,
        o.cita_descripcion_breve,
        o.converted_to_service_id,
        o.origen_cita,
        s.service_id as existing_service_id,
        s.estado as service_status
      FROM opportunities o
      LEFT JOIN services s ON o.converted_to_service_id = s.service_id
      WHERE o.tiene_cita = true 
        AND o.cita_fecha BETWEEN $1 AND $2
      ORDER BY o.cita_fecha ASC, o.cita_hora ASC
    `;
        const result = await connection_1.default.query(query, [start_date, end_date]);
        console.log(`✅ Encontradas ${result.rows.length} citas en el rango`);
        res.json({
            success: true,
            appointments: result.rows,
            start_date,
            end_date
        });
    }
    catch (error) {
        console.error('❌ Error obteniendo citas por rango:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.getAppointmentsByDateRange = getAppointmentsByDateRange;
// Convertir cita a servicio
const convertAppointmentToService = async (req, res) => {
    const client = await connection_1.default.connect();
    try {
        await client.query('BEGIN');
        console.log('🎯 Iniciando conversión de cita a servicio...');
        const appointmentId = parseInt(req.params.id);
        const { tipo_servicio, descripcion, precio, mechanic_id, customer_id, vehicle_id, new_customer, new_vehicle } = req.body;
        // 1. Validar que la cita existe y es válida
        const appointmentQuery = `
      SELECT * FROM opportunities 
      WHERE opportunity_id = $1 AND tiene_cita = true
    `;
        const appointmentResult = await client.query(appointmentQuery, [appointmentId]);
        if (appointmentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada o no es una cita válida'
            });
        }
        const appointment = appointmentResult.rows[0];
        // 2. Verificar que no esté ya convertida
        if (appointment.converted_to_service_id) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'Esta cita ya fue convertida a servicio',
                existing_service_id: appointment.converted_to_service_id
            });
        }
        // 3. Determinar customer_id (crear cliente si es necesario)
        let final_customer_id = customer_id;
        if (new_customer) {
            console.log('👤 Creando nuevo cliente...');
            const createCustomerQuery = `
        INSERT INTO customers (nombre, telefono, email, direccion, branch_id)
        VALUES ($1, $2, $3, $4, 1)
        RETURNING customer_id
      `;
            const customerResult = await client.query(createCustomerQuery, [
                new_customer.nombre,
                new_customer.telefono || appointment.cita_telefono_contacto,
                new_customer.email || null,
                new_customer.direccion || null
            ]);
            final_customer_id = customerResult.rows[0].customer_id;
            console.log(`✅ Cliente creado con ID: ${final_customer_id}`);
        }
        // 4. Determinar vehicle_id (crear vehículo si es necesario)
        let final_vehicle_id = vehicle_id;
        if (new_vehicle) {
            console.log('🚗 Creando nuevo vehículo...');
            // Verificar que las placas no existan
            const plateCheckQuery = `
        SELECT vehicle_id FROM vehicles 
        WHERE placa_actual = $1 AND activo = true
      `;
            const plateCheck = await client.query(plateCheckQuery, [new_vehicle.placa_actual]);
            if (plateCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    success: false,
                    error: `Las placas ${new_vehicle.placa_actual} ya están registradas`
                });
            }
            const createVehicleQuery = `
        INSERT INTO vehicles (customer_id, marca, modelo, año, color, placa_actual, activo)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING vehicle_id
      `;
            const vehicleResult = await client.query(createVehicleQuery, [
                final_customer_id,
                new_vehicle.marca,
                new_vehicle.modelo,
                new_vehicle.año,
                new_vehicle.color,
                new_vehicle.placa_actual
            ]);
            final_vehicle_id = vehicleResult.rows[0].vehicle_id;
            console.log(`✅ Vehículo creado con ID: ${final_vehicle_id}`);
        }
        // 5. Crear el servicio
        console.log('🔧 Creando servicio...');
        const createServiceQuery = `
      INSERT INTO services (
        customer_id, 
        vehicle_id, 
        tipo_servicio, 
        descripcion, 
        precio, 
        fecha_servicio, 
        estado,
        mechanic_id,
        branch_id
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 'autorizado', $6, 1)
      RETURNING service_id
    `;
        const serviceResult = await client.query(createServiceQuery, [
            final_customer_id,
            final_vehicle_id,
            tipo_servicio,
            descripcion || `Servicio programado: ${appointment.cita_descripcion_breve}`,
            precio,
            mechanic_id || null
        ]);
        const service_id = serviceResult.rows[0].service_id;
        console.log(`✅ Servicio creado con ID: ${service_id}`);
        // 6. Actualizar la opportunity con la conversión
        console.log('📝 Actualizando opportunity...');
        const updateOpportunityQuery = `
      UPDATE opportunities 
      SET 
        customer_id = $1,
        vehicle_id = $2,
        converted_to_service_id = $3,
        tiene_cita = false
      WHERE opportunity_id = $4
    `;
        await client.query(updateOpportunityQuery, [
            final_customer_id,
            final_vehicle_id,
            service_id,
            appointmentId
        ]);
        await client.query('COMMIT');
        console.log('🎉 Conversión completada exitosamente');
        // 7. Obtener el servicio completo para respuesta
        const getServiceQuery = `
      SELECT 
        s.*,
        c.nombre as customer_name,
        v.marca, v.modelo, v.año, v.color, v.placa_actual,
        COALESCE(
          CONCAT(m.nombre, ' ', m.apellidos),
          u.nombre
        ) as mecanico_nombre
      FROM services s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      LEFT JOIN mechanics m ON s.mechanic_id = m.mechanic_id
      LEFT JOIN users u ON s.usuario_mecanico = u.user_id
      WHERE s.service_id = $1
    `;
        const serviceDetails = await client.query(getServiceQuery, [service_id]);
        res.json({
            success: true,
            message: 'Cita convertida exitosamente a servicio',
            service: serviceDetails.rows[0],
            appointment_id: appointmentId,
            created_customer_id: new_customer ? final_customer_id : null,
            created_vehicle_id: new_vehicle ? final_vehicle_id : null
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en conversión de cita:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
    finally {
        client.release();
    }
};
exports.convertAppointmentToService = convertAppointmentToService;
//# sourceMappingURL=appointments.js.map