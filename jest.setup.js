// Configuración global de Jest
process.env.NODE_ENV = 'test';

// Mocks globales
jest.setTimeout(30000); // Aumentar el tiempo de espera para las pruebas

// Configuración global para limpiar después de las pruebas
afterAll(async () => {
  // Limpiar cualquier temporizador pendiente
  const timers = require('timers');
  jest.clearAllTimers();
  
  // Cerrar cualquier conexión a bases de datos si existe
  if (global.dbConnection && typeof global.dbConnection.close === 'function') {
    await global.dbConnection.close();
  }
  
  // Forzar el cierre de cualquier conexión pendiente
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
});

// Mock de console.log para evitar ruido en las pruebas
// console.log = jest.fn();
// console.error = jest.fn();
// console.warn = jest.fn();
