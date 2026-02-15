export class WebDavError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "WebDavError";
    this.status = status;
    this.statusText = statusText;
  }

  isCorsError(): boolean {
    return this.status === 0;
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  static fromResponse(response: Response): WebDavError {
    return new WebDavError(
      `WebDAV ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
    );
  }

  static fromCorsError(error: TypeError): WebDavError {
    return new WebDavError(
      `CORS error: ${error.message}`,
      0,
      "CORS blocked",
    );
  }
}
