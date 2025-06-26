-- Crear tabla de registros de eventos
CREATE TABLE IF NOT EXISTS event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eventId INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  registrationCode VARCHAR(50) UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_phone (eventId, phone),
  INDEX idx_registration_code (registrationCode)
);

-- Agregar comentarios
ALTER TABLE event_registrations COMMENT = 'Tabla para almacenar registros de usuarios a eventos'; 