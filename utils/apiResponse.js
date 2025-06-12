class ApiResponse extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.status = status;
    this.message = message;
    this.data = data;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default ApiResponse;