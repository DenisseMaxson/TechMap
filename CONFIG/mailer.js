// config/mailer.js
const nodemailer = require('nodemailer');

// Configuración del transportador leyendo de manera segura desde el .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Cambiado para usar el .env
    pass: process.env.EMAIL_PASS  // Cambiado para usar el .env
  }
});

// Verificación comentada temporalmente para que no trabe el inicio
/*
transporter.verify().then(() => {
  console.log('Servidor de correos listo para enviar notificaciones');
}).catch((error) => {
  console.error('Error en la configuración del correo:', error);
});
*/

/**
 * Función genérica para enviar correos de notificación
 */
const enviarCorreoBajaPendiente = async (correoJefe, datosBaja) => {
  const mailOptions = {
    // Usamos el correo del .env también para el remitente
    from: `"TechMap Notificaciones" <${process.env.EMAIL_USER}>`,
    to: correoJefe,
    subject: `⚠️ Baja Pendiente de Gestionar: Equipo #${datosBaja.id_equipo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #184f89; border-bottom: 2px solid #3793d0; padding-bottom: 10px;">
          Nueva Solicitud de Baja Pendiente
        </h2>
        <p>Estimado Jefe de Área,</p>
        <p>Se ha registrado una nueva solicitud de baja en el sistema <strong>TechMap</strong> que requiere su revisión y aprobación.</p>
        
        <div style="background-color: #f4f7f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #237fb9;">
          <h3 style="margin-top: 0; color: #111649;">Detalles del Equipo</h3>
          <p><strong>ID Equipo:</strong> ${datosBaja.id_equipo}</p>
          <p><strong>Nombre/Modelo:</strong> ${datosBaja.nombre_equipo}</p>
          <p><strong>Motivo de la Baja:</strong> ${datosBaja.motivo}</p>
          <p><strong>Solicitado por:</strong> ${datosBaja.solicitante}</p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="http://localhost:5500/HTML/empresa/opciones-ti-contabilidad.html" 
             style="background-color: #237fb9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Ir al Panel de Gestión
          </a>
        </p>
        <br>
        <hr style="border: 0; border-top: 1px solid #ccc;">
        <p style="font-size: 11px; color: #777;">Este es un correo automático, por favor no respondas a este mensaje.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { enviarCorreoBajaPendiente };