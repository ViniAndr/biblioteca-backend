// Modelo para apontar o erro de forma adequada
class AppError extends Error {
  constructor(message, statusCode, errorCode = "UNKNOWN_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      code: this.errorCode,
    };
  }
}

export default AppError;
