// Error kustom dengan status code HTTP — dipakai semua controller untuk
// melempar error yang akan diformat oleh errorHandler secara konsisten.
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
