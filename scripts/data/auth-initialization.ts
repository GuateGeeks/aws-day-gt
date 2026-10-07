export function authAlreadyInitialized(status: number, body: string) {
  return status === 409 || (status === 400 && body.includes("Identity Platform has already been enabled for this project"));
}
