/** Error con un código estable que el cliente puede interpretar */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

export const notFound = (message: string) => new AppError(404, 'not-found', message)
