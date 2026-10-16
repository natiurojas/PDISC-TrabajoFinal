import type { User } from '../db/usersRepo.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Lo rellena el middleware `authenticate` cuando hay un Bearer valido. */
      user?: User;
    }
  }
}

export {};