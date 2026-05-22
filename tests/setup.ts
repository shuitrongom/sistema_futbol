/**
 * Setup de tests - No requiere base de datos real.
 * Los tests de propiedades validan lógica pura de las funciones de servicio
 * usando datos generados por fast-check sin necesidad de Prisma/DB.
 */

// Silenciar logs durante tests
process.env.NODE_ENV = 'test';
